"""
Circuit breaker implementation for agent failure management.
Implements the circuit breaker pattern to handle cascading failures.
"""
import time
import asyncio
from typing import Callable, Any, Dict, Optional
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import logging

from .exceptions import CircuitBreakerOpenError, AgentTimeoutError

logger = logging.getLogger(__name__)


class CircuitBreakerState(Enum):
    """Circuit breaker states."""
    CLOSED = "CLOSED"      # Normal operation
    OPEN = "OPEN"          # Failing fast, not calling function
    HALF_OPEN = "HALF_OPEN"  # Testing if service has recovered


@dataclass
class CircuitBreakerConfig:
    """Configuration for circuit breaker behavior."""
    failure_threshold: int = 5  # Number of failures before opening
    recovery_timeout: int = 60  # Seconds to wait before trying again
    success_threshold: int = 3  # Successes needed to close from half-open
    timeout: int = 30  # Default timeout for operations


@dataclass
class CircuitBreakerStats:
    """Statistics for circuit breaker monitoring."""
    failure_count: int = 0
    success_count: int = 0
    last_failure_time: Optional[datetime] = None
    last_success_time: Optional[datetime] = None
    state_changes: int = 0
    total_calls: int = 0


class CircuitBreaker:
    """
    Circuit breaker for protecting against cascading failures.
    
    Implements the circuit breaker pattern with three states:
    - CLOSED: Normal operation, calls pass through
    - OPEN: Fast failure, calls are rejected immediately
    - HALF_OPEN: Testing recovery, limited calls allowed
    """
    
    def __init__(self, config: Optional[CircuitBreakerConfig] = None):
        self.config = config or CircuitBreakerConfig()
        self.state = CircuitBreakerState.CLOSED
        self.stats = CircuitBreakerStats()
        self._lock = asyncio.Lock()
    
    async def call(self, func: Callable, *args, timeout: Optional[int] = None, **kwargs) -> Any:
        """
        Execute a function with circuit breaker protection.
        
        Args:
            func: The function to execute
            *args: Positional arguments for the function
            timeout: Optional timeout override
            **kwargs: Keyword arguments for the function
            
        Returns:
            The result of the function call
            
        Raises:
            CircuitBreakerOpenError: When circuit breaker is OPEN
            AgentTimeoutError: When operation times out
            Exception: Any exception raised by the wrapped function
        """
        async with self._lock:
            self.stats.total_calls += 1
            
            # Check if we should allow the call
            if not self._should_allow_call():
                logger.warning(
                    f"Circuit breaker OPEN, rejecting call. "
                    f"Failures: {self.stats.failure_count}, "
                    f"Last failure: {self.stats.last_failure_time}"
                )
                raise CircuitBreakerOpenError(
                    context={
                        "state": self.state.value,
                        "failure_count": self.stats.failure_count,
                        "last_failure_time": self.stats.last_failure_time
                    }
                )
        
        # Execute the function with timeout
        operation_timeout = timeout or self.config.timeout
        
        try:
            if asyncio.iscoroutinefunction(func):
                result = await asyncio.wait_for(
                    func(*args, **kwargs),
                    timeout=operation_timeout
                )
            else:
                # Run sync function in executor with timeout
                result = await asyncio.wait_for(
                    asyncio.get_event_loop().run_in_executor(
                        None, lambda: func(*args, **kwargs)
                    ),
                    timeout=operation_timeout
                )
            
            # Record success
            await self._record_success()
            return result
            
        except asyncio.TimeoutError:
            await self._record_failure()
            raise AgentTimeoutError(
                f"Operation timed out after {operation_timeout} seconds",
                context={
                    "timeout": operation_timeout,
                    "function": func.__name__ if hasattr(func, '__name__') else str(func)
                }
            )
        except Exception as e:
            await self._record_failure()
            raise
    
    def _should_allow_call(self) -> bool:
        """Determine if a call should be allowed based on current state."""
        if self.state == CircuitBreakerState.CLOSED:
            return True
        
        if self.state == CircuitBreakerState.OPEN:
            # Check if recovery timeout has passed
            if (self.stats.last_failure_time and 
                datetime.now() - self.stats.last_failure_time > 
                timedelta(seconds=self.config.recovery_timeout)):
                self._transition_to_half_open()
                return True
            return False
        
        if self.state == CircuitBreakerState.HALF_OPEN:
            # Allow limited calls in half-open state
            return True
        
        return False
    
    async def _record_success(self) -> None:
        """Record a successful operation."""
        async with self._lock:
            self.stats.success_count += 1
            self.stats.last_success_time = datetime.now()
            
            if self.state == CircuitBreakerState.HALF_OPEN:
                if self.stats.success_count >= self.config.success_threshold:
                    self._transition_to_closed()
            
            logger.debug(
                f"Circuit breaker success recorded. "
                f"State: {self.state.value}, "
                f"Success count: {self.stats.success_count}"
            )
    
    async def _record_failure(self) -> None:
        """Record a failed operation."""
        async with self._lock:
            self.stats.failure_count += 1
            self.stats.last_failure_time = datetime.now()
            
            if (self.state == CircuitBreakerState.CLOSED and 
                self.stats.failure_count >= self.config.failure_threshold):
                self._transition_to_open()
            elif self.state == CircuitBreakerState.HALF_OPEN:
                self._transition_to_open()
            
            logger.warning(
                f"Circuit breaker failure recorded. "
                f"State: {self.state.value}, "
                f"Failure count: {self.stats.failure_count}"
            )
    
    def _transition_to_open(self) -> None:
        """Transition circuit breaker to OPEN state."""
        if self.state != CircuitBreakerState.OPEN:
            logger.error(
                f"Circuit breaker transitioning to OPEN. "
                f"Failure threshold ({self.config.failure_threshold}) exceeded."
            )
            self.state = CircuitBreakerState.OPEN
            self.stats.state_changes += 1
    
    def _transition_to_half_open(self) -> None:
        """Transition circuit breaker to HALF_OPEN state."""
        if self.state != CircuitBreakerState.HALF_OPEN:
            logger.info("Circuit breaker transitioning to HALF_OPEN for recovery testing.")
            self.state = CircuitBreakerState.HALF_OPEN
            self.stats.success_count = 0  # Reset success count for half-open testing
            self.stats.state_changes += 1
    
    def _transition_to_closed(self) -> None:
        """Transition circuit breaker to CLOSED state."""
        if self.state != CircuitBreakerState.CLOSED:
            logger.info("Circuit breaker transitioning to CLOSED. Service recovered.")
            self.state = CircuitBreakerState.CLOSED
            self.stats.failure_count = 0  # Reset failure count
            self.stats.success_count = 0  # Reset success count
            self.stats.state_changes += 1
    
    def get_stats(self) -> Dict[str, Any]:
        """Get current circuit breaker statistics."""
        return {
            "state": self.state.value,
            "failure_count": self.stats.failure_count,
            "success_count": self.stats.success_count,
            "last_failure_time": self.stats.last_failure_time.isoformat() if self.stats.last_failure_time else None,
            "last_success_time": self.stats.last_success_time.isoformat() if self.stats.last_success_time else None,
            "state_changes": self.stats.state_changes,
            "total_calls": self.stats.total_calls,
            "config": {
                "failure_threshold": self.config.failure_threshold,
                "recovery_timeout": self.config.recovery_timeout,
                "success_threshold": self.config.success_threshold,
                "timeout": self.config.timeout
            }
        }
    
    def reset(self) -> None:
        """Reset circuit breaker to initial state."""
        self.state = CircuitBreakerState.CLOSED
        self.stats = CircuitBreakerStats()
        logger.info("Circuit breaker reset to initial state.")