# Spec: Drum Exercise Playback with Real-Time MIDI Detection

**Status:** Draft
**Version:** 0.1.0
**Last updated:** 2026-03-16

---

## Problem

Musicians practicing drums need to see what they're supposed to play and receive feedback on whether they're hitting the right notes at the right time. Currently, users can browse and import exercises, but selecting an exercise does not lead anywhere—there is no playback experience.

Without a playback page, imported and pre-loaded exercises are unusable. Musicians cannot practice against their exercises, and the application fails its core mission as a practice-first tool.

---

## User Stories

1. **As a drummer**, I want to select an exercise from the exercise browser and see the exercise playback page so that I have a clear visual representation of what to play.

2. **As a drummer**, I want to play and pause the exercise audio so that I can control when the backing track plays and practice at my own pace.

3. **As a drummer**, I want to see a visual timeline showing when each drum element (kick, snare, hi-hat, etc.) should be played so that I know exactly what to play and when.

4. **As a drummer**, I want to see multiple tracks on the timeline, one for each drum element, so that I understand the complexity and structure of the exercise.

5. **As a drummer**, I want my MIDI drum kit to be automatically detected when connected so that I can start practicing immediately without manual configuration.

6. **As a drummer**, I want to hear audio playback synchronized with the visual timeline so that I can play along with the exercise.

7. **As a drummer**, I want real-time feedback on whether I'm hitting the correct notes and velocities so that I can identify mistakes and improve my technique.

8. **As a drummer**, I want to see a mini timeline overview showing my position within the full exercise so that I can navigate and understand the exercise structure at a glance.

9. **As the system**, I want to capture MIDI input from a connected drum kit in real-time so that I can validate player input against the exercise requirements.

10. **As the system**, I want to parse and display MIDI note events on a visual timeline so that the exercise structure is clear and navigable.

---

## Acceptance Criteria

### Page Navigation & Display

- [ ] The playback page is accessible at the route `/practice/<instrumentType>/<exerciseId>` (e.g., `/practice/electronic-drums/drums-basic-1`).
- [ ] Clicking an exercise in the exercise browser navigates to the playback page.
- [ ] The page renders within the existing GrooveLab layout (with header, footer, etc.).
- [ ] The page displays the exercise title prominently.
- [ ] The page displays the exercise BPM and total duration.
- [ ] The page is responsive and renders correctly on viewport widths from 320 px to 1440 px.

### Exercise Data & Audio Loading

- [ ] The page fetches exercise data from `GET /exercises/<exerciseId>` or similar API endpoint.
- [ ] The exercise data includes:
  - Exercise title and description
  - BPM (beats per minute)
  - Total duration (calculated from audio file)
  - Parsed MIDI data (note events with timestamps)
  - Audio file path (MP3 URL)
- [ ] The audio file (MP3) is loaded asynchronously without blocking the UI.
- [ ] If the audio file fails to load, an error message is displayed: "Could not load audio file. Please try again later."
- [ ] If exercise data cannot be fetched (404, 5xx, network error), an error message is displayed with a retry button.
- [ ] Loading states (spinners, skeleton screens, or messages) are shown while data is being fetched.

### Playback Controls

- [ ] A **Play/Pause button** is prominently displayed.
- [ ] Clicking the Play button starts audio playback and begins the real-time MIDI detection.
- [ ] Clicking the Pause button pauses audio playback and pauses MIDI event detection.
- [ ] Clicking Play again resumes from the paused position (does not restart from the beginning).
- [ ] A **Seek slider** or timeline scrubber allows the user to drag to a specific position in the exercise.
- [ ] Dragging the seek slider pauses audio playback, updates the timeline position, and resumes playback when the drag is released (or continues paused if Play is not clicked).
- [ ] A **Current Time / Total Duration** display shows the current playback position and total exercise length in `mm:ss` format.
- [ ] The Play button text or icon changes to indicate playback state (e.g., "Play" or "Pause").
- [ ] All playback controls are keyboard-accessible (Tab, Enter/Space to toggle play/pause, Arrow keys to seek).

### Timeline & Track Display

- [ ] A **main timeline view** displays the exercise structure as horizontal tracks.
- [ ] One **track** is displayed for each unique drum element (e.g., kick, snare, hi-hat, tom).
- [ ] Drum elements are identified from the MIDI data by their note numbers and mapped using `GM_DRUM_MAP` utility.
- [ ] Each track displays:
  - A **label** with the drum element name (e.g., "Kick Drum", "Snare Drum", "Closed Hi-Hat")
  - **Note markers** (rectangles or bars) positioned horizontally to represent when the note should be played
  - Markers are positioned by their timestamp relative to the total exercise duration
