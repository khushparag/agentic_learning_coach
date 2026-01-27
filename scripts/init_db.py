#!/usr/bin/env python3
"""
Database initialization script for the Agentic Learning Coach.

This script provides commands for initializing the database,
running migrations, and seeding sample data.

Usage:
    python scripts/init_db.py init          # Initialize database with migrations
    python scripts/init_db.py seed          # Seed sample data
    python scripts/init_db.py reset         # Reset database (WARNING: deletes all data)
    python scripts/init_db.py check         # Check database connection and status
"""
import asyncio
import os
import sys
from pathlib import Path
from datetime import datetime, timezone
from uuid import uuid4

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

import click


def get_database_url() -> str:
    """Get database URL from environment or default."""
    return os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/learning_coach"
    )


@click.group()
def cli():
    """Database initialization and management commands."""
    pass


@cli.command()
@click.option('--create-tables', is_flag=True, help='Create tables directly (skip migrations)')
def init(create_tables: bool):
    """Initialize the database with schema and migrations."""
    click.echo("🗄️  Initializing database...")
    click.echo(f"   Database URL: {_mask_password(get_database_url())}")
    
    try:
        from src.adapters.database.migration_manager import MigrationManager
        
        manager = MigrationManager()
        
        if create_tables:
            click.echo("   Creating tables directly (skipping migrations)...")
            asyncio.run(manager.create_tables())
            click.echo("✅ Tables created successfully!")
        else:
            click.echo("   Running migrations...")
            manager.upgrade_to_head()
            click.echo("✅ Database initialized successfully!")
        
        # Show current status
        status = manager.check_migration_status()
        click.echo(f"\n📊 Current Status:")
        click.echo(f"   Revision: {status.get('current_revision', 'None')}")
        click.echo(f"   Has Migrations: {status.get('has_migrations', False)}")
        
    except Exception as e:
        click.echo(f"❌ Failed to initialize database: {e}", err=True)
        sys.exit(1)


@cli.command()
@click.option('--sample-users', default=3, help='Number of sample users to create')
@click.option('--sample-curricula', default=2, help='Number of sample curricula per user')
def seed(sample_users: int, sample_curricula: int):
    """Seed the database with sample data for development/testing."""
    click.echo("🌱 Seeding database with sample data...")
    
    try:
        asyncio.run(_seed_database(sample_users, sample_curricula))
        click.echo("✅ Database seeded successfully!")
    except Exception as e:
        click.echo(f"❌ Failed to seed database: {e}", err=True)
        sys.exit(1)


