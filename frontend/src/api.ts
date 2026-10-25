import type { CaseItem, InstitutionItem, OverlapAlert, DashboardAnalytics, Persona } from './types';

const API_BASE = '/api';

export const api = {
  getPersonas: async (): Promise<Persona[]> => {
    const res = await fetch(`${API_BASE}/auth/personas`);
    return res.json();
  },

  getDashboardAnalytics: async (): Promise<DashboardAnalytics> => {
    const res = await fetch(`${API_BASE}/analytics/dashboard`);
    return res.json();
  },

  getInstitutions: async (search?: string, region?: string): Promise<InstitutionItem[]> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (region && region !== 'all') params.append('region', region);
    const res = await fetch(`${API_BASE}/institutions?${params.toString()}`);
    return res.json();
  },

  getInstitution360: async (id: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/institutions/${id}`);
    return res.json();
  },

  resolveInstitution: async (input_name: string, input_id?: string, district?: string, state?: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/institutions/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input_name, input_id, district, state })
    });
    return res.json();
  },

  getCases: async (filters?: {
    bureau?: string;
    status?: string;
    priority?: string;
    region?: string;
    search?: string;
  }): Promise<CaseItem[]> => {
    const params = new URLSearchParams();
    if (filters?.bureau && filters.bureau !== 'all') params.append('bureau', filters.bureau);
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.priority && filters.priority !== 'all') params.append('priority', filters.priority);
    if (filters?.region && filters.region !== 'all') params.append('region', filters.region);
    if (filters?.search) params.append('search', filters.search);

    const res = await fetch(`${API_BASE}/cases?${params.toString()}`);
    return res.json();
  },

  getCaseDetail: async (id: string): Promise<CaseItem> => {
    const res = await fetch(`${API_BASE}/cases/${id}`);
    return res.json();
  },

  createCase: async (data: any): Promise<any> => {
    const res = await fetch(`${API_BASE}/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  addCaseAction: async (id: string, data: { user_name: string; bureau: string; action_type: string; remarks: string; new_status?: string }): Promise<any> => {
    const res = await fetch(`${API_BASE}/cases/${id}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  transferCase: async (id: string, data: { user_name: string; from_bureau: string; to_bureau: string; reason: string }): Promise<any> => {
    const res = await fetch(`${API_BASE}/cases/${id}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  escalateCase: async (id: string, data: { user_name: string; bureau: string; target_authority: string; justification: string }): Promise<any> => {
    const res = await fetch(`${API_BASE}/cases/${id}/escalate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getOverlaps: async (): Promise<OverlapAlert[]> => {
    const res = await fetch(`${API_BASE}/overlaps`);
    return res.json();
  },

  coordinateOverlap: async (alertId: string, data: {
    author: string;
    role: string;
    message: string;
    action?: string;
    lead_bureau?: string;
    decision_notes?: string;
  }): Promise<any> => {
    const res = await fetch(`${API_BASE}/overlaps/${alertId}/coordinate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getReportsBureau: async (): Promise<any> => {
    const res = await fetch(`${API_BASE}/reports/bureau`);
    return res.json();
  },

  getReportsRegion: async (): Promise<any> => {
    const res = await fetch(`${API_BASE}/reports/region`);
    return res.json();
  },

  getReportsOverlaps: async (): Promise<any> => {
    const res = await fetch(`${API_BASE}/reports/overlaps`);
    return res.json();
  }
};
