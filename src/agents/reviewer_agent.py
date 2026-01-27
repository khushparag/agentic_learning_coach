"""
ReviewerAgent implementation for code evaluation and feedback generation.
"""
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from uuid import uuid4

from .base.base_agent import BaseAgent
from .base.types import AgentType, LearningContext, AgentResult
from .base.exceptions import ValidationError, AgentProcessingError
from ..ports.services.code_execution_service import ICodeExecutionService
from ..domain.entities.code_execution import (
    CodeExecutionRequest, 
    ProgrammingLanguage, 
    ExecutionLimits, 
    TestCase
)
from ..domain.entities.submission import Submission
from ..domain.entities.evaluation_result import EvaluationResult
from ..ports.repositories.submission_repository import ISubmissionRepository


logger = logging.getLogger(__name__)


class ReviewerAgent(BaseAgent):
    """
    Agent responsible for evaluating code submissions and providing detailed feedback.
    
    Capabilities:
    - Execute and test code submissions
    - Generate specific, actionable feedback
    - Evaluate code quality and correctness
    - Track submission attempts and patterns
    - Provide improvement suggestions
    """
    
    def __init__(self, 
                 code_execution_service: ICodeExecutionService,
                 submission_repository: ISubmissionRepository):
        super().__init__(AgentType.REVIEWER)
        self.code_execution_service = code_execution_service
        self.submission_repository = submission_repository
        self._supported_intents = [
            'evaluate_submission',
            'run_tests',
            'generate_feedback',
            'check_code_quality',
            'compare_submissions',
            'validate_solution'
        ]
        
        # Feedback templates for different scenarios
        self.feedback_templates = self._initialize_feedback_templates()
        
        # Code quality criteria
        self.quality_criteria = {
            'readability': {
                'weight': 0.25,
                'factors': ['naming', 'comments', 'structure']
            },
            'correctness': {
                'weight': 0.40,
                'factors': ['test_results', 'edge_cases', 'logic']
            },
            'efficiency': {
                'weight': 0.20,
                'factors': ['time_complexity', 'space_complexity', 'optimization']
            },
            'best_practices': {
                'weight': 0.15,
                'factors': ['error_handling', 'code_style', 'patterns']
            }
        }
    
    def get_supported_intents(self) -> List[str]:
        """Return list of intents this agent can handle."""
        return self._supported_intents.copy()
    
    async def process(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """Process code review and evaluation requests."""
        intent = payload.get('intent')
        
        try:
            if intent == 'evaluate_submission':
                return await self._evaluate_submission(context, payload)
            elif intent == 'run_tests':
                return await self._run_tests(context, payload)
            elif intent == 'generate_feedback':
                return await self._generate_feedback(context, payload)
            elif intent == 'check_code_quality':
                return await self._check_code_quality(context, payload)
            elif intent == 'compare_submissions':
                return await self._compare_submissions(context, payload)
            elif intent == 'validate_solution':
                return await self._validate_solution(context, payload)
            else:
                raise ValidationError(f"Unsupported intent: {intent}")
                
        except Exception as e:
            self.logger.log_error(f"Code review failed for intent {intent}", e, context, intent)
            raise AgentProcessingError(f"Failed to process {intent}: {str(e)}")
    
    async def _evaluate_submission(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """Evaluate a complete code submission."""
        try:
            # Extract submission data
            submission_data = payload.get('submission')
            exercise_data = payload.get('exercise')
            
            if not submission_data:
                raise ValidationError("Submission data is required")
            if not exercise_data:
                raise ValidationError("Exercise data is required")
            
            code = submission_data.get('code', '')
            language = submission_data.get('language', 'python')
            
            if not code.strip():
                raise ValidationError("Code cannot be empty")
            
            self.logger.log_debug(
                f"Evaluating {language} submission ({len(code)} characters)",
                context, 'evaluate_submission'
            )
            
            # Create submission entity
            submission = Submission(
                task_id=exercise_data.get('id', str(uuid4())),
                user_id=context.user_id,
                code_content=code
            )
            
            # Save submission
            saved_submission = await self.submission_repository.save(submission)
            
            # Run code execution and tests
            execution_result = await self._execute_code_with_tests(
                code, language, exercise_data.get('test_cases', []), context
            )
            
            # Analyze code quality
            quality_analysis = await self._analyze_code_quality(code, language, context)
            
            # Generate comprehensive feedback
            feedback = await self._generate_comprehensive_feedback(
                execution_result, quality_analysis, exercise_data, context
            )
            
            # Create evaluation result
            evaluation = EvaluationResult(
                submission_id=saved_submission.id,
                passed=execution_result.success and execution_result.all_tests_passed,
                score=self._calculate_overall_score(execution_result, quality_analysis),
                feedback=feedback,
                execution_time=execution_result.execution_time,
                test_results=[
                    {
                        'name': test.test_name,
                        'passed': test.passed,
                        'expected': test.expected_output,
                        'actual': test.actual_output,
                        'error': test.error_message
                    }
                    for test in execution_result.test_results
                ]
            )
            
            # Determine next actions based on results
            next_actions = self._determine_next_actions(evaluation, context)
            
            self.logger.log_info(
                f"Submission evaluated: {'PASSED' if evaluation.passed else 'FAILED'} "
                f"(Score: {evaluation.score:.1f})",
                context, 'evaluate_submission'
            )
            
            return AgentResult.success_result(
                data={
                    'evaluation': evaluation.to_dict(),
                    'submission_id': saved_submission.id,
                    'execution_result': {
                        'status': execution_result.status.value,
                        'output': execution_result.output,
                        'errors': execution_result.errors,
                        'execution_time': execution_result.execution_time
                    },
                    'quality_analysis': quality_analysis,
                    'feedback': feedback
                },
                next_actions=next_actions,
                metadata={
                    'passed': evaluation.passed,
                    'score': evaluation.score,
                    'language': language,
                    'test_count': len(execution_result.test_results),
                    'tests_passed': sum(1 for test in execution_result.test_results if test.passed)
                }
            )
            
        except Exception as e:
            self.logger.log_error("Submission evaluation failed", e, context, 'evaluate_submission')
            return AgentResult.error_result(
                error=f"Submission evaluation failed: {str(e)}",
                error_code="EVALUATION_FAILED"
            )
    
    async def _run_tests(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """Run tests against code without full evaluation."""
        try:
            code = payload.get('code', '')
            language = payload.get('language', 'python')
            test_cases = payload.get('test_cases', [])
            
            if not code.strip():
                raise ValidationError("Code cannot be empty")
            
            self.logger.log_debug(
                f"Running {len(test_cases)} tests against {language} code",
                context, 'run_tests'
            )
            
            # Execute code with tests
            execution_result = await self._execute_code_with_tests(code, language, test_cases, context)
            
            # Summarize test results
            total_tests = len(execution_result.test_results)
            passed_tests = sum(1 for test in execution_result.test_results if test.passed)
            
            return AgentResult.success_result(
                data={
                    'execution_status': execution_result.status.value,
                    'output': execution_result.output,
                    'errors': execution_result.errors,
                    'test_results': [
                        {
                            'name': test.test_name,
                            'passed': test.passed,
                            'expected': test.expected_output,
                            'actual': test.actual_output,
                            'execution_time': test.execution_time,
                            'error': test.error_message
                        }
                        for test in execution_result.test_results
                    ],
                    'summary': {
                        'total_tests': total_tests,
                        'passed_tests': passed_tests,
                        'success_rate': passed_tests / total_tests if total_tests > 0 else 0,
                        'execution_time': execution_result.execution_time
                    }
                },
                metadata={
                    'all_tests_passed': execution_result.all_tests_passed,
                    'execution_successful': execution_result.success
                }
            )
            
        except Exception as e:
            self.logger.log_error("Test execution failed", e, context, 'run_tests')
            return AgentResult.error_result(
                error=f"Test execution failed: {str(e)}",
                error_code="TEST_EXECUTION_FAILED"
            )
    
    async def _generate_feedback(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """Generate detailed feedback for code."""
        try:
            code = payload.get('code', '')
            language = payload.get('language', 'python')
            test_results = payload.get('test_results', [])
            exercise_context = payload.get('exercise_context', {})
            
            if not code.strip():
                raise ValidationError("Code cannot be empty")
            
            self.logger.log_debug(
                f"Generating feedback for {language} code",
                context, 'generate_feedback'
            )
            
            # Analyze code quality
            quality_analysis = await self._analyze_code_quality(code, language, context)
            
            # Generate feedback based on test results and quality
            feedback = await self._generate_detailed_feedback(
                code, language, test_results, quality_analysis, exercise_context, context
            )
            
            return AgentResult.success_result(
                data={
                    'feedback': feedback,
                    'quality_analysis': quality_analysis
                },
                metadata={
                    'feedback_sections': len(feedback.get('sections', [])),
                    'suggestions_count': len(feedback.get('suggestions', []))
                }
            )
            
        except Exception as e:
            self.logger.log_error("Feedback generation failed", e, context, 'generate_feedback')
            return AgentResult.error_result(
                error=f"Feedback generation failed: {str(e)}",
                error_code="FEEDBACK_GENERATION_FAILED"
            )
    
    async def _check_code_quality(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """Check code quality without execution."""
        try:
            code = payload.get('code', '')
            language = payload.get('language', 'python')
            
            if not code.strip():
                raise ValidationError("Code cannot be empty")
            
            self.logger.log_debug(
                f"Checking quality of {language} code",
                context, 'check_code_quality'
            )
            
            # Perform quality analysis
            quality_analysis = await self._analyze_code_quality(code, language, context)
            
            # Calculate overall quality score
            overall_score = self._calculate_quality_score(quality_analysis)
            
            return AgentResult.success_result(
                data={
                    'quality_analysis': quality_analysis,
                    'overall_score': overall_score,
                    'quality_rating': self._get_quality_rating(overall_score)
                },
                metadata={
                    'quality_score': overall_score,
                    'issues_found': len(quality_analysis.get('issues', []))
                }
            )
            
        except Exception as e:
            self.logger.log_error("Code quality check failed", e, context, 'check_code_quality')
            return AgentResult.error_result(
                error=f"Code quality check failed: {str(e)}",
                error_code="QUALITY_CHECK_FAILED"
            )
    
    async def _compare_submissions(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """Compare multiple submissions for the same exercise."""
        try:
            submissions = payload.get('submissions', [])
            if len(submissions) < 2:
                raise ValidationError("At least 2 submissions are required for comparison")
            
            self.logger.log_debug(
                f"Comparing {len(submissions)} submissions",
                context, 'compare_submissions'
            )
            
            # Analyze each submission
            analyses = []
            for i, submission in enumerate(submissions):
                code = submission.get('code', '')
                language = submission.get('language', 'python')
                
                quality_analysis = await self._analyze_code_quality(code, language, context)
                analyses.append({
                    'submission_index': i,
                    'submission_id': submission.get('id'),
                    'quality_analysis': quality_analysis,
                    'code_length': len(code),
                    'language': language
                })
            
            # Generate comparison insights
            comparison = self._generate_comparison_insights(analyses)
            
            return AgentResult.success_result(
                data={
                    'comparison': comparison,
                    'analyses': analyses,
                    'submission_count': len(submissions)
                },
                metadata={
                    'submissions_compared': len(submissions),
                    'best_submission_index': comparison.get('best_submission_index')
                }
            )
            
        except Exception as e:
            self.logger.log_error("Submission comparison failed", e, context, 'compare_submissions')
            return AgentResult.error_result(
                error=f"Submission comparison failed: {str(e)}",
                error_code="COMPARISON_FAILED"
            )
    
    async def _validate_solution(self, context: LearningContext, payload: Dict[str, Any]) -> AgentResult:
        """Validate a solution against requirements."""
        try:
            code = payload.get('code', '')
            language = payload.get('language', 'python')
            requirements = payload.get('requirements', [])
            
            if not code.strip():
                raise ValidationError("Code cannot be empty")
            
            self.logger.log_debug(
                f"Validating {language} solution against {len(requirements)} requirements",
                context, 'validate_solution'
            )
            
            # Check each requirement
            validation_results = []
            for requirement in requirements:
                result = await self._validate_requirement(code, language, requirement, context)
                validation_results.append(result)
            
            # Calculate overall validation score
            total_requirements = len(requirements)
            met_requirements = sum(1 for result in validation_results if result['met'])
            validation_score = met_requirements / total_requirements if total_requirements > 0 else 1.0
            
            return AgentResult.success_result(
                data={
                    'validation_results': validation_results,
                    'validation_score': validation_score,
                    'requirements_met': met_requirements,
                    'total_requirements': total_requirements,
                    'overall_valid': validation_score >= 0.8
                },
                metadata={
                    'validation_score': validation_score,
                    'requirements_checked': total_requirements
                }
            )
            
        except Exception as e:
            self.logger.log_error("Solution validation failed", e, context, 'validate_solution')
            return AgentResult.error_result(
                error=f"Solution validation failed: {str(e)}",
                error_code="VALIDATION_FAILED"
            )
    
    async def _execute_code_with_tests(self, 
                                     code: str, 
                                     language: str, 
                                     test_cases: List[Dict[str, Any]], 
                                     context: LearningContext):
        """Execute code with test cases using the code execution service."""
        try:
            # Convert language string to enum
            try:
                prog_language = ProgrammingLanguage(language.lower())
            except ValueError:
                prog_language = ProgrammingLanguage.PYTHON  # Default fallback
            
            # Convert test cases to domain objects
            domain_test_cases = []
            for test_case in test_cases:
                domain_test_cases.append(TestCase(
                    name=test_case.get('name', 'test'),
                    input_data=test_case.get('input', ''),
                    expected_output=test_case.get('expected_output', ''),
                    timeout=test_case.get('timeout', 10)
                ))
            
            # Create execution request
            execution_request = CodeExecutionRequest(
                id=uuid4(),
                code=code,
                language=prog_language,
                test_cases=domain_test_cases,
                limits=ExecutionLimits(
                    timeout=30,  # 30 seconds max
                    memory_limit=256 * 1024 * 1024,  # 256MB
                    cpu_limit=1.0,
                    network_access=False,
                    file_system_access="temp-only"
                ),
                user_id=context.user_id
            )
            
            # Execute code
            execution_result = await self.code_execution_service.execute_code(execution_request)
            
            return execution_result
            
        except Exception as e:
            self.logger.log_error(f"Code execution failed: {e}", e, context, 'execute_code')
            raise
    
    async def _analyze_code_quality(self, 
                                  code: str, 
                                  language: str, 
                                  context: LearningContext) -> Dict[str, Any]:
        """Analyze code quality across multiple dimensions."""
        analysis = {
            'readability': self._analyze_readability(code, language),
            'structure': self._analyze_structure(code, language),
            'best_practices': self._analyze_best_practices(code, language),
            'complexity': self._analyze_complexity(code, language),
            'issues': self._find_code_issues(code, language),
            'suggestions': self._generate_improvement_suggestions(code, language)
        }
        
        return analysis
    
    def _analyze_readability(self, code: str, language: str) -> Dict[str, Any]:
        """Analyze code readability."""
        lines = code.split('\n')
        
        # Basic readability metrics
        avg_line_length = sum(len(line) for line in lines) / len(lines) if lines else 0
        long_lines = sum(1 for line in lines if len(line) > 80)
        
        # Count comments (including docstrings for Python)
        comment_lines = 0
        in_docstring = False
        for line in lines:
            stripped = line.strip()
            if language == 'python':
                # Check for docstrings
                if '"""' in stripped or "'''" in stripped:
                    # Toggle docstring state or count single-line docstring
                    docstring_count = stripped.count('"""') + stripped.count("'''")
                    if docstring_count >= 2:
                        comment_lines += 1  # Single-line docstring
                    else:
                        in_docstring = not in_docstring
                        comment_lines += 1
                elif in_docstring:
                    comment_lines += 1
                elif stripped.startswith('#'):
                    comment_lines += 1
            else:
                # For other languages, count // and /* */ style comments
                if stripped.startswith('//') or stripped.startswith('/*') or stripped.startswith('*'):
                    comment_lines += 1
        
        readability_score = 1.0
        
        # Penalize long lines
        if long_lines > len(lines) * 0.2:
            readability_score -= 0.2
        
        # Reward comments
        comment_ratio = comment_lines / len(lines) if lines else 0
        if comment_ratio > 0.1:
            readability_score += 0.1
        
        return {
            'score': max(0.0, min(1.0, readability_score)),
            'avg_line_length': avg_line_length,
            'long_lines_count': long_lines,
            'comment_lines_count': comment_lines,
            'comment_ratio': comment_ratio
        }
    
    def _analyze_structure(self, code: str, language: str) -> Dict[str, Any]:
        """Analyze code structure."""
        lines = code.split('\n')
        
        # Count structural elements
        if language == 'python':
            functions = len([line for line in lines if line.strip().startswith('def ')])
            classes = len([line for line in lines if line.strip().startswith('class ')])
            imports = len([line for line in lines if line.strip().startswith(('import ', 'from '))])
        else:
            # Generic analysis for other languages
            functions = len([line for line in lines if 'function' in line.lower()])
            classes = len([line for line in lines if 'class' in line.lower()])
            imports = len([line for line in lines if 'import' in line.lower()])
        
        # Calculate structure score
        structure_score = 0.5  # Base score
        
        if functions > 0:
            structure_score += 0.2
        if classes > 0:
            structure_score += 0.2
        if imports > 0:
            structure_score += 0.1
        
        return {
            'score': min(1.0, structure_score),
            'functions_count': functions,
            'classes_count': classes,
            'imports_count': imports,
            'total_lines': len(lines)
        }
    
    def _analyze_best_practices(self, code: str, language: str) -> Dict[str, Any]:
        """Analyze adherence to best practices."""
        practices_score = 0.5  # Base score
        violations = []
        
        if language == 'python':
            # Python-specific best practices
            if 'import *' in code:
                violations.append("Avoid wildcard imports")
                practices_score -= 0.2
            
            if 'except:' in code and 'except Exception:' not in code:
                violations.append("Use specific exception handling")
                practices_score -= 0.1
            
            # Check for proper naming (simplified)
            lines = code.split('\n')
            for line in lines:
                if line.strip().startswith('def '):
                    func_name = line.split('(')[0].split()[-1]
                    if not func_name.islower() or ' ' in func_name:
                        violations.append("Use snake_case for function names")
                        practices_score -= 0.1
                        break
        
        return {
            'score': max(0.0, min(1.0, practices_score)),
            'violations': violations,
            'violations_count': len(violations)
        }
    
    def _analyze_complexity(self, code: str, language: str) -> Dict[str, Any]:
        """Analyze code complexity."""
        lines = code.split('\n')
        
        # Simple complexity metrics
        nesting_level = 0
        max_nesting = 0
        
        for line in lines:
            stripped = line.strip()
            if stripped.startswith(('if ', 'for ', 'while ', 'try:', 'with ')):
                nesting_level += 1
                max_nesting = max(max_nesting, nesting_level)
            elif stripped in ('else:', 'elif ', 'except:', 'finally:'):
                continue
            elif not stripped or stripped.startswith('#'):
                continue
            else:
                # Simplified: assume dedentation reduces nesting
                if line.startswith('    ') and nesting_level > 0:
                    pass  # Still nested
                else:
                    nesting_level = max(0, nesting_level - 1)
        
        # Calculate complexity score (lower is better)
        complexity_score = 1.0 - min(0.8, max_nesting * 0.2)
        
        return {
            'score': complexity_score,
            'max_nesting_level': max_nesting,
            'total_lines': len([line for line in lines if line.strip()])
        }
    
    def _find_code_issues(self, code: str, language: str) -> List[Dict[str, Any]]:
        """Find potential issues in code."""
        issues = []
        lines = code.split('\n')
        
        for i, line in enumerate(lines, 1):
            stripped = line.strip()
            
            # Check for common issues
            if len(line) > 80:
                issues.append({
                    'type': 'style',
                    'line': i,
                    'message': 'Line too long (>80 characters)',
                    'severity': 'low'
                })
            
            if language == 'python':
                if 'print(' in stripped and not stripped.startswith('#'):
                    issues.append({
                        'type': 'debug',
                        'line': i,
                        'message': 'Debug print statement found',
                        'severity': 'low'
                    })
                
                if stripped.endswith(':') and not stripped.startswith(('def ', 'class ', 'if ', 'for ', 'while ', 'try:', 'except', 'else:', 'elif ', 'finally:', 'with ')):
                    issues.append({
                        'type': 'syntax',
                        'line': i,
                        'message': 'Unexpected colon',
                        'severity': 'medium'
                    })
        
        return issues
    
    def _generate_improvement_suggestions(self, code: str, language: str) -> List[str]:
        """Generate suggestions for code improvement."""
        suggestions = []
        
        # Analyze code and generate suggestions
        lines = code.split('\n')
        
        # Check for comments
        comment_lines = sum(1 for line in lines if line.strip().startswith('#' if language == 'python' else '//'))
        if comment_lines == 0:
            suggestions.append("Add comments to explain your code logic")
        
        # Check for function usage
        if language == 'python':
            has_functions = any(line.strip().startswith('def ') for line in lines)
            if not has_functions and len(lines) > 10:
                suggestions.append("Consider breaking your code into functions for better organization")
        
        # Check for error handling
        if language == 'python' and 'try:' not in code:
            suggestions.append("Consider adding error handling with try/except blocks")
        
        # Check for variable naming
        if any(var in code for var in ['x', 'y', 'z', 'temp', 'data']):
            suggestions.append("Use more descriptive variable names")
        
        return suggestions
    
    async def _generate_comprehensive_feedback(self, 
                                             execution_result, 
                                             quality_analysis: Dict[str, Any], 
                                             exercise_data: Dict[str, Any], 
                                             context: LearningContext) -> Dict[str, Any]:
        """Generate comprehensive feedback combining execution and quality analysis."""
        feedback = {
            'overall_assessment': '',
            'sections': [],
            'suggestions': [],
            'next_steps': [],
            'encouragement': ''
        }
        
        # Overall assessment
        if execution_result.success and execution_result.all_tests_passed:
            feedback['overall_assessment'] = "Great job! Your code runs correctly and passes all tests."
            feedback['encouragement'] = "You're making excellent progress!"
        elif execution_result.success:
            feedback['overall_assessment'] = "Your code runs, but some tests are failing."
            feedback['encouragement'] = "You're on the right track, just need some adjustments."
        else:
            feedback['overall_assessment'] = "Your code has some issues that prevent it from running."
            feedback['encouragement'] = "Don't worry, debugging is part of learning!"
        
        # Test results section
        if execution_result.test_results:
            passed_tests = sum(1 for test in execution_result.test_results if test.passed)
            total_tests = len(execution_result.test_results)
            
            feedback['sections'].append({
                'title': 'Test Results',
                'content': f"Passed {passed_tests} out of {total_tests} tests",
                'details': [
                    {
                        'test': test.test_name,
                        'status': 'PASSED' if test.passed else 'FAILED',
                        'expected': test.expected_output,
                        'actual': test.actual_output,
                        'error': test.error_message
                    }
                    for test in execution_result.test_results
                ]
            })
        
        # Code quality section
        overall_quality = self._calculate_quality_score(quality_analysis)
        feedback['sections'].append({
            'title': 'Code Quality',
            'content': f"Overall quality score: {overall_quality:.1f}/10",
            'details': {
                'readability': quality_analysis['readability']['score'],
                'structure': quality_analysis['structure']['score'],
                'best_practices': quality_analysis['best_practices']['score'],
                'complexity': quality_analysis['complexity']['score']
            }
        })
        
        # Issues and suggestions
        if quality_analysis['issues']:
            feedback['sections'].append({
                'title': 'Issues Found',
                'content': f"Found {len(quality_analysis['issues'])} issues to address",
                'details': quality_analysis['issues']
            })
        
        feedback['suggestions'] = quality_analysis['suggestions']
        
        # Next steps based on performance
        if execution_result.all_tests_passed:
            feedback['next_steps'] = [
                "Try the next exercise in the series",
                "Challenge yourself with a harder difficulty level",
                "Review and refactor your code for better quality"
            ]
        else:
            feedback['next_steps'] = [
                "Review the failing test cases",
                "Debug your code step by step",
                "Ask for hints if you're stuck"
            ]
        
        return feedback
    
    async def _generate_detailed_feedback(self, 
                                        code: str, 
                                        language: str, 
                                        test_results: List[Dict[str, Any]], 
                                        quality_analysis: Dict[str, Any], 
                                        exercise_context: Dict[str, Any], 
                                        context: LearningContext) -> Dict[str, Any]:
        """Generate detailed feedback for code."""
        # This is a simplified version of comprehensive feedback
        # In practice, this would be more detailed and context-aware
        
        feedback = {
            'summary': 'Code analysis completed',
            'quality_score': self._calculate_quality_score(quality_analysis),
            'areas_for_improvement': quality_analysis.get('suggestions', []),
            'positive_aspects': [],
            'specific_recommendations': []
        }
        
        # Add positive aspects
        if quality_analysis['readability']['score'] > 0.7:
            feedback['positive_aspects'].append("Good code readability")
        
        if quality_analysis['structure']['score'] > 0.7:
            feedback['positive_aspects'].append("Well-structured code")
        
        # Add specific recommendations based on context
        if context.skill_level == 'beginner':
            feedback['specific_recommendations'].extend([
                "Focus on writing clear, simple code",
                "Add comments to explain your thinking",
                "Test your code with different inputs"
            ])
        
        return feedback
    
    def _calculate_overall_score(self, execution_result, quality_analysis: Dict[str, Any]) -> float:
        """Calculate overall score for submission."""
        # Execution score (60% weight)
        execution_score = 0.0
        if execution_result.success:
            execution_score = 0.5  # Base score for running code
            if execution_result.all_tests_passed:
                execution_score = 1.0  # Full score for passing all tests
            else:
                # Partial score based on passed tests
                passed_tests = sum(1 for test in execution_result.test_results if test.passed)
                total_tests = len(execution_result.test_results)
                if total_tests > 0:
                    execution_score = 0.5 + (0.5 * passed_tests / total_tests)
        
        # Quality score (40% weight)
        quality_score = self._calculate_quality_score(quality_analysis) / 10.0
        
        # Combined score
        overall_score = (execution_score * 0.6) + (quality_score * 0.4)
        
        return round(overall_score * 100, 1)  # Return as percentage
    
    def _calculate_quality_score(self, quality_analysis: Dict[str, Any]) -> float:
        """Calculate quality score from analysis."""
        scores = []
        weights = []
        
        for criterion, config in self.quality_criteria.items():
            if criterion in quality_analysis:
                score = quality_analysis[criterion].get('score', 0.5)
                scores.append(score)
                weights.append(config['weight'])
        
        if not scores:
            return 5.0  # Default middle score
        
        # Weighted average
        weighted_score = sum(score * weight for score, weight in zip(scores, weights))
        total_weight = sum(weights)
        
        return round((weighted_score / total_weight) * 10, 1)  # Scale to 0-10
    
    def _get_quality_rating(self, score: float) -> str:
        """Convert quality score to rating."""
        if score >= 8.0:
            return "excellent"
        elif score >= 6.0:
            return "good"
        elif score >= 4.0:
            return "fair"
        else:
            return "needs_improvement"
    
    def _determine_next_actions(self, evaluation: EvaluationResult, context: LearningContext) -> List[str]:
        """Determine next actions based on evaluation results."""
        next_actions = []
        
        if evaluation.passed:
            next_actions.extend([
                'continue_to_next_exercise',
                'request_stretch_exercise'
            ])
        else:
            next_actions.extend([
                'request_hint',
                'review_feedback',
                'retry_submission'
            ])
            
            # If multiple failures, suggest recap
            if context.attempt_count >= 2:
                next_actions.append('request_recap_exercise')
        
        return next_actions
    
    def _generate_comparison_insights(self, analyses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate insights from comparing multiple submissions."""
        if not analyses:
            return {}
        
        # Find best submission by quality score
        best_submission = max(analyses, key=lambda x: self._calculate_quality_score(x['quality_analysis']))
        
        # Calculate improvement trends
        quality_scores = [self._calculate_quality_score(analysis['quality_analysis']) for analysis in analyses]
        
        comparison = {
            'best_submission_index': best_submission['submission_index'],
            'quality_trend': 'improving' if quality_scores[-1] > quality_scores[0] else 'declining',
            'average_quality': sum(quality_scores) / len(quality_scores),
            'quality_range': max(quality_scores) - min(quality_scores),
            'insights': []
        }
        
        # Generate insights
        if comparison['quality_trend'] == 'improving':
            comparison['insights'].append("Your code quality is improving over time!")
        
        if comparison['quality_range'] > 2.0:
            comparison['insights'].append("Your code quality varies significantly between submissions")
        
        return comparison
    
    async def _validate_requirement(self, 
                                  code: str, 
                                  language: str, 
                                  requirement: str, 
                                  context: LearningContext) -> Dict[str, Any]:
        """Validate code against a specific requirement."""
        # Simplified requirement validation
        # In practice, this would be more sophisticated
        
        requirement_lower = requirement.lower()
        code_lower = code.lower()
        
        met = False
        explanation = ""
        
        # Check common requirements
        if 'function' in requirement_lower:
            met = 'def ' in code_lower or 'function' in code_lower
            explanation = "Function definition found" if met else "No function definition found"
        elif 'loop' in requirement_lower:
            met = any(keyword in code_lower for keyword in ['for ', 'while '])
            explanation = "Loop found" if met else "No loop found"
        elif 'conditional' in requirement_lower or 'if' in requirement_lower:
            met = 'if ' in code_lower
            explanation = "Conditional statement found" if met else "No conditional statement found"
        elif 'comment' in requirement_lower:
            met = '#' in code or '//' in code
            explanation = "Comments found" if met else "No comments found"
        else:
            # Generic keyword check
            met = requirement_lower in code_lower
            explanation = f"Requirement keyword found" if met else f"Requirement keyword not found"
        
        return {
            'requirement': requirement,
            'met': met,
            'explanation': explanation
        }
    
    def _initialize_feedback_templates(self) -> Dict[str, Dict[str, str]]:
        """Initialize feedback templates for different scenarios."""
        return {
            'all_tests_passed': {
                'title': 'Excellent Work!',
                'message': 'Your code passes all tests and demonstrates good understanding.',
                'encouragement': 'Keep up the great work!'
            },
            'some_tests_failed': {
                'title': 'Good Progress',
                'message': 'Your code runs but some test cases are failing.',
                'encouragement': 'You\'re on the right track, just need some adjustments.'
            },
            'compilation_error': {
                'title': 'Syntax Issues',
                'message': 'Your code has syntax errors that prevent it from running.',
                'encouragement': 'Check your syntax and try again. Everyone makes these mistakes!'
            },
            'runtime_error': {
                'title': 'Runtime Issues',
                'message': 'Your code runs but encounters errors during execution.',
                'encouragement': 'Debug step by step to find and fix the issue.'
            }
        }
    
    async def _handle_timeout_fallback(self, 
                                     context: LearningContext, 
                                     payload: Dict[str, Any]) -> Optional[AgentResult]:
        """Handle timeout with basic feedback."""
        intent = payload.get('intent')
        
        if intent == 'evaluate_submission':
            return AgentResult.success_result(
                data={
                    'evaluation': {
                        'passed': False,
                        'score': 0,
                        'feedback': {
                            'overall_assessment': 'Evaluation timed out, please try again',
                            'suggestions': ['Check your code for infinite loops', 'Simplify your solution']
                        }
                    },
                    'message': 'Evaluation service is temporarily slow, basic feedback provided'
                },
                metadata={'fallback': True, 'reason': 'timeout'}
            )
        
        return None