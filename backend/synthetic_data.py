from datetime import datetime, timedelta
import random
from typing import List, Dict, Any

BASE_DATE = datetime(2026, 10, 25, 12, 0, 0)

BUREAUS = [
    {"code": "RB", "name": "Regulation Bureau", "icon": "ShieldAlert", "description": "Statutory compliance, withdrawal of approval, norms enforcement"},
    {"code": "PGRC", "name": "Public Grievance Redressal Cell", "icon": "Users", "description": "Faculty & student grievances, salary, harassment, capitation fee"},
    {"code": "RO", "name": "Regional Offices (AICTE)", "icon": "MapPin", "description": "Field inspections, local verification, state level liaison"},
    {"code": "LEGAL", "name": "Legal Cell", "icon": "FileText", "description": "Court notices, writ petitions, advocate general matters"},
    {"code": "AB", "name": "Approval Bureau", "icon": "CheckSquare", "description": "Annual intake approvals, course additions, extension of approval (EoA)"}
]

OFFICERS = [
    {"id": "OFF-RB-01", "name": "Shri Arvind Sharma", "role": "Director (Regulation)", "bureau": "RB", "email": "dir.rb@aicte-india.org"},
    {"id": "OFF-PGRC-01", "name": "Dr. Sunita Verma", "role": "Deputy Director (PGRC)", "bureau": "PGRC", "email": "dd.pgrc@aicte-india.org"},
    {"id": "OFF-RO-01", "name": "Shri M. Sundaram", "role": "Regional Officer (Southern)", "bureau": "RO", "region": "Southern", "email": "ro.south@aicte-india.org"},
    {"id": "OFF-RO-02", "name": "Dr. Sanjay Deshpande", "role": "Regional Officer (Western)", "bureau": "RO", "region": "Western", "email": "ro.west@aicte-india.org"},
    {"id": "OFF-LEGAL-01", "name": "Adv. Meenakshi Joshi", "role": "Senior Law Officer", "bureau": "LEGAL", "email": "legal.advisor@aicte-india.org"},
    {"id": "OFF-MGMT-01", "name": "Prof. T. G. Sitharam", "role": "Chairman / Competent Authority", "bureau": "MGMT", "email": "chairman@aicte-india.org"}
]

USERS_SEED = [
    {
        "id": "senior_mgmt",
        "username": "chairman",
        "password_hash": "aicte@2026",
        "name": "Prof. T. G. Sitharam",
        "role": "Chairman / Competent Authority",
        "bureau": "MGMT",
        "bureau_name": "Executive Management",
        "region": None,
        "permissions": ["ALL_DATA_READ", "APPROVE_ESCALATIONS", "EXECUTIVE_REPORTS", "OVERLAP_COORDINATION", "FULL_ADMIN"]
    },
    {
        "id": "rb_officer",
        "username": "arvind.sharma",
        "password_hash": "aicte@2026",
        "name": "Shri Arvind Sharma",
        "role": "Director (Regulation)",
        "bureau": "RB",
        "bureau_name": "Regulation Bureau",
        "region": None,
        "permissions": ["RB_CASES_FULL", "OVERLAP_COORDINATION", "PROPOSE_LEAD", "TRANSFER_CASE", "ESCALATE_CASE"]
    },
    {
        "id": "pgrc_officer",
        "username": "sunita.verma",
        "password_hash": "aicte@2026",
        "name": "Dr. Sunita Verma",
        "role": "Deputy Director (PGRC)",
        "bureau": "PGRC",
        "bureau_name": "Public Grievance Redressal Cell",
        "region": None,
        "permissions": ["PGRC_CASES_FULL", "OVERLAP_COORDINATION", "ACCEPT_LEAD", "TRANSFER_CASE", "ESCALATE_CASE"]
    },
    {
        "id": "ro_officer",
        "username": "m.sundaram",
        "password_hash": "aicte@2026",
        "name": "Shri M. Sundaram",
        "role": "Regional Officer (Southern)",
        "bureau": "RO",
        "bureau_name": "Regional Office (South)",
        "region": "Southern",
        "permissions": ["RO_CASES_FULL", "FIELD_VERIFICATION", "REGION_REPORTS", "OVERLAP_COORDINATION"]
    }
]

REGIONS_METADATA = [
    {"region": "Central", "states": [("Madhya Pradesh", "Bhopal"), ("Chhattisgarh", "Raipur"), ("Gujarat", "Ahmedabad")]},
    {"region": "Eastern", "states": [("West Bengal", "Kolkata"), ("Odisha", "Bhubaneswar"), ("Jharkhand", "Ranchi"), ("Bihar", "Patna")]},
    {"region": "Northern", "states": [("Uttar Pradesh", "Lucknow"), ("Uttarakhand", "Dehradun"), ("Uttar Pradesh", "Kanpur")]},
    {"region": "North-West", "states": [("Haryana", "Gurugram"), ("Punjab", "Mohali"), ("Rajasthan", "Jaipur"), ("Delhi", "New Delhi"), ("Chandigarh", "Chandigarh")]},
    {"region": "Southern", "states": [("Tamil Nadu", "Chennai"), ("Tamil Nadu", "Coimbatore"), ("Kerala", "Thiruvananthapuram"), ("Puducherry", "Puducherry")]},
    {"region": "South-Central", "states": [("Telangana", "Hyderabad"), ("Andhra Pradesh", "Vijayawada"), ("Andhra Pradesh", "Visakhapatnam")]},
    {"region": "South-Western", "states": [("Karnataka", "Bengaluru"), ("Karnataka", "Mangaluru"), ("Karnataka", "Mysuru")]},
    {"region": "Western", "states": [("Maharashtra", "Pune"), ("Maharashtra", "Mumbai"), ("Maharashtra", "Nagpur"), ("Goa", "Panaji")]}
]

