import logging
import os
from typing import Annotated, Optional

from fastapi import APIRouter, Form, HTTPException, UploadFile

from app.db import init_db, upsert_exercise
from app.models.exercise import ImportedExerciseResponse, ImportResponse
from app.services.file_storage import normalize_folder_name, save_audio_file
from app.services.midi_parser import parse_midi

logger = logging.getLogger(__name__)

router = APIRouter()

VALID_INSTRUMENTS = {"electronic-drums", "bass-guitar", "guitar"}

# Resolved at import time; tests patch this symbol directly.
STORAGE_ROOT = os.path.realpath(os.path.join(os.path.dirname(__file__), "..", ".."))


@router.post("", response_model=ImportResponse)
async def import_exercises(
    instrument: Annotated[str, Form()],
    files: Optional[list[UploadFile]] = None,
) -> ImportResponse:
    # --- Validate instrument ---
    if instrument not in VALID_INSTRUMENTS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid instrument '{instrument}'. "
                f"Must be one of: {', '.join(sorted(VALID_INSTRUMENTS))}"
            ),
        )

    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    # --- Group uploaded files by (folder, base_name) ---
    midi_map: dict[tuple[str, str], tuple[str, bytes]] = {}
    mp3_map: dict[tuple[str, str], tuple[str, bytes]] = {}

    for upload in files:
        filename = (upload.filename or "").replace("\\", "/")
        data = await upload.read()

        parts = filename.split("/")
        basename = parts[-1]
        folder = "/".join(parts[:-1]) if len(parts) > 1 else ""
        name_no_ext, ext = os.path.splitext(basename)
        ext = ext.lower()

        key = (folder, name_no_ext)
        if ext in (".midi", ".mid"):
            midi_map[key] = (basename, data)
        elif ext == ".mp3":
            mp3_map[key] = (basename, data)

    # --- Find valid pairs ---
    pairs = set(midi_map.keys()) & set(mp3_map.keys())

    if not pairs:
        return ImportResponse(
            message="No valid exercise pairs found",
            instrument=instrument,
            imported_exercises=[],
            errors=["No .mp3 and .midi pairs detected in the uploaded files"],
        )

    # Ensure DB schema exists
    init_db(STORAGE_ROOT)

    imported: list[ImportedExerciseResponse] = []
    errors: list[str] = []

    for folder, base_name in sorted(pairs):
        midi_filename, midi_data = midi_map[(folder, base_name)]
        mp3_filename, mp3_data = mp3_map[(folder, base_name)]

        # Parse MIDI
        parsed = parse_midi(midi_data, filename=midi_filename)
        if parsed is None:
            errors.append(f"Failed to parse MIDI for exercise '{base_name}'")
            continue

        norm_folder = normalize_folder_name(folder) if folder else ""

        # Persist MP3 to disk
        try:
            audio_path = save_audio_file(
                storage_root=STORAGE_ROOT,
                instrument=instrument,
                folder_path=norm_folder,
                filename=mp3_filename,
                data=mp3_data,
            )
        except Exception as exc:
            logger.error("Failed to save audio for '%s': %s", base_name, exc)
            errors.append(f"Failed to save audio file for '{base_name}'")
            continue

        # Build normalized MIDI payload
        parsed_midi_data = {
            "metadata": {
                "bpm": parsed.bpm,
                "audio_file": audio_path,
                "offset_ms": 0,
                "ticks_per_beat": parsed.ticks_per_beat,
                "total_notes": parsed.total_notes,
                "source_midi": midi_filename,
            },
            "pistaEjercicio": [
                {
                    "timestamp": ev.timestamp,
                    "note": ev.note,
                    "velocity": ev.velocity,
                    "channel": ev.channel,
                }
                for ev in parsed.events
            ],
        }

        # Persist to DB (skips silently if already exists)
        try:
            upsert_exercise(
                storage_root=STORAGE_ROOT,
                instrument_type=instrument,
                exercise_name=base_name,
                folder_path=norm_folder,
                audio_path=audio_path,
                bpm=parsed.bpm,
                total_notes=parsed.total_notes,
                parsed_midi_data=parsed_midi_data,
            )
        except Exception as exc:
            logger.error("DB error for '%s': %s", base_name, exc)
            errors.append(f"Database error for '{base_name}'")
            continue

        imported.append(
            ImportedExerciseResponse(
                exercise_name=base_name,
                audio_path=audio_path,
                bpm=parsed.bpm,
                total_notes=parsed.total_notes,
            )
        )

    # Determine response folder (first normalised folder from the pairs)
    folder_values = {normalize_folder_name(f) for f, _ in pairs if f}
    response_folder = next(iter(folder_values)) if folder_values else None

    return ImportResponse(
        message="Exercises imported successfully",
        instrument=instrument,
        folder_path=response_folder,
        imported_exercises=imported,
        errors=errors,
    )
