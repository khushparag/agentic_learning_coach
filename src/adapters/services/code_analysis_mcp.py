"""
Code Analysis MCP implementation for static analysis and difficulty estimation.
"""
import ast
import re
import logging
from typing import Dict, List, Optional, Any, Set
from dataclasses import dataclass

from ...ports.services.mcp_tools import (
    ICodeAnalysisMCP, 
    CodeAnalysisResult, 
    DifficultyLevel
)


logger = logging.getLogger(__name__)


@dataclass
class ComplexityMetrics:
    """Code complexity metrics."""
    cyclomatic_complexity: int = 0
    cognitive_complexity: int = 0
    lines_of_code: int = 0
    number_of_functions: int = 0
    number_of_classes: int = 0
    max_nesting_depth: int = 0
    number_of_imports: int = 0


class CodeAnalysisMCP(ICodeAnalysisMCP):
    """
    Code Analysis MCP implementation using static analysis.
    
    Provides:
    - Complexity analysis
    - Difficulty estimation
    - Code improvement suggestions
    - Topic extraction
    """
    
    def __init__(self):
        # Difficulty thresholds for different metrics
        self.complexity_thresholds = {
            DifficultyLevel.BEGINNER: {'cyclomatic': 5, 'cognitive': 8, 'nesting': 2},
            DifficultyLevel.INTERMEDIATE: {'cyclomatic': 15, 'cognitive': 20, 'nesting': 4},
            DifficultyLevel.ADVANCED: {'cyclomatic': 30, 'cognitive': 40, 'nesting': 6},
            DifficultyLevel.EXPERT: {'cyclomatic': float('inf'), 'cognitive': float('inf'), 'nesting': float('inf')}
        }
        
        # Programming concepts and their difficulty levels
        self.concept_difficulty = {
            # Beginner concepts
            'variables': DifficultyLevel.BEGINNER,
            'print': DifficultyLevel.BEGINNER,
            'input': DifficultyLevel.BEGINNER,
            'arithmetic': DifficultyLevel.BEGINNER,
            'strings': DifficultyLevel.BEGINNER,
            
            # Intermediate concepts
            'functions': DifficultyLevel.INTERMEDIATE,
            'loops': DifficultyLevel.INTERMEDIATE,
            'conditionals': DifficultyLevel.INTERMEDIATE,
            'lists': DifficultyLevel.INTERMEDIATE,
            'dictionaries': DifficultyLevel.INTERMEDIATE,
            'file_io': DifficultyLevel.INTERMEDIATE,
            
            # Advanced concepts
            'classes': DifficultyLevel.ADVANCED,
            'inheritance': DifficultyLevel.ADVANCED,
            'exceptions': DifficultyLevel.ADVANCED,
            'decorators': DifficultyLevel.ADVANCED,
            'generators': DifficultyLevel.ADVANCED,
            'async': DifficultyLevel.ADVANCED,
            
            # Expert concepts
            'metaclasses': DifficultyLevel.EXPERT,
            'descriptors': DifficultyLevel.EXPERT,
            'context_managers': DifficultyLevel.EXPERT,
            'threading': DifficultyLevel.EXPERT,
            'multiprocessing': DifficultyLevel.EXPERT
        }
    
    async def analyze_code_complexity(self, code: str, language: str) -> CodeAnalysisResult:
        """Analyze code complexity and difficulty."""
        try:
            if language.lower() == 'python':
                return await self._analyze_python_code(code)
            elif language.lower() in ['javascript', 'typescript']:
                return await self._analyze_javascript_code(code)
            else:
                return await self._analyze_generic_code(code, language)
                
        except Exception as e:
            logger.error(f"Code analysis failed: {e}")
            return self._create_default_analysis_result(code, language)
    
    async def estimate_difficulty(self, code: str, language: str) -> DifficultyLevel:
        """Estimate the difficulty level of code."""
        try:
            analysis = await self.analyze_code_complexity(code, language)
            return analysis.difficulty_level
        except Exception as e:
            logger.error(f"Difficulty estimation failed: {e}")
            return DifficultyLevel.INTERMEDIATE
    
    async def suggest_improvements(self, code: str, language: str) -> List[str]:
        """Suggest code improvements."""
        try:
            suggestions = []
            
            if language.lower() == 'python':
                suggestions.extend(self._analyze_python_improvements(code))
            elif language.lower() in ['javascript', 'typescript']:
                suggestions.extend(self._analyze_javascript_improvements(code))
            
            # Generic suggestions
            suggestions.extend(self._analyze_generic_improvements(code))
            
            return suggestions[:10]  # Limit to top 10 suggestions
            
        except Exception as e:
            logger.error(f"Improvement suggestion failed: {e}")
            return ["Consider adding comments to explain complex logic"]
    
    async def extract_topics(self, code: str, language: str) -> List[str]:
        """Extract programming topics/concepts from code."""
        try:
            topics = set()
            
            if language.lower() == 'python':
                topics.update(self._extract_python_topics(code))
            elif language.lower() in ['javascript', 'typescript']:
                topics.update(self._extract_javascript_topics(code))
            
            # Generic topic extraction
            topics.update(self._extract_generic_topics(code))
            
            return list(topics)
            
        except Exception as e:
            logger.error(f"Topic extraction failed: {e}")
            return [language.lower()]
    
    async def _analyze_python_code(self, code: str) -> CodeAnalysisResult:
        """Analyze Python code using AST."""
        try:
            tree = ast.parse(code)
            metrics = self._calculate_python_metrics(tree, code)
            
            # Calculate complexity score (0.0 to 1.0)
            complexity_score = self._calculate_complexity_score(metrics)
            
            # Determine difficulty level
            difficulty_level = self._determine_difficulty_level(metrics)
            
            # Find issues
            issues = self._find_python_issues(tree, code)
            
            # Generate suggestions
            suggestions = self._generate_python_suggestions(metrics, issues)
            
            # Estimate time
            estimated_time = self._estimate_completion_time(metrics, difficulty_level)
            
            # Extract topics
            topics = self._extract_python_topics(code)
            
            return CodeAnalysisResult(
                complexity_score=complexity_score,
                difficulty_level=difficulty_level,
                issues=issues,
                suggestions=suggestions,
                estimated_time_minutes=estimated_time,
                topics_covered=topics
            )
            
        except SyntaxError as e:
            return CodeAnalysisResult(
                complexity_score=0.8,  # High complexity due to syntax errors
                difficulty_level=DifficultyLevel.ADVANCED,
                issues=[{
                    'type': 'syntax_error',
                    'line': e.lineno,
                    'message': str(e),
                    'severity': 'high'
                }],
                suggestions=['Fix syntax errors before proceeding'],
                estimated_time_minutes=30,
                topics_covered=['debugging', 'syntax']
            )
    
    def _calculate_python_metrics(self, tree: ast.AST, code: str) -> ComplexityMetrics:
        """Calculate complexity metrics for Python code."""
        metrics = ComplexityMetrics()
        
        # Lines of code (excluding empty lines and comments)
        lines = [line.strip() for line in code.split('\n')]
        metrics.lines_of_code = len([line for line in lines if line and not line.startswith('#')])
        
        # AST-based metrics
        for node in ast.walk(tree):
            # Function and class counts
            if isinstance(node, ast.FunctionDef):
                metrics.number_of_functions += 1
            elif isinstance(node, ast.ClassDef):
                metrics.number_of_classes += 1
            elif isinstance(node, (ast.Import, ast.ImportFrom)):
                metrics.number_of_imports += 1
            
            # Cyclomatic complexity contributors
            elif isinstance(node, (ast.If, ast.While, ast.For, ast.Try, ast.With)):
                metrics.cyclomatic_complexity += 1
            elif isinstance(node, ast.BoolOp):
                metrics.cyclomatic_complexity += len(node.values) - 1
        
        # Calculate nesting depth
        metrics.max_nesting_depth = self._calculate_max_nesting_depth(tree)
        
        # Cognitive complexity (simplified)
        metrics.cognitive_complexity = metrics.cyclomatic_complexity + metrics.max_nesting_depth
        
        return metrics
    
    def _calculate_max_nesting_depth(self, tree: ast.AST) -> int:
        """Calculate maximum nesting depth in AST."""
        max_depth = 0
        
        def visit_node(node: ast.AST, current_depth: int = 0):
            nonlocal max_depth
            max_depth = max(max_depth, current_depth)
            
            # Nodes that increase nesting
            if isinstance(node, (ast.If, ast.While, ast.For, ast.Try, ast.With, 
                               ast.FunctionDef, ast.ClassDef)):
                current_depth += 1
            
            for child in ast.iter_child_nodes(node):
                visit_node(child, current_depth)
        
        visit_node(tree)
        return max_depth
    
    def _calculate_complexity_score(self, metrics: ComplexityMetrics) -> float:
        """Calculate normalized complexity score (0.0 to 1.0)."""
        # Weighted combination of different metrics
        cyclomatic_score = min(1.0, metrics.cyclomatic_complexity / 20.0)
        cognitive_score = min(1.0, metrics.cognitive_complexity / 30.0)
        nesting_score = min(1.0, metrics.max_nesting_depth / 6.0)
        size_score = min(1.0, metrics.lines_of_code / 100.0)
        
        # Weighted average
        complexity_score = (
            cyclomatic_score * 0.3 +
            cognitive_score * 0.3 +
            nesting_score * 0.2 +
            size_score * 0.2
        )
        
        return complexity_score
    
    def _determine_difficulty_level(self, metrics: ComplexityMetrics) -> DifficultyLevel:
        """Determine difficulty level based on metrics."""
        for level, thresholds in self.complexity_thresholds.items():
            if (metrics.cyclomatic_complexity <= thresholds['cyclomatic'] and
                metrics.cognitive_complexity <= thresholds['cognitive'] and
                metrics.max_nesting_depth <= thresholds['nesting']):
                return level
        
        return DifficultyLevel.EXPERT
    
    def _find_python_issues(self, tree: ast.AST, code: str) -> List[Dict[str, Any]]:
        """Find potential issues in Python code."""
        issues = []
        
        # Check for common issues
        for node in ast.walk(tree):
            # Unused variables (simplified check)
            if isinstance(node, ast.Name) and isinstance(node.ctx, ast.Store):
                if node.id.startswith('_') and node.id != '_':
                    issues.append({
                        'type': 'unused_variable',
                        'line': node.lineno,
                        'message': f"Variable '{node.id}' appears to be unused",
                        'severity': 'low'
                    })
            
            # Long functions
            elif isinstance(node, ast.FunctionDef):
                if hasattr(node, 'end_lineno') and node.end_lineno:
                    func_length = node.end_lineno - node.lineno
                    if func_length > 50:
                        issues.append({
                            'type': 'long_function',
                            'line': node.lineno,
                            'message': f"Function '{node.name}' is {func_length} lines long",
                            'severity': 'medium'
                        })
            
            # Deeply nested code
            elif isinstance(node, (ast.If, ast.While, ast.For)):
                depth = self._get_node_depth(tree, node)
                if depth > 4:
                    issues.append({
                        'type': 'deep_nesting',
                        'line': node.lineno,
                        'message': f"Code is nested {depth} levels deep",
                        'severity': 'medium'
                    })
        
        return issues
    
    def _get_node_depth(self, tree: ast.AST, target_node: ast.AST) -> int:
        """Get the nesting depth of a specific node."""
        # Simplified implementation
        return 1  # Would need proper parent tracking in real implementation
    
    def _generate_python_suggestions(self, metrics: ComplexityMetrics, issues: List[Dict[str, Any]]) -> List[str]:
        """Generate improvement suggestions for Python code."""
        suggestions = []
        
        # Complexity-based suggestions
        if metrics.cyclomatic_complexity > 10:
            suggestions.append("Consider breaking down complex functions into smaller ones")
        
        if metrics.max_nesting_depth > 3:
            suggestions.append("Reduce nesting depth by using early returns or guard clauses")
        
        if metrics.lines_of_code > 50:
            suggestions.append("Consider splitting large functions into smaller, focused functions")
        
        # Issue-based suggestions
        for issue in issues:
            if issue['type'] == 'unused_variable':
                suggestions.append("Remove unused variables to improve code clarity")
            elif issue['type'] == 'long_function':
                suggestions.append("Break down long functions using the Single Responsibility Principle")
            elif issue['type'] == 'deep_nesting':
                suggestions.append("Use early returns to reduce nesting levels")
        
        return suggestions
    
    def _analyze_python_improvements(self, code: str) -> List[str]:
        """Analyze Python code for improvement suggestions."""
        suggestions = []
        
        try:
            tree = ast.parse(code)
            
            # Check for single-letter variable names
            single_letter_vars = set()
            for node in ast.walk(tree):
                if isinstance(node, ast.Name) and isinstance(node.ctx, ast.Store):
                    if len(node.id) == 1 and node.id not in ('_', 'i', 'j', 'k', 'x', 'y', 'n'):
                        single_letter_vars.add(node.id)
                    elif len(node.id) == 1:
                        single_letter_vars.add(node.id)
            
            if single_letter_vars:
                suggestions.append("Consider using more descriptive variable names instead of single letters")
            
            # Check for missing docstrings in functions
            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    if not (node.body and isinstance(node.body[0], ast.Expr) and 
                            isinstance(node.body[0].value, ast.Constant) and 
                            isinstance(node.body[0].value.value, str)):
                        suggestions.append(f"Consider adding a docstring to function '{node.name}'")
                        break  # Only suggest once
            
            # Check for bare except clauses
            for node in ast.walk(tree):
                if isinstance(node, ast.ExceptHandler) and node.type is None:
                    suggestions.append("Avoid bare 'except:' clauses - catch specific exceptions")
                    break
            
            # Check for magic numbers
            magic_numbers = set()
            for node in ast.walk(tree):
                if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
                    if node.value not in (0, 1, -1, 2, 10, 100):
                        magic_numbers.add(node.value)
            
            if len(magic_numbers) > 2:
                suggestions.append("Consider defining constants for magic numbers")
                
        except SyntaxError:
            suggestions.append("Fix syntax errors to enable full code analysis")
        
        return suggestions
    
    def _extract_python_topics(self, code: str) -> List[str]:
        """Extract Python programming topics from code."""
        topics = []
        
        # Pattern-based topic detection
        patterns = {
            'functions': r'def\s+\w+',
            'classes': r'class\s+\w+',
            'loops': r'(for\s+\w+\s+in|while\s+)',
            'conditionals': r'if\s+',
            'exceptions': r'(try:|except|finally:|raise)',
            'file_io': r'(open\(|with\s+open)',
            'lists': r'\[.*\]',
            'dictionaries': r'\{.*:.*\}',
            'generators': r'yield\s+',
            'decorators': r'@\w+',
            'async': r'(async\s+def|await\s+)',
            'imports': r'(import\s+|from\s+\w+\s+import)'
        }
        
        for topic, pattern in patterns.items():
            if re.search(pattern, code):
                topics.append(topic)
        
        return topics
    
    async def _analyze_javascript_code(self, code: str) -> CodeAnalysisResult:
        """Analyze JavaScript/TypeScript code."""
        # Simplified JavaScript analysis
        metrics = ComplexityMetrics()
        
        # Basic metrics
        lines = [line.strip() for line in code.split('\n')]
        metrics.lines_of_code = len([line for line in lines if line and not line.startswith('//')])
        
        # Count functions
        metrics.number_of_functions = len(re.findall(r'function\s+\w+|=>\s*{|\w+\s*:\s*function', code))
        
        # Count classes
        metrics.number_of_classes = len(re.findall(r'class\s+\w+', code))
        
        # Estimate complexity
        complexity_indicators = ['if', 'else', 'for', 'while', 'switch', 'case', 'try', 'catch']
        metrics.cyclomatic_complexity = sum(len(re.findall(rf'\b{indicator}\b', code)) for indicator in complexity_indicators)
        
        complexity_score = min(1.0, metrics.cyclomatic_complexity / 15.0)
        difficulty_level = DifficultyLevel.INTERMEDIATE if complexity_score > 0.5 else DifficultyLevel.BEGINNER
        
        topics = self._extract_javascript_topics(code)
        
        return CodeAnalysisResult(
            complexity_score=complexity_score,
            difficulty_level=difficulty_level,
            issues=[],
            suggestions=self._analyze_javascript_improvements(code),
            estimated_time_minutes=max(10, metrics.lines_of_code * 2),
            topics_covered=topics
        )
    
    def _extract_javascript_topics(self, code: str) -> List[str]:
        """Extract JavaScript programming topics from code."""
        topics = []
        
        patterns = {
            'functions': r'(function\s+\w+|=>\s*{|\w+\s*:\s*function)',
            'classes': r'class\s+\w+',
            'async': r'(async\s+function|await\s+)',
            'promises': r'(\.then\(|\.catch\(|new\s+Promise)',
            'arrow_functions': r'=>',
            'destructuring': r'(const\s*{.*}|const\s*\[.*\])',
            'modules': r'(import\s+|export\s+)',
            'dom': r'(document\.|window\.|getElementById)',
            'events': r'addEventListener',
            'loops': r'(for\s*\(|while\s*\(|forEach)',
            'conditionals': r'if\s*\('
        }
        
        for topic, pattern in patterns.items():
            if re.search(pattern, code):
                topics.append(topic)
        
        return topics
    
    def _analyze_javascript_improvements(self, code: str) -> List[str]:
        """Analyze JavaScript code for improvements."""
        suggestions = []
        
        # Check for var usage
        if re.search(r'\bvar\s+', code):
            suggestions.append("Consider using 'const' or 'let' instead of 'var'")
        
        # Check for == usage
        if re.search(r'==(?!=)', code):
            suggestions.append("Use strict equality (===) instead of loose equality (==)")
        
        # Check for missing semicolons (simplified)
        lines = code.split('\n')
        for i, line in enumerate(lines):
            line = line.strip()
            if line and not line.endswith((';', '{', '}', ')', ',')):
                if not line.startswith(('if', 'for', 'while', 'function', 'class')):
                    suggestions.append(f"Consider adding semicolon at line {i+1}")
                    break
        
        return suggestions
    
    async def _analyze_generic_code(self, code: str, language: str) -> CodeAnalysisResult:
        """Generic code analysis for unsupported languages."""
        lines = [line.strip() for line in code.split('\n')]
        loc = len([line for line in lines if line])
        
        # Basic complexity estimation
        complexity_score = min(1.0, loc / 50.0)
        difficulty_level = DifficultyLevel.INTERMEDIATE
        
        return CodeAnalysisResult(
            complexity_score=complexity_score,
            difficulty_level=difficulty_level,
            issues=[],
            suggestions=[f"Add comments to explain {language} code logic"],
            estimated_time_minutes=max(10, loc * 3),
            topics_covered=[language.lower(), 'programming']
        )
    
    def _analyze_generic_improvements(self, code: str) -> List[str]:
        """Generic improvement suggestions."""
        suggestions = []
        
        # Check for comments
        comment_patterns = [r'#', r'//', r'/\*', r'<!--']
        has_comments = any(re.search(pattern, code) for pattern in comment_patterns)
        
        if not has_comments:
            suggestions.append("Add comments to explain complex logic")
        
        # Check for long lines
        lines = code.split('\n')
        long_lines = [i+1 for i, line in enumerate(lines) if len(line) > 100]
        if long_lines:
            suggestions.append(f"Consider breaking long lines (lines: {', '.join(map(str, long_lines[:3]))})")
        
        return suggestions
    
    def _extract_generic_topics(self, code: str) -> List[str]:
        """Extract generic programming topics."""
        topics = []
        
        # Basic programming constructs
        if re.search(r'(if|else)', code, re.IGNORECASE):
            topics.append('conditionals')
        
        if re.search(r'(for|while|loop)', code, re.IGNORECASE):
            topics.append('loops')
        
        if re.search(r'(function|def|method)', code, re.IGNORECASE):
            topics.append('functions')
        
        if re.search(r'(class|object)', code, re.IGNORECASE):
            topics.append('classes')
        
        return topics
    
    def _estimate_completion_time(self, metrics: ComplexityMetrics, difficulty: DifficultyLevel) -> int:
        """Estimate completion time in minutes."""
        base_time = metrics.lines_of_code * 2  # 2 minutes per line of code
        
        # Adjust based on difficulty
        difficulty_multipliers = {
            DifficultyLevel.BEGINNER: 1.0,
            DifficultyLevel.INTERMEDIATE: 1.5,
            DifficultyLevel.ADVANCED: 2.0,
            DifficultyLevel.EXPERT: 3.0
        }
        
        multiplier = difficulty_multipliers.get(difficulty, 1.5)
        estimated_time = int(base_time * multiplier)
        
        return max(10, min(180, estimated_time))  # Between 10 and 180 minutes
    
    def _create_default_analysis_result(self, code: str, language: str) -> CodeAnalysisResult:
        """Create default analysis result when analysis fails."""
        return CodeAnalysisResult(
            complexity_score=0.5,
            difficulty_level=DifficultyLevel.INTERMEDIATE,
            issues=[],
            suggestions=["Unable to analyze code - please check syntax"],
            estimated_time_minutes=30,
            topics_covered=[language.lower()]
        )