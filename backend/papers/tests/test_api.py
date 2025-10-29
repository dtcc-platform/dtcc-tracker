"""
Tests for API endpoints
"""
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from papers.models import Paper, Project
import json


class AuthenticationTest(TestCase):
    """Test authentication endpoints"""

    def setUp(self):
        """Set up test client and user"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com'
        )

    def test_login_success(self):
        """Test successful login"""
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user', response.json())
        self.assertEqual(response.json()['user']['username'], 'testuser')
        # Check cookies are set
        self.assertIn('access_token', response.cookies)
        self.assertIn('refresh_token', response.cookies)

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'wrongpassword'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.json())

    def test_logout(self):
        """Test logout endpoint"""
        # First login
        self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        }, format='json')

        # Then logout
        response = self.client.post('/api/auth/logout/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_rate_limiting_on_login(self):
        """Test rate limiting on login endpoint"""
        # Make multiple login attempts
        for i in range(6):
            response = self.client.post('/api/auth/login/', {
                'username': 'testuser',
                'password': 'testpass123'
            }, format='json')

            if i < 5:
                # First 5 attempts should succeed
                self.assertIn(response.status_code,
                            [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])
            else:
                # 6th attempt should be rate limited
                self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)


class PaperAPITest(TestCase):
    """Test Paper API endpoints"""

    def setUp(self):
        """Set up test client and authentication"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

    def test_create_paper(self):
        """Test creating a paper via API"""
        data = {
            'doi': '10.1234/test.paper',
            'title': 'Test Paper',
            'author_name': 'Test Author',
            'journal': 'Test Journal',
            'date': '2024-01-01',
            'publication_type': 'Article in journal',
            'milestone_project': 'Digital twin platform',
            'additional_authors': ['Co-author 1', 'Co-author 2']
        }

        response = self.client.post('/api/papers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Paper.objects.count(), 1)

        paper = Paper.objects.first()
        self.assertEqual(paper.doi, '10.1234/test.paper')
        self.assertEqual(paper.title, 'Test Paper')

    def test_create_paper_invalid_doi(self):
        """Test creating paper with invalid DOI"""
        data = {
            'doi': 'invalid-doi',  # Invalid format
            'title': 'Test Paper',
            'author_name': 'Test Author',
            'journal': 'Test Journal',
            'date': '2024-01-01'
        }

        response = self.client.post('/api/papers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_papers(self):
        """Test listing papers"""
        # Create test papers
        Paper.objects.create(
            doi='10.1234/paper1',
            title='Paper 1',
            author_name='Author 1',
            journal='Journal 1',
            date='2024-01-01',
            user=self.user
        )
        Paper.objects.create(
            doi='10.1234/paper2',
            title='Paper 2',
            author_name='Author 2',
            journal='Journal 2',
            date='2024-01-02',
            user=self.user
        )

        response = self.client.get('/api/papers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()['results']), 2)

    def test_update_paper(self):
        """Test updating a paper"""
        paper = Paper.objects.create(
            doi='10.1234/update',
            title='Original Title',
            author_name='Author',
            journal='Journal',
            date='2024-01-01',
            user=self.user
        )

        data = {'title': 'Updated Title'}
        response = self.client.put(f'/api/papers/update/{paper.id}/',
                                  data, format='json')

        paper.refresh_from_db()
        self.assertEqual(paper.title, 'Updated Title')

    def test_delete_paper(self):
        """Test deleting a paper"""
        paper = Paper.objects.create(
            doi='10.1234/delete',
            title='To Delete',
            author_name='Author',
            journal='Journal',
            date='2024-01-01',
            user=self.user
        )

        response = self.client.delete(f'/api/papers/delete/{paper.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Paper.objects.count(), 0)

    def test_unauthorized_access(self):
        """Test accessing API without authentication"""
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/papers/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ProjectAPITest(TestCase):
    """Test Project API endpoints"""

    def setUp(self):
        """Set up test client and authentication"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

    def test_create_project(self):
        """Test creating a project"""
        data = {
            'project_name': 'Test Project',
            'status': 'Draft',
            'pi': 'Principal Investigator',
            'funding_body': 'EU',
            'amount': '100000'
        }

        response = self.client.post('/api/projects/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Project.objects.count(), 1)

    def test_create_project_invalid_status(self):
        """Test creating project with invalid status"""
        data = {
            'project_name': 'Test Project',
            'status': 'Invalid Status',  # Should be Draft/Submitted/Approved
            'pi': 'Principal Investigator'
        }

        response = self.client.post('/api/projects/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_projects(self):
        """Test listing projects"""
        Project.objects.create(
            project_name='Project 1',
            status='Draft',
            user=self.user
        )
        Project.objects.create(
            project_name='Project 2',
            status='Approved',
            user=self.user
        )

        response = self.client.get('/api/projects/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 2)


class SuperuserAPITest(TestCase):
    """Test superuser-only endpoints"""

    def setUp(self):
        """Set up test client and users"""
        self.client = APIClient()
        self.superuser = User.objects.create_superuser(
            username='admin',
            password='admin123'
        )
        self.regular_user = User.objects.create_user(
            username='regular',
            password='regular123'
        )

    def test_superuser_access_stats(self):
        """Test superuser can access stats endpoint"""
        self.client.force_authenticate(user=self.superuser)
        response = self.client.get('/api/superuser/papers/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_regular_user_denied_stats(self):
        """Test regular user cannot access stats"""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get('/api/superuser/papers/stats/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_superuser_bulk_update(self):
        """Test superuser bulk update"""
        self.client.force_authenticate(user=self.superuser)

        # Create test papers
        Paper.objects.create(
            doi='10.1234/bulk1',
            title='Paper 1',
            author_name='Author 1',
            journal='Journal',
            date='2024-01-01',
            user=self.superuser,
            is_master_copy=True
        )
        Paper.objects.create(
            doi='10.1234/bulk2',
            title='Paper 2',
            author_name='Author 2',
            journal='Journal',
            date='2024-01-01',
            user=self.superuser,
            is_master_copy=True
        )

        data = {
            'dois': ['10.1234/bulk1', '10.1234/bulk2'],
            'submission_year': 2024
        }

        response = self.client.post('/api/superuser/papers/bulk-update/',
                                  data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check papers were updated
        papers = Paper.objects.filter(is_master_copy=True)
        for paper in papers:
            self.assertEqual(paper.submission_year, 2024)