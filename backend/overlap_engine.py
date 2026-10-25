import re
from typing import Dict, List, Any, Optional, Tuple
from rapidfuzz import fuzz

COMMON_ABBREVIATIONS = {
    r"\binst\b|\binste\b|\binstt\b": "institute",
    r"\bengg\b|\beng\b|\bengineer\b": "engineering",
    r"\btech\b|\btechno\b": "technology",
    r"\bcol\b|\bcoll\b|\bclg\b": "college",
    r"\buniv\b|\bvar\b": "university",
    r"\bmgmt\b|\bmgt\b": "management",
    r"\bdept\b": "department",
    r"\bsci\b|\bsc\b": "sciences",
    r"\bpoly\b": "polytechnic",
    r"\bgovt\b": "government",
    r"\badv\b": "advanced",
    r"\bnatl\b": "national",
    r"\bacad\b": "academy",
    r"\bint\b|\bintl\b": "international",
    r"&": "and"
}

STOP_WORDS = {"of", "the", "for", "and", "in", "at", "to", "a", "an"}

CATEGORY_RELATIONS = {
    "faculty_salary": ["unapproved_courses", "approval_eoa_dispute", "compliance_deficiency", "financial_irregularity", "court_litigation"],
    "unapproved_courses": ["faculty_salary", "capitation_fee", "approval_eoa_dispute", "infrastructure_deficiency", "court_litigation"],
    "capitation_fee": ["fee_refund", "unapproved_courses", "financial_irregularity", "court_litigation"],
    "fee_refund": ["capitation_fee", "unapproved_courses", "ragging_harassment"],
    "court_litigation": ["approval_eoa_dispute", "unapproved_courses", "faculty_salary"],
    "approval_eoa_dispute": ["court_litigation", "unapproved_courses", "infrastructure_deficiency", "faculty_salary"],
    "ragging_harassment": ["unapproved_courses", "infrastructure_deficiency"],
    "infrastructure_deficiency": ["unapproved_courses", "approval_eoa_dispute"]
}

KEYWORDS_WEIGHT = {
    "salary": 1.8,
    "payment": 1.4,
    "pf": 1.6,
    "dues": 1.3,
    "fee": 1.4,
    "capitation": 2.0,
    "admission": 1.5,
    "quota": 1.4,
    "infrastructure": 1.4,
    "laboratory": 1.4,
    "lab": 1.3,
    "equipment": 1.3,
    "approval": 1.6,
    "eoa": 1.7,
    "retention": 1.4,
    "deficiency": 1.5,
    "ragging": 2.2,
    "harassment": 1.9,
    "hostel": 1.3,
    "safety": 1.4,
    "faculty": 1.6,
    "teachers": 1.5,
    "students": 1.3,
    "intake": 1.5,
    "unapproved": 1.9,
    "unauthorized": 1.8,
    "notice": 1.3,
    "stf": 2.2,
    "forged": 2.0,
    "writ": 1.8,
    "petition": 1.7
}


def normalize_institution_name(name: str) -> str:
    """Standardize institution name by lowercasing, expanding abbreviations, removing punctuation."""
    if not name:
        return ""
    text = name.lower()
    text = re.sub(r"[^\w\s&]", " ", text)
    for pattern, replacement in COMMON_ABBREVIATIONS.items():
        text = re.sub(pattern, replacement, text)
    tokens = [w for w in text.split() if w not in STOP_WORDS]
    return " ".join(tokens)


