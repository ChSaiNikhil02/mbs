from typing import Optional, List
import app.models as models

class RuleEngine:
    @staticmethod
    def apply_rules(description: Optional[str], merchant: Optional[str], rules: List[models.CategoryRule], is_credit: bool) -> str:
        """
        Automatically assign transaction category using priority logic:
        1. Exact merchant match
        2. Partial merchant match (longest match wins)
        3. Keyword match in description (longest match wins)
        4. Default -> 'Uncategorized'
        """
        if is_credit:
            return "Income"
        
        # Normalize inputs
        desc_norm = (description or "").strip().lower()
        merch_norm = (merchant or "").strip().lower()

        if not desc_norm and not merch_norm:
            return "Uncategorized"

        # Filter rules that have merchant criteria
        merchant_rules = [r for r in rules if r.merchant_name]
        
        # 1. Exact Merchant Match
        if merch_norm:
            for rule in merchant_rules:
                if (rule.merchant_name or "").strip().lower() == merch_norm:
                    return rule.category

        # 2. Partial Merchant Match
        # To handle ambiguity (e.g. "Star" vs "Starbucks"), we prioritize the longest match
        if merch_norm:
            # Sort by length descending to find the most specific match first
            sorted_merch_rules = sorted(merchant_rules, key=lambda x: len(x.merchant_name or ""), reverse=True)
            for rule in sorted_merch_rules:
                rule_merch_norm = (rule.merchant_name or "").strip().lower()
                if rule_merch_norm in merch_norm:
                    return rule.category

        # 3. Keyword Match in Description
        if desc_norm:
            # Sort all rules by keyword length descending
            sorted_keyword_rules = sorted(rules, key=lambda x: len(x.keyword or ""), reverse=True)
            for rule in sorted_keyword_rules:
                rule_key_norm = (rule.keyword or "").strip().lower()
                if rule_key_norm and rule_key_norm in desc_norm:
                    return rule.category

        return "Uncategorized"
