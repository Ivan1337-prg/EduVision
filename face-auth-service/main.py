from fastapi import FastAPI
from dbConnect import connect_to_postgres,test_postgres_connection
from bootstrap import bootstrap_db
import sys
app = FastAPI()




@app.get("/")
async def root():
    return {"message": "Hello World"}














if __name__ == '__main__':
    if not test_postgres_connection():
        print("db connection failed. Shutting down.")
        sys.exit(1)

    if not bootstrap_db():
        print("db not ready for queries, shutting down.....")
        sys.exit(1)

    print("Database ready for queries.")
