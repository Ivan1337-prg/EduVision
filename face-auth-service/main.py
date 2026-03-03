from fastapi import FastAPI, HTTPException,Request
from fastapi.middleware.cors import CORSMiddleware
from schemas import TeacherRegisterRequest,TeacherLoginRequest,StartSession
from db import test_postgres_connection, connect_to_postgres, bootstrap_db
import sys
import uvicorn
import bcrypt
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone
from jose import jwt


load_dotenv()
app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALG = os.environ["JWT_ALG"]
ACCESS_TOKEN_MINUTES = 60


def build_access_token(*, subject: str, teacher_id: str,name : str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,    
        "teacher_id": teacher_id,
        "name" : name,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=ACCESS_TOKEN_MINUTES)).timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)



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


    auth = request.headers.get("Authorization")

    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    token = auth.split(" ")[1]
    payload = jwt.decode(token, JWT_SECRET, algorithms=JWT_ALG)

    teacher_id: str = payload.get("teacher_id")
    name : str = payload.get("name")
    email : str = payload.get("subject")

    db_cursor.execute(
            "SELECT id FROM teachers WHERE id = %s",
            (teacher_id,)
        )
    teacher = db_cursor.fetchone()

    if not teacher:
        raise HTTPException(status_code=404, detail="Could not find account! Make sure to create account")
    
    # check here later if a teacher session already exist


    # random time will change at db level later
    start_time = "2021-07-03 16:21:12.357246"

    db_cursor.execute(
    """
    INSERT INTO class_sessions (teacher_id,start_time)
    VALUES (%s,%s) RETURNING id
     """,
    (teacher_id,start_time,)
    )
    # probably will add a constrain of teacher_id being unique to not have multiple sessions

    created_items = db_cursor.fetchone()
    session_id = created_items[0]


    # reduce the id of the class session to a small size


    print(f"this is session id{session_id}")
    return {"message": "session start",
            "session_id" : f"{session_id}"}
 
 except Exception as e:
     return {"message" : f"{e}"}
     

@app.delete("session/end-session")
async def end_session():
 try:
    #check payload , check if teacher has session running,
    #if teacher has no session running return cannot
    #if teacher has session running end it
    return {"message": "session end"}
 except Exception as e:
     pass



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