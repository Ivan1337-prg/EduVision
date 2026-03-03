from pydantic import BaseModel

class TeacherRegisterRequest(BaseModel):
    name: str
    email: str
    password: str


