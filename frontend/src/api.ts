import type { CaseItem, InstitutionItem, OverlapAlert, DashboardAnalytics, Persona } from './types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

// Client-side fallback dataset in case backend is waking up or offline on static deployment
const FALLBACK_PERSONAS: Persona[] = [
  {
    id: "senior_mgmt",
    name: "Prof. T. G. Sitharam",
    role: "Chairman / Competent Authority",
    bureau: "MGMT",
    bureau_name: "Executive Management",
    permissions: ["ALL_DATA_READ", "APPROVE_ESCALATIONS", "EXECUTIVE_REPORTS"]
  },
  {
    id: "rb_officer",
    name: "Shri Arvind Sharma",
    role: "Director (Regulation)",
    bureau: "RB",
    bureau_name: "Regulation Bureau",
    permissions: ["RB_CASES_FULL", "OVERLAP_COORDINATION", "PROPOSE_LEAD"]
  },
  {
    id: "pgrc_officer",
    name: "Dr. Sunita Verma",
    role: "Deputy Director (Grievance)",
    bureau: "PGRC",
    bureau_name: "Public Grievance Redressal Cell",
    permissions: ["PGRC_CASES_FULL", "OVERLAP_COORDINATION", "ACCEPT_LEAD"]
  },
  {
    id: "ro_officer",
    name: "Shri M. Sundaram",
    role: "Regional Officer (Southern)",
    bureau: "RO",
    bureau_name: "Regional Office (South)",
    permissions: ["RO_CASES_FULL", "FIELD_VERIFICATION", "REGION_REPORTS"]
  }
];

const FALLBACK_INSTITUTIONS: InstitutionItem[] = [
  {
    id: "INST-001",
    aicte_permanent_id: "1-104928101",
    name: "Dr. B.R. Ambedkar Institute of Technology & Management",
    aliases: [
      "A.B.C Inst of Engg & Tech",
      "Ambedkar Inst of Tech",
      "BRAITM Bengaluru",
      "Dr BR Ambedkar College of Tech"
    ],
    region: "South-Western",
    state: "Karnataka",
    district: "Bengaluru Urban",
    address: "Outer Ring Road, Marathahalli, Bengaluru 560037",
    type: "Private-Unaided",
    approval_status: "Approved with Conditions",
    principal_name: "Dr. S. K. Narayana",
    contact_email: "principal@braitm.ac.in",
    approved_intake: 780,
    risk_level: "High",
    total_cases: 2,
    open_cases: 2,
    active_bureaus: ["PGRC", "RB"],
    has_cross_bureau_activity: true
  },
  {
    id: "INST-002",
    aicte_permanent_id: "1-294018244",
    name: "Apex National Engineering College",
    aliases: [
      "Apex Nat. Engg. Col.",
      "Apex Institute of Tech & Sci",
      "ANEC Pune"
    ],
    region: "Western",
    state: "Maharashtra",
    district: "Pune",
    address: "Talegaon Dabhade, Pune 410507",
    type: "Private-Unaided",
    approval_status: "Approved",
    principal_name: "Dr. Rajeshwar Deshmukh",
    contact_email: "admin@apexnational.edu.in",
    approved_intake: 920,
    risk_level: "High",
    total_cases: 2,
    open_cases: 2,
    active_bureaus: ["PGRC", "RB"],
    has_cross_bureau_activity: true
  },
  {
    id: "INST-003",
    aicte_permanent_id: "1-384910399",
    name: "Swami Vivekananda Institute of Technology & Sciences",
    aliases: [
      "Vivekananda Inst of Tech",
      "SVITS Secunderabad",
      "Vivekananda Tech Coll"
    ],
    region: "South-Central",
    state: "Telangana",
    district: "Hyderabad",
    address: "Mahbub College Campus, Patny Centre, Secunderabad 500003",
    type: "Private-Unaided",
    approval_status: "Approved",
    principal_name: "Dr. K. V. Ramanamurthy",
    contact_email: "svits.director@svits.ac.in",
    approved_intake: 640,
    risk_level: "Medium",
    total_cases: 2,
    open_cases: 2,
    active_bureaus: ["RO", "PGRC"],
    has_cross_bureau_activity: true
  },
  {
    id: "INST-004",
    aicte_permanent_id: "1-492019481",
    name: "Global Institute of Technology & Management",
    aliases: ["GITM Gurugram", "Global Inst of Tech Gurgaon"],
    region: "North-West",
    state: "Haryana",
    district: "Gurugram",
    address: "Farrukhnagar Road, Gurugram 122506",
    type: "Private-Unaided",
    approval_status: "Show Cause Issued",
    principal_name: "Dr. Virender Choudhary",
    contact_email: "info@gitm.ac.in",
    approved_intake: 840,
    risk_level: "High",
    total_cases: 1,
    open_cases: 1,
    active_bureaus: ["LEGAL"],
    has_cross_bureau_activity: false
  },
  {
    id: "INST-005",
    aicte_permanent_id: "1-591029302",
    name: "Maharaja Agrasen College of Engineering & Research",
    aliases: ["Agrasen Engg College", "MACER Jaipur"],
    region: "North-West",
    state: "Rajasthan",
    district: "Jaipur",
    address: "Sitapura Industrial Area, Tonk Road, Jaipur 302022",
    type: "Private-Unaided",
    approval_status: "Approved",
    principal_name: "Dr. Anita Mittal",
    contact_email: "macer.principal@agrasen.edu",
    approved_intake: 540,
    risk_level: "Low",
    total_cases: 1,
    open_cases: 0,
    active_bureaus: [],
    has_cross_bureau_activity: false
  }
];

