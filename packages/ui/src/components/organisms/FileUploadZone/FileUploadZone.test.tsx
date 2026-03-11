import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FileUploadZone } from './FileUploadZone';

describe('FileUploadZone — structure', () => {
  it('renders a drag & drop zone with instructional text', () => {
    render(<FileUploadZone />);
    expect(screen.getByText(/drag.*drop|drop.*drag/i)).toBeInTheDocument();
  });

  it('renders a "Select Files" button', () => {
    render(<FileUploadZone />);
    expect(screen.getByRole('button', { name: /select files/i })).toBeInTheDocument();
  });

  it('the drop zone has an accessible label describing the upload area', () => {
    render(<FileUploadZone />);
    expect(screen.getByRole('region', { name: /file upload/i })).toBeInTheDocument();
  });

  it('the drop zone is keyboard-focusable', () => {
    render(<FileUploadZone />);
    const dropZone = screen.getByRole('region', { name: /file upload/i });
    expect(dropZone).toHaveAttribute('tabindex', '0');
  });
});

describe('FileUploadZone — file display', () => {
  it('shows no files selected text initially', () => {
    render(<FileUploadZone />);
    // No selected files shown initially — only instructional text
    expect(screen.queryByText(/selected:/i)).not.toBeInTheDocument();
  });

  it('displays selected file name after file input change', () => {
    render(<FileUploadZone />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'my-midi.mid', { type: 'audio/midi' });
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    fireEvent.change(input);
    expect(screen.getByText(/my-midi\.mid/i)).toBeInTheDocument();
  });
});

describe('FileUploadZone — drag interaction', () => {
  it('adds drag-over visual state when a file is dragged over the zone', () => {
    render(<FileUploadZone />);
    const dropZone = screen.getByRole('region', { name: /file upload/i });
    fireEvent.dragOver(dropZone);
    expect(dropZone).toHaveAttribute('data-drag-over', 'true');
  });

  it('removes drag-over visual state when drag leaves the zone', () => {
    render(<FileUploadZone />);
    const dropZone = screen.getByRole('region', { name: /file upload/i });
    fireEvent.dragOver(dropZone);
    fireEvent.dragLeave(dropZone);
    expect(dropZone).toHaveAttribute('data-drag-over', 'false');
  });

  it('calls onFilesSelected with dropped files', () => {
    const onFilesSelected = vi.fn();
    render(<FileUploadZone onFilesSelected={onFilesSelected} />);
    const dropZone = screen.getByRole('region', { name: /file upload/i });
    const file = new File(['content'], 'dropped.mid', { type: 'audio/midi' });
    fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });
    expect(onFilesSelected).toHaveBeenCalledWith([file]);
  });
});
