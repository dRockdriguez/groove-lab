import json
import logging
import os
import re
import sqlite3
from typing import Any

from fastapi import APIRouter, HTTPException

from app.db import get_db_path, init_db

logger = logging.getLogger(__name__)

router = APIRouter()

# Resolved at import time; tests can patch this symbol directly.
STORAGE_ROOT = os.path.realpath(os.path.join(os.path.dirname(__file__), "..", ".."))


def _humanize(slug: str) -> str:
    """Convert a slug to a human-readable title (e.g., 'basic-rhythms' → 'Basic Rhythms')."""
    return re.sub(r"[-_]", " ", slug).title()


@router.get("")
async def get_exercises() -> list[dict[str, Any]]:
    """Return all exercises grouped by instrument and section."""
    try:
        init_db(STORAGE_ROOT)
        db_path = get_db_path(STORAGE_ROOT)
        with sqlite3.connect(db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                "SELECT id, instrument_type, exercise_name, folder_path "
                "FROM exercises ORDER BY instrument_type, folder_path, exercise_name"
            )
            rows = cursor.fetchall()
    except Exception as exc:
        logger.error("Failed to query exercises: %s", exc)
        raise HTTPException(status_code=500, detail="Database error") from exc

    # Group by instrument_type → folder_path → exercises
    grouped: dict[str, dict[str, list[dict[str, str]]]] = {}
    for row in rows:
        inst = row["instrument_type"]
        folder = row["folder_path"]
        if inst not in grouped:
            grouped[inst] = {}
        if folder not in grouped[inst]:
            grouped[inst][folder] = []
        grouped[inst][folder].append(
            {"id": row["id"], "title": _humanize(row["exercise_name"]), "description": ""}
        )

    result: list[dict[str, Any]] = []
    for inst, sections_map in grouped.items():
        sections = [
            {"id": folder, "title": _humanize(folder), "exercises": exercises}
            for folder, exercises in sections_map.items()
        ]
        result.append({"instrumentType": inst, "sections": sections})

    return result


@router.get("/{exercise_id}")
async def get_exercise_detail(exercise_id: str) -> dict[str, Any]:
    """Return full playback data for a single exercise."""
    try:
        init_db(STORAGE_ROOT)
        db_path = get_db_path(STORAGE_ROOT)
        with sqlite3.connect(db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                "SELECT id, instrument_type, exercise_name, audio_path, bpm, "
                "parsed_midi_data FROM exercises WHERE id = ?",
                (exercise_id,),
            )
            row = cursor.fetchone()
    except Exception as exc:
        logger.error("Failed to query exercise %s: %s", exercise_id, exc)
        raise HTTPException(status_code=500, detail="Database error") from exc

    if row is None:
        raise HTTPException(status_code=404, detail="Exercise not found")

    # Parse MIDI data
    midi_events: list[dict[str, Any]] = []
    duration_ms: float = 0.0
    try:
        parsed: dict[str, Any] = json.loads(row["parsed_midi_data"] or "{}")
        raw_events = parsed.get("pistaEjercicio", [])
        for ev in raw_events:
            midi_events.append(
                {
                    "timestamp": ev.get("timestamp", 0),
                    "note": ev.get("note", 0),
                    "velocity": ev.get("velocity", 0),
                    "channel": ev.get("channel", 1),
                    "type": "noteOn",
                }
            )
        if midi_events:
            duration_ms = max(ev["timestamp"] for ev in midi_events) + 500.0
    except Exception as exc:
        logger.warning("Failed to parse MIDI data for %s: %s", exercise_id, exc)

    # Remove 'storage/' prefix from audio_path if present (it's already in the DB for file tracking)
    audio_path = row['audio_path']
    if audio_path.startswith('storage/'):
        audio_path = audio_path[8:]  # Remove 'storage/' prefix

    return {
        "id": row["id"],
        "title": _humanize(row["exercise_name"]),
        "description": "",
        "bpm": row["bpm"],
        "durationMs": duration_ms,
        "audioUrl": f"http://localhost:8000/storage/{audio_path}",
        "midiEvents": midi_events,
        "instrumentType": row["instrument_type"],
    }
