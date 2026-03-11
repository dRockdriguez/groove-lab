import React, { useRef, useState } from 'react';
import type { InstrumentType } from '@groovelab/types';
import { InstrumentButton, FileUploadZone } from '@groovelab/ui';

const INSTRUMENT_LABELS: Record<InstrumentType, string> = {
  'electronic-drums': 'Drums',
  'bass-guitar': 'Bass',
  guitar: 'Guitar',
};

const INSTRUMENT_ORDER: InstrumentType[] = ['electronic-drums', 'bass-guitar', 'guitar'];

export const ImportPage: React.FC = () => {
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentType>('electronic-drums');
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const tabId = (type: InstrumentType) => `import-tab-${type}`;

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

  return (
    <div className="dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Import Files</h1>
      <div role="tablist" className="flex gap-1 mb-8 p-1 bg-gray-900 rounded-xl w-fit">
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
      <FileUploadZone />
    </div>
  );
};
