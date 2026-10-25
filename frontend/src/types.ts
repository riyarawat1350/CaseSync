export interface ActionHistory {
  timestamp: string;
  by: string;
  bureau: string;
  action: string;
  remarks: string;
}

export interface CaseItem {
  id: string;
  source_ref_no: string;
  institution_id: string;
  institution_name?: string;
  aicte_permanent_id?: string;
  submitted_name: string;
  category: string;
  category_name: string;
  summary: string;
  description: string;
  complainant_type: string;
  source_channel: string;
  bureau_code: string;
  bureau_name: string;
  assigned_officer: string;
  status: string;
  priority: string;
  received_days_ago: number;
  sla_days: number;
  received_date?: string;
  due_date?: string;
  days_elapsed?: number;
  days_remaining?: number;
  pct_elapsed?: number;
  sla_label?: string;
  sla_severity?: 'green' | 'amber' | 'red';
  last_action: string;
  next_action?: string;
  actions_history?: ActionHistory[];
  related_overlaps?: any[];
}

export interface InstitutionItem {
  id: string;
  aicte_permanent_id: string;
  name: string;
  aliases: string[];
  region: string;
  state: string;
  district: string;
  address: string;
  type: string;
  approval_status: string;
  principal_name: string;
  contact_email: string;
  approved_intake: number;
  risk_level: string;
  total_cases?: number;
  open_cases?: number;
  active_bureaus?: string[];
  has_cross_bureau_activity?: boolean;
}

export interface ThreadMessage {
  author: string;
  role: string;
  timestamp: string;
  message: string;
  action?: string;
}

export interface OverlapAlert {
  alert_id: string;
  institution_id: string;
  institution_name: string;
  aicte_permanent_id: string;
  case_a: CaseItem;
  case_b: CaseItem;
  score: number;
  level: 'HIGH' | 'MEDIUM' | 'NOTICE';
  badge: string;
  badge_color: 'red' | 'amber' | 'blue';
  time_window_days: number;
  shared_keywords: string[];
  reasons: string[];
  breakdown: {
    category_similarity: number;
    text_similarity: number;
    time_proximity: number;
    keyword_overlap: number;
    action_priority: number;
  };
  suggested_lead_bureau: string;
  lead_reason: string;
  coordination_status: string;
  decision?: string;
  lead_bureau?: string;
  thread: ThreadMessage[];
}

export interface DashboardKPIs {
  total_received: number;
  active_pending: number;
  under_process: number;
  action_initiated: number;
  transferred: number;
  escalated: number;
  disposed: number;
  sla_breaches: number;
  sla_warnings: number;
  active_overlaps: number;
  disposal_rate_pct: number;
}

export interface DashboardAnalytics {
  kpis: DashboardKPIs;
  bureau_workload: {
    bureau_code: string;
    bureau_name: string;
    total: number;
    open: number;
    disposed: number;
    escalated: number;
    breached: number;
  }[];
  aging_buckets: {
    '0_7_days': number;
    '8_15_days': number;
    '16_30_days': number;
    '31_60_days': number;
    '60_plus_days': number;
  };
  regional_stats: {
    region: string;
    total: number;
    open: number;
    breached: number;
  }[];
  high_priority_overlaps: OverlapAlert[];
}

export interface Persona {
  id: string;
  name: string;
  role: string;
  bureau: string;
  bureau_name: string;
  permissions: string[];
}
