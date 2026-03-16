# Spec: Preserve Folder Structure During Import

**Status:** Implemented
**Version:** 0.1.0
**Last updated:** 2026-03-16

---

## Problem

When musicians upload a folder containing exercises organized in subfolders, the folder structure is lost. All files arrive at the backend as a flat list, causing collisions when multiple subfolders contain files with the same name.

**Example:**
- User uploads: `Ritmos-básicos/Ejercicio1.midi` + `Ejercicio1.mp3`
- User uploads: `Ritmos-avanzados/Ejercicio1.midi` + `Ejercicio1.mp3`
- Current behavior: Both are treated as the same exercise (collision)
- Desired behavior: Exercises are stored in separate folders and remain distinct

Without preserving folder structure, users cannot organize exercises hierarchically, and exercises with identical names in different folders conflict with one another.

---

## User Stories

1. **As a musician**, I want to upload a folder with subfolders containing exercises so that my exercises remain organized by their original structure.

2. **As a musician**, I want exercises with the same name in different subfolders to be treated as separate exercises so that there are no naming conflicts.

3. **As a musician**, I want the folder structure to be preserved in the system's storage so that I can later browse and retrieve exercises by their original organization.

4. **As the system**, I want to capture the relative path of each file during upload so that folder structure can be reconstructed on disk and in the database.

5. **As the system**, I want to handle MIDI + MP3 pairing within each folder independently so that exercises are correctly detected even when identically-named files exist in different folders.

---

## Acceptance Criteria

### Frontend: Folder Upload Support

- [ ] The file input in `FileUploadZone` includes the `webkitdirectory` attribute, allowing users to select entire folders.
- [ ] When a user selects a folder via the file picker or drag & drop, the browser preserves the relative path of each file in `file.webkitRelativePath`.
- [ ] The `FileUploadZone` component captures `file.webkitRelativePath` for each selected file and stores it alongside the file object in state.
- [ ] The `ImportPage` component passes relative paths to the backend in the upload request.
- [ ] When files are uploaded, the relative path is preserved as a form field or additional metadata (e.g., `file_paths` array or custom headers).

### Frontend: Multipart Form Data with Paths

- [ ] The `POST /import` request body includes file relative paths alongside file uploads.
- [ ] The frontend implementation uses one of the following approaches:
  - **Approach A (Recommended):** Send file paths as a parallel JSON array:
    ```json
    {
      "instrument": "electronic-drums",
      "files": [File, File, File],
      "file_paths": ["Ritmos-básicos/Ejercicio1.midi", "Ritmos-básicos/Ejercicio1.mp3", "Ritmos-avanzados/Ejercicio1.midi"]
    }
    ```
  - **Approach B (Alternative):** Send paths in a custom header:
    ```
    X-File-Paths: ["Ritmos-básicos/Ejercicio1.midi", "Ritmos-básicos/Ejercicio1.mp3", ...]
    ```
  - **Approach C (Alternative):** Use `FormData` with named files:
    ```
    FormData:
      file_0: (File), file_0_path: "Ritmos-básicos/Ejercicio1.midi"
      file_1: (File), file_1_path: "Ritmos-básicos/Ejercicio1.mp3"
    ```
- [ ] The approach is documented in the `ImportPage.tsx` component for future maintainability.

### Backend: Path Normalization

- [ ] The backend receives relative paths from the frontend (e.g., `Ritmos-básicos/Ejercicio1.midi`).
- [ ] Paths are normalized using the following rules:
  - Replace spaces with hyphens: `Ritmos-básicos` (already hyphenated)
  - Convert to lowercase: `ritmos-básicos`
  - Remove leading/trailing slashes: `/ritmos-básicos/` → `ritmos-básicos`
  - Preserve nested folder structure: `folder1/subfolder2/file.midi` → `folder1/subfolder2/file.midi` (with hyphens/lowercase applied to each segment)
  - Handle Unicode characters (e.g., accents): `Ritmos-básicos` → `ritmos-basicos` (optional: transliteration for ASCII compatibility)
- [ ] Path validation prevents directory traversal attacks:
  - Reject paths containing `..` or `./`
  - Reject absolute paths
  - Ensure all paths are relative and within the instrument storage directory
