from dbConnect import connect_to_postgres

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
        
    
    
