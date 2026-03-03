from pydantic import BaseModel

class StartSession(BaseModel):
    email: str

