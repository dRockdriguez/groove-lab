import json
import logging
import os
import sqlite3
import uuid
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)


def _db_dir(storage_root: str) -> str:
    return os.path.join(storage_root, "storage")


def get_db_path(storage_root: str) -> str:
    db_dir = _db_dir(storage_root)
    os.makedirs(db_dir, exist_ok=True)
    return os.path.join(db_dir, "exercises.db")


def init_db(storage_root: str) -> None:
    """Create the exercises table and indexes (idempotent)."""
    db_path = get_db_path(storage_root)
    with sqlite3.connect(db_path) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS exercises (
                id TEXT PRIMARY KEY,
                instrument_type TEXT NOT NULL,
                exercise_name TEXT NOT NULL,
                folder_path TEXT NOT NULL,
                audio_path TEXT NOT NULL,
                bpm INTEGER NOT NULL,
                total_notes INTEGER NOT NULL,
                parsed_midi_data TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                UNIQUE (instrument_type, folder_path, exercise_name)
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_instrument_type ON exercises(instrument_type)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_folder_path ON exercises(folder_path)"
        )
        conn.commit()


def upsert_exercise(
    storage_root: str,
    instrument_type: str,
    exercise_name: str,
    folder_path: str,
    audio_path: str,
    bpm: int,
    total_notes: int,
    parsed_midi_data: dict[str, Any],
) -> bool:
    """
    Insert a new exercise record.

    Returns True if inserted (new exercise), False if the record already exists.
    Existing records are left unchanged (no delete, no overwrite).
    """
    init_db(storage_root)
    db_path = get_db_path(storage_root)
    now = datetime.now(timezone.utc).isoformat()

    with sqlite3.connect(db_path) as conn:
        cursor = conn.execute(
            "SELECT id FROM exercises "
            "WHERE instrument_type=? AND folder_path=? AND exercise_name=?",
            (instrument_type, folder_path, exercise_name),
        )
        if cursor.fetchone():
            return False  # Already exists — leave unchanged

        conn.execute(
            """
            INSERT INTO exercises
                (id, instrument_type, exercise_name, folder_path, audio_path,
                 bpm, total_notes, parsed_midi_data, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                str(uuid.uuid4()),
                instrument_type,
                exercise_name,
                folder_path,
                audio_path,
                bpm,
                total_notes,
                json.dumps(parsed_midi_data),
                now,
                now,
            ),
        )
        conn.commit()
        return True
