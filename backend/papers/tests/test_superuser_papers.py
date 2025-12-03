"""
Tests for superuser paper visibility and management.

The bug: Master copies are created with user=first_superuser, but if a different
superuser logs in, they can't see any papers because the views filter by user=request.user.
"""
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from papers.models import Paper


class SuperuserPaperVisibilityTest(TestCase):
    """Test that ANY superuser can see ALL master copy papers, not just their own"""

    def setUp(self):
        """Set up test users and papers"""
        self.client = APIClient()

        # Create regular users
        self.user1 = User.objects.create_user(
            username='user1',
            password='pass1'
        )
        self.user2 = User.objects.create_user(
            username='user2',
            password='pass2'
        )

        # Create TWO superusers to test cross-user visibility
        # superuser1 will "own" the master copies (simulating first superuser in DB)
        self.superuser1 = User.objects.create_superuser(
            username='admin1',
            password='adminpass1',
            email='admin1@example.com'
        )
        # superuser2 is a different admin who should ALSO see all papers
        self.superuser2 = User.objects.create_superuser(
            username='admin2',
            password='adminpass2',
            email='admin2@example.com'
        )

        # Create master copy papers owned by superuser1
        # (simulating what happens when regular users submit papers)
        self.paper1 = Paper.objects.create(
            doi='10.1234/paper1',
            title='Paper from User 1',
            author_name='Author One',
            journal='Journal One',
            date='2024-01-01',
            user=self.superuser1,  # Owned by superuser1
            is_master_copy=True
        )

        self.paper2 = Paper.objects.create(
            doi='10.1234/paper2',
            title='Paper from User 2',
            author_name='Author Two',
            journal='Journal Two',
            date='2024-02-01',
            user=self.superuser1,  # Also owned by superuser1
            is_master_copy=True
        )

    def test_superuser_can_list_all_master_copies(self):
        """Test that superuser2 can see papers owned by superuser1"""
        # Log in as superuser2 (NOT the owner of the papers)
        self.client.force_authenticate(user=self.superuser2)
        response = self.client.get('/api/superuser/papers/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # superuser2 should see both papers even though they're owned by superuser1
        self.assertEqual(data['count'], 2)
        dois = [p['doi'] for p in data['results']]
        self.assertIn('10.1234/paper1', dois)
        self.assertIn('10.1234/paper2', dois)

    def test_superuser_can_update_any_master_copy(self):
        """Test that superuser2 can update papers owned by superuser1"""
        # Log in as superuser2 (NOT the owner of the papers)
        self.client.force_authenticate(user=self.superuser2)

        response = self.client.put(
            f'/api/superuser/papers/{self.paper1.id}/',
            {'submission_year': 2024},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.paper1.refresh_from_db()
        self.assertEqual(self.paper1.submission_year, 2024)

    def test_superuser_can_bulk_update_master_copies(self):
        """Test that superuser2 can bulk update papers owned by superuser1"""
        # Log in as superuser2 (NOT the owner of the papers)
        self.client.force_authenticate(user=self.superuser2)

        response = self.client.post(
            '/api/superuser/papers/bulk-update/',
            {
                'paper_ids': [self.paper1.id, self.paper2.id],
                'submission_year': 2024
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.paper1.refresh_from_db()
        self.paper2.refresh_from_db()
        self.assertEqual(self.paper1.submission_year, 2024)
        self.assertEqual(self.paper2.submission_year, 2024)

    def test_superuser_stats_include_all_master_copies(self):
        """Test that superuser2 sees stats for papers owned by superuser1"""
        # Set submission year on one paper
        self.paper1.submission_year = 2024
        self.paper1.save()

        # Log in as superuser2 (NOT the owner of the papers)
        self.client.force_authenticate(user=self.superuser2)
        response = self.client.get('/api/superuser/papers/stats/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # superuser2 should see stats for all master copies, not just their own
        self.assertEqual(data['total_papers'], 2)
        self.assertEqual(data['submitted_papers'], 1)
        self.assertEqual(data['not_submitted_papers'], 1)

    def test_regular_user_cannot_access_superuser_endpoints(self):
        """Test that regular users cannot access superuser paper endpoints"""
        self.client.force_authenticate(user=self.user1)

        response = self.client.get('/api/superuser/papers/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        response = self.client.put(
            f'/api/superuser/papers/{self.paper1.id}/',
            {'submission_year': 2024},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        response = self.client.post(
            '/api/superuser/papers/bulk-update/',
            {'paper_ids': [self.paper1.id], 'submission_year': 2024},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        response = self.client.get('/api/superuser/papers/stats/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
