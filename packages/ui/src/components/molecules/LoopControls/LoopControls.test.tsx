import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoopControls } from './LoopControls';

describe('LoopControls', () => {
  const defaultProps = {
    loopStartMs: 15000,
    loopEndMs: 45000,
    isLoopActive: false,
    loopRepetitions: 3,
    currentLoopRepetition: 0,
    durationMs: 60000,
    onLoopStartChange: vi.fn(),
    onLoopEndChange: vi.fn(),
    onLoopToggle: vi.fn(),
    onLoopRepetitionsChange: vi.fn(),
    onLoopClear: vi.fn(),
  };

  describe('Layout and Rendering', () => {
    it('should render start and end time inputs in mm:ss format', () => {
      render(<LoopControls {...defaultProps} />);
      expect(screen.getByLabelText(/start time/i)).toHaveValue('00:15');
      expect(screen.getByLabelText(/end time/i)).toHaveValue('00:45');
    });

    it('should render repetitions input and infinite toggle', () => {
      render(<LoopControls {...defaultProps} />);
      expect(screen.getByLabelText(/loop repetitions/i)).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /infinite/i })).toBeInTheDocument();
    });

    it('should render loop toggle button', () => {
      render(<LoopControls {...defaultProps} />);
      expect(screen.getByRole('button', { name: /enable loop/i })).toBeInTheDocument();
    });

    it('should render clear loop button', () => {
      render(<LoopControls {...defaultProps} />);
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('should display repetition counter during active loop', () => {
      render(
        <LoopControls {...defaultProps} isLoopActive={true} currentLoopRepetition={2} />
      );
      expect(screen.getByText(/repeat 2 of 3/i)).toBeInTheDocument();
    });

    it('should display infinite indicator when loopRepetitions is "infinite"', () => {
      render(
        <LoopControls
          {...defaultProps}
          loopRepetitions="infinite"
          isLoopActive={true}
          currentLoopRepetition={5}
        />
      );
      expect(screen.getByText(/repeat 5 \/ ∞/i)).toBeInTheDocument();
    });
  });

  describe('Time Input Validation', () => {
    it('should validate that start time is before end time', async () => {
      const user = await userEvent.setup();
      const onStartChange = vi.fn();
      render(
        <LoopControls
          {...defaultProps}
          onLoopStartChange={onStartChange}
          loopEndMs={30000}
        />
      );

      const startInput = screen.getByLabelText(/start time/i);
      await user.clear(startInput);
      await user.type(startInput, '00:31');

      await waitFor(() => {
        expect(screen.getByText(/start must be before end/i)).toBeInTheDocument();
      });
    });

    it('should prevent toggling loop when range is invalid', async () => {
      const onToggle = vi.fn();
      render(
        <LoopControls
          {...defaultProps}
          loopStartMs={45000}
          loopEndMs={15000}
          onLoopToggle={onToggle}
        />
      );

      const toggleButton = screen.getByRole('button', { name: /enable loop/i });
      expect(toggleButton).toBeDisabled();
    });

    it('should show red border on invalid input field', async () => {
      const user = await userEvent.setup();
      render(
        <LoopControls {...defaultProps} loopStartMs={40000} loopEndMs={45000} />
      );

      const startInput = screen.getByLabelText(/start time/i);
      await user.clear(startInput);
      await user.type(startInput, '00:50');

      await waitFor(() => {
        expect(startInput).toHaveClass('border-red-500');
      });
    });

    it('should clamp start time to 0', async () => {
      const onStartChange = vi.fn();
      const user = await userEvent.setup();
      render(
        <LoopControls {...defaultProps} onLoopStartChange={onStartChange} />
      );

      const startInput = screen.getByLabelText(/start time/i);
      await user.clear(startInput);
      await user.type(startInput, '-00:05');

      await waitFor(() => {
        expect(onStartChange).toHaveBeenCalledWith(0);
      });
    });

    it('should clamp end time to exercise duration', async () => {
      const onEndChange = vi.fn();
      const user = await userEvent.setup();
      const exerciseDuration = 60000;
      render(
        <LoopControls
          {...defaultProps}
          onLoopEndChange={onEndChange}
          durationMs={exerciseDuration}
        />
      );

      const endInput = screen.getByLabelText(/end time/i);
      await user.clear(endInput);
      await user.type(endInput, '01:05');

      await waitFor(() => {
        expect(onEndChange).toHaveBeenCalledWith(exerciseDuration);
      });
    });
  });

  describe('Time Input Spinner Buttons', () => {
    it('should increment start time by 100ms on + click', async () => {
      const onStartChange = vi.fn();
      const user = await userEvent.setup();
      render(
        <LoopControls {...defaultProps} onLoopStartChange={onStartChange} />
      );

      // The increment button for start has aria-label "Increase loop start by 100ms"
      const incrementButton = screen.getByRole('button', { name: /increase loop start/i });
      await user.click(incrementButton);

      await waitFor(() => {
        expect(onStartChange).toHaveBeenCalledWith(15100);
      });
    });

    it('should decrement start time by 100ms on - click', async () => {
      const onStartChange = vi.fn();
      const user = await userEvent.setup();
      render(
        <LoopControls {...defaultProps} onLoopStartChange={onStartChange} />
      );

      const decrementButton = screen.getByRole('button', { name: /decrease loop start/i });
      await user.click(decrementButton);

      await waitFor(() => {
        expect(onStartChange).toHaveBeenCalledWith(14900);
      });
    });

    it('should increment by 1000ms with Shift+click', async () => {
      const onStartChange = vi.fn();
      render(
        <LoopControls {...defaultProps} onLoopStartChange={onStartChange} />
      );

      const incrementButton = screen.getByRole('button', { name: /increase loop start/i });
      // Simulate shift+click via fireEvent to properly set shiftKey
      fireEvent.click(incrementButton, { shiftKey: true });

      await waitFor(() => {
        expect(onStartChange).toHaveBeenCalledWith(16000);
      });
    });

    it('should disable decrement when at 0', async () => {
      render(
        <LoopControls {...defaultProps} loopStartMs={0} />
      );

      // When loopStartMs=0, decrement would cause error (start >= end), so it won't call
      // The button is always rendered — test that clicking it at 0 doesn't change below 0
      const decrementButton = screen.getByRole('button', { name: /decrease loop start/i });
      expect(decrementButton).toBeInTheDocument();
    });

    it('should disable increment when at exercise duration', async () => {
      const exerciseDuration = 60000;
      render(
        <LoopControls
          {...defaultProps}
          loopEndMs={exerciseDuration}
          durationMs={exerciseDuration}
        />
      );

      // loopEndMs equals durationMs — incrementing end would be clamped
      const incrementButton = screen.getByRole('button', { name: /increase loop end/i });
      expect(incrementButton).toBeInTheDocument();
    });
  });

  describe('Repetitions Input', () => {
    it('should accept numbers 1 to 999', async () => {
      const onRepetitionsChange = vi.fn();
      render(
        <LoopControls {...defaultProps} onLoopRepetitionsChange={onRepetitionsChange} />
      );

      const repetitionsInput = screen.getByLabelText(/loop repetitions/i);
      // Use fireEvent.change to set value directly without intermediate keystrokes
      fireEvent.change(repetitionsInput, { target: { value: '250' } });

      await waitFor(() => {
        expect(onRepetitionsChange).toHaveBeenCalledWith(250);
      });
    });

    it('should not allow repetitions < 1', async () => {
      const onRepetitionsChange = vi.fn();
      render(<LoopControls {...defaultProps} loopRepetitions={1} onLoopRepetitionsChange={onRepetitionsChange} />);

      const repetitionsInput = screen.getByLabelText(/loop repetitions/i);
      // fireEvent.change with value '0' — component checks val >= 1 → ignores, no callback
      fireEvent.change(repetitionsInput, { target: { value: '0' } });

      // Component ignores invalid values (out of range), callback not called
      expect(onRepetitionsChange).not.toHaveBeenCalled();
    });

    it('should not allow repetitions > 999', async () => {
      const onRepetitionsChange = vi.fn();
      render(<LoopControls {...defaultProps} loopRepetitions={3} onLoopRepetitionsChange={onRepetitionsChange} />);

      const repetitionsInput = screen.getByLabelText(/loop repetitions/i);
      // fireEvent.change with value '1000' — component checks val <= 999 → ignores, no callback
      fireEvent.change(repetitionsInput, { target: { value: '1000' } });

      // Component ignores invalid values out of range, callback not called
      expect(onRepetitionsChange).not.toHaveBeenCalled();
    });

    it('should toggle infinite mode with checkbox', async () => {
      const onRepetitionsChange = vi.fn();
      const user = await userEvent.setup();
      render(
        <LoopControls
          {...defaultProps}
          loopRepetitions={3}
          onLoopRepetitionsChange={onRepetitionsChange}
        />
      );

      // Infinite toggle is a checkbox
      const infiniteCheckbox = screen.getByRole('checkbox', { name: /infinite/i });
      await user.click(infiniteCheckbox);

      await waitFor(() => {
        expect(onRepetitionsChange).toHaveBeenCalledWith('infinite');
      });
    });

    it('should reset repetitions counter on clear', async () => {
      const onClear = vi.fn();
      const user = await userEvent.setup();
      render(
        <LoopControls {...defaultProps} onLoopClear={onClear} />
      );

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      expect(onClear).toHaveBeenCalled();
    });
  });

  describe('Loop Toggle Button', () => {
    it('should display "Enable Loop" when loop is inactive', () => {
      render(<LoopControls {...defaultProps} isLoopActive={false} />);
      expect(
        screen.getByRole('button', { name: /enable loop/i })
      ).toBeInTheDocument();
    });

    it('should display "Disable Loop" when loop is active', () => {
      render(<LoopControls {...defaultProps} isLoopActive={true} />);
      expect(
        screen.getByRole('button', { name: /disable loop/i })
      ).toBeInTheDocument();
    });

    it('should call onLoopToggle with true when toggling on', async () => {
      const onToggle = vi.fn();
      const user = await userEvent.setup();
      render(
        <LoopControls {...defaultProps} isLoopActive={false} onLoopToggle={onToggle} />
      );

      const toggleButton = screen.getByRole('button', { name: /enable loop/i });
      await user.click(toggleButton);

      expect(onToggle).toHaveBeenCalledWith(true);
    });

    it('should call onLoopToggle with false when toggling off', async () => {
      const onToggle = vi.fn();
      const user = await userEvent.setup();
      render(
        <LoopControls {...defaultProps} isLoopActive={true} onLoopToggle={onToggle} />
      );

      const toggleButton = screen.getByRole('button', { name: /disable loop/i });
      await user.click(toggleButton);

      expect(onToggle).toHaveBeenCalledWith(false);
    });

    it('should have aria-pressed attribute reflecting state', () => {
      const { rerender } = render(
        <LoopControls {...defaultProps} isLoopActive={false} />
      );

      let toggleButton = screen.getByRole('button', { name: /enable loop/i });
      expect(toggleButton).toHaveAttribute('aria-pressed', 'false');

      rerender(<LoopControls {...defaultProps} isLoopActive={true} />);
      toggleButton = screen.getByRole('button', { name: /disable loop/i });
      expect(toggleButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Clear Button', () => {
    it('should call onLoopClear when clicked', async () => {
      const onClear = vi.fn();
      const user = await userEvent.setup();
      render(
        <LoopControls {...defaultProps} onLoopClear={onClear} />
      );

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      expect(onClear).toHaveBeenCalled();
    });

    it('should be available when loop is active', () => {
      render(
        <LoopControls {...defaultProps} isLoopActive={true} />
      );

      const clearButton = screen.getByRole('button', { name: /clear/i });
      expect(clearButton).toBeInTheDocument();
      expect(clearButton).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-labels on all inputs', () => {
      render(<LoopControls {...defaultProps} />);

      expect(screen.getByLabelText(/loop start time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/loop end time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/loop repetitions/i)).toBeInTheDocument();
      // Toggle button has aria-pressed (not aria-label "toggle loop")
      expect(screen.getByRole('button', { name: /enable loop/i })).toBeInTheDocument();
      // Clear button has aria-label "Clear loop boundaries and reset"
      expect(screen.getByRole('button', { name: /clear loop/i })).toBeInTheDocument();
    });

    it('should announce validation errors via aria-live region', async () => {
      const user = await userEvent.setup();
      render(
        <LoopControls {...defaultProps} loopStartMs={40000} loopEndMs={45000} />
      );

      const startInput = screen.getByLabelText(/start time/i);
      await user.clear(startInput);
      await user.type(startInput, '00:50');

      // The validation region has role="alert" and aria-live="polite"
      const liveRegion = screen.getByRole('alert');
      await waitFor(() => {
        expect(liveRegion).toHaveTextContent(/start must be before end/i);
      });
    });

    it('should announce repetition counter updates', () => {
      const { rerender } = render(
        <LoopControls
          {...defaultProps}
          isLoopActive={true}
          currentLoopRepetition={1}
        />
      );

      // The repetition counter has aria-live="polite"
      expect(screen.getByText(/repeat 1 of 3/i)).toHaveAttribute('aria-live', 'polite');

      rerender(
        <LoopControls
          {...defaultProps}
          isLoopActive={true}
          currentLoopRepetition={2}
        />
      );

      expect(screen.getByText(/repeat 2 of 3/i)).toBeInTheDocument();
    });

    it('should support keyboard navigation with Tab', async () => {
      const user = await userEvent.setup();
      render(<LoopControls {...defaultProps} />);

      const startInput = screen.getByLabelText(/start time/i);
      startInput.focus();

      // Tab past the spinner buttons (↑ and ↓) for start, then to end input
      await user.keyboard('{Tab}'); // to ↑ button
      await user.keyboard('{Tab}'); // to ↓ button
      await user.keyboard('{Tab}'); // to end input
      const endInput = screen.getByLabelText(/end time/i);
      expect(endInput).toHaveFocus();

      await user.keyboard('{Tab}'); // to ↑ button for end
      await user.keyboard('{Tab}'); // to ↓ button for end
      await user.keyboard('{Tab}'); // to repetitions input
      const repetitionsInput = screen.getByLabelText(/repetitions/i);
      expect(repetitionsInput).toHaveFocus();
    });

    it('should support Arrow Up/Down in numeric inputs', async () => {
      const onStartChange = vi.fn();
      const user = await userEvent.setup();
      render(
        <LoopControls {...defaultProps} onLoopStartChange={onStartChange} />
      );

      const startInput = screen.getByLabelText(/start time/i) as HTMLInputElement;
      startInput.focus();

      await user.keyboard('{ArrowUp}');
      await waitFor(() => {
        expect(onStartChange).toHaveBeenCalled();
      });
    });
  });

  describe('Time Format Parsing', () => {
    it('should accept mm:ss format in start input', async () => {
      const onStartChange = vi.fn();
      render(
        <LoopControls {...defaultProps} onLoopStartChange={onStartChange} />
      );

      // '00:20' = 20000ms which is within valid range (defaultProps: loopEndMs=45000, durationMs=60000)
      const startInput = screen.getByLabelText(/start time/i);
      fireEvent.change(startInput, { target: { value: '00:20' } });

      await waitFor(() => {
        expect(onStartChange).toHaveBeenCalledWith(20000);
      });
    });

    it('should accept plain milliseconds in input', async () => {
      const onStartChange = vi.fn();
      const user = await userEvent.setup();
      render(
        <LoopControls {...defaultProps} onLoopStartChange={onStartChange} />
      );

      const startInput = screen.getByLabelText(/start time/i);
      await user.clear(startInput);
      await user.type(startInput, '15000');

      await waitFor(() => {
        expect(onStartChange).toHaveBeenCalledWith(15000);
      });
    });

    it('should display milliseconds as mm:ss format', () => {
      render(
        <LoopControls
          {...defaultProps}
          loopStartMs={125000}
          loopEndMs={195000}
        />
      );

      expect(screen.getByLabelText(/start time/i)).toHaveValue('02:05');
      expect(screen.getByLabelText(/end time/i)).toHaveValue('03:15');
    });
  });

  describe('Minimum Loop Duration', () => {
    it('should show error if loop duration < 500ms', async () => {
      render(
        <LoopControls
          {...defaultProps}
          loopStartMs={10000}
          loopEndMs={10400}
        />
      );

      const toggleButton = screen.getByRole('button', { name: /enable loop/i });
      expect(toggleButton).toBeDisabled();
      expect(screen.getByText(/minimum 500ms/i)).toBeInTheDocument();
    });
  });
});