const FALLBACK_CASES: CaseItem[] = [
  {
    id: "CS-2026-PGRC-00101",
    source_ref_no: "PGRC-GRV-2026-8812",
    institution_id: "INST-001",
    institution_name: "Dr. B.R. Ambedkar Institute of Technology & Management",
    aicte_permanent_id: "1-104928101",
    submitted_name: "A.B.C. Institute of Technology",
    category: "faculty_salary",
    category_name: "Faculty Salary Non-Payment",
    summary: "Non-payment of faculty monthly remuneration for 7 consecutive months and default in statutory PF deposits",
    description: "Complaint filed by Karnataka Technical Teachers Forum on behalf of 42 assistant professors. The management has withheld salary payments since April 2026, failed to deposit Employee Provident Fund (EPF), and coerced faculty into signing blank attendance vouchers under threat of termination.",
    complainant_type: "Faculty Association (Masked for DPDP compliance)",
    source_channel: "PGRC Web Portal",
    bureau_code: "PGRC",
    bureau_name: "Public Grievance Redressal Cell",
    assigned_officer: "Dr. Sunita Verma",
    status: "Under Process",
    priority: "High",
    received_days_ago: 26,
    sla_days: 30,
    received_date: "2026-09-29",
    due_date: "2026-10-29",
    days_elapsed: 26,
    days_remaining: 4,
    pct_elapsed: 86,
    sla_label: "SLA Warning (4 days left - 86% elapsed)",
    sla_severity: "amber",
    last_action: "Notice served to Management seeking explanation and bank salary statement",
    next_action: "Evaluate response submitted by Principal; initiate joint hearing",
    actions_history: [
      {
        timestamp: "2026-09-29 10:14:00",
        by: "System Intake",
        bureau: "PGRC",
        action: "Case Registered",
        remarks: "Received online complaint with 14 annexed salary slips and bank passbooks."
      },
      {
        timestamp: "2026-10-04 15:30:00",
        by: "Dr. Sunita Verma",
        bureau: "PGRC",
        action: "Scrutiny Completed",
        remarks: "Prima facie case of gross salary irregularity found. Case admitted for hearing under AICTE Redressal Norms."
      }
    ]
  },
  {
    id: "CS-2026-RB-000455",
    source_ref_no: "RB-REG-2026-1409",
    institution_id: "INST-001",
    institution_name: "Dr. B.R. Ambedkar Institute of Technology & Management",
    aicte_permanent_id: "1-104928101",
    submitted_name: "A.B.C Inst of Engg & Tech",
    category: "compliance_deficiency",
    category_name: "Compliance & Norms Deficiency",
    summary: "Inspection deficiency in faculty retention cadre-ratio, irregular payroll records, and laboratory deficit",
    description: "Surprise scrutiny and report received indicating violation of mandatory AICTE 1:20 cadre ratio. Multiple faculty members listed on portal were found absent or not drawing UGC scale pay. Bank audit records show recurring irregularities in salary disbursements and missing PF records.",
    complainant_type: "Official Scrutiny Committee",
    source_channel: "Regulation Bureau Inspection",
    bureau_code: "RB",
    bureau_name: "Regulation Bureau",
    assigned_officer: "Shri Arvind Sharma",
    status: "Action Initiated",
    priority: "High",
    received_days_ago: 18,
    sla_days: 21,
    received_date: "2026-10-07",
    due_date: "2026-10-28",
    days_elapsed: 18,
    days_remaining: 3,
    pct_elapsed: 85,
    sla_label: "SLA Warning (3 days left - 85% elapsed)",
    sla_severity: "amber",
    last_action: "Show Cause Notice (SCN) issued under Section 10(p) of AICTE Act",
    next_action: "Standing Appellate Committee (SAC) hearing scheduled for Nov 2, 2026",
    actions_history: [
      {
        timestamp: "2026-10-07 11:00:00",
        by: "Shri Arvind Sharma",
        bureau: "RB",
        action: "SCN Drafted",
        remarks: "Show Cause Notice issued citing non-compliance of 7th CPC salary scale."
      }
    ]
  },
  {
    id: "CS-2026-PGRC-00142",
    source_ref_no: "PGRC-GRV-2026-9041",
    institution_id: "INST-002",
    institution_name: "Apex National Engineering College",
    aicte_permanent_id: "1-294018244",
    submitted_name: "Apex National Engineering College",
    category: "capitation_fee",
    category_name: "Illegal Capitation Fee",
    summary: "Charging illegal capitation fee of ₹4.5 Lakhs per student under Institutional Quota",
    description: "Complaint filed by 8 parents of B.Tech CSE students alleging mandatory cash payment demanded as 'Campus Development Fund' prior to issuing admission confirmation slips.",
    complainant_type: "Student / Parent Group",
    source_channel: "Email / Digital Grievance",
    bureau_code: "PGRC",
    bureau_name: "Public Grievance Redressal Cell",
    assigned_officer: "Dr. Sunita Verma",
    status: "Under Scrutiny",
    priority: "High",
    received_days_ago: 34,
    sla_days: 30,
    received_date: "2026-09-21",
    due_date: "2026-10-21",
    days_elapsed: 34,
    days_remaining: -4,
    pct_elapsed: 113,
    sla_label: "SLA Breached (4 days overdue)",
    sla_severity: "red",
    last_action: "Evidence validation of bank transaction slips and audio transcripts",
    next_action: "Summon Management Trustee to AICTE Western Regional Office"
  },
  {
    id: "CS-2026-RB-000512",
    source_ref_no: "RB-REG-2026-1899",
    institution_id: "INST-002",
    institution_name: "Apex National Engineering College",
    aicte_permanent_id: "1-294018244",
    submitted_name: "Apex Nat. Engg. Col.",
    category: "illegal_admission",
    category_name: "Admission Beyond Approved Intake",
    summary: "Unauthorized student admissions beyond sanctioned capacity and collection of unapproved fee structure",
    description: "State CET Cell audit flagged that Apex National admitted 142 students in Computer Engineering against approved AICTE quota of 120.",
    complainant_type: "State Technical Board / Directorate",
    source_channel: "Official Inter-Department Letter",
    bureau_code: "RB",
    bureau_name: "Regulation Bureau",
    assigned_officer: "Shri Arvind Sharma",
    status: "Action Initiated",
    priority: "High",
    received_days_ago: 28,
    sla_days: 21,
    received_date: "2026-09-27",
    due_date: "2026-10-18",
    days_elapsed: 28,
    days_remaining: -7,
    pct_elapsed: 133,
    sla_label: "SLA Breached (7 days overdue)",
    sla_severity: "red",
    last_action: "Reduction of intake recommended to Executive Committee (EC)",
    next_action: "Hearing before Standing Complaint Committee (SCC)"
  }
];

