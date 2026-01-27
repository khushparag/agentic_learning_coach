import React, { useState } from 'react';
import { useShortcutsHelp } from '../../hooks/useKeyboardShortcuts';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { Modal } from '../ui/Modal';
import { Card } from '../ui/Card';
import { 
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';

export interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  isOpen,
  onClose
}) => {
  const { formatShortcut, groupShortcutsByCategory } = useShortcutsHelp();
  const { announce } = useAccessibility();
  const [selectedCategory, setSelectedCategory] = useState<string>('Navigation');

  // Mock shortcuts data - in real implementation, this would come from a global registry
  const allShortcuts = {
    dashboard: {
      key: 'd',
      altKey: true,
      action: () => {},
      description: 'Go to Dashboard',
      category: 'Navigation'
    },
    learningPath: {
      key: 'l',
      altKey: true,
      action: () => {},
      description: 'Go to Learning Path',
      category: 'Navigation'
    },
    exercises: {
      key: 'e',
      altKey: true,
      action: () => {},
      description: 'Go to Exercises',
      category: 'Navigation'
    },
    settings: {
      key: ',',
      ctrlKey: true,
      action: () => {},
      description: 'Open Settings',
      category: 'Navigation'
    },
    search: {
      key: 'k',
      ctrlKey: true,
      action: () => {},
      description: 'Focus Search',
      category: 'Search'
    },
    help: {
      key: '?',
      shiftKey: true,
      action: () => {},
      description: 'Show Help',
      category: 'Help'
    },
    runCode: {
      key: 'Enter',
      ctrlKey: true,
      action: () => {},
      description: 'Run Code',
      category: 'Code Editor'
    },
    submitCode: {
      key: 's',
      ctrlKey: true,
      shiftKey: true,
      action: () => {},
      description: 'Submit Code',
      category: 'Code Editor'
    },
    formatCode: {
      key: 'f',
      ctrlKey: true,
      altKey: true,
      action: () => {},
      description: 'Format Code',
      category: 'Code Editor'
    },
    skipToMain: {
      key: 'm',
      altKey: true,
      action: () => {},
      description: 'Skip to Main Content',
      category: 'Accessibility'
    },
    skipToNav: {
      key: 'n',
      altKey: true,
      action: () => {},
      description: 'Skip to Navigation',
      category: 'Accessibility'
    }
  };

  const groupedShortcuts = groupShortcutsByCategory(allShortcuts);
  const categories = Object.keys(groupedShortcuts);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    announce(`Viewing ${category} shortcuts`, 'polite');
  };

  const handleClose = () => {
    onClose();
    announce('Keyboard shortcuts help closed', 'polite');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Keyboard Shortcuts"
      size="lg"
      className="max-h-[80vh] overflow-hidden"
    >
      <div className="flex flex-col h-full">
        {/* Category tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav 
            className="-mb-px flex space-x-8 overflow-x-auto"
            aria-label="Shortcut categories"
          >
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`
                  whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                  ${selectedCategory === category
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                aria-selected={selectedCategory === category}
                role="tab"
              >
                {category}
              </button>
            ))}
          </nav>
        </div>

        {/* Shortcuts list */}
        <div className="flex-1 overflow-y-auto">
          <div 
            className="space-y-3"
            role="tabpanel"
            aria-labelledby={`tab-${selectedCategory}`}
          >
            {groupedShortcuts[selectedCategory]?.map((shortcut, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {shortcut.description}
                    </h4>
                  </div>
                  <div className="ml-4">
                    <kbd className="
                      inline-flex items-center px-2 py-1 text-xs font-mono
                      bg-gray-100 text-gray-800 rounded border border-gray-300
                      shadow-sm
                    ">
                      {formatShortcut(shortcut)}
                    </kbd>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Footer with additional info */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-start space-x-3 text-sm text-gray-600">
            <QuestionMarkCircleIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium mb-1">Tips:</p>
              <ul className="space-y-1 text-xs">
                <li>• Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">?</kbd> anytime to open this help</li>
                <li>• Most shortcuts work globally throughout the application</li>
                <li>• Code editor shortcuts only work when the editor is focused</li>
                <li>• Use <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Tab</kbd> and <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Shift+Tab</kbd> to navigate between elements</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Screen reader only content */}
      <div className="sr-only">
        <h3>Available keyboard shortcuts for {selectedCategory}:</h3>
        <ul>
          {groupedShortcuts[selectedCategory]?.map((shortcut, index) => (
            <li key={index}>
              {shortcut.description}: {formatShortcut(shortcut)}
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
};

export default KeyboardShortcutsHelp;
