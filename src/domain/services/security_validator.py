"""Security validation service for code execution."""

import re
from typing import List, Dict, Pattern
from dataclasses import dataclass

from ..entities.code_execution import SecurityViolation, ProgrammingLanguage


@dataclass(frozen=True)
class SecurityPattern:
    """Security pattern definition."""
    pattern: Pattern[str]
    description: str
    severity: str
    language: ProgrammingLanguage


class SecurityValidator:
    """Validates code for security violations."""
    
    def __init__(self):
        self._patterns = self._initialize_patterns()
    
    def _initialize_patterns(self) -> Dict[ProgrammingLanguage, List[SecurityPattern]]:
        """Initialize security patterns for different languages."""
        patterns = {
            ProgrammingLanguage.PYTHON: [
                # Critical patterns
                SecurityPattern(
                    pattern=re.compile(r'\beval\s*\(', re.IGNORECASE),
                    description="Use of eval() function - can execute arbitrary code",
                    severity="critical",
                    language=ProgrammingLanguage.PYTHON
                ),
                SecurityPattern(
                    pattern=re.compile(r'\bexec\s*\(', re.IGNORECASE),
                    description="Use of exec() function - can execute arbitrary code",
                    severity="critical",
                    language=ProgrammingLanguage.PYTHON
                ),
                SecurityPattern(
                    pattern=re.compile(r'\b__import__\s*\(', re.IGNORECASE),
                    description="Direct use of __import__ - potential security risk",
                    severity="high",
                    language=ProgrammingLanguage.PYTHON
                ),
                SecurityPattern(
                    pattern=re.compile(r'import\s+os\b', re.IGNORECASE),
                    description="Import of os module - system access",
                    severity="high",
                    language=ProgrammingLanguage.PYTHON
                ),
                SecurityPattern(
                    pattern=re.compile(r'import\s+subprocess\b', re.IGNORECASE),
                    description="Import of subprocess module - command execution",
                    severity="critical",
                    language=ProgrammingLanguage.PYTHON
                ),
                SecurityPattern(
                    pattern=re.compile(r'import\s+sys\b', re.IGNORECASE),
                    description="Import of sys module - system access",
                    severity="medium",
                    language=ProgrammingLanguage.PYTHON
                ),
                SecurityPattern(
                    pattern=re.compile(r'from\s+os\s+import', re.IGNORECASE),
                    description="Import from os module - system access",
                    severity="high",
                    language=ProgrammingLanguage.PYTHON
                ),
                SecurityPattern(
                    pattern=re.compile(r'open\s*\(\s*[\'"][^\'\"]*[\'"]', re.IGNORECASE),
                    description="File operations - potential file system access",
                    severity="medium",
                    language=ProgrammingLanguage.PYTHON
                ),
                SecurityPattern(
                    pattern=re.compile(r'while\s+True\s*:', re.IGNORECASE),
                    description="Infinite loop detected - potential DoS",
                    severity="medium",
                    language=ProgrammingLanguage.PYTHON
                ),
                SecurityPattern(
                    pattern=re.compile(r'for\s+\w+\s+in\s+range\s*\(\s*\d{6,}', re.IGNORECASE),
                    description="Large range loop - potential DoS",
                    severity="medium",
                    language=ProgrammingLanguage.PYTHON
                ),
                # Network access
                SecurityPattern(
                    pattern=re.compile(r'import\s+(urllib|requests|socket|http)\b', re.IGNORECASE),
                    description="Network library import - external access",
                    severity="high",
                    language=ProgrammingLanguage.PYTHON
                ),
            ],
            
            ProgrammingLanguage.JAVASCRIPT: [
                # Critical patterns
                SecurityPattern(
                    pattern=re.compile(r'\beval\s*\(', re.IGNORECASE),
                    description="Use of eval() function - can execute arbitrary code",
                    severity="critical",
                    language=ProgrammingLanguage.JAVASCRIPT
                ),
                SecurityPattern(
                    pattern=re.compile(r'Function\s*\(', re.IGNORECASE),
                    description="Function constructor - can execute arbitrary code",
                    severity="critical",
                    language=ProgrammingLanguage.JAVASCRIPT
                ),
                SecurityPattern(
                    pattern=re.compile(r'require\s*\(\s*[\'"]child_process[\'"]', re.IGNORECASE),
                    description="Child process module - command execution",
                    severity="critical",
                    language=ProgrammingLanguage.JAVASCRIPT
                ),
                SecurityPattern(
                    pattern=re.compile(r'require\s*\(\s*[\'"]fs[\'"]', re.IGNORECASE),
                    description="File system module - file access",
                    severity="high",
                    language=ProgrammingLanguage.JAVASCRIPT
                ),
                SecurityPattern(
                    pattern=re.compile(r'require\s*\(\s*[\'"]net[\'"]', re.IGNORECASE),
                    description="Network module - external access",
                    severity="high",
                    language=ProgrammingLanguage.JAVASCRIPT
                ),
                SecurityPattern(
                    pattern=re.compile(r'require\s*\(\s*[\'"]http[\'"]', re.IGNORECASE),
                    description="HTTP module - external access",
                    severity="high",
                    language=ProgrammingLanguage.JAVASCRIPT
                ),
                SecurityPattern(
                    pattern=re.compile(r'process\.exit', re.IGNORECASE),
                    description="Process exit - potential disruption",
                    severity="medium",
                    language=ProgrammingLanguage.JAVASCRIPT
                ),
                SecurityPattern(
                    pattern=re.compile(r'while\s*\(\s*true\s*\)', re.IGNORECASE),
                    description="Infinite loop detected - potential DoS",
                    severity="medium",
                    language=ProgrammingLanguage.JAVASCRIPT
                ),
                SecurityPattern(
                    pattern=re.compile(r'__proto__', re.IGNORECASE),
                    description="Prototype pollution attempt",
                    severity="high",
                    language=ProgrammingLanguage.JAVASCRIPT
                ),
                SecurityPattern(
                    pattern=re.compile(r'constructor\.constructor', re.IGNORECASE),
                    description="Constructor access - potential code execution",
                    severity="high",
                    language=ProgrammingLanguage.JAVASCRIPT
                ),
            ],
            
            ProgrammingLanguage.TYPESCRIPT: [
                # TypeScript inherits JavaScript patterns plus some additional ones
                SecurityPattern(
                    pattern=re.compile(r'\beval\s*\(', re.IGNORECASE),
                    description="Use of eval() function - can execute arbitrary code",
                    severity="critical",
                    language=ProgrammingLanguage.TYPESCRIPT
                ),
                SecurityPattern(
                    pattern=re.compile(r'Function\s*\(', re.IGNORECASE),
                    description="Function constructor - can execute arbitrary code",
                    severity="critical",
                    language=ProgrammingLanguage.TYPESCRIPT
                ),
                SecurityPattern(
                    pattern=re.compile(r'require\s*\(\s*[\'"]child_process[\'"]', re.IGNORECASE),
                    description="Child process module - command execution",
                    severity="critical",
                    language=ProgrammingLanguage.TYPESCRIPT
                ),
                SecurityPattern(
                    pattern=re.compile(r'import.*from\s+[\'"]child_process[\'"]', re.IGNORECASE),
                    description="Child process import - command execution",
                    severity="critical",
                    language=ProgrammingLanguage.TYPESCRIPT
                ),
            ]
        }
        
        # Add common patterns for Java and Go when implemented
        patterns[ProgrammingLanguage.JAVA] = []
        patterns[ProgrammingLanguage.GO] = []
        
        return patterns
    
    def validate_code(self, code: str, language: ProgrammingLanguage) -> List[SecurityViolation]:
        """Validate code for security violations."""
        violations = []
        
        if language not in self._patterns:
            return violations
        
        lines = code.split('\n')
        patterns = self._patterns[language]
        
        for pattern_def in patterns:
            for line_num, line in enumerate(lines, 1):
                if pattern_def.pattern.search(line):
                    violations.append(SecurityViolation(
                        pattern=pattern_def.pattern.pattern,
                        line_number=line_num,
                        description=pattern_def.description,
                        severity=pattern_def.severity
                    ))
        
        return violations
    
    def sanitize_code(self, code: str, language: ProgrammingLanguage) -> str:
        """Sanitize code by removing or replacing dangerous constructs."""
        sanitized = code
        
        if language == ProgrammingLanguage.PYTHON:
            # Replace dangerous functions with safe alternatives
            sanitized = re.sub(r'\beval\s*\(', 'safe_eval(', sanitized, flags=re.IGNORECASE)
            sanitized = re.sub(r'\bexec\s*\(', 'safe_exec(', sanitized, flags=re.IGNORECASE)
            
        elif language in [ProgrammingLanguage.JAVASCRIPT, ProgrammingLanguage.TYPESCRIPT]:
            # Replace dangerous functions
            sanitized = re.sub(r'\beval\s*\(', 'safe_eval(', sanitized, flags=re.IGNORECASE)
            sanitized = re.sub(r'Function\s*\(', 'SafeFunction(', sanitized, flags=re.IGNORECASE)
        
        return sanitized
    
    def is_code_safe(self, code: str, language: ProgrammingLanguage) -> bool:
        """Check if code is safe to execute."""
        violations = self.validate_code(code, language)
        critical_violations = [v for v in violations if v.severity == 'critical']
        return len(critical_violations) == 0
    
    def get_blocked_imports(self, language: ProgrammingLanguage) -> List[str]:
        """Get list of blocked imports for a language."""
        blocked_imports = {
            ProgrammingLanguage.PYTHON: [
                'os', 'subprocess', 'sys', 'socket', 'urllib', 'requests',
                'http', 'ftplib', 'smtplib', 'telnetlib', 'multiprocessing',
                'threading', 'ctypes', 'importlib'
            ],
            ProgrammingLanguage.JAVASCRIPT: [
                'child_process', 'fs', 'net', 'http', 'https', 'cluster',
                'worker_threads', 'dgram', 'tls', 'crypto'
            ],
            ProgrammingLanguage.TYPESCRIPT: [
                'child_process', 'fs', 'net', 'http', 'https', 'cluster',
                'worker_threads', 'dgram', 'tls', 'crypto'
            ]
        }
        
        return blocked_imports.get(language, [])