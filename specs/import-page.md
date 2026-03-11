# Spec: Import Page

**Status:** In Progress
**Version:** 0.1.0
**Last updated:** 2026-03-11

---

## Problem

Musicians using GrooveLab need a way to upload files into the system so they can import practice content, exercises, or MIDI files. Currently, there is no UI entry point for this action.

Without an import page, users have no way to bring their own content into the application, limiting the practice-first experience to pre-loaded exercises only.

---

## User Stories

1. **As a musician**, I want to access a dedicated import page (`/import`) so that I have a clear entry point to upload files.

2. **As a musician**, I want to select my instrument before uploading so that the system knows which instrument the imported content is for.

3. **As a musician**, I want to upload files via drag & drop so that I can quickly import content with minimal clicks.

4. **As a musician**, I want to upload files via a file selection button so that I have a standard file picker fallback.

5. **As a musician**, I want both upload methods to be visually integrated so that I understand they are part of the same upload action.

---

## Acceptance Criteria

### Page Navigation

- [x] The page is accessible at the route `/import`.
- [x] The page renders without errors within the existing GrooveLab layout.
- [x] The page title or heading clearly indicates this is the import page.

### Instrument Selector

- [x] An instrument selector is visible at the top of the page.
- [x] The selector uses a **tab-based interface** (same pattern as `ExerciseBrowser`).
- [x] The tabs show the three instrument options: **Drums**, **Bass**, **Guitar**.
- [x] The tabs reflect the `InstrumentType` values: `'electronic-drums'`, `'bass-guitar'`, `'guitar'`.
- [x] One instrument is always selected; no state exists where selection is empty.
- [x] **Drums** (`electronic-drums`) is the default selected instrument on page load.
- [x] Clicking a different instrument tab updates the selection visually without a page reload.
- [x] The instrument selector uses `role="tablist"` and each tab uses `role="tab"` with `aria-selected` reflecting the current selection.

### File Upload Area

- [x] A file upload component is displayed below the instrument selector.
- [x] The upload component includes a **drag & drop zone** with clear visual feedback (e.g., border, background color, or text indicating where to drag files).
- [x] The upload component includes a **"Select Files" button** that opens a standard file picker dialog.
- [x] Both the drag & drop zone and the button are visually integrated as part of the same upload interface.
- [x] Hovering over the drag & drop zone shows visual feedback (e.g., change in border color, background, or opacity).
- [x] The upload component displays instructional text guiding the user to drag & drop or click to select files.

### Design & Consistency

- [ ] The page design follows the visual style and layout patterns of other GrooveLab pages (e.g., homepage, exercise browser).
- [ ] The instrument selector tabs match the style and behavior of tabs used in the `ExerciseBrowser` component.
- [ ] The file upload component uses existing UI library components (buttons, cards, etc.) wherever possible.
- [ ] The page is responsive and renders correctly on viewport widths from 320 px to 1440 px.

### Accessibility

- [x] The instrument selector is keyboard-navigable using Arrow Left/Right keys (WAI-ARIA Tabs pattern).
- [x] The file upload area is focusable and interactive via keyboard.
- [ ] Tab key moves focus through the page in a logical order.
- [x] ARIA labels and descriptions adequately describe the purpose of the upload area.

---

## Technical Notes

### File Upload State (Client-Side Only)

For this iteration, the upload component should:
- Accept file selection from the user (via drag & drop or file picker).
- Display the selected file(s) in the UI (e.g., filename, file count).
- **Not** make any API calls or submit files to the backend.
- **Not** validate file types, sizes, or contents.
- **Not** persist data or trigger any processing.

This is purely UI scaffolding. File handling and backend integration will be addressed in future specs.

### Types

Use existing types from `@groovelab/types`:

```ts
export type InstrumentType = 'electronic-drums' | 'bass-guitar' | 'guitar';
```

### Components

Reuse existing UI components from `@groovelab/ui`:

- `Tabs` (molecules) — for the instrument selector.
- `Button` (atoms) — for the file selection button.
- `Card` (molecules) — for layout/container structure if needed.

Create a new component if necessary:

- `FileUploadZone` (organism) — combines drag & drop zone and file selection button. Should live in `packages/ui/src/components/organisms/FileUploadZone/`.

### Page Implementation

- **File:** `apps/web/src/pages/import.astro` (or `.tsx`)
- Import and mount the instrument selector (can reuse or adapt the `Tabs` component).
- Mount the file upload component.
- Manage instrument selection state using a React island with `client:load` directive.
- No server-side data fetching is required.

### Mock Data

No mock data required for this iteration. The page displays a static form.

### Assumptions

- The `/import` route does not require authentication or authorization checks at this stage.
- File uploads will not actually be processed or sent to any backend service in this iteration.
- Instrument labels ("Drums", "Bass", "Guitar") are presentation strings matching those used elsewhere in the app.

---

## Out of Scope

This feature explicitly **does not include**:

- File processing or validation (MIME type checking, file size limits, etc.)
- Backend API integration or file upload submission
- Data persistence or storage
- Integration with external services
- Audio or MIDI playback of imported files
- Progress indicators or upload status tracking
- Error handling for failed uploads
- File format conversion or transformation
- User authentication or authorization
- Recording or analytics on file imports

---

## Definition of Done

- [ ] Spec reviewed and accepted
- [x] `apps/web/src/pages/import.astro` (or `.tsx`) created
- [x] Instrument selector (tabs) implemented and functional
- [x] File upload area created with drag & drop and file picker button
- [x] Page renders correctly within the GrooveLab layout
- [x] Instrument selection updates without page reload
- [ ] Visual styling matches the rest of the application
- [x] Page is keyboard-accessible end-to-end
- [ ] Responsive design verified on multiple viewport sizes (320px–1440px)
- [x] All tests pass (`pnpm test`)
- [ ] Linting passes (`pnpm lint`)
- [x] No regressions in existing tests
