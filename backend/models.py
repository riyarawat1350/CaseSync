from sqlalchemy import Column, String, Integer, Float, Boolean, Text, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True, index=True)  # e.g., "senior_mgmt", "rb_officer"
    username = Column(String(50), unique=True, index=True)
    password_hash = Column(String(255))
    name = Column(String(100))
    role = Column(String(100))
    bureau = Column(String(20))
    bureau_name = Column(String(100))
    region = Column(String(50), nullable=True)
    permissions = Column(JSON, default=list)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "name": self.name,
            "role": self.role,
            "bureau": self.bureau,
            "bureau_name": self.bureau_name,
            "region": self.region,
            "permissions": self.permissions or []
        }


class Institution(Base):
    __tablename__ = "institutions"

    id = Column(String(50), primary_key=True, index=True)  # e.g., "INST-001"
    aicte_permanent_id = Column(String(50), index=True)
    name = Column(String(255), index=True)
    aliases = Column(JSON, default=list)
    region = Column(String(50), index=True)
    state = Column(String(50), index=True)
    district = Column(String(50))
    address = Column(String(255))
    type = Column(String(50))
    approval_status = Column(String(50))
    principal_name = Column(String(100))
    contact_email = Column(String(100))
    approved_intake = Column(Integer, default=0)
    risk_level = Column(String(20), default="Medium")

    cases = relationship("Case", back_populates="institution", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "aicte_permanent_id": self.aicte_permanent_id,
            "name": self.name,
            "aliases": self.aliases or [],
            "region": self.region,
            "state": self.state,
            "district": self.district,
            "address": self.address,
            "type": self.type,
            "approval_status": self.approval_status,
            "principal_name": self.principal_name,
            "contact_email": self.contact_email,
            "approved_intake": self.approved_intake,
            "risk_level": self.risk_level
        }


class Case(Base):
    __tablename__ = "cases"

    id = Column(String(50), primary_key=True, index=True)  # Unique Case ID e.g., "CS-2026-PGRC-00101"
    source_ref_no = Column(String(100), index=True)
    institution_id = Column(String(50), ForeignKey("institutions.id"), index=True)
    submitted_name = Column(String(255))
    category = Column(String(50), index=True)
    category_name = Column(String(100))
    summary = Column(String(500))
    description = Column(Text)
    complainant_type = Column(String(100))
    source_channel = Column(String(100))
    bureau_code = Column(String(20), index=True)
    bureau_name = Column(String(100))
    assigned_officer = Column(String(100))
    status = Column(String(50), index=True)  # Received, Under Scrutiny, Under Process, etc.
    priority = Column(String(20), default="Medium")
    received_date = Column(String(30))  # e.g., "2026-09-29"
    received_days_ago = Column(Integer, default=0)
    sla_days = Column(Integer, default=30)
    last_action = Column(String(500))
    last_action_date = Column(String(30))  # e.g., "2026-10-18"
    next_action = Column(String(500))
    expected_disposal_date = Column(String(30))  # e.g., "2026-10-29"
    is_duplicate = Column(Boolean, default=False)
    duplicate_of_id = Column(String(50), nullable=True)
    linked_case_ids = Column(JSON, default=list)

    institution = relationship("Institution", back_populates="cases")
    actions_history = relationship("CaseAction", back_populates="case", cascade="all, delete-orphan", order_by="CaseAction.id")
    documents = relationship("SupportingDocument", back_populates="case", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "source_ref_no": self.source_ref_no,
            "institution_id": self.institution_id,
            "submitted_name": self.submitted_name,
            "category": self.category,
            "category_name": self.category_name,
            "summary": self.summary,
            "description": self.description,
            "complainant_type": self.complainant_type,
            "source_channel": self.source_channel,
            "bureau_code": self.bureau_code,
            "bureau_name": self.bureau_name,
            "assigned_officer": self.assigned_officer,
            "status": self.status,
            "priority": self.priority,
            "received_date": self.received_date,
            "received_days_ago": self.received_days_ago,
            "sla_days": self.sla_days,
            "last_action": self.last_action,
            "last_action_date": self.last_action_date,
            "next_action": self.next_action,
            "expected_disposal_date": self.expected_disposal_date,
            "is_duplicate": self.is_duplicate,
            "duplicate_of_id": self.duplicate_of_id,
            "linked_case_ids": self.linked_case_ids or [],
            "actions_history": [a.to_dict() for a in self.actions_history],
            "documents": [d.to_dict() for d in self.documents]
        }


class CaseAction(Base):
    __tablename__ = "case_actions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(String(50), ForeignKey("cases.id"), index=True)
    timestamp = Column(String(30))
    by = Column(String(100))
    bureau = Column(String(50))
    action = Column(String(100))
    remarks = Column(Text)

    case = relationship("Case", back_populates="actions_history")

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp,
            "by": self.by,
            "bureau": self.bureau,
            "action": self.action,
            "remarks": self.remarks
        }


