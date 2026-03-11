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

  const extractFilesFromItems = async (
    items: DataTransferItemList | undefined
  ): Promise<File[]> => {
    if (!items || items.length === 0) return [];

    const files: File[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item || item.kind !== 'file') continue;

      const entry = item.webkitGetAsEntry?.();
      if (!entry) {
        // Fallback: if webkitGetAsEntry is not available, treat as file
        const file = item.getAsFile();
        if (file) files.push(file);
        continue;
      }

      // Recursively extract files from directories
      const extracted = await extractFromEntry(entry);
      files.push(...extracted);
    }

    return files;
  };

  const extractFromEntry = async (
    entry: FileSystemEntry
  ): Promise<File[]> => {
    const files: File[] = [];

    if (entry.isFile) {
      const file = await new Promise<File>((resolve, reject) => {
        (entry as FileSystemFileEntry).file(resolve, reject);
      });
      files.push(file);
    } else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      const entries = await new Promise<FileSystemEntry[]>(
        (resolve, reject) => {
          reader.readEntries(resolve, reject);
        }
      );

      for (const childEntry of entries) {
        const childFiles = await extractFromEntry(childEntry);
        files.push(...childFiles);
      }
    }

    return files;
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

    // Try to extract files from directories first
    if (e.dataTransfer.items?.length) {
      extractFilesFromItems(e.dataTransfer.items).then((extractedFiles) => {
        if (extractedFiles.length > 0) {
          setSelectedFiles(extractedFiles);
          onFilesSelected?.(extractedFiles);
        } else {
          // Fallback if extraction fails
          handleFiles(e.dataTransfer.files);
        }
      });
    } else {
      // Fallback to basic file list
      handleFiles(e.dataTransfer.files);
    }
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
        webkitdirectory=""
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
