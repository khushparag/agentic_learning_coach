"""
API models for code submission and evaluation endpoints.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


class SubmitCodeRequest(BaseModel):
    """Request model for submitting code for evaluation."""
    
    task_id: str = Field(..., description="Task ID for this submission")
    code: str = Field(
        ...,
        min_length=1,
        max_length=50000,
        description="Code content to evaluate"
    )
    language: str = Field(
        default="python",
        description="Programming language of the code"
    )
    
    @field_validator("code")
    @classmethod
    def validate_code(cls, v: str) -> str:
        """Validate code is not empty."""
        if not v.strip():
            raise ValueError("Code cannot be empty or whitespace only")
        return v
    
    @field_validator("language")
    @classmethod
    def validate_language(cls, v: str) -> str:
        """Validate language is supported."""
        supported = {"python", "javascript", "typescript", "java", "go", "rust", "cpp", "c"}
        if v.lower() not in supported:
            raise ValueError(f"Unsupported language: {v}. Supported: {supported}")
        return v.lower()
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "task_id": "task_abc123",
                "code": "def greeting(name):\n    return f'Hello, {name}!'",
                "language": "python"
            }
        }
    }


class TestResultResponse(BaseModel):
    """Response model for a single test result."""
    
    name: str = Field(..., description="Test case name")
    passed: bool = Field(..., description="Whether the test passed")
    expected_output: Optional[str] = Field(None, description="Expected output")
    actual_output: Optional[str] = Field(None, description="Actual output")
    execution_time_ms: Optional[float] = Field(None, description="Execution time in milliseconds")
    error_message: Optional[str] = Field(None, description="Error message if test failed")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "test_greeting_basic",
                "passed": True,
                "expected_output": "Hello, World!",
                "actual_output": "Hello, World!",
                "execution_time_ms": 5.2,
                "error_message": None
            }
        }
    }


class FeedbackIssue(BaseModel):
    """Model for a specific feedback issue."""
    
    line: Optional[int] = Field(None, description="Line number where issue occurs")
    problem: str = Field(..., description="Description of the problem")
    why: str = Field(..., description="Explanation of why this is a problem")
    how_to_fix: str = Field(..., description="Suggestion for how to fix")
    severity: str = Field(
        default="medium",
        description="Issue severity (low, medium, high)"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "line": 15,
                "problem": "Missing null check",
                "why": "The input could be null, causing a runtime error",
                "how_to_fix": "Add 'if input is None: return' before processing",
                "severity": "high"
            }
        }
    }


class FeedbackResponse(BaseModel):
    """Response model for detailed feedback."""
    
    overall_assessment: str = Field(..., description="Overall assessment summary")
    strengths: List[str] = Field(default_factory=list, description="What was done well")
    issues: List[FeedbackIssue] = Field(default_factory=list, description="Issues found")
    suggestions: List[str] = Field(
        default_factory=list,
        description="Improvement suggestions"
    )
    next_steps: List[str] = Field(
        default_factory=list,
        description="Recommended next steps"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "overall_assessment": "Good implementation with room for improvement",
                "strengths": [
                    "Clear function naming",
                    "Correct logic implementation"
                ],
                "issues": [
                    {
                        "line": 5,
                        "problem": "No input validation",
                        "why": "Function may fail with unexpected input types",
                        "how_to_fix": "Add type checking at the start of the function",
                        "severity": "medium"
                    }
                ],
                "suggestions": [
                    "Consider adding docstrings",
                    "Use type hints for better code clarity"
                ],
                "next_steps": [
                    "Review error handling patterns",
                    "Practice with more complex inputs"
                ]
            }
        }
    }


class QualityAnalysisResponse(BaseModel):
    """Response model for code quality analysis."""
    
    readability_score: float = Field(..., ge=0, le=1, description="Readability score (0-1)")
    structure_score: float = Field(..., ge=0, le=1, description="Structure score (0-1)")
    best_practices_score: float = Field(..., ge=0, le=1, description="Best practices score (0-1)")
    complexity_score: float = Field(..., ge=0, le=1, description="Complexity score (0-1)")
    overall_quality_score: float = Field(..., ge=0, le=1, description="Overall quality score (0-1)")
    quality_rating: str = Field(..., description="Quality rating (poor, fair, good, excellent)")
    issues_count: int = Field(default=0, description="Number of issues found")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "readability_score": 0.85,
                "structure_score": 0.90,
                "best_practices_score": 0.75,
                "complexity_score": 0.80,
                "overall_quality_score": 0.82,
                "quality_rating": "good",
                "issues_count": 2
            }
        }
    }


class EvaluationResponse(BaseModel):
    """Response model for code evaluation result."""
    
    submission_id: str = Field(..., description="Submission unique identifier")
    task_id: str = Field(..., description="Task ID")
    passed: bool = Field(..., description="Whether the submission passed")
    score: float = Field(..., ge=0, le=100, description="Score (0-100)")
    execution_status: str = Field(..., description="Execution status")
    execution_time_ms: float = Field(..., description="Total execution time in milliseconds")
    test_results: List[TestResultResponse] = Field(
        default_factory=list,
        description="Individual test results"
    )
    tests_passed: int = Field(default=0, description="Number of tests passed")
    tests_total: int = Field(default=0, description="Total number of tests")
    feedback: FeedbackResponse = Field(..., description="Detailed feedback")
    quality_analysis: Optional[QualityAnalysisResponse] = Field(
        None,
        description="Code quality analysis"
    )
    output: Optional[str] = Field(None, description="Program output")
    errors: Optional[List[str]] = Field(None, description="Execution errors")
    evaluated_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "submission_id": "sub_xyz789",
                "task_id": "task_abc123",
                "passed": True,
                "score": 85.0,
                "execution_status": "success",
                "execution_time_ms": 125.5,
                "test_results": [
                    {
                        "name": "test_basic",
                        "passed": True,
                        "expected_output": "Hello, World!",
                        "actual_output": "Hello, World!",
                        "execution_time_ms": 5.2,
                        "error_message": None
                    }
                ],
                "tests_passed": 3,
                "tests_total": 3,
                "feedback": {
                    "overall_assessment": "Excellent work!",
                    "strengths": ["Clean code", "All tests passing"],
                    "issues": [],
                    "suggestions": ["Consider adding comments"],
                    "next_steps": ["Move to the next task"]
                },
                "quality_analysis": {
                    "readability_score": 0.9,
                    "structure_score": 0.85,
                    "best_practices_score": 0.8,
                    "complexity_score": 0.95,
                    "overall_quality_score": 0.87,
                    "quality_rating": "good",
                    "issues_count": 0
                },
                "output": "Hello, World!",
                "errors": None,
                "evaluated_at": "2024-01-15T10:30:00Z"
            }
        }
    }


class SubmissionResponse(BaseModel):
    """Response model for a submission record."""
    
    id: str = Field(..., description="Submission unique identifier")
    task_id: str = Field(..., description="Task ID")
    user_id: str = Field(..., description="User ID")
    language: str = Field(..., description="Programming language")
    status: str = Field(..., description="Submission status (PASS, FAIL, PARTIAL)")
    score: Optional[float] = Field(None, description="Score if evaluated")
    submitted_at: datetime = Field(..., description="Submission timestamp")
    evaluated_at: Optional[datetime] = Field(None, description="Evaluation timestamp")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "sub_xyz789",
                "task_id": "task_abc123",
                "user_id": "user_123",
                "language": "python",
                "status": "PASS",
                "score": 85.0,
                "submitted_at": "2024-01-15T10:30:00Z",
                "evaluated_at": "2024-01-15T10:30:05Z"
            }
        }
    }


class SubmissionListResponse(BaseModel):
    """Response model for listing submissions."""
    
    submissions: List[SubmissionResponse] = Field(
        default_factory=list,
        description="List of submissions"
    )
    total: int = Field(default=0, description="Total number of submissions")
    page: int = Field(default=1, description="Current page")
    page_size: int = Field(default=20, description="Items per page")