class EntityResolutionEngine:
    """Tiers 1-4 Institution Entity Resolution"""

    def __init__(self, institutions: List[Dict[str, Any]]):
        self.institutions = institutions

    def resolve(self, input_id: Optional[str], input_name: str, district: Optional[str] = None, state: Optional[str] = None) -> Dict[str, Any]:
        """
        Attempts to resolve an institution given an ID and/or name.
        Returns matched institution info, match tier, and confidence score.
        """
        # Tier 1: Exact Match on AICTE Permanent ID
        if input_id:
            for inst in self.institutions:
                if inst.get("aicte_permanent_id", "").strip().lower() == input_id.strip().lower():
                    return {
                        "matched": True,
                        "institution": inst,
                        "confidence": 1.0,
                        "tier": "Tier 1: Exact AICTE Permanent ID Match",
                        "explanation": f"Exact match on AICTE Permanent ID {input_id}"
                    }

        norm_input_name = normalize_institution_name(input_name)

        # Tier 2: Exact Match on Aliases
        for inst in self.institutions:
            aliases = inst.get("aliases", [])
            for alias in aliases:
                if normalize_institution_name(alias) == norm_input_name:
                    return {
                        "matched": True,
                        "institution": inst,
                        "confidence": 0.98,
                        "tier": "Tier 2: Known Alias Match",
                        "explanation": f"Input matched verified alias '{alias}' for {inst['name']}"
                    }

        # Tier 3: Fuzzy Name + Token Set Ratio + Address Agreement
        best_match = None
        best_score = 0.0
        best_tier_explanation = ""

        for inst in self.institutions:
            norm_inst_name = normalize_institution_name(inst["name"])
            
            token_set = fuzz.token_set_ratio(norm_input_name, norm_inst_name) / 100.0
            partial = fuzz.partial_ratio(norm_input_name, norm_inst_name) / 100.0
            ratio = fuzz.ratio(norm_input_name, norm_inst_name) / 100.0
            name_score = (token_set * 0.5) + (partial * 0.3) + (ratio * 0.2)

            # Check alias fuzzy match
            alias_best = 0.0
            matched_alias_name = ""
            for alias in inst.get("aliases", []):
                norm_alias = normalize_institution_name(alias)
                a_score = fuzz.token_set_ratio(norm_input_name, norm_alias) / 100.0
                if a_score > alias_best:
                    alias_best = a_score
                    matched_alias_name = alias
            
            effective_name_score = max(name_score, alias_best)

            # Address support boost
            address_boost = 0.0
            if district and inst.get("district") and district.lower() == inst["district"].lower():
                address_boost += 0.08
            if state and inst.get("state") and state.lower() == inst["state"].lower():
                address_boost += 0.07

            total_score = min(1.0, (effective_name_score * 0.85) + address_boost)

            if total_score > best_score:
                best_score = total_score
                best_match = inst
                best_tier_explanation = f"Fuzzy matching on '{inst['name']}' (Sim: {effective_name_score:.2f}, Addr Boost: {address_boost:.2f})"
                if matched_alias_name and alias_best > name_score:
                    best_tier_explanation += f" via alias '{matched_alias_name}'"

        if best_match and best_score >= 0.70:
            tier_label = "Tier 3: Fuzzy Match & Address Correlation" if best_score >= 0.80 else "Tier 4: Probable Match (Steward Review Recommended)"
            return {
                "matched": True,
                "institution": best_match,
                "confidence": round(best_score, 3),
                "tier": tier_label,
                "explanation": best_tier_explanation
            }

        return {
            "matched": False,
            "institution": None,
            "confidence": round(best_score, 3),
            "tier": "Unresolved",
            "explanation": "No institution matched above confidence threshold 0.70"
        }


