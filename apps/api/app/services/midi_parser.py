import io
import logging
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class MidiNoteEvent:
    timestamp: float  # ms from start
    note: int
    velocity: int
    channel: int  # 1-indexed


@dataclass
class ParsedMidi:
    bpm: int
    ticks_per_beat: int
    total_notes: int
    events: list[MidiNoteEvent] = field(default_factory=list)


def parse_midi(midi_bytes: bytes, filename: str = "") -> ParsedMidi | None:
    """Parse MIDI bytes and return structured data. Returns None on failure."""
    try:
        import mido

        mid = mido.MidiFile(file=io.BytesIO(midi_bytes))
        ticks_per_beat = mid.ticks_per_beat

        # Extract tempo (default 120 BPM = 500000 µs/beat)
        tempo = 500000
        for track in mid.tracks:
            for msg in track:
                if msg.type == "set_tempo":
                    tempo = msg.tempo
                    break

        bpm = round(60_000_000 / tempo)

        # Extract note_on events with timing
        events: list[MidiNoteEvent] = []
        for track in mid.tracks:
            current_tick = 0
            for msg in track:
                current_tick += msg.time
                if msg.type == "note_on" and msg.velocity > 0:
                    timestamp_ms = (current_tick / ticks_per_beat) * (60_000 / bpm)
                    events.append(
                        MidiNoteEvent(
                            timestamp=round(timestamp_ms, 3),
                            note=msg.note,
                            velocity=msg.velocity,
                            channel=msg.channel + 1,  # 0-indexed → 1-indexed
                        )
                    )

        return ParsedMidi(
            bpm=bpm,
            ticks_per_beat=ticks_per_beat,
            total_notes=len(events),
            events=events,
        )

    except Exception as exc:
        logger.warning("Failed to parse MIDI file '%s': %s", filename, exc)
        return None
