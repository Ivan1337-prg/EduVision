from pydantic import BaseModel

class TeacherRegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class TeacherLoginRequest(BaseModel):
    email: str
    password : str