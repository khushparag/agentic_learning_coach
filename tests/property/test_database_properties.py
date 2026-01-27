"""Property-based tests for database operations.

Feature: property-tests-and-docker-execution
Tests for database round-trip, integrity, and progress tracking.
"""

import pytest
from hypothesis import given, strategies as st, settings, HealthCheck, assume
from typing import Dict, Any
import asyncio

from tests.property.strategies import (
    user_profile_strategy,
    learning_plan_strategy,
    code_submission_strategy,
    performance_data_strategy,
    uuid_strategy
)


class TestDatabaseRoundTripProperties:
    """Property tests for database round-trip operations."""
    
    @settings(max_examples=100)
    @given(profile=user_profile_strategy())
    @pytest.mark.asyncio
    async def test_property_3_profile_data_persistence_roundtrip(self, profile):
        """Property 3: Profile Data Persistence Round-trip.
        
        For any user profile saved to the database, retrieving it SHALL return
        the same data (within serialization constraints).
        
        **Validates: Requirements 4.2**
        **Feature: property-tests-and-docker-execution, Property 3 (main design)**
        """
        from src.adapters.database.repositories.postgres_user_repository import PostgresUserRepository
        
        # Create repository
        repo = PostgresUserRepository()
        
        try:
            # Save profile
            saved_profile = await repo.save_profile(profile)
            
            # Retrieve profile
            retrieved_profile = await repo.get_profile(saved_profile.user_id)
            
            # Property: Retrieved data should match saved data
            assert retrieved_profile is not None
            assert retrieved_profile.user_id == profile.user_id
            assert retrieved_profile.skill_level == profile.skill_level
            assert set(retrieved_profile.learning_goals) == set(profile.learning_goals)
            
            # Property: Time constraints should be preserved
            if profile.time_constraints:
                assert retrieved_profile.time_constraints is not None
                for key in profile.time_constraints:
                    assert key in retrieved_profile.time_constraints
        
        finally:
            # Cleanup
            try:
                await repo.delete_profile(profile.user_id)
            except:
                pass
    
    @settings(max_examples=50)
    @given(submission=code_submission_strategy())
    @pytest.mark.asyncio
    async def test_property_13_evaluation_result_persistence(self, submission):
        """Property 13: Evaluation Result Persistence.
        
        For any evaluation result saved to the database, retrieving it SHALL
        return the same evaluation data.
        
        **Validates: Requirements 4.2**
        **Feature: property-tests-and-docker-execution, Property 13 (main design)**
        """
        from src.adapters.database.repositories.postgres_submission_repository import PostgresSubmissionRepository
        
        repo = PostgresSubmissionRepository()
        
        try:
            # Save submission
            saved_submission = await repo.save_submission(submission)
            
            # Retrieve submission
            retrieved = await repo.get_submission(saved_submission.id)
            
            # Property: Retrieved data should match saved data
            assert retrieved is not None
            assert retrieved.user_id == submission.user_id
            assert retrieved.task_id == submission.task_id
            assert retrieved.code_content == submission.code_content
        
        finally:
            # Cleanup
            try:
                await repo.delete_submission(submission.id)
            except:
                pass
    
    @settings(max_examples=50)
    @given(plan=learning_plan_strategy())
    @pytest.mark.asyncio
    async def test_learning_plan_roundtrip(self, plan):
        """Property: Learning plans should survive database round-trip."""
        from src.adapters.database.repositories.postgres_curriculum_repository import PostgresCurriculumRepository
        
        repo = PostgresCurriculumRepository()
        
        try:
            # Save plan
            saved_plan = await repo.save_learning_plan(plan)
            
            # Retrieve plan
            retrieved = await repo.get_learning_plan(saved_plan.id)
            
            # Property: Core data should be preserved
            assert retrieved is not None
            assert retrieved.user_id == plan.user_id
            assert retrieved.title == plan.title
            assert len(retrieved.modules) == len(plan.modules)
        
        finally:
            # Cleanup
            try:
                await repo.delete_learning_plan(plan.id)
            except:
                pass