async def _seed_database(num_users: int, num_curricula: int):
    """Seed the database with sample data."""
    from src.adapters.database.config import get_database_manager
    from src.adapters.database.models import (
        UserModel, LearningProfileModel, LearningPlanModel,
        ModuleModel, TaskModel
    )
    from src.domain.entities.user_profile import SkillLevel, LearningStyle
    
    db_manager = get_database_manager()
    
    async for session in db_manager.get_async_session():
        click.echo(f"   Creating {num_users} sample users...")
        
        for i in range(num_users):
            user_id = str(uuid4())
            
            # Create user
            user = UserModel(
                id=user_id,
                email=f"learner{i+1}@example.com",
                username=f"learner{i+1}",
                password_hash="$2b$12$sample_hash_for_development",
                email_verified=True,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            session.add(user)
            
            # Create learning profile
            skill_levels = [SkillLevel.BEGINNER, SkillLevel.INTERMEDIATE, SkillLevel.ADVANCED]
            learning_styles = [LearningStyle.VISUAL, LearningStyle.HANDS_ON, LearningStyle.READING]
            
            profile = LearningProfileModel(
                id=str(uuid4()),
                user_id=user_id,
                skill_level=skill_levels[i % len(skill_levels)].value,
                learning_style=learning_styles[i % len(learning_styles)].value,
                goals=["Learn Python", "Build web applications", "Master algorithms"],
                time_constraints={"hours_per_week": 5 + (i * 2), "preferred_times": ["evening", "weekend"]},
                preferences={"notifications": True, "difficulty_preference": "challenging"},
                assessment_completed=True,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            session.add(profile)
            
            click.echo(f"   Created user: {user.email}")
            
            # Create curricula for each user
            for j in range(num_curricula):
                plan_id = str(uuid4())
                topics = [
                    ("Python Basics", "Variables, data types, and basic operations"),
                    ("React Fundamentals", "Components, props, and state management"),
                    ("JavaScript Advanced", "Async/await, closures, and prototypes"),
                ]
                topic = topics[(i + j) % len(topics)]
                
                plan = LearningPlanModel(
                    id=plan_id,
                    user_id=user_id,
                    title=topic[0],
                    description=topic[1],
                    status="active" if j == 0 else "draft",
                    total_topics=5,
                    completed_topics=j,
                    estimated_hours=10 + (j * 5),
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                )
                session.add(plan)
                
                # Create modules for each plan
                for k in range(3):
                    module_id = str(uuid4())
                    module = ModuleModel(
                        id=module_id,
                        learning_plan_id=plan_id,
                        title=f"Module {k+1}: {topic[0]} Part {k+1}",
                        description=f"Learn the fundamentals of {topic[0].lower()} - part {k+1}",
                        order_index=k,
                        difficulty_level=k + 1,
                        prerequisites=[],
                        learning_objectives=[
                            f"Understand concept {k+1}",
                            f"Apply concept {k+1} in practice",
                            f"Build a mini-project using concept {k+1}"
                        ],
                        estimated_minutes=30 + (k * 15),
                        created_at=datetime.now(timezone.utc)
                    )
                    session.add(module)
                    
                    # Create tasks for each module
                    for t in range(2):
                        task = TaskModel(
                            id=str(uuid4()),
                            module_id=module_id,
                            title=f"Exercise {t+1}: Practice {topic[0]}",
                            description=f"Complete this exercise to practice {topic[0].lower()}",
                            task_type="coding",
                            order_index=t,
                            difficulty_level=k + 1,
                            instructions={
                                "prompt": f"Write a function that demonstrates {topic[0].lower()}",
                                "starter_code": "# Your code here\n",
                                "expected_output": "Success!"
                            },
                            test_cases=[
                                {"input": "test1", "expected": "result1"},
                                {"input": "test2", "expected": "result2"}
                            ],
                            hints=[
                                "Start by understanding the problem",
                                "Break it down into smaller steps"
                            ],
                            time_limit_minutes=15,
                            created_at=datetime.now(timezone.utc)
                        )
                        session.add(task)
        
        await session.commit()
        click.echo(f"   Created {num_users * num_curricula} curricula with modules and tasks")


@cli.command()
@click.confirmation_option(prompt='⚠️  This will DELETE ALL DATA. Are you sure?')
def reset():
    """Reset the database (WARNING: deletes all data!)."""
    click.echo("🚨 Resetting database...")
    
    try:
        from src.adapters.database.migration_manager import MigrationManager
        from alembic import command
        
        manager = MigrationManager()
        
        # Drop all tables
        click.echo("   Dropping all tables...")
        asyncio.run(manager.drop_tables())
        
        # Recreate tables via migrations
        click.echo("   Running migrations...")
        manager.upgrade_to_head()
        
        click.echo("✅ Database reset successfully!")
        
    except Exception as e:
        click.echo(f"❌ Failed to reset database: {e}", err=True)
        sys.exit(1)


@cli.command()
def check():
    """Check database connection and status."""
    click.echo("🔍 Checking database connection...")
    click.echo(f"   Database URL: {_mask_password(get_database_url())}")
    
    try:
        from src.adapters.database.migration_manager import MigrationManager
        from src.adapters.database.config import get_database_manager
        
        # Check migration status
        manager = MigrationManager()
        status = manager.check_migration_status()
        
        click.echo("\n📊 Migration Status:")
        click.echo(f"   Current Revision: {status.get('current_revision', 'None')}")
        click.echo(f"   Has Migrations: {status.get('has_migrations', False)}")
        click.echo(f"   Up to Date: {status.get('is_up_to_date', False)}")
        
        # Test async connection
        click.echo("\n🔌 Testing connection...")
        
        async def test_connection():
            db_manager = get_database_manager()
            async for session in db_manager.get_async_session():
                from sqlalchemy import text
                result = await session.execute(text("SELECT 1 as test"))
                row = result.fetchone()
                return row.test == 1
        
        if asyncio.run(test_connection()):
            click.echo("✅ Database connection successful!")
        else:
            click.echo("❌ Database connection test failed", err=True)
            sys.exit(1)
            
    except Exception as e:
        click.echo(f"❌ Database check failed: {e}", err=True)
        sys.exit(1)


@cli.command()
def tables():
    """List all database tables."""
    click.echo("📋 Database Tables:")
    
    try:
        from sqlalchemy import create_engine, inspect
        
        engine = create_engine(get_database_url())
        inspector = inspect(engine)
        
        tables = inspector.get_table_names()
        
        if not tables:
            click.echo("   No tables found")
            return
        
        for table in sorted(tables):
            columns = inspector.get_columns(table)
            click.echo(f"\n   📁 {table}")
            for col in columns:
                nullable = "NULL" if col['nullable'] else "NOT NULL"
                click.echo(f"      - {col['name']}: {col['type']} ({nullable})")
                
    except Exception as e:
        click.echo(f"❌ Failed to list tables: {e}", err=True)
        sys.exit(1)


def _mask_password(url: str) -> str:
    """Mask password in database URL for display."""
    import re
    return re.sub(r':([^:@]+)@', ':****@', url)


if __name__ == "__main__":
    cli()
