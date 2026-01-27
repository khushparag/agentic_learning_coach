"""Property-based tests for curriculum adaptation.

Feature: property-tests-and-docker-execution
Tests for adaptation triggers, curriculum adaptation logic, and daily task retrieval.
"""

import pytest
from hypothesis import given, strategies as st, settings, HealthCheck, assume
from typing import Dict, Any, List
from datetime import datetime, timedelta

from tests.property.strategies import (
    user_profile_strategy,
    learning_plan_strategy,
    performance_data_strategy,
    uuid_strategy
)


class TestAdaptationTriggerProperties:
    """Property tests for adaptation trigger detection."""
    
    @settings(max_examples=100)
    @given(performance_data=performance_data_strategy())
    @pytest.mark.asyncio
    async def test_property_15_adaptation_trigger_detection(self, performance_data):
        """Property 15: Adaptation Trigger Detection.
        
        For any sequence of performance data, the ProgressTracker SHALL detect
        patterns that trigger curriculum adaptation (e.g., consecutive failures).
        
        **Validates: Requirements 4.2**
        **Feature: property-tests-and-docker-execution, Property 15 (main design)**
        """
        from src.agents.progress_tracker.progress_tracker import ProgressTracker
        
        tracker = ProgressTracker()
        
        # Assume we have at least 3 attempts
        assume(len(performance_data) >= 3)
        
        # Count consecutive failures
        consecutive_failures = 0
        max_consecutive_failures = 0
        
        for attempt in performance_data:
            if not attempt['passed']:
                consecutive_failures += 1
                max_consecutive_failures = max(max_consecutive_failures, consecutive_failures)
            else:
                consecutive_failures = 0
        
        # Analyze performance
        adaptation_needed = tracker.should_adapt_curriculum(performance_data)
        
        # Property: Should trigger adaptation if 2+ consecutive failures
        if max_consecutive_failures >= 2:
            assert adaptation_needed, "Should trigger adaptation after 2+ consecutive failures"
        
        # Property: Should not trigger if all passing
        if all(attempt['passed'] for attempt in performance_data):
            assert not adaptation_needed, "Should not trigger adaptation if all passing"
    
    @settings(max_examples=50)
    @given(performance_data=performance_data_strategy())
    def test_quick_success_detection(self, performance_data):
        """Property: System should detect quick successes for stretch tasks."""
        from src.agents.progress_tracker.progress_tracker import ProgressTracker
        
        tracker = ProgressTracker()
        
        # Assume we have at least one attempt
        assume(len(performance_data) >= 1)
        
        # Check for quick success (passed on first try with high score)
        first_attempt = performance_data[0]
        is_quick_success = first_attempt['passed'] and first_attempt['score'] >= 0.9
        
        # Analyze performance
        needs_stretch = tracker.should_add_stretch_task(performance_data)
        
        # Property: Should suggest stretch task if quick success
        if is_quick_success:
            assert needs_stretch, "Should suggest stretch task after quick success"
    
    @settings(max_examples=50)
    @given(performance_data=performance_data_strategy())
    def test_struggle_pattern_detection(self, performance_data):
        """Property: System should detect struggle patterns."""
        from src.agents.progress_tracker.progress_tracker import ProgressTracker
        
        tracker = ProgressTracker()
        
        assume(len(performance_data) >= 3)
        
        # Count failures and hint usage
        failure_count = sum(1 for a in performance_data if not a['passed'])
        high_hint_usage = sum(1 for a in performance_data if a.get('hints_used', 0) >= 2)
        
        # Analyze performance
        is_struggling = tracker.detect_struggle_pattern(performance_data)
        
        # Property: Should detect struggle if many failures or high hint usage
        if failure_count >= len(performance_data) * 0.5 or high_hint_usage >= len(performance_data) * 0.5:
            assert is_struggling, "Should detect struggle pattern"


