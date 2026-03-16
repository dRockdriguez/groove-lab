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
