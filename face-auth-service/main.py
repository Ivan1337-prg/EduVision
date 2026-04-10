from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from schemas import TeacherRegisterRequest, TeacherLoginRequest, StartSession
from db import test_postgres_connection, connect_to_postgres, bootstrap_db
import sys
import uvicorn
import bcrypt
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from psycopg2.extras import execute_values

try:
    import cv2
    import numpy as np
except ImportError:
    cv2 = None
    np = None


load_dotenv()
app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALG = os.getenv("JWT_ALG")
ACCESS_TOKEN_MINUTES = 60


def get_jwt_settings():
    if not JWT_SECRET or not JWT_ALG:
        raise HTTPException(
            status_code=500,
            detail="JWT_SECRET and JWT_ALG must be set before using auth endpoints",
        )

    return JWT_SECRET, JWT_ALG


def build_access_token(*, subject: str, teacher_id: str, name: str) -> str:
    jwt_secret, jwt_alg = get_jwt_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "teacher_id": teacher_id,
        "name": name,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=ACCESS_TOKEN_MINUTES)).timestamp()),
    }
    return jwt.encode(payload, jwt_secret, algorithm=jwt_alg)


def get_teacher_payload(request: Request):
    auth = request.headers.get("Authorization")

    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")

    jwt_secret, jwt_alg = get_jwt_settings()
    token = auth.split(" ")[1]
    try:
        payload = jwt.decode(token, jwt_secret, algorithms=[jwt_alg])
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc

    teacher_id = payload.get("teacher_id")
    if not teacher_id:
        raise HTTPException(status_code=401, detail="teacher id missing from token")

    return payload


def get_active_session_for_teacher(db_cursor, teacher_id: str):
    db_cursor.execute(
        """
        SELECT id, teacher_id, start_time, end_time, status
        FROM class_sessions
        WHERE teacher_id = %s AND status = 'active'
        ORDER BY start_time DESC
        LIMIT 1
        """,
        (teacher_id,)
    )
    return db_cursor.fetchone()


def convert_attendance_row(row):
    return {
        "attendance_id": str(row[0]),
        "student_id": str(row[1]),
        "student_name": row[2],
        "student_code": row[3],
        "session_id": str(row[4]),
        "first_check_in": row[5].isoformat() if row[5] else None,
        "fifteen_min_confirm": row[6].isoformat() if row[6] else None,
        "status": "confirmed" if row[6] else "present" if row[5] else "pending",
    }


def fetch_session_attendance_rows(db_cursor, session_id: str):
    db_cursor.execute(
        """
        SELECT attendance.id,
               students.id,
               students.name,
               students.student_code,
               attendance.session_id,
               attendance.first_check_in,
               attendance.fifteen_min_confirm
        FROM attendance
        JOIN students ON students.id = attendance.student_id
        WHERE attendance.session_id = %s
        ORDER BY students.name ASC
        """,
        (session_id,)
    )
    rows = db_cursor.fetchall()
    return [convert_attendance_row(row) for row in rows]


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



"""
@app.post("/history", response_model=List[HistoryItem])
    async def get_history(request: HistoryRequest):
"""

@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.post("/session/start-session")
async def start_session(request: Request):
    conn = None
    db_cursor = None

    try:
        conn = connect_to_postgres()
        db_cursor = conn.cursor()

        payload = get_teacher_payload(request)
        teacher_id_value = payload.get("teacher_id")
        if not isinstance(teacher_id_value, str):
            raise HTTPException(status_code=401, detail="teacher id missing from token")
        teacher_id = teacher_id_value

        db_cursor.execute(
            "SELECT id, name, email FROM teachers WHERE id = %s",
            (teacher_id,)
        )
        teacher = db_cursor.fetchone()

        if not teacher:
            raise HTTPException(status_code=404, detail="Could not find account! Make sure to create account")

        active_session = get_active_session_for_teacher(db_cursor, teacher_id)
        if active_session:
            return {
                "message": "session already active",
                "session_id": f"{active_session[0]}",
                "status": active_session[4],
            }

        db_cursor.execute(
            """
            INSERT INTO class_sessions (teacher_id, start_time, status)
            VALUES (%s, CURRENT_TIMESTAMP, 'active')
            RETURNING id, start_time, status
            """,
            (teacher_id,)
        )

        created_session = db_cursor.fetchone()
        session_id = created_session[0]

        db_cursor.execute("SELECT id FROM students ORDER BY name ASC")
        student_rows = db_cursor.fetchall()

        if student_rows:
            attendance_seed_rows = [(student_row[0], session_id) for student_row in student_rows]
            execute_values(
                db_cursor,
                """
                INSERT INTO attendance (student_id, session_id)
                VALUES %s
                ON CONFLICT (student_id, session_id) DO NOTHING
                """,
                attendance_seed_rows
            )

        conn.commit()

        return {
            "message": "session start",
            "session_id": f"{session_id}",
            "start_time": created_session[1].isoformat() if created_session[1] else None,
            "status": created_session[2],
            "attendance": fetch_session_attendance_rows(db_cursor, session_id),
        }

    except HTTPException:
        if conn:
            conn.rollback()
        raise

    except Exception as e:
        if conn:
            conn.rollback()
        return {"message": f"{e}"}

    finally:
        if db_cursor:
            db_cursor.close()
        if conn:
            conn.close()


