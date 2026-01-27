#!/usr/bin/env python3
"""
CLI interface for the Agentic Learning Coach.

This script provides a unified command-line interface for all
common operations in the Learning Coach system.

Usage:
    python scripts/cli.py --help           # Show all commands
    python scripts/cli.py dev start        # Start development environment
    python scripts/cli.py db init          # Initialize database
    python scripts/cli.py demo run         # Run demo script
    python scripts/cli.py health           # Check system health
"""
import os
import sys
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

import click


# ASCII art banner
BANNER = """
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     🎓 Agentic Learning Coach                                 ║
║     Personalized Coding Education & Mentorship                ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
"""


class AliasedGroup(click.Group):
    """Custom click group that supports command aliases."""
    
    def get_command(self, ctx, cmd_name):
        # Check for aliases
        aliases = {
            "up": "start",
            "down": "stop",
            "ps": "status",
            "migrate": "upgrade",
        }
        cmd_name = aliases.get(cmd_name, cmd_name)
        return super().get_command(ctx, cmd_name)


@click.group(cls=AliasedGroup)
@click.version_option(version="0.1.0", prog_name="learning-coach")
@click.option('--verbose', '-v', is_flag=True, help='Enable verbose output')
@click.pass_context
def cli(ctx, verbose):
    """
    Agentic Learning Coach CLI
    
    A unified command-line interface for managing the Learning Coach system.
    
    \b
    Quick Start:
        cli dev start       Start development environment
        cli db init         Initialize database
        cli demo run        Run demo script
        cli health          Check system health
    """
    ctx.ensure_object(dict)
    ctx.obj['verbose'] = verbose


# =============================================================================
# Development Commands
# =============================================================================
@cli.group()
def dev():
    """Development environment commands."""
    pass


@dev.command()
@click.option('--local', is_flag=True, help='Start only local services (no Docker)')
@click.option('--build', '-b', is_flag=True, help='Build images before starting')
@click.pass_context
def start(ctx, local, build):
    """Start development services."""
    from scripts.dev import start as dev_start
    ctx.invoke(dev_start, local=local, build=build)


@dev.command()
@click.option('--volumes', '-v', is_flag=True, help='Remove volumes as well')
@click.pass_context
def stop(ctx, volumes):
    """Stop development services."""
    from scripts.dev import stop as dev_stop
    ctx.invoke(dev_stop, volumes=volumes)


@dev.command()
@click.option('--build', '-b', is_flag=True, help='Rebuild images')
@click.pass_context
def restart(ctx, build):
    """Restart development services."""
    from scripts.dev import restart as dev_restart
    ctx.invoke(dev_restart, build=build)


@dev.command()
@click.option('--follow', '-f', is_flag=True, help='Follow log output')
@click.option('--tail', '-n', default=100, help='Number of lines to show')
@click.argument('service', required=False)
@click.pass_context
def logs(ctx, follow, tail, service):
    """View service logs."""
    from scripts.dev import logs as dev_logs
    ctx.invoke(dev_logs, follow=follow, tail=tail, service=service)


@dev.command()
@click.pass_context
def status(ctx):
    """Check service status."""
    from scripts.dev import status as dev_status
    ctx.invoke(dev_status)


@dev.command()
@click.pass_context
def shell(ctx):
    """Open a shell in the coach service container."""
    from scripts.dev import shell as dev_shell
    ctx.invoke(dev_shell)


# =============================================================================
# Database Commands
# =============================================================================
@cli.group()
def db():
    """Database management commands."""
    pass


@db.command()
@click.option('--create-tables', is_flag=True, help='Create tables directly (skip migrations)')
@click.pass_context
def init(ctx, create_tables):
    """Initialize the database."""
    from scripts.init_db import init as db_init
    ctx.invoke(db_init, create_tables=create_tables)


@db.command()
@click.pass_context
def upgrade(ctx):
    """Run database migrations."""
    from scripts.manage_db import upgrade as db_upgrade
    ctx.invoke(db_upgrade)