- [ ] Note markers show:
  - The exact timestamp (or start time) of each note
  - Visual representation of note velocity (e.g., height, opacity, or color intensity)
  - Optionally, the expected velocity as a visual indicator
- [ ] Tracks are stacked vertically and remain visible as the user scrolls horizontally through the timeline.
- [ ] The timeline is **scrollable horizontally** if the exercise duration is very long.
- [ ] Tracks are **scrollable vertically** if there are many drum elements and they don't fit on screen.
- [ ] A **vertical playback cursor** (playhead) moves across the timeline during playback, indicating the current playback position.
- [ ] The playhead updates in real-time and stays synchronized with audio playback (within 50 ms).

### Mini Timeline Overview

- [ ] A **mini timeline** or overview is displayed (e.g., at the top or side of the main timeline).
- [ ] The mini timeline shows the entire exercise duration in a condensed form.
- [ ] The mini timeline displays a visual representation of where notes occur across the full exercise.
- [ ] A **miniature playhead** or viewport indicator shows the current playback position and the visible portion of the main timeline.
- [ ] Clicking on the mini timeline seeks the playback to that position.
- [ ] The mini timeline is color-coded or visually distinct for different drum elements (optional, but recommended for clarity).

### MIDI Input Detection

- [ ] The application attempts to detect connected MIDI input devices on page load.
- [ ] A **MIDI device status indicator** shows whether a MIDI drum kit is connected.
- [ ] If no MIDI device is connected, the indicator displays a message: "No MIDI drum kit detected. Connect a drum kit to enable real-time validation."
- [ ] If a MIDI device is detected, the indicator displays: "MIDI drum kit connected" with a visual indicator (e.g., green dot).
- [ ] When the Play button is clicked, the application subscribes to incoming MIDI events from the connected device.
- [ ] While paused or before pressing Play, MIDI events are not captured or processed.
- [ ] The application gracefully handles:
  - MIDI device disconnection during playback (error message, pause playback)
  - Device reconnection (allow resume or restart)
  - Permission denial for MIDI access (display a message explaining how to grant permissions)

### Real-Time MIDI Validation & Feedback

- [ ] While the exercise is playing, incoming MIDI **Note On** events from the connected drum kit are captured.
- [ ] Each captured MIDI event is compared against the expected MIDI events in the exercise:
  - Check if the note number matches an expected note
  - Check if the timing is within a tolerance window (default: ±100 ms)
  - Check if the velocity is within an acceptable range (default: ±25% of expected velocity)
- [ ] A **feedback indicator** displays on each track showing:
  - **Hit**: The player hit the correct note at approximately the correct time with acceptable velocity (green or checkmark).
  - **Miss**: The expected note was not hit by the player (red or X).
  - **Wrong Note**: The player hit a different note than expected (orange or warning color).
  - **Early**: The player hit the note before the expected time (outside tolerance window).
  - **Late**: The player hit the note after the expected time (outside tolerance window).
  - **Weak**: The player hit the correct note at the correct time but with insufficient velocity (yellow or warning).
  - **Strong**: The player hit the correct note at the correct time but with excessive velocity (yellow or warning).
- [ ] Feedback indicators appear **on the timeline** next to each expected note marker as they occur.
- [ ] A **summary statistics panel** displays (e.g., at the bottom or side):
  - **Accuracy**: Percentage of notes hit correctly (correct note, timing, velocity within tolerance)
  - **Timing Offset**: Average deviation in milliseconds from expected timing
  - **Hit Count**: Number of notes successfully hit vs. total expected notes
  - **Strike Violations**: Count of notes hit with incorrect timing or velocity
- [ ] The statistics update in real-time as the user plays.
- [ ] After the exercise finishes playing, the feedback summary remains visible and can be used to assess performance.

### Edge Cases & Error Handling

- [ ] If the MIDI parser encounters an unparseable MIDI event, the event is skipped and processing continues.
- [ ] If audio playback encounters an error, it is paused and an error message is displayed.
- [ ] If the user navigates away from the page during playback, audio playback is stopped and MIDI listeners are cleaned up.
- [ ] If the page is refreshed or the browser tab loses focus, playback is paused.
- [ ] If the exercise has no MIDI data (empty file), a message is displayed: "This exercise contains no note data."
- [ ] If the exercise has no audio file, a message is displayed: "This exercise does not have audio."
- [ ] The page handles slow network or large exercises gracefully with appropriate loading messages.

