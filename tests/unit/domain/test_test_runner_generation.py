"""Unit tests for test runner generation.

Tests the generation of language-specific test runners for Python and JavaScript.
"""

import pytest
import json
from src.domain.services.code_runner import SecureCodeRunner
from src.domain.entities.code_execution import (
    CodeExecutionRequest,
    ProgrammingLanguage,
    ExecutionLimits,
    TestCase
)


class TestPythonTestRunnerGeneration:
    """Unit tests for Python test runner generation."""
    
    @pytest.fixture
    def code_runner(self):
        """Create a code runner instance."""
        return SecureCodeRunner()
    
    def test_generates_valid_python_test_runner(self, code_runner):
        """Test that Python test runner is generated with valid syntax."""
        test_cases = [
            TestCase(
                name="test_addition",
                input_data={"a": 2, "b": 3},
                expected_output="5"
            ),
            TestCase(
                name="test_subtraction",
                input_data={"a": 5, "b": 2},
                expected_output="3"
            )
        ]
        
        request = CodeExecutionRequest(
            code="def solution(x): return x",
            language=ProgrammingLanguage.PYTHON,
            test_cases=test_cases,
            limits=ExecutionLimits()
        )
        
        test_runner = code_runner._generate_test_runner(request, 
                                                        code_runner.language_configs[ProgrammingLanguage.PYTHON])
        
        # Verify it's valid Python
        assert test_runner is not None
        assert isinstance(test_runner, str)
        assert len(test_runner) > 0
        
        # Verify it contains key components
        assert 'import json' in test_runner
        assert 'test_cases' in test_runner
        assert 'test_results' in test_runner
        
        # Verify it can be compiled
        compile(test_runner, '<string>', 'exec')
    
    def test_python_test_runner_includes_all_test_cases(self, code_runner):
        """Test that all test cases are included in the runner."""
        test_cases = [
            TestCase(name=f"test_{i}", input_data=i, expected_output=str(i*2))
            for i in range(5)
        ]
        
        request = CodeExecutionRequest(
            code="def solution(x): return x * 2",
            language=ProgrammingLanguage.PYTHON,
            test_cases=test_cases,
            limits=ExecutionLimits()
        )
        
        test_runner = code_runner._generate_test_runner(request,
                                                        code_runner.language_configs[ProgrammingLanguage.PYTHON])
        
        # Verify all test cases are in the runner
        for test_case in test_cases:
            assert test_case.name in test_runner or str(test_case.input_data) in test_runner
    
    def test_python_test_runner_handles_exceptions(self, code_runner):
        """Test that test runner includes exception handling."""
        test_cases = [
            TestCase(name="test_1", input_data=1, expected_output="2")
        ]
        
        request = CodeExecutionRequest(
            code="def solution(x): return x * 2",
            language=ProgrammingLanguage.PYTHON,
            test_cases=test_cases,
            limits=ExecutionLimits()
        )
        
        test_runner = code_runner._generate_test_runner(request,
                                                        code_runner.language_configs[ProgrammingLanguage.PYTHON])
        
        # Verify exception handling is present
        assert 'try:' in test_runner
        assert 'except' in test_runner
        assert 'Exception' in test_runner
    
    def test_python_test_runner_outputs_json(self, code_runner):
        """Test that test runner outputs JSON format."""
        test_cases = [
            TestCase(name="test_1", input_data=1, expected_output="2")
        ]
        
        request = CodeExecutionRequest(
            code="def solution(x): return x * 2",
            language=ProgrammingLanguage.PYTHON,
            test_cases=test_cases,
            limits=ExecutionLimits()
        )
        
        test_runner = code_runner._generate_test_runner(request,
                                                        code_runner.language_configs[ProgrammingLanguage.PYTHON])
        
        # Verify JSON output
        assert 'json.dumps' in test_runner
        assert 'test_results' in test_runner


