import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { addTag, getExerciseTags, removeTag } from '@groovelab/utils';

export interface TagInputProps {
  /** Exercise ID used to load and manage tags in storage */
  exerciseId: string;
  /** Controls visibility of the modal */
  isOpen: boolean;
  /** Called when the modal should be closed */
  onClose: () => void;
  /** Optional class name appended to the root element */
  className?: string;
}

/**
 * TagInput — modal dialog for adding and removing tags on an exercise.
 *
 * Opens as a centered dialog, reads tags from localStorage via `getExerciseTags`,
 * and writes changes immediately via `addTag` / `removeTag`.
 */
export const TagInput: React.FC<TagInputProps> = ({ exerciseId, isOpen, onClose, className }) => {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const [tags, setTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');

  // Load tags from storage when the modal opens
  useEffect(() => {
    if (isOpen) {
      // Capture the element that opened the modal so we can return focus to it on close
      triggerRef.current = document.activeElement as HTMLButtonElement | null;
      const stored = getExerciseTags(exerciseId);
      setTags([...stored].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })));
      setInputValue('');
      // Delay focus to let the DOM settle after the conditional render
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    } else {
      // Return focus to the element that opened the modal
      triggerRef.current?.focus();
    }
  }, [isOpen, exerciseId]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleAdd = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      // Duplicate — silently ignore; clear input
      setInputValue('');
      return;
    }
    addTag(exerciseId, trimmed);
    const updated = getExerciseTags(exerciseId);
    setTags([...updated].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })));
    setInputValue('');
  }, [exerciseId, inputValue, tags]);

  const handleRemove = useCallback(
    (tag: string) => {
      removeTag(exerciseId, tag);
      const updated = getExerciseTags(exerciseId);
      setTags([...updated].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })));
    },
    [exerciseId],
  );

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAdd();
      }
    },
    [handleAdd],
  );

  if (!isOpen) return null;

  return (
    <div className={['fixed inset-0 z-50 flex items-center justify-center', className].join(' ')}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-labelledby={titleId}
        aria-modal="true"
        className={[
          'relative w-full max-w-md mx-4',
          'rounded-xl border border-gray-700 bg-gray-900 shadow-2xl',
          'flex flex-col',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
          <h2 id={titleId} className="text-base font-semibold text-white">
            Manage Tags
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close tag editor"
            className={[
              'text-gray-400 hover:text-white transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-400 rounded',
            ].join(' ')}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-4">
          {/* Add tag row */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={`${titleId}-input`}
              className="text-sm font-medium text-gray-300"
            >
              Add Tag
            </label>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                id={`${titleId}-input`}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleInputKeyDown}
                aria-label="New tag input"
                placeholder="Type a tag…"
                className={[
                  'flex-1 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2',
                  'text-sm text-white placeholder-gray-500',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent',
                  'transition-colors duration-100',
                ].join(' ')}
              />
              <button
                type="button"
                onClick={handleAdd}
                className={[
                  'px-4 py-2 rounded-lg text-sm font-medium',
                  'bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-blue-500',
                  'transition-colors duration-100',
                ].join(' ')}
              >
                Add
              </button>
            </div>
          </div>

          {/* Existing tags */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-300">Existing Tags</span>
            {tags.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No tags yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className={[
                      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full',
                      'text-sm font-medium',
                      'bg-gray-700 text-gray-200',
                    ].join(' ')}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemove(tag)}
                      aria-label={`Remove tag '${tag}'`}
                      className={[
                        'ml-0.5 rounded-full p-0.5',
                        'text-gray-400 hover:text-white hover:bg-gray-600',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-400',
                        'transition-colors duration-100',
                      ].join(' ')}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        width="12"
                        height="12"
                        aria-hidden="true"
                      >
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-gray-800 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className={[
              'px-4 py-2 rounded-lg text-sm font-medium',
              'bg-gray-700 text-gray-200 hover:bg-gray-600 active:bg-gray-800',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-400',
              'transition-colors duration-100',
            ].join(' ')}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