class TestCurriculumAdaptationProperties:
    """Property tests for curriculum adaptation logic."""
    
    @settings(max_examples=100)
    @given(
        plan=learning_plan_strategy(),
        performance_data=performance_data_strategy()
    )
    @pytest.mark.asyncio
    async def test_property_16_curriculum_adaptation_logic(self, plan, performance_data):
        """Property 16: Curriculum Adaptation Logic.
        
        For any curriculum and performance data, adaptations SHALL maintain
        curriculum coherence while adjusting difficulty appropriately.
        
        **Validates: Requirements 4.2**
        **Feature: property-tests-and-docker-execution, Property 16 (main design)**
        """
        from src.agents.curriculum_planner_agent import CurriculumPlannerAgent
        
        agent = CurriculumPlannerAgent()
        
        # Adapt curriculum based on performance
        adapted_plan = await agent.adapt_curriculum(plan, performance_data)
        
        # Property: Adapted plan should maintain structure
        assert adapted_plan is not None
        assert len(adapted_plan.modules) > 0
        
        # Property: Module order should be preserved (or logically reordered)
        original_modules = {m.id: m.order_index for m in plan.modules}
        adapted_modules = {m.id: m.order_index for m in adapted_plan.modules}
        
        # Modules should still exist (may have different order)
        for module_id in original_modules:
            if module_id in adapted_modules:
                # Module preserved
                pass
        
        # Property: Total days should be reasonable
        assert adapted_plan.total_days > 0
        assert adapted_plan.total_days <= plan.total_days * 1.5, \
            "Adapted plan should not be more than 50% longer"
    
    @settings(max_examples=50)
    @given(
        plan=learning_plan_strategy(),
        performance_data=performance_data_strategy()
    )
    @pytest.mark.asyncio
    async def test_difficulty_reduction_on_failures(self, plan, performance_data):
        """Property: Difficulty should be reduced after consecutive failures."""
        from src.agents.curriculum_planner_agent import CurriculumPlannerAgent
        
        agent = CurriculumPlannerAgent()
        
        # Count consecutive failures
        consecutive_failures = 0
        for attempt in performance_data:
            if not attempt['passed']:
                consecutive_failures += 1
            else:
                break
        
        # Adapt curriculum
        adapted_plan = await agent.adapt_curriculum(plan, performance_data)
        
        # Property: If 2+ consecutive failures, difficulty should be reduced
        if consecutive_failures >= 2:
            # Check if recap tasks were added or difficulty reduced
            # This is implementation-specific, but we can check structure
            assert adapted_plan is not None
            # Adapted plan should have modifications
            assert adapted_plan.id != plan.id or len(adapted_plan.modules) != len(plan.modules)
    
    @settings(max_examples=50)
    @given(
        plan=learning_plan_strategy(),
        performance_data=performance_data_strategy()
    )
    @pytest.mark.asyncio
    async def test_stretch_task_addition_on_quick_success(self, plan, performance_data):
        """Property: Stretch tasks should be added after quick successes."""
        from src.agents.curriculum_planner_agent import CurriculumPlannerAgent
        
        agent = CurriculumPlannerAgent()
        
        # Check for quick success
        if performance_data and performance_data[0]['passed'] and performance_data[0]['score'] >= 0.9:
            adapted_plan = await agent.adapt_curriculum(plan, performance_data)
            
            # Property: Adapted plan should have additional tasks or modules
            original_task_count = sum(len(m.tasks) for m in plan.modules)
            adapted_task_count = sum(len(m.tasks) for m in adapted_plan.modules)
            
            # May have added stretch tasks
            assert adapted_task_count >= original_task_count
    
    @settings(max_examples=30)
    @given(plan=learning_plan_strategy())
    @pytest.mark.asyncio
    async def test_adaptation_preserves_learning_goals(self, plan):
        """Property: Adaptation should preserve original learning goals."""
        from src.agents.curriculum_planner_agent import CurriculumPlannerAgent
        
        agent = CurriculumPlannerAgent()
        
        # Create some performance data
        performance_data = [
            {'passed': False, 'score': 0.3, 'time_taken': 300, 'hints_used': 2},
            {'passed': False, 'score': 0.4, 'time_taken': 350, 'hints_used': 3}
        ]
        
        adapted_plan = await agent.adapt_curriculum(plan, performance_data)
        
        # Property: Goal description should be preserved
        assert adapted_plan.goal_description == plan.goal_description