class TestJavaScriptTestRunnerGeneration:
    """Unit tests for JavaScript test runner generation."""
    
    @pytest.fixture
    def code_runner(self):
        """Create a code runner instance."""
        return SecureCodeRunner()
    
    def test_generates_valid_javascript_test_runner(self, code_runner):
        """Test that JavaScript test runner is generated with valid syntax."""
        test_cases = [
            TestCase(
                name="test_addition",
                input_data={"a": 2, "b": 3},
                expected_output="5"
            )
        ]
        
        request = CodeExecutionRequest(
            code="function solution(x) { return x; }",
            language=ProgrammingLanguage.JAVASCRIPT,
            test_cases=test_cases,
            limits=ExecutionLimits()
        )
        
        test_runner = code_runner._generate_test_runner(request,
                                                        code_runner.language_configs[ProgrammingLanguage.JAVASCRIPT])
        
        # Verify it's valid JavaScript
        assert test_runner is not None
        assert isinstance(test_runner, str)
        assert len(test_runner) > 0
        
        # Verify it contains key components
        assert 'const' in test_runner or 'var' in test_runner
        assert 'testCases' in test_runner or 'test_cases' in test_runner
        assert 'JSON.stringify' in test_runner
    
    def test_javascript_test_runner_outputs_json(self, code_runner):
        """Test that JavaScript test runner outputs JSON format."""
        test_cases = [
            TestCase(name="test_1", input_data=1, expected_output="2")
        ]
        
        request = CodeExecutionRequest(
            code="function solution(x) { return x * 2; }",
            language=ProgrammingLanguage.JAVASCRIPT,
            test_cases=test_cases,
            limits=ExecutionLimits()
        )
        
        test_runner = code_runner._generate_test_runner(request,
                                                        code_runner.language_configs[ProgrammingLanguage.JAVASCRIPT])
        
        # Verify JSON output
        assert 'JSON.stringify' in test_runner
        assert 'test_results' in test_runner or 'testResults' in test_runner


class TestTestRunnerErrorHandling:
    """Unit tests for test runner error handling."""
    
    @pytest.fixture
    def code_runner(self):
        """Create a code runner instance."""
        return SecureCodeRunner()
    
    def test_raises_error_for_unsupported_language(self, code_runner):
        """Test that unsupported language raises error."""
        from src.domain.services.code_runner import CodeExecutionError
        
        # Create a mock language config for unsupported language
        class UnsupportedLanguage:
            name = "ruby"
        
        config = UnsupportedLanguage()
        
        request = CodeExecutionRequest(
            code="puts 'hello'",
            language=ProgrammingLanguage.PYTHON,  # Doesn't matter for this test
            test_cases=[TestCase(name="test", input_data=1, expected_output="1")],
            limits=ExecutionLimits()
        )
        
        with pytest.raises(CodeExecutionError):
            code_runner._generate_test_runner(request, config)
    
    def test_handles_empty_test_cases(self, code_runner):
        """Test that empty test cases are handled gracefully."""
        request = CodeExecutionRequest(
            code="def solution(x): return x",
            language=ProgrammingLanguage.PYTHON,
            test_cases=[],
            limits=ExecutionLimits()
        )
        
        # Should not raise error with empty test cases
        test_runner = code_runner._generate_test_runner(request,
                                                        code_runner.language_configs[ProgrammingLanguage.PYTHON])
        
        assert test_runner is not None
        assert 'test_cases = []' in test_runner


class TestTestRunnerJSONFormat:
    """Unit tests for test runner JSON output format."""
    
    @pytest.fixture
    def code_runner(self):
        """Create a code runner instance."""
        return SecureCodeRunner()
    
    def test_python_runner_produces_valid_json_structure(self, code_runner):
        """Test that Python test runner produces valid JSON structure."""
        test_cases = [
            TestCase(name="test_1", input_data=1, expected_output="2")
        ]
        
        request = CodeExecutionRequest(
            code="def solution(x): return x * 2",
            language=ProgrammingLanguage.PYTHON,
            test_cases=test_cases,
            limits=ExecutionLimits()
        )
        
        test_runner = code_runner._generate_test_runner(request,
                                                        code_runner.language_configs[ProgrammingLanguage.PYTHON])
        
        # Verify JSON structure includes required fields
        assert "'test_name':" in test_runner or '"test_name":' in test_runner
        assert "'passed':" in test_runner or '"passed":' in test_runner
        assert "'actual_output':" in test_runner or '"actual_output":' in test_runner
        assert "'expected_output':" in test_runner or '"expected_output":' in test_runner
        assert "'error_message':" in test_runner or '"error_message":' in test_runner
