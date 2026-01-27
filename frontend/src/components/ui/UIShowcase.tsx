import React, { useState } from 'react';
import { 
  AcademicCapIcon, 
  CodeBracketIcon, 
  StarIcon,
  UserIcon,
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import {
  Button,
  Input,
  Textarea,
  Select,
  Modal,
  Card,
  Badge,
  LoadingSpinner,
  ErrorMessage,
  SuccessMessage,
  useToast,
  type SelectOption
} from './index';

const UIShowcase: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');
  const [selectValue, setSelectValue] = useState<string | number>('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const toast = useToast();

  const selectOptions: SelectOption[] = [
    { value: 'beginner', label: 'Beginner', icon: <UserIcon className="w-4 h-4" /> },
    { value: 'intermediate', label: 'Intermediate', icon: <CodeBracketIcon className="w-4 h-4" /> },
    { value: 'advanced', label: 'Advanced', icon: <AcademicCapIcon className="w-4 h-4" /> },
    { value: 'expert', label: 'Expert', icon: <StarIcon className="w-4 h-4" /> },
  ];

  const handleLoadingDemo = async (): Promise<void> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    toast.success('Loading completed!', 'This is a demo of the loading state.');
  };

  const showToastDemo = (type: 'success' | 'error' | 'warning' | 'info'): void => {
    const messages = {
      success: { title: 'Success!', message: 'Your action was completed successfully.' },
      error: { title: 'Error occurred', message: 'Something went wrong. Please try again.' },
      warning: { title: 'Warning', message: 'Please review your input before proceeding.' },
      info: { title: 'Information', message: 'Here is some helpful information for you.' },
    };
    
    toast[type](messages[type].title, messages[type].message);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">UI Component Showcase</h1>
        <p className="text-gray-600">Demonstrating the Agentic Learning Coach design system</p>
      </div>

      {/* Buttons Section */}
      <Card header={<h2 className="text-xl font-semibold">Buttons</h2>}>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="success">Success</Button>
            <Button variant="warning">Warning</Button>
            <Button variant="error">Error</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button icon={<StarIcon className="w-4 h-4" />}>With Icon</Button>
            <Button 
              icon={<CodeBracketIcon className="w-4 h-4" />} 
              iconPosition="right"
              variant="secondary"
            >
              Icon Right
            </Button>
            <Button loading={isLoading} onClick={handleLoadingDemo}>
              {isLoading ? 'Loading...' : 'Test Loading'}
            </Button>
            <Button disabled>Disabled</Button>
          </div>
        </div>
      </Card>

      {/* Form Controls Section */}
      <Card header={<h2 className="text-xl font-semibold">Form Controls</h2>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              leftIcon={<EnvelopeIcon className="w-4 h-4" />}
              helperText="We'll never share your email"
            />
            
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              }
            />
            
            <Input
              label="Error Example"
              error="This field is required"
              placeholder="This has an error"
            />
            
            <Select
              label="Skill Level"
              options={selectOptions}
              value={selectValue}
              onChange={setSelectValue}
              placeholder="Choose your level"
            />
          </div>
          
          <div className="space-y-4">
            <Textarea
              label="Description"
              placeholder="Tell us about your learning goals..."
              value={textareaValue}
              onChange={(e) => setTextareaValue(e.target.value)}
              helperText="Minimum 10 characters"
              rows={4}
            />
            
            <Textarea
              label="Error Example"
              error="Description is too short"
              placeholder="This has an error"
              rows={3}
            />
          </div>
        </div>
      </Card>

      {/* Badges Section */}
      <Card header={<h2 className="text-xl font-semibold">Badges</h2>}>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Badge variant="primary">Primary</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="gray">Gray</Badge>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Badge size="sm">Small</Badge>
            <Badge size="md">Medium</Badge>
            <Badge size="lg">Large</Badge>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Badge dot variant="success">Online</Badge>
            <Badge icon={<StarIcon className="w-3 h-3" />} variant="warning">Featured</Badge>
            <Badge icon={<CodeBracketIcon className="w-3 h-3" />} variant="primary">Developer</Badge>
          </div>
        </div>
      </Card>

      {/* Cards Section */}
      <Card header={<h2 className="text-xl font-semibold">Cards</h2>}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="default" padding="md">
            <h3 className="font-semibold mb-2">Default Card</h3>
            <p className="text-gray-600 text-sm">This is a default card with medium padding.</p>
          </Card>
          
          <Card 
            variant="hover" 
            padding="lg"
            header={<h3 className="font-semibold">Card with Header</h3>}
          >
            <p className="text-gray-600 text-sm">This card has a header and hover effects.</p>
          </Card>
          
          <Card 
            variant="interactive"
            footer={
              <Button size="sm" fullWidth>
                Action Button
              </Button>
            }
          >
            <h3 className="font-semibold mb-2">Interactive Card</h3>
            <p className="text-gray-600 text-sm">Click me! I have hover and tap animations.</p>
          </Card>
        </div>
      </Card>

      {/* Feedback Messages Section */}
      <Card header={<h2 className="text-xl font-semibold">Feedback Messages</h2>}>
        <div className="space-y-4">
          <SuccessMessage 
            message="Operation completed successfully!"
            details={["All files were processed", "No errors encountered"]}
          />
          
          <ErrorMessage 
            message="Failed to save changes"
            details={["Network connection lost", "Please check your internet connection"]}
          />
          
          <div className="flex items-center space-x-4">
            <LoadingSpinner size="sm" />
            <LoadingSpinner size="md" />
            <LoadingSpinner size="lg" />
            <span className="text-gray-600">Loading spinners</span>
          </div>
        </div>
      </Card>

      {/* Interactive Demos Section */}
      <Card header={<h2 className="text-xl font-semibold">Interactive Demos</h2>}>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-3">Modal Demo</h3>
            <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">Toast Notifications</h3>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="success" 
                size="sm" 
                onClick={() => showToastDemo('success')}
              >
                Success Toast
              </Button>
              <Button 
                variant="error" 
                size="sm" 
                onClick={() => showToastDemo('error')}
              >
                Error Toast
              </Button>
              <Button 
                variant="warning" 
                size="sm" 
                onClick={() => showToastDemo('warning')}
              >
                Warning Toast
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => showToastDemo('info')}
              >
                Info Toast
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Demo Modal"
        description="This is a demonstration of the modal component with various features."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsModalOpen(false)}>
              Confirm
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            This modal demonstrates the clean design and smooth animations of our UI system.
            It includes proper focus management, keyboard navigation, and accessibility features.
          </p>
          
          <Input
            label="Sample Input"
            placeholder="Try typing here..."
          />
          
          <div className="flex space-x-2">
            <Badge variant="primary">Feature</Badge>
            <Badge variant="success">Accessible</Badge>
            <Badge variant="warning">Responsive</Badge>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UIShowcase;
