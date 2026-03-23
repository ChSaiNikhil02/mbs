import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.rule_engine import RuleEngine

class MockCategoryRule:
    def __init__(self, keyword, merchant_name, category):
        self.keyword = keyword
        self.merchant_name = merchant_name
        self.category = category

def test_matching_priority():
    rules = [
        MockCategoryRule("Coffee", None, "Keyword Match"),
        MockCategoryRule(None, "Starbucks", "Exact Merchant"),
        MockCategoryRule(None, "Star", "Partial Merchant"),
    ]

    # Priority 1: Exact Merchant Match
    assert RuleEngine.apply_rules("Morning Coffee", "Starbucks", rules, False) == "Exact Merchant"

    # Priority 2: Partial Merchant Match (Longest match "Starbucks" should win over "Star" for "Starbucks Coffee")
    assert RuleEngine.apply_rules("Misc", "Starbucks Coffee", rules, False) == "Exact Merchant"

    # Priority 3: Keyword Match
    assert RuleEngine.apply_rules("Morning Coffee", "Random Shop", rules, False) == "Keyword Match"

def test_normalization_and_nulls():
    rules = [MockCategoryRule("Uber", "Uber", "Transport")]

    # Case insensitivity and Whitespace
    assert RuleEngine.apply_rules(" uber ride ", "  UBER  ", rules, False) == "Transport"

    # Null handling
    assert RuleEngine.apply_rules(None, None, rules, False) == "Uncategorized"

def test_income_override():
    rules = [MockCategoryRule("Salary", "Employer", "Work")]
    assert RuleEngine.apply_rules("Salary", "Employer", rules, True) == "Income"

if __name__ == "__main__":
    test_matching_priority()
    test_normalization_and_nulls()
    test_income_override()
    print("Rule Engine implementation verified successfully!")
