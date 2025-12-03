# Fix Admin Paper Visibility Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow admin (superuser) users to see and manage papers from all users, not just their own.

**Architecture:** The superuser endpoints currently filter papers with `user=request.user`, restricting admins to only see papers they personally own. The fix changes these filters to show all master copies (`is_master_copy=True`) without user restriction, matching the existing pattern used for Projects.

**Tech Stack:** Django 5.1, Django REST Framework, pytest

---

## Task 1: Add Tests for Superuser Paper Visibility

**Files:**
- Create: `backend/papers/tests/test_superuser_papers.py`

**Step 1: Create test file with superuser visibility tests**

```python
"""
Tests for superuser paper visibility and management
"""
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from papers.models import Paper


class SuperuserPaperVisibilityTest(TestCase):
    """Test that superusers can see papers from all users"""

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

        # Create superuser
        self.superuser = User.objects.create_superuser(
            username='admin',
            password='adminpass',
            email='admin@example.com'
        )

        # Create master copy papers (simulating what happens when users submit)
        self.paper1 = Paper.objects.create(
            doi='10.1234/paper1',
            title='Paper from User 1',
            author_name='Author One',
            journal='Journal One',
            date='2024-01-01',
            user=self.superuser,
            is_master_copy=True
        )

        self.paper2 = Paper.objects.create(
            doi='10.1234/paper2',
            title='Paper from User 2',
            author_name='Author Two',
            journal='Journal Two',
            date='2024-02-01',
            user=self.superuser,
            is_master_copy=True
        )

    def test_superuser_can_list_all_master_copies(self):
        """Test that superuser can see all master copy papers"""
        self.client.force_authenticate(user=self.superuser)
        response = self.client.get('/api/superuser/papers/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should see both papers
        self.assertEqual(data['count'], 2)
        dois = [p['doi'] for p in data['results']]
        self.assertIn('10.1234/paper1', dois)
        self.assertIn('10.1234/paper2', dois)

    def test_superuser_can_update_any_master_copy(self):
        """Test that superuser can update any master copy paper"""
        self.client.force_authenticate(user=self.superuser)

        response = self.client.put(
            f'/api/superuser/papers/{self.paper1.id}/',
            {'submission_year': 2024},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.paper1.refresh_from_db()
        self.assertEqual(self.paper1.submission_year, 2024)

    def test_superuser_can_bulk_update_master_copies(self):
        """Test that superuser can bulk update master copy papers"""
        self.client.force_authenticate(user=self.superuser)

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
        """Test that superuser stats include all master copy papers"""
        # Set submission year on one paper
        self.paper1.submission_year = 2024
        self.paper1.save()

        self.client.force_authenticate(user=self.superuser)
        response = self.client.get('/api/superuser/papers/stats/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

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
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/vasnas/scratch/dtcc-tracker/backend && python manage.py test papers.tests.test_superuser_papers -v 2`

Expected: Tests fail because current implementation filters by `user=request.user`

**Step 3: Commit failing tests**

```bash
git add backend/papers/tests/test_superuser_papers.py
git commit -m "test: add failing tests for superuser paper visibility bug"
```

---

## Task 2: Fix SuperuserPaperListView

**Files:**
- Modify: `backend/papers/views.py:636-637`

**Step 1: Update the queryset filter**

Change line 637 from:
```python
        # Get only master copies belonging to this superuser
        papers = Paper.objects.filter(user=request.user).select_related('user')
```

To:
```python
        # Get all master copies (superusers can see papers from all users)
        papers = Paper.objects.filter(is_master_copy=True).select_related('user')
```

**Step 2: Update the docstring**

Change line 624-626 from:
```python
class SuperuserPaperListView(RateLimitMixin, APIView):
    """
    Superuser sees only their master copies (deduplicated view)
    """
```

To:
```python
class SuperuserPaperListView(RateLimitMixin, APIView):
    """
    Superuser sees all master copies from all users (deduplicated view)
    """
```

**Step 3: Run the list test to verify it passes**

Run: `cd /Users/vasnas/scratch/dtcc-tracker/backend && python manage.py test papers.tests.test_superuser_papers.SuperuserPaperVisibilityTest.test_superuser_can_list_all_master_copies -v 2`

Expected: PASS

**Step 4: Commit**

