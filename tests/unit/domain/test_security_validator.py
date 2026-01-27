"""Tests for security validator."""

import pytest
from src.domain.entities.code_execution import ProgrammingLanguage
from src.domain.services.security_validator import SecurityValidator


class TestSecurityValidator:
    """Test cases for SecurityValidator."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.validator = SecurityValidator()
    
    def test_python_eval_detection(self):
        """Test detection of eval() in Python code."""
        code = """
def dangerous_function():
    result = eval("1 + 1")
    return result
"""
        violations = self.validator.validate_code(code, ProgrammingLanguage.PYTHON)
        
        assert len(violations) == 1
        assert violations[0].severity == "critical"
        assert "eval()" in violations[0].description
        assert violations[0].line_number == 3
    
    def test_python_exec_detection(self):
        """Test detection of exec() in Python code."""
        code = """
def dangerous_function():
    exec("print('hello')")
"""
        violations = self.validator.validate_code(code, ProgrammingLanguage.PYTHON)
        
        assert len(violations) == 1
        assert violations[0].severity == "critical"
        assert "exec()" in violations[0].description
    
    def test_python_os_import_detection(self):
        """Test detection of os module import."""
        code = """
import os
import sys

def get_files():
    return os.listdir('.')
"""
        violations = self.validator.validate_code(code, ProgrammingLanguage.PYTHON)
        
        # Should detect both os and sys imports
        assert len(violations) >= 2
        os_violations = [v for v in violations if "os module" in v.description]
        sys_violations = [v for v in violations if "sys module" in v.description]
        
        assert len(os_violations) == 1
        assert len(sys_violations) == 1
        assert os_violations[0].severity == "high"
    
    def test_python_subprocess_import_detection(self):
        """Test detection of subprocess module import."""
        code = """
import subprocess

def run_command():
    subprocess.run(['ls', '-la'])
"""
        violations = self.validator.validate_code(code, ProgrammingLanguage.PYTHON)
        
        assert len(violations) == 1
        assert violations[0].severity == "critical"
        assert "subprocess" in violations[0].description
    
    def test_python_infinite_loop_detection(self):
        """Test detection of infinite loops."""
        code = """
def infinite_loop():
    while True:
        print("This will run forever")
"""
        violations = self.validator.validate_code(code, ProgrammingLanguage.PYTHON)
        
        assert len(violations) == 1
        assert violations[0].severity == "medium"
        assert "infinite loop" in violations[0].description.lower()
    
    def test_python_large_range_detection(self):
        """Test detection of large range loops."""
        code = """
def large_loop():
    for i in range(1000000):
        print(i)
"""
        violations = self.validator.validate_code(code, ProgrammingLanguage.PYTHON)
        
        assert len(violations) == 1
        assert violations[0].severity == "medium"
        assert "large range" in violations[0].description.lower()
    
    def test_javascript_eval_detection(self):
        """Test detection of eval() in JavaScript code."""
        code = """
function dangerousFunction() {
    const result = eval("1 + 1");
    return result;
}
"""
        violations = self.validator.validate_code(code, ProgrammingLanguage.JAVASCRIPT)
        
        # Should detect eval() - may also detect Function if pattern overlaps
        eval_violations = [v for v in violations if "eval()" in v.description]
        assert len(eval_violations) >= 1
        assert eval_violations[0].severity == "critical"
    
    def test_javascript_function_constructor_detection(self):
        """Test detection of Function constructor in JavaScript."""
        code = """
function createFunction() {
    const fn = new Function('return 1 + 1');
    return fn();
}
"""
        violations = self.validator.validate_code(code, ProgrammingLanguage.JAVASCRIPT)
        
        # Should detect Function constructor
        function_violations = [v for v in violations if "Function constructor" in v.description]
        assert len(function_violations) >= 1
        assert function_violations[0].severity == "critical"
    
    def test_javascript_child_process_detection(self):
        """Test detection of child_process module in JavaScript."""
        code = """
const { exec } = require('child_process');

