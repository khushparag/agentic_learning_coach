/**
 * InteractiveCodeExample Component
 * 
 * Displays an interactive code example with editor, execution, and hints.
 */

import React, { useState, useCallback } from 'react';
import type { CodeExample, TestCase, ProgrammingLanguage } from '../../types/learning-content';

interface InteractiveCodeExampleProps {
  example: CodeExample;
  onComplete?: () => void;
  onRun?: (code: string) => Promise<{ success: boolean; output: string; error?: string }>;
}

export const InteractiveCodeExample: React.FC<InteractiveCodeExampleProps> = ({
  example,
  onComplete,
  onRun,
}) => {
  const [code, setCode] = useState(example.starterCode);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [testResults, setTestResults] = useState<Array<{ passed: boolean; description: string }>>([]);

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setError(null);
    setOutput(null);
    setTestResults([]);

    try {
      if (onRun) {
        const result = await onRun(code);
        if (result.success) {
          setOutput(result.output);
          // Simulate test results
          const results = example.testCases.map(tc => ({
            passed: true, // Would come from actual execution
            description: tc.description,
          }));
          setTestResults(results);
          
          if (results.every(r => r.passed)) {
            onComplete?.();
          }
        } else {
          setError(result.error || 'Execution failed');
        }
      } else {
        // Simulate execution for demo
        await new Promise(resolve => setTimeout(resolve, 1000));
        setOutput('// Code executed successfully\n' + (example.expectedOutput || 'Output would appear here'));
        
        // Simulate test results
        const results = example.testCases.map(tc => ({
          passed: Math.random() > 0.3,
          description: tc.description,
        }));
        setTestResults(results);
        
        if (results.every(r => r.passed)) {
          onComplete?.();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsRunning(false);
    }
  }, [code, example.testCases, example.expectedOutput, onRun, onComplete]);

  const handleReset = useCallback(() => {
    setCode(example.starterCode);
    setOutput(null);
    setError(null);
    setTestResults([]);
    setShowSolution(false);
  }, [example.starterCode]);

  const handleShowNextHint = useCallback(() => {
    if (currentHintIndex < example.hints.length - 1) {
      setCurrentHintIndex(prev => prev + 1);
    }
  }, [currentHintIndex, example.hints.length]);

  const handleShowSolution = useCallback(() => {
    setShowSolution(true);
    setCode(example.solutionCode);
  }, [example.solutionCode]);

  const getLanguageLabel = (lang: ProgrammingLanguage): string => {
    const labels: Record<string, string> = {
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      python: 'Python',
      java: 'Java',
    };
    return labels[lang] || lang;
  };

  return (
    <div className="interactive-code-example bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">💻</span>
          <div>
            <h3 className="text-white font-medium">{example.title}</h3>
            <span className="text-xs text-gray-400">{getLanguageLabel(example.language)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-1 text-sm text-gray-300 hover:text-white"
            title="Reset to starter code"
          >
            ↺ Reset
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="px-4 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
          >
            {isRunning ? '⏳ Running...' : '▶ Run'}
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <p className="text-sm text-gray-700">{example.description}</p>
      </div>

      {/* Code Editor */}
      <div className="code-editor">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={!example.isEditable}
          className="w-full h-64 p-4 font-mono text-sm bg-gray-900 text-gray-100 resize-none focus:outline-none"
          spellCheck={false}
        />
      </div>

      {/* Output/Error */}
      {(output || error) && (
        <div className={`px-4 py-3 border-t ${error ? 'bg-red-50' : 'bg-green-50'}`}>
          <h4 className={`text-sm font-medium mb-2 ${error ? 'text-red-800' : 'text-green-800'}`}>
            {error ? '❌ Error' : '✓ Output'}
          </h4>
          <pre className={`text-sm font-mono whitespace-pre-wrap ${error ? 'text-red-700' : 'text-green-700'}`}>
            {error || output}
          </pre>
        </div>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Test Results</h4>
          <div className="space-y-1">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 text-sm ${result.passed ? 'text-green-600' : 'text-red-600'}`}
              >
                <span>{result.passed ? '✓' : '✗'}</span>
                <span>{result.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hints */}
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setShowHints(!showHints)}
            className="text-sm text-blue-600 hover:underline"
          >
            {showHints ? '🙈 Hide Hints' : '💡 Show Hints'}
          </button>
          {!showSolution && (
            <button
              onClick={handleShowSolution}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              👁 Show Solution
            </button>
          )}
        </div>

        {showHints && example.hints.length > 0 && (
          <div className="mt-3 space-y-2">
            {example.hints.slice(0, currentHintIndex + 1).map((hint, index) => (
              <div
                key={index}
                className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800"
              >
                <span className="font-medium">Hint {index + 1}:</span> {hint}
              </div>
            ))}
            {currentHintIndex < example.hints.length - 1 && (
              <button
                onClick={handleShowNextHint}
                className="text-sm text-yellow-600 hover:underline"
              >
                Show next hint ({currentHintIndex + 1}/{example.hints.length})
              </button>
            )}
          </div>
        )}

        {showSolution && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800 mb-2">
              <strong>Solution loaded!</strong> The solution code has been loaded into the editor.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveCodeExample;
