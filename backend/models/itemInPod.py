from pydantic import BaseModel
from typing import Optional

class itemInPodDTO(BaseModel):
    item_id: int
    pod_id: int
    
class itemInPod(BaseModel):
    id: int
    item_id: int
    pod_id: int
    purchasing_user_id: Optional[int] = None