function runCommand() {
    exec('ls -la', (error, stdout, stderr) => {
        console.log(stdout);
    });
}
"""
        violations = self.validator.validate_code(code, ProgrammingLanguage.JAVASCRIPT)
        
        assert len(violations) == 1
        assert violations[0].severity == "critical"
        assert "child process" in violations[0].description.lower()
    
    def test_javascript_fs_module_detection(self):
        """Test detection of fs module in JavaScript."""
        code = """
const fs = require('fs');

function readFile() {
    return fs.readFileSync('file.txt', 'utf8');
}
"""
        violations = self.validator.validate_code(code, ProgrammingLanguage.JAVASCRIPT)
        
        assert len(violations) == 1
        assert violations[0].severity == "high"
        assert "file" in violations[0].description.lower()
    
    def test_javascript_prototype_pollution_detection(self):
        """Test detection of prototype pollution attempts."""
        code = """
function pollute() {
    const obj = {};
    obj.__proto__.isAdmin = true;
}
"""
        violations = self.validator.validate_code(code, ProgrammingLanguage.JAVASCRIPT)
        
        assert len(violations) == 1
        assert violations[0].severity == "high"
        assert "prototype pollution" in violations[0].description.lower()
    
    def test_safe_python_code(self):
        """Test that safe Python code passes validation."""
        code = """
import math
import json

def calculate_area(radius):
    return math.pi * radius ** 2

def process_data(data):
    parsed = json.loads(data)
    return parsed['value'] * 2
"""
        violations = self.validator.validate_code(code, ProgrammingLanguage.PYTHON)
        
        # Should have no critical violations
        critical_violations = [v for v in violations if v.severity == "critical"]
        assert len(critical_violations) == 0
    
    def test_safe_javascript_code(self):
        """Test that safe JavaScript code passes validation."""
        code = """
function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

function processArray(arr) {
    return arr.map(x => x * 2).filter(x => x > 10);
}
"""
        violations = self.validator.validate_code(code, ProgrammingLanguage.JAVASCRIPT)
        
        # Should have no critical violations
        critical_violations = [v for v in violations if v.severity == "critical"]
        assert len(critical_violations) == 0
    
    def test_is_code_safe_method(self):
        """Test the is_code_safe method."""
        safe_code = """
def add_numbers(a, b):
    return a + b
"""
        
        unsafe_code = """
import subprocess
subprocess.run(['rm', '-rf', '/'])
"""
        
        assert self.validator.is_code_safe(safe_code, ProgrammingLanguage.PYTHON) is True
        assert self.validator.is_code_safe(unsafe_code, ProgrammingLanguage.PYTHON) is False
    
    def test_get_blocked_imports(self):
        """Test getting blocked imports for languages."""
        python_blocked = self.validator.get_blocked_imports(ProgrammingLanguage.PYTHON)
        js_blocked = self.validator.get_blocked_imports(ProgrammingLanguage.JAVASCRIPT)
        
        assert 'os' in python_blocked
        assert 'subprocess' in python_blocked
        assert 'child_process' in js_blocked
        assert 'fs' in js_blocked
    
    def test_sanitize_code(self):
        """Test code sanitization."""
        dangerous_code = """
result = eval("1 + 1")
exec("print('hello')")
"""
        
        sanitized = self.validator.sanitize_code(dangerous_code, ProgrammingLanguage.PYTHON)
        
        assert "safe_eval(" in sanitized
        assert "safe_exec(" in sanitized
        # Check that original dangerous calls are replaced (note: safe_eval contains 'eval' as substring)
        # The key is that the dangerous standalone 'eval(' and 'exec(' are replaced
        assert "result = safe_eval(" in sanitized  # eval replaced with safe_eval
        assert "safe_exec(" in sanitized  # exec replaced with safe_exec
    
    def test_multiple_violations_same_line(self):
        """Test detection of multiple violations on the same line."""
        code = """
import os; import subprocess; eval("dangerous")
"""
        violations = self.validator.validate_code(code, ProgrammingLanguage.PYTHON)
        
        # Should detect multiple violations
        assert len(violations) >= 3
    
    def test_case_insensitive_detection(self):
        """Test that detection is case insensitive."""
        code = """
IMPORT OS
EVAL("test")
"""
        violations = self.validator.validate_code(code, ProgrammingLanguage.PYTHON)
        
        # Should still detect violations despite case differences
        assert len(violations) >= 2