@app.get("/session/current")
async def current_session(request: Request):
    conn = None
    db_cursor = None

    try:
        conn = connect_to_postgres()
        db_cursor = conn.cursor()

        payload = get_teacher_payload(request)
        teacher_id_value = payload.get("teacher_id")
        if not isinstance(teacher_id_value, str):
            raise HTTPException(status_code=401, detail="teacher id missing from token")
        teacher_id = teacher_id_value

        active_session = get_active_session_for_teacher(db_cursor, teacher_id)
        if not active_session:
            return {"message": "no active session", "session": None}

        return {
            "message": "active session found",
            "session": {
                "session_id": str(active_session[0]),
                "teacher_id": str(active_session[1]),
                "start_time": active_session[2].isoformat() if active_session[2] else None,
                "end_time": active_session[3].isoformat() if active_session[3] else None,
                "status": active_session[4],
            },
            "attendance": fetch_session_attendance_rows(db_cursor, active_session[0]),
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"server problem {e}")

    finally:
        if db_cursor:
            db_cursor.close()
        if conn:
            conn.close()


@app.get("/session/{session_id}/attendance")
async def get_session_attendance(session_id: str):
    conn = None
    db_cursor = None

    try:
        conn = connect_to_postgres()
        db_cursor = conn.cursor()

        db_cursor.execute(
            "SELECT id FROM class_sessions WHERE id = %s",
            (session_id,)
        )
        if not db_cursor.fetchone():
            raise HTTPException(status_code=404, detail="session not found")

        return {
            "session_id": session_id,
            "attendance": fetch_session_attendance_rows(db_cursor, session_id),
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"server problem {e}")

    finally:
        if db_cursor:
            db_cursor.close()
        if conn:
            conn.close()


@app.post("/session/{session_id}/validate/{student_code}")
async def validate_student_face(session_id: str, student_code: str, request: Request):
    conn = None
    db_cursor = None

    try:
        conn = connect_to_postgres()
        db_cursor = conn.cursor()

        image_bytes = await request.body()

        db_cursor.execute(
            """
            SELECT id, status
            FROM class_sessions
            WHERE id = %s
            """,
            (session_id,)
        )
        session_row = db_cursor.fetchone()

        if not session_row:
            raise HTTPException(status_code=404, detail="session not found")

        if session_row[1] != "active":
            raise HTTPException(status_code=400, detail="session not started")

        db_cursor.execute(
            """
            SELECT id, name, student_code, face_image
            FROM students
            WHERE student_code = %s
            """,
            (student_code.upper(),)
        )
        student = db_cursor.fetchone()

        if not student:
            raise HTTPException(status_code=404, detail="student not found")

        if not student[3]:
            raise HTTPException(status_code=400, detail="student has no stored face image")

        matched, confidence_score = compare_student_face(image_bytes, student[3])
        if not matched:
            return {
                "message": "face verification failed",
                "matched": False,
                "confidence_score": confidence_score,
                "student_code": student[2],
                "student_name": student[1],
            }

        db_cursor.execute(
            """
            SELECT id, first_check_in, fifteen_min_confirm
            FROM attendance
            WHERE session_id = %s AND student_id = %s
            """,
            (session_id, student[0])
        )
        attendance_row = db_cursor.fetchone()

        if not attendance_row:
            db_cursor.execute(
                """
                INSERT INTO attendance (student_id, session_id, first_check_in)
                VALUES (%s, %s, CURRENT_TIMESTAMP)
                RETURNING id, first_check_in, fifteen_min_confirm
                """,
                (student[0], session_id)
            )
            attendance_row = db_cursor.fetchone()
            message = "check-in successful"
        elif not attendance_row[1]:
            db_cursor.execute(
                """
                UPDATE attendance
                SET first_check_in = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id, first_check_in, fifteen_min_confirm
                """,
                (attendance_row[0],)
            )
            attendance_row = db_cursor.fetchone()
            message = "check-in successful"
        elif attendance_row[2]:
            message = "attendance already confirmed"
        else:
            first_check_in = attendance_row[1]
            seconds_since_first_check = (datetime.utcnow() - first_check_in).total_seconds()

            if seconds_since_first_check < 900:
                return {
                    "message": "confirmation too early",
                    "matched": True,
                    "confidence_score": confidence_score,
                    "student_code": student[2],
                    "student_name": student[1],
                    "seconds_until_confirmation": int(900 - seconds_since_first_check),
                }

            db_cursor.execute(
                """
                UPDATE attendance
                SET fifteen_min_confirm = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id, first_check_in, fifteen_min_confirm
                """,
                (attendance_row[0],)
            )
            attendance_row = db_cursor.fetchone()
            message = "attendance confirmed"

        conn.commit()

        return {
            "message": message,
            "matched": True,
            "confidence_score": confidence_score,
            "student_code": student[2],
            "student_name": student[1],
            "session_id": session_id,
            "attendance": fetch_session_attendance_rows(db_cursor, session_id),
        }

    except HTTPException:
        if conn:
            conn.rollback()
        raise

    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=f"server problem {e}")

    finally:
        if db_cursor:
            db_cursor.close()
        if conn:
            conn.close()


