import React, { useRef, useState } from 'react';
import type { InstrumentType } from '@groovelab/types';
import { InstrumentButton, FileUploadZone } from '@groovelab/ui';

const API_BASE_URL = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:8000';

interface UploadResponse {
  message: string;
  instrument: string;
  imported_exercises: Array<{
    exercise_name: string;
    audio_path: string;
    bpm: number;
    total_notes: number;
  }>;
  errors: string[];
}

const INSTRUMENT_LABELS: Record<InstrumentType, string> = {
  'electronic-drums': 'Drums',
  'bass-guitar': 'Bass',
  guitar: 'Guitar',
};

const INSTRUMENT_ORDER: InstrumentType[] = ['electronic-drums', 'bass-guitar', 'guitar'];

export const ImportPage: React.FC = () => {
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentType>('electronic-drums');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
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

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
    setUploadStatus('idle');
    setUploadMessage('');
    setUploadError(null);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !selectedInstrument) return;

    setIsUploading(true);
    setUploadStatus('idle');
    setUploadMessage('');
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('instrument', selectedInstrument);
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch(`${API_BASE_URL}/import`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorDetail = response.statusText;
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            errorDetail = Array.isArray(errorData.detail)
              ? errorData.detail.map((e: { msg: string }) => e.msg).join(', ')
              : String(errorData.detail);
          } else if (errorData.errors?.length) {
            errorDetail = errorData.errors.join(', ');
          }
        } catch {
          // use statusText as fallback
        }
        setUploadStatus('error');
        setUploadMessage(`Upload failed: ${errorDetail}`);
        setUploadError(errorDetail);
      } else {
        const data: UploadResponse = await response.json();
        const count = data.imported_exercises?.length ?? 0;
        const instrumentLabel = INSTRUMENT_LABELS[selectedInstrument];
        setUploadStatus('success');
        setUploadMessage(
          `Success! ${count} exercise${count !== 1 ? 's' : ''} imported for ${instrumentLabel}.`
        );
        setSelectedFiles([]);
      }
    } catch (e){
      debugger;
      const message =
        'Network error: Unable to reach the server. Please check your connection and try again.';
      setUploadStatus('error');
      setUploadMessage(message);
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDismiss = () => {
    setUploadStatus('idle');
    setUploadMessage('');
    setUploadError(null);
  };

  return (
    <div className="dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Import Files</h1>
      <div
        role="tablist"
        className="flex gap-1 mb-8 p-1 bg-gray-100 dark:bg-gray-900 rounded-xl w-fit"
      >
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
      <FileUploadZone onFilesSelected={handleFilesSelected} />
      {selectedFiles.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
          >
            {isUploading
              ? 'Uploading...'
              : `Upload ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}
      {uploadStatus !== 'idle' && (
        <div
          role="alert"
          className={[
            'mt-4 p-4 rounded-lg flex items-start justify-between gap-4',
            uploadStatus === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200',
          ].join(' ')}
        >
          <p>
            {uploadStatus === 'success' ? '✓ ' : '✗ '}
            {uploadMessage}
          </p>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss message"
            className="shrink-0 font-bold"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};
