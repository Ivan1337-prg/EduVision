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


