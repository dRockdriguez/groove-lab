# Spec: Import Frontend Integration

**Status:** Implemented
**Version:** 0.1.0
**Last updated:** 2026-03-11

---

## Problem

The import page (`/import`) has a working UI with instrument selection and file upload components, and the backend has a `POST /import` endpoint that processes exercises. However, the frontend does not yet submit files to the backend—the upload area accepts files but takes no action.

Musicians cannot actually import exercises into the system because the frontend and backend are disconnected. The import feature is non-functional end-to-end.

---

## User Stories

1. **As a musician**, I want to drag and drop files into the import page and have them uploaded to the system so that my exercises are processed and stored.

2. **As a musician**, I want to select files via the file picker button and have them uploaded automatically so that I can import exercises without manually managing the submission.

3. **As a musician**, I want the selected instrument to be included in the upload request so that my exercises are associated with the correct instrument.

4. **As a musician**, I want to see a success message when my exercises are uploaded so that I know the import completed.

5. **As a musician**, I want to see an error message if something goes wrong during upload so that I understand what happened and can retry if necessary.

---

## Acceptance Criteria

### File Collection

- [ ] When the user selects files via drag & drop or the file picker, the frontend stores those files in component state.
- [ ] The component tracks the selected files and displays a count or list of filenames.
- [ ] Multiple files can be selected and held in state simultaneously.

### Instrument Association

- [ ] The currently selected instrument tab is captured and included in the upload submission.
- [ ] The instrument value matches one of the valid `InstrumentType` values: `'electronic-drums'`, `'bass-guitar'`, or `'guitar'`.
- [ ] The instrument selection cannot be empty when submitting; it defaults to `'electronic-drums'` on page load.

### API Submission

- [ ] When files are selected, an upload button becomes visible (or is enabled).
- [ ] Clicking the upload button triggers a `POST /import` request to the backend.
- [ ] The request uses `multipart/form-data` encoding.
- [ ] The request includes:
  - `instrument` (form field): the selected instrument type
  - `files` (form field): all selected files
- [ ] The request is sent to the correct API endpoint (`/import`).

### Success Response Handling

- [ ] When the backend responds with `200 OK`, the frontend displays a success message.
- [ ] The success message includes:
  - Confirmation that exercises were imported
  - The count of imported exercises (if available from the response)
  - The selected instrument name
- [ ] After a successful upload, the file list and upload state are cleared, allowing the user to upload again.
- [ ] The success message is user-friendly and dismissible (e.g., via a close button or auto-dismiss after a few seconds).

### Error Response Handling

- [ ] If the backend responds with an error (4xx or 5xx status), the frontend displays an error message.
- [ ] The error message includes:
  - A general explanation (e.g., "Upload failed")
  - Backend error details from the response, if available
- [ ] The error message is user-friendly and clear.
- [ ] Files and state are **not** cleared after an error, allowing the user to retry without re-selecting files.
- [ ] The user can retry the upload without refreshing the page.

### Network and Validation

- [ ] The upload button is disabled while a request is in flight (prevents duplicate submissions).
- [ ] A loading indicator (spinner, disabled button text, or similar) shows the user that the upload is in progress.
- [ ] If no files are selected, the upload button is disabled.
- [ ] If the request times out or the network is unavailable, a timeout error is displayed to the user.
- [ ] Basic validation occurs before submission:
  - At least one file must be selected
  - An instrument must be selected (always true by default, but validated)

---

## Technical Notes

### Frontend Implementation

**File:** `apps/web/src/components/ImportPage.tsx` (existing component)

The `ImportPage` component should:

1. **State Management:**
   - `selectedFiles: File[]` — array of selected files from FileUploadZone
   - `selectedInstrument: InstrumentType` — current instrument tab selection
   - `isUploading: boolean` — whether a request is in flight
   - `uploadStatus: 'idle' | 'success' | 'error'` — current submission status
   - `uploadMessage: string` — user-facing message (success or error)
   - `uploadError: string | null` — detailed error information from backend

2. **Event Handlers:**
   - `handleFilesSelected(files: File[])` — called by `FileUploadZone` when files are added
   - `handleInstrumentChange(instrument: InstrumentType)` — called by instrument selector tabs
   - `handleUpload()` — called by upload button; sends files to `/import` endpoint

3. **API Call:**
   ```typescript
   async function uploadFiles(
     instrument: InstrumentType,
     files: File[]
   ): Promise<UploadResponse> {
     const formData = new FormData();
     formData.append('instrument', instrument);
     files.forEach((file) => {
       formData.append('files', file);
     });

     const response = await fetch('/import', {
       method: 'POST',
       body: formData,
       // Note: do NOT set Content-Type header; browser will set it automatically
     });

     if (!response.ok) {
       throw new Error(`Upload failed: ${response.statusText}`);
     }

     return response.json();
   }
   ```

