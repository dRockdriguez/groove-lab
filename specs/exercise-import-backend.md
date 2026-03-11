# Spec: Exercise Import Backend Processing

**Status:** In Progress
**Version:** 0.1.0
**Last updated:** 2026-03-11

---

## Problem

Currently, the GrooveLab import page (`/import`) accepts file uploads but does not process them. Musicians need a way to upload MIDI and audio file pairs, have them parsed and normalized, and stored persistently so they can be used in practice sessions.

Without backend import processing, the import UI is non-functional—files are accepted but never analyzed, stored, or made available to the application.

---

## User Stories

1. **As a musician**, I want to upload a folder containing MIDI and MP3 file pairs so that the system can process and store my exercises for later use.

2. **As a musician**, I want the system to automatically detect which files form exercises (matching MIDI + audio pairs) so that I don't have to manually organize them.

3. **As a musician**, I want my exercises organized by the folder structure I uploaded so that I can find them later in the same logical grouping.

4. **As a musician**, I want to re-upload a folder with new exercises so that I can add to my collection without losing existing files.

5. **As the system**, I want to parse MIDI files into a normalized JSON format so that exercise data can be used consistently throughout the application.

---

## Acceptance Criteria

### File Upload Endpoint

- [ ] A `POST /import` endpoint exists and is accessible.
- [ ] The endpoint accepts multipart form data with:
  - `instrument` (string): one of `'electronic-drums'`, `'bass-guitar'`, `'guitar'`
  - `files` (array of files): uploaded MIDI, MP3, and folder structure
- [ ] The endpoint validates the `instrument` parameter against valid `InstrumentType` values.
- [ ] If validation fails, the endpoint returns a `400 Bad Request` with a descriptive error message.
- [ ] Successful uploads return a `200 OK` with a response indicating processed exercises.

### Exercise Detection

- [ ] The system identifies exercise pairs by matching files with:
  - identical **base names** (e.g., `Ritmo1`)
  - one file with `.mp3` extension
  - one file with `.midi` or `.mid` extension
- [ ] Both files must be in the **same directory** (not in different nested folders).
- [ ] Files without a matching pair are **ignored** (not processed, not stored).
- [ ] Duplicate files (same name, same directory) in a single upload are handled gracefully:
  - If re-uploading an existing exercise, the system **does not delete** the stored audio or database entry.
  - New exercises are added; existing ones are left unchanged.

### MIDI Parsing

- [ ] The system parses `.midi` or `.mid` files using a MIDI parser library.
- [ ] BPM is extracted from the MIDI file's tempo metadata (default: 120 BPM if not present).
- [ ] Note events are extracted with:
  - `timestamp` (in milliseconds from the start of the track)
  - `note` (MIDI note number, 0–127)
  - `velocity` (0–127)
  - `channel` (1–16)
- [ ] Timestamps are calculated based on MIDI ticks and tempo using the formula:
  ```
  timestamp_ms = (ticks / ticks_per_beat) * (60000 / bpm)
  ```
- [ ] If MIDI parsing fails, the exercise is **skipped** and an error is logged; the upload continues.
- [ ] Metadata extracted includes:
  - `bpm`: beats per minute
  - `offset_ms`: 0 (reserved for future use)
  - `ticks_per_beat`: from MIDI file header
  - `total_notes`: count of note events
  - `source_midi`: original MIDI filename
  - `audio_file`: path to corresponding MP3 (relative to storage root)

### Audio File Persistence

- [ ] MP3 files are saved to disk at:
  ```
  storage/<instrument>/<normalized-folder-name>/<filename>.mp3
  ```
  where `<instrument>` is the uploaded instrument type (e.g., `electronic-drums`, `bass-guitar`, `guitar`)
  and `<normalized-folder-name>` is derived from the uploaded folder structure (spaces → hyphens, lowercase).

- [ ] Folder structure from the upload is **preserved** in the storage path.
- [ ] Example:
  ```
  User uploads: "Ritmos básicos/" with Ritmo1.mp3, Ritmo1.midi
  Stored as: storage/electronic-drums/ritmos-basicos/Ritmo1.mp3
  ```

- [ ] If the same folder is uploaded again (re-import), existing files are **not deleted or overwritten**.
- [ ] New exercises are added alongside existing files.

### Exercise Database Persistence

- [ ] Each processed exercise is stored in the database with:
  - `id` (unique identifier, auto-generated)
  - `instrument_type` (from request: `'electronic-drums'`, `'bass-guitar'`, `'guitar'`)
  - `exercise_name` (base filename without extension, e.g., `Ritmo1`)
  - `folder_path` (relative path within instrument storage, e.g., `ritmos-basicos/`)
  - `audio_path` (full relative path to MP3 file)
  - `bpm` (extracted from MIDI)
  - `total_notes` (count from MIDI)
  - `parsed_midi_data` (JSON normalized from MIDI parsing, includes metadata and note events)
  - `created_at` (timestamp of import)
  - `updated_at` (timestamp of last update, only changes on re-import if file differs)

- [ ] The database schema includes:
  - Unique constraint on `(instrument_type, folder_path, exercise_name)` to prevent duplicates in the same folder.
  - Index on `instrument_type` for fast retrieval by instrument.
  - Index on `folder_path` for fast retrieval by folder organization.

- [ ] Duplicate exercise detection (same instrument, folder, and name):
  - If an exercise with the same name is uploaded to the same folder, the existing database entry is **not deleted or re-created**.
  - The entry is updated only if the MIDI or MP3 file content has changed (use file hash or modification time to detect changes).

### Response Format

