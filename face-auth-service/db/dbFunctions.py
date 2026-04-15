import os
import psycopg2
import sys
from dotenv import load_dotenv
from psycopg2.extras import execute_values


DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
MOCK_STUDENTS = [
    ("Bryce", "55"),
    ("Eneojo", "56"),
    ("Roman", "57"),
    ("Taras", "58"),
    ("Taron", "59"),
]


def parse_student_identity(filename_stem):
    parts = filename_stem.split("_", 1)

    if len(parts) == 2 and parts[0].isdigit():
        student_code = parts[0]
        display_name = parts[1].replace("_", " ").strip()
        if display_name:
            return display_name, student_code

    display_name = filename_stem.replace("_", " ").strip()
    return display_name, filename_stem.upper()


def connect_to_postgres():
    
    load_dotenv()
    try: 
        connection_string = os.getenv("DB_CONNECTION")
        print('Connecting to the Psql database...')
        connection = psycopg2.connect(connection_string)
        return connection

    except psycopg2.DatabaseError as error:
        print(f"Database error: {error}")
        sys.exit(1)


def bootstrap_db():  
    conn = None
    try:
        conn = connect_to_postgres()
        db_cursor = conn.cursor()

        db_cursor.execute("""
        CREATE EXTENSION IF NOT EXISTS "pgcrypto";

        CREATE TABLE IF NOT EXISTS students (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        student_code TEXT UNIQUE,
        face_image BYTEA,
        face_image_filename TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS teachers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        password TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS class_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
        start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_time TIMESTAMP,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS attendance (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID NOT NULL,
        session_id UUID NOT NULL,
        first_check_in TIMESTAMP,
        fifteen_min_confirm TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (session_id) REFERENCES class_sessions(id) ON DELETE CASCADE,
        UNIQUE(student_id, session_id)
        );
        """)

        db_cursor.execute(
            """
            ALTER TABLE students
            ADD COLUMN IF NOT EXISTS student_code TEXT UNIQUE
            """
        )
        db_cursor.execute(
            """
            ALTER TABLE students
            ADD COLUMN IF NOT EXISTS face_image_filename TEXT
            """
        )
        db_cursor.execute(
            """
            ALTER TABLE class_sessions
            ADD COLUMN IF NOT EXISTS end_time TIMESTAMP
            """
        )
        db_cursor.execute(
            """
            ALTER TABLE class_sessions
            ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
            """
        )
        db_cursor.execute(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS one_active_session_per_teacher
            ON class_sessions (teacher_id)
            WHERE status = 'active'
            """
        )

        seed_mock_students(db_cursor)
        seed_student_faces(db_cursor)

        conn.commit()
        conn.close()
        return True
    
    except Exception as e:
        print("Database initialization failed:", e)
        if conn:
            conn.rollback()
        return False


def test_postgres_connection():
    load_dotenv()
    try:
        connection = psycopg2.connect(os.getenv("DB_CONNECTION"))
        cursor = connection.cursor()
        cursor.execute("SELECT version()")
        print(cursor.fetchone())
    except psycopg2.DatabaseError as error:
        print(f"Database error: {error}")
        sys.exit(1)
    finally:
        connection.close()
        return True


def seed_student_faces(db_cursor):
    if not os.path.isdir(DATA_DIR):
        return

    rows = []
    for filename in sorted(os.listdir(DATA_DIR)):
        file_path = os.path.join(DATA_DIR, filename)
        if not os.path.isfile(file_path):
            continue

        stem, extension = os.path.splitext(filename)
        if extension.lower() not in {".jpg", ".jpeg", ".png"}:
            continue

        display_name, student_code = parse_student_identity(stem)

        with open(file_path, "rb") as image_file:
            image_bytes = image_file.read()

        rows.append((display_name, student_code, psycopg2.Binary(image_bytes), filename))

    if not rows:
        return

    execute_values(
        db_cursor,
        """
        INSERT INTO students (name, student_code, face_image, face_image_filename)
        VALUES %s
        ON CONFLICT (student_code) DO UPDATE SET
            name = EXCLUDED.name,
            face_image = EXCLUDED.face_image,
            face_image_filename = EXCLUDED.face_image_filename
        """,
        rows,
    )


def seed_mock_students(db_cursor):
    execute_values(
        db_cursor,
        """
        INSERT INTO students (name, student_code)
        VALUES %s
        ON CONFLICT (student_code) DO UPDATE SET
            name = EXCLUDED.name
        """,
        MOCK_STUDENTS,
    )



    
