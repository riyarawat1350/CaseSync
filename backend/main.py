from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import copy

from overlap_engine import EntityResolutionEngine, OverlapDetectionEngine, normalize_institution_name
from synthetic_data import INSTITUTIONS, BUREAUS, OFFICERS, CASES, calculate_sla_status

app = FastAPI(
    title="AICTE CaseSync API",
    description="Integrated Institution Complaint Monitoring & Coordination Dashboard Backend",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory working database initialized from synthetic fixtures
db_institutions = copy.deepcopy(INSTITUTIONS)
db_cases = copy.deepcopy(CASES)
db_overlaps: List[Dict[str, Any]] = []

institutions_map = {inst["id"]: inst for inst in db_institutions}
entity_resolver = EntityResolutionEngine(db_institutions)
overlap_detector = OverlapDetectionEngine(institutions_map)


def refresh_overlaps():
    """Scans all active open cases to compute cross-bureau overlaps."""
    global db_overlaps
    detected: List[Dict[str, Any]] = []
    seen_pairs = set()

    for i in range(len(db_cases)):
        for j in range(i + 1, len(db_cases)):
            case_a = db_cases[i]
            case_b = db_cases[j]
            pair_key = tuple(sorted([case_a["id"], case_b["id"]]))
            if pair_key in seen_pairs:
                continue
            seen_pairs.add(pair_key)

            # Enrich cases with SLA
            case_a_enriched = {**case_a, **calculate_sla_status(case_a)}
            case_b_enriched = {**case_b, **calculate_sla_status(case_b)}

            result = overlap_detector.check_overlap(case_a_enriched, case_b_enriched)
            if result:
                # Check if existing coordination thread exists
                existing = next((o for o in db_overlaps if o["alert_id"] == result["alert_id"]), None)
                if existing:
                    result["thread"] = existing.get("thread", result["thread"])
                    result["coordination_status"] = existing.get("coordination_status", result["coordination_status"])
                    result["lead_bureau"] = existing.get("lead_bureau", result["lead_bureau"])
                    result["decision"] = existing.get("decision", result["decision"])
                detected.append(result)

    # Sort high score first
    detected.sort(key=lambda x: x["score"], reverse=True)
    db_overlaps = detected


# Run initial detection on startup
refresh_overlaps()


# --- Pydantic Request Models ---
class ActionRequest(BaseModel):
    user_name: str
    bureau: str
    action_type: str
    remarks: str
    new_status: Optional[str] = None


class TransferRequest(BaseModel):
    user_name: str
    from_bureau: str
    to_bureau: str
    reason: str


class EscalateRequest(BaseModel):
    user_name: str
    bureau: str
    target_authority: str
    justification: str


class CoordinationMessageRequest(BaseModel):
    author: str
    role: str
    message: str
    action: Optional[str] = None  # e.g. "DESIGNATE_LEAD", "LINK_CASES", "MARK_DUPLICATE", "RESOLVE"
    lead_bureau: Optional[str] = None
    decision_notes: Optional[str] = None


class NewCaseRequest(BaseModel):
    institution_id: Optional[str] = None
    submitted_name: str
    category: str
    category_name: str
    summary: str
    description: str
    complainant_type: str
    source_channel: str
    bureau_code: str
    priority: str = "Medium"
    sla_days: int = 30


class EntityResolveRequest(BaseModel):
    input_id: Optional[str] = None
    input_name: str
    district: Optional[str] = None
    state: Optional[str] = None


# --- System & Personas ---
@app.get("/api/auth/personas")
def get_personas():
    return [
        {
            "id": "senior_mgmt",
            "name": "Prof. T. G. Sitharam",
            "role": "Chairman / Competent Authority",
            "bureau": "MGMT",
            "bureau_name": "Executive Management",
            "permissions": ["ALL_DATA_READ", "APPROVE_ESCALATIONS", "EXECUTIVE_REPORTS"]
        },
        {
            "id": "rb_officer",
            "name": "Shri Arvind Sharma",
            "role": "Director (Regulation)",
            "bureau": "RB",
            "bureau_name": "Regulation Bureau",
            "permissions": ["RB_CASES_FULL", "OVERLAP_COORDINATION", "PROPOSE_LEAD"]
        },
        {
            "id": "pgrc_officer",
            "name": "Dr. Sunita Verma",
            "role": "Deputy Director (Grievance)",
            "bureau": "PGRC",
            "bureau_name": "Public Grievance Redressal Cell",
            "permissions": ["PGRC_CASES_FULL", "OVERLAP_COORDINATION", "ACCEPT_LEAD"]
        },
        {
            "id": "ro_officer",
            "name": "Shri M. Sundaram",
            "role": "Regional Officer (Southern)",
            "bureau": "RO",
            "bureau_name": "Regional Office (South)",
            "permissions": ["RO_CASES_FULL", "FIELD_VERIFICATION", "REGION_REPORTS"]
        }
    ]


# --- Institutions & Institution 360 ---
@app.get("/api/institutions")
def list_institutions(search: Optional[str] = None, region: Optional[str] = None):
    results = []
    for inst in db_institutions:
        if region and inst.get("region", "").lower() != region.lower():
            continue
        
        # Calculate case counts for institution
        inst_cases = [c for c in db_cases if c["institution_id"] == inst["id"]]
        open_cases = [c for c in inst_cases if c["status"] != "Disposed"]
        active_bureaus = list(set([c["bureau_code"] for c in open_cases]))
        
        # Filter by search
        if search:
            query = search.strip().lower()
            match_name = query in inst["name"].lower()
            match_id = query in inst["aicte_permanent_id"].lower()
            match_alias = any(query in a.lower() for a in inst.get("aliases", []))
            if not (match_name or match_id or match_alias):
                continue

        results.append({
            **inst,
            "total_cases": len(inst_cases),
            "open_cases": len(open_cases),
            "active_bureaus": active_bureaus,
            "has_cross_bureau_activity": len(active_bureaus) > 1
        })
    return results


@app.get("/api/institutions/{inst_id}")
def get_institution_360(inst_id: str):
    inst = next((i for i in db_institutions if i["id"] == inst_id), None)
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")

    inst_cases = [
        {**c, **calculate_sla_status(c)}
        for c in db_cases
        if c["institution_id"] == inst_id
    ]

    # Find active overlaps for this institution
    inst_overlaps = [o for o in db_overlaps if o["institution_id"] == inst_id]

    # Bureau-wise breakdown
    bureau_breakdown = {}
    for c in inst_cases:
        b = c["bureau_name"]
        bureau_breakdown[b] = bureau_breakdown.get(b, 0) + 1

    return {
        "institution": inst,
        "cases": inst_cases,
        "overlaps": inst_overlaps,
        "bureau_breakdown": bureau_breakdown,
        "total_cases": len(inst_cases),
        "open_cases": len([c for c in inst_cases if c["status"] != "Disposed"]),
        "sla_breaches": len([c for c in inst_cases if c["sla_severity"] == "red"])
    }


@app.post("/api/institutions/resolve")
def resolve_institution(req: EntityResolveRequest):
    result = entity_resolver.resolve(
        input_id=req.input_id,
        input_name=req.input_name,
        district=req.district,
        state=req.state
    )
    return result


# --- Cases API ---
@app.get("/api/cases")
def list_cases(
    bureau: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    region: Optional[str] = None,
    search: Optional[str] = None
):
    results = []
    for c in db_cases:
        inst = institutions_map.get(c["institution_id"], {})

        if bureau and bureau.lower() != "all" and c["bureau_code"].lower() != bureau.lower():
            continue
        if status and status.lower() != "all" and c["status"].lower() != status.lower():
            continue
        if priority and priority.lower() != "all" and c["priority"].lower() != priority.lower():
            continue
        if region and region.lower() != "all" and inst.get("region", "").lower() != region.lower():
            continue

        if search:
            q = search.lower()
            text_match = (
                q in c["id"].lower() or
                q in c["summary"].lower() or
                q in c["description"].lower() or
                q in c.get("source_ref_no", "").lower() or
                q in inst.get("name", "").lower() or
                q in inst.get("aicte_permanent_id", "").lower()
            )
            if not text_match:
                continue

        enriched = {
            **c,
            "institution_name": inst.get("name", "Unknown"),
            "aicte_permanent_id": inst.get("aicte_permanent_id", ""),
            "region": inst.get("region", ""),
            **calculate_sla_status(c)
        }
        results.append(enriched)

    return results


@app.get("/api/cases/{case_id}")
def get_case(case_id: str):
    case = next((c for c in db_cases if c["id"] == case_id), None)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    inst = institutions_map.get(case["institution_id"], {})
    sla_info = calculate_sla_status(case)

    # Check for active overlaps involving this case
    related_overlaps = [
        o for o in db_overlaps
        if o["case_a"]["id"] == case_id or o["case_b"]["id"] == case_id
    ]

    return {
        **case,
        "institution": inst,
        "institution_name": inst.get("name"),
        "aicte_permanent_id": inst.get("aicte_permanent_id"),
        "region": inst.get("region"),
        **sla_info,
        "related_overlaps": related_overlaps
    }


@app.post("/api/cases/{case_id}/action")
def add_case_action(case_id: str, req: ActionRequest):
    case = next((c for c in db_cases if c["id"] == case_id), None)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    action_entry = {
        "timestamp": now_str,
        "by": req.user_name,
        "bureau": req.bureau,
        "action": req.action_type,
        "remarks": req.remarks
    }

    case.setdefault("actions_history", []).append(action_entry)
    case["last_action"] = f"{req.action_type}: {req.remarks}"

    if req.new_status:
        case["status"] = req.new_status

    refresh_overlaps()
    return {"success": True, "case": case}


@app.post("/api/cases/{case_id}/transfer")
def transfer_case(case_id: str, req: TransferRequest):
    case = next((c for c in db_cases if c["id"] == case_id), None)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    action_entry = {
        "timestamp": now_str,
        "by": req.user_name,
        "bureau": req.from_bureau,
        "action": f"Transferred to {req.to_bureau}",
        "remarks": req.reason
    }

    case.setdefault("actions_history", []).append(action_entry)
    case["bureau_code"] = req.to_bureau
    bureau_info = next((b for b in BUREAUS if b["code"] == req.to_bureau), None)
    if bureau_info:
        case["bureau_name"] = bureau_info["name"]
    case["status"] = "Transferred"
    case["last_action"] = f"Transferred from {req.from_bureau} to {req.to_bureau}: {req.reason}"

    refresh_overlaps()
    return {"success": True, "case": case}


@app.post("/api/cases/{case_id}/escalate")
def escalate_case(case_id: str, req: EscalateRequest):
    case = next((c for c in db_cases if c["id"] == case_id), None)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    action_entry = {
        "timestamp": now_str,
        "by": req.user_name,
        "bureau": req.bureau,
        "action": f"Escalated to {req.target_authority}",
        "remarks": req.justification
    }

    case.setdefault("actions_history", []).append(action_entry)
    case["status"] = "Escalated"
    case["priority"] = "High"
    case["last_action"] = f"Escalated to {req.target_authority}: {req.justification}"

    refresh_overlaps()
    return {"success": True, "case": case}


@app.post("/api/cases")
def create_case(req: NewCaseRequest):
    # Resolve institution if not provided
    inst_id = req.institution_id
    if not inst_id:
        res = entity_resolver.resolve(None, req.submitted_name)
        if res.get("matched") and res.get("institution"):
            inst_id = res["institution"]["id"]
        else:
            # Fallback to creating a new mock or linking to first
            inst_id = db_institutions[0]["id"]

    new_id = f"CS-2026-{req.bureau_code}-{len(db_cases) + 1:05d}"
    bureau_info = next((b for b in BUREAUS if b["code"] == req.bureau_code), None)
    b_name = bureau_info["name"] if bureau_info else req.bureau_code

    new_case = {
        "id": new_id,
        "source_ref_no": f"{req.bureau_code}-ONLINE-{len(db_cases) + 100}",
        "institution_id": inst_id,
        "submitted_name": req.submitted_name,
        "category": req.category,
        "category_name": req.category_name,
        "summary": req.summary,
        "description": req.description,
        "complainant_type": req.complainant_type,
        "source_channel": req.source_channel,
        "bureau_code": req.bureau_code,
        "bureau_name": b_name,
        "assigned_officer": "Assigned Officer",
        "status": "Received",
        "priority": req.priority,
        "received_days_ago": 0,
        "sla_days": req.sla_days,
        "last_action": "Case registered via portal",
        "next_action": "Initial scrutiny and verification",
        "actions_history": [
            {
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "by": "Portal Ingestion",
                "bureau": req.bureau_code,
                "action": "Case Registered",
                "remarks": "Automated intake via CaseSync connector."
            }
        ]
    }

    db_cases.insert(0, new_case)
    refresh_overlaps()
    return {"success": True, "case": new_case}


# --- Overlap & Coordination Engine (Feature 3) ---
@app.get("/api/overlaps")
def get_overlaps():
    return db_overlaps


@app.get("/api/overlaps/{alert_id}")
def get_overlap_detail(alert_id: str):
    overlap = next((o for o in db_overlaps if o["alert_id"] == alert_id), None)
    if not overlap:
        raise HTTPException(status_code=404, detail="Overlap alert not found")
    return overlap


@app.post("/api/overlaps/{alert_id}/coordinate")
def coordinate_overlap(alert_id: str, req: CoordinationMessageRequest):
    overlap = next((o for o in db_overlaps if o["alert_id"] == alert_id), None)
    if not overlap:
        raise HTTPException(status_code=404, detail="Overlap alert not found")

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    msg_entry = {
        "author": req.author,
        "role": req.role,
        "timestamp": now_str,
        "message": req.message,
        "action": req.action
    }
    overlap.setdefault("thread", []).append(msg_entry)

    if req.action == "DESIGNATE_LEAD":
        overlap["lead_bureau"] = req.lead_bureau
        overlap["coordination_status"] = "LEAD_DESIGNATED"
        overlap["decision"] = f"Lead Bureau designated as: {req.lead_bureau}. Notes: {req.decision_notes or 'Agreed by participating officers.'}"

    elif req.action == "LINK_CASES":
        overlap["coordination_status"] = "LINKED"
        overlap["decision"] = f"Cases linked as parallel investigations. {req.decision_notes or ''}"

    elif req.action == "MARK_DUPLICATE":
        overlap["coordination_status"] = "MERGED_DUPLICATE"
        overlap["decision"] = f"Identified as duplicate complaint. Primary action consolidated under lead bureau."

    elif req.action == "DISMISS":
        overlap["coordination_status"] = "DISMISSED"
        overlap["decision"] = "Evaluated by officers; determined as independent non-overlapping matters."

    return {"success": True, "overlap": overlap}


# --- Dashboard Analytics & KPIs (Feature 4) ---
@app.get("/api/analytics/dashboard")
def get_dashboard_analytics():
    enriched_cases = [{**c, **calculate_sla_status(c)} for c in db_cases]
    
    total = len(enriched_cases)
    pending = len([c for c in enriched_cases if c["status"] in ["Received", "Under Scrutiny", "Under Process", "Pending (Awaiting Input)"]])
    under_process = len([c for c in enriched_cases if c["status"] == "Under Process"])
    action_initiated = len([c for c in enriched_cases if c["status"] == "Action Initiated"])
    transferred = len([c for c in enriched_cases if c["status"] == "Transferred"])
    escalated = len([c for c in enriched_cases if c["status"] == "Escalated"])
    disposed = len([c for c in enriched_cases if c["status"] == "Disposed"])
    
    sla_breaches = len([c for c in enriched_cases if c["sla_severity"] == "red"])
    sla_warnings = len([c for c in enriched_cases if c["sla_severity"] == "amber"])
    active_overlaps = len([o for o in db_overlaps if o["coordination_status"] == "PENDING_COORDINATION"])

    # Bureau Workload
    bureau_stats = {}
    for c in enriched_cases:
        b = c["bureau_code"]
        if b not in bureau_stats:
            bureau_stats[b] = {
                "bureau_code": b,
                "bureau_name": c["bureau_name"],
                "total": 0,
                "open": 0,
                "disposed": 0,
                "escalated": 0,
                "breached": 0
            }
        bureau_stats[b]["total"] += 1
        if c["status"] == "Disposed":
            bureau_stats[b]["disposed"] += 1
        else:
            bureau_stats[b]["open"] += 1
        if c["status"] == "Escalated":
            bureau_stats[b]["escalated"] += 1
        if c["sla_severity"] == "red":
            bureau_stats[b]["breached"] += 1

    # Aging buckets (0-7, 8-15, 16-30, 31-60, 60+)
    aging_buckets = {
        "0_7_days": 0,
        "8_15_days": 0,
        "16_30_days": 0,
        "31_60_days": 0,
        "60_plus_days": 0
    }
    for c in enriched_cases:
        if c["status"] == "Disposed":
            continue
        d = c["received_days_ago"]
        if d <= 7:
            aging_buckets["0_7_days"] += 1
        elif d <= 15:
            aging_buckets["8_15_days"] += 1
        elif d <= 30:
            aging_buckets["16_30_days"] += 1
        elif d <= 60:
            aging_buckets["31_60_days"] += 1
        else:
            aging_buckets["60_plus_days"] += 1

    # Regional Distribution
    regional_stats = {}
    for c in enriched_cases:
        inst = institutions_map.get(c["institution_id"], {})
        reg = inst.get("region", "Other")
        if reg not in regional_stats:
            regional_stats[reg] = {"region": reg, "total": 0, "open": 0, "breached": 0}
        regional_stats[reg]["total"] += 1
        if c["status"] != "Disposed":
            regional_stats[reg]["open"] += 1
        if c["sla_severity"] == "red":
            regional_stats[reg]["breached"] += 1

    return {
        "kpis": {
            "total_received": total,
            "active_pending": pending,
            "under_process": under_process,
            "action_initiated": action_initiated,
            "transferred": transferred,
            "escalated": escalated,
            "disposed": disposed,
            "sla_breaches": sla_breaches,
            "sla_warnings": sla_warnings,
            "active_overlaps": active_overlaps,
            "disposal_rate_pct": round((disposed / total) * 100, 1) if total > 0 else 0
        },
        "bureau_workload": list(bureau_stats.values()),
        "aging_buckets": aging_buckets,
        "regional_stats": list(regional_stats.values()),
        "high_priority_overlaps": [o for o in db_overlaps if o["level"] == "HIGH"][:5]
    }


# --- Reports & Analytics (Feature 8) ---
@app.get("/api/reports/bureau")
def report_bureau():
    return get_dashboard_analytics()["bureau_workload"]


@app.get("/api/reports/region")
def report_region():
    return get_dashboard_analytics()["regional_stats"]


@app.get("/api/reports/overlaps")
def report_overlaps():
    return [
        {
            "alert_id": o["alert_id"],
            "institution": o["institution_name"],
            "permanent_id": o["aicte_permanent_id"],
            "score": o["score"],
            "level": o["level"],
            "bureau_a": o["case_a"]["bureau_name"],
            "case_a_id": o["case_a"]["id"],
            "bureau_b": o["case_b"]["bureau_name"],
            "case_b_id": o["case_b"]["id"],
            "coordination_status": o["coordination_status"],
            "lead_bureau": o.get("lead_bureau") or "Unassigned",
            "decision": o.get("decision") or "Awaiting Joint Review"
        }
        for o in db_overlaps
    ]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
