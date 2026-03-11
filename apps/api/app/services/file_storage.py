import logging
import os
import re

logger = logging.getLogger(__name__)


def normalize_folder_name(name: str) -> str:
    """Normalize folder name: lowercase, spaces → hyphens, strip special chars."""
    name = name.lower()
    name = name.replace(" ", "-")
    # Keep slashes for nested paths, remove other special chars
    name = re.sub(r"[^a-z0-9\-_/]", "", name)
    name = re.sub(r"-+", "-", name)
    return name.strip("-/")


def _safe_path(base: str, *parts: str) -> str:
    """Resolve an absolute path and assert it is inside base (prevents traversal)."""
    target = os.path.realpath(os.path.join(base, *parts))
    if not target.startswith(os.path.realpath(base) + os.sep) and target != os.path.realpath(base):
        raise ValueError(f"Path traversal detected: {target!r}")
    return target


def save_audio_file(
    storage_root: str,
    instrument: str,
    folder_path: str,
    filename: str,
    data: bytes,
) -> str:
    """
    Write an MP3 file to disk (skip if already exists).

    Returns the relative path from storage_root, e.g.:
        storage/electronic-drums/ritmos-basicos/Ritmo1.mp3
    """
    norm_folder = normalize_folder_name(folder_path) if folder_path else ""
    if norm_folder:
        rel_path = os.path.join("storage", instrument, norm_folder, filename)
    else:
        rel_path = os.path.join("storage", instrument, filename)

    abs_path = _safe_path(storage_root, rel_path)
    os.makedirs(os.path.dirname(abs_path), exist_ok=True)

    if not os.path.exists(abs_path):
        with open(abs_path, "wb") as fh:
            fh.write(data)

    return rel_path
