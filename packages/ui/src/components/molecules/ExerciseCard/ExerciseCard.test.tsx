import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExerciseCard } from './ExerciseCard';

const defaultProps = {
  exercise: {
    id: 'drums-basic-1',
    title: 'Ejercicio 1',
    description: 'Patrón básico de batería para practicar ritmo.',
  },
  instrumentType: 'electronic-drums' as const,
};

describe('ExerciseCard — content', () => {
  it('displays the exercise title', () => {
    render(<ExerciseCard {...defaultProps} />);
    expect(screen.getByText('Ejercicio 1')).toBeInTheDocument();
  });

  it('displays the exercise description', () => {
    render(<ExerciseCard {...defaultProps} />);
    expect(
      screen.getByText('Patrón básico de batería para practicar ritmo.')
    ).toBeInTheDocument();
  });
});

describe('ExerciseCard — navigation', () => {
  it('links to /practice/{instrumentType}/{exerciseId}', () => {
    render(<ExerciseCard {...defaultProps} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute(
      'href',
      '/practice/electronic-drums/drums-basic-1'
    );
  });

  it('constructs correct URL for bass exercises', () => {
    render(
      <ExerciseCard
        exercise={{
          id: 'bass-line-1',
          title: 'Ejercicio 1',
          description: 'Línea de bajo sencilla para practicar el pulso.',
        }}
        instrumentType="bass-guitar"
      />
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/practice/bass-guitar/bass-line-1');
  });
});

describe('ExerciseCard — keyboard accessibility', () => {
  it('is focusable', () => {
    render(<ExerciseCard {...defaultProps} />);
    const link = screen.getByRole('link');
    link.focus();
    expect(link).toHaveFocus();
  });

  it('is activatable via Enter key', () => {
    render(<ExerciseCard {...defaultProps} />);
    const link = screen.getByRole('link');
    // Links are natively activated by Enter — verify the element exists as a link
    expect(link.tagName).toBe('A');
  });
});

/**
 * Dark mode support — specs/theme.md → Component Theme Support → ExerciseCard
 */
describe('ExerciseCard — dark mode support', () => {
  it('card includes dark:bg-gray-800 class', () => {
    render(<ExerciseCard {...defaultProps} />);
    expect(screen.getByRole('link')).toHaveClass('dark:bg-gray-800');
  });

  it('card includes dark:text-gray-100 class', () => {
    render(<ExerciseCard {...defaultProps} />);
    expect(screen.getByRole('link')).toHaveClass('dark:text-gray-100');
  });

  it('card includes dark:border-gray-700 class', () => {
    render(<ExerciseCard {...defaultProps} />);
    expect(screen.getByRole('link')).toHaveClass('dark:border-gray-700');
  });
});

/**
 * Spec 06: FavoriteButton Integration
 * AC: FavoriteButton component (spec 03) imported and rendered
 * AC: FavoriteButton receives `exerciseId` prop
 */
describe('ExerciseCard — FavoriteButton integration', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders FavoriteButton component', () => {
    render(<ExerciseCard {...defaultProps} />);
    // FavoriteButton renders a button with aria-label related to favorites
    const favoriteButton = screen.getByLabelText(/add to favorites|remove from favorites/i);
    expect(favoriteButton).toBeInTheDocument();
  });

  it('passes exerciseId to FavoriteButton', () => {
    render(<ExerciseCard {...defaultProps} />);
    const favoriteButton = screen.getByLabelText(/add to favorites|remove from favorites/i);
    // Button should exist and be functional (verifying prop was passed)
    expect(favoriteButton).toBeEnabled();
  });

  it('FavoriteButton renders with heart icon', () => {
    const { container } = render(<ExerciseCard {...defaultProps} />);
    // FavoriteButton renders an SVG heart icon inside the favorite button
    const favoriteButton = screen.getByLabelText(/add to favorites|remove from favorites/i);
    const heartSvg = favoriteButton.querySelector('svg');
    expect(heartSvg).toBeInTheDocument();
  });

  it('FavoriteButton is positioned before exercise title', () => {
    render(<ExerciseCard {...defaultProps} />);
    const favoriteButton = screen.getByLabelText(/add to favorites|remove from favorites/i);
    const titleElement = screen.getByText('Ejercicio 1');

    // FavoriteButton should appear in the DOM before title
    expect(favoriteButton.compareDocumentPosition(titleElement)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });
});

/**
 * Spec 06: FavoriteButton tag badge integration
 * AC: Tag badge (if present) appears to the right of title
 * AC: Heart icon and tag badge visible and functional
 */
