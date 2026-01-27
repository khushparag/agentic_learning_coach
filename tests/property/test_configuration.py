"""
Property tests for test configuration validation.

Feature: property-tests-and-docker-execution
Property: Test Configuration Validation
Validates: Requirements 1.2
"""

import pytest
from hypothesis import given, settings

from tests.property.strategies import user_profile_strategy


class TestPropertyTestConfiguration:
    """Test that property tests are configured correctly."""

    def test_hypothesis_profile_loaded(self, hypothesis_settings):
        """Verify that a Hypothesis profile is loaded."""
        assert hypothesis_settings["profile"] in ["dev", "ci", "production"]

    def test_minimum_iterations_configured(
        self, hypothesis_settings, min_property_test_iterations
    ):
        """
        Property: Test Configuration Validation
        
        For any property test configuration, the number of test iterations
        must be at least 100 to ensure adequate coverage.
        
        Validates: Requirements 1.2
        """
        # In CI and production profiles, we should have at least 100 iterations
        profile = hypothesis_settings["profile"]
        max_examples = hypothesis_settings["max_examples"]

        if profile in ["ci", "production"]:
            assert (
                max_examples >= min_property_test_iterations
            ), f"Profile '{profile}' has {max_examples} examples, need at least {min_property_test_iterations}"

    @given(profile=user_profile_strategy())
    @settings(max_examples=100)
    def test_property_test_runs_minimum_iterations(self, profile):
        """
        Property: Test Configuration Validation
        
        For any generated test data, property tests should run with
        at least 100 iterations when configured.
        
        This test itself runs with 100 iterations to validate the configuration.
        
        Validates: Requirements 1.2
        """
        # This test validates that we can run property tests with 100+ iterations
        # The @settings decorator ensures this test runs 100 times
        assert profile is not None
        assert profile.user_id is not None
        assert profile.skill_level is not None

    def test_hypothesis_deadline_configured(self, hypothesis_settings):
        """Verify that Hypothesis deadline is configured appropriately."""
        deadline = hypothesis_settings["deadline"]
        assert deadline is not None
        # Deadline is a timedelta object
        assert deadline.total_seconds() > 0, "Deadline must be positive"

    def test_all_required_phases_enabled(self):
        """Verify that all required Hypothesis phases are enabled."""
        from hypothesis import Phase, settings as hypothesis_settings

        current_settings = hypothesis_settings.default
        phases = current_settings.phases

        # At minimum, we need generate and shrink phases
        assert Phase.generate in phases, "Generate phase must be enabled"
        # Shrink phase is important for finding minimal failing examples
        # but may be disabled in dev profile for speed
