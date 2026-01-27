/**
 * ConceptCard Component
 * 
 * Displays a concept with multiple explanation styles including
 * primary explanation, analogy, common mistakes, and use cases.
 */

import React, { useState } from 'react';
import type { ConceptCard, Analogy, Mistake, UseCase } from '../../types/learning-content';
import { learningContentService } from '../../services/learningContentService';

interface ConceptCardComponentProps {
  card: ConceptCard;
  onComplete?: () => void;
  onRequestAlternative?: (explanation: string) => void;
}

export const ConceptCardComponent: React.FC<ConceptCardComponentProps> = ({
  card,
  onComplete,
  onRequestAlternative,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAlternative, setShowAlternative] = useState(false);
  const [alternativeExplanation, setAlternativeExplanation] = useState<string | null>(null);
  const [isLoadingAlternative, setIsLoadingAlternative] = useState(false);
  const [activeTab, setActiveTab] = useState<'explanation' | 'analogy' | 'mistakes' | 'usage'>('explanation');

  const handleExplainDifferently = async () => {
    setIsLoadingAlternative(true);
    try {
      const previousExplanations = [card.primaryExplanation];
      if (alternativeExplanation) {
        previousExplanations.push(alternativeExplanation);
      }
      
      const response = await learningContentService.explainDifferently({
        conceptId: card.id,
        previousExplanations,
      });
      
      setAlternativeExplanation(response.explanation);
      setShowAlternative(true);
      onRequestAlternative?.(response.explanation);
    } catch (error) {
      console.error('Failed to get alternative explanation:', error);
    } finally {
      setIsLoadingAlternative(false);
    }
  };

  const handleMarkComplete = () => {
    onComplete?.();
  };

  return (
    <div className="concept-card bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <span className="text-2xl">💡</span>
            {card.conceptName}
          </h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white/80 hover:text-white"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          {[
            { id: 'explanation', label: 'Explanation', icon: '📖' },
            { id: 'analogy', label: 'Analogy', icon: '🔗' },
            { id: 'mistakes', label: 'Common Mistakes', icon: '⚠️' },
            { id: 'usage', label: 'When to Use', icon: '✅' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`
                flex-1 px-4 py-3 text-sm font-medium text-center border-b-2 transition-colors
                ${activeTab === tab.id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="mr-1">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Primary Explanation */}
        {activeTab === 'explanation' && (
          <div className="explanation-content">
            <div className="prose prose-slate max-w-none">
              {showAlternative && alternativeExplanation ? (
                <div>
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="text-sm font-medium text-yellow-800 mb-2">Alternative Explanation</h4>
                    <p className="text-gray-700">{alternativeExplanation}</p>
                  </div>
                  <button
                    onClick={() => setShowAlternative(false)}
                    className="text-sm text-purple-600 hover:underline"
                  >
                    Show original explanation
                  </button>
                </div>
              ) : (
                <p className="text-gray-700 leading-relaxed">{card.primaryExplanation}</p>
              )}
            </div>
            
            {/* Explain differently button */}
            <button
              onClick={handleExplainDifferently}
              disabled={isLoadingAlternative}
              className="mt-4 px-4 py-2 text-sm text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50 disabled:opacity-50"
            >
              {isLoadingAlternative ? 'Loading...' : '🔄 Explain Differently'}
            </button>

            {/* Code snippet if available */}
            {card.codeSnippet && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Example Code</h4>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{card.codeSnippet.code}</code>
                </pre>
                {card.codeSnippet.description && (
                  <p className="mt-2 text-sm text-gray-600">{card.codeSnippet.description}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Analogy */}
        {activeTab === 'analogy' && (
          <AnalogySection analogy={card.analogy} />
        )}

        {/* Common Mistakes */}
        {activeTab === 'mistakes' && (
          <MistakesSection mistakes={card.commonMistakes} />
        )}

        {/* When to Use */}
        {activeTab === 'usage' && (
          <UseCasesSection useCases={card.whenToUse} />
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <button
          onClick={handleMarkComplete}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          ✓ I understand this concept
        </button>
      </div>
    </div>
  );
};

// Analogy Section Component
const AnalogySection: React.FC<{ analogy: Analogy }> = ({ analogy }) => (
  <div className="analogy-section">
    <h4 className="text-lg font-medium text-gray-800 mb-3">{analogy.title}</h4>
    <p className="text-gray-700 mb-4">{analogy.description}</p>
    
    {Object.keys(analogy.mapping).length > 0 && (
      <div className="mapping-table">
        <h5 className="text-sm font-medium text-gray-600 mb-2">How it maps:</h5>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(analogy.mapping).map(([concept, analog]) => (
            <div key={concept} className="flex items-center gap-2 text-sm">
              <span className="font-medium text-purple-600">{concept}</span>
              <span className="text-gray-400">→</span>
              <span className="text-gray-700">{analog}</span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

// Mistakes Section Component
const MistakesSection: React.FC<{ mistakes: Mistake[] }> = ({ mistakes }) => (
  <div className="mistakes-section space-y-4">
    {mistakes.length === 0 ? (
      <p className="text-gray-500 italic">No common mistakes documented yet.</p>
    ) : (
      mistakes.map((mistake, index) => (
        <div key={index} className="mistake-item border border-red-200 rounded-lg overflow-hidden">
          <div className="bg-red-50 px-4 py-2">
            <h5 className="font-medium text-red-800">❌ {mistake.description}</h5>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase">Bad Example:</span>
              <pre className="mt-1 bg-red-50 text-red-800 p-2 rounded text-sm overflow-x-auto">
                {mistake.example}
              </pre>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase">Correction:</span>
              <pre className="mt-1 bg-green-50 text-green-800 p-2 rounded text-sm overflow-x-auto">
                {mistake.correction}
              </pre>
            </div>
          </div>
        </div>
      ))
    )}
  </div>
);

// Use Cases Section Component
const UseCasesSection: React.FC<{ useCases: UseCase[] }> = ({ useCases }) => (
  <div className="use-cases-section space-y-4">
    {useCases.length === 0 ? (
      <p className="text-gray-500 italic">No use cases documented yet.</p>
    ) : (
      useCases.map((useCase, index) => (
        <div key={index} className="use-case-item bg-green-50 border border-green-200 rounded-lg p-4">
          <h5 className="font-medium text-green-800 mb-2">📌 {useCase.scenario}</h5>
          <pre className="bg-white p-3 rounded text-sm overflow-x-auto mb-2">
            {useCase.example}
          </pre>
          <p className="text-sm text-green-700">
            <strong>Benefit:</strong> {useCase.benefit}
          </p>
        </div>
      ))
    )}
  </div>
);

export default ConceptCardComponent;
