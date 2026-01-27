"""Port interface for code execution service."""

from abc import ABC, abstractmethod
from typing import List

from ...domain.entities.code_execution import (
    CodeExecutionRequest, CodeExecutionResult, ProgrammingLanguage
)


class ICodeExecutionService(ABC):
    """Interface for code execution service."""
    
    @abstractmethod
    async def execute_code(self, request: CodeExecutionRequest) -> CodeExecutionResult:
        """Execute code in a secure environment."""
        pass
    
    @abstractmethod
    def get_supported_languages(self) -> List[ProgrammingLanguage]:
        """Get list of supported programming languages."""
        pass
    
    @abstractmethod
    def is_language_supported(self, language: ProgrammingLanguage) -> bool:
        """Check if a programming language is supported."""
        pass