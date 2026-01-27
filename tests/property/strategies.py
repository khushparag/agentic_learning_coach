"""
Custom Hypothesis strategies for generating domain objects.

This module provides strategies for:
- UserProfile: Valid user profiles with skill levels and goals
- LearningPlan: Learning plans with modules and tasks
- CodeSubmission: Code submissions with valid code and test cases
- Other domain entities
"""

from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID, uuid4

from hypothesis import strategies as st

from src.domain.entities.learning_plan import LearningPlan
from src.domain.entities.module import Module
from src.domain.entities.submission import Submission
from src.domain.entities.task import Task
from src.domain.entities.user_profile import UserProfile
from src.domain.value_objects.enums import SkillLevel, TaskType, LearningPlanStatus

# Basic strategies

@st.composite
def uuid_strategy(draw: st.DrawFn) -> UUID:
    """Generate valid UUIDs."""
    return uuid4()


@st.composite
def skill_level_strategy(draw: st.DrawFn) -> SkillLevel:
    """Generate valid skill levels."""
    return draw(st.sampled_from(list(SkillLevel)))


@st.composite
def programming_language_strategy(draw: st.DrawFn) -> str:
    """Generate valid programming languages."""
    return draw(st.sampled_from(["python", "javascript", "typescript", "java", "go"]))


@st.composite
def topic_strategy(draw: st.DrawFn) -> str:
    """Generate valid learning topics."""
    topics = [
        "variables",
        "functions",
        "loops",
        "conditionals",
        "data-structures",
        "algorithms",
        "oop",
        "async-programming",
        "testing",
        "debugging",
        "react",
        "typescript",
        "python-basics",
        "javascript-basics",
    ]
    return draw(st.sampled_from(topics))


# Domain entity strategies

@st.composite
def user_profile_strategy(draw: st.DrawFn) -> UserProfile:
    """Generate valid user profiles."""
    user_id = str(draw(uuid_strategy()))
    skill_level = draw(skill_level_strategy())
    learning_goals = draw(st.lists(topic_strategy(), min_size=1, max_size=5))
    time_constraints = draw(
        st.dictionaries(
            st.sampled_from(["hours_per_week", "preferred_times", "daily_commitment"]),
            st.one_of(
                st.integers(min_value=1, max_value=40),
                st.lists(st.sampled_from(["morning", "afternoon", "evening"]), min_size=1, max_size=3),
            ),
            min_size=1,
            max_size=3,
        )
    )
    preferences = draw(
        st.dictionaries(
            st.text(min_size=1, max_size=20, alphabet=st.characters(whitelist_categories=("Lu", "Ll"))),
            st.one_of(st.text(max_size=50), st.booleans(), st.integers()),
            min_size=0,
            max_size=10,
        )
    )

    return UserProfile(
        user_id=user_id,
        skill_level=skill_level,
        learning_goals=learning_goals,
        time_constraints=time_constraints,
        preferences=preferences,
    )


@st.composite
def task_strategy(draw: st.DrawFn, module_id: Optional[str] = None) -> Task:
    """Generate valid tasks."""
    if module_id is None:
        module_id = str(draw(uuid_strategy()))

    day_offset = draw(st.integers(min_value=0, max_value=100))
    task_type = draw(st.sampled_from(list(TaskType)))
    description = draw(st.text(min_size=10, max_size=500))
    estimated_minutes = draw(st.integers(min_value=5, max_value=240))
    completion_criteria = draw(st.text(min_size=10, max_size=200))
    resources = draw(
        st.lists(
            st.fixed_dictionaries({
                "title": st.text(min_size=5, max_size=100),
                "url": st.from_regex(r"https?://[a-z]+\.[a-z]{2,3}/[a-z]+", fullmatch=True),
                "type": st.sampled_from(["article", "video", "documentation", "tutorial"]),
            }),
            max_size=3,
        )
    )

    return Task(
        module_id=module_id,
        day_offset=day_offset,
        task_type=task_type,
        description=description,
        estimated_minutes=estimated_minutes,
        completion_criteria=completion_criteria,
        resources=resources,
    )


