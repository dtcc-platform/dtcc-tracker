"""
Health check endpoints for monitoring
"""
from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
import redis
from django.conf import settings
import time


def health_check(request):
    """
    Comprehensive health check endpoint
    """
    health_status = {
        'status': 'healthy',
        'timestamp': time.time(),
        'checks': {}
    }

    # Check database
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        health_status['checks']['database'] = {
            'status': 'healthy',
            'message': 'Database connection successful'
        }
    except Exception as e:
        health_status['status'] = 'unhealthy'
        health_status['checks']['database'] = {
            'status': 'unhealthy',
            'message': str(e)
        }

    # Check Redis
    try:
        cache.set('health_check', 'ok', 1)
        if cache.get('health_check') == 'ok':
            health_status['checks']['redis'] = {
                'status': 'healthy',
                'message': 'Redis connection successful'
            }
        else:
            raise Exception('Redis read/write failed')
    except Exception as e:
        health_status['status'] = 'unhealthy'
        health_status['checks']['redis'] = {
            'status': 'unhealthy',
            'message': str(e)
        }

    # Check Celery (optional)
    try:
        from papers.tasks import health_check_task
        result = health_check_task.delay()
        if result.id:
            health_status['checks']['celery'] = {
                'status': 'healthy',
                'message': 'Celery task queued successfully'
            }
    except Exception as e:
        # Celery is optional, don't mark as unhealthy
        health_status['checks']['celery'] = {
            'status': 'degraded',
            'message': str(e)
        }

    # Return appropriate status code
    status_code = 200 if health_status['status'] == 'healthy' else 503
    return JsonResponse(health_status, status=status_code)


def simple_health_check(request):
    """
    Simple health check for load balancers
    """
    return JsonResponse({'status': 'ok'}, status=200)