- [ ] If path normalization fails, the file is skipped with an error logged; upload continues.

### Backend: Folder-Based File Pairing

- [ ] MIDI + MP3 pairing is performed **within each folder**, not globally.
- [ ] Files are paired only if they:
  - Share the same base name (e.g., `Ejercicio1`)
  - Have `.midi`/`.mid` and `.mp3` extensions
  - Are in the **same folder path**
- [ ] Example:
  ```
  Input files:
    Ritmos-básicos/Ejercicio1.midi ✓ paired with Ritmos-básicos/Ejercicio1.mp3
    Ritmos-avanzados/Ejercicio1.midi ✓ paired with Ritmos-avanzados/Ejercicio1.mp3
  Both pairs are valid and stored separately.
  ```
- [ ] Files from different folders with identical names do not interfere with pairing.
- [ ] Unpaired files in any folder are ignored (not processed, not stored).

### Backend: Storage Structure

- [ ] Audio files are saved to disk at:
  ```
  storage/<instrument>/<normalized-folder-path>/<filename>.mp3
  ```
  - `<instrument>`: uploaded instrument type (e.g., `electronic-drums`)
  - `<normalized-folder-path>`: normalized relative path (e.g., `ritmos-basicos` or `ritmos-basicos/advanced`)
  - `<filename>`: original filename with extension
- [ ] Example:
  ```
  storage/electronic-drums/ritmos-basicos/Ejercicio1.mp3
  storage/electronic-drums/ritmos-avanzados/Ejercicio1.mp3
  ```
- [ ] Folder structure on disk mirrors the uploaded folder organization.
- [ ] Folders are created as needed (no pre-existing folder structure required).

### Backend: Database Storage

- [ ] Each exercise record includes a `folder_path` column storing the normalized relative path:
  ```
  exercise:
    id: "uuid-123"
    instrument_type: "electronic-drums"
    exercise_name: "Ejercicio1"
    folder_path: "ritmos-basicos"
    audio_path: "storage/electronic-drums/ritmos-basicos/Ejercicio1.mp3"
    ...
  ```
- [ ] The `folder_path` is derived from the normalized relative path of the files.
- [ ] The unique constraint on `(instrument_type, folder_path, exercise_name)` prevents duplicates within the same folder.
- [ ] Example: Two exercises can both be named `Ejercicio1` if they are in different `folder_path` values:
  ```
  (electronic-drums, ritmos-basicos, Ejercicio1) ← allowed
  (electronic-drums, ritmos-avanzados, Ejercicio1) ← allowed (different folder)
  ```

### Backend: Re-import Behavior

- [ ] When re-uploading a folder with existing exercises, the system:
  - Does **not** delete existing files or database entries
  - Does **not** overwrite files with the same name
  - Adds new exercises if new files are detected
  - Leaves existing exercises unchanged
- [ ] Files are only updated if their content has changed (detected via file hash or modification time comparison).

### API Response

- [ ] The `POST /import` response includes `folder_path` for each imported exercise:
  ```json
  {
    "message": "Exercises imported successfully",
    "instrument": "electronic-drums",
    "imported_exercises": [
      {
        "exercise_name": "Ejercicio1",
        "folder_path": "ritmos-basicos",
        "audio_path": "storage/electronic-drums/ritmos-basicos/Ejercicio1.mp3",
        "bpm": 120,
        "total_notes": 13
      },
      {
        "exercise_name": "Ejercicio1",
        "folder_path": "ritmos-avanzados",
        "audio_path": "storage/electronic-drums/ritmos-avanzados/Ejercicio1.mp3",
        "bpm": 120,
        "total_notes": 14
      }
    ],
    "errors": []
  }
  ```
- [ ] The response clearly distinguishes exercises with the same name by including `folder_path`.

---

## Technical Notes

### Frontend Implementation

**File:** `apps/web/src/components/ImportPage.tsx` (update existing component)

1. **FileUploadZone Component Update:**
   ```tsx
   // In FileUploadZone.tsx or FileUploadZone.stories.tsx
   <input
     type="file"
     webkitdirectory  // Enable folder selection
     multiple
     onChange={handleFileChange}
   />
   ```

