/**
 * KnowledgeCheck Component
 * 
 * Displays a knowledge check question with immediate feedback.
 */

import React, { useState, useCallback } from 'react';
import type { KnowledgeCheck, Option, KnowledgeCheckType } from '../../types/learning-content';
import { learningContentService } from '../../services/learningContentService';

interface KnowledgeCheckComponentProps {
  check: KnowledgeCheck;
  lessonId?: string;
  onComplete?: () => void;
  onAnswer?: (isCorrect: boolean, attempts: number) => void;
  maxAttempts?: number;
}

export const KnowledgeCheckComponent: React.FC<KnowledgeCheckComponentProps> = ({
  check,
  lessonId,
  onComplete,
  onAnswer,
  maxAttempts = 3,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectAnswer = useCallback((answerId: string) => {
    if (!isSubmitted) {
      setSelectedAnswer(answerId);
    }
  }, [isSubmitted]);

  const handleSubmit = useCallback(async () => {
    if (!selectedAnswer) return;

    setIsLoading(true);
    setAttempts(prev => prev + 1);

    try {
      // Check answer locally first
      let correct = false;
      if (check.type === 'multiple-choice' || check.type === 'true-false') {
        correct = selectedAnswer === check.correctAnswer;
      } else if (Array.isArray(check.correctAnswer)) {
        correct = check.correctAnswer.includes(selectedAnswer);
      } else {
        correct = selectedAnswer.toLowerCase().trim() === check.correctAnswer.toLowerCase().trim();
      }

      // Get feedback from selected option
      const selectedOption = check.options.find(o => o.id === selectedAnswer);
      setFeedback(selectedOption?.feedback || (correct ? 'Correct!' : 'Not quite right.'));
      
      setIsCorrect(correct);
      setIsSubmitted(true);

      // Submit to backend if lessonId provided
      if (lessonId) {
        try {
          await learningContentService.submitKnowledgeCheck({
            lessonId,
            checkId: check.id,
            answer: selectedAnswer,
          });
        } catch (error) {
          console.error('Failed to submit knowledge check:', error);
        }
      }

      onAnswer?.(correct, attempts + 1);

      if (correct) {
        onComplete?.();
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedAnswer, check, lessonId, attempts, onAnswer, onComplete]);

  const handleTryAgain = useCallback(() => {
    setSelectedAnswer(null);
    setIsSubmitted(false);
    setIsCorrect(null);
    setFeedback(null);
    setShowExplanation(false);
  }, []);

  const renderQuestion = () => {
    switch (check.type) {
      case 'multiple-choice':
      case 'true-false':
        return (
          <div className="options space-y-2">
            {check.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelectAnswer(option.id)}
                disabled={isSubmitted}
                className={`
                  w-full text-left p-4 rounded-lg border-2 transition-all
                  ${selectedAnswer === option.id
                    ? isSubmitted
                      ? option.isCorrect
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-500 bg-red-50'
                      : 'border-blue-500 bg-blue-50'
                    : isSubmitted && option.isCorrect
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }
                  ${isSubmitted ? 'cursor-default' : 'cursor-pointer'}
                `}
              >
                <div className="flex items-start gap-3">
                  <span className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium
                    ${selectedAnswer === option.id
                      ? isSubmitted
                        ? option.isCorrect
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-red-500 bg-red-500 text-white'
                        : 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-300 text-gray-500'
                    }
                  `}>
                    {option.id.toUpperCase()}
                  </span>
                  <span className="flex-1">{option.text}</span>
                  {isSubmitted && option.isCorrect && (
                    <span className="text-green-500">✓</span>
                  )}
                  {isSubmitted && selectedAnswer === option.id && !option.isCorrect && (
                    <span className="text-red-500">✗</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        );

      case 'fill-blank':
        return (
          <div className="fill-blank">
            <input
              type="text"
              value={selectedAnswer || ''}
              onChange={(e) => setSelectedAnswer(e.target.value)}
              disabled={isSubmitted}
              placeholder="Type your answer..."
              className={`
                w-full p-3 border-2 rounded-lg
                ${isSubmitted
                  ? isCorrect
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                  : 'border-gray-300 focus:border-blue-500'
                }
              `}
            />
          </div>
        );

      case 'code-completion':
        return (
          <div className="code-completion">
            <textarea
              value={selectedAnswer || ''}
              onChange={(e) => setSelectedAnswer(e.target.value)}
              disabled={isSubmitted}
              placeholder="// Write your code here..."
              className={`
                w-full h-32 p-3 font-mono text-sm border-2 rounded-lg
                ${isSubmitted
                  ? isCorrect
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                  : 'border-gray-300 focus:border-blue-500'
                }
              `}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="knowledge-check bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">❓</span>
          <h3 className="text-lg font-semibold text-white">Knowledge Check</h3>
          <span className="ml-auto text-sm text-white/80">
            Difficulty: {'⭐'.repeat(check.difficulty)}
          </span>
        </div>
      </div>

      {/* Question */}
      <div className="p-6">
        <p className="text-lg text-gray-800 mb-6">{check.question}</p>
        
        {renderQuestion()}

        {/* Hint */}
        {!isSubmitted && check.hint && (
          <div className="mt-4">
            <button
              onClick={() => setShowHint(!showHint)}
              className="text-sm text-amber-600 hover:underline"
            >
              {showHint ? '🙈 Hide hint' : '💡 Need a hint?'}
            </button>
            {showHint && (
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
                {check.hint}
              </div>
            )}
          </div>
        )}

        {/* Feedback */}
        {isSubmitted && feedback && (
          <div className={`mt-4 p-4 rounded-lg ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`font-medium ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
              {isCorrect ? '🎉 Correct!' : '❌ Not quite right'}
            </p>
            <p className={`mt-1 text-sm ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
              {feedback}
            </p>
          </div>
        )}

        {/* Explanation */}
        {isSubmitted && (
          <div className="mt-4">
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="text-sm text-blue-600 hover:underline"
            >
              {showExplanation ? 'Hide explanation' : 'Show explanation'}
            </button>
            {showExplanation && (
              <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">{check.explanation}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <span className="text-sm text-gray-500">
          Attempt {attempts}/{maxAttempts}
        </span>
        
        {!isSubmitted ? (
          <button
            onClick={handleSubmit}
            disabled={!selectedAnswer || isLoading}
            className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Checking...' : 'Submit Answer'}
          </button>
        ) : !isCorrect && attempts < maxAttempts ? (
          <button
            onClick={handleTryAgain}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        ) : (
          <span className={`font-medium ${isCorrect ? 'text-green-600' : 'text-gray-500'}`}>
            {isCorrect ? '✓ Completed' : 'Max attempts reached'}
          </span>
        )}
      </div>
    </div>
  );
};

export default KnowledgeCheckComponent;