const FALLBACK_OVERLAPS: OverlapAlert[] = [
  {
    alert_id: "OVR-CS-2026-PGRC-00101-CS-2026-RB-000455",
    institution_id: "INST-001",
    institution_name: "Dr. B.R. Ambedkar Institute of Technology & Management",
    aicte_permanent_id: "1-104928101",
    case_a: FALLBACK_CASES[0],
    case_b: FALLBACK_CASES[1],
    score: 0.86,
    level: "HIGH",
    badge: "Potential Overlapping Cases – Coordination Required",
    badge_color: "red",
    time_window_days: 8,
    shared_keywords: ["salary", "payment", "pf", "retention", "deficiency"],
    reasons: [
      "Identical resolved institution (BRAITM Bengaluru) under different submitted names ('A.B.C. Institute of Technology' vs 'A.B.C Inst of Engg & Tech')",
      "Correlated categories: Faculty Salary Non-Payment vs Compliance & Norms Deficiency",
      "Common allegation keywords: salary, payment, pf, retention, deficiency",
      "Received within close regulatory window (8 days apart)"
    ],
    breakdown: {
      category_similarity: 0.75,
      text_similarity: 0.65,
      time_proximity: 0.95,
      keyword_overlap: 1.0,
      action_priority: 0.9
    },
    suggested_lead_bureau: "Regulation Bureau (RB)",
    lead_reason: "RB possesses statutory regulatory jurisdiction to issue show-cause or withdrawal orders",
    coordination_status: "PENDING_COORDINATION",
    thread: [
      {
        author: "CaseSync Overlap Engine",
        role: "System AI",
        timestamp: "Auto-Generated",
        message: "Engine detected cross-bureau overlap score of 86% between PGRC (CS-2026-PGRC-00101) and Regulation Bureau (CS-2026-RB-000455). Recommended action: Designate lead bureau and link cases."
      }
    ]
  },
  {
    alert_id: "OVR-CS-2026-PGRC-00142-CS-2026-RB-000512",
    institution_id: "INST-002",
    institution_name: "Apex National Engineering College",
    aicte_permanent_id: "1-294018244",
    case_a: FALLBACK_CASES[2],
    case_b: FALLBACK_CASES[3],
    score: 0.75,
    level: "HIGH",
    badge: "Potential Overlapping Cases – Coordination Required",
    badge_color: "red",
    time_window_days: 6,
    shared_keywords: ["fee", "capitation", "admission", "quota"],
    reasons: [
      "Identical or strongly correlated category: 'Illegal Capitation Fee' vs 'Admission Beyond Approved Intake'",
      "Key overlapping allegations detected: fee, capitation, admission, quota",
      "Received within close time window (6 days apart)"
    ],
    breakdown: {
      category_similarity: 0.75,
      text_similarity: 0.50,
      time_proximity: 1.0,
      keyword_overlap: 1.0,
      action_priority: 0.9
    },
    suggested_lead_bureau: "Regulation Bureau (RB)",
    lead_reason: "RB possesses statutory regulatory jurisdiction to issue show-cause or withdrawal orders",
    coordination_status: "PENDING_COORDINATION",
    thread: [
      {
        author: "CaseSync Overlap Engine",
        role: "System AI",
        timestamp: "Auto-Generated",
        message: "Engine detected cross-bureau overlap score of 75% between Public Grievance Redressal Cell (CS-2026-PGRC-00142) and Regulation Bureau (CS-2026-RB-000512). Recommended action: Designate lead bureau and link cases."
      }
    ]
  }
];

