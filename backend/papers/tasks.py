"""
Celery tasks for async processing
"""
from celery import shared_task
from celery.utils.log import get_task_logger
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import requests
import time

logger = get_task_logger(__name__)


@shared_task(bind=True, max_retries=3)
def fetch_doi_metadata_async(self, doi):
    """
    Asynchronously fetch DOI metadata from Crossref

    Args:
        doi: The DOI to fetch metadata for

    Returns:
        dict: Metadata from Crossref API
    """
    try:
        logger.info(f"Fetching metadata for DOI: {doi}")

        # Clean and format DOI
        doi = doi.strip()
        if not doi.startswith('10.'):
            raise ValueError(f"Invalid DOI format: {doi}")

        # Make request to Crossref API
        url = f"https://api.crossref.org/works/{doi}"
        headers = {
            'User-Agent': 'DTCC-Tracker/1.0 (mailto:admin@dtcc.org)'
        }

        response = requests.get(url, headers=headers, timeout=30)

        if response.status_code == 200:
            data = response.json()
            message = data.get('message', {})

            # Extract authors
            authors = []
            main_author = ""
            if 'author' in message:
                author_list = message['author']
                if author_list:
                    first_author = author_list[0]
                    main_author = f"{first_author.get('given', '')} {first_author.get('family', '')}".strip()

                    # Additional authors
                    for author in author_list[1:]:
                        name = f"{author.get('given', '')} {author.get('family', '')}".strip()
                        if name:
                            authors.append(name)

            # Extract date
            published_date = ""
            if 'published-print' in message:
                date_parts = message['published-print'].get('date-parts', [[]])[0]
                if date_parts:
                    published_date = '-'.join(str(d) for d in date_parts)
            elif 'published-online' in message:
                date_parts = message['published-online'].get('date-parts', [[]])[0]
                if date_parts:
                    published_date = '-'.join(str(d) for d in date_parts)

            # Extract other metadata
            result = {
                'DOI': doi,
                'Title': message.get('title', [''])[0],
                'Journal': message.get('container-title', [''])[0],
                'PublishedOn': published_date,
                'Authors': {
                    'Main Author': main_author,
                    'Additional Authors': authors
                },
                'PublicationType': message.get('type', 'article-journal'),
                'Abstract': message.get('abstract', ''),
                'URL': message.get('URL', ''),
                'Publisher': message.get('publisher', ''),
                'Volume': message.get('volume', ''),
                'Issue': message.get('issue', ''),
                'Pages': message.get('page', ''),
            }

            logger.info(f"Successfully fetched metadata for DOI: {doi}")
            return result

        elif response.status_code == 404:
            logger.warning(f"DOI not found: {doi}")
            raise ValueError(f"DOI not found: {doi}")
        else:
            raise Exception(f"Crossref API error: {response.status_code}")

    except requests.RequestException as e:
        logger.error(f"Network error fetching DOI {doi}: {str(e)}")
        # Retry with exponential backoff
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))
    except Exception as e:
        logger.error(f"Error fetching DOI {doi}: {str(e)}")
        raise


@shared_task(bind=True, max_retries=3)
def send_email_async(self, subject, message, recipient_list, from_email=None):
    """
    Asynchronously send email

    Args:
        subject: Email subject
        message: Email body
        recipient_list: List of recipient email addresses
        from_email: Sender email (uses DEFAULT_FROM_EMAIL if not provided)
    """
    try:
        logger.info(f"Sending email to {recipient_list}")

        if not from_email:
            from_email = settings.DEFAULT_FROM_EMAIL

        send_mail(
            subject=subject,
            message=message,
            from_email=from_email,
            recipient_list=recipient_list,
            fail_silently=False
        )

        logger.info(f"Email sent successfully to {recipient_list}")
        return True

    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")
        # Retry with exponential backoff
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))


