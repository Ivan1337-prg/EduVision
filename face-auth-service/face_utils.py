from io import BytesIO
import importlib

from fastapi import HTTPException
import numpy as np
from PIL import Image, ImageEnhance, ImageOps

try:
    face_recognition = importlib.import_module("face_recognition")
except ImportError:
    face_recognition = None


MATCH_DISTANCE_THRESHOLD = 0.58
MAX_IMAGE_DIMENSION = 1600
LIVE_NUM_JITTERS = 2
STORED_NUM_JITTERS = 1


def decode_image_from_binary(image_bytes: bytes):
    if not image_bytes:
        raise HTTPException(status_code=400, detail="image body is empty")

    if face_recognition is None:
        raise HTTPException(status_code=500, detail="face_recognition dependencies not installed lol")

    try:
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        image.thumbnail((MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION))
        return image
    except Exception as exc:
        raise HTTPException(status_code=400, detail="could not decode image") from exc


def build_image_variants(image: Image.Image, *, include_mirror: bool):
    variants = []

    def add_variant(candidate: Image.Image):
        candidate_array = np.array(candidate)
        if any(np.array_equal(candidate_array, existing) for existing in variants):
            return
        variants.append(candidate_array)

    add_variant(image)

    normalized_image = ImageOps.autocontrast(image)
    add_variant(normalized_image)
    add_variant(ImageOps.equalize(image))
    add_variant(ImageEnhance.Brightness(normalized_image).enhance(1.15))

    if include_mirror:
        mirrored_image = ImageOps.mirror(image)
        add_variant(mirrored_image)
        add_variant(ImageOps.autocontrast(mirrored_image))

    return variants


def select_primary_face_location(face_locations):
    if not face_locations:
        return None

    return max(
        face_locations,
        key=lambda location: max(0, location[2] - location[0]) * max(0, location[1] - location[3]),
    )


def extract_face_encodings(image_bytes: bytes, *, image_label: str, include_mirror: bool, num_jitters: int):
    image = decode_image_from_binary(image_bytes)
    candidate_encodings = []

    for image_variant in build_image_variants(image, include_mirror=include_mirror):
        face_locations = face_recognition.face_locations(image_variant, model="hog")
        primary_face_location = select_primary_face_location(face_locations)

        if primary_face_location is None:
            continue

        encodings = face_recognition.face_encodings(
            image_variant,
            known_face_locations=[primary_face_location],
            num_jitters=num_jitters,
        )
        if encodings:
            candidate_encodings.append(encodings[0])

    if not candidate_encodings:
        raise HTTPException(status_code=400, detail=f"No clear face was detected in the {image_label} image. Move into better light, look straight at the camera, and try again.")

    return candidate_encodings


def compare_student_face(live_image_bytes: bytes, stored_image_bytes: bytes):
    if not live_image_bytes:
        raise HTTPException(status_code=400, detail="image body is empty")

    live_encodings = extract_face_encodings(
        live_image_bytes,
        image_label="live",
        include_mirror=True,
        num_jitters=LIVE_NUM_JITTERS,
    )
    stored_encodings = extract_face_encodings(
        bytes(stored_image_bytes),
        image_label="stored",
        include_mirror=False,
        num_jitters=STORED_NUM_JITTERS,
    )

    face_distance = min(
        float(face_recognition.face_distance([stored_encoding], live_encoding)[0])
        for stored_encoding in stored_encodings
        for live_encoding in live_encodings
    )
    confidence_score = max(0.0, 1.0 - face_distance)
    matched = face_distance <= MATCH_DISTANCE_THRESHOLD

    return matched, round(confidence_score, 4)
