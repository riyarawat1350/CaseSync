from datetime import datetime, timedelta
from typing import List, Dict, Any

# Current simulated reference date for SIH Hackathon
BASE_DATE = datetime(2026, 10, 25, 12, 0, 0)

INSTITUTIONS = [
    {
        "id": "INST-001",
        "aicte_permanent_id": "1-104928101",
        "name": "Dr. B.R. Ambedkar Institute of Technology & Management",
        "aliases": [
            "A.B.C Inst of Engg & Tech",
            "Ambedkar Inst of Tech",
            "BRAITM Bengaluru",
            "Dr BR Ambedkar College of Tech"
        ],
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
        "aliases": [
            "Apex Nat. Engg. Col.",
            "Apex Institute of Tech & Sci",
            "ANEC Pune"
        ],
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
        "aliases": [
            "Vivekananda Inst of Tech",
            "SVITS Secunderabad",
            "Vivekananda Tech Coll"
        ],
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
        "aliases": [
            "GITM Gurugram",
            "Global Inst of Tech Gurgaon",
            "Global College of Engg & Mgmt"
        ],
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
        "aliases": [
            "Agrasen Engg College",
            "MACER Jaipur",
            "Maharaja Agrasen Inst of Tech"
        ],
        "region": "North-West",
        "state": "Rajasthan",
        "district": "Jaipur",
        "address": "Sitapura Industrial Area, Tonk Road, Jaipur 302022",
        "type": "Private-Unaided",
        "approval_status": "Approved",
        "principal_name": "Dr. Anita Mittal",
        "contact_email": "macer.principal@agrasen.edu",
        "approved_intake": 540,
        "risk_level": "Low"
    },
    {
        "id": "INST-006",
        "aicte_permanent_id": "1-682910394",
        "name": "Kolkata Institute of Advanced Computing & Electronics",
        "aliases": [
            "KIACE Salt Lake",
            "Kolkata Inst of Advanced Computing",
            "Kolkata Advanced Tech"
        ],
        "region": "Eastern",
        "state": "West Bengal",
        "district": "Kolkata",
        "address": "Sector V, Salt Lake Electronic Complex, Kolkata 700091",
        "type": "Private-Unaided",
        "approval_status": "Approved",
        "principal_name": "Dr. Prasenjit Banerjee",
        "contact_email": "kiace.kolkata@kiace.ac.in",
        "approved_intake": 480,
        "risk_level": "Low"
    },
    {
        "id": "INST-007",
        "aicte_permanent_id": "1-771928301",
        "name": "Bhopal National Polytechnic & Engineering Institute",
        "aliases": [
            "Bhopal Nat. Poly. Inst.",
            "BNPEI Bhopal",
            "Bhopal National Engg Inst"
        ],
        "region": "Central",
        "state": "Madhya Pradesh",
        "district": "Bhopal",
        "address": "Raisen Road, Patel Nagar, Bhopal 462021",
        "type": "Private-Unaided",
        "approval_status": "Approved with Warning",
        "principal_name": "Dr. Sudhir Saxena",
        "contact_email": "bnpei.bhopal@gmail.com",
        "approved_intake": 600,
        "risk_level": "Medium"
    },
    {
        "id": "INST-008",
        "aicte_permanent_id": "1-882910481",
        "name": "Chennai Institute of Aeronautical & Marine Technologies",
        "aliases": [
            "Chennai Aero Tech",
            "CIAMT Chennai",
            "Chennai Inst of Aero & Marine"
        ],
        "region": "Southern",
        "state": "Tamil Nadu",
        "district": "Chennai",
        "address": "OMR IT Highway, Navalur, Chennai 600130",
        "type": "Private-Unaided",
        "approval_status": "Approved",
        "principal_name": "Dr. R. Thirumurugan",
        "contact_email": "info@ciamt.edu.in",
        "approved_intake": 720,
        "risk_level": "Low"
    },
    {
        "id": "INST-009",
        "aicte_permanent_id": "1-912849102",
        "name": "Chandigarh Group of Applied Sciences & Engineering",
        "aliases": [
            "CGASE Mohali",
            "Chandigarh Group of Applied Sci",
            "Chandigarh Applied Engg"
        ],
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
        "aliases": [
            "SDM Engg College",
            "Saraswati Devi Inst of Tech",
            "SDMEC Lucknow"
        ],
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
    {"id": "OFF-RO-01", "name": "Shri M. Sundaram", "role": "Regional Officer (Southern)", "bureau": "RO", "email": "ro.south@aicte-india.org"},
    {"id": "OFF-RO-02", "name": "Dr. Sanjay Deshpande", "role": "Regional Officer (Western)", "bureau": "RO", "email": "ro.west@aicte-india.org"},
    {"id": "OFF-LEGAL-01", "name": "Adv. Meenakshi Joshi", "role": "Senior Law Officer", "bureau": "LEGAL", "email": "legal.advisor@aicte-india.org"},
    {"id": "OFF-MGMT-01", "name": "Prof. T. G. Sitharam", "role": "Chairman / Competent Authority", "bureau": "MGMT", "email": "chairman@aicte-india.org"}
]

CASES = [
    # ---- INJECTED OVERLAP PAIR 1 (Ambedkar Inst of Tech / A.B.C Inst of Engg & Tech) ----
    {
        "id": "CS-2026-PGRC-00101",
        "source_ref_no": "PGRC-GRV-2026-8812",
        "institution_id": "INST-001",
        "submitted_name": "A.B.C. Institute of Technology",
        "category": "faculty_salary",
        "category_name": "Faculty Salary Non-Payment",
        "summary": "Non-payment of faculty monthly remuneration for 7 consecutive months and default in statutory PF deposits",
        "description": "Complaint filed by Karnataka Technical Teachers Forum on behalf of 42 assistant professors. The management has withheld salary payments since April 2026, failed to deposit Employee Provident Fund (EPF), and coerced faculty into signing blank attendance vouchers under threat of termination.",
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
        "next_action": "Evaluate response submitted by Principal; initiate joint hearing",
        "actions_history": [
            {
                "timestamp": "2026-09-29 10:14:00",
                "by": "System Intake",
                "bureau": "PGRC",
                "action": "Case Registered",
                "remarks": "Received online complaint with 14 annexed salary slips and bank passbooks."
            },
            {
                "timestamp": "2026-10-04 15:30:00",
                "by": "Dr. Sunita Verma",
                "bureau": "PGRC",
                "action": "Scrutiny Completed",
                "remarks": "Prima facie case of gross salary irregularity found. Case admitted for hearing under AICTE Redressal Norms."
            },
            {
                "timestamp": "2026-10-14 11:20:00",
                "by": "Dr. Sunita Verma",
                "bureau": "PGRC",
                "action": "Explanation Notice Issued",
                "remarks": "Issued Form G-12 to Chairman of BRAITM seeking 15-day sworn compliance affidavit."
            }
        ]
    },
    {
        "id": "CS-2026-RB-000455",
        "source_ref_no": "RB-REG-2026-1409",
        "institution_id": "INST-001",
        "submitted_name": "A.B.C Inst of Engg & Tech",
        "category": "compliance_deficiency",
        "category_name": "Compliance & Norms Deficiency",
        "summary": "Inspection deficiency in faculty retention cadre-ratio, irregular payroll records, and laboratory deficit",
        "description": "Surprise scrutiny and report received indicating violation of mandatory AICTE 1:20 cadre ratio. Multiple faculty members listed on portal were found absent or not drawing UGC scale pay. Bank audit records show recurring irregularities in salary disbursements and missing PF records.",
        "complainant_type": "Official Scrutiny Committee",
        "source_channel": "Regulation Bureau Inspection",
        "bureau_code": "RB",
        "bureau_name": "Regulation Bureau",
        "assigned_officer": "Shri Arvind Sharma",
        "status": "Action Initiated",
        "priority": "High",
        "received_days_ago": 18,
        "sla_days": 21,
        "last_action": "Show Cause Notice (SCN) issued under Section 10(p) of AICTE Act",
        "next_action": "Standing Appellate Committee (SAC) hearing scheduled for Nov 2, 2026",
        "actions_history": [
            {
                "timestamp": "2026-10-07 11:00:00",
                "by": "Shri Arvind Sharma",
                "bureau": "RB",
                "action": "SCN Drafted",
                "remarks": "Show Cause Notice issued citing non-compliance of 7th CPC salary scale and cadre shortfall."
            },
            {
                "timestamp": "2026-10-18 16:45:00",
                "by": "Shri Arvind Sharma",
                "bureau": "RB",
                "action": "Action Initiated",
                "remarks": "Recommended withholding of approval for AY 2027-28 if compliance is not demonstrated."
            }
        ]
    },

    # ---- INJECTED OVERLAP PAIR 2 (Apex National Engg College / Apex Nat. Engg. Col.) ----
    {
        "id": "CS-2026-PGRC-00142",
        "source_ref_no": "PGRC-GRV-2026-9041",
        "institution_id": "INST-002",
        "submitted_name": "Apex National Engineering College",
        "category": "capitation_fee",
        "category_name": "Illegal Capitation Fee",
        "summary": "Charging illegal capitation fee of ₹4.5 Lakhs per student under Institutional Quota",
        "description": "Complaint filed by 8 parents of B.Tech CSE students alleging mandatory cash payment demanded as 'Campus Development Fund' prior to issuing admission confirmation slips. Receipts not issued despite repeated requests.",
        "complainant_type": "Student / Parent Group",
        "source_channel": "Email / Digital Grievance",
        "bureau_code": "PGRC",
        "bureau_name": "Public Grievance Redressal Cell",
        "assigned_officer": "Dr. Sunita Verma",
        "status": "Under Scrutiny",
        "priority": "High",
        "received_days_ago": 34,
        "sla_days": 30,
        "last_action": "Evidence validation of bank transaction slips and audio transcripts",
        "next_action": "Summon Management Trustee to AICTE Western Regional Office",
        "actions_history": [
            {
                "timestamp": "2026-09-21 09:30:00",
                "by": "Intake Operator",
                "bureau": "PGRC",
                "action": "Registered",
                "remarks": "Received with audio recordings and UPI transfer tokens."
            },
            {
                "timestamp": "2026-10-02 14:10:00",
                "by": "Dr. Sunita Verma",
                "bureau": "PGRC",
                "action": "SLA Alert Sent",
                "remarks": "Reminder dispatched to Principal as 15-day window elapsed."
            }
        ]
    },
    {
        "id": "CS-2026-RB-000512",
        "source_ref_no": "RB-REG-2026-1899",
        "institution_id": "INST-002",
        "submitted_name": "Apex Nat. Engg. Col.",
        "category": "illegal_admission",
        "category_name": "Admission Beyond Approved Intake",
        "summary": "Unauthorized student admissions beyond sanctioned capacity and collection of unapproved fee structure",
        "description": "State CET Cell audit flagged that Apex National admitted 142 students in Computer Engineering against approved AICTE quota of 120, citing management discretion. Heavy capitation fees reported collected for excess seats.",
        "complainant_type": "State Technical Board / Directorate",
        "source_channel": "Official Inter-Department Letter",
        "bureau_code": "RB",
        "bureau_name": "Regulation Bureau",
        "assigned_officer": "Shri Arvind Sharma",
        "status": "Action Initiated",
        "priority": "High",
        "received_days_ago": 28,
        "sla_days": 21,
        "last_action": "Reduction of intake recommended to Executive Committee (EC)",
        "next_action": "Hearing before Standing Complaint Committee (SCC)",
        "actions_history": [
            {
                "timestamp": "2026-09-27 12:00:00",
                "by": "Shri Arvind Sharma",
                "bureau": "RB",
                "action": "Audit Review",
                "remarks": "Discrepancy of 22 students confirmed against AICTE web portal enrollment ledger."
            }
        ]
    },

    # ---- INJECTED OVERLAP PAIR 3 (Vivekananda Inst of Tech / SVITS) ----
    {
        "id": "CS-2026-RO-00088",
        "source_ref_no": "RO-SC-2026-0043",
        "institution_id": "INST-003",
        "submitted_name": "Vivekananda Tech Coll",
        "category": "infrastructure_deficiency",
        "category_name": "Infrastructure & Safety Deficit",
        "summary": "Hazardous electrical wiring, absence of fire safety certificate, and unequipped laboratories",
        "description": "Physical inspection conducted by AICTE South-Central Regional Office team observed incomplete construction, blocked fire exits, and obsolete computer workstations with expired software licenses.",
        "complainant_type": "Field Inspection Officer",
        "source_channel": "Regional Office Field Audit",
        "bureau_code": "RO",
        "bureau_name": "Regional Offices (AICTE)",
        "assigned_officer": "Shri M. Sundaram",
        "status": "Under Process",
        "priority": "Medium",
        "received_days_ago": 14,
        "sla_days": 30,
        "last_action": "Field verification report uploaded to CaseSync central ledger",
        "next_action": "Forward findings to Regulation Bureau for issuance of punitive warning",
        "actions_history": [
            {
                "timestamp": "2026-10-11 16:00:00",
                "by": "Shri M. Sundaram",
                "bureau": "RO",
                "action": "Inspection Logged",
                "remarks": "Deficiency report filed with 18 geo-tagged photographic proofs."
            }
        ]
    },
    {
        "id": "CS-2026-PGRC-00210",
        "source_ref_no": "PGRC-GRV-2026-9411",
        "institution_id": "INST-003",
        "submitted_name": "Swami Vivekananda Institute of Technology",
        "category": "lab_equipment",
        "category_name": "Substandard Laboratories",
        "summary": "Severe lack of functioning computer hardware and high-voltage electrical hazards in labs",
        "description": "Petition submitted by 3rd year engineering students highlighting that 60% of lab systems are broken, no internet connectivity is provided for coding practicals, and bare wiring creates shocks during monsoons.",
        "complainant_type": "Student Council",
        "source_channel": "PGRC Portal",
        "bureau_code": "PGRC",
        "bureau_name": "Public Grievance Redressal Cell",
        "assigned_officer": "Dr. Sunita Verma",
        "status": "Received",
        "priority": "Medium",
        "received_days_ago": 12,
        "sla_days": 30,
        "last_action": "Initial acknowledgment dispatched to complainant with tracking token",
        "next_action": "Cross-reference with Regional Office inspection report",
        "actions_history": [
            {
                "timestamp": "2026-10-13 10:15:00",
                "by": "PGRC Intake",
                "bureau": "PGRC",
                "action": "Intake Complete",
                "remarks": "Auto-assigned to South-Central grievance queue."
            }
        ]
    },

    # ---- SINGLE BUREAU CASES (Diversified across statuses & regions) ----
    {
        "id": "CS-2026-LEGAL-00031",
        "source_ref_no": "HC-WP-10492-2026",
        "institution_id": "INST-004",
        "submitted_name": "Global Institute of Technology & Management",
        "category": "service_conditions",
        "category_name": "Faculty Service Conditions",
        "summary": "Writ Petition before Hon'ble High Court of Punjab & Haryana regarding illegal retrenchment",
        "description": "Writ Petition No. 10492/2026 filed by former HoD challenging sudden termination without inquiry and non-compliance with AICTE Model Service Rules. AICTE arrayed as Respondent No. 2.",
        "complainant_type": "High Court Notice",
        "source_channel": "Court Summons / Legal Cell",
        "bureau_code": "LEGAL",
        "bureau_name": "Legal Cell",
        "assigned_officer": "Adv. Meenakshi Joshi",
        "status": "Pending (Awaiting Input)",
        "priority": "High",
        "received_days_ago": 42,
        "sla_days": 30,
        "last_action": "Counter affidavit draft requested from Regulation Bureau",
        "next_action": "Filing of Reply Affidavit before next date of hearing on Nov 14, 2026",
        "actions_history": [
            {
                "timestamp": "2026-09-13 14:00:00",
                "by": "Adv. Meenakshi Joshi",
                "bureau": "LEGAL",
                "action": "Writ Notice Registered",
                "remarks": "High Court issued notice of motion; reply due within 4 weeks."
            }
        ]
    },
    {
        "id": "CS-2026-RB-000588",
        "source_ref_no": "RB-REG-2026-2104",
        "institution_id": "INST-005",
        "submitted_name": "Maharaja Agrasen College of Engineering",
        "category": "infrastructure_deficiency",
        "category_name": "Library & Reading Room Norms",
        "summary": "Shortfall of international journals and digital e-library subscriptions for PG programs",
        "description": "NBA peer review team noted shortage of mandatory Delnet / IEEE digital library access required for postgraduate courses.",
        "complainant_type": "NBA / AICTE Joint Committee",
        "source_channel": "Accreditation Feedback",
        "bureau_code": "RB",
        "bureau_name": "Regulation Bureau",
        "assigned_officer": "Shri Arvind Sharma",
        "status": "Disposed",
        "priority": "Low",
        "received_days_ago": 65,
        "sla_days": 45,
        "last_action": "Compliance verified; college procured 50-terminal digital library and 3-year IEEE consortium package",
        "next_action": "Closed with satisfactory outcome code C-01",
        "actions_history": [
            {
                "timestamp": "2026-08-21 11:30:00",
                "by": "Shri Arvind Sharma",
                "bureau": "RB",
                "action": "Deficiency Logged",
                "remarks": "Notice issued."
            },
            {
                "timestamp": "2026-09-28 17:00:00",
                "by": "Shri Arvind Sharma",
                "bureau": "RB",
                "action": "Case Disposed",
                "remarks": "Proof of license procurement verified. Case disposed."
            }
        ]
    },
    {
        "id": "CS-2026-PGRC-00289",
        "source_ref_no": "PGRC-GRV-2026-9810",
        "institution_id": "INST-007",
        "submitted_name": "Bhopal National Polytechnic & Engineering Institute",
        "category": "ragging",
        "category_name": "Anti-Ragging Compliance",
        "summary": "Delay in Anti-Ragging Committee meeting and non-installation of CCTV in 1st year hostel wing",
        "description": "Anonymous tip alleging senior students organizing unauthorized late night gatherings in boys hostel block B. Anti-Ragging squad not patrolling after 10 PM.",
        "complainant_type": "Anonymous Student Whistleblower",
        "source_channel": "National Anti-Ragging Helpline",
        "bureau_code": "PGRC",
        "bureau_name": "Public Grievance Redressal Cell",
        "assigned_officer": "Dr. Sunita Verma",
        "status": "Transferred",
        "priority": "High",
        "received_days_ago": 8,
        "sla_days": 15,
        "last_action": "Transferred to Regional Officer (Central) for spot surprise night audit",
        "next_action": "Awaiting Spot Inspection Report from Central Regional Office",
        "actions_history": [
            {
                "timestamp": "2026-10-17 10:00:00",
                "by": "Dr. Sunita Verma",
                "bureau": "PGRC",
                "action": "Transferred",
                "remarks": "Immediate on-ground night verification needed; transferred to RO Bhopal."
            }
        ]
    },
    {
        "id": "CS-2026-RB-000620",
        "source_ref_no": "RB-REG-2026-2319",
        "institution_id": "INST-010",
        "submitted_name": "Saraswati Devi Memorial Engineering College",
        "category": "compliance_deficiency",
        "category_name": "Land & Building Title Dispute",
        "summary": "Allegation of encumbered agricultural land shown for establishment of technical campus",
        "description": "Public interest complaint with revenue land records alleging that 2.5 acres of the campus is subject to civil litigation and mortgage with a commercial bank.",
        "complainant_type": "Public Complainant",
        "source_channel": "CPGRAMS Grievance Transfer",
        "bureau_code": "RB",
        "bureau_name": "Regulation Bureau",
        "assigned_officer": "Shri Arvind Sharma",
        "status": "Escalated",
        "priority": "High",
        "received_days_ago": 38,
        "sla_days": 30,
        "last_action": "Escalated to Advisor (Approval & Regulation) for setting up Fact Finding Committee",
        "next_action": "Competent Authority sanction for revenue record inspection",
        "actions_history": [
            {
                "timestamp": "2026-09-17 11:20:00",
                "by": "Intake",
                "bureau": "RB",
                "action": "Intake",
                "remarks": "Received via CPGRAMS."
            },
            {
                "timestamp": "2026-10-18 15:40:00",
                "by": "Shri Arvind Sharma",
                "bureau": "RB",
                "action": "Escalated",
                "remarks": "Substantial land dispute involving institutional security; escalated to Senior Management."
            }
        ]
    }
]


def calculate_sla_status(case: Dict[str, Any]) -> Dict[str, Any]:
    """Calculates live SLA timeline metrics for a given case."""
    days_ago = case.get("received_days_ago", 0)
    sla_days = case.get("sla_days", 30)
    received_date = BASE_DATE - timedelta(days=days_ago)
    due_date = received_date + timedelta(days=sla_days)
    
    days_remaining = sla_days - days_ago
    pct_elapsed = int((days_ago / sla_days) * 100) if sla_days > 0 else 100
    
    if case.get("status") == "Disposed":
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