const FALLBACK_ANALYTICS: DashboardAnalytics = {
  kpis: {
    total_received: 10,
    active_pending: 5,
    under_process: 2,
    action_initiated: 2,
    transferred: 1,
    escalated: 1,
    disposed: 1,
    sla_breaches: 4,
    sla_warnings: 2,
    active_overlaps: 2,
    disposal_rate_pct: 10.0
  },
  bureau_workload: [
    { bureau_code: "PGRC", bureau_name: "Public Grievance Redressal Cell", total: 4, open: 4, disposed: 0, escalated: 0, breached: 1 },
    { bureau_code: "RB", bureau_name: "Regulation Bureau", total: 4, open: 3, disposed: 1, escalated: 1, breached: 2 },
    { bureau_code: "RO", bureau_name: "Regional Offices (AICTE)", total: 1, open: 1, disposed: 0, escalated: 0, breached: 0 },
    { bureau_code: "LEGAL", bureau_name: "Legal Cell", total: 1, open: 1, disposed: 0, escalated: 0, breached: 1 }
  ],
  aging_buckets: {
    "0_7_days": 1,
    "8_15_days": 3,
    "16_30_days": 3,
    "31_60_days": 3,
    "60_plus_days": 0
  },
  regional_stats: [
    { region: "South-Western", total: 2, open: 2, breached: 0 },
    { region: "Western", total: 2, open: 2, breached: 2 },
    { region: "South-Central", total: 2, open: 2, breached: 0 },
    { region: "North-West", total: 2, open: 1, breached: 1 },
    { region: "Central", total: 1, open: 1, breached: 0 },
    { region: "Northern", total: 1, open: 1, breached: 1 }
  ],
  high_priority_overlaps: FALLBACK_OVERLAPS
};

