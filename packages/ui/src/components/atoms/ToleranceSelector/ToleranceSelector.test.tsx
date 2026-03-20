import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ToleranceSelector } from './ToleranceSelector';
import type { TolerancePreset } from '@groovelab/utils';

describe('ToleranceSelector', () => {
  // ── AC1: Renders 3 options: "Easy (300ms)", "Medium (200ms)", "Hard (100ms)"
  describe('Rendering', () => {
    it('renders three preset options', () => {
      const onPresetChange = vi.fn();
      render(<ToleranceSelector preset="medium" onPresetChange={onPresetChange} />);

      expect(screen.getByRole('radio', { name: /easy.*300ms/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /medium.*200ms/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /hard.*100ms/i })).toBeInTheDocument();
    });

    it('renders easy option with correct label', () => {
      const onPresetChange = vi.fn();
      render(<ToleranceSelector preset="medium" onPresetChange={onPresetChange} />);

      const easyOption = screen.getByRole('radio', { name: /easy/i });
      expect(easyOption).toHaveTextContent('Easy');
      expect(easyOption).toHaveTextContent('300ms');
    });

    it('renders medium option with correct label', () => {
      const onPresetChange = vi.fn();
      render(<ToleranceSelector preset="medium" onPresetChange={onPresetChange} />);

      const mediumOption = screen.getByRole('radio', { name: /medium/i });
      expect(mediumOption).toHaveTextContent('Medium');
      expect(mediumOption).toHaveTextContent('200ms');
    });

    it('renders hard option with correct label', () => {
      const onPresetChange = vi.fn();
      render(<ToleranceSelector preset="medium" onPresetChange={onPresetChange} />);

      const hardOption = screen.getByRole('radio', { name: /hard/i });
      expect(hardOption).toHaveTextContent('Hard');
      expect(hardOption).toHaveTextContent('100ms');
    });
  });

  // ── AC5: Uses role="radiogroup" with aria-label="Hit detection tolerance"
  describe('Accessibility — Radiogroup', () => {
    it('has role="radiogroup" on the container', () => {
      const onPresetChange = vi.fn();
      render(<ToleranceSelector preset="medium" onPresetChange={onPresetChange} />);

      const radiogroup = screen.getByRole('radiogroup', { name: /hit detection tolerance/i });
      expect(radiogroup).toBeInTheDocument();
    });

    it('has aria-label "Hit detection tolerance" on the radiogroup', () => {
      const onPresetChange = vi.fn();
      render(<ToleranceSelector preset="medium" onPresetChange={onPresetChange} />);

      const radiogroup = screen.getByRole('radiogroup');
      expect(radiogroup).toHaveAttribute('aria-label', 'Hit detection tolerance');
    });
  });

  // ── AC6: Each option has role="radio" with aria-checked matching selection state
  describe('Accessibility — Individual Radio Buttons', () => {
    it('all options have role="radio"', () => {
      const onPresetChange = vi.fn();
      render(<ToleranceSelector preset="medium" onPresetChange={onPresetChange} />);

      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(3);
    });

    it('aria-checked matches selected preset (easy)', () => {
      const onPresetChange = vi.fn();
      render(<ToleranceSelector preset="easy" onPresetChange={onPresetChange} />);

      expect(screen.getByRole('radio', { name: /easy/i })).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByRole('radio', { name: /medium/i })).toHaveAttribute('aria-checked', 'false');
      expect(screen.getByRole('radio', { name: /hard/i })).toHaveAttribute('aria-checked', 'false');
    });

    it('aria-checked matches selected preset (medium)', () => {
      const onPresetChange = vi.fn();
      render(<ToleranceSelector preset="medium" onPresetChange={onPresetChange} />);

      expect(screen.getByRole('radio', { name: /easy/i })).toHaveAttribute('aria-checked', 'false');
      expect(screen.getByRole('radio', { name: /medium/i })).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByRole('radio', { name: /hard/i })).toHaveAttribute('aria-checked', 'false');
    });

    it('aria-checked matches selected preset (hard)', () => {
      const onPresetChange = vi.fn();
      render(<ToleranceSelector preset="hard" onPresetChange={onPresetChange} />);

      expect(screen.getByRole('radio', { name: /easy/i })).toHaveAttribute('aria-checked', 'false');
      expect(screen.getByRole('radio', { name: /medium/i })).toHaveAttribute('aria-checked', 'false');
      expect(screen.getByRole('radio', { name: /hard/i })).toHaveAttribute('aria-checked', 'true');
    });
  });

  // ── AC2: Highlights the currently selected preset visually
  describe('Visual Selection Highlighting', () => {
    it('visually highlights easy when selected', () => {
      const onPresetChange = vi.fn();
      render(<ToleranceSelector preset="easy" onPresetChange={onPresetChange} />);

      const easyOption = screen.getByRole('radio', { name: /easy/i });
      expect(easyOption).toHaveClass('bg-green-600');
    });

    it('visually highlights medium when selected', () => {
      const onPresetChange = vi.fn();
      render(<ToleranceSelector preset="medium" onPresetChange={onPresetChange} />);

      const mediumOption = screen.getByRole('radio', { name: /medium/i });
      expect(mediumOption).toHaveClass('bg-green-600');
    });

    it('visually highlights hard when selected', () => {
      const onPresetChange = vi.fn();
      render(<ToleranceSelector preset="hard" onPresetChange={onPresetChange} />);

      const hardOption = screen.getByRole('radio', { name: /hard/i });
      expect(hardOption).toHaveClass('bg-green-600');
    });

    it('unselected options do not have filled background', () => {
      const onPresetChange = vi.fn();
      render(<ToleranceSelector preset="easy" onPresetChange={onPresetChange} />);

      const mediumOption = screen.getByRole('radio', { name: /medium/i });
      expect(mediumOption).toHaveClass('border');
      expect(mediumOption).not.toHaveClass('bg-green-600');
    });
  });

  // ── AC3: Calls onPresetChange with the new preset when user clicks an option
  describe('Click Interaction', () => {
    it('calls onPresetChange with "easy" when easy option clicked', async () => {
      const onPresetChange = vi.fn();
      const user = userEvent.setup();
      render(<ToleranceSelector preset="medium" onPresetChange={onPresetChange} />);

      await user.click(screen.getByRole('radio', { name: /easy/i }));
      expect(onPresetChange).toHaveBeenCalledWith('easy');
    });

    it('calls onPresetChange with "medium" when medium option clicked', async () => {
      const onPresetChange = vi.fn();
      const user = userEvent.setup();
      render(<ToleranceSelector preset="easy" onPresetChange={onPresetChange} />);

      await user.click(screen.getByRole('radio', { name: /medium/i }));
      expect(onPresetChange).toHaveBeenCalledWith('medium');
    });

    it('calls onPresetChange with "hard" when hard option clicked', async () => {
      const onPresetChange = vi.fn();
      const user = userEvent.setup();
      render(<ToleranceSelector preset="medium" onPresetChange={onPresetChange} />);

      await user.click(screen.getByRole('radio', { name: /hard/i }));
      expect(onPresetChange).toHaveBeenCalledWith('hard');
    });

    it('calls onPresetChange only once per click', async () => {
      const onPresetChange = vi.fn();
      const user = userEvent.setup();
      render(<ToleranceSelector preset="medium" onPresetChange={onPresetChange} />);

      await user.click(screen.getByRole('radio', { name: /easy/i }));
      expect(onPresetChange).toHaveBeenCalledTimes(1);
    });
  });

  // ── AC7: Keyboard navigation: arrow keys cycle through options, Enter/Space selects
  describe('Keyboard Navigation', () => {
    it('arrow right moves focus from easy to medium', async () => {
      const onPresetChange = vi.fn();
      const user = userEvent.setup();
      render(<ToleranceSelector preset="easy" onPresetChange={onPresetChange} />);

      const easyOption = screen.getByRole('radio', { name: /easy/i });
      easyOption.focus();
      await user.keyboard('{ArrowRight}');

      const mediumOption = screen.getByRole('radio', { name: /medium/i });
      expect(mediumOption).toHaveFocus();
    });

    it('arrow right moves focus from medium to hard', async () => {
      const onPresetChange = vi.fn();
      const user = userEvent.setup();
      render(<ToleranceSelector preset="medium" onPresetChange={onPresetChange} />);

      const mediumOption = screen.getByRole('radio', { name: /medium/i });
      mediumOption.focus();
      await user.keyboard('{ArrowRight}');

      const hardOption = screen.getByRole('radio', { name: /hard/i });
      expect(hardOption).toHaveFocus();
    });

    it('arrow right wraps from hard to easy', async () => {
      const onPresetChange = vi.fn();
      const user = userEvent.setup();
      render(<ToleranceSelector preset="hard" onPresetChange={onPresetChange} />);

      const hardOption = screen.getByRole('radio', { name: /hard/i });
      hardOption.focus();
      await user.keyboard('{ArrowRight}');

      const easyOption = screen.getByRole('radio', { name: /easy/i });
      expect(easyOption).toHaveFocus();
    });

    it('arrow left moves focus from medium to easy', async () => {
      const onPresetChange = vi.fn();
      const user = userEvent.setup();
      render(<ToleranceSelector preset="medium" onPresetChange={onPresetChange} />);

      const mediumOption = screen.getByRole('radio', { name: /medium/i });
      mediumOption.focus();
      await user.keyboard('{ArrowLeft}');

      const easyOption = screen.getByRole('radio', { name: /easy/i });
      expect(easyOption).toHaveFocus();
    });

    it('arrow left moves focus from hard to medium', async () => {
      const onPresetChange = vi.fn();
      const user = userEvent.setup();
      render(<ToleranceSelector preset="hard" onPresetChange={onPresetChange} />);

      const hardOption = screen.getByRole('radio', { name: /hard/i });
      hardOption.focus();
      await user.keyboard('{ArrowLeft}');

      const mediumOption = screen.getByRole('radio', { name: /medium/i });
      expect(mediumOption).toHaveFocus();
    });

    it('arrow left wraps from easy to hard', async () => {
      const onPresetChange = vi.fn();
      const user = userEvent.setup();
      render(<ToleranceSelector preset="easy" onPresetChange={onPresetChange} />);

      const easyOption = screen.getByRole('radio', { name: /easy/i });
      easyOption.focus();
      await user.keyboard('{ArrowLeft}');

      const hardOption = screen.getByRole('radio', { name: /hard/i });
      expect(hardOption).toHaveFocus();
    });

    it('Enter key selects the focused option', async () => {
      const onPresetChange = vi.fn();
      const user = userEvent.setup();
      render(<ToleranceSelector preset="medium" onPresetChange={onPresetChange} />);

      const easyOption = screen.getByRole('radio', { name: /easy/i });
      easyOption.focus();
      await user.keyboard('{Enter}');

      expect(onPresetChange).toHaveBeenCalledWith('easy');
    });

    it('Space key selects the focused option', async () => {
      const onPresetChange = vi.fn();
      const user = userEvent.setup();
      render(<ToleranceSelector preset="medium" onPresetChange={onPresetChange} />);

      const mediumOption = screen.getByRole('radio', { name: /medium/i });
      mediumOption.focus();
      await user.keyboard(' ');

      expect(onPresetChange).toHaveBeenCalledWith('medium');
    });
  });

  // ── AC8: Compact horizontal layout (3 buttons in a row)
  describe('Layout', () => {
    it('renders options in horizontal layout', () => {
      const onPresetChange = vi.fn();
      render(<ToleranceSelector preset="medium" onPresetChange={onPresetChange} />);

      const radiogroup = screen.getByRole('radiogroup');
      expect(radiogroup).toHaveClass('flex', 'gap-1');
    });

    it('renders all three options within the same radiogroup', () => {
      const onPresetChange = vi.fn();
      render(<ToleranceSelector preset="medium" onPresetChange={onPresetChange} />);

      const radiogroup = screen.getByRole('radiogroup');
      const radios = screen.getAllByRole('radio');
      radios.forEach((radio) => {
        expect(radiogroup).toContainElement(radio);
      });
    });
  });
});