# 60+ Realistically Designed Engineering & Management Institutions
RAW_INSTITUTIONS_SEED = [
    # Existing Demo 1 & 2
    {
        "id": "INST-001",
        "aicte_permanent_id": "1-104928101",
        "name": "Dr. B.R. Ambedkar Institute of Technology & Management",
        "aliases": ["A.B.C Inst of Engg & Tech", "Ambedkar Inst of Tech", "BRAITM Bengaluru", "Dr BR Ambedkar College of Tech"],
        "region": "South-Western",
        "state": "Karnataka",
        "district": "Bengaluru Urban",
        "address": "Outer Ring Road, Marathahalli, Bengaluru 560037",
        "type": "Private-Unaided",
        "approval_status": "Approved with Conditions",
        "principal_name": "Dr. S. K. Narayana",
        "contact_email": "principal@braitm.ac.in",
        "approved_intake": 780,
        "risk_level": "High"
    },
    {
        "id": "INST-002",
        "aicte_permanent_id": "1-294018244",
        "name": "Apex National Engineering College",
        "aliases": ["Apex Nat. Engg. Col.", "Apex Institute of Tech & Sci", "ANEC Pune"],
        "region": "Western",
        "state": "Maharashtra",
        "district": "Pune",
        "address": "Talegaon Dabhade, Pune 410507",
        "type": "Private-Unaided",
        "approval_status": "Approved",
        "principal_name": "Dr. Rajeshwar Deshmukh",
        "contact_email": "admin@apexnational.edu.in",
        "approved_intake": 920,
        "risk_level": "High"
    },
    {
        "id": "INST-003",
        "aicte_permanent_id": "1-384910399",
        "name": "Swami Vivekananda Institute of Technology & Sciences",
        "aliases": ["Vivekananda Inst of Tech", "SVITS Secunderabad", "Vivekananda Tech Coll"],
        "region": "South-Central",
        "state": "Telangana",
        "district": "Hyderabad",
        "address": "Mahbub College Campus, Patny Centre, Secunderabad 500003",
        "type": "Private-Unaided",
        "approval_status": "Approved",
        "principal_name": "Dr. K. V. Ramanamurthy",
        "contact_email": "svits.director@svits.ac.in",
        "approved_intake": 640,
        "risk_level": "Medium"
    },
    {
        "id": "INST-004",
        "aicte_permanent_id": "1-492019481",
        "name": "Global Institute of Technology & Management",
        "aliases": ["GITM Gurugram", "Global Inst of Tech Gurgaon", "Global College of Engg & Mgmt"],
        "region": "North-West",
        "state": "Haryana",
        "district": "Gurugram",
        "address": "Farrukhnagar Road, Gurugram 122506",
        "type": "Private-Unaided",
        "approval_status": "Show Cause Issued",
        "principal_name": "Dr. Virender Choudhary",
        "contact_email": "info@gitm.ac.in",
        "approved_intake": 840,
        "risk_level": "High"
    },
    {
        "id": "INST-005",
        "aicte_permanent_id": "1-591029302",
        "name": "Maharaja Agrasen College of Engineering & Research",
        "aliases": ["Agrasen Engg College", "MACER Jaipur", "Maharaja Agrasen Inst of Tech"],
        "region": "North-West",
        "state": "Rajasthan",
        "district": "Jaipur",
        "address": "SP-43, RIICO Industrial Area, Kukas, Jaipur 302028",
        "type": "Private-Unaided",
        "approval_status": "Approved",
        "principal_name": "Dr. Mahendra P. Agarwal",
        "contact_email": "principal@macer.ac.in",
        "approved_intake": 540,
        "risk_level": "Low"
    },
    {
        "id": "INST-006",
        "aicte_permanent_id": "1-682019283",
        "name": "St. Xavier's Institute of Engineering & Technology",
        "aliases": ["St. Xaviers Engg College", "SXIET Kolkata", "Xavier Tech Inst"],
        "region": "Eastern",
        "state": "West Bengal",
        "district": "Kolkata",
        "address": "Action Area II, New Town, Kolkata 700156",
        "type": "Private-Aided",
        "approval_status": "Approved",
        "principal_name": "Fr. Dr. Dominic Savio",
        "contact_email": "rector@sxiet.edu.in",
        "approved_intake": 480,
        "risk_level": "Low"
    },
    {
        "id": "INST-007",
        "aicte_permanent_id": "1-771920394",
        "name": "Sri Krishna Devaraya College of Engineering",
        "aliases": ["SKD Engg College", "Sri Krishna Devaraya Tech", "SKDCE Anantapur"],
        "region": "South-Central",
        "state": "Andhra Pradesh",
        "district": "Anantapur",
        "address": "NH-44 Bypass Road, Gooty Road, Anantapur 515003",
        "type": "Private-Unaided",
        "approval_status": "Approved",
        "principal_name": "Dr. C. Prabhakar Reddy",
        "contact_email": "director@skdce.ac.in",
        "approved_intake": 600,
        "risk_level": "Medium"
    },
    {
        "id": "INST-008",
        "aicte_permanent_id": "1-882910293",
        "name": "Dr. A.P.J. Abdul Kalam Technical Campus",
        "aliases": ["APJ Abdul Kalam Inst of Engg", "Kalam Tech Campus Lucknow", "APJAKIT Lucknow"],
        "region": "Northern",
        "state": "Uttar Pradesh",
        "district": "Lucknow",
        "address": "Sec-7, Jankipuram Vistar, Sitapur Road, Lucknow 226031",
        "type": "State Government University Managed",
        "approval_status": "Approved",
        "principal_name": "Prof. Akhilesh Kumar",
        "contact_email": "director.campus@akitu.ac.in",
        "approved_intake": 1100,
        "risk_level": "Low"
    },
    {
        "id": "INST-009",
        "aicte_permanent_id": "1-912849102",
        "name": "Chandigarh Group of Applied Sciences & Engineering",
        "aliases": ["CGASE Mohali", "Chandigarh Group of Applied Sci", "Chandigarh Applied Engg"],
        "region": "North-West",
        "state": "Punjab",
        "district": "SAS Nagar (Mohali)",
        "address": "Landran-Banur Road, Mohali 140307",
        "type": "Private-Unaided",
        "approval_status": "Approved",
        "principal_name": "Dr. Harpreet Singh",
        "contact_email": "principal@cgase.ac.in",
        "approved_intake": 800,
        "risk_level": "Medium"
    },
    {
        "id": "INST-010",
        "aicte_permanent_id": "1-992019482",
        "name": "Saraswati Devi Memorial Engineering College",
        "aliases": ["SDM Engg College", "Saraswati Devi Inst of Tech", "SDMEC Lucknow"],
        "region": "Northern",
        "state": "Uttar Pradesh",
        "district": "Lucknow",
        "address": "Faizabad Road, Chinhat, Lucknow 226028",
        "type": "Private-Unaided",
        "approval_status": "Under Scrutiny",
        "principal_name": "Dr. Anoop Kumar Mishra",
        "contact_email": "director@sdmec.ac.in",
        "approved_intake": 420,
        "risk_level": "High"
    }
]

# Generate additional institutions up to 65 across all regions
NAME_PREFIXES = ["Sri", "National", "Modern", "Bharatiya", "Kalinga", "Deccan", "Sardar Vallabhbhai", "Indira", "Netaji Subhash", "Vidyapeeth", "Techno", "Heritage", "Pinnacle", "Acharya", "Chhatrapati"]
NAME_CENTERS = ["Institute of Technology & Science", "College of Engineering", "Institute of Management & Technology", "College of Technology & Applied Research", "Polytechnic Institute", "Faculty of Engineering & Innovation"]

inst_count = len(RAW_INSTITUTIONS_SEED)
for i in range(inst_count + 1, 66):
    reg_meta = REGIONS_METADATA[(i - 1) % len(REGIONS_METADATA)]
    st_tuple = reg_meta["states"][(i - 1) % len(reg_meta["states"])]
    state_name, city_name = st_tuple
    prefix = NAME_PREFIXES[(i * 3) % len(NAME_PREFIXES)]
    center = NAME_CENTERS[(i * 2) % len(NAME_CENTERS)]
    inst_name = f"{prefix} {center}, {city_name}"
    
    perm_id = f"1-{100000000 + (i * 142857) % 899999999}"
    aliases = [
        f"{prefix} Engg {city_name}",
        f"{prefix} Inst of Tech",
        f"{''.join([w[0] for w in prefix.split()])}IT {city_name}"
    ]
    RAW_INSTITUTIONS_SEED.append({
        "id": f"INST-{i:03d}",
        "aicte_permanent_id": perm_id,
        "name": inst_name,
        "aliases": aliases,
        "region": reg_meta["region"],
        "state": state_name,
        "district": city_name,
        "address": f"Survey No. {100 + i}, Sector {i % 25 + 1}, {city_name}, {state_name}",
        "type": "Private-Unaided" if i % 4 != 0 else "Government-Aided",
        "approval_status": "Approved" if i % 5 != 0 else "Under Scrutiny",
        "principal_name": f"Dr. {('Ramesh', 'Suresh', 'Anita', 'Venkatesh', 'Pooja', 'Anand')[i % 6]} {('Sharma', 'Gupta', 'Patel', 'Reddy', 'Iyer', 'Nair')[i % 6]}",
        "contact_email": f"principal.inst{i}@aicte-network.edu.in",
        "approved_intake": 300 + (i * 30) % 700,
        "risk_level": "High" if i % 7 == 0 else ("Medium" if i % 3 == 0 else "Low")
    })

