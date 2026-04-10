from pydantic import BaseModel

class StartSession(BaseModel):
    class_name: str | None = None