class OverlapDetectionEngine:
    """Cross-Bureau Overlap Detection & Explainability Engine"""

    def __init__(self, institutions_map: Dict[str, Dict[str, Any]]):
        self.institutions_map = institutions_map

    def check_overlap(self, case_a: Dict[str, Any], case_b: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Calculates cross-bureau overlap between two cases.
        Returns detailed scoring and explainability signals if candidate.
        """
        # Gate 1: Same Resolved Institution
        inst_a = case_a.get("institution_id")
        inst_b = case_b.get("institution_id")
        if not inst_a or not inst_b or inst_a != inst_b:
            return None

        # Gate 2: Cross-Bureau or Cross-Cell
        bureau_a = case_a.get("bureau_code")
        bureau_b = case_b.get("bureau_code")
        if bureau_a == bureau_b:
            return None

        # Gate 3: Both Open (not Disposed)
        if case_a.get("status") == "Disposed" or case_b.get("status") == "Disposed":
            return None

        # Feature 1: Category Relationship (Weight 25%)
        cat_a = case_a.get("category", "").lower()
        cat_b = case_b.get("category", "").lower()
        cat_score = 0.0
        if cat_a == cat_b:
            cat_score = 1.0
        elif cat_b in CATEGORY_RELATIONS.get(cat_a, []) or cat_a in CATEGORY_RELATIONS.get(cat_b, []):
            cat_score = 0.75
        else:
            cat_score = 0.20

        # Feature 2: Text / Description Semantic & Token Similarity (Weight 35%)
        text_a = f"{case_a.get('summary', '')} {case_a.get('description', '')}".lower()
        text_b = f"{case_b.get('summary', '')} {case_b.get('description', '')}".lower()
        
        sim_token_sort = fuzz.token_sort_ratio(text_a, text_b) / 100.0
        sim_token_set = fuzz.token_set_ratio(text_a, text_b) / 100.0
        text_score = (sim_token_sort * 0.4) + (sim_token_set * 0.6)

        # Feature 3: Time Proximity (Weight 15%)
        days_diff = abs((case_a.get("received_days_ago", 0)) - (case_b.get("received_days_ago", 0)))
        if days_diff <= 15:
            time_score = 1.0
        elif days_diff <= 45:
            time_score = 0.85
        elif days_diff <= 90:
            time_score = 0.65
        elif days_diff <= 180:
            time_score = 0.40
        else:
            time_score = 0.15

        # Feature 4: Shared Key Allegation Keywords (Weight 15%)
        shared_keywords = []
        kw_score_accum = 0.0
        for kw, weight in KEYWORDS_WEIGHT.items():
            if kw in text_a and kw in text_b:
                shared_keywords.append(kw)
                kw_score_accum += weight

        kw_score = min(1.0, kw_score_accum / 3.5)

        # Feature 5: Regulatory Action Impact (Weight 10%)
        action_score = 0.5
        if case_a.get("priority") == "High" or case_b.get("priority") == "High":
            action_score = 0.9
        elif case_a.get("status") == "Action Initiated" or case_b.get("status") == "Action Initiated":
            action_score = 0.85

        # Composite Multi-Factor Score
        composite_score = (
            (cat_score * 0.25) +
            (text_score * 0.35) +
            (time_score * 0.15) +
            (kw_score * 0.15) +
            (action_score * 0.10)
        )

        composite_score = round(composite_score, 3)

        if composite_score < 0.45:
            return None

        # Level classification
        if composite_score >= 0.75:
            level = "HIGH"
            badge = "Potential Overlapping Cases – Coordination Required"
            badge_color = "red"
        elif composite_score >= 0.55:
            level = "MEDIUM"
            badge = "Related Cases – Review Recommended"
            badge_color = "amber"
        else:
            level = "NOTICE"
            badge = "Multiple Active Bureaus on Same Institution"
            badge_color = "blue"

        # Build Explainability Details
        inst_info = self.institutions_map.get(inst_a, {})
        reasons = []
        if cat_score >= 0.75:
            reasons.append(f"Identical or strongly correlated category: '{case_a.get('category_name')}' vs '{case_b.get('category_name')}'")
        if shared_keywords:
            reasons.append(f"Key overlapping allegations detected: {', '.join(shared_keywords[:5])}")
        if days_diff <= 60:
            reasons.append(f"Received within close time window ({days_diff} days apart)")
        if text_score >= 0.50:
            reasons.append(f"High semantic/allegation narrative similarity ({int(text_score * 100)}% text alignment)")

        # Recommended Lead Bureau
        if case_a.get("bureau_code") == "RB":
            suggested_lead = "Regulation Bureau (RB)"
            lead_reason = "RB possesses statutory regulatory jurisdiction to issue show-cause or withdrawal orders"
        elif case_b.get("bureau_code") == "RB":
            suggested_lead = "Regulation Bureau (RB)"
            lead_reason = "RB possesses statutory regulatory jurisdiction to issue show-cause or withdrawal orders"
        elif "RO" in case_a.get("bureau_code", "") or "RO" in case_b.get("bureau_code", ""):
            suggested_lead = "Public Grievance Redressal Cell (PGRC)"
            lead_reason = "PGRC coordinates central grievances while Regional Office executes physical inspections"
        else:
            suggested_lead = f"{case_a.get('bureau_name')} or {case_b.get('bureau_name')}"
            lead_reason = "Both bureaus hold equivalent operational stake"

        return {
            "alert_id": f"OVR-{case_a['id']}-{case_b['id']}",
            "institution_id": inst_a,
            "institution_name": inst_info.get("name", "Unknown"),
            "aicte_permanent_id": inst_info.get("aicte_permanent_id", ""),
            "case_a": case_a,
            "case_b": case_b,
            "score": composite_score,
            "level": level,
            "badge": badge,
            "badge_color": badge_color,
            "time_window_days": days_diff,
            "shared_keywords": shared_keywords,
            "reasons": reasons,
            "breakdown": {
                "category_similarity": round(cat_score, 2),
                "text_similarity": round(text_score, 2),
                "time_proximity": round(time_score, 2),
                "keyword_overlap": round(kw_score, 2),
                "action_priority": round(action_score, 2)
            },
            "suggested_lead_bureau": suggested_lead,
            "lead_reason": lead_reason,
            "coordination_status": "PENDING_COORDINATION",
            "decision": None,
            "lead_bureau": None,
            "thread": [
                {
                    "author": "CaseSync Overlap Engine",
                    "role": "System AI",
                    "timestamp": "Auto-Generated",
                    "message": f"Engine detected cross-bureau overlap score of {int(composite_score * 100)}% between {case_a['bureau_name']} ({case_a['id']}) and {case_b['bureau_name']} ({case_b['id']}). Recommended action: Designate lead bureau and link cases."
                }
            ]
        }
