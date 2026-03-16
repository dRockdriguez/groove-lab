"""Tests for the GET /exercises endpoint."""

import sqlite3
import os
from datetime import datetime, timezone
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db import init_db, get_db_path


@pytest.fixture(autouse=True)
async def setup_test_exercises():
    """Insert test exercises into the database before each test."""
    # Determine storage root
    storage_root = os.path.realpath(
        os.path.join(os.path.dirname(__file__), "..", "..")
    )

    # Initialize database
    init_db(storage_root)
    db_path = get_db_path(storage_root)

    # Insert test exercises
    with sqlite3.connect(db_path) as conn:
        # Clear any existing data
        conn.execute("DELETE FROM exercises")

        # Get current timestamp
        now = datetime.now(timezone.utc).isoformat()

        # Insert test data
        test_data = [
            ("drums-basic-1", "electronic-drums", "basic-rhythms", "Exercise 1", "storage/electronic-drums/basic-rhythms/exercise-1.mp3", 120, 10, "{}"),
            ("drums-basic-2", "electronic-drums", "basic-rhythms", "Exercise 2", "storage/electronic-drums/basic-rhythms/exercise-2.mp3", 120, 10, "{}"),
            ("drums-advanced-1", "electronic-drums", "advanced-patterns", "Advanced 1", "storage/electronic-drums/advanced-patterns/advanced-1.mp3", 140, 15, "{}"),
            ("bass-basic-1", "bass-guitar", "basic-lines", "Exercise 1", "storage/bass-guitar/basic-lines/exercise-1.mp3", 100, 8, "{}"),
            ("guitar-basic-1", "guitar", "basic-chords", "Exercise 1", "storage/guitar/basic-chords/exercise-1.mp3", 110, 12, "{}"),
        ]

        for exercise_id, instrument, folder, name, audio_path, bpm, notes, midi_data in test_data:
            conn.execute(
                "INSERT INTO exercises (id, instrument_type, folder_path, exercise_name, audio_path, bpm, total_notes, parsed_midi_data, created_at, updated_at) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (exercise_id, instrument, folder, name, audio_path, bpm, notes, midi_data, now, now),
            )
        conn.commit()

    yield

    # Cleanup: remove test data
    with sqlite3.connect(db_path) as conn:
        conn.execute("DELETE FROM exercises")
        conn.commit()


@pytest.mark.asyncio
class TestGetExercisesEndpoint:
    """Tests for GET /exercises endpoint."""

    async def test_get_exercises_returns_200(self):
        """Should return HTTP 200 for valid request."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/exercises")
            assert response.status_code == 200

    async def test_get_exercises_returns_list(self):
        """Should return a list of InstrumentExercises."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/exercises")
            data = response.json()
            assert isinstance(data, list)

    async def test_response_format_matches_instrument_exercises_type(self):
        """Should match InstrumentExercises[] response format."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/exercises")
            data = response.json()

            for instrument_data in data:
                assert "instrumentType" in instrument_data
                assert instrument_data["instrumentType"] in [
                    "electronic-drums",
                    "bass-guitar",
                    "guitar",
                ]
                assert "sections" in instrument_data
                assert isinstance(instrument_data["sections"], list)

                for section in instrument_data["sections"]:
                    assert "id" in section
                    assert "title" in section
                    assert "exercises" in section
                    assert isinstance(section["exercises"], list)

                    for exercise in section["exercises"]:
                        assert "id" in exercise
                        assert "title" in exercise
                        assert "description" in exercise

    async def test_exercises_grouped_by_instrument(self):
        """Should group exercises by instrument field."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/exercises")
            data = response.json()

            instruments_in_response = [
                item["instrumentType"] for item in data
            ]
            # Each instrument should appear only once
            assert len(instruments_in_response) == len(
                set(instruments_in_response)
            )

    async def test_exercises_grouped_by_section_within_instrument(self):
        """Should group exercises by section folder name within each instrument."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/exercises")
            data = response.json()

            for instrument_data in data:
                section_ids = [section["id"] for section in instrument_data["sections"]]
                # Each section should appear only once per instrument
                assert len(section_ids) == len(set(section_ids))

    async def test_section_id_is_folder_name(self):
        """Should use folder name as section ID."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/exercises")
            data = response.json()

            for instrument_data in data:
                for section in instrument_data["sections"]:
                    # Section ID should be folder name (kebab-case)
                    assert isinstance(section["id"], str)
                    assert len(section["id"]) > 0

    async def test_section_title_humanized_correctly(self):
        """Should humanize folder name to section title."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/exercises")
            data = response.json()

            for instrument_data in data:
                for section in instrument_data["sections"]:
                    # Title should be humanized (e.g., "basic-rhythms" → "Basic Rhythms")
                    assert isinstance(section["title"], str)
                    assert len(section["title"]) > 0
                    # Should not contain folder-like characters
                    assert "/" not in section["title"]

    async def test_instruments_with_no_exercises_omitted(self):
        """Should omit instruments with no exercises from response."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/exercises")
            data = response.json()

            for instrument_data in data:
                # Each instrument should have at least one section
                assert len(instrument_data["sections"]) > 0
                # Each section should have at least one exercise
                for section in instrument_data["sections"]:
                    assert len(section["exercises"]) > 0

    async def test_empty_exercises_returns_200(self):
        """Should return 200 with empty array if no exercises exist."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/exercises")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)

    @pytest.mark.asyncio
    async def test_response_time_reasonable(self):
        """Should return response in reasonable time."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            import time

            start = time.time()
            response = await client.get("/exercises")
            elapsed = time.time() - start

            # Should respond in reasonable time (under 1 second for tests)
            assert elapsed < 1.0
            assert response.status_code == 200

    async def test_exercises_have_required_fields(self):
        """Should include required fields in each exercise."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/exercises")
            data = response.json()

            for instrument_data in data:
                for section in instrument_data["sections"]:
                    for exercise in section["exercises"]:
                        # All fields should be strings
                        assert isinstance(exercise["id"], str)
                        assert isinstance(exercise["title"], str)
                        assert isinstance(exercise["description"], str)
                        # None should be empty
                        assert len(exercise["id"]) > 0
                        assert len(exercise["title"]) > 0

    async def test_exercises_formatted_correctly(self):
        """Should format exercise data correctly."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/exercises")
            data = response.json()

            for instrument_data in data:
                for section in instrument_data["sections"]:
                    for exercise in section["exercises"]:
                        # Exercise ID should follow pattern (e.g., "drums-basic-1")
                        assert isinstance(exercise["id"], str)
                        # Title should be human-readable (e.g., "Exercise 1")
                        assert isinstance(exercise["title"], str)
