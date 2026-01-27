import React, { useState, useEffect } from 'react';
import { AccessibilityTester, AccessibilityIssue } from '../../utils/accessibility';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  PlayIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

export interface AccessibilityTesterProps {
  targetElement?: HTMLElement;
  autoRun?: boolean;
  showDetails?: boolean;
}

const AccessibilityTesterComponent: React.FC<AccessibilityTesterProps> = ({
  targetElement,
  autoRun = false,
  showDetails = true
}) => {
  const [issues, setIssues] = useState<AccessibilityIssue[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runTests = async () => {
    setIsRunning(true);
    
    try {
      const container = targetElement || document.body;
      const foundIssues = AccessibilityTester.runBasicChecks(container);
      setIssues(foundIssues);
      setLastRun(new Date());
    } catch (error) {
      console.error('Accessibility test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (autoRun) {
      runTests();
    }
  }, [autoRun, targetElement]);

  const getSeverityIcon = (severity: AccessibilityIssue['severity']) => {
    switch (severity) {
      case 'error':
        return <ExclamationCircleIcon className="w-5 h-5 text-error-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-warning-500" />;
      case 'info':
        return <InformationCircleIcon className="w-5 h-5 text-primary-500" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: AccessibilityIssue['severity']) => {
    switch (severity) {
      case 'error':
        return 'border-error-200 bg-error-50';
      case 'warning':
        return 'border-warning-200 bg-warning-50';
      case 'info':
        return 'border-primary-200 bg-primary-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const groupedIssues = issues.reduce((acc, issue) => {
    if (!acc[issue.severity]) {
      acc[issue.severity] = [];
    }
    acc[issue.severity].push(issue);
    return acc;
  }, {} as Record<string, AccessibilityIssue[]>);

  const errorCount = groupedIssues.error?.length || 0;
  const warningCount = groupedIssues.warning?.length || 0;
  const infoCount = groupedIssues.info?.length || 0;

  const highlightElement = (element: HTMLElement) => {
    // Remove existing highlights
    document.querySelectorAll('.accessibility-highlight').forEach(el => {
      el.classList.remove('accessibility-highlight');
    });

    // Add highlight to target element
    element.classList.add('accessibility-highlight');
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Remove highlight after 3 seconds
    setTimeout(() => {
      element.classList.remove('accessibility-highlight');
    }, 3000);
  };

  return (
    <div className="space-y-4">
      {/* Test Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Accessibility Testing
            </h3>
            <p className="text-sm text-gray-600">
              Run automated accessibility checks on the current page
            </p>
          </div>
          
          <Button
            onClick={runTests}
            loading={isRunning}
            icon={<PlayIcon className="w-4 h-4" />}
            aria-label="Run accessibility tests"
          >
            Run Tests
          </Button>
        </div>

        {lastRun && (
          <div className="mt-4 text-sm text-gray-500">
            Last run: {lastRun.toLocaleString()}
          </div>
        )}
      </Card>

      {/* Results Summary */}
      {issues.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-gray-900">
              Test Results
            </h4>
            <div className="flex items-center space-x-4 text-sm">
              {errorCount > 0 && (
                <span className="flex items-center text-error-600">
                  <ExclamationCircleIcon className="w-4 h-4 mr-1" />
                  {errorCount} errors
                </span>
              )}
              {warningCount > 0 && (
                <span className="flex items-center text-warning-600">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  {warningCount} warnings
                </span>
              )}
              {infoCount > 0 && (
                <span className="flex items-center text-primary-600">
                  <InformationCircleIcon className="w-4 h-4 mr-1" />
                  {infoCount} info
                </span>
              )}
            </div>
          </div>

          {/* Overall Score */}
          <div className="mb-4">
            {errorCount === 0 && warningCount === 0 ? (
              <div className="flex items-center text-success-600">
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                <span className="font-medium">No critical issues found!</span>
              </div>
            ) : (
              <div className="text-gray-700">
                <span className="font-medium">
                  {issues.length} accessibility issue{issues.length !== 1 ? 's' : ''} found
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Detailed Issues */}
      {showDetails && issues.length > 0 && (
        <div className="space-y-3">
          {Object.entries(groupedIssues).map(([severity, severityIssues]) => (
            <Card key={severity} className={`p-4 border-l-4 ${getSeverityColor(severity as AccessibilityIssue['severity'])}`}>
              <div className="flex items-center mb-3">
                {getSeverityIcon(severity as AccessibilityIssue['severity'])}
                <h5 className="ml-2 font-medium text-gray-900 capitalize">
                  {severity} Issues ({severityIssues.length})
                </h5>
              </div>

              <div className="space-y-2">
                {severityIssues.map((issue, index) => (
                  <div key={index} className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 font-medium">
                        {issue.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Type: {issue.type}
                      </p>
                      {issue.element && (
                        <p className="text-xs text-gray-500">
                          Element: {issue.element.tagName.toLowerCase()}
                          {issue.element.id && `#${issue.element.id}`}
                          {issue.element.className && `.${issue.element.className.split(' ')[0]}`}
                        </p>
                      )}
                    </div>
                    
                    {issue.element && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => highlightElement(issue.element)}
                        icon={<EyeIcon className="w-3 h-3" />}
                        aria-label="Highlight element in page"
                        className="ml-2"
                      >
                        Show
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* No Issues */}
      {issues.length === 0 && lastRun && (
        <Card className="p-4 border-l-4 border-success-200 bg-success-50">
          <div className="flex items-center">
            <CheckCircleIcon className="w-5 h-5 text-success-500" />
            <p className="ml-2 text-success-700 font-medium">
              No accessibility issues detected!
            </p>
          </div>
          <p className="mt-1 text-sm text-success-600">
            The tested elements appear to follow accessibility best practices.
          </p>
        </Card>
      )}

      {/* CSS for highlighting elements - using standard style tag */}
      <style>{`
        .accessibility-highlight {
          outline: 3px solid #f59e0b !important;
          outline-offset: 2px !important;
          background-color: rgba(245, 158, 11, 0.1) !important;
          transition: all 0.3s ease !important;
        }
      `}</style>
    </div>
  );
};

export default AccessibilityTesterComponent;
