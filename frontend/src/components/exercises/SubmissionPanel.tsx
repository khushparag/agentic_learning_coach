import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayIcon, CheckCircleIcon, XCircleIcon, ClockIcon, ArrowPathIcon, ExclamationTriangleIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import type { Submission, Evaluation, CodeExecutionResult, SubmissionStatus } from '../../types/exercises';

interface SubmissionPanelProps {
  onSubmit: () => Promise<void>;
  onTest: () => Promise<void>;
  submission?: Submission;
  evaluation?: Evaluation;
  testResult?: CodeExecutionResult;
  isSubmitting: boolean;
  isTesting: boolean;
  canSubmit: boolean;
  className?: string;
}

export const SubmissionPanel: React.FC<SubmissionPanelProps> = ({ onSubmit, onTest, submission, evaluation, testResult, isSubmitting, isTesting, canSubmit, className = '' }) => {
  const [activeTab, setActiveTab] = useState<'output' | 'tests' | 'feedback'>('output');
  useEffect(() => { if (evaluation) setActiveTab('feedback'); else if (testResult) setActiveTab('tests'); }, [evaluation, testResult]);
  return (
    <div className={className}>
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Code Execution</h3>
        <div className="flex space-x-2 mt-2">
          <button onClick={onTest} disabled={isTesting} className="px-4 py-2 bg-gray-600 text-white rounded">{isTesting ? 'Testing...' : 'Test'}</button>
          <button onClick={onSubmit} disabled={!canSubmit || isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded">{isSubmitting ? 'Submitting...' : 'Submit'}</button>
        </div>
      </div>
      <div className="flex border-b">
        {(['output', 'tests', 'feedback'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={activeTab === tab ? 'border-b-2 border-blue-600 px-4 py-2' : 'px-4 py-2'}>{tab}</button>
        ))}
      </div>
      <div className="p-4">
        {activeTab === 'output' && <div>{testResult?.output || 'Run code to see output'}</div>}
        {activeTab === 'tests' && <div>{evaluation?.test_results?.length ? 'Tests ran' : 'Submit to see tests'}</div>}
        {activeTab === 'feedback' && <div>{evaluation ? 'Score: ' + evaluation.feedback.overall_score : 'Submit for feedback'}</div>}
      </div>
    </div>
  );
};

export default SubmissionPanel;