@shared_task
def process_bulk_papers(paper_dois, user_id):
    """
    Process multiple paper DOIs asynchronously

    Args:
        paper_dois: List of DOIs to process
        user_id: ID of the user who initiated the bulk import
    """
    from .models import Paper
    from django.contrib.auth.models import User

    try:
        user = User.objects.get(id=user_id)
        results = {
            'successful': [],
            'failed': [],
            'duplicates': []
        }

        for doi in paper_dois:
            try:
                # Check if paper already exists
                if Paper.objects.filter(doi=doi, user=user).exists():
                    results['duplicates'].append(doi)
                    continue

                # Fetch metadata
                metadata = fetch_doi_metadata_async(doi)

                # Create paper
                paper = Paper.objects.create(
                    doi=doi,
                    title=metadata.get('Title', ''),
                    author_name=metadata['Authors']['Main Author'],
                    journal=metadata.get('Journal', ''),
                    date=metadata.get('PublishedOn', ''),
                    additional_authors=metadata['Authors']['Additional Authors'],
                    publication_type=metadata.get('PublicationType', ''),
                    user=user
                )

                results['successful'].append(doi)
                logger.info(f"Created paper {doi} for user {user.username}")

            except Exception as e:
                logger.error(f"Error processing DOI {doi}: {str(e)}")
                results['failed'].append({'doi': doi, 'error': str(e)})

        # Send summary email to user
        if user.email:
            subject = "Bulk Paper Import Complete"
            message = f"""
            Your bulk paper import has been completed.

            Summary:
            - Successfully imported: {len(results['successful'])} papers
            - Failed: {len(results['failed'])} papers
            - Duplicates skipped: {len(results['duplicates'])} papers

            Failed DOIs:
            {chr(10).join([f"- {item['doi']}: {item['error']}" for item in results['failed']])}
            """

            send_email_async.delay(
                subject=subject,
                message=message,
                recipient_list=[user.email]
            )

        return results

    except User.DoesNotExist:
        logger.error(f"User {user_id} not found")
        raise
    except Exception as e:
        logger.error(f"Error in bulk paper processing: {str(e)}")
        raise


@shared_task
def cleanup_old_messages():
    """
    Periodic task to clean up old chat messages (older than 30 days)
    """
    from .models import ChatMessage

    try:
        cutoff_date = timezone.now() - timedelta(days=30)
        deleted_count, _ = ChatMessage.objects.filter(
            created_at__lt=cutoff_date
        ).delete()

        logger.info(f"Deleted {deleted_count} old chat messages")
        return deleted_count

    except Exception as e:
        logger.error(f"Error cleaning up messages: {str(e)}")
        raise


@shared_task
def generate_submission_report(year=None):
    """
    Generate and email submission reports to superusers

    Args:
        year: Year to generate report for (current year if not provided)
    """
    from .models import Paper
    from django.contrib.auth.models import User
    from django.db.models import Count, Q

    try:
        if not year:
            year = timezone.now().year

        # Get statistics
        total_submitted = Paper.objects.filter(
            submission_year=year,
            is_master_copy=True
        ).count()

        by_type = Paper.objects.filter(
            submission_year=year,
            is_master_copy=True
        ).values('publication_type').annotate(count=Count('id'))

        by_project = Paper.objects.filter(
            submission_year=year,
            is_master_copy=True
        ).values('milestone_project').annotate(count=Count('id'))

        # Format report
        report = f"""
        DTCC Paper Submission Report - Year {year}
        ==========================================

        Total Papers Submitted: {total_submitted}

        By Publication Type:
        {chr(10).join([f"- {item['publication_type']}: {item['count']}" for item in by_type])}

        By Milestone Project:
        {chr(10).join([f"- {item['milestone_project'] or 'None'}: {item['count']}" for item in by_project])}

        Generated on: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}
        """

        # Send to all superusers
        superuser_emails = User.objects.filter(
            is_superuser=True,
            email__isnull=False
        ).values_list('email', flat=True)

        if superuser_emails:
            send_email_async.delay(
                subject=f"DTCC Submission Report - {year}",
                message=report,
                recipient_list=list(superuser_emails)
            )
            logger.info(f"Sent report to {len(superuser_emails)} superusers")

        return report

    except Exception as e:
        logger.error(f"Error generating submission report: {str(e)}")
        raise