@db.command()
@click.argument('revision')
@click.pass_context
def downgrade(ctx, revision):
    """Downgrade database to a specific revision."""
    from scripts.manage_db import downgrade as db_downgrade
    ctx.invoke(db_downgrade, revision=revision)


@db.command()
@click.pass_context
def status(ctx):
    """Show migration status."""
    from scripts.manage_db import status as db_status
    ctx.invoke(db_status)


@db.command()
@click.option('--message', '-m', required=True, help='Migration message')
@click.pass_context
def create_migration(ctx, message):
    """Create a new migration."""
    from scripts.manage_db import create_migration as db_create_migration
    ctx.invoke(db_create_migration, message=message)


@db.command()
@click.option('--sample-users', default=3, help='Number of sample users')
@click.option('--sample-curricula', default=2, help='Number of curricula per user')
@click.pass_context
def seed(ctx, sample_users, sample_curricula):
    """Seed database with sample data."""
    from scripts.init_db import seed as db_seed
    ctx.invoke(db_seed, sample_users=sample_users, sample_curricula=sample_curricula)


@db.command()
@click.confirmation_option(prompt='⚠️  This will DELETE ALL DATA. Are you sure?')
@click.pass_context
def reset(ctx):
    """Reset database (WARNING: deletes all data!)."""
    from scripts.init_db import reset as db_reset
    ctx.invoke(db_reset)


@db.command()
@click.pass_context
def check(ctx):
    """Check database connection."""
    from scripts.init_db import check as db_check
    ctx.invoke(db_check)


@db.command()
@click.pass_context
def tables(ctx):
    """List database tables."""
    from scripts.init_db import tables as db_tables
    ctx.invoke(db_tables)


# =============================================================================
# Demo Commands
# =============================================================================
@cli.group()
def demo():
    """Demo and testing commands."""
    pass


@demo.command()
@click.option('--quick', is_flag=True, help='Run a quick demo')
@click.pass_context
def run(ctx, quick):
    """Run the complete demo script."""
    from scripts.demo import run as demo_run
    ctx.invoke(demo_run, quick=quick)


@demo.command()
@click.pass_context
def agents(ctx):
    """Demo individual agent interactions."""
    from scripts.demo import agents as demo_agents
    ctx.invoke(demo_agents)


# =============================================================================
# Health Commands
# =============================================================================
@cli.command()
@click.option('--detailed', '-d', is_flag=True, help='Show detailed health info')
def health(detailed):
    """Check system health status."""
    import asyncio
    import httpx
    
    click.echo("🏥 System Health Check")
    click.echo("=" * 50)
    
    async def check_health():
        results = {}
        
        services = [
            ("Coach Service", "http://localhost:8000/health/live"),
            ("Runner Service", "http://localhost:8001/health"),
            ("Qdrant", "http://localhost:6333/health"),
        ]
        
        async with httpx.AsyncClient(timeout=5.0) as client:
            for name, url in services:
                try:
                    response = await client.get(url)
                    results[name] = {
                        "status": "healthy" if response.status_code == 200 else "unhealthy",
                        "response_time_ms": response.elapsed.total_seconds() * 1000,
                        "status_code": response.status_code
                    }
                except Exception as e:
                    results[name] = {
                        "status": "unavailable",
                        "error": str(e)
                    }
        
        return results
    
    results = asyncio.run(check_health())
    
    all_healthy = True
    for service, status in results.items():
        icon = "✅" if status["status"] == "healthy" else "❌"
        click.echo(f"\n{icon} {service}")
        click.echo(f"   Status: {status['status']}")
        if "response_time_ms" in status:
            click.echo(f"   Response Time: {status['response_time_ms']:.2f}ms")
        if "error" in status:
            click.echo(f"   Error: {status['error']}")
        if status["status"] != "healthy":
            all_healthy = False
    
    if detailed:
        click.echo("\n" + "-" * 50)
        click.echo("Detailed Health (Coach Service):")
        try:
            import httpx
            response = httpx.get("http://localhost:8000/health/detailed", timeout=5.0)
            if response.status_code == 200:
                import json
                click.echo(json.dumps(response.json(), indent=2))
        except Exception as e:
            click.echo(f"   Could not fetch detailed health: {e}")
    
    click.echo("\n" + "=" * 50)
    if all_healthy:
        click.echo("✅ All services are healthy!")
    else:
        click.echo("⚠️  Some services are not healthy")
        sys.exit(1)


