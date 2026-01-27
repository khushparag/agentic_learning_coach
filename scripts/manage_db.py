#!/usr/bin/env python3
"""
Database management CLI script for the Agentic Learning Coach.

This script provides commands for managing database migrations,
initializing the database, and performing common database operations.
"""
import asyncio
import sys
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

import click
from src.adapters.database.migration_manager import (
    MigrationManager, initialize_database, upgrade_database, 
    get_migration_status, create_initial_migration
)
from src.adapters.database.settings import DatabaseSettings


@click.group()
@click.option('--database-url', help='Database URL (overrides environment)')
@click.pass_context
def cli(ctx, database_url):
    """Database management commands for Agentic Learning Coach."""
    ctx.ensure_object(dict)
    
    if database_url:
        # Create settings with custom database URL
        settings = DatabaseSettings()
        settings.database_url = database_url
        ctx.obj['settings'] = settings
    else:
        ctx.obj['settings'] = None


@cli.command()
@click.pass_context
def init(ctx):
    """Initialize the database with the latest schema."""
    click.echo("Initializing database...")
    
    try:
        asyncio.run(initialize_database(ctx.obj['settings']))
        click.echo("✅ Database initialized successfully!")
    except Exception as e:
        click.echo(f"❌ Failed to initialize database: {str(e)}", err=True)
        sys.exit(1)


@cli.command()
@click.option('--message', '-m', required=True, help='Migration message')
@click.option('--auto/--no-auto', default=True, help='Auto-generate migration from model changes')
@click.pass_context
def create_migration(ctx, message, auto):
    """Create a new migration file."""
    click.echo(f"Creating migration: {message}")
    
    try:
        manager = MigrationManager(ctx.obj['settings'])
        revision_id = manager.create_migration(message, autogenerate=auto)
        click.echo(f"✅ Migration created with revision ID: {revision_id}")
    except Exception as e:
        click.echo(f"❌ Failed to create migration: {str(e)}", err=True)
        sys.exit(1)


@cli.command()
@click.pass_context
def upgrade(ctx):
    """Upgrade database to the latest migration."""
    click.echo("Upgrading database to latest migration...")
    
    try:
        upgrade_database(ctx.obj['settings'])
        click.echo("✅ Database upgraded successfully!")
    except Exception as e:
        click.echo(f"❌ Failed to upgrade database: {str(e)}", err=True)
        sys.exit(1)


@cli.command()
@click.argument('revision')
@click.pass_context
def upgrade_to(ctx, revision):
    """Upgrade database to a specific revision."""
    click.echo(f"Upgrading database to revision: {revision}")
    
    try:
        manager = MigrationManager(ctx.obj['settings'])
        manager.upgrade_to_revision(revision)
        click.echo(f"✅ Database upgraded to revision {revision}!")
    except Exception as e:
        click.echo(f"❌ Failed to upgrade to revision {revision}: {str(e)}", err=True)
        sys.exit(1)


@cli.command()
@click.argument('revision')
@click.pass_context
def downgrade(ctx, revision):
    """Downgrade database to a specific revision."""
    click.echo(f"Downgrading database to revision: {revision}")
    
    try:
        manager = MigrationManager(ctx.obj['settings'])
        manager.downgrade_to_revision(revision)
        click.echo(f"✅ Database downgraded to revision {revision}!")
    except Exception as e:
        click.echo(f"❌ Failed to downgrade to revision {revision}: {str(e)}", err=True)
        sys.exit(1)


@cli.command()
@click.pass_context
def status(ctx):
    """Show current migration status."""
    try:
        status_info = get_migration_status(ctx.obj['settings'])
        
        click.echo("📊 Database Migration Status")
        click.echo("=" * 30)
        click.echo(f"Database URL: {status_info['database_url']}")
        click.echo(f"Current Revision: {status_info['current_revision'] or 'None'}")
        click.echo(f"Has Migrations: {'Yes' if status_info['has_migrations'] else 'No'}")
        click.echo(f"Up to Date: {'Yes' if status_info['is_up_to_date'] else 'No'}")
        
    except Exception as e:
        click.echo(f"❌ Failed to get migration status: {str(e)}", err=True)
        sys.exit(1)


@cli.command()
@click.pass_context
def history(ctx):
    """Show migration history."""
    try:
        manager = MigrationManager(ctx.obj['settings'])
        click.echo("📜 Migration History")
        click.echo("=" * 20)
        manager.get_migration_history()
    except Exception as e:
        click.echo(f"❌ Failed to get migration history: {str(e)}", err=True)
        sys.exit(1)


@cli.command()
@click.confirmation_option(prompt='Are you sure you want to drop all tables?')
@click.pass_context
def reset(ctx):
    """Drop all tables and recreate them (WARNING: This will delete all data!)."""
    click.echo("🚨 Resetting database (dropping all tables)...")
    
    try:
        manager = MigrationManager(ctx.obj['settings'])
        
        # Drop all tables
        asyncio.run(manager.drop_tables())
        click.echo("🗑️  All tables dropped")
        
        # Recreate tables
        asyncio.run(manager.create_tables())
        click.echo("🏗️  Tables recreated")
        
        # Stamp with head revision
        from alembic import command
        command.stamp(manager.alembic_cfg, "head")
        click.echo("📋 Database stamped with head revision")
        
        click.echo("✅ Database reset completed!")
        
    except Exception as e:
        click.echo(f"❌ Failed to reset database: {str(e)}", err=True)
        sys.exit(1)


@cli.command()
@click.pass_context
def create_tables(ctx):
    """Create all tables using SQLAlchemy metadata (for development/testing)."""
    click.echo("Creating all tables...")
    
    try:
        manager = MigrationManager(ctx.obj['settings'])
        asyncio.run(manager.create_tables())
        click.echo("✅ All tables created successfully!")
    except Exception as e:
        click.echo(f"❌ Failed to create tables: {str(e)}", err=True)
        sys.exit(1)


if __name__ == '__main__':
    cli()