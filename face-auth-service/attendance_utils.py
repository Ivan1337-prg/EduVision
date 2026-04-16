from fastapi import HTTPException
from psycopg2.extras import execute_values


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


def ensure_session_exists_and_active(db_cursor, session_id: str):
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

    return session_row


def get_student_by_code(db_cursor, student_code: str):
    normalized_student_code = student_code.strip().upper()
    db_cursor.execute(
        """
        SELECT id, name, student_code, face_image
        FROM students
        WHERE student_code = %s
        """,
        (normalized_student_code,)
    )
    student = db_cursor.fetchone()

    if not student:
        raise HTTPException(status_code=404, detail="student not found")

    if not student[3]:
        raise HTTPException(status_code=400, detail="student has no stored face image")

    return student


def seed_attendance_for_session(db_cursor, session_id):
    db_cursor.execute("SELECT id FROM students ORDER BY name ASC")
    student_rows = db_cursor.fetchall()

    if not student_rows:
        return

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
