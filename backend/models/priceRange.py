from pydantic import BaseModel

class PriceRangeDTO(BaseModel):
    name: str
    min_price: float
    max_price: float
    
class PriceRange(BaseModel):
    id: int
    name: str
    min_price: float
    max_price: float