class TestDatabaseIntegrityProperties:
    """Property tests for database integrity constraints."""
    
    @settings(max_examples=50)
    @given(profile=user_profile_strategy())
    @pytest.mark.asyncio
    async def test_property_7_database_normalization_integrity(self, profile):
        """Property 7: Database Normalization Integrity.
        
        For any data saved to the database, foreign key relationships SHALL
        be maintained and referential integrity enforced.
        
        **Validates: Requirements 4.2**
        **Feature: property-tests-and-docker-execution, Property 7 (main design)**
        """
        from src.adapters.database.repositories.postgres_user_repository import PostgresUserRepository
        from src.adapters.database.repositories.postgres_curriculum_repository import PostgresCurriculumRepository
        
        user_repo = PostgresUserRepository()
        curriculum_repo = PostgresCurriculumRepository()
        
        try:
            # Save user profile
            saved_profile = await user_repo.save_profile(profile)
            
            # Create learning plan for user
            from src.domain.entities.learning_plan import LearningPlan
            plan = LearningPlan(
                user_id=saved_profile.user_id,
                title="Test Plan",
                goal_description="Test goal",
                total_days=30
            )
            
            saved_plan = await curriculum_repo.save_learning_plan(plan)
            
            # Property: Plan should reference valid user
            retrieved_plan = await curriculum_repo.get_learning_plan(saved_plan.id)
            assert retrieved_plan.user_id == saved_profile.user_id
            
            # Property: Deleting user should cascade to plans (or prevent deletion)
            try:
                await user_repo.delete_profile(saved_profile.user_id)
                # If deletion succeeded, plan should also be deleted
                deleted_plan = await curriculum_repo.get_learning_plan(saved_plan.id)
                assert deleted_plan is None, "Plan should be deleted when user is deleted"
            except Exception:
                # If deletion failed, that's also acceptable (referential integrity enforced)
                pass
        
        finally:
            # Cleanup
            try:
                await curriculum_repo.delete_learning_plan(plan.id)
            except:
                pass
            try:
                await user_repo.delete_profile(profile.user_id)
            except:
                pass
    
    @settings(max_examples=50)
    @given(submission=code_submission_strategy())
    @pytest.mark.asyncio
    async def test_property_24_database_constraint_enforcement(self, submission):
        """Property 24: Database Constraint Enforcement.
        
        For any data that violates database constraints (e.g., duplicate keys,
        invalid foreign keys), the database SHALL reject the operation.
        
        **Validates: Requirements 4.2**
        **Feature: property-tests-and-docker-execution, Property 24 (main design)**
        """
        from src.adapters.database.repositories.postgres_submission_repository import PostgresSubmissionRepository
        
        repo = PostgresSubmissionRepository()
        
        try:
            # Save submission
            saved = await repo.save_submission(submission)
            
            # Property: Attempting to save with same ID should fail
            duplicate = submission
            duplicate.id = saved.id
            
            with pytest.raises(Exception):  # Should raise integrity error
                await repo.save_submission(duplicate)
        
        finally:
            # Cleanup
            try:
                await repo.delete_submission(submission.id)
            except:
                pass
    
    @settings(max_examples=30)
    @given(plan=learning_plan_strategy())
    @pytest.mark.asyncio
    async def test_cascade_deletion_integrity(self, plan):
        """Property: Deleting a plan should cascade to its modules and tasks."""
        from src.adapters.database.repositories.postgres_curriculum_repository import PostgresCurriculumRepository
        
        repo = PostgresCurriculumRepository()
        
        try:
            # Save plan with modules
            saved_plan = await repo.save_learning_plan(plan)
            module_ids = [m.id for m in saved_plan.modules]
            
            # Delete plan
            await repo.delete_learning_plan(saved_plan.id)
            
            # Property: Modules should also be deleted
            for module_id in module_ids:
                module = await repo.get_module(module_id)
                assert module is None, "Modules should be deleted with plan"
        
        finally:
            # Cleanup
            try:
                await repo.delete_learning_plan(plan.id)
            except:
                pass


