"""
Shared fixtures and custom strategies for property-based tests.

This module provides:
- Hypothesis configuration profiles
- Custom strategies for domain objects
- Shared test fixtures
"""

import os
from typing import Any, Dict, List

import pytest
from hypothesis import HealthCheck, Phase, Verbosity, settings

# Configure Hypothesis profiles for different environments

# Development profile: Fast iterations for local development
settings.register_profile(
    "dev",
    max_examples=10,
    verbosity=Verbosity.normal,
    deadline=1000,  # 1 second
    suppress_health_check=[HealthCheck.too_slow],
    phases=[Phase.explicit, Phase.reuse, Phase.generate, Phase.target],
)

# CI profile: Comprehensive testing for continuous integration
settings.register_profile(
    "ci",
    max_examples=100,
    verbosity=Verbosity.verbose,
    deadline=5000,  # 5 seconds
    suppress_health_check=[],
    phases=[Phase.explicit, Phase.reuse, Phase.generate, Phase.target, Phase.shrink],
)

# Production profile: Thorough testing before release
settings.register_profile(
    "production",
    max_examples=1000,
    verbosity=Verbosity.verbose,
    deadline=10000,  # 10 seconds
    suppress_health_check=[],
    phases=[Phase.explicit, Phase.reuse, Phase.generate, Phase.target, Phase.shrink],
)

# Load profile from environment variable, default to 'dev'
profile = os.getenv("HYPOTHESIS_PROFILE", "dev")
settings.load_profile(profile)


# Shared fixtures for property tests

@pytest.fixture
def hypothesis_settings() -> Dict[str, Any]:
    """Return current Hypothesis settings for inspection."""
    return {
        "profile": profile,
        "max_examples": settings.default.max_examples,
        "deadline": settings.default.deadline,
    }


@pytest.fixture
def min_property_test_iterations() -> int:
    """Minimum number of iterations for property tests (from requirements)."""
    return 100
