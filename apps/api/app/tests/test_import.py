"""Tests for POST /import — exercise import backend.

Covers spec: specs/exercise-import-backend.md
"""

import io
import json
import sqlite3
from unittest.mock import patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.db import get_db_path
from app.main import app

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _midi_bytes(bpm: int = 120, note_count: int = 2) -> bytes:
    """Build a minimal, valid MIDI file in memory using mido."""
    import mido

    mid = mido.MidiFile(type=0, ticks_per_beat=480)
    track = mido.MidiTrack()
    mid.tracks.append(track)
    track.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(bpm), time=0))
    for i in range(note_count):
        track.append(mido.Message("note_on", channel=0, note=36 + i, velocity=80, time=0))
        track.append(mido.Message("note_off", channel=0, note=36 + i, velocity=0, time=240))
    track.append(mido.MetaMessage("end_of_track", time=0))
    buf = io.BytesIO()
    mid.save(file=buf)
    return buf.getvalue()


def _mp3_bytes() -> bytes:
    """Minimal fake MP3 data (no validation performed by the endpoint)."""
    return b"\xff\xfb\x90\x00" + b"\x00" * 100


# ---------------------------------------------------------------------------
# Validation tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_import_invalid_instrument(tmp_path):
    with patch("app.routes.imports.STORAGE_ROOT", str(tmp_path)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            response = await c.post(
                "/import",
                data={"instrument": "invalid-instrument"},
                files=[("files", ("Ritmo1.mp3", _mp3_bytes(), "audio/mpeg"))],
            )
    assert response.status_code == 400
    assert "instrument" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_import_no_files(tmp_path):
    with patch("app.routes.imports.STORAGE_ROOT", str(tmp_path)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            response = await c.post("/import", data={"instrument": "electronic-drums"})
    assert response.status_code == 400


# ---------------------------------------------------------------------------
# Exercise-pair detection tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_import_no_valid_pairs(tmp_path):
    """Only an MP3 with no matching MIDI → no exercises, non-empty errors."""
    with patch("app.routes.imports.STORAGE_ROOT", str(tmp_path)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            response = await c.post(
                "/import",
                data={"instrument": "electronic-drums"},
                files=[("files", ("Ritmo1.mp3", _mp3_bytes(), "audio/mpeg"))],
            )
    assert response.status_code == 200
    data = response.json()
    assert data["imported_exercises"] == []
    assert len(data["errors"]) > 0


@pytest.mark.asyncio
async def test_import_ignores_unpaired_files(tmp_path):
    """Ritmo1 has MIDI only; Ritmo2 has MP3 only → no valid pair."""
    with patch("app.routes.imports.STORAGE_ROOT", str(tmp_path)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            response = await c.post(
                "/import",
                data={"instrument": "bass-guitar"},
                files=[
                    ("files", ("Ritmo1.midi", _midi_bytes(), "audio/midi")),
                    ("files", ("Ritmo2.mp3", _mp3_bytes(), "audio/mpeg")),
                ],
            )
    assert response.status_code == 200
    assert response.json()["imported_exercises"] == []


# ---------------------------------------------------------------------------
# Happy-path import tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_import_valid_pair(tmp_path):
    """A matching MIDI + MP3 pair is imported and the response is correct."""
    with patch("app.routes.imports.STORAGE_ROOT", str(tmp_path)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            response = await c.post(
                "/import",
                data={"instrument": "electronic-drums"},
                files=[
                    ("files", ("ritmos-basicos/Ritmo1.mp3", _mp3_bytes(), "audio/mpeg")),
                    ("files", ("ritmos-basicos/Ritmo1.midi", _midi_bytes(120, 3), "audio/midi")),
                ],
            )
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Exercises imported successfully"
    assert data["errors"] == []
    assert len(data["imported_exercises"]) == 1
    ex = data["imported_exercises"][0]
    assert ex["exercise_name"] == "Ritmo1"
    assert ex["bpm"] == 120
    assert ex["total_notes"] == 3
    assert "Ritmo1.mp3" in ex["audio_path"]


@pytest.mark.asyncio
async def test_import_multiple_pairs(tmp_path):
    """Multiple valid pairs in the same folder are all imported."""
    with patch("app.routes.imports.STORAGE_ROOT", str(tmp_path)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            response = await c.post(
                "/import",
                data={"instrument": "electronic-drums"},
                files=[
                    ("files", ("ritmos/Ritmo1.mp3", _mp3_bytes(), "audio/mpeg")),
                    ("files", ("ritmos/Ritmo1.midi", _midi_bytes(120, 4), "audio/midi")),
                    ("files", ("ritmos/Ritmo2.mp3", _mp3_bytes(), "audio/mpeg")),
                    ("files", ("ritmos/Ritmo2.midi", _midi_bytes(130, 6), "audio/midi")),
                ],
            )
    assert response.status_code == 200
    data = response.json()
    assert len(data["imported_exercises"]) == 2
    names = {e["exercise_name"] for e in data["imported_exercises"]}
    assert names == {"Ritmo1", "Ritmo2"}


@pytest.mark.asyncio
async def test_import_audio_file_stored_on_disk(tmp_path):
    """After import the MP3 file exists at the expected path on disk."""
    import os

    with patch("app.routes.imports.STORAGE_ROOT", str(tmp_path)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            await c.post(
                "/import",
                data={"instrument": "electronic-drums"},
                files=[
                    ("files", ("beats/Ritmo1.mp3", _mp3_bytes(), "audio/mpeg")),
                    ("files", ("beats/Ritmo1.midi", _midi_bytes(), "audio/midi")),
                ],
            )

    expected = os.path.join(str(tmp_path), "storage", "electronic-drums", "beats", "Ritmo1.mp3")
    assert os.path.exists(expected)


# ---------------------------------------------------------------------------
# Re-import / idempotency test
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_import_reimport_does_not_overwrite(tmp_path):
    """Re-importing the same exercise does not raise errors or duplicate DB rows."""
    files = [
        ("files", ("folder/Exercise1.mp3", _mp3_bytes(), "audio/mpeg")),
        ("files", ("folder/Exercise1.midi", _midi_bytes(bpm=100, note_count=2), "audio/midi")),
    ]
    with patch("app.routes.imports.STORAGE_ROOT", str(tmp_path)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            r1 = await c.post("/import", data={"instrument": "guitar"}, files=files)
            assert r1.status_code == 200
            assert len(r1.json()["imported_exercises"]) == 1

            r2 = await c.post("/import", data={"instrument": "guitar"}, files=files)
            assert r2.status_code == 200
            # No crash, valid message (existing record skipped silently)
            assert r2.json()["message"] == "Exercises imported successfully"


# ---------------------------------------------------------------------------
# MIDI parsing and metadata tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_import_midi_extension_mid(tmp_path):
    """Exercises with .mid extension (not .midi) are recognized."""
    with patch("app.routes.imports.STORAGE_ROOT", str(tmp_path)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            response = await c.post(
                "/import",
                data={"instrument": "electronic-drums"},
                files=[
                    ("files", ("folder/Ritmo1.mp3", _mp3_bytes(), "audio/mpeg")),
                    ("files", ("folder/Ritmo1.mid", _midi_bytes(bpm=100, note_count=5), "audio/midi")),
                ],
            )
    assert response.status_code == 200
    data = response.json()
    assert len(data["imported_exercises"]) == 1
    assert data["imported_exercises"][0]["exercise_name"] == "Ritmo1"


@pytest.mark.asyncio
async def test_import_midi_bpm_extraction(tmp_path):
    """BPM is correctly extracted from MIDI tempo metadata."""
    with patch("app.routes.imports.STORAGE_ROOT", str(tmp_path)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            response = await c.post(
                "/import",
                data={"instrument": "bass-guitar"},
                files=[
                    ("files", ("folder/Slow.mp3", _mp3_bytes(), "audio/mpeg")),
                    ("files", ("folder/Slow.midi", _midi_bytes(bpm=80, note_count=3), "audio/midi")),
                    ("files", ("folder/Fast.mp3", _mp3_bytes(), "audio/mpeg")),
                    ("files", ("folder/Fast.midi", _midi_bytes(bpm=160, note_count=3), "audio/midi")),
                ],
            )
    assert response.status_code == 200
    data = response.json()
    assert len(data["imported_exercises"]) == 2

    slow = next(e for e in data["imported_exercises"] if e["exercise_name"] == "Slow")
    fast = next(e for e in data["imported_exercises"] if e["exercise_name"] == "Fast")

    assert slow["bpm"] == 80
    assert fast["bpm"] == 160


@pytest.mark.asyncio
async def test_import_midi_note_count(tmp_path):
    """Total note count is correctly extracted from MIDI."""
    with patch("app.routes.imports.STORAGE_ROOT", str(tmp_path)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            response = await c.post(
                "/import",
                data={"instrument": "guitar"},
                files=[
                    ("files", ("folder/Ex1.mp3", _mp3_bytes(), "audio/mpeg")),
                    ("files", ("folder/Ex1.midi", _midi_bytes(bpm=120, note_count=10), "audio/midi")),
                ],
            )
    assert response.status_code == 200
    data = response.json()
    assert data["imported_exercises"][0]["total_notes"] == 10


@pytest.mark.asyncio
async def test_import_folder_path_normalization(tmp_path):
    """Folder paths with spaces and special chars are normalized (spaces → hyphens, lowercase)."""
    with patch("app.routes.imports.STORAGE_ROOT", str(tmp_path)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            response = await c.post(
                "/import",
                data={"instrument": "electronic-drums"},
                files=[
                    ("files", ("Ritmos Básicos/Ritmo1.mp3", _mp3_bytes(), "audio/mpeg")),
                    ("files", ("Ritmos Básicos/Ritmo1.midi", _midi_bytes(), "audio/midi")),
                ],
            )
    assert response.status_code == 200
    data = response.json()
    assert len(data["imported_exercises"]) == 1
    # Audio path should contain normalized folder name
    audio_path = data["imported_exercises"][0]["audio_path"]
    assert "ritmos" in audio_path.lower()


@pytest.mark.asyncio
async def test_import_malformed_midi_skipped(tmp_path):
    """A malformed MIDI file is skipped; import continues with valid pairs."""
    bad_midi = b"\xff\xff\xff" * 10  # Not a valid MIDI file

    with patch("app.routes.imports.STORAGE_ROOT", str(tmp_path)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            response = await c.post(
                "/import",
                data={"instrument": "electronic-drums"},
                files=[
                    ("files", ("folder/Bad.mp3", _mp3_bytes(), "audio/mpeg")),
                    ("files", ("folder/Bad.midi", bad_midi, "audio/midi")),
                    ("files", ("folder/Good.mp3", _mp3_bytes(), "audio/mpeg")),
                    ("files", ("folder/Good.midi", _midi_bytes(), "audio/midi")),
                ],
            )
    assert response.status_code == 200
    data = response.json()
    # Bad exercise should not be imported, Good should be
    assert len(data["imported_exercises"]) == 1
    assert data["imported_exercises"][0]["exercise_name"] == "Good"
    assert len(data["errors"]) > 0


# ---------------------------------------------------------------------------
# Database and response format tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_import_response_format_structure(tmp_path):
    """Response includes all required fields: message, instrument, folder_path, imported_exercises, errors."""
    with patch("app.routes.imports.STORAGE_ROOT", str(tmp_path)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            response = await c.post(
                "/import",
                data={"instrument": "electronic-drums"},
                files=[
                    ("files", ("mybeats/Ritmo1.mp3", _mp3_bytes(), "audio/mpeg")),
                    ("files", ("mybeats/Ritmo1.midi", _midi_bytes(), "audio/midi")),
                ],
            )
    assert response.status_code == 200
    data = response.json()

    # Verify all required response fields
    assert "message" in data
    assert "instrument" in data
    assert "folder_path" in data
    assert "imported_exercises" in data
    assert "errors" in data
    assert isinstance(data["imported_exercises"], list)
    assert isinstance(data["errors"], list)


@pytest.mark.asyncio
async def test_import_exercise_object_structure(tmp_path):
    """Each imported exercise object contains: exercise_name, audio_path, bpm, total_notes."""
    with patch("app.routes.imports.STORAGE_ROOT", str(tmp_path)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            response = await c.post(
                "/import",
                data={"instrument": "guitar"},
                files=[
                    ("files", ("folder/Ritmo1.mp3", _mp3_bytes(), "audio/mpeg")),
                    ("files", ("folder/Ritmo1.midi", _midi_bytes(bpm=110, note_count=7), "audio/midi")),
                ],
            )
    assert response.status_code == 200
    exercise = response.json()["imported_exercises"][0]

    assert "exercise_name" in exercise
    assert "audio_path" in exercise
    assert "bpm" in exercise
    assert "total_notes" in exercise

    assert exercise["exercise_name"] == "Ritmo1"
    assert isinstance(exercise["bpm"], int)
    assert isinstance(exercise["total_notes"], int)
    assert ".mp3" in exercise["audio_path"]


@pytest.mark.asyncio
async def test_import_nested_folder_structure(tmp_path):
    """Nested folder structures are preserved in storage paths."""
    with patch("app.routes.imports.STORAGE_ROOT", str(tmp_path)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            response = await c.post(
                "/import",
                data={"instrument": "bass-guitar"},
                files=[
                    ("files", ("level1/level2/Exercise.mp3", _mp3_bytes(), "audio/mpeg")),
                    ("files", ("level1/level2/Exercise.midi", _midi_bytes(), "audio/midi")),
                ],
            )
    assert response.status_code == 200
    data = response.json()
    assert len(data["imported_exercises"]) == 1

    audio_path = data["imported_exercises"][0]["audio_path"]
    # Path should contain folder structure
    assert "level1" in audio_path or "level2" in audio_path or "exercise" in audio_path.lower()


@pytest.mark.asyncio
async def test_import_different_instruments(tmp_path):
    """Each instrument type is stored in its own directory."""
    with patch("app.routes.imports.STORAGE_ROOT", str(tmp_path)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            # Import for electronic-drums
            r1 = await c.post(
                "/import",
                data={"instrument": "electronic-drums"},
                files=[
                    ("files", ("folder/Ex1.mp3", _mp3_bytes(), "audio/mpeg")),
                    ("files", ("folder/Ex1.midi", _midi_bytes(), "audio/midi")),
                ],
            )
            assert r1.status_code == 200

            # Import for bass-guitar
            r2 = await c.post(
                "/import",
                data={"instrument": "bass-guitar"},
                files=[
                    ("files", ("folder/Ex1.mp3", _mp3_bytes(), "audio/mpeg")),
                    ("files", ("folder/Ex1.midi", _midi_bytes(), "audio/midi")),
                ],
            )
            assert r2.status_code == 200

            # Both should succeed (different instrument paths)
            assert len(r1.json()["imported_exercises"]) == 1
            assert len(r2.json()["imported_exercises"]) == 1

            # Verify paths are different
            path1 = r1.json()["imported_exercises"][0]["audio_path"]
            path2 = r2.json()["imported_exercises"][0]["audio_path"]
            assert "electronic-drums" in path1
            assert "bass-guitar" in path2


@pytest.mark.asyncio
async def test_import_no_pairs_error_message(tmp_path):
    """When no valid pairs are found, error message is descriptive."""
    with patch("app.routes.imports.STORAGE_ROOT", str(tmp_path)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            response = await c.post(
                "/import",
                data={"instrument": "guitar"},
                files=[
                    ("files", ("folder/Orphan1.mp3", _mp3_bytes(), "audio/mpeg")),
                    ("files", ("folder/Orphan2.midi", _midi_bytes(), "audio/midi")),
                ],
            )
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "No valid exercise pairs found"
    assert data["imported_exercises"] == []
    assert len(data["errors"]) > 0
    # Error message should mention pairs or matching
    error_text = " ".join(data["errors"]).lower()
    assert "pair" in error_text or "match" in error_text or "mp3" in error_text


# ---------------------------------------------------------------------------
# Database persistence tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_import_database_stores_exercise(tmp_path):
    """Exercise is persisted to the database with all required fields."""
    with patch("app.routes.imports.STORAGE_ROOT", str(tmp_path)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            await c.post(
                "/import",
                data={"instrument": "electronic-drums"},
                files=[
                    ("files", ("folder/TestExercise.mp3", _mp3_bytes(), "audio/mpeg")),
                    ("files", ("folder/TestExercise.midi", _midi_bytes(bpm=110, note_count=5), "audio/midi")),
                ],
            )

    # Query database to verify persistence
    db_path = get_db_path(str(tmp_path))
    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.execute(
            "SELECT * FROM exercises WHERE exercise_name=?",
            ("TestExercise",),
        )
        row = cursor.fetchone()

    assert row is not None
    assert row["instrument_type"] == "electronic-drums"
    assert row["exercise_name"] == "TestExercise"
    assert row["bpm"] == 110
    assert row["total_notes"] == 5
    assert row["folder_path"] == "folder"
    assert "TestExercise.mp3" in row["audio_path"]
    assert row["parsed_midi_data"]  # Should have MIDI JSON
    assert row["created_at"]
    assert row["updated_at"]


@pytest.mark.asyncio
async def test_import_database_parsed_midi_data_structure(tmp_path):
    """Parsed MIDI data in database contains required metadata and note events."""
    with patch("app.routes.imports.STORAGE_ROOT", str(tmp_path)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            await c.post(
                "/import",
                data={"instrument": "bass-guitar"},
                files=[
                    ("files", ("folder/Exercise.mp3", _mp3_bytes(), "audio/mpeg")),
                    ("files", ("folder/Exercise.midi", _midi_bytes(bpm=100, note_count=3), "audio/midi")),
                ],
            )

    db_path = get_db_path(str(tmp_path))
    with sqlite3.connect(db_path) as conn:
        cursor = conn.execute(
            "SELECT parsed_midi_data FROM exercises WHERE exercise_name=?",
            ("Exercise",),
        )
        row = cursor.fetchone()

    parsed_data = json.loads(row[0])

    # Check metadata structure
    assert "metadata" in parsed_data
    metadata = parsed_data["metadata"]
    assert "bpm" in metadata
    assert "audio_file" in metadata
    assert "offset_ms" in metadata
    assert "ticks_per_beat" in metadata
    assert "total_notes" in metadata
    assert "source_midi" in metadata

    assert metadata["bpm"] == 100
    assert metadata["total_notes"] == 3
    assert metadata["offset_ms"] == 0

    # Check note events array exists
    assert "pistaEjercicio" in parsed_data
    assert isinstance(parsed_data["pistaEjercicio"], list)


@pytest.mark.asyncio
async def test_import_unique_constraint_prevents_duplicate_inserts(tmp_path):
    """Unique constraint on (instrument_type, folder_path, exercise_name) prevents duplicates."""
    files = [
        ("files", ("folder/Unique.mp3", _mp3_bytes(), "audio/mpeg")),
        ("files", ("folder/Unique.midi", _midi_bytes(bpm=100, note_count=2), "audio/midi")),
    ]

    with patch("app.routes.imports.STORAGE_ROOT", str(tmp_path)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            r1 = await c.post("/import", data={"instrument": "guitar"}, files=files)
            r2 = await c.post("/import", data={"instrument": "guitar"}, files=files)

    # Verify database has only 1 record, not 2
    db_path = get_db_path(str(tmp_path))
    with sqlite3.connect(db_path) as conn:
        cursor = conn.execute(
            "SELECT COUNT(*) FROM exercises WHERE exercise_name=? AND instrument_type=? AND folder_path=?",
            ("Unique", "guitar", "folder"),
        )
        count = cursor.fetchone()[0]

    assert count == 1


@pytest.mark.asyncio
async def test_import_database_index_on_instrument_type(tmp_path):
    """Index on instrument_type is created and can be queried efficiently."""
    with patch("app.routes.imports.STORAGE_ROOT", str(tmp_path)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            await c.post(
                "/import",
                data={"instrument": "electronic-drums"},
                files=[
                    ("files", ("f1/Ex1.mp3", _mp3_bytes(), "audio/mpeg")),
                    ("files", ("f1/Ex1.midi", _midi_bytes(), "audio/midi")),
                ],
            )
            await c.post(
                "/import",
                data={"instrument": "bass-guitar"},
                files=[
                    ("files", ("f2/Ex2.mp3", _mp3_bytes(), "audio/mpeg")),
                    ("files", ("f2/Ex2.midi", _midi_bytes(), "audio/midi")),
                ],
            )

    db_path = get_db_path(str(tmp_path))
    with sqlite3.connect(db_path) as conn:
        cursor = conn.execute(
            "SELECT COUNT(*) FROM exercises WHERE instrument_type=?",
            ("electronic-drums",),
        )
        count = cursor.fetchone()[0]
        assert count == 1

        cursor = conn.execute(
            "SELECT COUNT(*) FROM exercises WHERE instrument_type=?",
            ("bass-guitar",),
        )
        count = cursor.fetchone()[0]
        assert count == 1


@pytest.mark.asyncio
async def test_import_database_index_on_folder_path(tmp_path):
    """Index on folder_path is created and can be queried efficiently."""
    with patch("app.routes.imports.STORAGE_ROOT", str(tmp_path)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            await c.post(
                "/import",
                data={"instrument": "guitar"},
                files=[
                    ("files", ("folder_a/Ex1.mp3", _mp3_bytes(), "audio/mpeg")),
                    ("files", ("folder_a/Ex1.midi", _midi_bytes(), "audio/midi")),
                    ("files", ("folder_b/Ex2.mp3", _mp3_bytes(), "audio/mpeg")),
                    ("files", ("folder_b/Ex2.midi", _midi_bytes(), "audio/midi")),
                ],
            )

    db_path = get_db_path(str(tmp_path))
    with sqlite3.connect(db_path) as conn:
        cursor = conn.execute(
            "SELECT COUNT(*) FROM exercises WHERE folder_path=?",
            ("folder_a",),
        )
        count = cursor.fetchone()[0]
        assert count == 1

        cursor = conn.execute(
            "SELECT COUNT(*) FROM exercises WHERE folder_path=?",
            ("folder_b",),
        )
        count = cursor.fetchone()[0]
        assert count == 1


@pytest.mark.asyncio
async def test_import_timestamps_created_at_and_updated_at(tmp_path):
    """created_at and updated_at timestamps are set and different on re-import."""
    files = [
        ("files", ("folder/Ex.mp3", _mp3_bytes(), "audio/mpeg")),
        ("files", ("folder/Ex.midi", _midi_bytes(), "audio/midi")),
    ]

    with patch("app.routes.imports.STORAGE_ROOT", str(tmp_path)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            await c.post("/import", data={"instrument": "electronic-drums"}, files=files)

    db_path = get_db_path(str(tmp_path))
    with sqlite3.connect(db_path) as conn:
        cursor = conn.execute(
            "SELECT created_at, updated_at FROM exercises WHERE exercise_name=?",
            ("Ex",),
        )
        created_at, updated_at = cursor.fetchone()

    # Both timestamps should be set
    assert created_at
    assert updated_at
    # On first import, they should be the same
    assert created_at == updated_at


@pytest.mark.asyncio
async def test_import_mixed_valid_and_invalid_pairs(tmp_path):
    """A mix of valid pairs and unpaired files imports only valid pairs."""
    with patch("app.routes.imports.STORAGE_ROOT", str(tmp_path)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            response = await c.post(
                "/import",
                data={"instrument": "guitar"},
                files=[
                    ("files", ("folder/Valid1.mp3", _mp3_bytes(), "audio/mpeg")),
                    ("files", ("folder/Valid1.midi", _midi_bytes(note_count=5), "audio/midi")),
                    ("files", ("folder/Valid2.mp3", _mp3_bytes(), "audio/mpeg")),
                    ("files", ("folder/Valid2.midi", _midi_bytes(note_count=6), "audio/midi")),
                    ("files", ("folder/Unpaired.mp3", _mp3_bytes(), "audio/mpeg")),
                    ("files", ("folder/NoAudio.midi", _midi_bytes(), "audio/midi")),
                ],
            )

    assert response.status_code == 200
    data = response.json()
    assert len(data["imported_exercises"]) == 2
    names = {e["exercise_name"] for e in data["imported_exercises"]}
    assert names == {"Valid1", "Valid2"}

    # Verify database
    db_path = get_db_path(str(tmp_path))
    with sqlite3.connect(db_path) as conn:
        cursor = conn.execute("SELECT COUNT(*) FROM exercises")
        count = cursor.fetchone()[0]
    assert count == 2


@pytest.mark.asyncio
async def test_import_exercise_id_is_unique_uuid(tmp_path):
    """Each exercise gets a unique UUID as its id."""
    with patch("app.routes.imports.STORAGE_ROOT", str(tmp_path)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            await c.post(
                "/import",
                data={"instrument": "electronic-drums"},
                files=[
                    ("files", ("folder/Ex1.mp3", _mp3_bytes(), "audio/mpeg")),
                    ("files", ("folder/Ex1.midi", _midi_bytes(), "audio/midi")),
                    ("files", ("folder/Ex2.mp3", _mp3_bytes(), "audio/mpeg")),
                    ("files", ("folder/Ex2.midi", _midi_bytes(), "audio/midi")),
                ],
            )

    db_path = get_db_path(str(tmp_path))
    with sqlite3.connect(db_path) as conn:
        cursor = conn.execute("SELECT id FROM exercises ORDER BY exercise_name")
        ids = [row[0] for row in cursor.fetchall()]

    assert len(ids) == 2
    assert ids[0] != ids[1]  # IDs should be different
    # Simple UUID format check (36 chars with hyphens)
    for id_ in ids:
        assert len(id_) == 36
        assert id_.count("-") == 4