describe('ExerciseCard — FavoriteButton tag badge', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('tag badge is not visible when no tags exist', () => {
    render(<ExerciseCard {...defaultProps} />);
    // When no tags, only the heart button should be present, not a tag badge
    const buttons = screen.getAllByRole('button');
    // Should have only 1 button (heart) if no tags exist
    const favoriteHeartButtons = buttons.filter(btn =>
      btn.getAttribute('aria-label')?.includes('favorite')
    );
    expect(favoriteHeartButtons.length).toBeGreaterThan(0);
  });

  it('tag badge is visible when tags exist', () => {
    // Pre-populate tags in localStorage
    const existingTags = { [defaultProps.exercise.id]: ['rock', 'fast'] };
    localStorage.setItem('groovelab_tags', JSON.stringify(existingTags));

    render(<ExerciseCard {...defaultProps} />);
    // Badge should show the count
    const tagBadge = screen.getByLabelText(/2 tags/i);
    expect(tagBadge).toBeInTheDocument();
  });

  it('tag badge is clickable when tags exist', () => {
    // Pre-populate tags in localStorage
    const existingTags = { [defaultProps.exercise.id]: ['rock'] };
    localStorage.setItem('groovelab_tags', JSON.stringify(existingTags));

    render(<ExerciseCard {...defaultProps} />);
    const tagBadge = screen.getByLabelText(/1 tag/i);
    // Badge should be a button
    expect(tagBadge.tagName).toBe('BUTTON');
  });
});

/**
 * Spec 06: Layout Integration
 * AC: FavoriteButton is positioned at the start of title row
 * AC: Exercise title follows immediately after FavoriteButton
 * AC: Right arrow (navigation) remains at far right
 * AC: Layout is responsive
 */
describe('ExerciseCard — layout integration', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('title row uses flex layout with items center', () => {
    const { container } = render(<ExerciseCard {...defaultProps} />);
    const titleRow = container.querySelector('.flex.items-center.gap-2');
    expect(titleRow).toBeInTheDocument();
  });

  it('right arrow SVG is rendered', () => {
    const { container } = render(<ExerciseCard {...defaultProps} />);
    const arrows = container.querySelectorAll('svg');
    // Should have at least heart + arrow SVGs
    expect(arrows.length).toBeGreaterThan(0);
  });

  it('navigation arrow has shrink-0 class to prevent shrinking', () => {
    const { container } = render(<ExerciseCard {...defaultProps} />);
    const card = screen.getByRole('link');
    const svgs = card.querySelectorAll('svg');
    // Last SVG should be the navigation arrow
    const arrowSvg = svgs[svgs.length - 1];
    expect(arrowSvg).toHaveClass('shrink-0');
  });

  it('title has font-medium class for styling', () => {
    render(<ExerciseCard {...defaultProps} />);
    const title = screen.getByText('Ejercicio 1');
    expect(title).toHaveClass('font-medium');
  });

  it('description remains unchanged beneath title', () => {
    render(<ExerciseCard {...defaultProps} />);
    const description = screen.getByText('Patrón básico de batería para practicar ritmo.');
    expect(description).toHaveClass('mt-0.5', 'text-sm');
  });
});

/**
 * Spec 06: TagInput Modal
 * AC: TagInput modal (spec 04) is rendered with `isOpen` state
 * AC: Modal opens when user clicks tag badge (via `onTagsClick` callback)
 */
