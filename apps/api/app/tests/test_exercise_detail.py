"""Tests for the GET /exercises/{exerciseId} endpoint."""

import json
import os
import sqlite3
from datetime import datetime, timezone

import pytest
from httpx import ASGITransport, AsyncClient

from app.db import get_db_path, init_db
from app.main import app


@pytest.fixture(autouse=True)
async def setup_exercise_detail():
    """Insert test exercise data before each test."""
    storage_root = os.path.realpath(
        os.path.join(os.path.dirname(__file__), "..", "..")
    )
    init_db(storage_root)
    db_path = get_db_path(storage_root)

    now = datetime.now(timezone.utc).isoformat()

    midi_data = {
        "metadata": {
            "bpm": 120,
            "audio_file": "storage/electronic-drums/basic-rhythms/exercise-1.mp3",
            "offset_ms": 0,
            "ticks_per_beat": 480,
            "total_notes": 3,
            "source_midi": "exercise-1.mid",
        },
        "pistaEjercicio": [
            {"timestamp": 0.0, "note": 36, "velocity": 100, "channel": 1},
            {"timestamp": 500.0, "note": 38, "velocity": 80, "channel": 1},
            {"timestamp": 1000.0, "note": 42, "velocity": 90, "channel": 1},
        ],
    }

    with sqlite3.connect(db_path) as conn:
        conn.execute("DELETE FROM exercises")
        conn.execute(
            "INSERT INTO exercises (id, instrument_type, folder_path, exercise_name, "
            "audio_path, bpm, total_notes, parsed_midi_data, created_at, updated_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                "drums-basic-1",
                "electronic-drums",
                "basic-rhythms",
                "exercise-1",
                "storage/electronic-drums/basic-rhythms/exercise-1.mp3",
                120,
                3,
                json.dumps(midi_data),
                now,
                now,
            ),
        )
        # Exercise with empty MIDI data
        conn.execute(
            "INSERT INTO exercises (id, instrument_type, folder_path, exercise_name, "
            "audio_path, bpm, total_notes, parsed_midi_data, created_at, updated_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                "drums-empty-1",
                "electronic-drums",
                "basic-rhythms",
                "empty-exercise",
                "storage/electronic-drums/basic-rhythms/empty-exercise.mp3",
                100,
                0,
                "{}",
                now,
                now,
            ),
        )
        conn.commit()

    yield

    with sqlite3.connect(db_path) as conn:
        conn.execute("DELETE FROM exercises")
        conn.commit()


@pytest.mark.asyncio
class TestGetExerciseDetail:
    """Tests for GET /exercises/{exerciseId} endpoint."""

    async def test_returns_200_for_existing_exercise(self):
        """Should return 200 for an existing exercise ID."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/exercises/drums-basic-1")
            assert response.status_code == 200

    async def test_returns_404_for_unknown_exercise(self):
        """Should return 404 when exercise is not found."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/exercises/does-not-exist")
            assert response.status_code == 404

    async def test_response_contains_exercise_id(self):
        """Should include exercise ID in the response."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/exercises/drums-basic-1")
            data = response.json()
            assert data["id"] == "drums-basic-1"

    async def test_response_contains_title(self):
        """Should include a human-readable title in the response."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/exercises/drums-basic-1")
            data = response.json()
            assert "title" in data
            assert isinstance(data["title"], str)
            assert len(data["title"]) > 0

    async def test_response_contains_bpm(self):
        """Should include BPM in the response."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/exercises/drums-basic-1")
            data = response.json()
            assert data["bpm"] == 120

    async def test_response_contains_audio_url(self):
        """Should include audioUrl in the response."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/exercises/drums-basic-1")
            data = response.json()
            assert "audioUrl" in data
            assert isinstance(data["audioUrl"], str)

    async def test_response_contains_instrument_type(self):
        """Should include instrumentType in the response."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/exercises/drums-basic-1")
            data = response.json()
            assert data["instrumentType"] == "electronic-drums"

    async def test_response_contains_midi_events(self):
        """Should include parsed MIDI events in the response."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/exercises/drums-basic-1")
            data = response.json()
            assert "midiEvents" in data
            assert isinstance(data["midiEvents"], list)
            assert len(data["midiEvents"]) == 3

    async def test_midi_event_format(self):
        """MIDI events should have timestamp, note, velocity, channel, type fields."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/exercises/drums-basic-1")
            data = response.json()
            for event in data["midiEvents"]:
                assert "timestamp" in event
                assert "note" in event
                assert "velocity" in event
                assert "channel" in event
                assert "type" in event
                assert event["type"] == "noteOn"

    async def test_response_contains_duration_ms(self):
        """Should include durationMs in the response."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/exercises/drums-basic-1")
            data = response.json()
            assert "durationMs" in data
            assert isinstance(data["durationMs"], (int, float))
            assert data["durationMs"] >= 0

    async def test_duration_ms_based_on_last_event(self):
        """durationMs should be derived from the last MIDI event timestamp."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/exercises/drums-basic-1")
            data = response.json()
            # Last event is at 1000ms, so durationMs should be at least 1000
            assert data["durationMs"] >= 1000

    async def test_empty_midi_data_returns_empty_events(self):
        """Should return empty midiEvents when MIDI data is empty."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/exercises/drums-empty-1")
            data = response.json()
            assert data["midiEvents"] == []

    async def test_404_response_format(self):
        """404 response should include an error field."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/exercises/not-found")
            data = response.json()
            assert "detail" in data or "error" in data
