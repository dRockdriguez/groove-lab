import React, { useEffect, useRef, useState } from 'react';
import type { InstrumentExercises, InstrumentType } from '@groovelab/types';
import {
  filterExercises,
  getSelectedFilterTags,
  setSelectedFilterTags,
  useLocalStorageListener,
} from '@groovelab/utils';
import { InstrumentButton } from '../../atoms/InstrumentButton';
import { ExerciseSectionList } from '../../molecules/ExerciseSectionList';
import { TagFilter } from '../../molecules/TagFilter';

export interface ExerciseBrowserProps {
  exercisesByInstrument: InstrumentExercises[];
}

const INSTRUMENT_LABELS: Record<InstrumentType, string> = {
  'electronic-drums': 'Drums',
  'bass-guitar': 'Bass',
  guitar: 'Guitar',
};

const INSTRUMENT_ORDER: InstrumentType[] = ['electronic-drums', 'bass-guitar', 'guitar'];

export const ExerciseBrowser: React.FC<ExerciseBrowserProps> = ({ exercisesByInstrument }) => {
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentType>('electronic-drums');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    // Initialize with all sections expanded by default
    const allSectionIds = new Set<string>();
    exercisesByInstrument.forEach((instrument: InstrumentExercises) => {
      instrument.sections.forEach((section) => {
        allSectionIds.add(section.id);
      });
    });
    return allSectionIds;
  });

  // ── Filter State ──────────────────────────────────────────────────────────
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedFilterTags, setSelectedFilterTagsState] = useState<string[]>(() => {
    return getSelectedFilterTags();
  });

  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Persist filter tags to sessionStorage whenever they change
  useEffect(() => {
    setSelectedFilterTags(selectedFilterTags);
  }, [selectedFilterTags]);

  const handleTagsChange = (tags: string[]) => {
    setSelectedFilterTagsState(tags);
  };

  const handleClearFilters = () => {
    setShowFavoritesOnly(false);
    setSelectedFilterTagsState([]);
    setSelectedFilterTags([]);
  };

  // Re-filter when tags or favorites change in localStorage (same tab + cross-tab)
  // The filterExercises call below reads from storage directly, so a re-render is sufficient.
  useLocalStorageListener(['groovelab_tags', 'groovelab_favorites']);

  const isAnyFilterActive = showFavoritesOnly || selectedFilterTags.length > 0;

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const tabId = (type: InstrumentType) => `tab-${type}`;

  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    let nextIndex: number | null = null;
    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % INSTRUMENT_ORDER.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + INSTRUMENT_ORDER.length) % INSTRUMENT_ORDER.length;
    }
    if (nextIndex !== null) {
      e.preventDefault();
      const nextType = INSTRUMENT_ORDER[nextIndex];
      tabRefs.current[nextType]?.focus();
    }
  };

  // Apply filter logic
  const filteredData = filterExercises(
    exercisesByInstrument,
    selectedInstrument,
    showFavoritesOnly,
    selectedFilterTags
  );

  const activeData = filteredData[0];
  const hasSections = activeData && activeData.sections.length > 0;

  // Count total matching exercises across all filtered sections
  const totalMatchingExercises = activeData
    ? activeData.sections.reduce((sum, section) => sum + section.exercises.length, 0)
    : 0;

  // Check if all exercises have been filtered out
  const allFilteredOut = isAnyFilterActive && hasSections && totalMatchingExercises === 0;

  return (
    <div>
      <div role="tablist" className="flex gap-1 mb-8 p-1 rounded-xl w-fit bg-gray-100 dark:bg-gray-900">
        {INSTRUMENT_ORDER.map((type, index) => (
          <InstrumentButton
            key={type}
            ref={(el: HTMLButtonElement | null) => {
              tabRefs.current[type] = el;
            }}
            id={tabId(type)}
            instrumentType={type}
            label={INSTRUMENT_LABELS[type]}
            isSelected={selectedInstrument === type}
            tabIndex={selectedInstrument === type ? 0 : -1}
            onClick={() => setSelectedInstrument(type)}
            onKeyDown={(e: React.KeyboardEvent) => handleKeyDown(e, index)}
          />
        ))}
      </div>

      {/* ── Filter Controls ────────────────────────────────────────────────── */}
      <div
        aria-label="Exercise filters"
        className="flex flex-col gap-4 mb-6"
      >
        {/* Favorites toggle + Clear Filters row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Favorites toggle button */}
          <button
            type="button"
            aria-label="Show favorites only"
            aria-pressed={showFavoritesOnly}
            onClick={() => setShowFavoritesOnly((prev) => !prev)}
            className={[
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
              'transition-colors duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
              showFavoritesOnly
                ? [
                    'bg-red-500 text-white dark:bg-red-600',
                    'hover:bg-red-600 dark:hover:bg-red-500',
                    'focus-visible:ring-red-400',
                  ].join(' ')
                : [
                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
                    'hover:bg-gray-200 dark:hover:bg-gray-700',
                    'focus-visible:ring-gray-400',
                  ].join(' '),
            ].join(' ')}
          >
            {/* Heart icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              width="16"
              height="16"
              aria-hidden="true"
              fill={showFavoritesOnly ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={showFavoritesOnly ? 0 : 1.5}
            >
              <path
                fillRule="evenodd"
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                clipRule="evenodd"
              />
            </svg>
            Favorites Only
          </button>

          {/* Clear Filters button — only visible when any filter is active */}
          {isAnyFilterActive && (
            <button
              type="button"
              aria-label="Clear all filters"
              onClick={handleClearFilters}
              className={[
                'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium',
                'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
                'hover:bg-gray-300 dark:hover:bg-gray-600',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-400',
                'transition-colors duration-150',
              ].join(' ')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                width="14"
                height="14"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Reset Filters
            </button>
          )}
        </div>

        {/* Tag filter section */}
        <TagFilter
          selectedTags={selectedFilterTags}
          onSelectedTagsChange={handleTagsChange}
        />
      </div>

      {/* ── Results Feedback ───────────────────────────────────────────────── */}
      {isAnyFilterActive && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Showing{' '}
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {totalMatchingExercises}
          </span>{' '}
          {totalMatchingExercises === 1 ? 'exercise' : 'exercises'}
        </p>
      )}

      {/* ── Exercise List ──────────────────────────────────────────────────── */}
      <div
        role="tabpanel"
        aria-labelledby={tabId(selectedInstrument)}
        tabIndex={0}
        className="space-y-6"
      >
        {allFilteredOut ? (
          <p className="text-gray-500 dark:text-gray-400 italic">
            {showFavoritesOnly && selectedFilterTags.length === 0
              ? 'No favorites yet. Mark exercises as favorites to see them here.'
              : 'No exercises match your filters'}
          </p>
        ) : hasSections ? (
          activeData.sections.map((section) => (
            <ExerciseSectionList
              key={section.id}
              section={section}
              instrumentType={selectedInstrument}
              isExpanded={expandedSections.has(section.id)}
              onToggleExpand={() => toggleSection(section.id)}
            />
          ))
        ) : (
          <p>No hay ejercicios disponibles</p>
        )}
      </div>
    </div>
  );
};
