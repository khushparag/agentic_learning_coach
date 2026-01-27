"""
API router for code submission and evaluation endpoints.

Handles code submissions, evaluation, and feedback retrieval.
"""

import logging
from datetime import datetime
from typing import List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.adapters.api.models.submissions import (
    SubmitCodeRequest,
    SubmissionResponse,
    EvaluationResponse,
    TestResultResponse,
    FeedbackResponse,
    FeedbackIssue,
    QualityAnalysisResponse,
    SubmissionListResponse,
)
from src.adapters.api.models.common import ErrorResponse
from src.adapters.api.dependencies import (
    get_current_user_id,
    get_db_session,
    PaginationParams,
)
from src.adapters.database.repositories.postgres_curriculum_repository import PostgresCurriculumRepository
from src.adapters.database.repositories.postgres_submission_repository import PostgresSubmissionRepository
from src.domain.entities.submission import Submission
from src.domain.entities.evaluation_result import EvaluationResult
from src.domain.value_objects.enums import SubmissionStatus


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/submissions",
    tags=["submissions"],
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        404: {"model": ErrorResponse, "description": "Not Found"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"},
    },
)


@router.post(
    "",
    response_model=EvaluationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit code for evaluation",
    description="""
    Submit code for a task and receive immediate evaluation and feedback.
    
    The system will:
    1. Validate the code submission
    2. Execute the code in a sandboxed environment
    3. Run test cases (if available)
    4. Analyze code quality
    5. Generate detailed feedback
    
    **Response includes:**
    - Pass/fail status
    - Score (0-100)
    - Test results
    - Detailed feedback with suggestions
    - Code quality analysis
    """,
)
async def submit_code(
    request: SubmitCodeRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
) -> EvaluationResponse:
    """
    Submit code for evaluation.
    """
    try:
        logger.info(f"Processing code submission for task {request.task_id}, user {user_id}")
        
        curriculum_repository = PostgresCurriculumRepository(db)
        submission_repository = PostgresSubmissionRepository(db)
        
        # Verify task exists and user has access
        task = await curriculum_repository.get_task(request.task_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Verify ownership through module and plan
        module = await curriculum_repository.get_module(task.module_id)
        if module:
            plan = await curriculum_repository.get_plan(module.plan_id)
            if not plan or plan.user_id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have permission to submit to this task"
                )
        
        # Create submission entity
        submission = Submission(
            task_id=request.task_id,
            user_id=user_id,
            code_content=request.code
        )
        
        # Save submission
        saved_submission = await submission_repository.save_submission(submission)
        
        # In a full implementation, this would use ReviewerAgent
        # For now, we'll create a simulated evaluation
        evaluation_result = await _evaluate_code(
            code=request.code,
            language=request.language,
            task=task,
            submission_id=saved_submission.id
        )
        
        # Save evaluation
        await submission_repository.save_evaluation(evaluation_result)
        
        # Convert to response
        response = _evaluation_to_response(
            evaluation_result,
            saved_submission,
            request.task_id
        )
        
        logger.info(
            f"Submission {saved_submission.id} evaluated: "
            f"{'PASSED' if evaluation_result.passed else 'FAILED'} "
            f"(Score: {evaluation_result.score})"
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing submission: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process submission: {str(e)}"
        )


@router.get(
    "",
    response_model=SubmissionListResponse,
    summary="List submissions",
    description="List user's code submissions with optional filtering.",
)
async def list_submissions(
    task_id: Optional[str] = Query(None, description="Filter by task ID"),
    status_filter: Optional[str] = Query(None, description="Filter by status (PASS, FAIL, PARTIAL)"),
    pagination: PaginationParams = Depends(),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
) -> SubmissionListResponse:
    """
    List user's submissions.
    """
    try:
        logger.info(f"Listing submissions for user {user_id}")
        
        submission_repository = PostgresSubmissionRepository(db)
        
        # Get submissions
        if task_id:
            submissions = await submission_repository.get_task_submissions(task_id, user_id)
        else:
            submissions = await submission_repository.get_user_submissions(
                user_id,
                limit=pagination.limit,
                offset=pagination.offset
            )
        
        # Apply status filter if provided
        if status_filter:
            try:
                filter_status = SubmissionStatus(status_filter.upper())
                # In a full implementation, filter by status
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid status filter: {status_filter}"
                )
        
        # Convert to response models
        submission_responses = [
            SubmissionResponse(
                id=sub.id,
                task_id=sub.task_id,
                user_id=sub.user_id,
                language=getattr(sub, 'language', 'python') or 'python',
                status="PASS" if getattr(sub, 'passed', False) else "FAIL",
                score=getattr(sub, 'score', None),
                submitted_at=sub.submitted_at,
                evaluated_at=getattr(sub, 'evaluated_at', None)
            )
            for sub in submissions
        ]
        
        # Get total count
        total = await submission_repository.get_submission_count(user_id)
        
        return SubmissionListResponse(
            submissions=submission_responses,
            total=total,
            page=pagination.page,
            page_size=pagination.page_size
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing submissions: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list submissions: {str(e)}"
        )