@app.delete("/session/end-session")
async def end_session(request: Request):
    conn = None
    db_cursor = None

    try:
        conn = connect_to_postgres()
        db_cursor = conn.cursor()

        payload = get_teacher_payload(request)
        teacher_id_value = payload.get("teacher_id")
        if not isinstance(teacher_id_value, str):
            raise HTTPException(status_code=401, detail="teacher id missing from token")
        teacher_id = teacher_id_value

        active_session = get_active_session_for_teacher(db_cursor, teacher_id)
        if not active_session:
            raise HTTPException(status_code=404, detail="teacher has no active session")

        db_cursor.execute(
            """
            UPDATE class_sessions
            SET status = 'ended', end_time = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING id, end_time, status
            """,
            (active_session[0],)
        )
        ended_session = db_cursor.fetchone()
        conn.commit()

        return {
            "message": "session end",
            "session_id": str(ended_session[0]),
            "end_time": ended_session[1].isoformat() if ended_session[1] else None,
            "status": ended_session[2],
        }

    except HTTPException:
        if conn:
            conn.rollback()
        raise

    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=f"server problem {e}")

    finally:
        if db_cursor:
            db_cursor.close()
        if conn:
            conn.close()



@app.post("/auth/sign-up")
async def teacher_signup(request: TeacherRegisterRequest):
    conn = None
    db_cursor = None

    try:
        conn = connect_to_postgres()
        db_cursor = conn.cursor()

        db_cursor.execute(
            "SELECT id FROM teachers WHERE email = %s",
            (request.email.lower(),)
        )
        if db_cursor.fetchone():
            raise HTTPException(status_code=400, detail="email already registered")

        hashed_password = bcrypt.hashpw(
            request.password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        db_cursor.execute(
            """
            INSERT INTO teachers (name, email, password)
            VALUES (%s, %s, %s)
            """,
            (request.name, request.email.lower(), hashed_password)
        )

        conn.commit()
        return {"message": "success account signed up"}

    except HTTPException:
        if conn:
            conn.rollback()
        raise

    except Exception:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail="server problem")

    finally:
        if db_cursor:
            db_cursor.close()
        if conn:
            conn.close()







    #cursor.execute("SELECT id, name, email, created_at FROM teachers")
    #rows = cursor.fetchall()


@app.post("/auth/login")
async def teacher_login(request: TeacherLoginRequest):
    conn = None
    cursor = None

    try:
        conn = connect_to_postgres()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT id, email, password,name FROM teachers WHERE email = %s",
            (request.email.lower(),)
        )

        teacher = cursor.fetchone()

        if not teacher:
            raise HTTPException(status_code=404, detail="Email not found")

        teacher_id = teacher[0]
        email = teacher[1]
        stored_hash = teacher[2]
        name = teacher[3]

        if not bcrypt.checkpw(
            request.password.encode("utf-8"),
            stored_hash.encode("utf-8")
        ):
            raise HTTPException(status_code=401, detail="Incorrect password")

        token = build_access_token(
            subject=email,
            teacher_id=str(teacher_id),
            name=str(name)
        )

       #print(f"{teacher_id} {email} {stored_hash} {name}")

        return {
            "access_token": token
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"server problem {e}")

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()



if __name__ == '__main__':
    if not test_postgres_connection():
        print("db connection failed. Shutting down.")
        sys.exit(1)

    if not bootstrap_db():
        print("db not ready for queries, shutting down.....")
        sys.exit(1)

    print("Database ready for queries.")
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
