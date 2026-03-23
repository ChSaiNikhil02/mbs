from pydantic import BaseModel

PREDEFINED_CATEGORIES = [
    "Food & Dining",
    "Shopping",
    "Transportation",
    "Bills & Utilities",
    "Entertainment",
    "Health & Fitness",
    "Travel",
    "Income",
    "Transfer",
    "Other"
]

class MonthlySummary(BaseModel):
    month: str
    credit: float
    debit: float