2. **Capture Relative Paths:**
   ```tsx
   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
     const files = Array.from(event.currentTarget.files || []);
     const filesWithPaths = files.map((file) => ({
       file,
       relativePath: file.webkitRelativePath || file.name,
     }));
     onFilesSelected(filesWithPaths);
   };
   ```

3. **Store in ImportPage State:**
   ```tsx
   interface FileWithPath {
     file: File;
     relativePath: string;
   }

   const [selectedFiles, setSelectedFiles] = useState<FileWithPath[]>([]);
   ```

4. **Include Paths in Upload Request:**
   ```tsx
   const uploadFiles = async (instrument: InstrumentType, files: FileWithPath[]) => {
     const formData = new FormData();
     formData.append('instrument', instrument);

     // Add files
     files.forEach(({ file }) => {
       formData.append('files', file);
     });

     // Add relative paths as JSON (Approach A)
     const filePaths = files.map(({ relativePath }) => relativePath);
     formData.append('file_paths', JSON.stringify(filePaths));

     const response = await fetch('/import', {
       method: 'POST',
       body: formData,
     });

     return response.json();
   };
   ```

### Backend Implementation

**File:** `apps/api/app/routes/imports.py` (update existing route)

1. **Receive and Parse Paths:**
   ```python
   from fastapi import UploadFile, Form
   import json

   @router.post("/import")
   async def import_exercises(
       instrument: str = Form(...),
       files: list[UploadFile] = File(...),
       file_paths: str = Form(default="[]"),
   ):
       relative_paths = json.loads(file_paths)
       # Pair files with their relative paths
       files_with_paths = list(zip(files, relative_paths))
   ```

2. **Normalize Paths:**
   ```python
   def normalize_folder_path(path: str) -> str:
       """
       Normalize a folder path for storage.
       - Convert to lowercase
       - Replace spaces with hyphens
       - Remove leading/trailing slashes
       - Transliterate accented characters (optional)
       """
       import unicodedata
       import re

       # Remove leading/trailing slashes
       path = path.strip("/")

       # Split by directory separator
       segments = path.split("/")

       normalized_segments = []
       for segment in segments:
           # Transliterate accented characters (e.g., á → a)
           segment = unicodedata.normalize("NFD", segment)
           segment = "".join(c for c in segment if unicodedata.category(c) != "Mn")

           # Replace spaces with hyphens and convert to lowercase
           segment = segment.replace(" ", "-").lower()

           # Remove special characters (keep alphanumeric, hyphens, underscores)
           segment = re.sub(r"[^a-z0-9\-_]", "", segment)

           normalized_segments.append(segment)

       return "/".join(normalized_segments)

   def extract_folder_path(file_relative_path: str) -> str:
       """Extract folder path (everything except filename)."""
       parts = file_relative_path.rsplit("/", 1)
       return parts[0] if len(parts) > 1 else ""
   ```

3. **Validate Paths:**
   ```python
   def validate_relative_path(path: str) -> bool:
       """Reject paths with directory traversal or absolute paths."""
       if ".." in path or path.startswith("/") or path.startswith("./"):
           return False
       return True
   ```

4. **Pair Files Within Folders:**
   ```python
   def find_pairs_in_folder(files_with_paths: list, folder_path: str) -> list:
       """Find MIDI + MP3 pairs within a specific folder."""
       folder_files = [
           (file, path) for file, path in files_with_paths
           if extract_folder_path(path) == folder_path
       ]

       pairs = []
       for file_midi, path_midi in folder_files:
           if not path_midi.lower().endswith((".midi", ".mid")):
               continue

           base_name = path_midi.rsplit(".", 1)[0]

           for file_mp3, path_mp3 in folder_files:
               if path_mp3.lower().startswith(base_name + ".mp3"):
                   pairs.append((file_midi, file_mp3, base_name, folder_path))
                   break

       return pairs
   ```