@st.composite
def module_strategy(draw: st.DrawFn, plan_id: Optional[str] = None) -> Module:
    """Generate valid modules."""
    if plan_id is None:
        plan_id = str(draw(uuid_strategy()))

    title = draw(st.text(min_size=5, max_size=100))
    order_index = draw(st.integers(min_value=0, max_value=100))
    summary = draw(st.text(min_size=10, max_size=500))
    
    # Generate tasks with unique day_offsets
    num_tasks = draw(st.integers(min_value=1, max_value=5))
    tasks = []
    used_offsets = set()
    for _ in range(num_tasks):
        offset = draw(st.integers(min_value=0, max_value=100).filter(lambda x: x not in used_offsets))
        used_offsets.add(offset)
        task = Task(
            module_id=str(uuid4()),  # Will be updated when added to module
            day_offset=offset,
            task_type=draw(st.sampled_from(list(TaskType))),
            description=draw(st.text(min_size=10, max_size=200)),
            estimated_minutes=draw(st.integers(min_value=5, max_value=120)),
            completion_criteria=draw(st.text(min_size=10, max_size=100)),
        )
        tasks.append(task)

    module = Module(
        plan_id=plan_id,
        title=title,
        order_index=order_index,
        summary=summary,
    )
    
    # Add tasks to module
    for task in tasks:
        task.module_id = module.id
        module.tasks.append(task)
    
    return module


@st.composite
def learning_plan_strategy(draw: st.DrawFn) -> LearningPlan:
    """Generate valid learning plans."""
    user_id = str(draw(uuid_strategy()))
    title = draw(st.text(min_size=5, max_size=100))
    goal_description = draw(st.text(min_size=10, max_size=500))
    total_days = draw(st.integers(min_value=1, max_value=365))
    status = draw(st.sampled_from(list(LearningPlanStatus)))
    
    # Generate modules with unique order_indices
    num_modules = draw(st.integers(min_value=1, max_value=5))
    modules = []
    used_indices = set()
    for _ in range(num_modules):
        index = draw(st.integers(min_value=0, max_value=20).filter(lambda x: x not in used_indices))
        used_indices.add(index)
        module = Module(
            plan_id=str(uuid4()),  # Will be updated when added to plan
            title=draw(st.text(min_size=5, max_size=100)),
            order_index=index,
            summary=draw(st.text(min_size=10, max_size=200)),
        )
        modules.append(module)

    plan = LearningPlan(
        user_id=user_id,
        title=title,
        goal_description=goal_description,
        total_days=total_days,
        status=status,
    )
    
    # Add modules to plan
    for module in modules:
        module.plan_id = plan.id
        plan.modules.append(module)
    
    return plan


@st.composite
def code_submission_strategy(draw: st.DrawFn) -> Submission:
    """Generate valid code submissions."""
    user_id = str(draw(uuid_strategy()))
    task_id = str(draw(uuid_strategy()))
    language = draw(programming_language_strategy())

    # Generate simple valid code based on language
    if language == "python":
        code = draw(
            st.sampled_from(
                [
                    "def hello():\n    return 'Hello, World!'",
                    "x = 42\nprint(x)",
                    "def add(a, b):\n    return a + b",
                ]
            )
        )
    elif language in ["javascript", "typescript"]:
        code = draw(
            st.sampled_from(
                [
                    "function hello() { return 'Hello, World!'; }",
                    "const x = 42; console.log(x);",
                    "const add = (a, b) => a + b;",
                ]
            )
        )
    else:
        code = draw(st.text(min_size=10, max_size=500))

    return Submission(
        user_id=user_id,
        task_id=task_id,
        code_content=code,
    )

# Strategies for malicious code patterns (for security testing)

