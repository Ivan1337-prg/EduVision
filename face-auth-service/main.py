from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from schemas import TeacherRegisterRequest, TeacherLoginRequest, StartSession
from db import test_postgres_connection, connect_to_postgres, bootstrap_db
from auth_utils import build_access_token, get_teacher_id_from_request
from attendance_utils import (
    ensure_session_exists_and_active,
    fetch_session_attendance_rows,
    get_active_session_for_teacher,
    get_student_by_code,
    seed_attendance_for_session,
)
from face_utils import compare_face_against_roster, is_confident_roster_match
import sys
import uvicorn
import bcrypt
from dotenv import load_dotenv
from datetime import datetime
import os

load_dotenv()
app = FastAPI()


def log_student_auth_step(message: str, *, session_id: str | None = None, student_code: str | None = None, student_name: str | None = None):
    log_parts = [
        f"[student-face-auth] {datetime.utcnow().isoformat(timespec='seconds')}",
        message,
    ]

    if session_id:
        log_parts.append(f"session_id={session_id}")
    if student_code:
        log_parts.append(f"student_code={student_code}")
    if student_name:
        log_parts.append(f"student_name={student_name}")

    print(" | ".join(log_parts), flush=True)


def log_teacher_signup_step(message: str, *, teacher_name: str | None = None, teacher_email: str | None = None):
    log_parts = [
        f"[teacher-signup] {datetime.utcnow().isoformat(timespec='seconds')}",
        message,
    ]

    if teacher_name:
        log_parts.append(f"teacher_name={teacher_name}")
    if teacher_email:
        log_parts.append(f"teacher_email={teacher_email}")

    print(" | ".join(log_parts), flush=True)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


"""
@app.post("/history", response_model=List[HistoryItem])
    async def get_history(request: HistoryRequest):
"""

@app.get("/")
async def root():
    return {"message": "backend running"}


@app.get("/health")
async def health():
    return {"message": "backend running"}


@app.post("/session/start-session")
async def start_session(request: Request):
    conn = None
    db_cursor = None

    try:
        conn = connect_to_postgres()
        db_cursor = conn.cursor()

        teacher_id = get_teacher_id_from_request(request)

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
        seed_attendance_for_session(db_cursor, session_id)

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

        teacher_id = get_teacher_id_from_request(request)

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

        db_cursor.execute("SELECT id FROM class_sessions WHERE id = %s", (session_id,))
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


