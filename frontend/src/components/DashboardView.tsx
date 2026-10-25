import React from 'react';
import { 
  AlertTriangle, CheckCircle2, Clock, 
  FileText, ArrowUpRight, TrendingUp,
  MapPin, ShieldAlert, GitMerge, ChevronRight
} from 'lucide-react';
import type { DashboardAnalytics, OverlapAlert } from '../types';

interface DashboardViewProps {
  analytics: DashboardAnalytics | null;
  onSelectOverlap: (overlap: OverlapAlert) => void;
  onNavigateTab: (tab: string) => void;
  lang: 'en' | 'hi';
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  analytics, 
  onSelectOverlap, 
  onNavigateTab,
  lang 
}) => {
  if (!analytics) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Live CaseSync Analytics...</div>;
  }

  const { kpis, bureau_workload, aging_buckets, regional_stats, high_priority_overlaps } = analytics;
  const maxAging = Math.max(...Object.values(aging_buckets), 1);

  const t = {
    totalCases: lang === 'hi' ? 'कुल प्राप्त मामले' : 'Total Cases Received',
    pending: lang === 'hi' ? 'प्रक्रियाधीन मामले' : 'Active Pending',
    underProcess: lang === 'hi' ? 'कार्यवाही जारी' : 'Action Initiated',
    escalated: lang === 'hi' ? 'उच्च स्तर पर अग्रेषित' : 'Escalated Cases',
    slaBreached: lang === 'hi' ? 'समय सीमा पार (SLA)' : 'SLA Breaches',
    overlapsDetected: lang === 'hi' ? 'सक्रिय ओवरलैप अलर्ट' : 'Overlaps Requiring Action',
    bureauWorkload: lang === 'hi' ? 'ब्यूरो वार कार्यभार व निपटान' : 'Bureau Workload & Action Matrix',
    agingAnalysis: lang === 'hi' ? 'लंबित मामलों का आयु विश्लेषण (दिन)' : 'Pending Ageing Distribution',
    regionalDistribution: lang === 'hi' ? 'अखिल भारतीय क्षेत्रीय वितरण' : 'Pan-India Regional Distribution',
    highAlerts: lang === 'hi' ? 'त्वरित समन्वय हेतु चिन्हित ओवरलैप' : 'Urgent Cross-Bureau Overlaps Flagged for Coordination',
    viewAll: lang === 'hi' ? 'सभी देखें' : 'View All in Overlap Center'
  };

  return (
    <div>
      {/* SLA / Overlap Urgent Banner */}
      {high_priority_overlaps.length > 0 && (
        <div className="ticker-banner">
          <div className="ticker-content">
            <AlertTriangle size={20} />
            <span>
              <strong>{lang === 'hi' ? 'सावधानी' : 'ATTENTION'}:</strong>{' '}
              {high_priority_overlaps.length} {lang === 'hi' ? 'संस्थानों पर एक साथ समानांतर कार्यवाही की जा रही है। ब्यूरो समन्वय अनिवार्य है।' : 'cross-bureau overlapping investigations detected across Regulation Bureau & PGRC. Coordination required.'}
            </span>
          </div>
          <button 
            className="ticker-btn"
            onClick={() => onNavigateTab('overlaps')}
          >
            {t.viewAll} <ArrowUpRight size={14} />
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card" style={{ '--kpi-accent': 'var(--brand-blue)', '--kpi-bg': 'var(--brand-blue-light)' } as any}>
          <div className="kpi-header">
            <span className="kpi-title">{t.totalCases}</span>
            <div className="kpi-icon-wrapper"><FileText size={18} /></div>
          </div>
          <div className="kpi-value">{kpis.total_received}</div>
          <div className="kpi-subtitle">
            <TrendingUp size={14} color="#10b981" /> 100% Ingested Across 5 Portals
          </div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': 'var(--status-amber)', '--kpi-bg': 'var(--status-amber-bg)' } as any}>
          <div className="kpi-header">
            <span className="kpi-title">{t.pending}</span>
            <div className="kpi-icon-wrapper"><Clock size={18} /></div>
          </div>
          <div className="kpi-value">{kpis.active_pending}</div>
          <div className="kpi-subtitle">
            <span>{kpis.under_process} Under Active Scrutiny</span>
          </div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': 'var(--status-red)', '--kpi-bg': 'var(--status-red-bg)' } as any}>
          <div className="kpi-header">
            <span className="kpi-title">{t.overlapsDetected}</span>
            <div className="kpi-icon-wrapper"><GitMerge size={18} /></div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--status-red)' }}>{kpis.active_overlaps}</div>
          <div className="kpi-subtitle">
            <span>AI Hybrid Entity Engine Match</span>
          </div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': 'var(--status-red)', '--kpi-bg': 'var(--status-red-bg)' } as any}>
          <div className="kpi-header">
            <span className="kpi-title">{t.slaBreached}</span>
            <div className="kpi-icon-wrapper"><AlertTriangle size={18} /></div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--status-red)' }}>{kpis.sla_breaches}</div>
          <div className="kpi-subtitle">
            <span>{kpis.sla_warnings} At 80% SLA Threshold</span>
          </div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': 'var(--status-purple)', '--kpi-bg': 'var(--status-purple-bg)' } as any}>
          <div className="kpi-header">
            <span className="kpi-title">{t.escalated}</span>
            <div className="kpi-icon-wrapper"><ShieldAlert size={18} /></div>
          </div>
          <div className="kpi-value">{kpis.escalated}</div>
          <div className="kpi-subtitle">
            <span>Competent Authority Queue</span>
          </div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': 'var(--status-green)', '--kpi-bg': 'var(--status-green-bg)' } as any}>
          <div className="kpi-header">
            <span className="kpi-title">{lang === 'hi' ? 'निपटान दर' : 'Disposal Rate'}</span>
            <div className="kpi-icon-wrapper"><CheckCircle2 size={18} /></div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--status-green)' }}>{kpis.disposal_rate_pct}%</div>
          <div className="kpi-subtitle">
            <span>{kpis.disposed} Cases Successfully Closed</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="dashboard-grid">
        {/* Left Column: Bureau Workload & Active Overlaps List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Bureau Workload Table */}
          <div className="surface-card">
            <div className="card-header-bar">
              <h2 className="card-title">
                <ShieldAlert size={20} color="var(--brand-blue)" />
                {t.bureauWorkload}
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Live Stream
              </span>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Bureau / Cell</th>
                    <th>Total Cases</th>
                    <th>Active Open</th>
                    <th>Disposed</th>
                    <th>Escalated</th>
                    <th>SLA Breached</th>
                  </tr>
                </thead>
                <tbody>
                  {bureau_workload.map((b) => (
                    <tr key={b.bureau_code}>
                      <td>
                        <strong>{b.bureau_name}</strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Code: {b.bureau_code}</div>
                      </td>
                      <td><strong>{b.total}</strong></td>
                      <td>
                        <span className="status-badge badge-amber">{b.open} Open</span>
                      </td>
                      <td>
                        <span className="status-badge badge-green">{b.disposed} Closed</span>
                      </td>
                      <td>
                        {b.escalated > 0 ? (
                          <span className="status-badge badge-purple">{b.escalated} Escalated</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>0</span>
                        )}
                      </td>
                      <td>
                        {b.breached > 0 ? (
                          <span className="status-badge badge-red">{b.breached} Breached</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Urgent Overlaps Showcase */}
          <div className="surface-card">
            <div className="card-header-bar">
              <h2 className="card-title">
                <GitMerge size={20} color="var(--status-red)" />
                {t.highAlerts}
              </h2>
              <button 
                className="btn-secondary" 
                style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                onClick={() => onNavigateTab('overlaps')}
              >
                {t.viewAll}
              </button>
            </div>

            {high_priority_overlaps.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No uncoordinated high overlaps at this moment.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {high_priority_overlaps.map((ovr) => (
                  <div 
                    key={ovr.alert_id}
                    className="case-box" 
                    style={{ 
                      cursor: 'pointer', 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderLeft: '4px solid var(--status-red)'
                    }}
                    onClick={() => onSelectOverlap(ovr)}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span className="status-badge badge-red">
                          {Math.round(ovr.score * 100)}% Overlap Score
                        </span>
                        <strong style={{ fontSize: '0.95rem' }}>{ovr.institution_name}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          ({ovr.aicte_permanent_id})
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        Cross-bureau: <strong>{ovr.case_a.bureau_name}</strong> ({ovr.case_a.id}) &harr; <strong>{ovr.case_b.bureau_name}</strong> ({ovr.case_b.id})
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Why Flagged: {ovr.reasons[0]}
                      </div>
                    </div>
                    <ChevronRight size={18} color="var(--text-muted)" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Aging Analysis & Regional Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Aging Buckets */}
          <div className="surface-card">
            <div className="card-header-bar">
              <h2 className="card-title">
                <Clock size={20} color="var(--brand-accent)" />
                {t.agingAnalysis}
              </h2>
            </div>

            <div className="aging-bars-container">
              <div className="aging-row">
                <div className="aging-meta">
                  <span>0 – 7 Days</span>
                  <strong>{aging_buckets['0_7_days']} cases</strong>
                </div>
                <div className="progress-track">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${(aging_buckets['0_7_days'] / maxAging) * 100}%`,
                      background: 'var(--status-green)' 
                    }}
                  />
                </div>
              </div>

              <div className="aging-row">
                <div className="aging-meta">
                  <span>8 – 15 Days</span>
                  <strong>{aging_buckets['8_15_days']} cases</strong>
                </div>
                <div className="progress-track">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${(aging_buckets['8_15_days'] / maxAging) * 100}%`,
                      background: 'var(--status-blue)' 
                    }}
                  />
                </div>
              </div>

              <div className="aging-row">
                <div className="aging-meta">
                  <span>16 – 30 Days</span>
                  <strong>{aging_buckets['16_30_days']} cases</strong>
                </div>
                <div className="progress-track">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${(aging_buckets['16_30_days'] / maxAging) * 100}%`,
                      background: 'var(--status-amber)' 
                    }}
                  />
                </div>
              </div>

              <div className="aging-row">
                <div className="aging-meta">
                  <span>31 – 60 Days (Breach Zone)</span>
                  <strong style={{ color: 'var(--status-red)' }}>{aging_buckets['31_60_days']} cases</strong>
                </div>
                <div className="progress-track">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${(aging_buckets['31_60_days'] / maxAging) * 100}%`,
                      background: 'var(--status-red)' 
                    }}
                  />
                </div>
              </div>

              <div className="aging-row">
                <div className="aging-meta">
                  <span>60+ Days (Severe Delay)</span>
                  <strong style={{ color: 'var(--status-red)' }}>{aging_buckets['60_plus_days']} cases</strong>
                </div>
                <div className="progress-track">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${(aging_buckets['60_plus_days'] / maxAging) * 100}%`,
                      background: '#7f1d1d' 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Regional Case Heat Summary */}
          <div className="surface-card">
            <div className="card-header-bar">
              <h2 className="card-title">
                <MapPin size={20} color="var(--brand-blue)" />
                {t.regionalDistribution}
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {regional_stats.map((r) => (
                <div 
                  key={r.region} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-secondary)'
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '0.86rem' }}>{r.region}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {r.open} Open
                    </span>
                    {r.breached > 0 && (
                      <span className="status-badge badge-red" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>
                        {r.breached} Breached
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