### Accessibility

- [ ] All playback controls are keyboard-accessible:
  - Tab: Focus on interactive elements in logical order
  - Enter/Space: Toggle play/pause on the Play button
  - Arrow Left/Right: Seek backward/forward in 5-second increments
  - Home/End: Jump to start/end of exercise
- [ ] All interactive elements have descriptive `aria-label` attributes.
- [ ] The timeline and feedback indicators convey information not just through color (also text labels, icons, or shapes).
- [ ] The page uses semantic HTML (`<button>`, `<input type="range">`, etc.).
- [ ] Status messages and feedback are announced via `aria-live` regions for screen readers.
- [ ] MIDI connection status is announced when it changes.

### Design & Consistency

- [ ] The page design follows the visual style and layout patterns of other GrooveLab pages.
- [ ] Colors for feedback states (hit, miss, wrong note, early, late, weak, strong) are consistent and accessible (WCAG AA contrast minimum).
- [ ] Drum element labels use the humanized names from the `GM_DRUM_MAP` utility (e.g., "Kick Drum" instead of "note 36").
- [ ] The page is responsive and maintains usability on small screens (timeline may require horizontal scrolling).
- [ ] The layout prioritizes the timeline display; controls are secondary.

---

## Technical Notes

### Types

Use and extend existing types from `@groovelab/types`:

```ts
export interface Exercise {
  id: string;
  title: string;
  description: string;
}

export interface MidiEvent {
  timestamp: number;     // ms from start
  note: number;          // 0–127
  velocity: number;      // 0–127
  channel: number;       // 1–16
  type: MidiEventType;   // 'noteOn' | 'noteOff' | 'controlChange'
}

export interface PracticeSession {
  id: string;
  instrumentId: string;
  startedAt: Date;
  endedAt?: Date;
  bpm: number;
  events: MidiEvent[];
}

export interface TimingFeedback {
  sessionId: string;
  averageDeviation: number;
  accuracy: number;
  suggestions: string[];
}
```

Define new types for exercise playback (add to `packages/types/src/index.ts`):

```ts
/** Represents playback state */
export type PlaybackState = 'stopped' | 'playing' | 'paused';

/** Exercise with full playback data */
export interface ExercisePlaybackData extends Exercise {
  bpm: number;
  durationMs: number;
  audioUrl: string;
  midiEvents: MidiEvent[];
  instrumentType: InstrumentType;
}

/** Feedback for a single MIDI event capture */
export type FeedbackType = 'hit' | 'miss' | 'wrongNote' | 'early' | 'late' | 'weak' | 'strong';

export interface NoteFeedback {
  expectedEvent: MidiEvent;
  capturedEvent?: MidiEvent;
  feedbackType: FeedbackType;
  deviationMs?: number;
  velocityDifference?: number;
  timestamp: number; // when feedback was generated
}

/** Summary statistics for a practice session */
export interface SessionStatistics {
  accuracy: number;           // 0–100 percentage
  hitCount: number;
  expectedNoteCount: number;
  averageTimingOffsetMs: number;
  strikeViolationCount: number;
}
```

### Utilities

Use existing utilities from `@groovelab/utils`:

- `GM_DRUM_MAP`: Map MIDI note numbers to drum pad names
- `getDrumName(note)`: Look up pad names for display
- `isValidVelocity(velocity)`: Validate MIDI velocity
- `isValidNote(note)`: Validate MIDI note number
- `bpmToInterval(bpm)`: Calculate beat interval from BPM
- `formatDuration(ms)`: Format milliseconds to `mm:ss`

### Component Locations

Create new components in `packages/ui/src/components/`:

- **Atoms:**
  - `PlaybackButton.tsx` — Play/Pause button
  - `MidiStatusIndicator.tsx` — Shows MIDI connection status
  - `FeedbackBadge.tsx` — Visual indicator for a single note feedback

- **Molecules:**
  - `PlaybackControls.tsx` — Combines PlaybackButton, seek slider, duration display
  - `MiniTimeline.tsx` — Overview of exercise structure with playhead
  - `TrackLabel.tsx` — Drum element name with styling

- **Organisms:**
  - `ExercisePlaybackTimeline.tsx` — Main timeline view with all tracks and real-time playhead
  - `SessionStatisticsPanel.tsx` — Displays accuracy, hit count, timing offset, etc.
  - `ExercisePlaybackPage.tsx` — Full page organism combining all elements