# =============================================================================
# Test Commands
# =============================================================================
@cli.group()
def test():
    """Testing commands."""
    pass


@test.command()
@click.option('--coverage', '-c', is_flag=True, help='Run with coverage')
@click.option('--verbose', '-v', is_flag=True, help='Verbose output')
@click.argument('path', required=False, default='tests/')
def run(coverage, verbose, path):
    """Run tests."""
    import subprocess
    
    cmd = ["pytest", path]
    
    if verbose:
        cmd.append("-v")
    
    if coverage:
        cmd.extend(["--cov=src", "--cov-report=term-missing"])
    
    click.echo(f"Running: {' '.join(cmd)}")
    subprocess.run(cmd, cwd=str(project_root))


@test.command()
def unit():
    """Run unit tests only."""
    import subprocess
    subprocess.run(
        ["pytest", "tests/unit/", "-v"],
        cwd=str(project_root)
    )


@test.command()
def integration():
    """Run integration tests only."""
    import subprocess
    subprocess.run(
        ["pytest", "tests/integration/", "-v"],
        cwd=str(project_root)
    )


# =============================================================================
# Info Commands
# =============================================================================
@cli.command()
def info():
    """Show system information."""
    click.echo(BANNER)
    
    click.echo("📋 System Information")
    click.echo("-" * 50)
    
    # Python version
    import platform
    click.echo(f"   Python: {platform.python_version()}")
    click.echo(f"   Platform: {platform.system()} {platform.release()}")
    
    # Project info
    click.echo(f"\n   Project Root: {project_root}")
    
    # Check for .env
    env_file = project_root / ".env"
    click.echo(f"   .env file: {'✅ Found' if env_file.exists() else '❌ Not found'}")
    
    # Check Docker
    import subprocess
    try:
        result = subprocess.run(
            ["docker", "--version"],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            click.echo(f"   Docker: ✅ {result.stdout.strip()}")
        else:
            click.echo("   Docker: ❌ Not available")
    except FileNotFoundError:
        click.echo("   Docker: ❌ Not installed")
    
    # Environment variables
    click.echo("\n📦 Environment Variables")
    click.echo("-" * 50)
    
    env_vars = [
        "DATABASE_URL",
        "REDIS_URL",
        "RUNNER_SERVICE_URL",
        "ENVIRONMENT",
        "LOG_LEVEL",
    ]
    
    for var in env_vars:
        value = os.getenv(var)
        if value:
            # Mask sensitive values
            if "PASSWORD" in var or "SECRET" in var:
                value = "****"
            elif "URL" in var and "@" in value:
                import re
                value = re.sub(r':([^:@]+)@', ':****@', value)
            click.echo(f"   {var}: {value}")
        else:
            click.echo(f"   {var}: (not set)")


@cli.command()
def version():
    """Show version information."""
    click.echo("Agentic Learning Coach v0.1.0")
    click.echo("Copyright (c) 2024")


# =============================================================================
# Quick Commands (shortcuts)
# =============================================================================
@cli.command()
def up():
    """Shortcut for 'dev start'."""
    from scripts.dev import start as dev_start
    ctx = click.Context(dev_start)
    ctx.invoke(dev_start, local=False, build=False)


@cli.command()
def down():
    """Shortcut for 'dev stop'."""
    from scripts.dev import stop as dev_stop
    ctx = click.Context(dev_stop)
    ctx.invoke(dev_stop, volumes=False)


if __name__ == "__main__":
    cli()
