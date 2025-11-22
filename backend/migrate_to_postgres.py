#!/usr/bin/env python
"""
Script to migrate data from SQLite to PostgreSQL
"""
import os
import sys
import django
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_paper.settings')
django.setup()

from django.db import connections
from django.apps import apps
from django.core.management import call_command
import json


def migrate_data():
    """Migrate data from SQLite to PostgreSQL"""

    print("Starting data migration from SQLite to PostgreSQL...")

    # First, ensure PostgreSQL database has all migrations
    print("Running migrations on PostgreSQL...")
    call_command('migrate', '--database=default', '--run-syncdb')

    # Get all models
    models_to_migrate = [
        'auth.User',
        'papers.Paper',
        'papers.Project',
        'papers.ChatMessage',
    ]

    for model_label in models_to_migrate:
        app_label, model_name = model_label.split('.')
        model = apps.get_model(app_label, model_name)

        print(f"\nMigrating {model_label}...")

        # Export data from SQLite
        sqlite_data = []
        for obj in model.objects.using('sqlite').all():
            sqlite_data.append(obj)

        if not sqlite_data:
            print(f"  No data to migrate for {model_label}")
            continue

        print(f"  Found {len(sqlite_data)} records")

        # Import to PostgreSQL
        if model_label == 'auth.User':
            # Special handling for User model
            for user in sqlite_data:
                if not model.objects.using('default').filter(username=user.username).exists():
                    new_user = model(
                        username=user.username,
                        email=user.email,
                        first_name=user.first_name,
                        last_name=user.last_name,
                        is_staff=user.is_staff,
                        is_active=user.is_active,
                        is_superuser=user.is_superuser,
                        date_joined=user.date_joined
                    )
                    new_user.password = user.password  # Copy hashed password
                    new_user.save(using='default')
            print(f"  Migrated {len(sqlite_data)} users")
        else:
            # Bulk create for other models
            model.objects.using('default').bulk_create(
                sqlite_data,
                ignore_conflicts=True
            )
            print(f"  Migrated {len(sqlite_data)} records")

    print("\n✅ Migration complete!")

    # Verify counts
    print("\nVerifying migration...")
    for model_label in models_to_migrate:
        app_label, model_name = model_label.split('.')
        model = apps.get_model(app_label, model_name)

        sqlite_count = model.objects.using('sqlite').count()
        pg_count = model.objects.using('default').count()

        status = "✅" if sqlite_count == pg_count else "⚠️"
        print(f"{status} {model_label}: SQLite={sqlite_count}, PostgreSQL={pg_count}")


def setup_dual_databases():
    """Temporarily configure both databases for migration"""
    from django.conf import settings

    # Add SQLite as a secondary database
    settings.DATABASES['sqlite'] = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': settings.BASE_DIR / 'db.sqlite3',
    }

    print("Configured dual database setup for migration")


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Migrate data from SQLite to PostgreSQL')
    parser.add_argument('--check-only', action='store_true',
                       help='Only check current database status')

    args = parser.parse_args()

    # Ensure PostgreSQL is configured
    from django.conf import settings

    if 'postgresql' not in settings.DATABASES['default']['ENGINE']:
        print("❌ Error: PostgreSQL is not configured as the default database.")
        print("Please set USE_POSTGRES_DEV=True in your .env file")
        sys.exit(1)

    # Setup dual databases
    setup_dual_databases()

    if args.check_only:
        print("Checking database status...")
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT version();")
            print(f"PostgreSQL version: {cursor.fetchone()[0]}")
    else:
        # Run migration
        migrate_data()

        print("\n📌 Next steps:")
        print("1. Test the application with PostgreSQL")
        print("2. If everything works, you can remove the SQLite database")
        print("3. Update your .env to always use PostgreSQL")