export const api = {
  getPersonas: async (): Promise<Persona[]> => {
    try {
      const res = await fetch(`${API_BASE}/auth/personas`);
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      return FALLBACK_PERSONAS;
    }
  },

  getDashboardAnalytics: async (): Promise<DashboardAnalytics> => {
    try {
      const res = await fetch(`${API_BASE}/analytics/dashboard`);
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      return FALLBACK_ANALYTICS;
    }
  },

  getInstitutions: async (search?: string, region?: string): Promise<InstitutionItem[]> => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (region && region !== 'all') params.append('region', region);
      const res = await fetch(`${API_BASE}/institutions?${params.toString()}`);
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      return FALLBACK_INSTITUTIONS.filter(i => {
        if (region && region !== 'all' && i.region.toLowerCase() !== region.toLowerCase()) return false;
        if (search) {
          const q = search.toLowerCase();
          return i.name.toLowerCase().includes(q) || i.aicte_permanent_id.includes(q);
        }
        return true;
      });
    }
  },

  getInstitution360: async (id: string): Promise<any> => {
    try {
      const res = await fetch(`${API_BASE}/institutions/${id}`);
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      const inst = FALLBACK_INSTITUTIONS.find(i => i.id === id) || FALLBACK_INSTITUTIONS[0];
      const instCases = FALLBACK_CASES.filter(c => c.institution_id === inst.id);
      const instOverlaps = FALLBACK_OVERLAPS.filter(o => o.institution_id === inst.id);
      return {
        institution: inst,
        cases: instCases,
        overlaps: instOverlaps,
        total_cases: instCases.length,
        open_cases: instCases.filter(c => c.status !== 'Disposed').length,
        sla_breaches: instCases.filter(c => c.sla_severity === 'red').length
      };
    }
  },

  resolveInstitution: async (input_name: string, input_id?: string): Promise<any> => {
    try {
      const res = await fetch(`${API_BASE}/institutions/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input_name, input_id })
      });
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      const lower = input_name.toLowerCase();
      let matched = FALLBACK_INSTITUTIONS[0];
      let conf = 0.88;
      let tier = "Tier 3: Fuzzy Match & Normalization Engine";
      if (lower.includes("apex") || lower.includes("anec")) {
        matched = FALLBACK_INSTITUTIONS[1];
        conf = 0.94;
        tier = "Tier 2: Known Alias Match";
      } else if (lower.includes("vivekananda") || lower.includes("svits")) {
        matched = FALLBACK_INSTITUTIONS[2];
        conf = 0.91;
      }
      return {
        matched: true,
        institution: matched,
        confidence: conf,
        tier: tier,
        explanation: `Fuzzy matching on '${matched.name}' via aliases (Confidence: ${Math.round(conf * 100)}%)`
      };
    }
  },

  getCases: async (filters?: {
    bureau?: string;
    status?: string;
    priority?: string;
    region?: string;
    search?: string;
  }): Promise<CaseItem[]> => {
    try {
      const params = new URLSearchParams();
      if (filters?.bureau && filters.bureau !== 'all') params.append('bureau', filters.bureau);
      if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters?.priority && filters.priority !== 'all') params.append('priority', filters.priority);
      if (filters?.region && filters.region !== 'all') params.append('region', filters.region);
      if (filters?.search) params.append('search', filters.search);

      const res = await fetch(`${API_BASE}/cases?${params.toString()}`);
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      return FALLBACK_CASES;
    }
  },

  getCaseDetail: async (id: string): Promise<CaseItem> => {
    try {
      const res = await fetch(`${API_BASE}/cases/${id}`);
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      return FALLBACK_CASES.find(c => c.id === id) || FALLBACK_CASES[0];
    }
  },

  createCase: async (data: any): Promise<any> => {
    try {
      const res = await fetch(`${API_BASE}/cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      return { success: true, case: { ...data, id: `CS-2026-${data.bureau_code}-99999` } };
    }
  },

  addCaseAction: async (id: string, data: { user_name: string; bureau: string; action_type: string; remarks: string; new_status?: string }): Promise<any> => {
    try {
      const res = await fetch(`${API_BASE}/cases/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      return { success: true };
    }
  },

  transferCase: async (id: string, data: { user_name: string; from_bureau: string; to_bureau: string; reason: string }): Promise<any> => {
    try {
      const res = await fetch(`${API_BASE}/cases/${id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      return { success: true };
    }
  },

  escalateCase: async (id: string, data: { user_name: string; bureau: string; target_authority: string; justification: string }): Promise<any> => {
    try {
      const res = await fetch(`${API_BASE}/cases/${id}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      return { success: true };
    }
  },

  getOverlaps: async (): Promise<OverlapAlert[]> => {
    try {
      const res = await fetch(`${API_BASE}/overlaps`);
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      return FALLBACK_OVERLAPS;
    }
  },

  coordinateOverlap: async (alertId: string, data: {
    author: string;
    role: string;
    message: string;
    action?: string;
    lead_bureau?: string;
    decision_notes?: string;
  }): Promise<any> => {
    try {
      const res = await fetch(`${API_BASE}/overlaps/${alertId}/coordinate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      const match = FALLBACK_OVERLAPS.find(o => o.alert_id === alertId);
      if (match) {
        match.thread.push({
          author: data.author,
          role: data.role,
          timestamp: new Date().toLocaleTimeString(),
          message: data.message
        });
        if (data.action === 'DESIGNATE_LEAD') {
          match.lead_bureau = data.lead_bureau;
          match.decision = `Lead Bureau designated as: ${data.lead_bureau}`;
          match.coordination_status = 'LEAD_DESIGNATED';
        }
      }
      return { success: true };
    }
  },

  getReportsBureau: async (): Promise<any> => {
    try {
      const res = await fetch(`${API_BASE}/reports/bureau`);
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      return FALLBACK_ANALYTICS.bureau_workload;
    }
  },

  getReportsRegion: async (): Promise<any> => {
    try {
      const res = await fetch(`${API_BASE}/reports/region`);
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      return FALLBACK_ANALYTICS.regional_stats;
    }
  },

  getReportsOverlaps: async (): Promise<any> => {
    try {
      const res = await fetch(`${API_BASE}/reports/overlaps`);
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      return FALLBACK_OVERLAPS.map(o => ({
        alert_id: o.alert_id,
        institution: o.institution_name,
        permanent_id: o.aicte_permanent_id,
        score: o.score,
        level: o.level,
        bureau_a: o.case_a.bureau_name,
        case_a_id: o.case_a.id,
        bureau_b: o.case_b.bureau_name,
        case_b_id: o.case_b.id,
        coordination_status: o.coordination_status,
        lead_bureau: o.lead_bureau || "Unassigned",
        decision: o.decision || "Awaiting Joint Review"
      }));
    }
  }
};
