import React, { useRef, useState } from 'react';
import { Button } from '../../atoms/Button';

export interface FileUploadZoneProps {
  onFilesSelected?: (files: File[]) => void;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({ onFilesSelected }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    setSelectedFiles(fileArray);
    onFilesSelected?.(fileArray);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  return (
    <div
      role="region"
      aria-label="File upload area"
      tabIndex={0}
      data-drag-over={String(isDragOver)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={[
        'flex flex-col items-center gap-4 rounded-xl border-2 border-dashed p-10 text-center transition-colors',
        isDragOver
          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
          : 'border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50',
      ].join(' ')}
    >
      <p className="text-gray-600 dark:text-gray-400">
        Drag &amp; drop files here, or click the button below to select files
      </p>
      {selectedFiles.length > 0 && (
        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
          {selectedFiles.map((f) => (
            <li key={f.name}>{f.name}</li>
          ))}
        </ul>
      )}
      <input
        ref={inputRef}
        type="file"
        multiple
        className="sr-only"
        onChange={handleInputChange}
        aria-hidden="true"
        tabIndex={-1}
      />
      <Button onClick={() => inputRef.current?.click()}>
        Select Files
      </Button>
    </div>
  );
};
