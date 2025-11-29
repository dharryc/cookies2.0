from pydantic import BaseModel, model_validator
from typing import Optional

class ItemDTO(BaseModel):
    item_name: str
    upper_price: Optional[int] = None
    lower_price: Optional[int] = None
    link: Optional[str] = None
    description: Optional[str] = None
    item_priority: Optional[int] = 1

    @model_validator(mode='after')
    def link_or_description_must_exist(self):
        link = self.link
        desc = self.description

        def nonempty(s):
            return s is not None and isinstance(s, str) and s.strip() != ""

        if not (nonempty(link) or nonempty(desc)):
            raise ValueError("either link or description must be provided and non-empty")
        return self


class Item(BaseModel):
    id: int
    user_id: int
    price_range_id: Optional[int] = None
    link: Optional[str] = None
    description: Optional[str] = None
    purchased: bool
    item_priority: int = 1
    
    @model_validator(mode='after')
    def link_or_description_must_exist(self):
        link = self.link
        desc = self.description

        def nonempty(s):
            return s is not None and isinstance(s, str) and s.strip() != ""

        if not (nonempty(link) or nonempty(desc)):
            raise ValueError("either link or description must be provided and non-empty")
        return self