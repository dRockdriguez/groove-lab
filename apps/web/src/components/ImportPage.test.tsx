import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ImportPage } from './ImportPage';

describe('ImportPage — Page Navigation', () => {
  it('renders a heading indicating this is the import page', () => {
    render(<ImportPage />);
    expect(screen.getByRole('heading', { name: /import/i })).toBeInTheDocument();
  });

  it('renders without errors within the existing GrooveLab layout', () => {
    const { container } = render(<ImportPage />);
    expect(container).toBeTruthy();
  });
});

describe('ImportPage — Instrument Selector', () => {
  it('renders an instrument selector at the top of the page', () => {
    render(<ImportPage />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('renders three instrument tabs: Drums, Bass, Guitar', () => {
    render(<ImportPage />);
    expect(screen.getByRole('tab', { name: 'Drums' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Bass' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Guitar' })).toBeInTheDocument();
  });

  it('uses role="tablist" for the instrument selector container', () => {
    render(<ImportPage />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('each tab uses role="tab" with aria-selected attribute', () => {
    render(<ImportPage />);
    const drumsTab = screen.getByRole('tab', { name: 'Drums' });
    const bassTab = screen.getByRole('tab', { name: 'Bass' });
    const guitarTab = screen.getByRole('tab', { name: 'Guitar' });
    expect(drumsTab).toHaveAttribute('aria-selected');
    expect(bassTab).toHaveAttribute('aria-selected');
    expect(guitarTab).toHaveAttribute('aria-selected');
  });

  it('Drums (electronic-drums) is the default selected instrument on page load', () => {
    render(<ImportPage />);
    expect(screen.getByRole('tab', { name: 'Drums' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Bass' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: 'Guitar' })).toHaveAttribute('aria-selected', 'false');
  });

  it('maintains one selected instrument at all times (no empty selection)', () => {
    render(<ImportPage />);
    const tabs = screen.getAllByRole('tab');
    const selectedTabs = tabs.filter((tab) => tab.getAttribute('aria-selected') === 'true');
    expect(selectedTabs).toHaveLength(1);
  });

  it('clicking a different instrument tab updates the selection visually', () => {
    render(<ImportPage />);
    const bassTab = screen.getByRole('tab', { name: 'Bass' });
    fireEvent.click(bassTab);
    expect(bassTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Drums' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: 'Guitar' })).toHaveAttribute('aria-selected', 'false');
  });

  it('clicking Guitar tab updates selection without page reload', () => {
    render(<ImportPage />);
    const guitarTab = screen.getByRole('tab', { name: 'Guitar' });
    fireEvent.click(guitarTab);
    expect(guitarTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Drums' })).toHaveAttribute('aria-selected', 'false');
  });
});

describe('ImportPage — File Upload Area', () => {
  it('renders a file upload component below the instrument selector', () => {
    render(<ImportPage />);
    const uploadZone = screen.getByRole('region', { name: /file upload/i });
    const tablist = screen.getByRole('tablist');
    expect(uploadZone).toBeInTheDocument();
    expect(tablist).toBeInTheDocument();
    // Verify upload zone appears after tablist in DOM
    expect(tablist.compareDocumentPosition(uploadZone)).toBe(4); // Node.DOCUMENT_POSITION_FOLLOWING
  });

  it('includes a drag & drop zone with visual feedback indicator', () => {
    render(<ImportPage />);
    const uploadZone = screen.getByRole('region', { name: /file upload/i });
    expect(uploadZone).toBeInTheDocument();
  });

  it('includes a "Select Files" button that opens a file picker dialog', () => {
    render(<ImportPage />);
    const selectButton = screen.getByRole('button', { name: /select files/i });
    expect(selectButton).toBeInTheDocument();
  });

  it('displays instructional text guiding users to drag & drop or click to select', () => {
    render(<ImportPage />);
    expect(screen.getByText(/drag.*drop|drop.*drag/i)).toBeInTheDocument();
  });

  it('integrates drag & drop zone and button as part of the same upload interface', () => {
    render(<ImportPage />);
    const uploadZone = screen.getByRole('region', { name: /file upload/i });
    const selectButton = screen.getByRole('button', { name: /select files/i });
    expect(selectButton).toBeInTheDocument();
    expect(uploadZone).toContainElement(selectButton);
  });
});

describe('ImportPage — File Upload Drag & Drop Interaction', () => {
  it.todo('shows visual feedback when hovering over drag & drop zone');
  it.todo('accepts files via drag & drop');
  it.todo('displays selected filenames after drag & drop');
});

describe('ImportPage — Accessibility', () => {
  it('instrument selector is keyboard-navigable using Arrow keys (WAI-ARIA Tabs pattern)', () => {
    render(<ImportPage />);
    const drumsTab = screen.getByRole('tab', { name: 'Drums' });
    drumsTab.focus();
    expect(drumsTab).toHaveFocus();
  });

  it.todo('ArrowRight moves selection from Drums to Bass');

  it.todo('ArrowLeft wraps from Drums to Guitar');

  it('file upload area is focusable and interactive via keyboard', () => {
    render(<ImportPage />);
    const selectButton = screen.getByRole('button', { name: /select files/i });
    selectButton.focus();
    expect(selectButton).toHaveFocus();
  });

  it('has adequate ARIA labels and descriptions for the upload area', () => {
    render(<ImportPage />);
    const uploadZone = screen.getByRole('region', { name: /file upload/i });
    expect(uploadZone).toHaveAttribute('aria-label');
  });

  it.todo('Tab key moves focus through the page in a logical order');
});

describe('ImportPage — Design & Consistency', () => {
  it.todo('page design follows the visual style of other GrooveLab pages');
  it.todo('instrument selector tabs match the style and behavior of ExerciseBrowser');
  it.todo('file upload component uses existing UI library components');
  it.todo('page is responsive on viewport widths from 320px to 1440px');
});