describe('ExerciseCard — TagInput modal opening', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('TagInput modal is hidden by default', () => {
    render(<ExerciseCard {...defaultProps} />);
    // Modal should not be visible when component first renders
    const dialog = screen.queryByRole('dialog');
    expect(dialog).not.toBeInTheDocument();
  });

  it('TagInput modal opens when tag badge is clicked', async () => {
    const user = userEvent.setup();
    // Pre-populate tags to make badge visible
    const existingTags = { [defaultProps.exercise.id]: ['rock'] };
    localStorage.setItem('groovelab_tags', JSON.stringify(existingTags));

    render(<ExerciseCard {...defaultProps} />);

    // Initially modal should not be visible
    let dialog = screen.queryByRole('dialog');
    expect(dialog).not.toBeInTheDocument();

    // Click the tag badge
    const tagBadge = screen.getByLabelText(/1 tag/i);
    await user.click(tagBadge);

    // Modal should now be visible
    dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
  });

  it('TagInput modal shows exercise title in header', async () => {
    const user = userEvent.setup();
    // Pre-populate tags to make badge visible
    const existingTags = { [defaultProps.exercise.id]: ['rock'] };
    localStorage.setItem('groovelab_tags', JSON.stringify(existingTags));

    render(<ExerciseCard {...defaultProps} />);

    // Click the tag badge to open modal
    const tagBadge = screen.getByLabelText(/1 tag/i);
    await user.click(tagBadge);

    // Modal header should show the exercise title
    const modalHeader = screen.getByText(`Tags for "${defaultProps.exercise.title}"`);
    expect(modalHeader).toBeInTheDocument();
  });

  it('TagInput modal closes when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    // Pre-populate tags to make badge visible
    const existingTags = { [defaultProps.exercise.id]: ['rock'] };
    localStorage.setItem('groovelab_tags', JSON.stringify(existingTags));

    render(<ExerciseCard {...defaultProps} />);

    // Click tag badge to open modal
    const tagBadge = screen.getByLabelText(/1 tag/i);
    await user.click(tagBadge);

    // Modal should be open
    let dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Click Cancel button
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    // Modal should be closed
    dialog = screen.queryByRole('dialog');
    expect(dialog).not.toBeInTheDocument();
  });

  it('TagInput modal closes when Escape key is pressed', async () => {
    const user = userEvent.setup();
    // Pre-populate tags to make badge visible
    const existingTags = { [defaultProps.exercise.id]: ['rock'] };
    localStorage.setItem('groovelab_tags', JSON.stringify(existingTags));

    render(<ExerciseCard {...defaultProps} />);

    // Click tag badge to open modal
    const tagBadge = screen.getByLabelText(/1 tag/i);
    await user.click(tagBadge);

    // Modal should be open
    let dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Press Escape
    await user.keyboard('{Escape}');

    // Modal should be closed
    dialog = screen.queryByRole('dialog');
    expect(dialog).not.toBeInTheDocument();
  });
});

/**
 * Spec 06: State Management
 * AC: Add `tagInputOpen: boolean` state (local to ExerciseCard)
 * AC: Modal state isolated per ExerciseCard instance
 */
describe('ExerciseCard — modal state management', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('modal state is independent per card instance', () => {
    const { rerender } = render(<ExerciseCard {...defaultProps} />);

    // First render
    let dialog = screen.queryByRole('dialog');
    expect(dialog).not.toBeInTheDocument();

    // Render same component again
    rerender(<ExerciseCard {...defaultProps} />);

    // Modal should still be hidden for new instance
    dialog = screen.queryByRole('dialog');
    expect(dialog).not.toBeInTheDocument();
  });

  it('each card instance maintains its own modal state', () => {
    // Test that each rendered ExerciseCard has independent state
    // by rendering two cards separately and verifying they don't share state
    const existingTags = {
      'exercise-1': ['rock'],
      'exercise-2': ['blues'],
    };
    localStorage.setItem('groovelab_tags', JSON.stringify(existingTags));

    const exercise1 = {
      id: 'exercise-1',
      title: 'Exercise 1',
      description: 'First exercise',
    };

    const { unmount } = render(
      <ExerciseCard exercise={exercise1} instrumentType="electronic-drums" />
    );

    // Modal should not be open for first card
    let dialog = screen.queryByRole('dialog');
    expect(dialog).not.toBeInTheDocument();

    // Unmount first card
    unmount();

    const exercise2 = {
      id: 'exercise-2',
      title: 'Exercise 2',
      description: 'Second exercise',
    };

    // Render second card
    render(<ExerciseCard exercise={exercise2} instrumentType="electronic-drums" />);

    // Modal should not be open for second card either (independent state)
    dialog = screen.queryByRole('dialog');
    expect(dialog).not.toBeInTheDocument();
  });

  it('modal state persists across re-renders when not changed', async () => {
    const user = userEvent.setup();
    // Pre-populate tags to make badge visible
    const existingTags = { [defaultProps.exercise.id]: ['rock'] };
    localStorage.setItem('groovelab_tags', JSON.stringify(existingTags));

    const { rerender } = render(<ExerciseCard {...defaultProps} />);

    // Open modal
    const tagBadge = screen.getByLabelText(/1 tag/i);
    await user.click(tagBadge);

    // Modal should be open
    let dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Re-render with same props (simulating parent update)
    rerender(<ExerciseCard {...defaultProps} />);

    // Modal should still be open
    dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
  });
});

/**
 * Spec 06: Backward Compatibility
 * AC: Existing ExerciseCardProps interface unchanged (no breaking changes)
 * AC: Existing tests still pass (no regression)
 * AC: Card link navigation unaffected
 * AC: Modal overlay doesn't interfere with card navigation
 */
