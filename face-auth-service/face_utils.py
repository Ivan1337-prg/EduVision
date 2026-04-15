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
RELAXED_MATCH_DISTANCE_THRESHOLD = 0.66
MIN_DISTANCE_MARGIN = 0.05
MAX_IMAGE_DIMENSION = 1600
LIVE_NUM_JITTERS = 2
STORED_NUM_JITTERS = 1
UPSAMPLE_STEPS = (0, 1, 2)


def decode_image_from_binary(image_bytes: bytes):
    if not image_bytes:
        raise HTTPException(status_code=400, detail="image body is empty")

    if face_recognition is None:
        raise HTTPException(status_code=500, detail="face_recognition dependencies not installed lol")

    try:
        image = ImageOps.exif_transpose(Image.open(BytesIO(image_bytes))).convert("RGB")
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
        for upsample_count in UPSAMPLE_STEPS:
            face_locations = face_recognition.face_locations(
                image_variant,
                number_of_times_to_upsample=upsample_count,
                model="hog",
            )
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
                break

    if not candidate_encodings:
        raise HTTPException(status_code=400, detail=f"No clear face was detected in the {image_label} image. Move into better light, look straight at the camera, and try again.")

    return candidate_encodings


def calculate_best_face_distance(live_encodings, stored_image_bytes: bytes):
    stored_encodings = extract_face_encodings(
        bytes(stored_image_bytes),
        image_label="stored",
        include_mirror=False,
        num_jitters=STORED_NUM_JITTERS,
    )

    return min(
        float(face_recognition.face_distance([stored_encoding], live_encoding)[0])
        for stored_encoding in stored_encodings
        for live_encoding in live_encodings
    )


def compare_face_against_roster(live_image_bytes: bytes, student_rows):
    if not live_image_bytes:
        raise HTTPException(status_code=400, detail="image body is empty")

    live_encodings = extract_face_encodings(
        live_image_bytes,
        image_label="live",
        include_mirror=True,
        num_jitters=LIVE_NUM_JITTERS,
    )

    results = []
    for student_row in student_rows:
        student_id, student_name, student_code, stored_image_bytes = student_row
        face_distance = calculate_best_face_distance(live_encodings, stored_image_bytes)
        results.append(
            {
                "student_id": str(student_id),
                "student_name": student_name,
                "student_code": student_code,
                "face_distance": face_distance,
                "confidence_score": round(max(0.0, 1.0 - face_distance), 4),
            }
        )

    return sorted(results, key=lambda item: item["face_distance"])


def compare_student_face(live_image_bytes: bytes, stored_image_bytes: bytes):
    if not live_image_bytes:
        raise HTTPException(status_code=400, detail="image body is empty")

    live_encodings = extract_face_encodings(
        live_image_bytes,
        image_label="live",
        include_mirror=True,
        num_jitters=LIVE_NUM_JITTERS,
    )
    face_distance = calculate_best_face_distance(live_encodings, stored_image_bytes)
    confidence_score = max(0.0, 1.0 - face_distance)
    matched = face_distance <= MATCH_DISTANCE_THRESHOLD

    return matched, round(confidence_score, 4)


def is_confident_roster_match(match_results, target_student_code: str):
    target_result = next((item for item in match_results if item["student_code"] == target_student_code), None)
    if target_result is None:
        raise HTTPException(status_code=404, detail="student face reference not found")

    best_result = match_results[0] if match_results else None
    next_best_result = match_results[1] if len(match_results) > 1 else None

    if best_result is None or best_result["student_code"] != target_student_code:
        return False, target_result["confidence_score"]

    if target_result["face_distance"] <= MATCH_DISTANCE_THRESHOLD:
        return True, target_result["confidence_score"]

    if target_result["face_distance"] > RELAXED_MATCH_DISTANCE_THRESHOLD:
        return False, target_result["confidence_score"]

    if next_best_result is None:
        return True, target_result["confidence_score"]

    margin = next_best_result["face_distance"] - target_result["face_distance"]
    return margin >= MIN_DISTANCE_MARGIN, target_result["confidence_score"]