class SupportingDocument(Base):
    __tablename__ = "supporting_documents"

    id = Column(String(50), primary_key=True)
    case_id = Column(String(50), ForeignKey("cases.id"), index=True)
    name = Column(String(255))
    size = Column(Integer)  # bytes
    uploader = Column(String(100))
    bureau = Column(String(50))
    timestamp = Column(String(30))
    file_type = Column(String(50), default="application/pdf")
    data_base64 = Column(Text, nullable=True)

    case = relationship("Case", back_populates="documents")

    def to_dict(self):
        return {
            "id": self.id,
            "case_id": self.case_id,
            "name": self.name,
            "size": self.size,
            "uploader": self.uploader,
            "bureau": self.bureau,
            "timestamp": self.timestamp,
            "file_type": self.file_type
        }


class Overlap(Base):
    __tablename__ = "overlaps"

    alert_id = Column(String(50), primary_key=True, index=True)
    institution_id = Column(String(50), ForeignKey("institutions.id"), index=True)
    institution_name = Column(String(255))
    aicte_permanent_id = Column(String(50))
    case_a_id = Column(String(50), ForeignKey("cases.id"))
    case_b_id = Column(String(50), ForeignKey("cases.id"))
    score = Column(Float)
    level = Column(String(20))  # HIGH, MEDIUM, NOTICE
    badge = Column(String(100))
    badge_color = Column(String(20))
    time_window_days = Column(Integer)
    shared_keywords = Column(JSON, default=list)
    reasons = Column(JSON, default=list)
    breakdown = Column(JSON, default=dict)
    suggested_lead_bureau = Column(String(50))
    lead_reason = Column(String(255))
    coordination_status = Column(String(50), default="OPEN")  # OPEN, COORDINATING, RESOLVED, LEAD_DESIGNATED, LINKED, MERGED_DUPLICATE, DISMISSED
    lead_bureau = Column(String(50), nullable=True)
    decision = Column(Text, nullable=True)

    thread = relationship("OverlapThreadMessage", back_populates="overlap", cascade="all, delete-orphan", order_by="OverlapThreadMessage.id")

    def to_dict(self, case_a_dict=None, case_b_dict=None):
        return {
            "alert_id": self.alert_id,
            "institution_id": self.institution_id,
            "institution_name": self.institution_name,
            "aicte_permanent_id": self.aicte_permanent_id,
            "case_a": case_a_dict or {"id": self.case_a_id},
            "case_b": case_b_dict or {"id": self.case_b_id},
            "score": self.score,
            "level": self.level,
            "badge": self.badge,
            "badge_color": self.badge_color,
            "time_window_days": self.time_window_days,
            "shared_keywords": self.shared_keywords or [],
            "reasons": self.reasons or [],
            "breakdown": self.breakdown or {},
            "suggested_lead_bureau": self.suggested_lead_bureau,
            "lead_reason": self.lead_reason,
            "coordination_status": self.coordination_status,
            "lead_bureau": self.lead_bureau,
            "decision": self.decision,
            "thread": [m.to_dict() for m in self.thread]
        }


class OverlapThreadMessage(Base):
    __tablename__ = "overlap_threads"

    id = Column(Integer, primary_key=True, autoincrement=True)
    alert_id = Column(String(50), ForeignKey("overlaps.alert_id"), index=True)
    author = Column(String(100))
    role = Column(String(100))
    timestamp = Column(String(30))
    message = Column(Text)
    action = Column(String(50), nullable=True)

    overlap = relationship("Overlap", back_populates="thread")

    def to_dict(self):
        return {
            "id": self.id,
            "author": self.author,
            "role": self.role,
            "timestamp": self.timestamp,
            "message": self.message,
            "action": self.action
        }


class AlertNotification(Base):
    __tablename__ = "alert_notifications"

    id = Column(String(50), primary_key=True, index=True)
    category = Column(String(50), index=True)  # DUPLICATE_OVERLAP, PENDING_REMINDER, ESCALATION, SLA_ALERT
    title = Column(String(255))
    message = Column(Text)
    severity = Column(String(20), default="medium")  # low, medium, high, critical
    target_type = Column(String(20))  # "case" or "overlap"
    target_id = Column(String(50))
    created_at = Column(String(30))
    is_read = Column(Boolean, default=False)

    def to_dict(self):
        return {
            "id": self.id,
            "category": self.category,
            "title": self.title,
            "message": self.message,
            "severity": self.severity,
            "target_type": self.target_type,
            "target_id": self.target_id,
            "created_at": self.created_at,
            "is_read": self.is_read
        }