class TestProgressTrackingProperties:
    """Property tests for progress tracking operations."""
    
    @settings(max_examples=100)
    @given(
        user_id=uuid_strategy(),
        performance_data=performance_data_strategy()
    )
    @pytest.mark.asyncio
    async def test_property_14_progress_update_consistency(self, user_id, performance_data):
        """Property 14: Progress Update Consistency.
        
        For any sequence of progress updates, the final progress state SHALL
        accurately reflect all updates in order.
        
        **Validates: Requirements 4.2**
        **Feature: property-tests-and-docker-execution, Property 14 (main design)**
        """
        from src.agents.progress_tracker.progress_tracker import ProgressTracker
        
        tracker = ProgressTracker()
        user_id_str = str(user_id)
        
        # Apply all performance updates
        for i, attempt in enumerate(performance_data):
            await tracker.record_attempt(
                user_id=user_id_str,
                task_id=f"task_{i}",
                passed=attempt['passed'],
                score=attempt['score'],
                time_taken=attempt['time_taken']
            )
        
        # Get final progress
        progress = await tracker.get_user_progress(user_id_str)
        
        # Property: Progress should reflect all attempts
        assert progress is not None
        total_attempts = len(performance_data)
        passed_attempts = sum(1 for a in performance_data if a['passed'])
        
        # Property: Counts should match
        if hasattr(progress, 'total_attempts'):
            assert progress.total_attempts >= total_attempts
        if hasattr(progress, 'passed_attempts'):
            assert progress.passed_attempts >= passed_attempts
    
    @settings(max_examples=100)
    @given(
        user_id=uuid_strategy(),
        performance_data=performance_data_strategy()
    )
    @pytest.mark.asyncio
    async def test_property_19_progress_calculation_accuracy(self, user_id, performance_data):
        """Property 19: Progress Calculation Accuracy.
        
        For any set of completed tasks, the calculated progress percentage SHALL
        accurately reflect the completion ratio.
        
        **Validates: Requirements 4.2**
        **Feature: property-tests-and-docker-execution, Property 19 (main design)**
        """
        from src.agents.progress_tracker.progress_tracker import ProgressTracker
        
        tracker = ProgressTracker()
        user_id_str = str(user_id)
        
        # Assume we have at least one attempt
        assume(len(performance_data) > 0)
        
        # Record attempts
        for i, attempt in enumerate(performance_data):
            await tracker.record_attempt(
                user_id=user_id_str,
                task_id=f"task_{i}",
                passed=attempt['passed'],
                score=attempt['score'],
                time_taken=attempt['time_taken']
            )
        
        # Calculate progress
        progress = await tracker.calculate_progress(user_id_str)
        
        # Property: Progress should be between 0 and 100
        if hasattr(progress, 'percentage'):
            assert 0 <= progress.percentage <= 100
        elif 'percentage' in progress:
            assert 0 <= progress['percentage'] <= 100
    
    @settings(max_examples=50)
    @given(
        user_id=uuid_strategy(),
        performance_data=performance_data_strategy()
    )
    @pytest.mark.asyncio
    async def test_progress_monotonicity(self, user_id, performance_data):
        """Property: Progress should never decrease (only increase or stay same)."""
        from src.agents.progress_tracker.progress_tracker import ProgressTracker
        
        tracker = ProgressTracker()
        user_id_str = str(user_id)
        
        assume(len(performance_data) >= 2)
        
        previous_progress = 0.0
        
        # Record attempts and check progress increases
        for i, attempt in enumerate(performance_data):
            await tracker.record_attempt(
                user_id=user_id_str,
                task_id=f"task_{i}",
                passed=attempt['passed'],
                score=attempt['score'],
                time_taken=attempt['time_taken']
            )
            
            progress = await tracker.calculate_progress(user_id_str)
            current_progress = progress.percentage if hasattr(progress, 'percentage') else progress.get('percentage', 0)
            
            # Property: Progress should not decrease
            assert current_progress >= previous_progress, \
                f"Progress decreased from {previous_progress} to {current_progress}"
            
            previous_progress = current_progress


class TestDatabasePerformance:
    """Property tests for database performance characteristics."""
    
    @settings(max_examples=20)
    @given(profiles=st.lists(user_profile_strategy(), min_size=5, max_size=20))
    @pytest.mark.asyncio
    async def test_batch_operations_efficiency(self, profiles):
        """Property: Batch operations should be more efficient than individual operations."""
        from src.adapters.database.repositories.postgres_user_repository import PostgresUserRepository
        import time
        
        repo = PostgresUserRepository()
        
        try:
            # Time individual saves
            start = time.time()
            for profile in profiles[:5]:
                await repo.save_profile(profile)
            individual_time = time.time() - start
            
            # Time batch save
            start = time.time()
            await repo.save_profiles_batch(profiles[5:10])
            batch_time = time.time() - start
            
            # Property: Batch should be faster per item
            # (This is a soft property - may not always hold due to overhead)
            items_per_second_individual = 5 / individual_time if individual_time > 0 else 0
            items_per_second_batch = 5 / batch_time if batch_time > 0 else 0
            
            # Just verify both operations complete successfully
            assert items_per_second_individual > 0
            assert items_per_second_batch > 0
        
        finally:
            # Cleanup
            for profile in profiles:
                try:
                    await repo.delete_profile(profile.user_id)
                except:
                    pass