@st.composite
def malicious_code_strategy(draw: st.DrawFn) -> str:
    """Generate code with potentially malicious patterns."""
    patterns = [
        "eval('malicious code')",
        "exec('dangerous')",
        "import os; os.system('rm -rf /')",
        "while True: pass",
        "__import__('os').system('ls')",
        "open('/etc/passwd').read()",
        "subprocess.call(['rm', '-rf', '/'])",
    ]
    return draw(st.sampled_from(patterns))


@st.composite
def safe_code_strategy(draw: st.DrawFn, language: str = "python") -> str:
    """Generate safe, valid code."""
    if language == "python":
        safe_patterns = [
            "def add(a, b):\n    return a + b",
            "x = [1, 2, 3]\nprint(sum(x))",
            "class MyClass:\n    def __init__(self):\n        self.value = 42",
            "for i in range(10):\n    print(i)",
        ]
    elif language in ["javascript", "typescript"]:
        safe_patterns = [
            "function add(a, b) { return a + b; }",
            "const x = [1, 2, 3]; console.log(x.reduce((a,b) => a+b));",
            "class MyClass { constructor() { this.value = 42; } }",
            "for (let i = 0; i < 10; i++) { console.log(i); }",
        ]
    else:
        safe_patterns = ["// Safe code"]

    return draw(st.sampled_from(safe_patterns))


# Strategies for agent testing

@st.composite
def user_input_strategy(draw: st.DrawFn) -> str:
    """Generate realistic user input for goal extraction."""
    goals = [
        "I want to learn React",
        "Help me understand Python decorators",
        "I need to build a REST API with FastAPI",
        "Teach me about async programming in JavaScript",
        "I want to master TypeScript",
        "Help me learn data structures and algorithms",
    ]
    return draw(st.sampled_from(goals))


@st.composite
def clarifying_question_strategy(draw: st.DrawFn) -> str:
    """Generate clarifying questions for profile assessment."""
    questions = [
        "What is your current skill level?",
        "How many hours per week can you dedicate to learning?",
        "Do you prefer hands-on practice or theory first?",
        "What is your learning goal?",
    ]
    return draw(st.sampled_from(questions))


@st.composite
def curriculum_strategy(draw: st.DrawFn) -> dict:
    """Generate curriculum data for testing."""
    num_modules = draw(st.integers(min_value=3, max_value=10))
    modules = []
    
    for i in range(num_modules):
        modules.append({
            'title': draw(st.text(min_size=10, max_size=50)),
            'order_index': i,
            'difficulty': draw(st.integers(min_value=1, max_value=10)),
            'has_mini_project': draw(st.booleans()),
            'tasks': draw(st.lists(
                st.fixed_dictionaries({
                    'title': st.text(min_size=5, max_size=30),
                    'type': st.sampled_from(['reading', 'exercise', 'project', 'quiz']),
                    'estimated_minutes': st.integers(min_value=5, max_value=120)
                }),
                min_size=1,
                max_size=5
            ))
        })
    
    return {
        'title': draw(st.text(min_size=10, max_size=100)),
        'modules': modules,
        'total_days': draw(st.integers(min_value=7, max_value=90))
    }


@st.composite
def performance_data_strategy(draw: st.DrawFn) -> list:
    """Generate performance data for adaptation testing."""
    num_attempts = draw(st.integers(min_value=1, max_value=10))
    attempts = []
    
    for _ in range(num_attempts):
        attempts.append({
            'passed': draw(st.booleans()),
            'score': draw(st.floats(min_value=0.0, max_value=1.0)),
            'time_taken': draw(st.integers(min_value=30, max_value=600)),
            'hints_used': draw(st.integers(min_value=0, max_value=3))
        })
    
    return attempts


@st.composite
def resource_query_strategy(draw: st.DrawFn) -> dict:
    """Generate resource search queries."""
    topics = [
        "React hooks",
        "Python decorators",
        "JavaScript promises",
        "TypeScript generics",
        "REST API design",
        "Database normalization"
    ]
    
    return {
        'query': draw(st.sampled_from(topics)),
        'skill_level': draw(skill_level_strategy()),
        'content_type': draw(st.sampled_from(['article', 'video', 'documentation', 'tutorial']))
    }
