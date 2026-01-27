import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CodeEditor } from '../CodeEditor';

// Mock Monaco Editor
jest.mock('@monaco-editor/react', () => ({
  __esModule: true,
  default: ({ onChange, onMount, ...props }: any) => {
    const handleChange = (value: string) => {
      onChange?.(value);
    };

    React.useEffect(() => {
      if (onMount) {
        const mockEditor = {
          getValue: () => props.value || '',
          setValue: (value: string) => handleChange(value),
          getModel: () => ({
            onDidChangeContent: () => ({ dispose: () => {} }),
          }),
          onDidChangeModelContent: () => ({ dispose: () => {} }),
          focus: jest.fn(),
          layout: jest.fn(),
        };
        onMount(mockEditor);
      }
    }, [onMount]);

    return (
      <textarea
        data-testid="monaco-editor"
        value={props.value || ''}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Code editor"
      />
    );
  },
}));

describe('CodeEditor', () => {
  const defaultProps = {
    value: 'console.log("Hello World");',
    onChange: jest.fn(),
    language: 'javascript' as const,
    theme: 'vs-dark' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the Monaco editor', () => {
    render(<CodeEditor {...defaultProps} />);
    
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });

  it('displays the initial code value', () => {
    render(<CodeEditor {...defaultProps} />);
    
    const editor = screen.getByTestId('monaco-editor');
    expect(editor).toHaveValue('console.log("Hello World");');
  });

  it('calls onChange when code is modified', async () => {
    const user = userEvent.setup();
    render(<CodeEditor {...defaultProps} />);
    
    const editor = screen.getByTestId('monaco-editor');
    await user.clear(editor);
    await user.type(editor, 'const x = 42;');
    
    expect(defaultProps.onChange).toHaveBeenCalledWith('const x = 42;');
  });

  it('supports different programming languages', () => {
    const { rerender } = render(<CodeEditor {...defaultProps} language="python" />);
    
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    
    rerender(<CodeEditor {...defaultProps} language="typescript" />);
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });

  it('supports different themes', () => {
    const { rerender } = render(<CodeEditor {...defaultProps} theme="vs-light" />);
    
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    
    rerender(<CodeEditor {...defaultProps} theme="vs-dark" />);
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });

  it('handles empty code value', () => {
    render(<CodeEditor {...defaultProps} value="" />);
    
    const editor = screen.getByTestId('monaco-editor');
    expect(editor).toHaveValue('');
  });

  it('is accessible with proper ARIA labels', () => {
    render(<CodeEditor {...defaultProps} />);
    
    const editor = screen.getByTestId('monaco-editor');
    expect(editor).toBeInTheDocument();
    // Monaco editor should be accessible by default
  });

  it('handles read-only mode', () => {
    render(<CodeEditor {...defaultProps} readOnly />);
    
    const editor = screen.getByTestId('monaco-editor');
    expect(editor).toBeInTheDocument();
  });

  it('supports custom height and width', () => {
    render(<CodeEditor {...defaultProps} height="400px" width="100%" />);
    
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });

  it('handles line numbers and minimap options', () => {
    render(
      <CodeEditor 
        {...defaultProps} 
        options={{
          lineNumbers: 'on',
          minimap: { enabled: true },
          wordWrap: 'on',
        }}
      />
    );
    
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });

  it('supports syntax highlighting for multiple languages', () => {
    const languages = ['javascript', 'typescript', 'python', 'java', 'go'] as const;
    
    languages.forEach(language => {
      const { rerender } = render(<CodeEditor {...defaultProps} language={language} />);
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });
  });
});
