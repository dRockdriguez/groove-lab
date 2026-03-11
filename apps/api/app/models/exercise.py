from pydantic import BaseModel


class ImportedExerciseResponse(BaseModel):
    exercise_name: str
    audio_path: str
    bpm: int
    total_notes: int


class ImportResponse(BaseModel):
    message: str
    instrument: str | None = None
    folder_path: str | None = None
    imported_exercises: list[ImportedExerciseResponse]
    errors: list[str]
