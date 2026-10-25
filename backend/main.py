import os
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_

from database import engine, get_db
from models import (
    User, Institution, Case, CaseAction, SupportingDocument,
    Overlap, OverlapThreadMessage, AlertNotification
)
from init_db import init_database
from synthetic_data import BUREAUS, OFFICERS, CATEGORIES, calculate_sla_status
from overlap_engine import EntityResolutionEngine, OverlapDetectionEngine
from auth import create_access_token, get_current_user


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB and seed on first run
    init_database()
    yield


app = FastAPI(
    title="AICTE CaseSync API",
    description="Integrated Dashboard for Monitoring & Tracking Institution-Related Complaint Cases Across AICTE Bureaus/Cells (SIH 2026 - PS 26264)",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request & Response Models ---
class LoginRequest(BaseModel):
    username: str
    password: str


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


class LinkCaseRequest(BaseModel):
    user_name: str
    bureau: str
    target_case_id: str
    reason: Optional[str] = "Parallel cross-bureau investigation"


class DuplicateMarkRequest(BaseModel):
    user_name: str
    bureau: str
    primary_case_id: str
    reason: Optional[str] = "Identified as duplicate complaint"


class DocumentUploadRequest(BaseModel):
    name: str
    size: int
    uploader: str
    bureau: str
    file_type: Optional[str] = "application/pdf"
    data_base64: Optional[str] = None


class CoordinationMessageRequest(BaseModel):
    author: str
    role: str
    message: str
    action: Optional[str] = None  # DESIGNATE_LEAD, LINK_CASES, MARK_DUPLICATE, RESOLVE, DISMISS
    lead_bureau: Optional[str] = None
    decision_notes: Optional[str] = None
    target_status: Optional[str] = None  # OPEN, COORDINATING, RESOLVED


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


# --- Authentication & Personas (Feature 7) ---
@app.post("/api/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or user.password_hash != req.password:
        raise HTTPException(status_code=401, detail="Invalid username or password. Check demo credentials on login screen.")

    token = create_access_token(
        user_id=user.id,
        username=user.username,
        role=user.role,
        bureau=user.bureau,
        region=user.region
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user.to_dict()
    }


@app.get("/api/auth/me")
def get_me(current_user: Optional[User] = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return current_user.to_dict()


@app.get("/api/auth/personas")
def get_personas(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [
        {
            **u.to_dict(),
            "demo_username": u.username,
            "demo_password": u.password_hash
        }
        for u in users
    ]


# --- Institutions & Institution 360 (Feature 5 & 2) ---
@app.get("/api/institutions")
def list_institutions(
    search: Optional[str] = None,
    region: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Institution)
    if region and region.lower() != "all":
        query = query.filter(Institution.region.ilike(region))

    institutions = query.all()
    results = []

    for inst in institutions:
        inst_dict = inst.to_dict()
        if search:
            q = search.strip().lower()
            match_name = q in inst.name.lower()
            match_id = q in inst.aicte_permanent_id.lower()
            match_alias = any(q in a.lower() for a in (inst.aliases or []))
            if not (match_name or match_id or match_alias):
                continue

        # Real-time counts from cases table
        cases = inst.cases
        open_cases = [c for c in cases if c.status != "Disposed" and c.status != "Duplicate/Closed"]
        active_bureaus = list(set([c.bureau_code for c in open_cases]))

        results.append({
            **inst_dict,
            "total_cases": len(cases),
            "open_cases": len(open_cases),
            "active_bureaus": active_bureaus,
            "has_cross_bureau_activity": len(active_bureaus) > 1
        })

    return results


@app.get("/api/institutions/{inst_id}")
def get_institution_360(inst_id: str, db: Session = Depends(get_db)):
    inst = db.query(Institution).filter(Institution.id == inst_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")

    cases_list = []
    bureau_breakdown = {}
    sla_breaches = 0

    for c in inst.cases:
        c_dict = c.to_dict()
        sla_info = calculate_sla_status(c_dict)
        enriched = {
            **c_dict,
            **sla_info,
            "institution_name": inst.name,
            "aicte_permanent_id": inst.aicte_permanent_id,
            "region": inst.region
        }
        cases_list.append(enriched)

        b_name = c.bureau_name or c.bureau_code
        bureau_breakdown[b_name] = bureau_breakdown.get(b_name, 0) + 1

        if sla_info.get("sla_severity") == "red" and c.status not in ["Disposed", "Duplicate/Closed"]:
            sla_breaches += 1

    # Overlaps for this institution
    overlaps = db.query(Overlap).filter(Overlap.institution_id == inst_id).all()
    overlaps_list = [o.to_dict() for o in overlaps]

    return {
        "institution": inst.to_dict(),
        "cases": cases_list,
        "overlaps": overlaps_list,
        "bureau_breakdown": bureau_breakdown,
        "total_cases": len(cases_list),
        "open_cases": len([c for c in cases_list if c["status"] not in ["Disposed", "Duplicate/Closed"]]),
        "sla_breaches": sla_breaches
    }


@app.post("/api/institutions/resolve")
def resolve_institution(req: EntityResolveRequest, db: Session = Depends(get_db)):
    all_insts = [i.to_dict() for i in db.query(Institution).all()]
    resolver = EntityResolutionEngine(all_insts)
    result = resolver.resolve(
        input_id=req.input_id,
        input_name=req.input_name,
        district=req.district,
        state=req.state
    )
    return result


# --- Cases API with Case Fields, Search, Filters & Workflow (Features 2, 3, 4) ---
@app.get("/api/cases")
def list_cases(
    bureau: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    region: Optional[str] = None,
    search: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Case)

    # Role-based restriction: Regional Officer restricted to their own region
    if current_user and hasattr(current_user, 'bureau') and current_user.bureau == "RO" and getattr(current_user, 'region', None):
        query = query.join(Institution).filter(Institution.region.ilike(current_user.region))

    if bureau and bureau.lower() != "all":
        query = query.filter(Case.bureau_code.ilike(bureau))

    if status and status.lower() != "all":
        query = query.filter(Case.status.ilike(status))

    if priority and priority.lower() != "all":
        query = query.filter(Case.priority.ilike(priority))

    if category and category.lower() != "all":
        query = query.filter(Case.category.ilike(category))

    if region and region.lower() != "all":
        query = query.join(Institution).filter(Institution.region.ilike(region))

    if from_date:
        query = query.filter(Case.received_date >= from_date)

    if to_date:
        query = query.filter(Case.received_date <= to_date)

    cases = query.all()
    results = []

    for c in cases:
        inst = c.institution
        c_dict = c.to_dict()
        sla_info = calculate_sla_status(c_dict)

        if search:
            q = search.strip().lower()
            inst_name = inst.name.lower() if inst else ""
            perm_id = inst.aicte_permanent_id.lower() if inst else ""
            aliases = [a.lower() for a in (inst.aliases or [])] if inst else []

            match = (
                q in c.id.lower() or
                q in (c.source_ref_no or "").lower() or
                q in (c.summary or "").lower() or
                q in (c.description or "").lower() or
                q in inst_name or
                q in perm_id or
                any(q in a for a in aliases)
            )
            if not match:
                continue

        enriched = {
            **c_dict,
            "institution_name": inst.name if inst else c.submitted_name,
            "aicte_permanent_id": inst.aicte_permanent_id if inst else "",
            "region": inst.region if inst else "",
            **sla_info
        }
        results.append(enriched)

    return results


@app.get("/api/cases/{case_id}")
def get_case(case_id: str, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    inst = case.institution
    c_dict = case.to_dict()
    sla_info = calculate_sla_status(c_dict)

    # Find active overlaps involving this case
    overlaps = db.query(Overlap).filter(
        or_(Overlap.case_a_id == case_id, Overlap.case_b_id == case_id)
    ).all()

    # Find reciprocal linked cases info
    linked_cases = []
    if case.linked_case_ids:
        for lid in case.linked_case_ids:
            lc = db.query(Case).filter(Case.id == lid).first()
            if lc:
                linked_cases.append({
                    "id": lc.id,
                    "bureau_name": lc.bureau_name,
                    "status": lc.status,
                    "category_name": lc.category_name,
                    "summary": lc.summary
                })

    return {
        **c_dict,
        "institution": inst.to_dict() if inst else None,
        "institution_name": inst.name if inst else case.submitted_name,
        "aicte_permanent_id": inst.aicte_permanent_id if inst else "",
        "region": inst.region if inst else "",
        **sla_info,
        "related_overlaps": [o.to_dict() for o in overlaps],
        "linked_cases_detail": linked_cases
    }


@app.post("/api/cases/{case_id}/action")
def add_case_action(case_id: str, req: ActionRequest, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    today_str = datetime.now().strftime("%Y-%m-%d")

    # Append immutable audit entry
    action_entry = CaseAction(
        case_id=case.id,
        timestamp=now_str,
        by=req.user_name,
        bureau=req.bureau,
        action=req.action_type,
        remarks=req.remarks
    )
    db.add(action_entry)

    case.last_action = f"{req.action_type}: {req.remarks}"
    case.last_action_date = today_str

    if req.new_status:
        case.status = req.new_status

    db.commit()
    db.refresh(case)
    return {"success": True, "case": case.to_dict()}


@app.post("/api/cases/{case_id}/transfer")
def transfer_case(case_id: str, req: TransferRequest, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    today_str = datetime.now().strftime("%Y-%m-%d")

    # Immutable audit log
    action_entry = CaseAction(
        case_id=case.id,
        timestamp=now_str,
        by=req.user_name,
        bureau=req.from_bureau,
        action=f"Transferred to {req.to_bureau}",
        remarks=req.reason
    )
    db.add(action_entry)

    bureau_info = next((b for b in BUREAUS if b["code"] == req.to_bureau), None)
    case.bureau_code = req.to_bureau
    case.bureau_name = bureau_info["name"] if bureau_info else req.to_bureau
    case.status = "Transferred"
    case.last_action = f"Transferred from {req.from_bureau} to {req.to_bureau}: {req.reason}"
    case.last_action_date = today_str

    db.commit()
    db.refresh(case)
    return {"success": True, "case": case.to_dict()}


@app.post("/api/cases/{case_id}/escalate")
def escalate_case(case_id: str, req: EscalateRequest, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    today_str = datetime.now().strftime("%Y-%m-%d")

    action_entry = CaseAction(
        case_id=case.id,
        timestamp=now_str,
        by=req.user_name,
        bureau=req.bureau,
        action=f"Escalated to {req.target_authority}",
        remarks=req.justification
    )
    db.add(action_entry)

    case.status = "Escalated"
    case.priority = "High"
    case.last_action = f"Escalated to {req.target_authority}: {req.justification}"
    case.last_action_date = today_str

    # Create an Escalation Alert in the Notification Center
    db.add(AlertNotification(
        id=f"ALT-ESC-{uuid.uuid4().hex[:6].upper()}",
        category="ESCALATION",
        title=f"Case Escalated: {case.id}",
        message=f"Case concerning {case.submitted_name} escalated to {req.target_authority} by {req.user_name} ({req.bureau}). Rationale: {req.justification}",
        severity="high",
        target_type="case",
        target_id=case.id,
        created_at=now_str,
        is_read=False
    ))

    db.commit()
    db.refresh(case)
    return {"success": True, "case": case.to_dict()}


@app.post("/api/cases/{case_id}/link")
def link_cases(case_id: str, req: LinkCaseRequest, db: Session = Depends(get_db)):
    case_a = db.query(Case).filter(Case.id == case_id).first()
    case_b = db.query(Case).filter(Case.id == req.target_case_id).first()

    if not case_a or not case_b:
        raise HTTPException(status_code=404, detail="One or both cases not found")

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Add to linked_case_ids reciprocally
    links_a = list(case_a.linked_case_ids or [])
    if case_b.id not in links_a:
        links_a.append(case_b.id)
        case_a.linked_case_ids = links_a

    links_b = list(case_b.linked_case_ids or [])
    if case_a.id not in links_b:
        links_b.append(case_a.id)
        case_b.linked_case_ids = links_b

    # Append immutable audit entry to both cases
    db.add(CaseAction(
        case_id=case_a.id,
        timestamp=now_str,
        by=req.user_name,
        bureau=req.bureau,
        action="Linked Case",
        remarks=f"Linked to parallel case {case_b.id} ({case_b.bureau_name}). Reason: {req.reason}"
    ))
    db.add(CaseAction(
        case_id=case_b.id,
        timestamp=now_str,
        by=req.user_name,
        bureau=req.bureau,
        action="Linked Case",
        remarks=f"Linked to parallel case {case_a.id} ({case_a.bureau_name}). Reason: {req.reason}"
    ))

    db.commit()
    return {"success": True, "linked_cases": [case_a.id, case_b.id]}


@app.post("/api/cases/{case_id}/duplicate")
def mark_duplicate_case(case_id: str, req: DuplicateMarkRequest, db: Session = Depends(get_db)):
    sec_case = db.query(Case).filter(Case.id == case_id).first()
    prim_case = db.query(Case).filter(Case.id == req.primary_case_id).first()

    if not sec_case or not prim_case:
        raise HTTPException(status_code=404, detail="Primary or duplicate case not found")

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    sec_case.is_duplicate = True
    sec_case.duplicate_of_id = prim_case.id
    sec_case.status = "Duplicate/Closed"
    sec_case.last_action = f"Marked as duplicate of {prim_case.id}. Investigation consolidated under {prim_case.bureau_name}."

    # Audit entries on both
    db.add(CaseAction(
        case_id=sec_case.id,
        timestamp=now_str,
        by=req.user_name,
        bureau=req.bureau,
        action="Marked as Duplicate",
        remarks=f"Consolidated into primary case {prim_case.id}. Reason: {req.reason}"
    ))
    db.add(CaseAction(
        case_id=prim_case.id,
        timestamp=now_str,
        by=req.user_name,
        bureau=req.bureau,
        action="Duplicate Merged",
        remarks=f"Case {sec_case.id} was identified as duplicate and consolidated into this case."
    ))

    db.commit()
    return {"success": True, "duplicate_case": sec_case.id, "primary_case": prim_case.id}


@app.post("/api/cases/{case_id}/documents")
def upload_document(case_id: str, req: DocumentUploadRequest, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    doc_id = f"DOC-{uuid.uuid4().hex[:8]}"

    doc = SupportingDocument(
        id=doc_id,
        case_id=case.id,
        name=req.name,
        size=req.size,
        uploader=req.uploader,
        bureau=req.bureau,
        timestamp=now_str,
        file_type=req.file_type or "application/pdf",
        data_base64=req.data_base64
    )
    db.add(doc)

    # Immutable audit trail
    db.add(CaseAction(
        case_id=case.id,
        timestamp=now_str,
        by=req.uploader,
        bureau=req.bureau,
        action="Document Uploaded",
        remarks=f"Uploaded supporting document: {req.name} ({round(req.size / 1024, 1)} KB)"
    ))

    db.commit()
    db.refresh(doc)
    return {"success": True, "document": doc.to_dict()}


@app.post("/api/cases")
def create_case(req: NewCaseRequest, db: Session = Depends(get_db)):
    inst_id = req.institution_id
    inst = None
    if inst_id:
        inst = db.query(Institution).filter(Institution.id == inst_id).first()

    if not inst:
        all_insts = [i.to_dict() for i in db.query(Institution).all()]
        resolver = EntityResolutionEngine(all_insts)
        match_res = resolver.resolve(None, req.submitted_name)
        if match_res.get("matched") and match_res.get("institution"):
            inst_id = match_res["institution"]["id"]
            inst = db.query(Institution).filter(Institution.id == inst_id).first()
        else:
            inst = db.query(Institution).first()
            inst_id = inst.id if inst else "INST-001"

    total_cases = db.query(Case).count()
    new_id = f"CS-2026-{req.bureau_code}-{total_cases + 1:05d}"
    bureau_info = next((b for b in BUREAUS if b["code"] == req.bureau_code), None)
    b_name = bureau_info["name"] if bureau_info else req.bureau_code

    today_str = datetime.now().strftime("%Y-%m-%d")
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    expected_disposal = (datetime.now() + timedelta(days=req.sla_days)).strftime("%Y-%m-%d")

    new_case = Case(
        id=new_id,
        source_ref_no=f"{req.bureau_code}-PORTAL-{total_cases + 100}",
        institution_id=inst_id,
        submitted_name=req.submitted_name,
        category=req.category,
        category_name=req.category_name,
        summary=req.summary,
        description=req.description,
        complainant_type=req.complainant_type,
        source_channel=req.source_channel,
        bureau_code=req.bureau_code,
        bureau_name=b_name,
        assigned_officer="Assigned Officer",
        status="Received",
        priority=req.priority,
        received_date=today_str,
        received_days_ago=0,
        sla_days=req.sla_days,
        last_action="Case registered via portal intake",
        last_action_date=today_str,
        next_action="Initial scrutiny and verification",
        expected_disposal_date=expected_disposal
    )
    db.add(new_case)

    # Initial Audit Trail
    db.add(CaseAction(
        case_id=new_id,
        timestamp=now_str,
        by="Portal Intake",
        bureau=req.bureau_code,
        action="Case Registered",
        remarks="Automated complaint ingestion via CaseSync adapter."
    ))

    db.commit()
    db.refresh(new_case)

    # Trigger real-time check against open cases in same institution
    open_peer_cases = db.query(Case).filter(
        Case.institution_id == inst_id,
        Case.id != new_id,
        Case.status != "Disposed",
        Case.status != "Duplicate/Closed"
    ).all()

    inst_map = {inst.id: inst.to_dict()}
    overlap_detector = OverlapDetectionEngine(inst_map)
    new_case_dict = new_case.to_dict()

    for peer in open_peer_cases:
        peer_dict = peer.to_dict()
        ovr_res = overlap_detector.check_overlap(new_case_dict, peer_dict)
        if ovr_res:
            ovr_rec = Overlap(
                alert_id=ovr_res["alert_id"],
                institution_id=inst_id,
                institution_name=inst.name,
                aicte_permanent_id=inst.aicte_permanent_id,
                case_a_id=new_case.id,
                case_b_id=peer.id,
                score=ovr_res["score"],
                level=ovr_res["level"],
                badge=ovr_res["badge"],
                badge_color=ovr_res["badge_color"],
                time_window_days=ovr_res["time_window_days"],
                shared_keywords=ovr_res["shared_keywords"],
                reasons=ovr_res["reasons"],
                breakdown=ovr_res["breakdown"],
                suggested_lead_bureau=ovr_res["suggested_lead_bureau"],
                lead_reason=ovr_res["lead_reason"],
                coordination_status="OPEN"
            )
            db.add(ovr_rec)
            db.add(OverlapThreadMessage(
                alert_id=ovr_res["alert_id"],
                author="CaseSync Overlap Engine",
                role="System AI",
                timestamp=now_str,
                message=f"Real-time overlap detected: {new_case.id} ({new_case.bureau_name}) and {peer.id} ({peer.bureau_name}) show {int(ovr_res['score']*100)}% correlation on {inst.name}."
            ))
            db.add(AlertNotification(
                id=f"ALT-OVR-{uuid.uuid4().hex[:6].upper()}",
                category="DUPLICATE_OVERLAP",
                title=f"Potential Overlap Detected: {inst.name}",
                message=f"New complaint {new_case.id} overlaps with {peer.id}. Coordination required.",
                severity="critical" if ovr_res["score"] >= 0.75 else "high",
                target_type="overlap",
                target_id=ovr_res["alert_id"],
                created_at=now_str,
                is_read=False
            ))
            db.commit()

    return {"success": True, "case": new_case.to_dict()}


# --- Overlap & Coordination Engine (Features 3 & 9) ---
@app.get("/api/overlaps")
def get_overlaps(db: Session = Depends(get_db)):
    overlaps = db.query(Overlap).order_by(Overlap.score.desc()).all()
    results = []
    for ov in overlaps:
        case_a = db.query(Case).filter(Case.id == ov.case_a_id).first()
        case_b = db.query(Case).filter(Case.id == ov.case_b_id).first()
        results.append(ov.to_dict(
            case_a_dict=case_a.to_dict() if case_a else None,
            case_b_dict=case_b.to_dict() if case_b else None
        ))
    return results


@app.get("/api/overlaps/{alert_id}")
def get_overlap_detail(alert_id: str, db: Session = Depends(get_db)):
    ov = db.query(Overlap).filter(Overlap.alert_id == alert_id).first()
    if not ov:
        raise HTTPException(status_code=404, detail="Overlap alert not found")

    case_a = db.query(Case).filter(Case.id == ov.case_a_id).first()
    case_b = db.query(Case).filter(Case.id == ov.case_b_id).first()

    return ov.to_dict(
        case_a_dict=case_a.to_dict() if case_a else None,
        case_b_dict=case_b.to_dict() if case_b else None
    )


@app.post("/api/overlaps/{alert_id}/coordinate")
def coordinate_overlap(alert_id: str, req: CoordinationMessageRequest, db: Session = Depends(get_db)):
    overlap = db.query(Overlap).filter(Overlap.alert_id == alert_id).first()
    if not overlap:
        raise HTTPException(status_code=404, detail="Overlap alert not found")

    case_a = db.query(Case).filter(Case.id == overlap.case_a_id).first()
    case_b = db.query(Case).filter(Case.id == overlap.case_b_id).first()

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Add thread message
    msg = OverlapThreadMessage(
        alert_id=alert_id,
        author=req.author,
        role=req.role,
        timestamp=now_str,
        message=req.message,
        action=req.action
    )
    db.add(msg)

    # Perform thread-triggered actions
    if req.action == "DESIGNATE_LEAD":
        overlap.lead_bureau = req.lead_bureau
        overlap.coordination_status = "COORDINATING"
        overlap.decision = f"Lead Bureau designated as: {req.lead_bureau}. Notes: {req.decision_notes or 'Agreed between participating officers.'}"

        # Add audit trail on both cases
        if case_a:
            db.add(CaseAction(
                case_id=case_a.id,
                timestamp=now_str,
                by=req.author,
                bureau=req.lead_bureau or "RB",
                action="Lead Bureau Assigned",
                remarks=f"Cross-bureau coordination: Lead assigned to {req.lead_bureau}. {req.message}"
            ))
        if case_b:
            db.add(CaseAction(
                case_id=case_b.id,
                timestamp=now_str,
                by=req.author,
                bureau=req.lead_bureau or "RB",
                action="Lead Bureau Assigned",
                remarks=f"Cross-bureau coordination: Lead assigned to {req.lead_bureau}. {req.message}"
            ))

    elif req.action == "LINK_CASES":
        overlap.coordination_status = "COORDINATING"
        overlap.decision = f"Cases linked as parallel cross-bureau investigations. Notes: {req.decision_notes or ''}"

        # Reciprocally link cases in DB
        if case_a and case_b:
            links_a = list(case_a.linked_case_ids or [])
            if case_b.id not in links_a:
                links_a.append(case_b.id)
                case_a.linked_case_ids = links_a

            links_b = list(case_b.linked_case_ids or [])
            if case_a.id not in links_b:
                links_b.append(case_a.id)
                case_b.linked_case_ids = links_b

            db.add(CaseAction(
                case_id=case_a.id,
                timestamp=now_str,
                by=req.author,
                bureau=case_a.bureau_code,
                action="Linked Case via Coordination",
                remarks=f"Cross-bureau coordination: Linked with {case_b.id} ({case_b.bureau_name})."
            ))
            db.add(CaseAction(
                case_id=case_b.id,
                timestamp=now_str,
                by=req.author,
                bureau=case_b.bureau_code,
                action="Linked Case via Coordination",
                remarks=f"Cross-bureau coordination: Linked with {case_a.id} ({case_a.bureau_name})."
            ))

    elif req.action == "MARK_DUPLICATE":
        overlap.coordination_status = "RESOLVED"
        overlap.decision = f"Identified as duplicate complaint. Primary action consolidated under {overlap.lead_bureau or 'Lead Bureau'}."

        # Mark secondary case as duplicate
        if case_a and case_b:
            case_b.is_duplicate = True
            case_b.duplicate_of_id = case_a.id
            case_b.status = "Duplicate/Closed"
            db.add(CaseAction(
                case_id=case_b.id,
                timestamp=now_str,
                by=req.author,
                bureau=case_b.bureau_code,
                action="Marked Duplicate via Coordination",
                remarks=f"Duplicate complaint consolidated under primary case {case_a.id}."
            ))

    elif req.action == "RESOLVE":
        overlap.coordination_status = "RESOLVED"
        overlap.decision = f"Joint resolution reached: {req.decision_notes or req.message}"

    elif req.action == "DISMISS":
        overlap.coordination_status = "RESOLVED"
        overlap.decision = "Evaluated by officers; determined as independent non-overlapping matters."

    if req.target_status:
        overlap.coordination_status = req.target_status

    db.commit()
    db.refresh(overlap)

    return {
        "success": True,
        "overlap": overlap.to_dict(
            case_a_dict=case_a.to_dict() if case_a else None,
            case_b_dict=case_b.to_dict() if case_b else None
        )
    }


# --- Alerts Center API (Feature 5) ---
@app.get("/api/alerts")
def get_alerts(category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(AlertNotification)
    if category and category.lower() != "all":
        query = query.filter(AlertNotification.category.ilike(category))

    alerts = query.order_by(AlertNotification.created_at.desc()).all()
    unread_count = db.query(AlertNotification).filter(AlertNotification.is_read == False).count()

    category_counts = {
        "DUPLICATE_OVERLAP": db.query(AlertNotification).filter(AlertNotification.category == "DUPLICATE_OVERLAP", AlertNotification.is_read == False).count(),
        "SLA_ALERT": db.query(AlertNotification).filter(AlertNotification.category == "SLA_ALERT", AlertNotification.is_read == False).count(),
        "ESCALATION": db.query(AlertNotification).filter(AlertNotification.category == "ESCALATION", AlertNotification.is_read == False).count(),
        "PENDING_REMINDER": db.query(AlertNotification).filter(AlertNotification.category == "PENDING_REMINDER", AlertNotification.is_read == False).count()
    }

    return {
        "alerts": [a.to_dict() for a in alerts],
        "unread_total": unread_count,
        "category_counts": category_counts
    }


@app.post("/api/alerts/{alert_id}/read")
def mark_alert_read(alert_id: str, db: Session = Depends(get_db)):
    alert = db.query(AlertNotification).filter(AlertNotification.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_read = True
    db.commit()
    return {"success": True, "alert_id": alert_id}


@app.post("/api/alerts/mark-all-read")
def mark_all_alerts_read(db: Session = Depends(get_db)):
    db.query(AlertNotification).update({AlertNotification.is_read: True})
    db.commit()
    return {"success": True}


# --- Dashboard Analytics & KPIs (Features 1 & 4) ---
@app.get("/api/analytics/dashboard")
def get_dashboard_analytics(
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Case)
    if current_user and current_user.bureau == "RO" and current_user.region:
        query = query.join(Institution).filter(Institution.region.ilike(current_user.region))

    all_cases = query.all()
    enriched_cases = []
    for c in all_cases:
        c_dict = c.to_dict()
        sla = calculate_sla_status(c_dict)
        inst = c.institution
        enriched_cases.append({
            **c_dict,
            "region": inst.region if inst else "Other",
            **sla
        })

    total = len(enriched_cases)
    pending = len([c for c in enriched_cases if c["status"] in ["Received", "Under Scrutiny", "Under Process", "Pending (Awaiting Input)"]])
    under_process = len([c for c in enriched_cases if c["status"] == "Under Process"])
    action_initiated = len([c for c in enriched_cases if c["status"] == "Action Initiated"])
    transferred = len([c for c in enriched_cases if c["status"] == "Transferred"])
    escalated = len([c for c in enriched_cases if c["status"] == "Escalated"])
    disposed = len([c for c in enriched_cases if c["status"] in ["Disposed", "Duplicate/Closed"]])

    sla_breaches = len([c for c in enriched_cases if c["sla_severity"] == "red" and c["status"] not in ["Disposed", "Duplicate/Closed"]])
    sla_warnings = len([c for c in enriched_cases if c["sla_severity"] == "amber" and c["status"] not in ["Disposed", "Duplicate/Closed"]])

    # Active Overlaps (status != RESOLVED and score >= 0.55)
    active_overlaps_count = db.query(Overlap).filter(
        Overlap.coordination_status.in_(["OPEN", "COORDINATING", "PENDING_COORDINATION", "LEAD_DESIGNATED", "LINKED"]),
        Overlap.score >= 0.55
    ).count()

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
        if c["status"] in ["Disposed", "Duplicate/Closed"]:
            bureau_stats[b]["disposed"] += 1
        else:
            bureau_stats[b]["open"] += 1
        if c["status"] == "Escalated":
            bureau_stats[b]["escalated"] += 1
        if c["sla_severity"] == "red" and c["status"] not in ["Disposed", "Duplicate/Closed"]:
            bureau_stats[b]["breached"] += 1

    # Aging buckets (0-7, 8-15, 16-30, 31-60, 60+ days)
    aging_buckets = {
        "0_7_days": 0,
        "8_15_days": 0,
        "16_30_days": 0,
        "31_60_days": 0,
        "60_plus_days": 0
    }
    for c in enriched_cases:
        if c["status"] in ["Disposed", "Duplicate/Closed"]:
            continue
        d = c.get("received_days_ago", 0)
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

    # Regional stats
    regional_stats = {}
    for c in enriched_cases:
        reg = c.get("region", "Other")
        if reg not in regional_stats:
            regional_stats[reg] = {"region": reg, "total": 0, "open": 0, "breached": 0}
        regional_stats[reg]["total"] += 1
        if c["status"] not in ["Disposed", "Duplicate/Closed"]:
            regional_stats[reg]["open"] += 1
        if c["sla_severity"] == "red" and c["status"] not in ["Disposed", "Duplicate/Closed"]:
            regional_stats[reg]["breached"] += 1

    high_overlaps = db.query(Overlap).filter(Overlap.level == "HIGH").order_by(Overlap.score.desc()).limit(5).all()

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
            "active_overlaps": active_overlaps_count,
            "disposal_rate_pct": round((disposed / total) * 100, 1) if total > 0 else 0
        },
        "bureau_workload": list(bureau_stats.values()),
        "aging_buckets": aging_buckets,
        "regional_stats": list(regional_stats.values()),
        "high_priority_overlaps": [o.to_dict() for o in high_overlaps]
    }


# --- Extended Reports API (Feature 6) ---
@app.get("/api/reports/bureau")
def report_bureau(db: Session = Depends(get_db)):
    analytics = get_dashboard_analytics(None, db)
    return analytics["bureau_workload"]


@app.get("/api/reports/region")
def report_region(db: Session = Depends(get_db)):
    analytics = get_dashboard_analytics(None, db)
    return analytics["regional_stats"]


@app.get("/api/reports/institution/{inst_id}")
def report_institution_history(inst_id: str, db: Session = Depends(get_db)):
    inst = db.query(Institution).filter(Institution.id == inst_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")

    cases_data = []
    for c in inst.cases:
        sla = calculate_sla_status(c.to_dict())
        cases_data.append({
            "case_id": c.id,
            "bureau": c.bureau_name,
            "category": c.category_name,
            "received_date": c.received_date,
            "status": c.status,
            "priority": c.priority,
            "sla_severity": sla["sla_severity"],
            "days_elapsed": c.received_days_ago,
            "last_action": c.last_action
        })

    return {
        "institution": inst.to_dict(),
        "total_complaints": len(cases_data),
        "cases": cases_data
    }


@app.get("/api/reports/ageing")
def report_ageing(db: Session = Depends(get_db)):
    analytics = get_dashboard_analytics(None, db)
    return analytics["aging_buckets"]


@app.get("/api/reports/disposal-rate")
def report_disposal_rate(db: Session = Depends(get_db)):
    cases = db.query(Case).all()
    # Monthly disposal trends for 2026
    monthly_data = {
        "May 2026": {"received": 22, "disposed": 19},
        "Jun 2026": {"received": 34, "disposed": 30},
        "Jul 2026": {"received": 41, "disposed": 38},
        "Aug 2026": {"received": 48, "disposed": 41},
        "Sep 2026": {"received": 52, "disposed": 44},
        "Oct 2026": {"received": 45, "disposed": 35}
    }
    trends = []
    for month, counts in monthly_data.items():
        rate = round((counts["disposed"] / counts["received"]) * 100, 1)
        trends.append({
            "month": month,
            "received": counts["received"],
            "disposed": counts["disposed"],
            "disposal_rate": rate
        })
    return trends


@app.get("/api/reports/overlaps")
def report_overlaps(db: Session = Depends(get_db)):
    overlaps = db.query(Overlap).order_by(Overlap.score.desc()).all()
    results = []
    for o in overlaps:
        case_a = db.query(Case).filter(Case.id == o.case_a_id).first()
        case_b = db.query(Case).filter(Case.id == o.case_b_id).first()
        results.append({
            "alert_id": o.alert_id,
            "institution": o.institution_name,
            "permanent_id": o.aicte_permanent_id,
            "score": o.score,
            "level": o.level,
            "case_a_id": o.case_a_id,
            "bureau_a": case_a.bureau_name if case_a else "Unknown",
            "case_b_id": o.case_b_id,
            "bureau_b": case_b.bureau_name if case_b else "Unknown",
            "coordination_status": o.coordination_status,
            "lead_bureau": o.lead_bureau or "Unassigned",
            "decision": o.decision or "Awaiting Joint Review"
        })
    return results


@app.get("/api/reports/performance")
def report_quarterly_performance(db: Session = Depends(get_db)):
    return [
        {"quarter": "Q1 2026 (Jan-Mar)", "cases_handled": 124, "disposed": 115, "sla_compliance_rate": "92.7%", "avg_resolution_days": 21.4},
        {"quarter": "Q2 2026 (Apr-Jun)", "cases_handled": 158, "disposed": 142, "sla_compliance_rate": "89.8%", "avg_resolution_days": 23.1},
        {"quarter": "Q3 2026 (Jul-Sep)", "cases_handled": 182, "disposed": 164, "sla_compliance_rate": "90.1%", "avg_resolution_days": 22.8},
        {"quarter": "Q4 2026 (Oct-Dec Current)", "cases_handled": 215, "disposed": 92, "sla_compliance_rate": "86.5%", "avg_resolution_days": 24.2}
    ]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
