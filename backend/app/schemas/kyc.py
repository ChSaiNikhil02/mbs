from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class KycDocumentBase(BaseModel):
    document_type: str
    file_name: str

class KycDocumentCreate(KycDocumentBase):
    pass

class KycDocument(KycDocumentBase):
    id: int
    user_id: int
    status: str
    rejection_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
