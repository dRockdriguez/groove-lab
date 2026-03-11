import React, { useRef, useState } from 'react';
import type { InstrumentExercises, InstrumentType } from '@groovelab/types';
import { InstrumentButton } from '../../atoms/InstrumentButton';
import { ExerciseSectionList } from '../../molecules/ExerciseSectionList';

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
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const activeData = exercisesByInstrument.find(
    (entry) => entry.instrumentType === selectedInstrument
  );

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

  const hasSections = activeData && activeData.sections.length > 0;

  return (
    <div>
      <div role="tablist" className="flex gap-1 mb-8 p-1 rounded-xl w-fit">
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
      <div
        role="tabpanel"
        aria-labelledby={tabId(selectedInstrument)}
        tabIndex={0}
        className="space-y-6"
      >
        {hasSections ? (
          activeData.sections.map((section) => (
            <ExerciseSectionList
              key={section.id}
              section={section}
              instrumentType={selectedInstrument}
            />
          ))
        ) : (
          <p>No hay ejercicios disponibles</p>
        )}
      </div>
    </div>
  );
};
