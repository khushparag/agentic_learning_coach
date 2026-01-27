"""Integration tests for the runner service API."""

import pytest
from fastapi.testclient import TestClient
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from runner_service.app.api import app


class TestRunnerAPI:
    """Integration tests for the Runner API."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.client = TestClient(app)
    
    def test_root_endpoint(self):
        """Test the root endpoint."""
        response = self.client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "Secure Code Runner Service"
        assert data["version"] == "1.0.0"
        assert data["status"] == "running"
    
    def test_health_endpoint(self):
        """Test the health check endpoint."""
        response = self.client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "code-runner"
        assert data["version"] == "1.0.0"
        assert "status" in data
        assert "docker_available" in data
        assert "supported_languages" in data
    
    def test_languages_endpoint(self):
        """Test the languages endpoint."""
        response = self.client.get("/languages")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Check that we have language information
        if len(data) > 0:
            lang_info = data[0]
            assert "name" in lang_info
            assert "supported" in lang_info
            assert "docker_image" in lang_info
    
    def test_language_validation_supported(self):
        """Test language validation for supported language."""
        response = self.client.get("/languages/python/validate")
        
        assert response.status_code == 200
        data = response.json()
        assert data["language"] == "python"
        assert "supported" in data
    
    def test_language_validation_unsupported(self):
        """Test language validation for unsupported language."""
        response = self.client.get("/languages/cobol/validate")
        
        assert response.status_code == 200
        data = response.json()
        assert data["language"] == "cobol"
        assert data["supported"] is False
        assert "error" in data
    
    def test_code_validation_safe(self):
        """Test code validation for safe code."""
        request_data = {
            "code": "def add(a, b):\n    return a + b\n\nprint(add(2, 3))",
            "language": "python",
            "test_cases": [],
            "limits": {}
        }
        
        response = self.client.post("/validate", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "safe" in data
        assert "violations" in data
        assert "blocked_imports" in data
        assert isinstance(data["violations"], list)
    
    def test_code_validation_unsafe(self):
        """Test code validation for unsafe code."""
        request_data = {
            "code": "import os\nos.system('rm -rf /')",
            "language": "python",
            "test_cases": [],
            "limits": {}
        }
        
        response = self.client.post("/validate", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["safe"] is False
        assert len(data["violations"]) > 0
        
        # Check that we have security violations
        violations = data["violations"]
        assert any(v["severity"] in ["high", "critical"] for v in violations)
    
    def test_code_execution_simple(self):
        """Test simple code execution."""
        request_data = {
            "code": "print('Hello, World!')",
            "language": "python",
            "test_cases": [],
            "limits": {
                "timeout": 5,
                "memory_limit": 128
            }
        }
        
        response = self.client.post("/execute", json=request_data)
        
        # Should return 200 even if execution fails (business logic)
        assert response.status_code == 200
        data = response.json()
        
        # Check response structure
        assert "success" in data
        assert "status" in data
        assert "output" in data
        assert "errors" in data
        assert "test_results" in data
        assert "resource_usage" in data
        assert "security_violations" in data
        assert "execution_time" in data
    
    def test_code_execution_with_test_cases(self):
        """Test code execution with test cases."""
        request_data = {
            "code": """
def multiply(a, b):
    return a * b

def main(input_data):
    a, b = map(int, input_data.split(','))
    return multiply(a, b)
""",
            "language": "python",
            "test_cases": [
                {
                    "name": "test_multiply",
                    "input_data": "3,4",
                    "expected_output": "12"
                }
            ],
            "limits": {
                "timeout": 10
            }
        }
        
        response = self.client.post("/execute", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        
        # Check that test results are included
        assert "test_results" in data
        if data["success"]:
            assert len(data["test_results"]) == 1
    
    def test_code_execution_security_violation(self):
        """Test code execution with security violations."""
        request_data = {
            "code": "import subprocess\nsubprocess.run(['ls', '-la'])",
            "language": "python",
            "test_cases": [],
            "limits": {}
        }
        
        response = self.client.post("/execute", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        
        # Should detect security violation
        assert data["success"] is False
        assert data["status"] == "security_violation"
        assert len(data["security_violations"]) > 0
    
    def test_code_execution_invalid_language(self):
        """Test code execution with invalid language."""
        request_data = {
            "code": "print('hello')",
            "language": "invalid_language",
            "test_cases": [],
            "limits": {}
        }
        
        response = self.client.post("/execute", json=request_data)
        
        # Should return 422 for validation error
        assert response.status_code == 422
    
    def test_code_execution_empty_code(self):
        """Test code execution with empty code."""
        request_data = {
            "code": "",
            "language": "python",
            "test_cases": [],
            "limits": {}
        }
        
        response = self.client.post("/execute", json=request_data)
        
        # Should return 422 for validation error
        assert response.status_code == 422
    
    def test_code_execution_invalid_limits(self):
        """Test code execution with invalid limits."""
        request_data = {
            "code": "print('hello')",
            "language": "python",
            "test_cases": [],
            "limits": {
                "timeout": -1,  # Invalid timeout
                "memory_limit": 1000000  # Too high
            }
        }
        
        response = self.client.post("/execute", json=request_data)
        
        # Should return 422 for validation error
        assert response.status_code == 422
    
    def test_code_execution_large_code(self):
        """Test code execution with large code input."""
        # Create a large code string (but within limits)
        large_code = "# " + "x" * 1000 + "\nprint('hello')"
        
        request_data = {
            "code": large_code,
            "language": "python",
            "test_cases": [],
            "limits": {}
        }
        
        response = self.client.post("/execute", json=request_data)
        
        assert response.status_code == 200
        # Should process the request even if it's large
    
    def test_code_execution_too_large_code(self):
        """Test code execution with code that exceeds size limit."""
        # Create code that exceeds the 50000 character limit
        too_large_code = "# " + "x" * 60000 + "\nprint('hello')"
        
        request_data = {
            "code": too_large_code,
            "language": "python",
            "test_cases": [],
            "limits": {}
        }
        
        response = self.client.post("/execute", json=request_data)
        
        # Should return 422 for validation error
        assert response.status_code == 422
    
    def test_concurrent_requests(self):
        """Test handling of concurrent requests."""
        import threading
        import time
        
        results = []
        
        def make_request():
            request_data = {
                "code": "import time\ntime.sleep(0.1)\nprint('done')",
                "language": "python",
                "test_cases": [],
                "limits": {"timeout": 5}
            }
            response = self.client.post("/execute", json=request_data)
            results.append(response.status_code)
        
        # Create multiple threads
        threads = []
        for _ in range(3):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
        
        # Start all threads
        start_time = time.time()
        for thread in threads:
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        end_time = time.time()
        
        # All requests should complete successfully
        assert len(results) == 3
        assert all(status == 200 for status in results)
        
        # Should handle concurrent requests efficiently
        assert end_time - start_time < 2.0  # Should not take too long