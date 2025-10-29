"""
Tests for Paper and Project models
"""
from django.test import TestCase
from django.contrib.auth.models import User
from django.db import IntegrityError
from papers.models import Paper, Project, ChatMessage


class PaperModelTest(TestCase):
    """Test Paper model"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com'
        )
        self.superuser = User.objects.create_superuser(
            username='admin',
            password='admin123',
            email='admin@example.com'
        )

    def test_paper_creation(self):
        """Test creating a paper"""
        paper = Paper.objects.create(
            doi='10.1234/test.doi',
            title='Test Paper Title',
            author_name='John Doe',
            journal='Test Journal',
            date='2024-01-01',
            publication_type='Article in journal',
            milestone_project='Digital twin platform',
            user=self.user
        )

        self.assertEqual(paper.doi, '10.1234/test.doi')
        self.assertEqual(paper.title, 'Test Paper Title')
        self.assertEqual(paper.user, self.user)
        self.assertFalse(paper.is_master_copy)

    def test_paper_unique_doi_per_user(self):
        """Test that DOI must be unique per user"""
        Paper.objects.create(
            doi='10.1234/duplicate',
            title='First Paper',
            author_name='Author 1',
            journal='Journal 1',
            date='2024-01-01',
            user=self.user
        )

        # Should raise IntegrityError for same user
        with self.assertRaises(IntegrityError):
            Paper.objects.create(
                doi='10.1234/duplicate',
                title='Second Paper',
                author_name='Author 2',
                journal='Journal 2',
                date='2024-01-02',
                user=self.user
            )

    def test_paper_same_doi_different_users(self):
        """Test that same DOI can exist for different users"""
        paper1 = Paper.objects.create(
            doi='10.1234/shared',
            title='Paper 1',
            author_name='Author 1',
            journal='Journal 1',
            date='2024-01-01',
            user=self.user
        )

        paper2 = Paper.objects.create(
            doi='10.1234/shared',
            title='Paper 2',
            author_name='Author 2',
            journal='Journal 2',
            date='2024-01-02',
            user=self.superuser,
            is_master_copy=True
        )

        self.assertEqual(paper1.doi, paper2.doi)
        self.assertNotEqual(paper1.user, paper2.user)
        self.assertTrue(paper2.is_master_copy)

    def test_paper_additional_authors(self):
        """Test additional authors as JSON field"""
        authors = ['Jane Smith', 'Bob Johnson']
        paper = Paper.objects.create(
            doi='10.1234/authors',
            title='Multi-author Paper',
            author_name='Lead Author',
            journal='Test Journal',
            date='2024-01-01',
            additional_authors=authors,
            user=self.user
        )

        self.assertEqual(paper.additional_authors, authors)
        self.assertEqual(len(paper.additional_authors), 2)

    def test_paper_submission_year(self):
        """Test submission year field"""
        paper = Paper.objects.create(
            doi='10.1234/submission',
            title='Submitted Paper',
            author_name='Author',
            journal='Journal',
            date='2024-01-01',
            submission_year=2024,
            user=self.user
        )

        self.assertEqual(paper.submission_year, 2024)


class ProjectModelTest(TestCase):
    """Test Project model"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )

    def test_project_creation(self):
        """Test creating a project"""
        project = Project.objects.create(
            project_name='Test Project',
            status='Draft',
            pi='Principal Investigator',
            funding_body='EU',
            amount='100000',
            user=self.user
        )

        self.assertEqual(project.project_name, 'Test Project')
        self.assertEqual(project.status, 'Draft')
        self.assertEqual(project.funding_body, 'EU')
        self.assertEqual(project.user, self.user)

    def test_project_unique_name_per_user(self):
        """Test that project name must be unique per user"""
        Project.objects.create(
            project_name='Duplicate Project',
            status='Draft',
            user=self.user
        )

        with self.assertRaises(IntegrityError):
            Project.objects.create(
                project_name='Duplicate Project',
                status='Approved',
                user=self.user
            )

    def test_project_additional_authors(self):
        """Test additional authors as JSON field"""
        authors = ['Collaborator 1', 'Collaborator 2']
        project = Project.objects.create(
            project_name='Collaborative Project',
            status='Submitted',
            additional_authors=authors,
            user=self.user
        )

        self.assertEqual(project.additional_authors, authors)
        self.assertEqual(len(project.additional_authors), 2)


class ChatMessageModelTest(TestCase):
    """Test ChatMessage model"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )

    def test_chat_message_creation(self):
        """Test creating a chat message"""
        message = ChatMessage.objects.create(
            user=self.user,
            role='user',
            content='Hello, how can I register a paper?'
        )

        self.assertEqual(message.user, self.user)
        self.assertEqual(message.role, 'user')
        self.assertIn('register a paper', message.content)
        self.assertIsNotNone(message.created_at)

    def test_chat_message_roles(self):
        """Test different chat roles"""
        user_msg = ChatMessage.objects.create(
            user=self.user,
            role='user',
            content='User message'
        )

        assistant_msg = ChatMessage.objects.create(
            user=self.user,
            role='assistant',
            content='Assistant response'
        )

        self.assertEqual(user_msg.role, 'user')
        self.assertEqual(assistant_msg.role, 'assistant')

    def test_chat_message_ordering(self):
        """Test chat messages are ordered by creation time"""
        msg1 = ChatMessage.objects.create(
            user=self.user,
            role='user',
            content='First message'
        )

        msg2 = ChatMessage.objects.create(
            user=self.user,
            role='assistant',
            content='Response'
        )

        msg3 = ChatMessage.objects.create(
            user=self.user,
            role='user',
            content='Follow-up'
        )

        messages = ChatMessage.objects.filter(user=self.user).order_by('created_at')
        self.assertEqual(list(messages), [msg1, msg2, msg3])