INSTITUTIONS = RAW_INSTITUTIONS_SEED

# Complaint categories with standard SLA and Bureau mappings
CATEGORIES = [
    {"code": "faculty_salary", "name": "Faculty Salary Non-Payment", "default_bureau": "PGRC", "default_sla": 30},
    {"code": "unapproved_courses", "name": "Running Unapproved Courses / Norm Violation", "default_bureau": "RB", "default_sla": 45},
    {"code": "capitation_fee", "name": "Capitation Fee & Extortionate Demands", "default_bureau": "RB", "default_sla": 30},
    {"code": "fee_refund", "name": "Fee Refund Refusal / Withholding Certificates", "default_bureau": "PGRC", "default_sla": 21},
    {"code": "ragging_harassment", "name": "Ragging & Student Harassment", "default_bureau": "PGRC", "default_sla": 15},
    {"code": "infrastructure_deficiency", "name": "Severe Infrastructure & Lab Equipment Deficiencies", "default_bureau": "RO", "default_sla": 30},
    {"code": "court_litigation", "name": "Court Writ / Contempt Notice / Legal Disputes", "default_bureau": "LEGAL", "default_sla": 20},
    {"code": "approval_eoa_dispute", "name": "Extension of Approval / Fraudulent Faculty Bio-data", "default_bureau": "AB", "default_sla": 30}
]

STATUS_CHOICES = [
    "Received", "Under Scrutiny", "Under Process", "Pending (Awaiting Input)",
    "Action Initiated", "Transferred", "Escalated", "Disposed"
]


def calculate_sla_status(case: Dict[str, Any]) -> Dict[str, Any]:
    """Calculates live SLA timeline metrics for a given case."""
    days_ago = case.get("received_days_ago", 0)
    sla_days = case.get("sla_days", 30)
    received_date = BASE_DATE - timedelta(days=days_ago)
    due_date = received_date + timedelta(days=sla_days)
    
    days_remaining = sla_days - days_ago
    pct_elapsed = int((days_ago / sla_days) * 100) if sla_days > 0 else 100
    
    if case.get("status") in ["Disposed", "Duplicate/Closed"]:
        status_label = "Disposed within SLA"
        severity = "green"
    elif days_remaining < 0:
        status_label = f"SLA Breached ({abs(days_remaining)} days overdue)"
        severity = "red"
    elif pct_elapsed >= 80:
        status_label = f"SLA Warning ({days_remaining} days left - {pct_elapsed}% elapsed)"
        severity = "amber"
    else:
        status_label = f"On Track ({days_remaining} days left)"
        severity = "green"

    return {
        "received_date": received_date.strftime("%Y-%m-%d"),
        "due_date": due_date.strftime("%Y-%m-%d"),
        "days_elapsed": days_ago,
        "days_remaining": days_remaining,
        "pct_elapsed": pct_elapsed,
        "sla_label": status_label,
        "sla_severity": severity
    }


