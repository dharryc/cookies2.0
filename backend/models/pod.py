from pydantic import BaseModel
from typing import Optional


class Pod(BaseModel):
    id: int
    name: str
    
class PodCreateDTO(BaseModel):
    name: str
    members_to_add_by_id: Optional[list[int]] = None