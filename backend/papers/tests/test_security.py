"""
Security-focused tests
"""
from django.test import TestCase, Client
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from papers.models import Paper, Project
import json


class SecurityHeadersTest(TestCase):
    """Test security headers are present"""

    def setUp(self):
        """Set up test client"""
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )

    def test_security_headers_present(self):
        """Test that security headers are included in responses"""
        # Make a request to any endpoint
        response = self.client.get('/api/papers/')

        # Check security headers
        self.assertIn('X-Frame-Options', response)
        self.assertEqual(response['X-Frame-Options'], 'DENY')

        self.assertIn('X-Content-Type-Options', response)
        self.assertEqual(response['X-Content-Type-Options'], 'nosniff')

        self.assertIn('X-XSS-Protection', response)
        self.assertEqual(response['X-XSS-Protection'], '1; mode=block')

        self.assertIn('Referrer-Policy', response)
        self.assertIn('Permissions-Policy', response)

        # CSP and HSTS are only in production
        # self.assertIn('Content-Security-Policy', response)
        # self.assertIn('Strict-Transport-Security', response)

    def test_server_headers_removed(self):
        """Test that server information headers are removed"""
        response = self.client.get('/api/papers/')

        # These headers should not be present
        self.assertNotIn('Server', response)
        self.assertNotIn('X-Powered-By', response)


class InputValidationTest(TestCase):
    """Test input validation and sanitization"""

    def setUp(self):
        """Set up test client and user"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

    def test_xss_prevention_in_title(self):
        """Test XSS attack prevention in paper title"""
        data = {
            'doi': '10.1234/xss.test',
            'title': '<script>alert("XSS")</script>',
            'author_name': 'Test Author',
            'journal': 'Test Journal',
            'date': '2024-01-01',
            'publication_type': 'Article in journal'
        }

        response = self.client.post('/api/papers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('invalid HTML/script content', str(response.content))

    def test_sql_injection_prevention(self):
        """Test SQL injection prevention"""
        data = {
            'doi': "10.1234/test'; DROP TABLE papers; --",
            'title': 'Test Title',
            'author_name': 'Test Author',
            'journal': 'Test Journal',
            'date': '2024-01-01'
        }

        response = self.client.post('/api/papers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Check that table still exists
        self.assertEqual(Paper.objects.count(), 0)  # No papers created

    def test_invalid_doi_format(self):
        """Test DOI format validation"""
        invalid_dois = [
            'not-a-doi',
            '20.1234/test',  # Wrong prefix
            '10.1234',  # Missing suffix
            '../../../etc/passwd',  # Path traversal attempt
            'javascript:alert("XSS")',  # JavaScript URL
        ]

        for doi in invalid_dois:
            data = {
                'doi': doi,
                'title': 'Test Title',
                'author_name': 'Test Author',
                'journal': 'Test Journal',
                'date': '2024-01-01'
            }

            response = self.client.post('/api/papers/', data, format='json')
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST,
                           f"DOI {doi} should have been rejected")

    def test_max_length_validation(self):
        """Test maximum length validation"""
        # Create a title longer than allowed (500 chars)
        long_title = 'A' * 501

        data = {
            'doi': '10.1234/length.test',
            'title': long_title,
            'author_name': 'Test Author',
            'journal': 'Test Journal',
            'date': '2024-01-01'
        }

        response = self.client.post('/api/papers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('too long', str(response.content).lower())

    def test_choice_field_validation(self):
        """Test choice field validation for publication type"""
        data = {
            'doi': '10.1234/choice.test',
            'title': 'Test Title',
            'author_name': 'Test Author',
            'journal': 'Test Journal',
            'date': '2024-01-01',
            'publication_type': 'Invalid Type'  # Not in choices
        }

        response = self.client.post('/api/papers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_project_status_validation(self):
        """Test project status validation"""
        data = {
            'project_name': 'Test Project',
            'status': 'InvalidStatus'  # Should be Draft/Submitted/Approved
        }

        response = self.client.post('/api/projects/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class CookieSecurityTest(TestCase):
    """Test cookie-based authentication security"""

    def setUp(self):
        """Set up test client"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )

    def test_cookies_are_httponly(self):
        """Test that authentication cookies are httpOnly"""
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check cookie attributes
        access_cookie = response.cookies.get('access_token')
        refresh_cookie = response.cookies.get('refresh_token')

        self.assertIsNotNone(access_cookie)
        self.assertIsNotNone(refresh_cookie)

        # Check httpOnly flag
        self.assertTrue(access_cookie.get('httponly'))
        self.assertTrue(refresh_cookie.get('httponly'))

        # Check SameSite attribute
        self.assertEqual(access_cookie.get('samesite'), 'Lax')
        self.assertEqual(refresh_cookie.get('samesite'), 'Lax')

    def test_no_tokens_in_response_body(self):
        """Test that tokens are not included in response body"""
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        }, format='json')

        data = response.json()
        # Tokens should NOT be in response body
        self.assertNotIn('access_token', data)
        self.assertNotIn('refresh_token', data)
        self.assertNotIn('token', data)

        # Only user info should be present
        self.assertIn('user', data)

    def test_logout_clears_cookies(self):
        """Test that logout properly clears cookies"""
        # First login
        self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        }, format='json')

        # Then logout
        response = self.client.post('/api/auth/logout/')

        # Check cookies are cleared
        self.assertIn('access_token', response.cookies)
        self.assertIn('refresh_token', response.cookies)
        self.assertEqual(response.cookies['access_token'].value, '')
        self.assertEqual(response.cookies['refresh_token'].value, '')


