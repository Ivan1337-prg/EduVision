from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from schemas import TeacherRegisterRequest
from db import test_postgres_connection, connect_to_postgres, bootstrap_db
import sys
import uvicorn
import bcrypt


app = FastAPI()


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
    return {"message": "Hello World"}
   # raise HTTPException(400, "No files provided")




@app.post("/")
async def start_session():
    return {"message": "Hello World"}
    #raise HTTPException(400, "No files provided")



@app.post("/sign-up")
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
        return {"message": "success"}

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




if __name__ == '__main__':
    if not test_postgres_connection():
        print("db connection failed. Shutting down.")
        sys.exit(1)

    if not bootstrap_db():
        print("db not ready for queries, shutting down.....")
        sys.exit(1)

    print("Database ready for queries.")
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)