@app.get("/session/{session_id}/student/{student_code}")
async def validate_student_session(session_id: str, student_code: str):
    conn = None
    db_cursor = None

    try:
        log_student_auth_step(
            "Student started session validation.",
            session_id=session_id,
            student_code=student_code,
        )
        conn = connect_to_postgres()
        db_cursor = conn.cursor()
        log_student_auth_step(
            "Database connection opened for session validation.",
            session_id=session_id,
            student_code=student_code,
        )

        ensure_session_exists_and_active(db_cursor, session_id)
        log_student_auth_step(
            "Session is active. Looking up student record.",
            session_id=session_id,
            student_code=student_code,
        )
        student = get_student_by_code(db_cursor, student_code)
        log_student_auth_step(
            f"Student {student[1]} with code {student[2]} was accepted. Loading attendance record.",
            session_id=session_id,
            student_code=student[2],
            student_name=student[1],
        )

        db_cursor.execute(
            """
            SELECT id, first_check_in, fifteen_min_confirm
            FROM attendance
            WHERE session_id = %s AND student_id = %s
            """,
            (session_id, student[0])
        )
        attendance_row = db_cursor.fetchone()
        log_student_auth_step(
            f"Student {student[1]} with code {student[2]} passed session validation successfully.",
            session_id=session_id,
            student_code=student[2],
            student_name=student[1],
        )

        return {
            "message": "student and session verified",
            "session_id": session_id,
            "student": {
                "student_id": str(student[0]),
                "student_name": student[1],
                "student_code": student[2],
            },
            "attendance": {
                "attendance_id": str(attendance_row[0]) if attendance_row else None,
                "first_check_in": attendance_row[1].isoformat() if attendance_row and attendance_row[1] else None,
                "fifteen_min_confirm": attendance_row[2].isoformat() if attendance_row and attendance_row[2] else None,
                "status": "confirmed" if attendance_row and attendance_row[2] else "present" if attendance_row and attendance_row[1] else "pending",
            },
        }

    except HTTPException as exc:
        log_student_auth_step(
            f"Student session validation failed: {exc.detail}",
            session_id=session_id,
            student_code=student_code,
        )
        raise

    except Exception as e:
        log_student_auth_step(
            f"Student session validation crashed: {e}",
            session_id=session_id,
            student_code=student_code,
        )
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
        log_student_auth_step(
            "Student started face validation.",
            session_id=session_id,
            student_code=student_code,
        )
        conn = connect_to_postgres()
        db_cursor = conn.cursor()
        log_student_auth_step(
            "Database connection opened for face validation.",
            session_id=session_id,
            student_code=student_code,
        )

        image_bytes = await request.body()
        log_student_auth_step(
            f"Received student image upload ({len(image_bytes)} bytes).",
            session_id=session_id,
            student_code=student_code,
        )
        ensure_session_exists_and_active(db_cursor, session_id)
        log_student_auth_step(
            "Session is active. Looking up student record.",
            session_id=session_id,
            student_code=student_code,
        )
        student = get_student_by_code(db_cursor, student_code)
        log_student_auth_step(
            f"Student {student[1]} with code {student[2]} was accepted. Preparing roster face comparison.",
            session_id=session_id,
            student_code=student[2],
            student_name=student[1],
        )

        db_cursor.execute(
            """
            SELECT id, name, student_code, face_image
            FROM students
            WHERE face_image IS NOT NULL
            """
        )
        roster_students = db_cursor.fetchall()
        log_student_auth_step(
            f"Loaded {len(roster_students)} students with stored face data. Comparing live image for student {student[1]} ({student[2]}).",
            session_id=session_id,
            student_code=student[2],
            student_name=student[1],
        )

        match_results = compare_face_against_roster(image_bytes, roster_students)
        matched, confidence_score, best_match = is_confident_roster_match(match_results, student[2])
        if not matched:
            mismatch_reason = "face_mismatch"
            message = "face verification failed"

            if best_match and best_match["student_code"] != student[2]:
                mismatch_reason = "student_id_face_mismatch"
                message = "scanned face does not match the entered student id"

            log_student_auth_step(
                f"Face validation failed for student {student[1]} ({student[2]}). reason={mismatch_reason} confidence={confidence_score}",
                session_id=session_id,
                student_code=student[2],
                student_name=student[1],
            )

            return {
                "message": message,
                "matched": False,
                "reason": mismatch_reason,
                "confidence_score": confidence_score,
                "student_code": student[2],
                "student_name": student[1],
                "best_match_student_code": best_match["student_code"] if best_match else None,
                "best_match_student_name": best_match["student_name"] if best_match else None,
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
        log_student_auth_step(
            f"Face matched successfully for student {student[1]} ({student[2]}). Checking attendance state.",
            session_id=session_id,
            student_code=student[2],
            student_name=student[1],
        )

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
            log_student_auth_step(
                f"Created attendance row and recorded first check-in for student {student[1]} ({student[2]}).",
                session_id=session_id,
                student_code=student[2],
                student_name=student[1],
            )
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
            log_student_auth_step(
                f"Updated existing attendance row with first check-in for student {student[1]} ({student[2]}).",
                session_id=session_id,
                student_code=student[2],
                student_name=student[1],
            )
        elif attendance_row[2]:
            message = "attendance already confirmed"
            log_student_auth_step(
                f"Attendance had already been confirmed earlier for student {student[1]} ({student[2]}).",
                session_id=session_id,
                student_code=student[2],
                student_name=student[1],
            )
        else:
            first_check_in = attendance_row[1]
            seconds_since_first_check = (datetime.utcnow() - first_check_in).total_seconds()

            if seconds_since_first_check < 900:
                log_student_auth_step(
                    f"Student {student[1]} ({student[2]}) tried to confirm too early. wait_seconds={int(900 - seconds_since_first_check)}",
                    session_id=session_id,
                    student_code=student[2],
                    student_name=student[1],
                )
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
            log_student_auth_step(
                f"Recorded fifteen-minute confirmation successfully for student {student[1]} ({student[2]}).",
                session_id=session_id,
                student_code=student[2],
                student_name=student[1],
            )

        conn.commit()
        log_student_auth_step(
            f"Student {student[1]} ({student[2]}) finished face validation successfully. message={message} confidence={confidence_score}",
            session_id=session_id,
            student_code=student[2],
            student_name=student[1],
        )

        return {
            "message": message,
            "matched": True,
            "confidence_score": confidence_score,
            "student_code": student[2],
            "student_name": student[1],
            "student_id": str(student[0]),
            "session_id": session_id,
            "attendance": fetch_session_attendance_rows(db_cursor, session_id),
        }

    except HTTPException as exc:
        if conn:
            conn.rollback()
        log_student_auth_step(
            f"Student face validation failed: {exc.detail}",
            session_id=session_id,
            student_code=student_code,
        )
        raise

    except Exception as e:
        if conn:
            conn.rollback()
        log_student_auth_step(
            f"Student face validation crashed: {e}",
            session_id=session_id,
            student_code=student_code,
        )
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

        teacher_id = get_teacher_id_from_request(request)

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
        log_teacher_signup_step(
            "Teacher account creation started.",
            teacher_name=request.name,
            teacher_email=request.email.lower(),
        )
        conn = connect_to_postgres()
        db_cursor = conn.cursor()
        log_teacher_signup_step(
            "Database connection opened for teacher signup.",
            teacher_name=request.name,
            teacher_email=request.email.lower(),
        )

        db_cursor.execute(
            "SELECT id FROM teachers WHERE email = %s",
            (request.email.lower(),)
        )
        if db_cursor.fetchone():
            log_teacher_signup_step(
                "Teacher signup failed because the email is already registered.",
                teacher_name=request.name,
                teacher_email=request.email.lower(),
            )
            raise HTTPException(status_code=400, detail="email already registered")

        log_teacher_signup_step(
            "Teacher email is available. Hashing password now.",
            teacher_name=request.name,
            teacher_email=request.email.lower(),
        )

        hashed_password = bcrypt.hashpw(
            request.password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")
        log_teacher_signup_step(
            "Password hashed successfully. Creating teacher account record.",
            teacher_name=request.name,
            teacher_email=request.email.lower(),
        )

        db_cursor.execute(
            """
            INSERT INTO teachers (name, email, password)
            VALUES (%s, %s, %s)
            """,
            (request.name, request.email.lower(), hashed_password)
        )

        conn.commit()
        log_teacher_signup_step(
            "Teacher account created successfully.",
            teacher_name=request.name,
            teacher_email=request.email.lower(),
        )
        return {"message": "success account signed up"}

    except HTTPException as exc:
        if conn:
            conn.rollback()
        log_teacher_signup_step(
            f"Teacher signup request failed: {exc.detail}",
            teacher_name=request.name,
            teacher_email=request.email.lower(),
        )
        raise

    except Exception as exc:
        if conn:
            conn.rollback()
        log_teacher_signup_step(
            f"Teacher signup crashed: {exc}",
            teacher_name=request.name,
            teacher_email=request.email.lower(),
        )
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
    port_value = os.getenv("PORT") or os.getenv("APP_PORT")
    if not port_value:
        print("PORT or APP_PORT must be set before starting the service.")
        sys.exit(1)

    port = int(port_value)
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
