#!/usr/bin/env python3
"""
Development server startup script for the Agentic Learning Coach.

This script provides convenient commands for starting and managing
the development environment.

Usage:
    python scripts/dev.py start          # Start all services
    python scripts/dev.py start --local  # Start only local services (no Docker)
    python scripts/dev.py stop           # Stop all services
    python scripts/dev.py restart        # Restart all services
    python scripts/dev.py logs           # View service logs
    python scripts/dev.py status         # Check service status
"""
import os
import subprocess
import sys
import time
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

import click


def run_command(cmd: list[str], cwd: str = None, capture: bool = False) -> subprocess.CompletedProcess:
    """Run a shell command."""
    try:
        result = subprocess.run(
            cmd,
            cwd=cwd or str(project_root),
            capture_output=capture,
            text=True,
            check=False
        )
        return result
    except FileNotFoundError:
        click.echo(f"❌ Command not found: {cmd[0]}", err=True)
        sys.exit(1)


def check_docker() -> bool:
    """Check if Docker is available."""
    result = run_command(["docker", "--version"], capture=True)
    return result.returncode == 0


def check_docker_compose() -> bool:
    """Check if Docker Compose is available."""
    # Try docker compose (v2)
    result = run_command(["docker", "compose", "version"], capture=True)
    if result.returncode == 0:
        return True
    # Try docker-compose (v1)
    result = run_command(["docker-compose", "--version"], capture=True)
    return result.returncode == 0


def get_compose_command() -> list[str]:
    """Get the appropriate docker compose command."""
    result = run_command(["docker", "compose", "version"], capture=True)
    if result.returncode == 0:
        return ["docker", "compose"]
    return ["docker-compose"]


def wait_for_service(url: str, timeout: int = 60, interval: int = 2) -> bool:
    """Wait for a service to become available."""
    import urllib.request
    import urllib.error
    
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            urllib.request.urlopen(url, timeout=5)
            return True
        except (urllib.error.URLError, urllib.error.HTTPError):
            time.sleep(interval)
    return False


@click.group()
def cli():
    """Development server management commands."""
    pass


@cli.command()
@click.option('--local', is_flag=True, help='Start only local services (no Docker)')
@click.option('--detach', '-d', is_flag=True, default=True, help='Run in detached mode')
@click.option('--build', '-b', is_flag=True, help='Build images before starting')
@click.option('--services', '-s', multiple=True, help='Specific services to start')
def start(local: bool, detach: bool, build: bool, services: tuple):
    """Start development services."""
    click.echo("🚀 Starting Agentic Learning Coach development environment...")
    
    if local:
        # Start only the local development server
        click.echo("📦 Starting local development server...")
        click.echo("   Note: Make sure database services are running separately")
        
        # Check for .env file
        env_file = project_root / ".env"
        if not env_file.exists():
            click.echo("⚠️  No .env file found. Creating from template...")
            example_env = project_root / ".env.example"
            if example_env.exists():
                import shutil
                shutil.copy(example_env, env_file)
                click.echo("   Created .env from .env.example")
            else:
                click.echo("❌ No .env.example found", err=True)
                sys.exit(1)
        
        # Start uvicorn
        cmd = [
            sys.executable, "-m", "uvicorn",
            "src.adapters.api.main:app",
            "--host", "0.0.0.0",
            "--port", "8000",
            "--reload"
        ]
        click.echo(f"   Running: {' '.join(cmd)}")
        os.execvp(sys.executable, cmd)
        return
    
    # Check Docker availability
    if not check_docker():
        click.echo("❌ Docker is not installed or not running", err=True)
        sys.exit(1)
    
    if not check_docker_compose():
        click.echo("❌ Docker Compose is not installed", err=True)
        sys.exit(1)
    
    compose_cmd = get_compose_command()
    
    # Build command
    cmd = compose_cmd + ["up"]
    
    if detach:
        cmd.append("-d")
    
    if build:
        cmd.append("--build")
    
    if services:
        cmd.extend(services)
    
    click.echo(f"   Running: {' '.join(cmd)}")
    result = run_command(cmd)
    
    if result.returncode != 0:
        click.echo("❌ Failed to start services", err=True)
        sys.exit(1)
    
    if detach:
        click.echo("\n⏳ Waiting for services to be ready...")
        
        # Wait for coach service
        if wait_for_service("http://localhost:8000/health/live", timeout=60):
            click.echo("✅ Coach service is ready")
        else:
            click.echo("⚠️  Coach service may not be ready yet")
        
        # Wait for runner service
        if wait_for_service("http://localhost:8001/health", timeout=30):
            click.echo("✅ Runner service is ready")
        else:
            click.echo("⚠️  Runner service may not be ready yet")
        
        click.echo("\n✅ Development environment started!")
        click.echo("\n📚 Available endpoints:")
        click.echo("   - Coach API:    http://localhost:8000")
        click.echo("   - API Docs:     http://localhost:8000/docs")
        click.echo("   - Runner API:   http://localhost:8001")
        click.echo("   - Health Check: http://localhost:8000/health/detailed")


