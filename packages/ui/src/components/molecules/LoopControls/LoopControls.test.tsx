import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoopControls } from './LoopControls';

describe('LoopControls', () => {
  const defaultProps = {
    loopStartMs: 15000,
    loopEndMs: 45000,
    isLoopActive: false,
    loopRepetitions: 3,
    durationMs: 60000,
    onLoopToggle: vi.fn(),
    onLoopRepetitionsChange: vi.fn(),
    onLoopClear: vi.fn(),
  };

  describe('Layout and Rendering', () => {
    it('should render header with "Loop Control" title', () => {
      render(<LoopControls {...defaultProps} />);
      expect(screen.getByText('Loop Control')).toBeInTheDocument();
    });

    it('should render loop status display when region is selected', () => {
      const { container } = render(<LoopControls {...defaultProps} loopStartMs={15000} loopEndMs={45000} />);
      const statusDiv = container.querySelector('.bg-gray-100');
      expect(statusDiv).toBeInTheDocument();
      expect(statusDiv?.textContent).toMatch(/Loop:/);
      expect(statusDiv?.textContent).toMatch(/0:15/);
      expect(statusDiv?.textContent).toMatch(/0:45/);
      expect(statusDiv?.textContent).toMatch(/3x/);
    });

    it('should not show loop status when no region selected (start >= end)', () => {
      const { container } = render(<LoopControls {...defaultProps} loopStartMs={0} loopEndMs={0} />);
      const statusDiv = container.querySelector('.bg-gray-100');
      expect(statusDiv).not.toBeInTheDocument();
    });

    it('should display infinite symbol in status when repetitions is infinite', () => {
      const { container } = render(
        <LoopControls
          {...defaultProps}
          loopStartMs={10000}
          loopEndMs={30000}
          loopRepetitions="infinite"
        />
      );
      const statusDiv = container.querySelector('.bg-gray-100');
      expect(statusDiv?.textContent).toMatch(/∞ reps/);
    });

    it('should render repetitions selector', () => {
      render(<LoopControls {...defaultProps} />);
      expect(screen.getByLabelText(/Number of loop repetitions/i)).toBeInTheDocument();
    });

    it('should render loop toggle button', () => {
      render(<LoopControls {...defaultProps} />);
      expect(screen.getByText('Loop Off')).toBeInTheDocument();
    });

    it('should render clear button', () => {
      render(<LoopControls {...defaultProps} />);
      expect(screen.getByRole('button', { name: /clear loop region/i })).toBeInTheDocument();
    });

    it('should show repetitions selector with options 1-999 and infinite', () => {
      render(<LoopControls {...defaultProps} />);
      const selector = screen.getByLabelText(/Number of loop repetitions/i) as HTMLSelectElement;
      const options = Array.from(selector.options).map((o) => o.value);
      expect(options).toContain('1');
      expect(options).toContain('3');
      expect(options).toContain('999');
      expect(options).toContain('infinite');
    });
  });

  describe('Loop Toggle Button', () => {
    it('should display "Loop Off" when loop is inactive', () => {
      render(<LoopControls {...defaultProps} isLoopActive={false} />);
      expect(screen.getByText('Loop Off')).toBeInTheDocument();
    });

    it('should display "Loop On" with checkmark when loop is active', () => {
      render(<LoopControls {...defaultProps} isLoopActive={true} />);
      expect(screen.getByText(/✓ Loop On/)).toBeInTheDocument();
    });

    it('should have aria-pressed attribute reflecting state', () => {
      const { rerender, container } = render(<LoopControls {...defaultProps} isLoopActive={false} />);
      let buttons = container.querySelectorAll('button[aria-pressed]');
      expect(buttons[0]).toHaveAttribute('aria-pressed', 'false');

      rerender(<LoopControls {...defaultProps} isLoopActive={true} />);
      buttons = container.querySelectorAll('button[aria-pressed]');
      expect(buttons[0]).toHaveAttribute('aria-pressed', 'true');
    });

    it('should call onLoopToggle with true when toggling on', async () => {
      const onToggle = vi.fn();
      const user = await userEvent.setup();
      render(
        <LoopControls
          {...defaultProps}
          isLoopActive={false}
          onLoopToggle={onToggle}
          loopStartMs={10000}
          loopEndMs={30000}
        />
      );

      const toggleButton = screen.getByText('Loop Off');
      await user.click(toggleButton);

      expect(onToggle).toHaveBeenCalledWith(true);
    });

    it('should call onLoopToggle with false when toggling off', async () => {
      const onToggle = vi.fn();
      const user = await userEvent.setup();
      render(
        <LoopControls
          {...defaultProps}
          isLoopActive={true}
          onLoopToggle={onToggle}
          loopStartMs={10000}
          loopEndMs={30000}
        />
      );

      const toggleButton = screen.getByText(/✓ Loop On/);
      await user.click(toggleButton);

      expect(onToggle).toHaveBeenCalledWith(false);
    });

    it('should be disabled when no loop region is selected', () => {
      const { container } = render(<LoopControls {...defaultProps} loopStartMs={0} loopEndMs={0} />);
      const toggleButton = container.querySelectorAll('button[aria-pressed]')[0];
      expect(toggleButton).toBeDisabled();
    });

    it('should be enabled when loop region is selected', () => {
      const { container } = render(
        <LoopControls {...defaultProps} loopStartMs={10000} loopEndMs={30000} />
      );
      const toggleButton = container.querySelectorAll('button[aria-pressed]')[0];
      expect(toggleButton).not.toBeDisabled();
    });
  });

  describe('Clear Button', () => {
    it('should call onLoopClear when clicked', async () => {
      const onClear = vi.fn();
      const user = await userEvent.setup();
      render(
        <LoopControls
          {...defaultProps}
          onLoopClear={onClear}
          loopStartMs={10000}
          loopEndMs={30000}
        />
      );

      const clearButton = screen.getByText('Clear');
      await user.click(clearButton);

      expect(onClear).toHaveBeenCalled();
    });

    it('should be disabled when no loop region is selected', () => {
      const { container } = render(<LoopControls {...defaultProps} loopStartMs={0} loopEndMs={0} />);
      const clearButton = screen.getByText('Clear');
      expect(clearButton).toBeDisabled();
    });

    it('should be enabled when loop region is selected', () => {
      const { container } = render(
        <LoopControls {...defaultProps} loopStartMs={10000} loopEndMs={30000} />
      );
      const clearButton = screen.getByText('Clear');
      expect(clearButton).not.toBeDisabled();
    });
  });

  describe('Repetitions Selector', () => {
    it('should accept repetition values from the available options', async () => {
      const onRepetitionsChange = vi.fn();
      const user = await userEvent.setup();
      render(
        <LoopControls {...defaultProps} onLoopRepetitionsChange={onRepetitionsChange} />
      );

      const selector = screen.getByLabelText(/Number of loop repetitions/i);
      await user.selectOptions(selector, '100');

      expect(onRepetitionsChange).toHaveBeenCalledWith(100);
    });

    it('should accept "infinite" option', async () => {
      const onRepetitionsChange = vi.fn();
      const user = await userEvent.setup();
      render(
        <LoopControls
          {...defaultProps}
          loopRepetitions={3}
          onLoopRepetitionsChange={onRepetitionsChange}
        />
      );

      const selector = screen.getByLabelText(/Number of loop repetitions/i);
      await user.selectOptions(selector, 'infinite');

      expect(onRepetitionsChange).toHaveBeenCalledWith('infinite');
    });

    it('should display current repetitions value in selector', () => {
      render(<LoopControls {...defaultProps} loopRepetitions={5} />);
      const selector = screen.getByLabelText(/Number of loop repetitions/i) as HTMLSelectElement;
      expect(selector.value).toBe('5');
    });

    it('should display "infinite" when repetitions is infinite', () => {
      render(<LoopControls {...defaultProps} loopRepetitions="infinite" />);
      const selector = screen.getByLabelText(/Number of loop repetitions/i) as HTMLSelectElement;
      expect(selector.value).toBe('infinite');
    });
  });

  describe('Dark Mode Support', () => {
    it('should have dark mode classes in header', () => {
      render(<LoopControls {...defaultProps} />);
      const header = screen.getByText('Loop Control');
      expect(header.className).toMatch(/dark:text-gray-300/);
    });

    it('should have dark mode classes in toggle button when active', () => {
      const { container } = render(<LoopControls {...defaultProps} isLoopActive={true} />);
      const button = container.querySelector('button[aria-pressed="true"]');
      expect(button?.className).toMatch(/dark:bg-green-900/);
      expect(button?.className).toMatch(/dark:text-green-100/);
    });

    it('should have dark mode classes in selector', () => {
      render(<LoopControls {...defaultProps} />);
      const selector = screen.getByLabelText(/Number of loop repetitions/i);
      expect(selector.className).toMatch(/dark:bg-gray-800/);
      expect(selector.className).toMatch(/dark:border-gray-600/);
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on toggle button', () => {
      const { container } = render(<LoopControls {...defaultProps} isLoopActive={false} />);
      const button = container.querySelector('button[aria-pressed]');
      expect(button).toHaveAttribute('aria-label');
    });

    it('should have aria-label on clear button', () => {
      render(<LoopControls {...defaultProps} />);
      const button = screen.getByText('Clear');
      expect(button).toHaveAttribute('aria-label');
    });

    it('should have aria-label on repetitions selector', () => {
      render(<LoopControls {...defaultProps} />);
      const selector = screen.getByLabelText(/Number of loop repetitions/i);
      expect(selector).toHaveAttribute('aria-label');
    });

    it('should have proper aria-label on main container', () => {
      render(<LoopControls {...defaultProps} />);
      const container = screen.getByLabelText(/Loop controls/i);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Loop Status Display Formatting', () => {
    it('should format times correctly in mm:ss format', () => {
      const { container } = render(
        <LoopControls
          {...defaultProps}
          loopStartMs={65000}
          loopEndMs={125000}
        />
      );
      const statusDiv = container.querySelector('.bg-gray-100');
      expect(statusDiv?.textContent).toMatch(/1:05/);
      expect(statusDiv?.textContent).toMatch(/2:05/);
    });

    it('should format zero minutes correctly', () => {
      const { container } = render(
        <LoopControls
          {...defaultProps}
          loopStartMs={0}
          loopEndMs={45000}
        />
      );
      const statusDiv = container.querySelector('.bg-gray-100');
      expect(statusDiv?.textContent).toMatch(/0:00/);
      expect(statusDiv?.textContent).toMatch(/0:45/);
    });

    it('should pad single-digit minutes and seconds', () => {
      const { container } = render(
        <LoopControls
          {...defaultProps}
          loopStartMs={5000}
          loopEndMs={9000}
        />
      );
      const statusDiv = container.querySelector('.bg-gray-100');
      expect(statusDiv?.textContent).toMatch(/0:05/);
      expect(statusDiv?.textContent).toMatch(/0:09/);
    });
  });

  describe('Edge Cases', () => {
    it('should handle props update when loopStartMs changes', () => {
      const { rerender, container } = render(
        <LoopControls {...defaultProps} loopStartMs={15000} loopEndMs={45000} />
      );
      let statusDiv = container.querySelector('.bg-gray-100');
      expect(statusDiv?.textContent).toMatch(/0:15/);

      rerender(
        <LoopControls {...defaultProps} loopStartMs={20000} loopEndMs={45000} />
      );
      statusDiv = container.querySelector('.bg-gray-100');
      expect(statusDiv?.textContent).toMatch(/0:20/);
    });

    it('should handle props update when loopEndMs changes', () => {
      const { rerender, container } = render(
        <LoopControls {...defaultProps} loopStartMs={15000} loopEndMs={45000} />
      );
      let statusDiv = container.querySelector('.bg-gray-100');
      expect(statusDiv?.textContent).toMatch(/0:15/);
      expect(statusDiv?.textContent).toMatch(/0:45/);

      rerender(
        <LoopControls {...defaultProps} loopStartMs={15000} loopEndMs={60000} />
      );
      statusDiv = container.querySelector('.bg-gray-100');
      expect(statusDiv?.textContent).toMatch(/0:15/);
      expect(statusDiv?.textContent).toMatch(/1:00/);
    });

    it('should show/hide status display based on region selection', () => {
      const { rerender, container } = render(
        <LoopControls {...defaultProps} loopStartMs={0} loopEndMs={0} />
      );
      let statusDiv = container.querySelector('.bg-gray-100');
      expect(statusDiv).not.toBeInTheDocument();

      rerender(
        <LoopControls {...defaultProps} loopStartMs={15000} loopEndMs={45000} />
      );
      statusDiv = container.querySelector('.bg-gray-100');
      expect(statusDiv).toBeInTheDocument();
      expect(statusDiv?.textContent).toMatch(/0:15/);
    });
  });
});
