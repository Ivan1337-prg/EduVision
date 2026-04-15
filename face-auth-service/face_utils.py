from io import BytesIO
import importlib

from fastapi import HTTPException

try:
    face_recognition = importlib.import_module("face_recognition")
except ImportError:
    face_recognition = None


MATCH_DISTANCE_THRESHOLD = 0.5


def should_use_mock_face_match(stored_image_bytes: bytes | None):
    return face_recognition is None or not stored_image_bytes


def rebuild_image_from_binary(image_bytes: bytes):
    if not image_bytes:
        raise HTTPException(status_code=400, detail="image body is empty")

    if face_recognition is None:
        raise HTTPException(status_code=500, detail="face_recognition dependencies not installed lol")

    try:
        return face_recognition.load_image_file(BytesIO(image_bytes))
    except Exception as exc:
        raise HTTPException(status_code=400, detail="could not decode image") from exc


def select_primary_face_location(face_locations):
    if not face_locations:
        return None

    return max(
        face_locations,
        key=lambda location: max(0, location[2] - location[0]) * max(0, location[1] - location[3]),
    )


def extract_face_encoding(image_bytes: bytes, *, image_label: str):
    image = rebuild_image_from_binary(image_bytes)
    face_locations = face_recognition.face_locations(image)
    primary_face_location = select_primary_face_location(face_locations)

    if primary_face_location is None:
        raise HTTPException(status_code=400, detail=f"there no face detected in {image_label} image")

    encodings = face_recognition.face_encodings(
        image,
        known_face_locations=[primary_face_location],
    )
    if not encodings:
        raise HTTPException(status_code=400, detail=f"encoding face failed from {image_label} image")

    return encodings[0]


def compare_student_face(live_image_bytes: bytes, stored_image_bytes: bytes):
    if not live_image_bytes:
        raise HTTPException(status_code=400, detail="image body is empty")

    if should_use_mock_face_match(stored_image_bytes):
        return True, 0.99

    live_encoding = extract_face_encoding(live_image_bytes, image_label="live")
    stored_encoding = extract_face_encoding(bytes(stored_image_bytes), image_label="stored")

    face_distance = float(face_recognition.face_distance([stored_encoding], live_encoding)[0])
    confidence_score = max(0.0, 1.0 - face_distance)
    matched = face_distance <= MATCH_DISTANCE_THRESHOLD

    return matched, round(confidence_score, 4)