@cli.command()
@click.option('--volumes', '-v', is_flag=True, help='Remove volumes as well')
def stop(volumes: bool):
    """Stop development services."""
    click.echo("🛑 Stopping Agentic Learning Coach services...")
    
    if not check_docker_compose():
        click.echo("❌ Docker Compose is not installed", err=True)
        sys.exit(1)
    
    compose_cmd = get_compose_command()
    cmd = compose_cmd + ["down"]
    
    if volumes:
        cmd.append("-v")
        click.echo("   ⚠️  Removing volumes (data will be lost)")
    
    result = run_command(cmd)
    
    if result.returncode == 0:
        click.echo("✅ Services stopped successfully")
    else:
        click.echo("❌ Failed to stop services", err=True)
        sys.exit(1)


@cli.command()
@click.option('--build', '-b', is_flag=True, help='Rebuild images')
def restart(build: bool):
    """Restart development services."""
    click.echo("🔄 Restarting Agentic Learning Coach services...")
    
    compose_cmd = get_compose_command()
    
    # Stop services
    run_command(compose_cmd + ["down"])
    
    # Start services
    cmd = compose_cmd + ["up", "-d"]
    if build:
        cmd.append("--build")
    
    result = run_command(cmd)
    
    if result.returncode == 0:
        click.echo("✅ Services restarted successfully")
    else:
        click.echo("❌ Failed to restart services", err=True)
        sys.exit(1)


@cli.command()
@click.option('--follow', '-f', is_flag=True, help='Follow log output')
@click.option('--tail', '-n', default=100, help='Number of lines to show')
@click.argument('service', required=False)
def logs(follow: bool, tail: int, service: str):
    """View service logs."""
    compose_cmd = get_compose_command()
    cmd = compose_cmd + ["logs"]
    
    if follow:
        cmd.append("-f")
    
    cmd.extend(["--tail", str(tail)])
    
    if service:
        cmd.append(service)
    
    run_command(cmd)


@cli.command()
def status():
    """Check service status."""
    click.echo("📊 Agentic Learning Coach Service Status")
    click.echo("=" * 50)
    
    compose_cmd = get_compose_command()
    
    # Show container status
    click.echo("\n🐳 Container Status:")
    run_command(compose_cmd + ["ps"])
    
    # Check health endpoints
    click.echo("\n🏥 Health Checks:")
    
    services = [
        ("Coach Service", "http://localhost:8000/health/live"),
        ("Runner Service", "http://localhost:8001/health"),
        ("Qdrant", "http://localhost:6333/health"),
    ]
    
    import urllib.request
    import urllib.error
    
    for name, url in services:
        try:
            response = urllib.request.urlopen(url, timeout=5)
            if response.status == 200:
                click.echo(f"   ✅ {name}: healthy")
            else:
                click.echo(f"   ⚠️  {name}: HTTP {response.status}")
        except urllib.error.URLError as e:
            click.echo(f"   ❌ {name}: unavailable ({e.reason})")
        except Exception as e:
            click.echo(f"   ❌ {name}: error ({e})")


@cli.command()
def shell():
    """Open a shell in the coach service container."""
    compose_cmd = get_compose_command()
    cmd = compose_cmd + ["exec", "coach-service", "/bin/bash"]
    os.execvp(cmd[0], cmd)


@cli.command()
def db_shell():
    """Open a PostgreSQL shell."""
    compose_cmd = get_compose_command()
    cmd = compose_cmd + [
        "exec", "postgres",
        "psql", "-U", "postgres", "-d", "learning_coach"
    ]
    os.execvp(cmd[0], cmd)


if __name__ == "__main__":
    cli()