- [ ] Successful `POST /import` response returns `200 OK` with:
  ```json
  {
    "message": "Exercises imported successfully",
    "instrument": "electronic-drums",
    "folder_path": "ritmos-basicos",
    "imported_exercises": [
      {
        "exercise_name": "Ritmo1",
        "audio_path": "storage/electronic-drums/ritmos-basicos/Ritmo1.mp3",
        "bpm": 120,
        "total_notes": 13
      },
      {
        "exercise_name": "Ritmo2",
        "audio_path": "storage/electronic-drums/ritmos-basicos/Ritmo2.mp3",
        "bpm": 120,
        "total_notes": 14
      }
    ],
    "errors": []
  }
  ```

- [ ] If no valid exercise pairs are detected:
  ```json
  {
    "message": "No valid exercise pairs found",
    "imported_exercises": [],
    "errors": [
      "No .mp3 and .midi pairs detected in the uploaded files"
    ]
  }
  ```

---

## Technical Notes

### Types

Reference existing types from `@groovelab/types`:

```ts
export type InstrumentType = 'electronic-drums' | 'bass-guitar' | 'guitar';

export interface MidiEvent {
  timestamp: number;     // ms from start
  note: number;          // 0–127
  velocity: number;      // 0–127
  channel: number;       // 1–16
  type: MidiEventType;   // 'noteOn' | 'noteOff' | 'controlChange'
}
```

Define a new type for exercise storage (or extend existing `Exercise` type):

```ts
export interface ImportedExercise {
  id: string;
  instrumentType: InstrumentType;
  exerciseName: string;
  folderPath: string;
  audioPath: string;
  bpm: number;
  totalNotes: number;
  parsedMidiData: {
    metadata: {
      bpm: number;
      audioFile: string;
      offsetMs: number;
      ticksPerBeat: number;
      totalNotes: number;
      sourceMidi: string;
    };
    pistaEjercicio: MidiEvent[];
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Utilities

Use existing utilities from `@groovelab/utils`:

- `GM_DRUM_MAP`: to map MIDI note numbers to drum pad names (for display/debugging)
- `getDrumName(note)`: to look up pad names
- `isValidVelocity(velocity)`: to validate MIDI velocity values
- `isValidNote(note)`: to validate MIDI note numbers
- `bpmToInterval(bpm)`: to calculate beat intervals from BPM
- `intervalToBpm(intervalMs)`: to calculate BPM from beat intervals

### MIDI Parsing Library

For MIDI parsing, consider:
- **python-midi** (for Python backend at `apps/api`)
- Or a lightweight custom parser that extracts:
  - Tempo (BPM)
  - Time signature (if available)
  - Note On/Off events with timing
  - Ticks per beat from header

### File Storage

- Storage root: `apps/api/storage/` (or configurable via env var)
- Structure: `storage/<instrument>/<folder>/<filename>`
- Use safe filename normalization (lowercase, replace spaces with hyphens, remove special chars)
- Validate paths to prevent directory traversal attacks

### Database Schema (Backend)

```
Table: exercises
├── id (UUID, primary key)
├── instrument_type (ENUM: 'electronic-drums', 'bass-guitar', 'guitar')
├── exercise_name (VARCHAR)
├── folder_path (VARCHAR)
├── audio_path (VARCHAR)
├── bpm (INTEGER)
├── total_notes (INTEGER)
├── parsed_midi_data (JSONB or TEXT — full normalized MIDI structure)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
└── Unique constraint: (instrument_type, folder_path, exercise_name)
```

### Error Handling

- Invalid `instrument` parameter → `400 Bad Request`
- No files uploaded → `400 Bad Request` with message "No files provided"
- MIDI parse failure for a single file → log warning, skip exercise, continue processing
- Audio file write failure → `500 Internal Server Error` with details
- Database insert failure (duplicate key, etc.) → log error, skip exercise, continue processing
- Return a summary of successes and failures in the response

### Assumptions

- The multipart upload includes a directory structure that can be reconstructed from file paths.
- MIDI files are well-formed (no validation of MIDI spec compliance is performed).
- Audio files are assumed to be valid MP3 (no re-encoding or validation is performed).
- The system has write access to the storage directory.
- No concurrent uploads to the same folder are expected.

---

## Out of Scope

This feature explicitly **does not include**:

- Audio file validation, re-encoding, or optimization
- MIDI validation beyond basic parsing (musical correctness checks)
- Advanced duplicate detection or conflict resolution (merging, versioning, etc.)
- User authentication or authorization (assumes `/import` is accessible to all)
- Rate limiting or upload quota management
- Progress tracking or chunked uploads for large files
- File deletion or exercise removal endpoints
- Exercise editing or metadata updates after import
- Integration with practice sessions or playback
- Analytics or logging of imports
- Support for file formats other than `.mp3` and `.midi`/`.mid`
- Folder tree visualization or browsing before import
- Drag-and-drop folder selection (files are uploaded in a flat list)

---

## Definition of Done

- [ ] Spec reviewed and accepted
- [ ] Database schema created for storing exercises
- [ ] `POST /import` endpoint scaffolded in FastAPI
- [ ] Multipart form data parsing implemented
- [ ] Exercise pair detection logic implemented and tested
- [ ] MIDI parsing library integrated
- [ ] MIDI → JSON conversion logic implemented and tested
- [ ] Audio file storage logic implemented and tested
- [ ] Database persistence logic implemented and tested
- [ ] Re-import behavior verified (no deletion, new exercises added)
- [ ] Error handling implemented for edge cases (missing pairs, parse failures, etc.)
- [ ] Response format matches spec
- [ ] Endpoint tested with sample MIDI/MP3 file pairs
- [ ] Backend tests pass (`pnpm test:api`)
- [ ] Linting passes for Python code (`pnpm lint`)
- [ ] Integration with existing `import-page.md` UI verified (form submits correctly)