```bash
git add backend/papers/views.py
git commit -m "fix: SuperuserPaperListView now shows all master copies"
```

---

## Task 3: Fix SuperuserPaperUpdateView

**Files:**
- Modify: `backend/papers/views.py:566`

**Step 1: Update the get_object_or_404 filter**

Change line 566 from:
```python
        # Get the master copy
        paper = get_object_or_404(Paper, pk=pk, user=request.user, is_master_copy=True)
```

To:
```python
        # Get any master copy (superusers can update any master copy)
        paper = get_object_or_404(Paper, pk=pk, is_master_copy=True)
```

**Step 2: Run the update test to verify it passes**

Run: `cd /Users/vasnas/scratch/dtcc-tracker/backend && python manage.py test papers.tests.test_superuser_papers.SuperuserPaperVisibilityTest.test_superuser_can_update_any_master_copy -v 2`

Expected: PASS

**Step 3: Commit**

```bash
git add backend/papers/views.py
git commit -m "fix: SuperuserPaperUpdateView can update any master copy"
```

---

## Task 4: Fix SuperuserBulkUpdateView

**Files:**
- Modify: `backend/papers/views.py:597-602`

**Step 1: Update the queryset filter**

Change lines 597-602 from:
```python
        # Get master copies belonging to this superuser
        papers = Paper.objects.filter(
            id__in=paper_ids,
            user=request.user,
            is_master_copy=True
        ).select_related('user')
```

To:
```python
        # Get all master copies (superusers can update any master copy)
        papers = Paper.objects.filter(
            id__in=paper_ids,
            is_master_copy=True
        ).select_related('user')
```

**Step 2: Run the bulk update test to verify it passes**

Run: `cd /Users/vasnas/scratch/dtcc-tracker/backend && python manage.py test papers.tests.test_superuser_papers.SuperuserPaperVisibilityTest.test_superuser_can_bulk_update_master_copies -v 2`

Expected: PASS

**Step 3: Commit**

```bash
git add backend/papers/views.py
git commit -m "fix: SuperuserBulkUpdateView can bulk update any master copies"
```

---

## Task 5: Fix SuperuserSubmissionStatsView

**Files:**
- Modify: `backend/papers/views.py:670`

**Step 1: Update the queryset filter**

Change line 670 from:
```python
        # Only look at master copies
        master_papers = Paper.objects.filter(user=request.user, is_master_copy=True).select_related('user')
```

To:
```python
        # Look at all master copies (superusers see stats for all users)
        master_papers = Paper.objects.filter(is_master_copy=True).select_related('user')
```

**Step 2: Run the stats test to verify it passes**

Run: `cd /Users/vasnas/scratch/dtcc-tracker/backend && python manage.py test papers.tests.test_superuser_papers.SuperuserPaperVisibilityTest.test_superuser_stats_include_all_master_copies -v 2`

Expected: PASS

**Step 3: Commit**

```bash
git add backend/papers/views.py
git commit -m "fix: SuperuserSubmissionStatsView shows stats for all master copies"
```

---

## Task 6: Run Full Test Suite

**Step 1: Run all superuser paper tests**

Run: `cd /Users/vasnas/scratch/dtcc-tracker/backend && python manage.py test papers.tests.test_superuser_papers -v 2`

Expected: All tests PASS

**Step 2: Run full test suite to check for regressions**

Run: `cd /Users/vasnas/scratch/dtcc-tracker/backend && python manage.py test -v 2`

Expected: All tests PASS

**Step 3: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "fix: admin users can now see papers from all users

- SuperuserPaperListView returns all master copies
- SuperuserPaperUpdateView can update any master copy
- SuperuserBulkUpdateView can bulk update any master copies
- SuperuserSubmissionStatsView shows stats for all master copies

Fixes the bug where admins could only see papers they personally owned."
```

---

## Summary of Changes

| File | Line(s) | Change |
|------|---------|--------|
| `backend/papers/views.py` | 637 | Remove `user=request.user` filter |
| `backend/papers/views.py` | 566 | Remove `user=request.user` from get_object_or_404 |
| `backend/papers/views.py` | 598-600 | Remove `user=request.user` from bulk update filter |
| `backend/papers/views.py` | 670 | Remove `user=request.user` from stats filter |
| `backend/papers/tests/test_superuser_papers.py` | New file | Tests for superuser paper visibility |