4. **Response Handling:**
   - Parse the backend response structure from `exercise-import-backend.md`
   - Extract `imported_exercises` count and display in success message
   - Handle error responses by reading the `errors` array or error message from the backend

5. **UI Updates:**
   - Show/hide upload button based on file selection state
   - Disable upload button while `isUploading` is true
   - Display loading indicator during upload
   - Show success/error message in a toast, modal, or inline alert component
   - Clear files and state after successful upload
   - Preserve files and state after failed upload

### Backend Assumptions

- The `POST /import` endpoint exists and is implemented per `exercise-import-backend.md`
- The endpoint returns a JSON response with at least:
  ```json
  {
    "message": "Exercises imported successfully",
    "imported_exercises": [
      {
        "exercise_name": "...",
        "bpm": 120,
        ...
      }
    ],
    "errors": []
  }
  ```
- Error responses include meaningful error messages that can be displayed to users

### API URL

- The endpoint is accessible at `/import` (relative to the frontend domain)
- The frontend runs on `http://localhost:4321`
- The backend API is at `http://localhost:8000`
- A proxy or CORS configuration must be in place to allow frontend → backend requests

**Note:** If CORS headers or proxy configuration is needed, that will be handled separately in deployment/dev setup.

### Types

Use existing types from `@groovelab/types`:

```ts
export type InstrumentType = 'electronic-drums' | 'bass-guitar' | 'guitar';
```

Define a local type for the upload response (or reference from backend if types are shared):

```ts
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
```

### UI Components

Reuse existing components from `@groovelab/ui` and `ImportPage`:

- `Tabs` — instrument selector (already implemented in `ImportPage`)
- `FileUploadZone` — file upload area with drag & drop (already implemented in `ImportPage`)
- `Button` — upload submission button (create if not present)
- Message/Alert component — for success and error feedback (create or use existing if available)

### Error Messages

**Success Message Example:**
```
✓ Success! 2 exercises imported for Drums.
```

**Error Message Examples:**
```
✗ Upload failed: Invalid instrument type.
```

```
✗ Upload failed: No valid exercise pairs found. Make sure to upload .mp3 and .midi file pairs.
```

```
✗ Network error: Unable to reach the server. Please check your connection and try again.
```

### Assumptions

- The frontend and backend are running on the same machine during development (localhost on different ports)
- CORS or a dev proxy is configured to allow cross-origin requests
- File selection state persists as long as the user doesn't manually clear it or refresh the page
- Users have modern browsers with `FormData` and `fetch` support

---

## Out of Scope

This feature explicitly **does not include**:

- File validation (size, type, count limits) — handled by backend
- Progress tracking or upload chunking for large files
- Retry logic or automatic retry on failure
- Drag & drop folder structure preservation (files are flattened in the upload)
- Concurrent multiple uploads
- File preview or thumbnail generation
- Batch editing or renaming files before upload
- Exercise browsing or import history
- Persistent storage of upload state across page refreshes
- Analytics or logging of import events
- Internationalization (all messages in English for now)
- Accessibility testing beyond WCAG basic standards (keyboard nav, ARIA labels already in place from `import-page.md`)

---

## Definition of Done

- [ ] Spec reviewed and accepted
- [ ] `ImportPage.tsx` component updated with file upload state management
- [ ] Upload button added and conditionally rendered (disabled when no files selected)
- [ ] `handleFilesSelected()` event handler implemented to receive files from `FileUploadZone`
- [ ] `handleInstrumentChange()` event handler implemented to track selected instrument
- [ ] `uploadFiles()` function implemented to send `POST /import` request with multipart form data
- [ ] Success response handling implemented (parse response, show message, clear state)
- [ ] Error response handling implemented (display error message, preserve state)
- [ ] Network error handling implemented (timeout, connection errors)
- [ ] Loading state and disabled button state during upload
- [ ] UI feedback (toast, modal, or inline alert) for success/error messages
- [ ] All files passed to backend in correct `multipart/form-data` format
- [ ] Instrument parameter validated before submission
- [ ] No files selected: upload button is disabled
- [ ] Successful upload clears file list and state for next upload
- [ ] Failed upload preserves file list and allows retry
- [ ] Backend `/import` endpoint is running and responding
- [ ] End-to-end test: upload valid MIDI + MP3 pair and verify exercises appear in backend
- [ ] All frontend tests pass (`pnpm test`)
- [ ] Linting passes (`pnpm lint`)
- [ ] No regressions in existing tests or components