# Build 8 Curated Overlap Scenarios (High, Medium, and False Positive Threshold Edge Cases)
OVERLAP_CASES_SEED = [
    # Scenario 1 (Existing): INST-001 (Dr. BR Ambedkar Inst / A.B.C. Inst) - PGRC & RB
    {
        "id": "CS-2026-PGRC-00101",
        "source_ref_no": "PGRC-GRV-2026-8812",
        "institution_id": "INST-001",
        "submitted_name": "A.B.C. Institute of Technology",
        "category": "faculty_salary",
        "category_name": "Faculty Salary Non-Payment",
        "summary": "Non-payment of faculty monthly remuneration for 7 consecutive months and default in statutory PF deposits",
        "description": "Complaint filed by Karnataka Technical Teachers Forum on behalf of 42 assistant professors. The management has withheld salary payments since April 2026, failed to deposit Employee Provident Fund (EPF), and coerced faculty into signing blank attendance vouchers.",
        "complainant_type": "Faculty Association (Masked for DPDP compliance)",
        "source_channel": "PGRC Web Portal",
        "bureau_code": "PGRC",
        "bureau_name": "Public Grievance Redressal Cell",
        "assigned_officer": "Dr. Sunita Verma",
        "status": "Under Process",
        "priority": "High",
        "received_days_ago": 26,
        "sla_days": 30,
        "last_action": "Notice served to Management seeking explanation and bank salary statement",
        "last_action_date": "2026-10-18",
        "next_action": "Evaluate response submitted by Principal; initiate joint hearing",
        "expected_disposal_date": "2026-10-29",
        "actions_history": [
            {"timestamp": "2026-09-29 10:14:00", "by": "System Intake", "bureau": "PGRC", "action": "Case Registered", "remarks": "Received online complaint with 14 annexed salary slips."},
            {"timestamp": "2026-10-04 15:30:00", "by": "Dr. Sunita Verma", "bureau": "PGRC", "action": "Notice Issued", "remarks": "Show cause notice issued to Chairman & Principal with 15-day deadline."}
        ],
        "documents": [
            {"id": "DOC-101-1", "name": "Karnataka_Teachers_Forum_Petition.pdf", "size": 348210, "uploader": "Dr. Sunita Verma", "bureau": "PGRC", "timestamp": "2026-09-29 11:00:00", "file_type": "application/pdf"}
        ]
    },
    {
        "id": "CS-2026-RB-00102",
        "source_ref_no": "RB-INSP-2026-4419",
        "institution_id": "INST-001",
        "submitted_name": "Dr. B.R. Ambedkar Institute of Technology & Management",
        "category": "unapproved_courses",
        "category_name": "Running Unapproved Courses / Norm Violation",
        "summary": "Operating unapproved Post-Graduate Diploma programs and severe faculty shortage violating AICTE Cadre Ratio",
        "description": "Statutory non-compliance report submitted by Directorate of Technical Education (DTE) Karnataka. Institution is admitting students to unapproved PGDM in AI & Data Science and operating with 58% cadre ratio deficiency.",
        "complainant_type": "State Government Authority (DTE Karnataka)",
        "source_channel": "Official State D.O. Letter",
        "bureau_code": "RB",
        "bureau_name": "Regulation Bureau",
        "assigned_officer": "Shri Arvind Sharma",
        "status": "Under Process",
        "priority": "High",
        "received_days_ago": 18,
        "sla_days": 45,
        "last_action": "Inspection Committee constituted comprising Regional Officer and DTE Nominee",
        "last_action_date": "2026-10-15",
        "next_action": "Field verification report submission scheduled for 28-Oct-2026",
        "expected_disposal_date": "2026-11-21",
        "actions_history": [
            {"timestamp": "2026-10-07 11:20:00", "by": "DTE Liaison Cell", "bureau": "RB", "action": "Case Registered", "remarks": "Received DTE Karnataka inspection note."},
            {"timestamp": "2026-10-15 14:00:00", "by": "Shri Arvind Sharma", "bureau": "RB", "action": "Committee Constituted", "remarks": "Three-member Standing Hearing Committee nominated."}
        ],
        "documents": [
            {"id": "DOC-102-1", "name": "DTE_Karnataka_Inspection_Report.pdf", "size": 894120, "uploader": "Shri Arvind Sharma", "bureau": "RB", "timestamp": "2026-10-07 14:10:00", "file_type": "application/pdf"}
        ]
    },

    # Scenario 2 (Existing): INST-002 (Apex National Engg College) - RB & PGRC
    {
        "id": "CS-2026-RB-00201",
        "source_ref_no": "RB-CMP-2026-9021",
        "institution_id": "INST-002",
        "submitted_name": "Apex National Engineering College, Pune",
        "category": "capitation_fee",
        "category_name": "Capitation Fee & Extortionate Demands",
        "summary": "Demanding cash donations exceeding Rs. 4,50,000 for NRI/Institutional quota admissions",
        "description": "Complaint submitted with audio recordings and handwritten demand slips. Parents allege college trust mandates Rs 4.5 lakh cash donation over and above Maharashtra CET Fee Regulating Authority approved ceiling.",
        "complainant_type": "Parents Welfare Association, Pune",
        "source_channel": "Chairman Secretarial Reference",
        "bureau_code": "RB",
        "bureau_name": "Regulation Bureau",
        "assigned_officer": "Shri Arvind Sharma",
        "status": "Action Initiated",
        "priority": "High",
        "received_days_ago": 22,
        "sla_days": 30,
        "last_action": "Referred to State Anti-Corruption Bureau & Regional Officer for surprise inspection",
        "last_action_date": "2026-10-19",
        "next_action": "Await preliminary vigilance report from Maharashtra ACB Liaison",
        "expected_disposal_date": "2026-11-02",
        "actions_history": [
            {"timestamp": "2026-10-03 16:00:00", "by": "Secretariat", "bureau": "RB", "action": "Case Registered", "remarks": "Urgent reference marked by AICTE Member Secretary."},
            {"timestamp": "2026-10-19 12:30:00", "by": "Shri Arvind Sharma", "bureau": "RB", "action": "Vigilance Notice", "remarks": "Statutory warning issued under AICTE Approval Process Handbook Clause 4.2."}
        ],
        "documents": [
            {"id": "DOC-201-1", "name": "Parent_Affidavit_Donation_Receipts.pdf", "size": 612040, "uploader": "Shri Arvind Sharma", "bureau": "RB", "timestamp": "2026-10-03 16:30:00", "file_type": "application/pdf"}
        ]
    },
    {
        "id": "CS-2026-PGRC-00202",
        "source_ref_no": "PGRC-STU-2026-3109",
        "institution_id": "INST-002",
        "submitted_name": "Apex Inst of Tech & Sci Pune",
        "category": "fee_refund",
        "category_name": "Fee Refund Refusal / Withholding Certificates",
        "summary": "Withholding 10th & 12th original marksheets and refusing fee refund after admission cancellation",
        "description": "Multiple student representations (19 B.Tech first year candidates) regarding forfeiture of Rs. 1,45,000 tuition fees and withholding original certificates upon securing admission in Government Engineering College Pune.",
        "complainant_type": "Aggrieved Students Group",
        "source_channel": "CPGRAMS Ingestion",
        "bureau_code": "PGRC",
        "bureau_name": "Public Grievance Redressal Cell",
        "assigned_officer": "Dr. Sunita Verma",
        "status": "Under Process",
        "priority": "Medium",
        "received_days_ago": 14,
        "sla_days": 21,
        "last_action": "Notice served directing immediate return of original documents within 7 working days",
        "last_action_date": "2026-10-17",
        "next_action": "Verify return receipts submitted by students; impose penalty if not complied",
        "expected_disposal_date": "2026-11-01",
        "actions_history": [
            {"timestamp": "2026-10-11 09:45:00", "by": "CPGRAMS Gateway", "bureau": "PGRC", "action": "Case Registered", "remarks": "Ingested via National CPGRAMS portal."},
            {"timestamp": "2026-10-17 11:00:00", "by": "Dr. Sunita Verma", "bureau": "PGRC", "action": "Compliance Directive", "remarks": "Direct order issued referencing AICTE Public Notice on Fee Refund."}
        ],
        "documents": [
            {"id": "DOC-202-1", "name": "CPGRAMS_Grievance_Batch_2026.pdf", "size": 420100, "uploader": "Dr. Sunita Verma", "bureau": "PGRC", "timestamp": "2026-10-11 10:15:00", "file_type": "application/pdf"}
        ]
    },

    # Scenario 3: INST-003 (Swami Vivekananda) - RO & RB
    {
        "id": "CS-2026-RO-00301",
        "source_ref_no": "RO-SC-2026-1092",
        "institution_id": "INST-003",
        "submitted_name": "SVITS Secunderabad",
        "category": "infrastructure_deficiency",
        "category_name": "Severe Infrastructure & Lab Equipment Deficiencies",
        "summary": "Computer science laboratories lack basic server hardware and electrical backup during university examinations",
        "description": "Inspection report conducted by Regional Office South-Central following student agitation during lab examinations. 3 out of 5 computer labs were found locked or lacking licensed software and internet bandwidth.",
        "complainant_type": "Regional Inspection Committee",
        "source_channel": "Field Verification Visit",
        "bureau_code": "RO",
        "bureau_name": "Regional Offices (AICTE)",
        "assigned_officer": "Shri M. Sundaram",
        "status": "Under Scrutiny",
        "priority": "Medium",
        "received_days_ago": 16,
        "sla_days": 30,
        "last_action": "Deficiency statement forwarded to Principal for time-bound rectification",
        "last_action_date": "2026-10-16",
        "next_action": "Surprise re-inspection scheduled for first week of November",
        "expected_disposal_date": "2026-11-08",
        "actions_history": [
            {"timestamp": "2026-10-09 14:00:00", "by": "Shri M. Sundaram", "bureau": "RO", "action": "Inspection Logged", "remarks": "Field report uploaded after spot inspection."}
        ],
        "documents": [
            {"id": "DOC-301-1", "name": "Spot_Inspection_Photos_SVITS.pdf", "size": 1280900, "uploader": "Shri M. Sundaram", "bureau": "RO", "timestamp": "2026-10-09 14:30:00", "file_type": "application/pdf"}
        ]
    },
    {
        "id": "CS-2026-RB-00302",
        "source_ref_no": "RB-DEV-2026-3829",
        "institution_id": "INST-003",
        "submitted_name": "Swami Vivekananda Institute of Technology & Sciences",
        "category": "unapproved_courses",
        "category_name": "Running Unapproved Courses / Norm Violation",
        "summary": "Operating unapproved evening diploma shifts utilizing common faculty without AICTE sanction",
        "description": "Complaint by local technical education union alleging dual usage of laboratories and classroom spaces for unapproved evening diploma batches without separate sanction.",
        "complainant_type": "Education Activist Group",
        "source_channel": "Email Grievance Cell",
        "bureau_code": "RB",
        "bureau_name": "Regulation Bureau",
        "assigned_officer": "Shri Arvind Sharma",
        "status": "Under Process",
        "priority": "High",
        "received_days_ago": 12,
        "sla_days": 45,
        "last_action": "Cross-verification requested with Approval Bureau master portal records",
        "last_action_date": "2026-10-18",
        "next_action": "Joint scrutiny meeting with Regional Officer (South-Central)",
        "expected_disposal_date": "2026-11-27",
        "actions_history": [
            {"timestamp": "2026-10-13 11:00:00", "by": "System Intake", "bureau": "RB", "action": "Case Registered", "remarks": "Logged from grievance mailbox."}
        ],
        "documents": [
            {"id": "DOC-302-1", "name": "Evening_Shift_Flyer_Evidence.pdf", "size": 490120, "uploader": "Shri Arvind Sharma", "bureau": "RB", "timestamp": "2026-10-13 11:30:00", "file_type": "application/pdf"}
        ]
    },

    # Scenario 4: INST-004 (Global Institute) - PGRC & RB (Spelling variation: GITM Gurugram vs Global College)
    {
        "id": "CS-2026-PGRC-00401",
        "source_ref_no": "PGRC-RAG-2026-0912",
        "institution_id": "INST-004",
        "submitted_name": "GITM Gurugram",
        "category": "ragging_harassment",
        "category_name": "Ragging & Student Harassment",
        "summary": "Hostel ragging incident and failure of Anti-Ragging Committee to file FIR within 24 hours",
        "description": "Grievance received via National Anti-Ragging Helpline. 2nd year hostelers subjected 1st year students to physical humiliation. College administration concealed incident and failed to inform local police station.",
        "complainant_type": "Anonymous Student / Anti-Ragging Helpline",
        "source_channel": "National Anti-Ragging Helpline",
        "bureau_code": "PGRC",
        "bureau_name": "Public Grievance Redressal Cell",
        "assigned_officer": "Dr. Sunita Verma",
        "status": "Action Initiated",
        "priority": "High",
        "received_days_ago": 8,
        "sla_days": 15,
        "last_action": "FIR mandated; explanation called from Chairman of Anti-Ragging Committee",
        "last_action_date": "2026-10-21",
        "next_action": "Receive certified copy of police FIR and suspension orders of errant students",
        "expected_disposal_date": "2026-11-01",
        "actions_history": [
            {"timestamp": "2026-10-17 08:30:00", "by": "Anti-Ragging API", "bureau": "PGRC", "action": "Urgent Intake", "remarks": "Alert received from National Helpline."}
        ],
        "documents": [
            {"id": "DOC-401-1", "name": "Helpline_Call_Log_Transcript.pdf", "size": 182300, "uploader": "Dr. Sunita Verma", "bureau": "PGRC", "timestamp": "2026-10-17 09:00:00", "file_type": "application/pdf"}
        ]
    },
    {
        "id": "CS-2026-RB-00402",
        "source_ref_no": "RB-SHC-2026-4402",
        "institution_id": "INST-004",
        "submitted_name": "Global College of Engg & Mgmt Gurgaon",
        "category": "unapproved_courses",
        "category_name": "Running Unapproved Courses / Norm Violation",
        "summary": "Show-cause issued for appointing unqualified Principal and bogus faculty bio-data on portal",
        "description": "Scrutiny of faculty portal reveals Principal lacks mandatory Ph.D in appropriate branch and 4 faculty members are concurrently shown on rolls of an institution in Rohtak.",
        "complainant_type": "Whistleblower Faculty Member",
        "source_channel": "CPGRAMS Ingestion",
        "bureau_code": "RB",
        "bureau_name": "Regulation Bureau",
        "assigned_officer": "Shri Arvind Sharma",
        "status": "Under Process",
        "priority": "High",
        "received_days_ago": 29,
        "sla_days": 30,
        "last_action": "Explanation received from Trust; verified against National Academic Depository",
        "last_action_date": "2026-10-20",
        "next_action": "Submit matter to Standing Hearing Committee for withdrawal of approval recommendation",
        "expected_disposal_date": "2026-10-26",
        "actions_history": [
            {"timestamp": "2026-09-26 12:00:00", "by": "CPGRAMS", "bureau": "RB", "action": "Case Registered", "remarks": "Ingested from CPGRAMS."}
        ],
        "documents": [
            {"id": "DOC-402-1", "name": "Whistleblower_Faculty_Comparison_Sheet.pdf", "size": 521400, "uploader": "Shri Arvind Sharma", "bureau": "RB", "timestamp": "2026-09-26 12:45:00", "file_type": "application/pdf"}
        ]
    },

    # Scenario 5: INST-005 (Maharaja Agrasen) - LEGAL & AB
    {
        "id": "CS-2026-LEGAL-00501",
        "source_ref_no": "LEGAL-WP-2026-1029",
        "institution_id": "INST-005",
        "submitted_name": "Maharaja Agrasen College of Engineering & Research",
        "category": "court_litigation",
        "category_name": "Court Writ / Contempt Notice / Legal Disputes",
        "summary": "Writ Petition (Civil) No. 4412/2026 before Rajasthan High Court challenging intake reduction",
        "description": "High Court issued notice returnable in two weeks regarding reduction of B.Tech Computer Engineering seats from 180 to 60 due to cadastral land conversion delay.",
        "complainant_type": "High Court Notice / Advocate on Record",
        "source_channel": "Court Notice via Legal Registry",
        "bureau_code": "LEGAL",
        "bureau_name": "Legal Cell",
        "assigned_officer": "Adv. Meenakshi Joshi",
        "status": "Under Process",
        "priority": "Critical",
        "received_days_ago": 11,
        "sla_days": 20,
        "last_action": "Counter affidavit draft vetted by Government Counsel and forwarded to Approval Bureau",
        "last_action_date": "2026-10-22",
        "next_action": "File counter affidavit before Registrar High Court bench by 29-Oct-2026",
        "expected_disposal_date": "2026-11-04",
        "actions_history": [
            {"timestamp": "2026-10-14 10:15:00", "by": "Adv. Meenakshi Joshi", "bureau": "LEGAL", "action": "Writ Docketed", "remarks": "Received writ petition petition papers."}
        ],
        "documents": [
            {"id": "DOC-501-1", "name": "WP_4412_2026_Notice_Petition.pdf", "size": 1540900, "uploader": "Adv. Meenakshi Joshi", "bureau": "LEGAL", "timestamp": "2026-10-14 11:00:00", "file_type": "application/pdf"}
        ]
    },
    {
        "id": "CS-2026-AB-00502",
        "source_ref_no": "AB-EOA-2026-9812",
        "institution_id": "INST-005",
        "submitted_name": "MACER Jaipur",
        "category": "approval_eoa_dispute",
        "category_name": "Extension of Approval / Fraudulent Faculty Bio-data",
        "summary": "Review of Extension of Approval (EoA) 2026-27 following dispute over land title records in Kukas RIICO",
        "description": "Approval Bureau processing scrutiny appeal filed by institution following withholding of EoA for academic year 2026-27.",
        "complainant_type": "Institutional Appeal Application",
        "source_channel": "AICTE Approval Portal",
        "bureau_code": "AB",
        "bureau_name": "Approval Bureau",
        "assigned_officer": "Shri Arvind Sharma",
        "status": "Pending (Awaiting Input)",
        "priority": "High",
        "received_days_ago": 19,
        "sla_days": 30,
        "last_action": "Clarification sought from Legal Cell regarding impact of pending High Court writ petition",
        "last_action_date": "2026-10-17",
        "next_action": "Joint consultation between Approval Bureau Director and Senior Law Officer",
        "expected_disposal_date": "2026-11-05",
        "actions_history": [
            {"timestamp": "2026-10-06 15:30:00", "by": "Approval Bureau", "bureau": "AB", "action": "Case Registered", "remarks": "Appeal filed against rejection order."}
        ],
        "documents": [
            {"id": "DOC-502-1", "name": "EoA_Scrutiny_Appeal_2026.pdf", "size": 680200, "uploader": "Shri Arvind Sharma", "bureau": "AB", "timestamp": "2026-10-06 16:00:00", "file_type": "application/pdf"}
        ]
    },

    # Scenario 6: INST-006 (St. Xavier's) - RO & RB
    {
        "id": "CS-2026-RO-00601",
        "source_ref_no": "RO-ER-2026-3391",
        "institution_id": "INST-006",
        "submitted_name": "St. Xaviers Engg College Kolkata",
        "category": "infrastructure_deficiency",
        "category_name": "Severe Infrastructure & Lab Equipment Deficiencies",
        "summary": "Commercial construction and IT park development on designated institutional educational land",
        "description": "Spot verification by Eastern Regional Office indicates 2.4 acres of designated institutional land is leased out to private IT vendor in violation of AICTE Land Use norms.",
        "complainant_type": "Citizens Group / RTI Activist",
        "source_channel": "RTI Reference Ingestion",
        "bureau_code": "RO",
        "bureau_name": "Regional Offices (AICTE)",
        "assigned_officer": "Shri M. Sundaram",
        "status": "Under Process",
        "priority": "High",
        "received_days_ago": 24,
        "sla_days": 30,
        "last_action": "Detailed land measurement report submitted to Member Secretary and Regulation Bureau",
        "last_action_date": "2026-10-18",
        "next_action": "Transfer to Regulation Bureau for initiation of Withdrawal of Approval proceedings",
        "expected_disposal_date": "2026-10-31",
        "actions_history": [
            {"timestamp": "2026-10-01 10:00:00", "by": "System Intake", "bureau": "RO", "action": "Case Registered", "remarks": "RTI reference received."}
        ],
        "documents": [
            {"id": "DOC-601-1", "name": "Kolkata_Land_Cadastral_Survey.pdf", "size": 940300, "uploader": "Shri M. Sundaram", "bureau": "RO", "timestamp": "2026-10-01 10:30:00", "file_type": "application/pdf"}
        ]
    },
    {
        "id": "CS-2026-RB-00602",
        "source_ref_no": "RB-LND-2026-5591",
        "institution_id": "INST-006",
        "submitted_name": "St. Xavier's Institute of Engineering & Technology",
        "category": "unapproved_courses",
        "category_name": "Running Unapproved Courses / Norm Violation",
        "summary": "Non-compliance with contiguous land requirement and unauthorized commercial sub-leasing",
        "description": "Complaint filed regarding bifurcation of college campus and diversion of institutional infrastructure for non-academic corporate training.",
        "complainant_type": "Faculty & Staff Welfare Council",
        "source_channel": "Official Complaint",
        "bureau_code": "RB",
        "bureau_name": "Regulation Bureau",
        "assigned_officer": "Shri Arvind Sharma",
        "status": "Under Scrutiny",
        "priority": "Medium",
        "received_days_ago": 17,
        "sla_days": 45,
        "last_action": "Notice served to Trust President to produce registered lease agreements",
        "last_action_date": "2026-10-17",
        "next_action": "Standing Hearing Committee date scheduled for 04-Nov-2026",
        "expected_disposal_date": "2026-11-23",
        "actions_history": [
            {"timestamp": "2026-10-08 14:00:00", "by": "Shri Arvind Sharma", "bureau": "RB", "action": "Notice Issued", "remarks": "Notice issued."}
        ],
        "documents": [
            {"id": "DOC-602-1", "name": "Notice_To_Trust_Sublease.pdf", "size": 310500, "uploader": "Shri Arvind Sharma", "bureau": "RB", "timestamp": "2026-10-08 14:30:00", "file_type": "application/pdf"}
        ]
    },

    # Scenario 7: INST-008 (Dr. APJ Abdul Kalam) - PGRC & RB (Spelling variation: APJAKIT vs Kalam Tech Campus)
    {
        "id": "CS-2026-PGRC-00801",
        "source_ref_no": "PGRC-FEE-2026-7789",
        "institution_id": "INST-008",
        "submitted_name": "APJ Abdul Kalam Inst of Engg Lucknow",
        "category": "fee_refund",
        "category_name": "Fee Refund Refusal / Withholding Certificates",
        "summary": "Delay in disbursing state post-matric scholarship refunds to SC/ST student bank accounts",
        "description": "Grievance petition by 64 second-year students. College finance office withheld DBT scholarship amounts disbursed by UP Social Welfare Department instead of crediting to student bank accounts.",
        "complainant_type": "Student Representative Body",
        "source_channel": "UP Jansunwai Portal Integration",
        "bureau_code": "PGRC",
        "bureau_name": "Public Grievance Redressal Cell",
        "assigned_officer": "Dr. Sunita Verma",
        "status": "Under Process",
        "priority": "High",
        "received_days_ago": 15,
        "sla_days": 21,
        "last_action": "Joint letter dispatched to District Social Welfare Officer and College Principal",
        "last_action_date": "2026-10-19",
        "next_action": "Reconciliation statement of student bank disbursements required",
        "expected_disposal_date": "2026-10-31",
        "actions_history": [
            {"timestamp": "2026-10-10 11:20:00", "by": "System Ingestion", "bureau": "PGRC", "action": "Case Registered", "remarks": "Ingested via Jansunwai."}
        ],
        "documents": [
            {"id": "DOC-801-1", "name": "Scholarship_Beneficiary_Ledger.pdf", "size": 418200, "uploader": "Dr. Sunita Verma", "bureau": "PGRC", "timestamp": "2026-10-10 11:50:00", "file_type": "application/pdf"}
        ]
    },
    {
        "id": "CS-2026-RB-00802",
        "source_ref_no": "RB-AUD-2026-1182",
        "institution_id": "INST-008",
        "submitted_name": "Dr. A.P.J. Abdul Kalam Technical Campus",
        "category": "unapproved_courses",
        "category_name": "Running Unapproved Courses / Norm Violation",
        "summary": "Special financial audit report indicates diversion of student scholarship corpus into general administrative fund",
        "description": "Comptroller & Auditor General (CAG) audit observation forwarded by Ministry of Education regarding financial irregularity in management of government scholarship funds.",
        "complainant_type": "Ministry of Education / Audit Wing",
        "source_channel": "Official Ministry Reference",
        "bureau_code": "RB",
        "bureau_name": "Regulation Bureau",
        "assigned_officer": "Shri Arvind Sharma",
        "status": "Under Process",
        "priority": "High",
        "received_days_ago": 13,
        "sla_days": 45,
        "last_action": "Special finance inspection team ordered by AICTE Chairman",
        "last_action_date": "2026-10-21",
        "next_action": "Finance team audit scheduled to begin 27-Oct-2026",
        "expected_disposal_date": "2026-11-25",
        "actions_history": [
            {"timestamp": "2026-10-12 16:00:00", "by": "MoE Liaison Cell", "bureau": "RB", "action": "Audit Ingestion", "remarks": "Reference received from MoE."}
        ],
        "documents": [
            {"id": "DOC-802-1", "name": "CAG_Special_Audit_Extract.pdf", "size": 710200, "uploader": "Shri Arvind Sharma", "bureau": "RB", "timestamp": "2026-10-12 16:30:00", "file_type": "application/pdf"}
        ]
    },

    # Scenario 8 (Threshold Border / False Positive Behavior Test): INST-009 (Chandigarh Group)
    # Two complaints on same institution, but totally unrelated categories & 90 days apart
    {
        "id": "CS-2026-PGRC-00901",
        "source_ref_no": "PGRC-SPRT-2026-1102",
        "institution_id": "INST-009",
        "submitted_name": "Chandigarh Group of Applied Sciences & Engineering",
        "category": "fee_refund",
        "category_name": "Fee Refund Refusal / Withholding Certificates",
        "summary": "Sports gym fee refund request of Rs. 1,500 after annual sports meet was concluded",
        "description": "Individual grievance from a student seeking refund of optional gym facilities fee of Rs 1,500 due to graduation.",
        "complainant_type": "Individual Student",
        "source_channel": "Web Portal",
        "bureau_code": "PGRC",
        "bureau_name": "Public Grievance Redressal Cell",
        "assigned_officer": "Dr. Sunita Verma",
        "status": "Disposed",
        "priority": "Low",
        "received_days_ago": 88,
        "sla_days": 21,
        "last_action": "Refund processed by college accountant; matter resolved with student acknowledgment",
        "last_action_date": "2026-08-15",
        "next_action": "None - case closed",
        "expected_disposal_date": "2026-08-18",
        "actions_history": [
            {"timestamp": "2026-07-29 10:00:00", "by": "Web Ingestion", "bureau": "PGRC", "action": "Case Registered", "remarks": "Registered."},
            {"timestamp": "2026-08-15 11:00:00", "by": "Dr. Sunita Verma", "bureau": "PGRC", "action": "Disposed", "remarks": "Closed after refund confirmation."}
        ],
        "documents": [
            {"id": "DOC-901-1", "name": "Student_Refund_Voucher_Acknowledgment.pdf", "size": 115000, "uploader": "Dr. Sunita Verma", "bureau": "PGRC", "timestamp": "2026-08-15 11:15:00", "file_type": "application/pdf"}
        ]
    },
    {
        "id": "CS-2026-RO-00902",
        "source_ref_no": "RO-NW-2026-5912",
        "institution_id": "INST-009",
        "submitted_name": "CGASE Mohali",
        "category": "infrastructure_deficiency",
        "category_name": "Severe Infrastructure & Lab Equipment Deficiencies",
        "summary": "Routine enquiry into procurement of mechanical workshop lathe machines",
        "description": "Routine verification regarding modernization of mechanical engineering lathe machines under AICTE MODROBS grant scheme.",
        "complainant_type": "Institutional Progress Report",
        "source_channel": "MODROBS Portal",
        "bureau_code": "RO",
        "bureau_name": "Regional Offices (AICTE)",
        "assigned_officer": "Shri M. Sundaram",
        "status": "Disposed",
        "priority": "Low",
        "received_days_ago": 5,
        "sla_days": 30,
        "last_action": "MODROBS utilization certificate approved by Regional Office",
        "last_action_date": "2026-10-23",
        "next_action": "None - closed",
        "expected_disposal_date": "2026-11-19",
        "actions_history": [
            {"timestamp": "2026-10-20 14:00:00", "by": "MODROBS Portal", "bureau": "RO", "action": "Intake", "remarks": "Logged."}
        ],
        "documents": [
            {"id": "DOC-902-1", "name": "MODROBS_Utilization_Certificate.pdf", "size": 390200, "uploader": "Shri M. Sundaram", "bureau": "RO", "timestamp": "2026-10-20 14:30:00", "file_type": "application/pdf"}
        ]
    },

    # Scenario 9 (Critical Cross-Bureau Escalation): INST-010 (Saraswati Devi Memorial) - LEGAL & PGRC
    {
        "id": "CS-2026-LEGAL-01001",
        "source_ref_no": "LEGAL-CRIM-2026-0044",
        "institution_id": "INST-010",
        "submitted_name": "Saraswati Devi Memorial Engineering College Lucknow",
        "category": "court_litigation",
        "category_name": "Court Writ / Contempt Notice / Legal Disputes",
        "summary": "Police Special Task Force (STF) charge-sheet regarding issuance of fraudulent degree certificates",
        "description": "UP Police STF communication regarding criminal conspiracy involving printing of back-dated B.Tech degree certificates and fraudulent marksheets using forged AICTE Holograms.",
        "complainant_type": "Police Agency (UP STF Cyber Cell)",
        "source_channel": "Official Law Enforcement Letter",
        "bureau_code": "LEGAL",
        "bureau_name": "Legal Cell",
        "assigned_officer": "Adv. Meenakshi Joshi",
        "status": "Escalated",
        "priority": "Critical",
        "received_days_ago": 10,
        "sla_days": 20,
        "last_action": "Matter briefed to AICTE Chairman; recommendation sent for immediate Withdrawal of Approval",
        "last_action_date": "2026-10-22",
        "next_action": "Emergency Executive Committee meeting for formal withdrawal of approval",
        "expected_disposal_date": "2026-11-04",
        "actions_history": [
            {"timestamp": "2026-10-15 10:00:00", "by": "Adv. Meenakshi Joshi", "bureau": "LEGAL", "action": "STF Ingestion", "remarks": "Urgent crime dossier registered."}
        ],
        "documents": [
            {"id": "DOC-1001-1", "name": "STF_FIR_ChargeSheet_Copy.pdf", "size": 1940200, "uploader": "Adv. Meenakshi Joshi", "bureau": "LEGAL", "timestamp": "2026-10-15 10:30:00", "file_type": "application/pdf"}
        ]
    },
    {
        "id": "CS-2026-PGRC-01002",
        "source_ref_no": "PGRC-GRV-2026-9931",
        "institution_id": "INST-010",
        "submitted_name": "SDMEC Lucknow",
        "category": "faculty_salary",
        "category_name": "Faculty Salary Non-Payment",
        "summary": "Mass resignation of 28 faculty members and complaints of extortion of signature on forged appointment letters",
        "description": "Faculty complaints alleging management utilized their identities on portal without paying salaries and forced them into signing blank papers now investigated in police fake degree probe.",
        "complainant_type": "Faculty Action Committee",
        "source_channel": "PGRC Web Portal",
        "bureau_code": "PGRC",
        "bureau_name": "Public Grievance Redressal Cell",
        "assigned_officer": "Dr. Sunita Verma",
        "status": "Escalated",
        "priority": "High",
        "received_days_ago": 9,
        "sla_days": 30,
        "last_action": "Statements of 14 faculty members recorded via video-conferencing",
        "last_action_date": "2026-10-21",
        "next_action": "Coordinate with Legal Cell and Regulation Bureau for consolidated closure",
        "expected_disposal_date": "2026-11-14",
        "actions_history": [
            {"timestamp": "2026-10-16 11:30:00", "by": "System Intake", "bureau": "PGRC", "action": "Case Registered", "remarks": "Registered."}
        ],
        "documents": [
            {"id": "DOC-1002-1", "name": "Faculty_Mass_Affidavit.pdf", "size": 840200, "uploader": "Dr. Sunita Verma", "bureau": "PGRC", "timestamp": "2026-10-16 12:00:00", "file_type": "application/pdf"}
        ]
    }
]

