import { render, screen } from '@/test/utils';
import { userInteractions } from '@/test/utils';
import { Button } from '../Button';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<Button>Click me</Button>);
      
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('btn-primary'); // Assuming default variant is primary
    });

    it('renders with different variants', () => {
      const variants = ['primary', 'secondary', 'outline', 'ghost', 'destructive'] as const;
      
      variants.forEach(variant => {
        const { rerender } = render(<Button variant={variant}>Test</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass(`btn-${variant}`);
        
        rerender(<></>); // Clear for next iteration
      });
    });

    it('renders with different sizes', () => {
      const sizes = ['sm', 'md', 'lg'] as const;
      
      sizes.forEach(size => {
        const { rerender } = render(<Button size={size}>Test</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass(`btn-${size}`);
        
        rerender(<></>);
      });
    });

    it('renders with custom className', () => {
      render(<Button className="custom-class">Test</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('States', () => {
    it('handles disabled state', () => {
      render(<Button disabled>Disabled</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('handles loading state', () => {
      render(<Button loading>Loading</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
      
      // Should show loading indicator
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('shows loading text when provided', () => {
      render(<Button loading loadingText="Saving...">Save</Button>);
      
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(screen.queryByText('Save')).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onClick when clicked', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button');
      await userInteractions.setup().click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} disabled>Click me</Button>);
      
      const button = screen.getByRole('button');
      await userInteractions.setup().click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} loading>Click me</Button>);
      
      const button = screen.getByRole('button');
      await userInteractions.setup().click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('can be activated with keyboard', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      
      await userInteractions.keyboard.enter();
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      await userInteractions.keyboard.space();
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<Button aria-label="Custom label">Icon only</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAccessibleName('Custom label');
    });

    it('supports aria-describedby', () => {
      render(
        <>
          <Button aria-describedby="help-text">Submit</Button>
          <div id="help-text">This will submit the form</div>
        </>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'help-text');
      expect(button).toHaveAccessibleDescription('This will submit the form');
    });

    it('passes axe accessibility tests', async () => {
      const { container } = render(<Button>Accessible button</Button>);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('maintains focus visibility', () => {
      render(<Button>Focus me</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      
      expect(button).toHaveFocus();
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2');
    });
  });

  describe('Form Integration', () => {
    it('submits form when type is submit', async () => {
      const handleSubmit = jest.fn(e => e.preventDefault());
      
      render(
        <form onSubmit={handleSubmit}>
          <Button type="submit">Submit</Button>
        </form>
      );
      
      const button = screen.getByRole('button');
      await userInteractions.setup().click(button);
      
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it('resets form when type is reset', () => {
      render(
        <form>
          <input defaultValue="test" />
          <Button type="reset">Reset</Button>
        </form>
      );
      
      const input = screen.getByRole('textbox');
      const button = screen.getByRole('button');
      
      expect(input).toHaveValue('test');
      
      button.click();
      expect(input).toHaveValue('');
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      
      const TestButton = ({ children, ...props }: any) => {
        renderSpy();
        return <Button {...props}>{children}</Button>;
      };
      
      const { rerender } = render(<TestButton>Test</TestButton>);
      
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with same props
      rerender(<TestButton>Test</TestButton>);
      
      // Should not re-render if props haven't changed (if memoized)
      // This test assumes the Button component is wrapped with React.memo
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('handles children as function', () => {
      render(
        <Button>
          {({ loading }: { loading?: boolean }) => 
            loading ? 'Loading...' : 'Click me'
          }
        </Button>
      );
      
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('handles very long text', () => {
      const longText = 'This is a very long button text that might cause layout issues if not handled properly';
      
      render(<Button>{longText}</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent(longText);
      expect(button).toHaveClass('text-ellipsis'); // Assuming truncation class
    });

    it('handles special characters in text', () => {
      const specialText = 'Save & Continue → Next Step';
      
      render(<Button>{specialText}</Button>);
      
      expect(screen.getByText(specialText)).toBeInTheDocument();
    });
  });
});