### Page Implementation

- **File:** `apps/web/src/pages/practice/[instrumentType]/[exerciseId].astro`
- The page:
  - Extracts `instrumentType` and `exerciseId` from URL parameters
  - Fetches exercise data from the API (see below)
  - Mounts the `ExercisePlaybackPage` organism as a React island with `client:load`
  - Handles 404 (exercise not found) with an appropriate error page
- **Alternative:** Use dynamic routing with `[...all].tsx` if Astro's file-based routing is complex

### API Endpoints (Backend)

Define or extend the following endpoints in `apps/api`:

```
GET /exercises/<exerciseId>
  Description: Fetch a single exercise with full playback data
  Response 200:
  {
    "id": "drums-basic-1",
    "title": "Ejercicio 1",
    "description": "Patrón básico de batería",
    "bpm": 120,
    "durationMs": 16000,
    "audioUrl": "/storage/electronic-drums/drums-basic-rhythms/Ejercicio1.mp3",
    "midiEvents": [
      {
        "timestamp": 0,
        "note": 36,
        "velocity": 100,
        "channel": 1,
        "type": "noteOn"
      },
      ...
    ],
    "instrumentType": "electronic-drums"
  }

  Response 404:
  {
    "error": "Exercise not found"
  }

  Response 500:
  {
    "error": "Failed to load exercise data"
  }
```

### MIDI Input (Web MIDI API)

- Use the **Web MIDI API** (`navigator.requestMIDIAccess()`) to detect and connect to MIDI devices.
- Request permission on page load; handle denial gracefully.
- Subscribe to `noteOn` events from the device's input ports.
- Filter events by MIDI channel if necessary (optional for drummers, as all pads may be on one channel).
- Do **not** process MIDI events while playback is paused or stopped.

### Audio Playback

- Use the **Web Audio API** (`AudioContext`, `Audio` element, or a library like `Tone.js`) for synchronized audio playback.
- Load the MP3 file asynchronously and cache in memory or use streaming.
- Sync the playhead position with `currentTime` from the audio playback object.
- Update the playhead in real-time (at least 60 fps or on `timeupdate` events).

### Timeline Rendering & Scrolling

- Use **CSS Grid or Flexbox** for layout of tracks.
- Use **Canvas** or **SVG** for rendering the timeline and note markers (for performance and precision).
- Alternatively, use **React Timeline libraries** like `react-gantt-chart` or a custom component.
- Implement:
  - Horizontal scrolling for long exercises
  - Vertical scrolling for many drum elements
  - Zoom in/out functionality (optional, not required for MVP)
  - Responsive layout that adapts to viewport width

### Real-Time Feedback Calculation

Implement logic to:
1. Capture incoming MIDI Note On events from the connected device
2. For each captured event, find the closest expected event within a time window (±100 ms)
3. Classify the event:
   - If no expected event nearby → "miss" (expected) or extra note (ignore)
   - If expected event found:
     - Compare note number: if different → "wrongNote"
     - Compare timing: if before expected → "early"; if after → "late"; if within ±100 ms → on time
     - Compare velocity: if within ±25% of expected → acceptable; if below → "weak"; if above → "strong"
4. Assign `FeedbackType` based on the above logic
5. Update statistics in real-time
6. Display feedback on the timeline

### Constants & Configuration

Define in the component or a config file:

```ts
// Timing tolerance in milliseconds
const TIMING_TOLERANCE_MS = 100;

// Velocity tolerance as a percentage (0–100)
const VELOCITY_TOLERANCE_PERCENT = 25;

// Timeline seek increment (keyboard arrow keys)
const SEEK_INCREMENT_MS = 5000;
```

### Error Handling

- **MIDI Access Denied:** Display message "MIDI access denied. Enable permissions in your browser settings."
- **MIDI Device Disconnected:** Pause playback, show alert "MIDI drum kit disconnected. Please reconnect to continue."
- **Audio Load Failed:** Display "Could not load audio file. Please check your connection and try again."
- **Exercise Data Fetch Failed:** Display error with retry button.
- **Network Errors:** Use exponential backoff for retries.
- **Audio Playback Errors:** Handle gracefully with user-facing messages.

### Assumptions

- Exercises are pre-loaded with parsed MIDI data (from the import process).
- Audio files are stored at URLs accessible from the frontend.
- MIDI devices connected to the system are accessible via Web MIDI API.
- Users grant permission for MIDI access when prompted.
- Exercise BPM and timing are accurate in the database.
- The browser supports Web Audio API and Web MIDI API (Chrome, Edge, Firefox with extensions).
- No two notes in an exercise occur at exactly the same timestamp (or collisions are handled deterministically).

