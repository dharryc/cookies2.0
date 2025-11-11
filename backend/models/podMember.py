from pydantic import BaseModel

class PodMemberDTO(BaseModel):
    user_id: int
    pod_id: int
    
class PodMember(BaseModel):
    id: int
    user_id: int
    pod_id: int