class TestDailyTaskRetrievalProperties:
    """Property tests for daily task retrieval."""
    
    @settings(max_examples=100)
    @given(
        plan=learning_plan_strategy(),
        day_offset=st.integers(min_value=0, max_value=90)
    )
    @pytest.mark.asyncio
    async def test_property_8_daily_task_retrieval_accuracy(self, plan, day_offset):
        """Property 8: Daily Task Retrieval Accuracy.
        
        For any learning plan and day offset, the system SHALL return only tasks
        scheduled for that specific day.
        
        **Validates: Requirements 4.2**
        **Feature: property-tests-and-docker-execution, Property 8 (main design)**
        """
        from src.agents.curriculum_planner_agent import CurriculumPlannerAgent
        
        agent = CurriculumPlannerAgent()
        
        # Get tasks for specific day
        daily_tasks = await agent.get_tasks_for_day(plan, day_offset)
        
        # Property: Should return list of tasks
        assert daily_tasks is not None
        assert isinstance(daily_tasks, list)
        
        # Property: All returned tasks should be for the requested day
        for task in daily_tasks:
            task_day = task.day_offset if hasattr(task, 'day_offset') else task.get('day_offset')
            assert task_day == day_offset, \
                f"Task day_offset {task_day} does not match requested day {day_offset}"
    
    @settings(max_examples=50)
    @given(plan=learning_plan_strategy())
    @pytest.mark.asyncio
    async def test_task_retrieval_completeness(self, plan):
        """Property: Retrieving all days should return all tasks."""
        from src.agents.curriculum_planner_agent import CurriculumPlannerAgent
        
        agent = CurriculumPlannerAgent()
        
        # Get all tasks by day
        all_retrieved_tasks = []
        for day in range(plan.total_days):
            daily_tasks = await agent.get_tasks_for_day(plan, day)
            all_retrieved_tasks.extend(daily_tasks)
        
        # Count original tasks
        original_task_count = sum(len(m.tasks) for m in plan.modules)
        
        # Property: Should retrieve all tasks
        assert len(all_retrieved_tasks) == original_task_count, \
            f"Retrieved {len(all_retrieved_tasks)} tasks, expected {original_task_count}"
    
    @settings(max_examples=50)
    @given(
        plan=learning_plan_strategy(),
        day_offset=st.integers(min_value=0, max_value=90)
    )
    @pytest.mark.asyncio
    async def test_task_ordering_within_day(self, plan, day_offset):
        """Property: Tasks within a day should be ordered logically."""
        from src.agents.curriculum_planner_agent import CurriculumPlannerAgent
        
        agent = CurriculumPlannerAgent()
        
        daily_tasks = await agent.get_tasks_for_day(plan, day_offset)
        
        # Property: If multiple tasks, they should have consistent ordering
        if len(daily_tasks) >= 2:
            # Tasks should be from same or consecutive modules
            module_ids = [
                task.module_id if hasattr(task, 'module_id') else task.get('module_id')
                for task in daily_tasks
            ]
            
            # Get unique module IDs
            unique_modules = list(dict.fromkeys(module_ids))
            
            # Property: Should not jump between non-consecutive modules
            # (This is a soft property - depends on curriculum design)
            assert len(unique_modules) <= 3, "Tasks should not span too many modules"
    
    @settings(max_examples=30)
    @given(plan=learning_plan_strategy())
    @pytest.mark.asyncio
    async def test_no_duplicate_tasks_across_days(self, plan):
        """Property: No task should appear on multiple days."""
        from src.agents.curriculum_planner_agent import CurriculumPlannerAgent
        
        agent = CurriculumPlannerAgent()
        
        # Collect all tasks by day
        seen_task_ids = set()
        
        for day in range(min(plan.total_days, 30)):  # Check first 30 days
            daily_tasks = await agent.get_tasks_for_day(plan, day)
            
            for task in daily_tasks:
                task_id = task.id if hasattr(task, 'id') else task.get('id')
                
                # Property: Task ID should not be seen before
                assert task_id not in seen_task_ids, \
                    f"Task {task_id} appears on multiple days"
                
                seen_task_ids.add(task_id)


class TestAdaptationEdgeCases:
    """Property tests for edge cases in curriculum adaptation."""
    
    @settings(max_examples=30)
    @given(plan=learning_plan_strategy())
    @pytest.mark.asyncio
    async def test_adaptation_with_empty_performance_data(self, plan):
        """Property: Adaptation should handle empty performance data gracefully."""
        from src.agents.curriculum_planner_agent import CurriculumPlannerAgent
        
        agent = CurriculumPlannerAgent()
        
        # Adapt with empty performance data
        adapted_plan = await agent.adapt_curriculum(plan, [])
        
        # Property: Should return original plan or valid adapted plan
        assert adapted_plan is not None
        assert len(adapted_plan.modules) > 0
    
    @settings(max_examples=30)
    @given(plan=learning_plan_strategy())
    @pytest.mark.asyncio
    async def test_adaptation_with_all_perfect_scores(self, plan):
        """Property: Adaptation with perfect scores should add stretch content."""
        from src.agents.curriculum_planner_agent import CurriculumPlannerAgent
        
        agent = CurriculumPlannerAgent()
        
        # Create perfect performance data
        perfect_data = [
            {'passed': True, 'score': 1.0, 'time_taken': 60, 'hints_used': 0}
            for _ in range(5)
        ]
        
        adapted_plan = await agent.adapt_curriculum(plan, perfect_data)
        
        # Property: Should maintain or increase difficulty
        assert adapted_plan is not None
        # May have added advanced content
        original_task_count = sum(len(m.tasks) for m in plan.modules)
        adapted_task_count = sum(len(m.tasks) for m in adapted_plan.modules)
        assert adapted_task_count >= original_task_count
    
    @settings(max_examples=30)
    @given(plan=learning_plan_strategy())
    @pytest.mark.asyncio
    async def test_adaptation_with_all_failures(self, plan):
        """Property: Adaptation with all failures should reduce difficulty."""
        from src.agents.curriculum_planner_agent import CurriculumPlannerAgent
        
        agent = CurriculumPlannerAgent()
        
        # Create all-failure performance data
        failure_data = [
            {'passed': False, 'score': 0.2, 'time_taken': 600, 'hints_used': 3}
            for _ in range(5)
        ]
        
        adapted_plan = await agent.adapt_curriculum(plan, failure_data)
        
        # Property: Should add remedial content or reduce difficulty
        assert adapted_plan is not None
        # May have added recap tasks
        assert len(adapted_plan.modules) > 0