---

## Out of Scope

This feature explicitly **does not include**:

- **MIDI Output / Sound Synthesis:** This feature does not generate or synthesize drum sounds; it only plays back the pre-recorded MP3 audio.
- **Recording Practice Sessions:** Recording user input or exporting performance data is not included; statistics are displayed live only.
- **Performance Persistence:** Session statistics are not saved to a database or user account.
- **Leaderboards or Scoring:** No ranking, points, or comparison with other users.
- **Instructor Mode:** No ability to adjust exercise difficulty, tempo, or timing tolerance mid-playback.
- **Metronome or Click Track:** No separate click track or visual beat indicator; the exercise audio contains the backing track.
- **Audio Mixing or Effects:** No EQ, reverb, compression, or other audio effects.
- **Video Tutorials or Instructions:** No video content or step-by-step guides.
- **Export or Sharing:** No ability to export performance or share with others.
- **Multi-Instrument Support (in this spec):** This spec focuses on drums; bass and guitar playback are out of scope.
- **Advanced Timeline Features:** No zoom, pan, grid snapping, or marquee selection (these may be added in future iterations).
- **Tempo Adjustment:** No ability to slow down or speed up the exercise during playback (uses recorded BPM only).
- **Audio Visualization:** No waveform display or frequency analyzer.
- **MIDI Output to External Devices:** One-way MIDI input only; no sending MIDI to drum kit modules or synthesizers.
- **Cross-Browser Support for Safari:** Web MIDI API is not yet standardized in Safari; this feature requires Chrome, Edge, or Firefox.

---

## Definition of Done

### Planning & Spec Review
- [ ] Spec reviewed and accepted by team
- [ ] Existing API endpoints for exercise data verified or created
- [ ] Type definitions added to `packages/types/src/index.ts`
- [ ] New component structure planned in `packages/ui`

### Frontend Implementation
- [ ] Page route created: `apps/web/src/pages/practice/[instrumentType]/[exerciseId].astro`
- [ ] All atoms and molecules implemented in `packages/ui`
- [ ] `ExercisePlaybackPage` organism implemented
- [ ] Exercise data fetching from API implemented with loading, error, and success states
- [ ] Audio playback controls implemented and tested
- [ ] Timeline view renders all drum elements and note markers
- [ ] Mini timeline overview displays and allows seeking
- [ ] Playhead cursor moves in sync with audio playback
- [ ] Responsive layout verified on 320px, 768px, 1440px viewport widths

### MIDI Integration
- [ ] Web MIDI API integration implemented
- [ ] MIDI device detection and permission handling working
- [ ] MIDI connection status indicator displays correctly
- [ ] MIDI Note On events captured during playback

### Real-Time Feedback
- [ ] Feedback calculation logic implemented (hit/miss/wrong/early/late/weak/strong)
- [ ] Feedback indicators displayed on timeline in real-time
- [ ] Session statistics panel updates in real-time
- [ ] Final statistics displayed after exercise completion

### Testing
- [ ] Component tests written for all UI components (atoms, molecules, organisms)
- [ ] Timeline rendering tests (note markers positioned correctly)
- [ ] Audio playback tests (play, pause, seek behavior)
- [ ] MIDI detection and event capture tests (mock MIDI input)
- [ ] Real-time feedback calculation tests
- [ ] Edge case tests (missing audio, no MIDI, network errors, etc.)
- [ ] Accessibility tests (keyboard navigation, ARIA labels, focus management)
- [ ] All tests pass: `pnpm test`

### Backend (if required)
- [ ] `GET /exercises/<exerciseId>` endpoint returns correct response format
- [ ] MIDI data is correctly parsed and included in response
- [ ] Audio file URLs are correct and accessible
- [ ] Backend tests pass: `pnpm test:api`

### Final Verification
- [ ] Page loads and displays exercise data correctly
- [ ] Audio playback synchronizes with visual timeline
- [ ] MIDI feedback validates player input and displays feedback in real-time
- [ ] All acceptance criteria are met
- [ ] Linting passes: `pnpm lint`
- [ ] No regressions in existing tests
- [ ] Page renders correctly on desktop, tablet, and mobile viewports
- [ ] Error states are handled gracefully and display helpful messages
- [ ] Keyboard navigation and accessibility verified with screen reader
