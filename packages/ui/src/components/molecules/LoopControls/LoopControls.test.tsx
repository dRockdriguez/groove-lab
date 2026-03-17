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
      expect(screen.getByLabelText(/repetitions/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/infinite/i)).toBeInTheDocument();
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
        expect(startInput).toHaveClass('border-red');
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
          exerciseDuration={exerciseDuration}
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

      const incrementButton = screen.getAllByRole('button', { name: /\+/ })[0];
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

      const decrementButton = screen.getAllByRole('button', { name: /-/ })[0];
      await user.click(decrementButton);

      await waitFor(() => {
        expect(onStartChange).toHaveBeenCalledWith(14900);
      });
    });

    it('should increment by 1000ms with Shift+click', async () => {
      const onStartChange = vi.fn();
      const user = await userEvent.setup();
      render(
        <LoopControls {...defaultProps} onLoopStartChange={onStartChange} />
      );

      const incrementButton = screen.getAllByRole('button', { name: /\+/ })[0];
      await user.click(incrementButton, { shiftKey: true });

      await waitFor(() => {
        expect(onStartChange).toHaveBeenCalledWith(16000);
      });
    });

    it('should disable decrement when at 0', async () => {
      const user = await userEvent.setup();
      render(
        <LoopControls {...defaultProps} loopStartMs={0} />
      );

      const decrementButton = screen.getAllByRole('button', { name: /-/ })[0];
      expect(decrementButton).toBeDisabled();
    });

    it('should disable increment when at exercise duration', async () => {
      const exerciseDuration = 60000;
      const user = await userEvent.setup();
      render(
        <LoopControls
          {...defaultProps}
          loopEndMs={exerciseDuration}
          exerciseDuration={exerciseDuration}
        />
      );

      const incrementButton = screen.getAllByRole('button', { name: /\+/ })[1]; // end button
      expect(incrementButton).toBeDisabled();
    });
  });

  describe('Repetitions Input', () => {
    it('should accept numbers 1 to 999', async () => {
      const onRepetitionsChange = vi.fn();
      const user = await userEvent.setup();
      render(
        <LoopControls {...defaultProps} onLoopRepetitionsChange={onRepetitionsChange} />
      );

      const repetitionsInput = screen.getByLabelText(/repetitions/i);
      await user.clear(repetitionsInput);
      await user.type(repetitionsInput, '250');

      await waitFor(() => {
        expect(onRepetitionsChange).toHaveBeenCalledWith(250);
      });
    });

    it('should not allow repetitions < 1', async () => {
      const user = await userEvent.setup();
      render(<LoopControls {...defaultProps} loopRepetitions={1} />);

      const repetitionsInput = screen.getByLabelText(/repetitions/i);
      await user.clear(repetitionsInput);
      await user.type(repetitionsInput, '0');

      await waitFor(() => {
        expect(screen.getByText(/repetitions must be/i)).toBeInTheDocument();
      });
    });

    it('should not allow repetitions > 999', async () => {
      const user = await userEvent.setup();
      render(<LoopControls {...defaultProps} loopRepetitions={3} />);

      const repetitionsInput = screen.getByLabelText(/repetitions/i);
      await user.clear(repetitionsInput);
      await user.type(repetitionsInput, '1000');

      await waitFor(() => {
        expect(screen.getByText(/maximum 999/i)).toBeInTheDocument();
      });
    });

    it('should toggle infinite mode with radio button', async () => {
      const onRepetitionsChange = vi.fn();
      const user = await userEvent.setup();
      render(
        <LoopControls
          {...defaultProps}
          loopRepetitions={3}
          onLoopRepetitionsChange={onRepetitionsChange}
        />
      );

      const infiniteRadio = screen.getByRole('radio', { name: /infinite/i });
      await user.click(infiniteRadio);

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
      expect(screen.getByLabelText(/toggle loop/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/clear loop/i)).toBeInTheDocument();
    });

    it('should announce validation errors via aria-live region', async () => {
      const user = await userEvent.setup();
      render(
        <LoopControls {...defaultProps} loopStartMs={40000} loopEndMs={45000} />
      );

      const startInput = screen.getByLabelText(/start time/i);
      await user.clear(startInput);
      await user.type(startInput, '00:50');

      const liveRegion = screen.getByRole('status');
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

      let liveRegion = screen.getByRole('status', { hidden: true });
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');

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

      await user.keyboard('{Tab}');
      const endInput = screen.getByLabelText(/end time/i);
      expect(endInput).toHaveFocus();

      await user.keyboard('{Tab}');
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
      const user = await userEvent.setup();
      render(
        <LoopControls {...defaultProps} onLoopStartChange={onStartChange} />
      );

      const startInput = screen.getByLabelText(/start time/i);
      await user.clear(startInput);
      await user.type(startInput, '01:30');

      await waitFor(() => {
        expect(onStartChange).toHaveBeenCalledWith(90000);
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
      const user = await userEvent.setup();
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
