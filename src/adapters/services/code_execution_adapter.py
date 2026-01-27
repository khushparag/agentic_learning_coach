"""Adapter for code execution service integration."""

import asyncio
import logging
from typing import List, Optional
import httpx
from datetime import datetime

from ...domain.entities.code_execution import (
    CodeExecutionRequest as DomainRequest,
    CodeExecutionResult as DomainResult,
    ProgrammingLanguage,
    ExecutionStatus,
    TestResult,
    ResourceUsage,
    SecurityViolation
)
from ...ports.services.code_execution_service import ICodeExecutionService


logger = logging.getLogger(__name__)


class CodeExecutionServiceAdapter(ICodeExecutionService):
    """Adapter for remote code execution service."""
    
    def __init__(self, service_url: str = "http://localhost:8001"):
        self.service_url = service_url.rstrip('/')
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def execute_code(self, request: DomainRequest) -> DomainResult:
        """Execute code via remote service."""
        try:
            # Convert domain request to API format
            api_request = self._convert_to_api_request(request)
            
            # Make HTTP request
            response = await self.client.post(
                f"{self.service_url}/execute",
                json=api_request
            )
            response.raise_for_status()
            
            # Convert API response to domain result
            api_result = response.json()
            return self._convert_to_domain_result(api_result, request.id)
            
        except httpx.HTTPError as e:
            logger.error(f"HTTP error calling code execution service: {e}")
            return self._create_error_result(
                request.id,
                f"Service unavailable: {str(e)}"
            )
        except Exception as e:
            logger.error(f"Unexpected error in code execution: {e}")
            return self._create_error_result(
                request.id,
                f"Internal error: {str(e)}"
            )
    
    def _convert_to_api_request(self, domain_request: DomainRequest) -> dict:
        """Convert domain request to API request format."""
        return {
            "code": domain_request.code,
            "language": domain_request.language.value,
            "test_cases": [
                {
                    "name": tc.name,
                    "input_data": tc.input_data,
                    "expected_output": tc.expected_output,
                    "timeout": tc.timeout
                }
                for tc in domain_request.test_cases
            ],
            "limits": {
                "timeout": domain_request.limits.timeout,
                "memory_limit": domain_request.limits.memory_limit // (1024 * 1024),  # Convert to MB
                "cpu_limit": domain_request.limits.cpu_limit,
                "disk_limit": domain_request.limits.disk_limit // (1024 * 1024),  # Convert to MB
                "network_access": domain_request.limits.network_access,
                "file_system_access": domain_request.limits.file_system_access
            },
            "user_id": str(domain_request.user_id) if domain_request.user_id else None
        }
    
    def _convert_to_domain_result(self, api_result: dict, request_id) -> DomainResult:
        """Convert API result to domain result."""
        # Convert test results
        test_results = [
            TestResult(
                test_name=tr["test_name"],
                passed=tr["passed"],
                actual_output=tr["actual_output"],
                expected_output=tr["expected_output"],
                execution_time=tr["execution_time"],
                error_message=tr.get("error_message")
            )
            for tr in api_result.get("test_results", [])
        ]
        
        # Convert resource usage
        resource_data = api_result.get("resource_usage", {})
        resource_usage = ResourceUsage(
            cpu_time=resource_data.get("cpu_time", 0.0),
            memory_peak=resource_data.get("memory_peak", 0),
            memory_average=resource_data.get("memory_average", 0),
            disk_read=resource_data.get("disk_read", 0),
            disk_write=resource_data.get("disk_write", 0)
        )
        
        # Convert security violations
        security_violations = [
            SecurityViolation(
                pattern=sv["pattern"],
                line_number=sv.get("line_number"),
                description=sv["description"],
                severity=sv["severity"]
            )
            for sv in api_result.get("security_violations", [])
        ]
        
        # Convert status
        status_str = api_result.get("status", "failed")
        try:
            status = ExecutionStatus(status_str)
        except ValueError:
            status = ExecutionStatus.FAILED
        
        return DomainResult(
            request_id=request_id,
            status=status,
            output=api_result.get("output", ""),
            errors=api_result.get("errors", []),
            test_results=test_results,
            resource_usage=resource_usage,
            security_violations=security_violations,
            execution_time=api_result.get("execution_time", 0.0),
            created_at=datetime.utcnow()
        )
    
    def _create_error_result(self, request_id, error_message: str) -> DomainResult:
        """Create an error result."""
        return DomainResult(
            request_id=request_id,
            status=ExecutionStatus.FAILED,
            output="",
            errors=[error_message],
            test_results=[],
            resource_usage=ResourceUsage(0, 0, 0, 0, 0),
            security_violations=[],
            execution_time=0.0,
            created_at=datetime.utcnow()
        )
    
    def get_supported_languages(self) -> List[ProgrammingLanguage]:
        """Get list of supported programming languages."""
        try:
            # This would be cached in a real implementation
            response = httpx.get(f"{self.service_url}/languages", timeout=5.0)
            response.raise_for_status()
            
            languages_data = response.json()
            supported = []
            
            for lang_info in languages_data:
                if lang_info.get("supported", False):
                    try:
                        lang = ProgrammingLanguage(lang_info["name"])
                        supported.append(lang)
                    except ValueError:
                        continue
            
            return supported
            
        except Exception as e:
            logger.error(f"Failed to get supported languages: {e}")
            # Return default supported languages
            return [ProgrammingLanguage.PYTHON, ProgrammingLanguage.JAVASCRIPT]
    
    def is_language_supported(self, language: ProgrammingLanguage) -> bool:
        """Check if a programming language is supported."""
        supported_languages = self.get_supported_languages()
        return language in supported_languages
    
    async def validate_code(self, code: str, language: ProgrammingLanguage) -> dict:
        """Validate code for security violations."""
        try:
            request_data = {
                "code": code,
                "language": language.value,
                "test_cases": [],
                "limits": {}
            }
            
            response = await self.client.post(
                f"{self.service_url}/validate",
                json=request_data
            )
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error(f"Code validation failed: {e}")
            return {
                "safe": False,
                "violations": [],
                "message": f"Validation service error: {str(e)}"
            }
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()