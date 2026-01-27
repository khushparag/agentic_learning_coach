"""Demonstration of the security validator functionality."""

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.domain.entities.code_execution import ProgrammingLanguage
from src.domain.services.security_validator import SecurityValidator


def demonstrate_security_validation():
    """Demonstrate security validation capabilities."""
    print("🔒 Secure Code Execution Service - Security Validator Demo")
    print("=" * 60)
    
    validator = SecurityValidator()
    
    # Test cases with different security levels
    test_cases = [
        {
            "name": "Safe Python Code",
            "language": ProgrammingLanguage.PYTHON,
            "code": """
import math
import json

def calculate_fibonacci(n):
    if n <= 1:
        return n
    return calculate_fibonacci(n - 1) + calculate_fibonacci(n - 2)

def process_data(data_str):
    data = json.loads(data_str)
    result = math.sqrt(data['value'])
    return result

print(calculate_fibonacci(10))
""",
            "expected_safe": True
        },
        {
            "name": "Dangerous Python Code",
            "language": ProgrammingLanguage.PYTHON,
            "code": """
import os
import subprocess

def dangerous_function():
    # Try to execute system commands
    os.system('ls -la')
    subprocess.run(['cat', '/etc/passwd'])
    
    # Try to use eval
    user_input = "print('hacked')"
    eval(user_input)
    
    # Infinite loop
    while True:
        print("This will run forever")
""",
            "expected_safe": False
        },
        {
            "name": "Safe JavaScript Code",
            "language": ProgrammingLanguage.JAVASCRIPT,
            "code": """
function isPrime(n) {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    
    for (let i = 5; i * i <= n; i += 6) {
        if (n % i === 0 || n % (i + 2) === 0) return false;
    }
    return true;
}

function findPrimes(limit) {
    const primes = [];
    for (let i = 2; i <= limit; i++) {
        if (isPrime(i)) {
            primes.push(i);
        }
    }
    return primes;
}

console.log('Primes up to 20:', findPrimes(20));
""",
            "expected_safe": True
        },
        {
            "name": "Dangerous JavaScript Code",
            "language": ProgrammingLanguage.JAVASCRIPT,
            "code": """
const { exec } = require('child_process');
const fs = require('fs');

function hackSystem() {
    // Try to execute system commands
    exec('rm -rf /', (error, stdout, stderr) => {
        console.log('System destroyed');
    });
    
    // Try to read sensitive files
    const passwd = fs.readFileSync('/etc/passwd', 'utf8');
    
    // Use eval for code injection
    const maliciousCode = "console.log('injected code')";
    eval(maliciousCode);
    
    // Prototype pollution
    const obj = {};
    obj.__proto__.isAdmin = true;
}

hackSystem();
""",
            "expected_safe": False
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{i}. Testing: {test_case['name']}")
        print(f"   Language: {test_case['language'].value}")
        print("-" * 40)
        
        # Validate the code
        violations = validator.validate_code(test_case['code'], test_case['language'])
        is_safe = validator.is_code_safe(test_case['code'], test_case['language'])
        
        # Display results
        print(f"   Code is safe: {is_safe}")
        print(f"   Expected safe: {test_case['expected_safe']}")
        print(f"   Violations found: {len(violations)}")
        
        if violations:
            print("   Security violations:")
            for violation in violations:
                severity_emoji = {
                    'critical': '🚨',
                    'high': '⚠️',
                    'medium': '⚡',
                    'low': 'ℹ️'
                }.get(violation.severity, '❓')
                
                print(f"     {severity_emoji} Line {violation.line_number}: {violation.description}")
                print(f"        Severity: {violation.severity.upper()}")
        
        # Verify expectation
        result_emoji = "✅" if is_safe == test_case['expected_safe'] else "❌"
        print(f"   Result: {result_emoji} {'PASS' if is_safe == test_case['expected_safe'] else 'FAIL'}")
    
    print("\n" + "=" * 60)
    print("🎯 Security Validation Demo Complete!")
    
    # Show blocked imports
    print("\n📋 Blocked Imports by Language:")
    for language in [ProgrammingLanguage.PYTHON, ProgrammingLanguage.JAVASCRIPT, ProgrammingLanguage.TYPESCRIPT]:
        blocked = validator.get_blocked_imports(language)
        print(f"   {language.value}: {', '.join(blocked[:5])}{'...' if len(blocked) > 5 else ''}")


def demonstrate_code_sanitization():
    """Demonstrate code sanitization capabilities."""
    print("\n🧹 Code Sanitization Demo")
    print("=" * 40)
    
    validator = SecurityValidator()
    
    dangerous_code = """
# Dangerous Python code
result = eval("1 + 1")
exec("print('hello world')")
data = __import__('os').listdir('.')
"""
    
    print("Original dangerous code:")
    print(dangerous_code)
    
    sanitized = validator.sanitize_code(dangerous_code, ProgrammingLanguage.PYTHON)
    
    print("\nSanitized code:")
    print(sanitized)
    
    print("\n✨ Sanitization complete!")


if __name__ == "__main__":
    try:
        demonstrate_security_validation()
        demonstrate_code_sanitization()
    except Exception as e:
        print(f"❌ Demo failed with error: {e}")
        import traceback
        traceback.print_exc()