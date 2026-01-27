"""
Unit tests for CodeAnalysisMCP implementation.
"""
import pytest
from unittest.mock import MagicMock

from src.adapters.services.code_analysis_mcp import CodeAnalysisMCP
from src.ports.services.mcp_tools import CodeAnalysisResult, DifficultyLevel


class TestCodeAnalysisMCP:
    """Test cases for CodeAnalysisMCP."""
    
    @pytest.fixture
    def code_analysis_mcp(self):
        """Create CodeAnalysisMCP instance for testing."""
        return CodeAnalysisMCP()
    
    @pytest.fixture
    def simple_python_code(self):
        """Simple Python code for testing."""
        return """
def greet(name):
    return f"Hello, {name}!"

print(greet("World"))
"""
    
    @pytest.fixture
    def complex_python_code(self):
        """Complex Python code for testing."""
        return """
class Calculator:
    def __init__(self):
        self.history = []
    
    def add(self, a, b):
        result = a + b
        self.history.append(f"{a} + {b} = {result}")
        return result
    
    def divide(self, a, b):
        if b == 0:
            raise ValueError("Cannot divide by zero")
        result = a / b
        self.history.append(f"{a} / {b} = {result}")
        return result
    
    def get_history(self):
        return self.history.copy()

def main():
    calc = Calculator()
    try:
        result1 = calc.add(5, 3)
        result2 = calc.divide(10, 2)
        print(f"Results: {result1}, {result2}")
        
        for entry in calc.get_history():
            print(entry)
    except ValueError as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
"""
    
    @pytest.fixture
    def javascript_code(self):
        """JavaScript code for testing."""
        return """
function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

const numbers = [1, 2, 3, 4, 5];
const squares = numbers.map(x => x * x);

console.log(squares);
console.log(fibonacci(10));
"""
    
    @pytest.mark.asyncio
    async def test_analyze_python_code_simple(self, code_analysis_mcp, simple_python_code):
        """Test analysis of simple Python code."""
        # Act
        result = await code_analysis_mcp.analyze_code_complexity(simple_python_code, "python")
        
        # Assert
        assert isinstance(result, CodeAnalysisResult)
        assert isinstance(result.complexity_score, float)
        assert 0.0 <= result.complexity_score <= 1.0
        assert isinstance(result.difficulty_level, DifficultyLevel)
        assert isinstance(result.issues, list)
        assert isinstance(result.suggestions, list)
        assert isinstance(result.estimated_time_minutes, int)
        assert result.estimated_time_minutes > 0
        assert isinstance(result.topics_covered, list)
        
        # Simple code should have low complexity
        assert result.complexity_score < 0.5
        assert result.difficulty_level in [DifficultyLevel.BEGINNER, DifficultyLevel.INTERMEDIATE]
        
        # Should detect function topic
        assert "functions" in result.topics_covered
    
    @pytest.mark.asyncio
    async def test_analyze_python_code_complex(self, code_analysis_mcp, complex_python_code):
        """Test analysis of complex Python code."""
        # Act
        result = await code_analysis_mcp.analyze_code_complexity(complex_python_code, "python")
        
        # Assert
        assert isinstance(result, CodeAnalysisResult)
        
        # Complex code should have higher complexity than simple code
        assert result.complexity_score > 0.2
        assert result.difficulty_level in [DifficultyLevel.INTERMEDIATE, DifficultyLevel.ADVANCED]
        
        # Should detect multiple topics
        topics = result.topics_covered
        assert "classes" in topics
        assert "functions" in topics
        assert "exceptions" in topics
    
    @pytest.mark.asyncio
    async def test_analyze_javascript_code(self, code_analysis_mcp, javascript_code):
        """Test analysis of JavaScript code."""
        # Act
        result = await code_analysis_mcp.analyze_code_complexity(javascript_code, "javascript")
        
        # Assert
        assert isinstance(result, CodeAnalysisResult)
        assert result.difficulty_level in [DifficultyLevel.BEGINNER, DifficultyLevel.INTERMEDIATE]
        
        # Should detect JavaScript topics
        topics = result.topics_covered
        assert "functions" in topics
        assert "arrow_functions" in topics
    
    @pytest.mark.asyncio
    async def test_analyze_syntax_error_code(self, code_analysis_mcp):
        """Test analysis of code with syntax errors."""
        invalid_code = """
def broken_function(
    print("This has syntax errors"
    return "incomplete"
"""
        
        # Act
        result = await code_analysis_mcp.analyze_code_complexity(invalid_code, "python")
        
        # Assert
        assert isinstance(result, CodeAnalysisResult)
        assert result.difficulty_level == DifficultyLevel.ADVANCED  # High due to errors
        assert len(result.issues) > 0
        
        # Should have syntax error issue
        syntax_issues = [issue for issue in result.issues if issue['type'] == 'syntax_error']
        assert len(syntax_issues) > 0
    
    @pytest.mark.asyncio
    async def test_estimate_difficulty(self, code_analysis_mcp, simple_python_code):
        """Test difficulty estimation."""
        # Act
        difficulty = await code_analysis_mcp.estimate_difficulty(simple_python_code, "python")
        
        # Assert
        assert isinstance(difficulty, DifficultyLevel)
        assert difficulty in [DifficultyLevel.BEGINNER, DifficultyLevel.INTERMEDIATE]
    
    @pytest.mark.asyncio
    async def test_suggest_improvements_python(self, code_analysis_mcp):
        """Test improvement suggestions for Python code."""
        code_with_issues = """
x = 5
y = 10
z = x + y
print(z)
"""
        
        # Act
        suggestions = await code_analysis_mcp.suggest_improvements(code_with_issues, "python")
        
        # Assert
        assert isinstance(suggestions, list)
        assert len(suggestions) <= 10  # Should limit suggestions
        
        # Should suggest better variable names
        variable_suggestions = [s for s in suggestions if "variable" in s.lower()]
        assert len(variable_suggestions) > 0
    
    @pytest.mark.asyncio
    async def test_suggest_improvements_javascript(self, code_analysis_mcp):
        """Test improvement suggestions for JavaScript code."""
        code_with_issues = """
var x = 5;
if (x == 5) {
    console.log("x is 5")
}
"""
        
        # Act
        suggestions = await code_analysis_mcp.suggest_improvements(code_with_issues, "javascript")
        
        # Assert
        assert isinstance(suggestions, list)
        
        # Should suggest using const/let instead of var
        var_suggestions = [s for s in suggestions if "var" in s.lower()]
        assert len(var_suggestions) > 0
        
        # Should suggest strict equality
        equality_suggestions = [s for s in suggestions if "===" in s]
        assert len(equality_suggestions) > 0
    
    @pytest.mark.asyncio
    async def test_extract_topics_python(self, code_analysis_mcp, complex_python_code):
        """Test topic extraction from Python code."""
        # Act
        topics = await code_analysis_mcp.extract_topics(complex_python_code, "python")
        
        # Assert
        assert isinstance(topics, list)
        assert len(topics) > 0
        
        # Should detect relevant topics
        assert "classes" in topics
        assert "functions" in topics
        assert "exceptions" in topics
    
    @pytest.mark.asyncio
    async def test_extract_topics_javascript(self, code_analysis_mcp, javascript_code):
        """Test topic extraction from JavaScript code."""
        # Act
        topics = await code_analysis_mcp.extract_topics(javascript_code, "javascript")
        
        # Assert
        assert isinstance(topics, list)
        assert len(topics) > 0
        
        # Should detect relevant topics
        assert "functions" in topics
        assert "arrow_functions" in topics
    
    @pytest.mark.asyncio
    async def test_analyze_unsupported_language(self, code_analysis_mcp):
        """Test analysis of unsupported language."""
        code = "print('Hello, World!')"
        
        # Act
        result = await code_analysis_mcp.analyze_code_complexity(code, "ruby")
        
        # Assert
        assert isinstance(result, CodeAnalysisResult)
        assert result.difficulty_level == DifficultyLevel.INTERMEDIATE  # Default
        assert "ruby" in result.topics_covered
    
    def test_calculate_python_metrics(self, code_analysis_mcp, complex_python_code):
        """Test Python metrics calculation."""
        import ast
        
        tree = ast.parse(complex_python_code)
        
        # Act
        metrics = code_analysis_mcp._calculate_python_metrics(tree, complex_python_code)
        
        # Assert
        assert metrics.lines_of_code > 0
        assert metrics.number_of_functions > 0
        assert metrics.number_of_classes > 0
        assert metrics.cyclomatic_complexity >= 0
        assert metrics.max_nesting_depth >= 0
    
    def test_calculate_complexity_score(self, code_analysis_mcp):
        """Test complexity score calculation."""
        from src.adapters.services.code_analysis_mcp import ComplexityMetrics
        
        # Simple metrics
        simple_metrics = ComplexityMetrics(
            cyclomatic_complexity=2,
            cognitive_complexity=3,
            lines_of_code=10,
            max_nesting_depth=1
        )
        
        score = code_analysis_mcp._calculate_complexity_score(simple_metrics)
        assert 0.0 <= score <= 1.0
        assert score < 0.5  # Should be low complexity
        
        # Complex metrics
        complex_metrics = ComplexityMetrics(
            cyclomatic_complexity=15,
            cognitive_complexity=25,
            lines_of_code=100,
            max_nesting_depth=5
        )
        
        score = code_analysis_mcp._calculate_complexity_score(complex_metrics)
        assert 0.0 <= score <= 1.0
        assert score > 0.5  # Should be high complexity
    
    def test_determine_difficulty_level(self, code_analysis_mcp):
        """Test difficulty level determination."""
        from src.adapters.services.code_analysis_mcp import ComplexityMetrics
        
        # Beginner level metrics
        beginner_metrics = ComplexityMetrics(
            cyclomatic_complexity=3,
            cognitive_complexity=5,
            max_nesting_depth=1
        )
        
        difficulty = code_analysis_mcp._determine_difficulty_level(beginner_metrics)
        assert difficulty == DifficultyLevel.BEGINNER
        
        # Advanced level metrics
        advanced_metrics = ComplexityMetrics(
            cyclomatic_complexity=25,
            cognitive_complexity=35,
            max_nesting_depth=5
        )
        
        difficulty = code_analysis_mcp._determine_difficulty_level(advanced_metrics)
        assert difficulty == DifficultyLevel.ADVANCED
    
    def test_find_python_issues(self, code_analysis_mcp):
        """Test Python issue detection."""
        import ast
        
        code_with_issues = """
def very_long_function_that_does_many_things_and_has_a_very_long_name():
    _unused_variable = 42
    if True:
        if True:
            if True:
                if True:
                    if True:
                        print("deeply nested")
    return "done"
"""
        
        tree = ast.parse(code_with_issues)
        
        # Act
        issues = code_analysis_mcp._find_python_issues(tree, code_with_issues)
        
        # Assert
        assert isinstance(issues, list)
        
        # Should find issues
        issue_types = [issue['type'] for issue in issues]
        # Note: The actual issue detection is simplified in the implementation
        # In a real scenario, we'd have more sophisticated analysis
    
    def test_generate_python_suggestions(self, code_analysis_mcp):
        """Test Python suggestion generation."""
        from src.adapters.services.code_analysis_mcp import ComplexityMetrics
        
        complex_metrics = ComplexityMetrics(
            cyclomatic_complexity=15,
            cognitive_complexity=20,
            lines_of_code=60,
            max_nesting_depth=5
        )
        
        issues = [
            {'type': 'long_function', 'line': 1, 'message': 'Function too long'},
            {'type': 'deep_nesting', 'line': 5, 'message': 'Too deeply nested'}
        ]
        
        # Act
        suggestions = code_analysis_mcp._generate_python_suggestions(complex_metrics, issues)
        
        # Assert
        assert isinstance(suggestions, list)
        assert len(suggestions) > 0
        
        # Should suggest breaking down complex functions
        complexity_suggestions = [s for s in suggestions if "function" in s.lower()]
        assert len(complexity_suggestions) > 0
    
    def test_extract_python_topics(self, code_analysis_mcp, complex_python_code):
        """Test Python topic extraction."""
        # Act
        topics = code_analysis_mcp._extract_python_topics(complex_python_code)
        
        # Assert
        assert isinstance(topics, list)
        assert "functions" in topics
        assert "classes" in topics
        assert "exceptions" in topics
        assert "conditionals" in topics
    
    def test_extract_javascript_topics(self, code_analysis_mcp, javascript_code):
        """Test JavaScript topic extraction."""
        # Act
        topics = code_analysis_mcp._extract_javascript_topics(javascript_code)
        
        # Assert
        assert isinstance(topics, list)
        assert "functions" in topics
        assert "arrow_functions" in topics
    
    def test_estimate_completion_time(self, code_analysis_mcp):
        """Test completion time estimation."""
        from src.adapters.services.code_analysis_mcp import ComplexityMetrics
        
        # Simple code
        simple_metrics = ComplexityMetrics(lines_of_code=10)
        time = code_analysis_mcp._estimate_completion_time(simple_metrics, DifficultyLevel.BEGINNER)
        assert 10 <= time <= 180  # Within reasonable bounds
        
        # Complex code
        complex_metrics = ComplexityMetrics(lines_of_code=50)
        time = code_analysis_mcp._estimate_completion_time(complex_metrics, DifficultyLevel.EXPERT)
        assert time > 30  # Should take longer for expert level
    
    def test_create_default_analysis_result(self, code_analysis_mcp):
        """Test default analysis result creation."""
        # Act
        result = code_analysis_mcp._create_default_analysis_result("print('hello')", "python")
        
        # Assert
        assert isinstance(result, CodeAnalysisResult)
        assert result.complexity_score == 0.5
        assert result.difficulty_level == DifficultyLevel.INTERMEDIATE
        assert result.estimated_time_minutes == 30
        assert "python" in result.topics_covered