class RateLimitingTest(TestCase):
    """Test rate limiting on all endpoints"""

    def setUp(self):
        """Set up test client and user"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

    def test_rate_limiting_on_papers_endpoint(self):
        """Test rate limiting on paper listing"""
        # Make many requests quickly
        responses = []
        for _ in range(150):  # Exceed the 100/min limit
            response = self.client.get('/api/papers/')
            responses.append(response.status_code)

        # Some should be rate limited
        self.assertIn(status.HTTP_429_TOO_MANY_REQUESTS, responses)

    def test_rate_limiting_on_create(self):
        """Test rate limiting on paper creation"""
        responses = []
        for i in range(35):  # Exceed the 30/min create limit
            data = {
                'doi': f'10.1234/test{i}',
                'title': f'Test Paper {i}',
                'author_name': 'Test Author',
                'journal': 'Test Journal',
                'date': '2024-01-01'
            }
            response = self.client.post('/api/papers/', data, format='json')
            responses.append(response.status_code)

        # Some should be rate limited
        self.assertIn(status.HTTP_429_TOO_MANY_REQUESTS, responses)


class PermissionTest(TestCase):
    """Test permission controls"""

    def setUp(self):
        """Set up test users"""
        self.client = APIClient()
        self.user1 = User.objects.create_user(
            username='user1',
            password='pass1'
        )
        self.user2 = User.objects.create_user(
            username='user2',
            password='pass2'
        )

    def test_user_cannot_delete_others_papers(self):
        """Test that users cannot delete other users' papers"""
        # Create paper as user1
        self.client.force_authenticate(user=self.user1)
        paper = Paper.objects.create(
            doi='10.1234/permission',
            title='User1 Paper',
            author_name='Author',
            journal='Journal',
            date='2024-01-01',
            user=self.user1
        )

        # Try to delete as user2
        self.client.force_authenticate(user=self.user2)
        response = self.client.delete(f'/api/papers/delete/{paper.id}/')

        # Should be forbidden
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Paper.objects.count(), 1)  # Paper still exists

    def test_user_cannot_update_others_papers(self):
        """Test that users cannot update other users' papers"""
        # Create paper as user1
        paper = Paper.objects.create(
            doi='10.1234/update.permission',
            title='Original Title',
            author_name='Author',
            journal='Journal',
            date='2024-01-01',
            user=self.user1
        )

        # Try to update as user2
        self.client.force_authenticate(user=self.user2)
        response = self.client.put(f'/api/papers/update/{paper.id}/',
                                  {'title': 'Hacked Title'}, format='json')

        # Should be forbidden
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        paper.refresh_from_db()
        self.assertEqual(paper.title, 'Original Title')  # Unchanged