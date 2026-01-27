"""
Code Example Validator Service.

Validates code examples in learning content by executing them
against test cases using the code runner service.
"""

import logging
import uuid
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass

from src.domain.entities.learning_content import (
    CodeExample, TestCase, ProgrammingLanguage
)
from src.domain.entities.code_execution import (
    CodeExecutionRequest, TestCase as ExecutionTestCase,
    ExecutionLimits, ProgrammingLanguage as ExecLanguage,
    ExecutionStatus
)
from src.adapters.services.code_execution_adapter import CodeExecutionServiceAdapter

logger = logging.getLogger(__name__)


@dataclass
class ValidationResult:
    """Result of code example validation."""
    is_valid: bool
    starter_code_valid: bool
    solution_code_valid: bool
    test_results: List[Dict]
    errors: List[str]
    suggestions: List[str]
    execution_time_ms: float


@dataclass
class ErrorSuggestion:
    """A helpful suggestion for fixing an error."""
    error_type: str
    pattern: str
    suggestion: str
    example: Optional[str] = None


class CodeExampleValidator:
    """
    Validates code examples by executing them against test cases.
    
    This service ensures that:
    1. Starter code executes without syntax errors
    2. Solution code passes all test cases
    3. Error messages are helpful and educational
    """
    
    # Common error patterns and their helpful suggestions
    ERROR_PATTERNS: List[ErrorSuggestion] = [
        ErrorSuggestion(
            error_type="syntax",
            pattern="SyntaxError",
            suggestion="Check for missing brackets, parentheses, or semicolons",
            example="Make sure all opening brackets have matching closing brackets"
        ),
        ErrorSuggestion(
            error_type="syntax",
            pattern="IndentationError",
            suggestion="Python requires consistent indentation. Use 4 spaces per level",
            example="def example():\n    return True  # 4 spaces"
        ),
        ErrorSuggestion(
            error_type="reference",
            pattern="ReferenceError",
            suggestion="A variable or function is being used before it's defined",
            example="Make sure to declare variables before using them"
        ),
        ErrorSuggestion(
            error_type="reference",
            pattern="NameError",
            suggestion="Check that all variable and function names are spelled correctly",
            example="Variable names are case-sensitive: 'myVar' is different from 'myvar'"
        ),
        ErrorSuggestion(
            error_type="type",
            pattern="TypeError",
            suggestion="You're trying to use a value in a way that doesn't match its type",
            example="Can't add a string to a number without conversion"
        ),
        ErrorSuggestion(
            error_type="undefined",
            pattern="undefined is not a function",
            suggestion="You're trying to call something that isn't a function",
            example="Check that the function exists and is spelled correctly"
        ),
        ErrorSuggestion(
            error_type="null",
            pattern="Cannot read property",
            suggestion="You're trying to access a property on null or undefined",
            example="Add a null check before accessing properties"
        ),
        ErrorSuggestion(
            error_type="timeout",
            pattern="timeout",
            suggestion="Your code took too long to run. Check for infinite loops",
            example="Make sure loops have proper exit conditions"
        ),
        ErrorSuggestion(
            error_type="import",
            pattern="ModuleNotFoundError",
            suggestion="The module you're trying to import isn't available",
            example="Only standard library modules are available in the sandbox"
        ),
        ErrorSuggestion(
            error_type="import",
            pattern="Cannot find module",
            suggestion="The module you're trying to require isn't available",
            example="Only built-in Node.js modules are available"
        ),
    ]
    
    def __init__(
        self,
        code_execution_service: Optional[CodeExecutionServiceAdapter] = None,
        service_url: str = "http://localhost:8001"
    ):
        self.code_execution_service = code_execution_service or CodeExecutionServiceAdapter(service_url)
    
    async def validate_code_example(
        self,
        code_example: CodeExample,
        validate_starter: bool = True,
        validate_solution: bool = True
    ) -> ValidationResult:
        """
        Validate a code example by executing it.
        
        Args:
            code_example: The code example to validate
            validate_starter: Whether to validate starter code
            validate_solution: Whether to validate solution code
            
        Returns:
            ValidationResult with validation status and details
        """
        logger.info(f"Validating code example: {code_example.title}")
        
        errors = []
        suggestions = []
        test_results = []
        starter_valid = True
        solution_valid = True
        total_time = 0.0
        
        # Map language
        exec_language = self._map_language(code_example.language)
        
        # Validate starter code (should run without errors, may not pass tests)
        if validate_starter and code_example.starter_code:
            starter_result = await self._validate_code(
                code_example.starter_code,
                exec_language,
                []  # Don't run tests on starter code
            )
            starter_valid = starter_result[0]
            if not starter_valid:
                errors.append(f"Starter code error: {starter_result[1]}")
                suggestions.extend(self._get_error_suggestions(starter_result[1]))
            total_time += starter_result[2]
        
        # Validate solution code (should pass all tests)
        if validate_solution and code_example.solution_code:
            # Convert test cases
            exec_test_cases = [
                ExecutionTestCase(
                    name=f"test_{i}",
                    input_data=tc.input,
                    expected_output=tc.expected_output,
                    timeout=10.0
                )
                for i, tc in enumerate(code_example.test_cases)
            ]
            
            solution_result = await self._validate_code(
                code_example.solution_code,
                exec_language,
                exec_test_cases
            )
            solution_valid = solution_result[0]
            test_results = solution_result[3] if len(solution_result) > 3 else []
            
            if not solution_valid:
                errors.append(f"Solution code error: {solution_result[1]}")
                suggestions.extend(self._get_error_suggestions(solution_result[1]))
            total_time += solution_result[2]
        
        is_valid = starter_valid and solution_valid
        
        return ValidationResult(
            is_valid=is_valid,
            starter_code_valid=starter_valid,
            solution_code_valid=solution_valid,
            test_results=test_results,
            errors=errors,
            suggestions=suggestions,
            execution_time_ms=total_time * 1000
        )

    async def _validate_code(
        self,
        code: str,
        language: ExecLanguage,
        test_cases: List[ExecutionTestCase]
    ) -> Tuple[bool, str, float, List[Dict]]:
        """
        Execute code and return validation result.
        
        Returns:
            Tuple of (is_valid, error_message, execution_time, test_results)
        """
        try:
            request = CodeExecutionRequest(
                id=uuid.uuid4(),
                code=code,
                language=language,
                test_cases=test_cases,
                limits=ExecutionLimits(
                    timeout=10.0,
                    memory_limit=256 * 1024 * 1024,  # 256MB
                    cpu_limit=1.0,
                    disk_limit=10 * 1024 * 1024,  # 10MB
                    network_access=False,
                    file_system_access=False
                )
            )
            
            result = await self.code_execution_service.execute_code(request)
            
            # Check execution status
            if result.status == ExecutionStatus.FAILED:
                error_msg = result.errors[0] if result.errors else "Execution failed"
                return (False, error_msg, result.execution_time, [])
            
            if result.status == ExecutionStatus.TIMEOUT:
                return (False, "Code execution timed out", result.execution_time, [])
            
            if result.status == ExecutionStatus.SECURITY_VIOLATION:
                violations = [v.description for v in result.security_violations]
                return (False, f"Security violation: {', '.join(violations)}", result.execution_time, [])
            
            # Check test results
            test_results = []
            all_passed = True
            
            for tr in result.test_results:
                test_result = {
                    "name": tr.test_name,
                    "passed": tr.passed,
                    "actual_output": tr.actual_output,
                    "expected_output": tr.expected_output,
                    "execution_time": tr.execution_time,
                    "error": tr.error_message
                }
                test_results.append(test_result)
                
                if not tr.passed:
                    all_passed = False
            
            if not all_passed and test_cases:
                failed_tests = [tr["name"] for tr in test_results if not tr["passed"]]
                return (False, f"Tests failed: {', '.join(failed_tests)}", result.execution_time, test_results)
            
            return (True, "", result.execution_time, test_results)
            
        except Exception as e:
            logger.error(f"Code validation error: {e}")
            return (False, str(e), 0.0, [])
    
    def _map_language(self, language: ProgrammingLanguage) -> ExecLanguage:
        """Map learning content language to execution language."""
        mapping = {
            ProgrammingLanguage.JAVASCRIPT: ExecLanguage.JAVASCRIPT,
            ProgrammingLanguage.TYPESCRIPT: ExecLanguage.TYPESCRIPT,
            ProgrammingLanguage.PYTHON: ExecLanguage.PYTHON,
            ProgrammingLanguage.JAVA: ExecLanguage.JAVA,
        }
        return mapping.get(language, ExecLanguage.JAVASCRIPT)
    
    def _get_error_suggestions(self, error_message: str) -> List[str]:
        """Get helpful suggestions based on error message."""
        suggestions = []
        error_lower = error_message.lower()
        
        for pattern in self.ERROR_PATTERNS:
            if pattern.pattern.lower() in error_lower:
                suggestion = pattern.suggestion
                if pattern.example:
                    suggestion += f"\n\nExample: {pattern.example}"
                suggestions.append(suggestion)
        
        # Add generic suggestion if no specific match
        if not suggestions:
            suggestions.append(
                "Review your code carefully for syntax errors and typos. "
                "Make sure all variables are defined before use."
            )
        
        return suggestions
    
    def generate_helpful_error_message(
        self,
        error: str,
        code: str,
        language: ProgrammingLanguage
    ) -> Dict[str, str]:
        """
        Generate a helpful error message with suggestions.
        
        Args:
            error: The original error message
            code: The code that caused the error
            language: The programming language
            
        Returns:
            Dict with error details and suggestions
        """
        suggestions = self._get_error_suggestions(error)
        
        # Try to extract line number
        line_number = self._extract_line_number(error)
        
        # Get the problematic line if possible
        problematic_line = None
        if line_number and code:
            lines = code.split('\n')
            if 0 < line_number <= len(lines):
                problematic_line = lines[line_number - 1].strip()
        
        return {
            "error": error,
            "error_type": self._classify_error(error),
            "line_number": line_number,
            "problematic_line": problematic_line,
            "suggestions": suggestions,
            "helpful_message": self._create_helpful_message(error, suggestions)
        }
    
    def _extract_line_number(self, error: str) -> Optional[int]:
        """Extract line number from error message."""
        import re
        
        # Common patterns for line numbers
        patterns = [
            r'line (\d+)',
            r'Line (\d+)',
            r':(\d+):',
            r'at line (\d+)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, error)
            if match:
                return int(match.group(1))
        
        return None
    
    def _classify_error(self, error: str) -> str:
        """Classify the type of error."""
        error_lower = error.lower()
        
        if 'syntax' in error_lower or 'parse' in error_lower:
            return 'syntax'
        elif 'reference' in error_lower or 'name' in error_lower or 'undefined' in error_lower:
            return 'reference'
        elif 'type' in error_lower:
            return 'type'
        elif 'timeout' in error_lower:
            return 'timeout'
        elif 'import' in error_lower or 'module' in error_lower:
            return 'import'
        elif 'security' in error_lower:
            return 'security'
        else:
            return 'runtime'
    
    def _create_helpful_message(self, error: str, suggestions: List[str]) -> str:
        """Create a user-friendly error message."""
        error_type = self._classify_error(error)
        
        type_messages = {
            'syntax': "There's a syntax error in your code.",
            'reference': "You're trying to use something that doesn't exist.",
            'type': "There's a type mismatch in your code.",
            'timeout': "Your code took too long to run.",
            'import': "There's an issue with an import statement.",
            'security': "Your code uses restricted operations.",
            'runtime': "Your code encountered an error while running."
        }
        
        message = type_messages.get(error_type, "Your code has an error.")
        
        if suggestions:
            message += f"\n\n💡 Tip: {suggestions[0]}"
        
        return message
    
    async def close(self):
        """Close the code execution service connection."""
        await self.code_execution_service.close()


# Factory function
def create_code_example_validator(
    service_url: str = "http://localhost:8001"
) -> CodeExampleValidator:
    """Create a CodeExampleValidator instance."""
    return CodeExampleValidator(service_url=service_url)
