import os
import psycopg2
import sys
from dotenv import load_dotenv


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
    try:
        conn = connect_to_postgres()
        db_cursor = conn.cursor()

        db_cursor.execute("""
        CREATE EXTENSION IF NOT EXISTS "pgcrypto";

        CREATE TABLE IF NOT EXISTS students (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        face_image BYTEA,
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
        start_time TIMESTAMP NOT NULL,
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

        


        conn.commit()
        conn.close()
        return True
    
    except Exception as e:
        print("Database initialization failed:", e)
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



    