5. **Store Files with Folder Path:**
   ```python
   def save_exercise_files(
       instrument: str,
       folder_path: str,
       exercise_name: str,
       audio_file: UploadFile,
   ) -> str:
       """Save audio file to disk and return storage path."""
       normalized_folder = normalize_folder_path(folder_path)
       storage_dir = f"storage/{instrument}/{normalized_folder}"
       os.makedirs(storage_dir, exist_ok=True)

       audio_filename = f"{exercise_name}.mp3"
       audio_path = f"{storage_dir}/{audio_filename}"

       with open(audio_path, "wb") as f:
           f.write(audio_file.file.read())

       return f"storage/{instrument}/{normalized_folder}/{audio_filename}"
   ```

6. **Database Record with Folder Path:**
   ```python
   exercise = Exercise(
       instrument_type=instrument,
       exercise_name=exercise_name,
       folder_path=normalized_folder_path,
       audio_path=audio_path,
       bpm=bpm,
       total_notes=len(midi_events),
       parsed_midi_data=midi_json,
   )
   db.add(exercise)
   db.commit()
   ```

### Types

Update `@groovelab/types/src/index.ts` (if needed):

```ts
// No new types required; existing Exercise interface already supports folder_path
// But for clarity, document the expected structure in comments:

/**
 * Imported exercise from file upload.
 * Stored in database with folder organization preserved.
 */
export interface ImportedExercise extends Exercise {
  id: string;
  instrumentType: InstrumentType;
  exerciseName: string;
  folderPath: string;           // NEW: relative path within instrument storage
  audioPath: string;
  bpm: number;
  totalNotes: number;
  parsedMidiData: MidiData;
  createdAt: Date;
  updatedAt: Date;
}
```

### Database Schema Update

Update `apps/api/app/models/exercise.py`:

```python
from sqlalchemy import Column, String, Integer, JSON, DateTime, Enum, UniqueConstraint

class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    instrument_type = Column(Enum(InstrumentType), nullable=False, index=True)
    exercise_name = Column(String, nullable=False)
    folder_path = Column(String, nullable=False, default="", index=True)  # NEW
    audio_path = Column(String, nullable=False)
    bpm = Column(Integer, nullable=False)
    total_notes = Column(Integer, nullable=False)
    parsed_midi_data = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Unique constraint: prevent duplicates within same folder
    __table_args__ = (
        UniqueConstraint(
            "instrument_type", "folder_path", "exercise_name",
            name="uq_instrument_folder_exercise"
        ),
    )
```

### Browser Compatibility

- `webkitdirectory` attribute is supported in:
  - Chrome/Edge 50+
  - Firefox 50+
  - Safari 13.1+
  - Opera 37+
- `webkitRelativePath` is available in the same browsers
- Fallback: If folder selection is not supported, users can still upload individual files (no folder structure)

### Path Handling Gotchas

