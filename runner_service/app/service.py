"""Code execution service implementation."""

import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import List
from uuid import uuid4

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

try:
    from runner_service.app.models import (
        CodeExecutionRequest, CodeExecutionResponse, TestResultResponse,
        ResourceUsageResponse, SecurityViolationResponse, LanguageInfoResponse
    )
    from src.domain.entities.code_execution import (
        CodeExecutionRequest as DomainRequest, ExecutionLimits, TestCase,
        ProgrammingLanguage
    )
    from src.domain.services.code_runner import SecureCodeRunner
    from src.ports.services.code_execution_service import ICodeExecutionService
except ImportError as e:
    # Fallback for when running in isolation
    logging.warning(f"Import error: {e}. Running in fallback mode.")
    
    # Mock implementations for testing
    class CodeExecutionRequest:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
    
    class CodeExecutionResponse:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
    
    class TestResultResponse:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
    
    class ResourceUsageResponse:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
    
    class SecurityViolationResponse:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
    
    class LanguageInfoResponse:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
    
    class ProgrammingLanguage:
        PYTHON = "python"
        JAVASCRIPT = "javascript"
        TYPESCRIPT = "typescript"
    
    class SecureCodeRunner:
        def __init__(self):
            pass
        
        async def execute_code(self, request):
            return type('MockResult', (), {
                'success': False,
                'status': type('Status', (), {'value': 'failed'})(),
                'output': 'Service not fully configured',
                'errors': ['Domain services not available'],
                'test_results': [],
                'resource_usage': type('Usage', (), {
                    'cpu_time': 0, 'memory_peak': 0, 'memory_average': 0,
                    'disk_read': 0, 'disk_write': 0
                })(),
                'security_violations': [],
                'execution_time': 0.0,
                'all_tests_passed': False,
                'has_security_violations': False,
                'created_at': datetime.utcnow(),
                'request_id': uuid4()
            })()
        
        def get_supported_languages(self):
            return [ProgrammingLanguage.PYTHON, ProgrammingLanguage.JAVASCRIPT]
        
        def is_language_supported(self, language):
            return language in self.get_supported_languages()
        
        @property
        def language_configs(self):
            return {}
    
    class ICodeExecutionService:
        pass


logger = logging.getLogger(__name__)


class CodeExecutionService(ICodeExecutionService):
    """Implementation of code execution service."""
    
    def __init__(self):
        self.code_runner = SecureCodeRunner()
    
    async def execute_code(self, request: CodeExecutionRequest) -> CodeExecutionResponse:
        """Execute code using the secure code runner."""
        try:
            # Convert API request to domain request
            domain_request = self._convert_to_domain_request(request)
            
            # Execute code
            result = await self.code_runner.execute_code(domain_request)
            
            # Convert domain result to API response
            return self._convert_to_api_response(result)
            
        except Exception as e:
            logger.error(f"Code execution failed: {e}", exc_info=True)
            return CodeExecutionResponse(
                request_id=uuid4(),
                success=False,
                status="failed",
                output="",
                errors=[f"Internal error: {str(e)}"],
                test_results=[],
                resource_usage=ResourceUsageResponse(
                    cpu_time=0.0,
                    memory_peak=0,
                    memory_average=0,
                    disk_read=0,
                    disk_write=0
                ),
                security_violations=[],
                execution_time=0.0,
                all_tests_passed=False,
                has_security_violations=False,
                created_at=datetime.utcnow()
            )
    
    def _convert_to_domain_request(self, api_request: CodeExecutionRequest):
        """Convert API request to domain request."""
        # Mock conversion for fallback mode
        return type('MockRequest', (), {
            'id': uuid4(),
            'code': getattr(api_request, 'code', ''),
            'language': getattr(api_request, 'language', 'python'),
            'test_cases': [],
            'limits': type('Limits', (), {'timeout': 10})(),
            'user_id': getattr(api_request, 'user_id', None),
            'created_at': datetime.utcnow()
        })()
    
    def _convert_to_api_response(self, domain_result) -> CodeExecutionResponse:
        """Convert domain result to API response."""
        return CodeExecutionResponse(
            request_id=getattr(domain_result, 'request_id', uuid4()),
            success=getattr(domain_result, 'success', False),
            status=getattr(domain_result.status, 'value', 'failed') if hasattr(domain_result, 'status') else 'failed',
            output=getattr(domain_result, 'output', ''),
            errors=getattr(domain_result, 'errors', []),
            test_results=[],
            resource_usage=ResourceUsageResponse(
                cpu_time=0.0,
                memory_peak=0,
                memory_average=0,
                disk_read=0,
                disk_write=0
            ),
            security_violations=[],
            execution_time=getattr(domain_result, 'execution_time', 0.0),
            all_tests_passed=getattr(domain_result, 'all_tests_passed', False),
            has_security_violations=getattr(domain_result, 'has_security_violations', False),
            created_at=getattr(domain_result, 'created_at', datetime.utcnow())
        )
    
    def get_supported_languages(self) -> List:
        """Get list of supported programming languages."""
        return self.code_runner.get_supported_languages()
    
    def is_language_supported(self, language) -> bool:
        """Check if a programming language is supported."""
        return self.code_runner.is_language_supported(language)
    
    def get_language_info(self) -> List[LanguageInfoResponse]:
        """Get detailed information about supported languages."""
        try:
            supported_languages = self.code_runner.get_supported_languages()
            language_configs = getattr(self.code_runner, 'language_configs', {})
            
            language_info = []
            
            for lang in [ProgrammingLanguage.PYTHON, ProgrammingLanguage.JAVASCRIPT, ProgrammingLanguage.TYPESCRIPT]:
                config = language_configs.get(lang)
                if config:
                    language_info.append(LanguageInfoResponse(
                        name=lang,
                        version="latest",
                        supported=True,
                        docker_image=getattr(config, 'docker_image', ''),
                        file_extension=getattr(config, 'file_extension', ''),
                        test_framework=getattr(config, 'test_framework', None)
                    ))
                else:
                    language_info.append(LanguageInfoResponse(
                        name=lang,
                        version="unknown",
                        supported=lang in supported_languages,
                        docker_image="",
                        file_extension="",
                        test_framework=None
                    ))
            
            return language_info
        except Exception as e:
            logger.error(f"Failed to get language info: {e}")
            return []