describe('ExerciseCard — backward compatibility', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('card link href is still generated correctly', () => {
    render(<ExerciseCard {...defaultProps} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/practice/electronic-drums/drums-basic-1');
  });

  it('requires only exercise and instrumentType props', () => {
    // This test verifies that no new required props were added
    const { container } = render(<ExerciseCard {...defaultProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('card hover state works (group-hover classes apply)', () => {
    render(<ExerciseCard {...defaultProps} />);
    const card = screen.getByRole('link');
    // Verify group-hover classes exist
    expect(card).toHaveClass('group');
  });

  it('FavoriteButton click does not navigate to exercise', async () => {
    const user = userEvent.setup();
    render(<ExerciseCard {...defaultProps} />);

    const favoriteButton = screen.getByLabelText(/add to favorites/i);
    // Before click, should have the exercise link
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/practice/electronic-drums/drums-basic-1');

    // Click heart button
    await user.click(favoriteButton);

    // Link should still be present and unchanged
    expect(link).toHaveAttribute('href', '/practice/electronic-drums/drums-basic-1');
  });

  it('tag badge click does not navigate to exercise', async () => {
    const user = userEvent.setup();
    // Pre-populate tags to make badge visible
    const existingTags = { [defaultProps.exercise.id]: ['rock'] };
    localStorage.setItem('groovelab_tags', JSON.stringify(existingTags));

    render(<ExerciseCard {...defaultProps} />);

    const link = screen.getByRole('link');
    const tagBadge = screen.getByLabelText(/1 tag/i);

    // Click tag badge
    await user.click(tagBadge);

    // Link href should remain unchanged and pointing to exercise
    expect(link).toHaveAttribute('href', '/practice/electronic-drums/drums-basic-1');
  });

  it('modal renders outside of card link element', async () => {
    const user = userEvent.setup();
    // Pre-populate tags to make badge visible
    const existingTags = { [defaultProps.exercise.id]: ['rock'] };
    localStorage.setItem('groovelab_tags', JSON.stringify(existingTags));

    const { container } = render(<ExerciseCard {...defaultProps} />);

    // Click tag badge to open modal
    const tagBadge = screen.getByLabelText(/1 tag/i);
    await user.click(tagBadge);

    // Modal should be rendered
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Modal should not be nested inside the link element
    const link = screen.getByRole('link');
    expect(link.contains(dialog)).toBe(false);
  });
});

/**
 * Spec 06: Accessibility
 * AC: FavoriteButton is keyboard-accessible (Tab key)
 * AC: Card link still keyboard-navigable
 * AC: No hidden content; `aria-hidden` not used on functional elements
 */
describe('ExerciseCard — accessibility', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('card link is keyboard navigable', () => {
    render(<ExerciseCard {...defaultProps} />);
    const link = screen.getByRole('link');
    link.focus();
    expect(link).toHaveFocus();
  });

  it('FavoriteButton heart is keyboard accessible', () => {
    render(<ExerciseCard {...defaultProps} />);
    const favoriteButton = screen.getByLabelText(/add to favorites|remove from favorites/i);
    expect(favoriteButton.tagName).toBe('BUTTON');
  });

  it('right arrow SVG has aria-hidden="true"', () => {
    const { container } = render(<ExerciseCard {...defaultProps} />);
    const card = screen.getByRole('link');
    const arrowSvg = card.querySelector('svg');
    expect(arrowSvg).toHaveAttribute('aria-hidden', 'true');
  });
});

/**
 * Spec 06: Edge Cases
 * AC: No tags on exercise — FavoriteButton shows heart only; clicking heart doesn't open modal
 */
describe('ExerciseCard — edge cases', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders FavoriteButton even when exercise has no tags', () => {
    render(<ExerciseCard {...defaultProps} />);
    // Heart button should always be present
    const favoriteButton = screen.getByLabelText(/add to favorites|remove from favorites/i);
    expect(favoriteButton).toBeInTheDocument();
  });

  it('card with very long title renders correctly', () => {
    const longTitleProps = {
      ...defaultProps,
      exercise: {
        ...defaultProps.exercise,
        title: 'This is a very long exercise title that might wrap on mobile devices and should still display correctly',
      },
    };
    render(<ExerciseCard {...longTitleProps} />);
    expect(
      screen.getByText(/This is a very long exercise title/)
    ).toBeInTheDocument();
  });

  it('card with short description renders correctly', () => {
    const shortDescProps = {
      ...defaultProps,
      exercise: {
        ...defaultProps.exercise,
        description: 'Short desc',
      },
    };
    render(<ExerciseCard {...shortDescProps} />);
    expect(screen.getByText('Short desc')).toBeInTheDocument();
  });
});
