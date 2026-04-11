from fastapi import HTTPException

try:
    import cv2
    import numpy as np
except ImportError:
    cv2 = None
    np = None


def rebuild_image_from_binary(image_bytes: bytes):
    if not image_bytes:
        raise HTTPException(status_code=400, detail="image body is empty")

    if cv2 is None or np is None:
        raise HTTPException(status_code=500, detail="opencv dependencies are not installed")

    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    decoded_image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    if decoded_image is None:
        raise HTTPException(status_code=400, detail="could not decode image from binary body")

    return decoded_image


def compare_student_face(live_image_bytes: bytes, stored_image_bytes: bytes):
    live_image = rebuild_image_from_binary(live_image_bytes)
    stored_image = rebuild_image_from_binary(bytes(stored_image_bytes))

    live_gray = cv2.cvtColor(live_image, cv2.COLOR_BGR2GRAY)
    stored_gray = cv2.cvtColor(stored_image, cv2.COLOR_BGR2GRAY)

    live_gray = cv2.resize(live_gray, (256, 256))
    stored_gray = cv2.resize(stored_gray, (256, 256))

    live_hist = cv2.calcHist([live_gray], [0], None, [256], [0, 256])
    stored_hist = cv2.calcHist([stored_gray], [0], None, [256], [0, 256])

    cv2.normalize(live_hist, live_hist)
    cv2.normalize(stored_hist, stored_hist)

    confidence_score = float(cv2.compareHist(live_hist, stored_hist, cv2.HISTCMP_CORREL))
    matched = confidence_score >= 0.55

    return matched, round(confidence_score, 4)