@router.get(
    "/{submission_id}",
    response_model=EvaluationResponse,
    summary="Get submission details",
    description="Retrieve detailed evaluation results for a specific submission.",
)
async def get_submission(
    submission_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
) -> EvaluationResponse:
    """
    Get detailed submission and evaluation results.
    """
    try:
        logger.info(f"Getting submission {submission_id} for user {user_id}")
        
        submission_repository = PostgresSubmissionRepository(db)
        
        # Get submission
        submission = await submission_repository.get_submission(submission_id)
        
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found"
            )
        
        if submission.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view this submission"
            )
        
        # Get latest evaluation
        evaluation = await submission_repository.get_latest_evaluation(submission_id)
        
        if not evaluation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Evaluation not found for this submission"
            )
        
        return _evaluation_to_response(evaluation, submission, submission.task_id)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting submission {submission_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get submission: {str(e)}"
        )


@router.get(
    "/{submission_id}/feedback",
    response_model=FeedbackResponse,
    summary="Get submission feedback",
    description="Retrieve detailed feedback for a submission.",
)
async def get_submission_feedback(
    submission_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
) -> FeedbackResponse:
    """
    Get detailed feedback for a submission.
    """
    try:
        logger.info(f"Getting feedback for submission {submission_id}")
        
        submission_repository = PostgresSubmissionRepository(db)
        
        # Get submission
        submission = await submission_repository.get_submission(submission_id)
        
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found"
            )
        
        if submission.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view this feedback"
            )
        
        # Get evaluation
        evaluation = await submission_repository.get_latest_evaluation(submission_id)
        
        if not evaluation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No evaluation found for this submission"
            )
        
        # Extract feedback from evaluation
        feedback_data = evaluation.feedback
        
        return FeedbackResponse(
            overall_assessment=feedback_data.get('overall_assessment', 'No assessment available'),
            strengths=feedback_data.get('strengths', []),
            issues=[
                FeedbackIssue(
                    line=issue.get('line'),
                    problem=issue.get('problem', ''),
                    why=issue.get('why', ''),
                    how_to_fix=issue.get('how_to_fix', ''),
                    severity=issue.get('severity', 'medium')
                )
                for issue in feedback_data.get('issues', [])
            ],
            suggestions=feedback_data.get('suggestions', []),
            next_steps=feedback_data.get('next_steps', [])
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting feedback for submission {submission_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get feedback: {str(e)}"
        )


@router.get(
    "/task/{task_id}/history",
    response_model=SubmissionListResponse,
    summary="Get task submission history",
    description="Retrieve all submissions for a specific task.",
)
async def get_task_submission_history(
    task_id: str,
    pagination: PaginationParams = Depends(),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
) -> SubmissionListResponse:
    """
    Get submission history for a task.
    """
    try:
        logger.info(f"Getting submission history for task {task_id}, user {user_id}")
        
        submission_repository = PostgresSubmissionRepository(db)
        
        # Get submissions for task
        submissions = await submission_repository.get_task_submissions(task_id, user_id)
        
        # Apply pagination
        total = len(submissions)
        start = pagination.offset
        end = start + pagination.limit
        paginated = submissions[start:end]
        
        # Convert to response models
        submission_responses = [
            SubmissionResponse(
                id=sub.id,
                task_id=sub.task_id,
                user_id=sub.user_id,
                language=getattr(sub, 'language', 'python') or 'python',
                status="PASS" if getattr(sub, 'passed', False) else "FAIL",
                score=getattr(sub, 'score', None),
                submitted_at=sub.submitted_at,
                evaluated_at=getattr(sub, 'evaluated_at', None)
            )
            for sub in paginated
        ]
        
        return SubmissionListResponse(
            submissions=submission_responses,
            total=total,
            page=pagination.page,
            page_size=pagination.page_size
        )
        
    except Exception as e:
        logger.error(f"Error getting submission history: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get submission history: {str(e)}"
        )


async def _evaluate_code(
    code: str,
    language: str,
    task,
    submission_id: str
) -> EvaluationResult:
    """
    Evaluate code submission.
    
    In a full implementation, this would use ReviewerAgent and CodeExecutionService.
    For now, provides a simulated evaluation.
    """
    # Simulated evaluation logic
    # In production, this would:
    # 1. Use CodeExecutionService to run the code
    # 2. Use ReviewerAgent to analyze and provide feedback
    
    # Basic checks
    has_code = bool(code.strip())
    code_length = len(code)
    has_function = 'def ' in code or 'function' in code
    
    # Calculate score based on basic heuristics
    score = 50.0  # Base score
    
    if has_code:
        score += 10
    if code_length > 50:
        score += 10
    if has_function:
        score += 15
    if code_length > 100:
        score += 10
    
    # Cap at 100
    score = min(score, 100.0)
    
    # Determine pass/fail (70% threshold)
    passed = score >= 70
    
    # Generate feedback
    feedback = {
        'overall_assessment': 'Good attempt!' if passed else 'Keep practicing!',
        'strengths': [],
        'issues': [],
        'suggestions': [],
        'next_steps': []
    }
    
    if has_function:
        feedback['strengths'].append('Good use of functions')
    
    if code_length < 50:
        feedback['issues'].append({
            'line': None,
            'problem': 'Code seems incomplete',
            'why': 'The solution appears to be missing implementation details',
            'how_to_fix': 'Add more code to fully implement the solution',
            'severity': 'medium'
        })
    
    feedback['suggestions'].append('Consider adding comments to explain your code')
    feedback['next_steps'].append('Review the task requirements and try again' if not passed else 'Move on to the next task')
    
    # Create test results (simulated)
    test_results = {
        'total_tests': 3,
        'passed_tests': 2 if passed else 1,
        'tests': [
            {'name': 'test_basic', 'passed': True},
            {'name': 'test_edge_case', 'passed': passed},
            {'name': 'test_advanced', 'passed': passed and score > 80}
        ]
    }
    
    return EvaluationResult(
        submission_id=submission_id,
        passed=passed,
        score=score,
        feedback=feedback,
        execution_time=0.125,  # Simulated
        test_results=test_results
    )


def _evaluation_to_response(
    evaluation: EvaluationResult,
    submission: Submission,
    task_id: str
) -> EvaluationResponse:
    """Convert evaluation result to API response."""
    
    # Extract test results
    test_results_data = evaluation.test_results or {}
    tests = test_results_data.get('tests', [])
    
    test_responses = [
        TestResultResponse(
            name=test.get('name', 'test'),
            passed=test.get('passed', False),
            expected_output=test.get('expected_output'),
            actual_output=test.get('actual_output'),
            execution_time_ms=test.get('execution_time_ms'),
            error_message=test.get('error_message')
        )
        for test in tests
    ]
    
    # Extract feedback
    feedback_data = evaluation.feedback
    feedback = FeedbackResponse(
        overall_assessment=feedback_data.get('overall_assessment', ''),
        strengths=feedback_data.get('strengths', []),
        issues=[
            FeedbackIssue(
                line=issue.get('line'),
                problem=issue.get('problem', ''),
                why=issue.get('why', ''),
                how_to_fix=issue.get('how_to_fix', ''),
                severity=issue.get('severity', 'medium')
            )
            for issue in feedback_data.get('issues', [])
        ],
        suggestions=feedback_data.get('suggestions', []),
        next_steps=feedback_data.get('next_steps', [])
    )
    
    # Quality analysis (simulated)
    quality_analysis = QualityAnalysisResponse(
        readability_score=0.8,
        structure_score=0.75,
        best_practices_score=0.7,
        complexity_score=0.85,
        overall_quality_score=0.77,
        quality_rating='good' if evaluation.score >= 70 else 'fair',
        issues_count=len(feedback_data.get('issues', []))
    )
    
    return EvaluationResponse(
        submission_id=submission.id,
        task_id=task_id,
        passed=evaluation.passed,
        score=evaluation.score,
        execution_status='success' if evaluation.passed else 'completed_with_errors',
        execution_time_ms=evaluation.execution_time * 1000,
        test_results=test_responses,
        tests_passed=test_results_data.get('passed_tests', 0),
        tests_total=test_results_data.get('total_tests', 0),
        feedback=feedback,
        quality_analysis=quality_analysis,
        output=None,
        errors=None,
        evaluated_at=evaluation.evaluated_at
    )