1. **Windows vs. macOS/Linux paths:**
   - Windows uses backslashes (`\`), others use forward slashes (`/`)
   - JavaScript's `File.webkitRelativePath` always uses forward slashes (/)
   - Backend should normalize accordingly

2. **Unicode/Accented characters:**
   - `Ritmos-básicos` should become `ritmos-basicos` (transliterated)
   - Use `unicodedata.normalize("NFD", ...)` in Python to decompose accented characters

3. **Empty folders:**
   - Empty folders are not uploaded (no files to represent them)
   - If needed, users must include at least one file per folder

---

## Out of Scope

This feature explicitly **does not include**:

- File/folder tree preview before upload
- Drag & drop of individual folders (only full folder selection via `<input type="file" webkitdirectory>`)
- Renaming or modifying folder structure before upload
- Nested subfolder depth limits (all nested structures are preserved)
- Folder deletion or re-organization after import
- Displaying full folder paths in the UI (UI shows only exercise names; folder organization is backend metadata)
- Granular permission control per folder
- Folder sharing or collaboration features
- Import history or audit logs showing which folders were uploaded
- Automatic folder merging or conflict resolution strategies beyond "preserve existing"
- Support for file formats other than `.mp3` and `.midi`/`.mid`

---

## Definition of Done

### Frontend

- [x] Spec reviewed and accepted
- [x] `FileUploadZone` component updated to use `webkitdirectory` attribute
- [x] Relative paths are captured via `file.webkitRelativePath`
- [x] `ImportPage` state stores files with their relative paths
- [x] Upload request includes relative paths (e.g., via `file_paths` form field)
- [x] Frontend tests verify:
  - Folder selection triggers file capture with paths
  - Relative paths are correctly preserved in state
  - Upload request includes both files and paths
  - Path formatting is correct in request body
- [x] No regression in existing tests

### Backend

- [x] Spec reviewed and accepted
- [x] `POST /import` endpoint updated to accept and process relative paths
- [x] Path normalization function implemented and tested
- [x] Path validation prevents directory traversal attacks
- [x] Folder-based file pairing logic implemented (pairs only within same folder)
- [x] Storage directory creation handles nested folder structures
- [x] Audio files saved to `storage/<instrument>/<normalized-folder>/<filename>`
- [x] Database schema updated with `folder_path` column and unique constraint
- [x] Duplicate detection works correctly (same name, different folders = allowed)
- [x] Re-import behavior preserves existing files and adds new ones
- [x] API response includes `folder_path` for each imported exercise
- [x] Backend tests verify:
  - Path normalization (spaces, accents, case, special chars)
  - Path validation (rejects traversal, absolute paths)
  - Folder-based pairing (exercises with same name in different folders)
  - Storage structure creation
  - Database constraints and uniqueness
  - Re-import idempotency (files preserved, new exercises added)
  - Response format includes `folder_path`
- [x] Integration test: upload folder with multiple subfolders, verify exercises are distinct and stored correctly
- [x] All backend tests pass (`pnpm test:api`)

### Integration

- [x] End-to-end test: upload folder with structure, verify:
  - Files stored in correct `storage/<instrument>/<folder>/` directory
  - Database records include correct `folder_path`
  - No collisions for exercises with same name in different folders
  - Re-upload preserves existing files
- [x] Frontend and backend integration verified (`pnpm test`)
- [x] Linting passes (`pnpm lint`)

---

## Example Workflow

**User uploads:** A folder structure like this via the file picker:

```
MyExercises/
├── Ritmos-básicos/
│   ├── Ejercicio1.midi
│   ├── Ejercicio1.mp3
│   ├── Ejercicio2.midi
│   └── Ejercicio2.mp3
├── Ritmos-avanzados/
│   ├── Ejercicio1.midi
│   ├── Ejercicio1.mp3
│   └── Ejercicio3.midi
│       └── Ejercicio3.mp3
```

**Frontend captures:**
```
[
  { file: File(Ejercicio1.midi), relativePath: "Ritmos-básicos/Ejercicio1.midi" },
  { file: File(Ejercicio1.mp3), relativePath: "Ritmos-básicos/Ejercicio1.mp3" },
  { file: File(Ejercicio2.midi), relativePath: "Ritmos-básicos/Ejercicio2.midi" },
  { file: File(Ejercicio2.mp3), relativePath: "Ritmos-básicos/Ejercicio2.mp3" },
  { file: File(Ejercicio1.midi), relativePath: "Ritmos-avanzados/Ejercicio1.midi" },
  { file: File(Ejercicio1.mp3), relativePath: "Ritmos-avanzados/Ejercicio1.mp3" },
  { file: File(Ejercicio3.midi), relativePath: "Ritmos-avanzados/Ejercicio3.midi" },
  { file: File(Ejercicio3.mp3), relativePath: "Ritmos-avanzados/Ejercicio3.mp3" },
]
```

**Backend processes:**
- Normalizes paths: `Ritmos-básicos` → `ritmos-basicos`, `Ritmos-avanzados` → `ritmos-avanzados`
- Pairs files within each folder
- Stores files:
  ```
  storage/electronic-drums/ritmos-basicos/Ejercicio1.mp3
  storage/electronic-drums/ritmos-basicos/Ejercicio2.mp3
  storage/electronic-drums/ritmos-avanzados/Ejercicio1.mp3
  storage/electronic-drums/ritmos-avanzados/Ejercicio3.mp3
  ```
- Creates database records:
  ```
  (electronic-drums, ritmos-basicos, Ejercicio1)
  (electronic-drums, ritmos-basicos, Ejercicio2)
  (electronic-drums, ritmos-avanzados, Ejercicio1)  ← Different folder, allowed
  (electronic-drums, ritmos-avanzados, Ejercicio3)
  ```

**Result:** Four distinct exercises, with no naming conflicts.