# Generate realistic remaining cases across institutions to reach 215+ total cases
CASES_SEED: List[Dict[str, Any]] = list(OVERLAP_CASES_SEED)

officer_by_bureau = {
    "RB": "Shri Arvind Sharma",
    "PGRC": "Dr. Sunita Verma",
    "RO": "Shri M. Sundaram",
    "LEGAL": "Adv. Meenakshi Joshi",
    "AB": "Shri Arvind Sharma"
}

# Distribute diverse cases across all 65 institutions
case_counter = len(CASES_SEED) + 1
random.seed(26264)  # Deterministic seed for reproducible realistic data

# Template complaints for realistic variations
SAMPLE_COMPLAINTS = [
    {
        "cat_code": "faculty_salary",
        "summary": "Non-payment of 6th/7th Pay Commission revised scales and arrears for 2 years",
        "desc": "Faculty representation asserting that despite AICTE 7th CPC mandates, institution continues paying consolidated substandard honorarium and threatens termination upon demanding legal entitlements.",
        "complainant": "Faculty Association",
        "last_action": "Management directed to produce audited balance sheet and salary disbursement bank accounts",
        "next_action": "Scrutiny of bank statements submitted by Principal"
    },
    {
        "cat_code": "fee_refund",
        "summary": "Refusal to refund caution deposit of Rs. 25,000 to passed-out batch students",
        "desc": "Alumni complaint regarding withholding of refundable institutional caution deposit and library deposit beyond the mandatory 60 days following degree completion.",
        "complainant": "Graduated Student Batch",
        "last_action": "Statutory demand notice issued under Section 10 of AICTE Act",
        "next_action": "Reconciliation of caution money deposit ledger"
    },
    {
        "cat_code": "unapproved_courses",
        "summary": "Conducting unapproved integrated B.Tech + MBA collaborative program with foreign university",
        "desc": "Inspection reveals institution entered into unauthorized MoU with unaccredited offshore institute to grant dual degrees without prior AICTE Approval Bureau clearance.",
        "complainant": "Student & Parent Council",
        "last_action": "Show-cause issued; admissions halted pending Standing Hearing Committee review",
        "next_action": "Hearing before Standing Appellate Committee (SAC)"
    },
    {
        "cat_code": "infrastructure_deficiency",
        "summary": "Inadequate fire safety clearance and lack of fire egress stairs in 5-story engineering block",
        "desc": "Local Fire & Emergency Services Department notice forwarded citing lack of functional water hydrants and expired NOC in academic building.",
        "complainant": "State Municipal Corporation",
        "last_action": "Regional Officer directed to conduct spot physical safety inspection",
        "next_action": "Submit spot fire safety inspection report within 10 days"
    },
    {
        "cat_code": "ragging_harassment",
        "summary": "Allegation of discriminatory attendance marking and harassment by Head of Department",
        "desc": "Student grievance alleging vindictive denial of hall ticket and internal assessment marks following complaint against faculty member.",
        "complainant": "Student Welfare Cell",
        "last_action": "Institutional Internal Complaints Committee (ICC) ordered to submit enquiry findings",
        "next_action": "Review of confidential ICC enquiry report"
    },
    {
        "cat_code": "capitation_fee",
        "summary": "Mandatory purchase of overpriced laptops and study material through private vendor",
        "desc": "First-year engineering students coerced to pay mandatory additional Rs. 85,000 for standard laptop bundled by management-owned entity.",
        "complainant": "Aggrieved Parent",
        "last_action": "Direct instruction issued to make laptop procurement optional",
        "next_action": "Verify compliance report and refund vouchers"
    },
    {
        "cat_code": "court_litigation",
        "summary": "Contempt of Court petition regarding compliance with judicial directions on staff reinstatement",
        "desc": "Legal notice regarding non-compliance with State Educational Tribunal award mandating reinstatement of senior associate professor.",
        "complainant": "Advocate on Record",
        "last_action": "Legal opinion obtained from Senior Standing Counsel",
        "next_action": "Affidavit preparation for filing before High Court Registrar"
    },
    {
        "cat_code": "approval_eoa_dispute",
        "summary": "Surprise audit reveals 14 ghost faculty members registered with duplicated PAN details",
        "desc": "AICTE Approval Portal automated anomaly detection flagged identical PAN numbers used across multiple engineering colleges in the same cluster.",
        "complainant": "AICTE Portal Anomaly Detection Engine",
        "last_action": "Biometric verification mandated for all 14 listed faculty members",
        "next_action": "Physical attendance verification through Regional Office nominee"
    }
]

