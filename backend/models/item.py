from pydantic import BaseModel
from typing import Optional, Annotated

class ItemDTO(BaseModel):
    userName: str
    price_range_id: Optional[int] = None
    link: Optional[str] = None
    description: Optional[str] = None

    @root_validator
    def link_or_description_must_exist(cls, values):
        link = values.get("link")
        desc = values.get("description")

        def nonempty(s):
            return s is not None and isinstance(s, str) and s.strip() != ""

        if not (nonempty(link) or nonempty(desc)):
            raise ValueError("either link or description must be provided and non-empty")
        return values


class Item(BaseModel):
    id: int
    user_id: int
    price_range_id: Optional[int] = None
    link: Optional[str] = None
    description: Optional[str] = None
    purchased: bool
    
    @root_validator
    def link_or_description_must_exist(cls, values):
        link = values.get("link")
        desc = values.get("description")

        def nonempty(s):
            return s is not None and isinstance(s, str) and s.strip() != ""

        if not (nonempty(link) or nonempty(desc)):
            raise ValueError("either link or description must be provided and non-empty")
        return values