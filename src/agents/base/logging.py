"""
Logging infrastructure for agents.
Provides structured logging with context and correlation tracking.
"""
import logging
import json
import hashlib
from typing import Dict, Any, Optional
from datetime import datetime

from .types import LearningContext, AgentType, AgentResult


class AgentLogger:
    """
    Structured logger for agent operations.
    Provides privacy-safe logging with correlation tracking.
    """
    
    def __init__(self, agent_type: AgentType):
        self.agent_type = agent_type
        self.logger = logging.getLogger(f"agent.{agent_type.value}")
    
    def _hash_user_id(self, user_id: str) -> str:
        """Hash user ID for privacy-safe logging."""
        return hashlib.sha256(user_id.encode()).hexdigest()[:16]
    
    def _create_log_entry(self, 
                         level: str,
                         message: str,
                         context: Optional[LearningContext] = None,
                         operation: Optional[str] = None,
                         duration: Optional[float] = None,
                         result: Optional[AgentResult] = None,
                         error: Optional[Exception] = None,
                         metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Create structured log entry."""
        
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "level": level,
            "message": message,
            "agent_type": self.agent_type.value,
            "context": {},
            "metadata": metadata or {}
        }
        
        if context:
            log_entry["context"] = {
                "user_id": self._hash_user_id(context.user_id),
                "session_id": context.session_id,
                "correlation_id": context.correlation_id,
                "current_objective": context.current_objective,
                "skill_level": context.skill_level
            }
        
        if operation:
            log_entry["operation"] = operation
        
        if duration is not None:
            log_entry["duration"] = duration
        
        if result:
            log_entry["result"] = {
                "success": result.success,
                "error_code": result.error_code,
                "has_data": result.data is not None,
                "next_actions_count": len(result.next_actions)
            }
        
        if error:
            log_entry["error"] = {
                "name": error.__class__.__name__,
                "message": str(error),
                "code": getattr(error, 'error_code', None)
            }
        
        return log_entry
    
    def log_operation_start(self, 
                           operation: str,
                           context: LearningContext,
                           payload: Dict[str, Any]) -> None:
        """Log the start of an agent operation."""
        log_entry = self._create_log_entry(
            level="info",
            message=f"Agent operation started: {operation}",
            context=context,
            operation=operation,
            metadata={
                "payload_keys": list(payload.keys()),
                "payload_size": len(str(payload))
            }
        )
        
        self.logger.info(json.dumps(log_entry))
    
    def log_operation_complete(self,
                              operation: str,
                              context: LearningContext,
                              result: AgentResult,
                              duration: float) -> None:
        """Log the completion of an agent operation."""
        level = "info" if result.success else "error"
        message = f"Agent operation completed: {operation}"
        
        log_entry = self._create_log_entry(
            level=level,
            message=message,
            context=context,
            operation=operation,
            duration=duration,
            result=result
        )
        
        if level == "info":
            self.logger.info(json.dumps(log_entry))
        else:
            self.logger.error(json.dumps(log_entry))
    
    def log_error(self,
                  message: str,
                  error: Exception,
                  context: Optional[LearningContext] = None,
                  operation: Optional[str] = None) -> None:
        """Log an error with full context."""
        log_entry = self._create_log_entry(
            level="error",
            message=message,
            context=context,
            operation=operation,
            error=error
        )
        
        self.logger.error(json.dumps(log_entry))
    
    def log_warning(self,
                   message: str,
                   context: Optional[LearningContext] = None,
                   operation: Optional[str] = None,
                   metadata: Optional[Dict[str, Any]] = None) -> None:
        """Log a warning with context."""
        log_entry = self._create_log_entry(
            level="warning",
            message=message,
            context=context,
            operation=operation,
            metadata=metadata
        )
        
        self.logger.warning(json.dumps(log_entry))
    
    def log_debug(self,
                  message: str,
                  context: Optional[LearningContext] = None,
                  operation: Optional[str] = None,
                  metadata: Optional[Dict[str, Any]] = None) -> None:
        """Log debug information."""
        log_entry = self._create_log_entry(
            level="debug",
            message=message,
            context=context,
            operation=operation,
            metadata=metadata
        )
        
        self.logger.debug(json.dumps(log_entry))
    
    def log_info(self,
                 message: str,
                 context: Optional[LearningContext] = None,
                 operation: Optional[str] = None,
                 metadata: Optional[Dict[str, Any]] = None) -> None:
        """Log informational message."""
        log_entry = self._create_log_entry(
            level="info",
            message=message,
            context=context,
            operation=operation,
            metadata=metadata
        )
        
        self.logger.info(json.dumps(log_entry))