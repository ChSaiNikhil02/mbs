from sqlalchemy.orm import Session
from typing import Generic, TypeVar, Type, List, Optional

T = TypeVar("T")

class BaseRepository(Generic[T]):
    def __init__(self, model: Type[T], db: Session):
        self.model = model
        self.db = db

    def get(self, id: int) -> Optional[T]:
        return self.db.query(self.model).filter(self.model.id == id).first()

    def all(self) -> List[T]:
        return self.db.query(self.model).all()

    def create(self, obj_in) -> T:
        db_obj = self.model(**obj_in)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def delete(self, id: int):
        obj = self.get(id)
        if obj:
            self.db.delete(obj)
            self.db.commit()
        return obj
