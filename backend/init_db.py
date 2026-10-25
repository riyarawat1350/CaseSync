import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from database import engine, SessionLocal, Base
from models import User, Institution, Case, CaseAction, SupportingDocument, Overlap, OverlapThreadMessage, AlertNotification
from synthetic_data import INSTITUTIONS, CASES, USERS_SEED, calculate_sla_status
from overlap_engine import OverlapDetectionEngine


def init_database():
    """Initializes tables and seeds initial data if database is empty."""
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if database is already seeded
        existing_count = db.query(Institution).count()
        if existing_count > 0:
            print(f"[CaseSync DB] Database already contains {existing_count} institutions. Skipping seed.")
            return

        print("[CaseSync DB] First-run detected: Seeding persistence ledger...")

        # 1. Seed Users
        for u_data in USERS_SEED:
            user = User(
                id=u_data["id"],
                username=u_data["username"],
                password_hash=u_data["password_hash"],
                name=u_data["name"],
                role=u_data["role"],
                bureau=u_data["bureau"],
                bureau_name=u_data["bureau_name"],
                region=u_data.get("region"),
                permissions=u_data.get("permissions", [])
            )
            db.add(user)

        # 2. Seed Institutions
        for inst_data in INSTITUTIONS:
            inst = Institution(
                id=inst_data["id"],
                aicte_permanent_id=inst_data["aicte_permanent_id"],
                name=inst_data["name"],
                aliases=inst_data.get("aliases", []),
                region=inst_data["region"],
                state=inst_data["state"],
                district=inst_data["district"],
                address=inst_data["address"],
                type=inst_data["type"],
                approval_status=inst_data["approval_status"],
                principal_name=inst_data["principal_name"],
                contact_email=inst_data["contact_email"],
                approved_intake=inst_data.get("approved_intake", 0),
                risk_level=inst_data.get("risk_level", "Medium")
            )
            db.add(inst)

        db.flush()

        # 3. Seed Cases with full fields, action audit history and initial documents
        for c_data in CASES:
            sla_info = calculate_sla_status(c_data)
            case = Case(
                id=c_data["id"],
                source_ref_no=c_data["source_ref_no"],
                institution_id=c_data["institution_id"],
                submitted_name=c_data["submitted_name"],
                category=c_data["category"],
                category_name=c_data["category_name"],
                summary=c_data["summary"],
                description=c_data["description"],
                complainant_type=c_data["complainant_type"],
                source_channel=c_data["source_channel"],
                bureau_code=c_data["bureau_code"],
                bureau_name=c_data["bureau_name"],
                assigned_officer=c_data["assigned_officer"],
                status=c_data["status"],
                priority=c_data["priority"],
                received_date=c_data.get("received_date") or sla_info["received_date"],
                received_days_ago=c_data.get("received_days_ago", 0),
                sla_days=c_data.get("sla_days", 30),
                last_action=c_data.get("last_action", "Registered"),
                last_action_date=c_data.get("last_action_date") or sla_info["received_date"],
                next_action=c_data.get("next_action", "Pending evaluation"),
                expected_disposal_date=c_data.get("expected_disposal_date") or sla_info["due_date"],
                is_duplicate=c_data.get("is_duplicate", False),
                duplicate_of_id=c_data.get("duplicate_of_id"),
                linked_case_ids=c_data.get("linked_case_ids", [])
            )
            db.add(case)

            # Audit entries
            for act in c_data.get("actions_history", []):
                action_entry = CaseAction(
                    case_id=c_data["id"],
                    timestamp=act.get("timestamp", datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
                    by=act.get("by", "System"),
                    bureau=act.get("bureau", c_data["bureau_code"]),
                    action=act.get("action", "Updated"),
                    remarks=act.get("remarks", "")
                )
                db.add(action_entry)

            # Supporting documents
            for doc_idx, doc in enumerate(c_data.get("documents", []), start=1):
                doc_entry = SupportingDocument(
                    id=f"DOC-{c_data['id']}-{doc_idx}",
                    case_id=c_data["id"],
                    name=doc["name"],
                    size=doc.get("size", 250000),
                    uploader=doc.get("uploader", c_data["assigned_officer"]),
                    bureau=doc.get("bureau", c_data["bureau_code"]),
                    timestamp=doc.get("timestamp", datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
                    file_type=doc.get("file_type", "application/pdf")
                )
                db.add(doc_entry)

        db.flush()

        # 4. Overlap Detection & Persistence
        inst_map = {inst["id"]: inst for inst in INSTITUTIONS}
        overlap_engine = OverlapDetectionEngine(inst_map)
        seen_pairs = set()

        for i in range(len(CASES)):
            for j in range(i + 1, len(CASES)):
                case_a = CASES[i]
                case_b = CASES[j]
                pair_key = tuple(sorted([case_a["id"], case_b["id"]]))
                if pair_key in seen_pairs:
                    continue
                seen_pairs.add(pair_key)

                ovr_res = overlap_engine.check_overlap(case_a, case_b)
                if ovr_res:
                    ovr_record = Overlap(
                        alert_id=ovr_res["alert_id"],
                        institution_id=ovr_res["institution_id"],
                        institution_name=ovr_res["institution_name"],
                        aicte_permanent_id=ovr_res["aicte_permanent_id"],
                        case_a_id=case_a["id"],
                        case_b_id=case_b["id"],
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
                        coordination_status="OPEN",
                        lead_bureau=None,
                        decision=None
                    )
                    db.add(ovr_record)

                    # Initial thread message
                    thread_msg = OverlapThreadMessage(
                        alert_id=ovr_res["alert_id"],
                        author="CaseSync Overlap Engine",
                        role="System AI",
                        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        message=f"Engine detected cross-bureau overlap score of {int(ovr_res['score'] * 100)}% between {case_a['bureau_name']} ({case_a['id']}) and {case_b['bureau_name']} ({case_b['id']}). Recommended action: Designate lead bureau and link cases."
                    )
                    db.add(thread_msg)

        db.flush()

        # 5. Seed Alert Notifications (4 categories)
        # Category A: Duplicate / Overlap Alerts
        high_overlaps = db.query(Overlap).filter(Overlap.level == "HIGH").all()
        for idx, ov in enumerate(high_overlaps):
            db.add(AlertNotification(
                id=f"ALT-OVR-{idx+1:03d}",
                category="DUPLICATE_OVERLAP",
                title=f"Potential Cross-Bureau Overlap: {ov.institution_name}",
                message=f"Overlapping cases detected with {int(ov.score * 100)}% similarity between {ov.case_a_id} and {ov.case_b_id}. Lead bureau designation required.",
                severity="critical" if ov.score >= 0.85 else "high",
                target_type="overlap",
                target_id=ov.alert_id,
                created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                is_read=False
            ))

        # Category B: SLA Alerts (Breached & 80% Warning)
        all_cases = db.query(Case).all()
        sla_count = 0
        for c in all_cases:
            if c.status == "Disposed":
                continue
            sla = calculate_sla_status(c.to_dict())
            if sla["sla_severity"] == "red" and sla_count < 8:
                sla_count += 1
                db.add(AlertNotification(
                    id=f"ALT-SLA-{sla_count:03d}",
                    category="SLA_ALERT",
                    title=f"SLA Breached: Case {c.id}",
                    message=f"{c.institution_id} - {c.category_name} is overdue by {abs(sla['days_remaining'])} days. Assigned to {c.assigned_officer} ({c.bureau_name}).",
                    severity="critical",
                    target_type="case",
                    target_id=c.id,
                    created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    is_read=False
                ))
            elif sla["sla_severity"] == "amber" and sla_count < 14:
                sla_count += 1
                db.add(AlertNotification(
                    id=f"ALT-SLA-{sla_count:03d}",
                    category="SLA_ALERT",
                    title=f"SLA Warning (80% Reached): Case {c.id}",
                    message=f"{c.institution_id} - {c.category_name} has {sla['days_remaining']} days remaining ({sla['pct_elapsed']}% elapsed). Action required.",
                    severity="high",
                    target_type="case",
                    target_id=c.id,
                    created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    is_read=False
                ))

        # Category C: Escalation Alerts
        escalated_cases = [c for c in all_cases if c.status == "Escalated"]
        for idx, ec in enumerate(escalated_cases[:6]):
            db.add(AlertNotification(
                id=f"ALT-ESC-{idx+1:03d}",
                category="ESCALATION",
                title=f"Urgent Case Escalation: {ec.id}",
                message=f"Case concerning {ec.submitted_name} has been escalated to Senior Management for immediate intervention: {ec.last_action}",
                severity="high",
                target_type="case",
                target_id=ec.id,
                created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                is_read=False
            ))

        # Category D: Pending Case Reminders
        pending_cases = [c for c in all_cases if c.status in ["Under Scrutiny", "Under Process", "Pending (Awaiting Input)"] and c.received_days_ago >= 20]
        for idx, pc in enumerate(pending_cases[:8]):
            db.add(AlertNotification(
                id=f"ALT-REM-{idx+1:03d}",
                category="PENDING_REMINDER",
                title=f"Pending Case Follow-up: {pc.id}",
                message=f"Case pending for {pc.received_days_ago} days under {pc.bureau_name}. Next action pending: {pc.next_action}",
                severity="medium",
                target_type="case",
                target_id=pc.id,
                created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                is_read=False
            ))

        db.commit()
        print("[CaseSync DB] Database initialization and seed completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"[CaseSync DB Error] Failed during database seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_database()