# Generate up to 215 cases to meet and exceed 200+ case requirement
while len(CASES_SEED) < 215:
    inst_idx = (case_counter % len(INSTITUTIONS))
    inst = INSTITUTIONS[inst_idx]
    
    template = SAMPLE_COMPLAINTS[case_counter % len(SAMPLE_COMPLAINTS)]
    cat_match = next((c for c in CATEGORIES if c["code"] == template["cat_code"]), CATEGORIES[0])
    
    # Bureau assignment
    bureau_code = cat_match["default_bureau"]
    # Introduce occasional cross-bureau assignments (e.g. RO doing field checks for RB)
    if case_counter % 7 == 0:
        bureau_code = "RO"
    elif case_counter % 11 == 0:
        bureau_code = "LEGAL"
    
    bureau_info = next((b for b in BUREAUS if b["code"] == bureau_code), BUREAUS[0])
    assigned_officer = officer_by_bureau.get(bureau_code, "Assigned Officer")
    
    # Varied ageing across the 5 required buckets: 0-7, 8-15, 16-30, 31-60, 60+ days
    bucket_seed = case_counter % 5
    if bucket_seed == 0:
        days_ago = random.randint(1, 6)
    elif bucket_seed == 1:
        days_ago = random.randint(8, 14)
    elif bucket_seed == 2:
        days_ago = random.randint(16, 29)
    elif bucket_seed == 3:
        days_ago = random.randint(31, 58)
    else:
        days_ago = random.randint(62, 95)
    
    sla_days = cat_match["default_sla"]
    received_date = BASE_DATE - timedelta(days=days_ago)
    expected_disposal = received_date + timedelta(days=sla_days)
    
    # Varied statuses
    if days_ago > 65 and case_counter % 2 == 0:
        status = "Disposed"
    elif days_ago > 40 and case_counter % 3 == 0:
        status = "Escalated"
    elif days_ago > 30 and case_counter % 4 == 0:
        status = "Transferred"
    elif days_ago > 20:
        status = random.choice(["Under Process", "Action Initiated", "Pending (Awaiting Input)"])
    else:
        status = random.choice(["Received", "Under Scrutiny", "Under Process"])
    
    # Priority
    priority = "High" if (case_counter % 4 == 0 or days_ago > sla_days) else ("Low" if case_counter % 6 == 0 else "Medium")
    
    last_act_days_ago = max(1, days_ago - random.randint(1, 8))
    last_act_date = (BASE_DATE - timedelta(days=last_act_days_ago)).strftime("%Y-%m-%d")
    
    case_id = f"CS-2026-{bureau_code}-{case_counter:05d}"
    
    case_obj = {
        "id": case_id,
        "source_ref_no": f"{bureau_code}-PORTAL-2026-{case_counter + 3000}",
        "institution_id": inst["id"],
        "submitted_name": random.choice([inst["name"]] + inst["aliases"]),
        "category": cat_match["code"],
        "category_name": cat_match["name"],
        "summary": f"{template['summary']} at {inst['name'][:40]}",
        "description": f"{template['desc']} Reference institution: {inst['name']} ({inst['district']}, {inst['state']}).",
        "complainant_type": template["complainant"],
        "source_channel": random.choice(["CPGRAMS Portal", "AICTE Grievance Portal", "Registered Post", "State Govt Reference"]),
        "bureau_code": bureau_code,
        "bureau_name": bureau_info["name"],
        "assigned_officer": assigned_officer,
        "status": status,
        "priority": priority,
        "received_days_ago": days_ago,
        "sla_days": sla_days,
        "last_action": template["last_action"],
        "last_action_date": last_act_date,
        "next_action": template["next_action"] if status != "Disposed" else "Case completed and archived",
        "expected_disposal_date": expected_disposal.strftime("%Y-%m-%d"),
        "actions_history": [
            {
                "timestamp": received_date.strftime("%Y-%m-%d 10:00:00"),
                "by": "Portal Intake",
                "bureau": bureau_code,
                "action": "Case Registered",
                "remarks": "Automated complaint ingestion via CaseSync adapter."
            },
            {
                "timestamp": f"{last_act_date} 14:30:00",
                "by": assigned_officer,
                "bureau": bureau_code,
                "action": template["last_action"].split(";")[0],
                "remarks": template["last_action"]
            }
        ],
        "documents": [
            {
                "id": f"DOC-{case_counter}-1",
                "name": f"Complaint_Annexure_{case_id}.pdf",
                "size": random.randint(120000, 850000),
                "uploader": assigned_officer,
                "bureau": bureau_code,
                "timestamp": f"{last_act_date} 15:00:00",
                "file_type": "application/pdf"
            }
        ]
    }
    
    CASES_SEED.append(case_obj)
    case_counter += 1

CASES = CASES_SEED
