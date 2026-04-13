from pydantic import BaseModel

class StudentLoginRequest(BaseModel):
    student_code: str
    session_id: str