import React, { useState, useEffect } from 'react';
import { 
  Download, ShieldAlert, 
  MapPin, GitMerge, Building2, Clock, 
  TrendingUp, CalendarCheck, Search,
  CheckCircle
} from 'lucide-react';
import { api } from '../api';
import type { InstitutionItem } from '../types';

interface ReportsViewProps {
  lang: 'en' | 'hi';
}

type ReportTab = 
  | 'bureau' 
  | 'region' 
  | 'institution' 
  | 'ageing' 
  | 'disposal' 
  | 'overlaps' 
  | 'performance';

export const ReportsView: React.FC<ReportsViewProps> = ({ lang }) => {
  const [activeReport, setActiveReport] = useState<ReportTab>('bureau');
  const [loading, setLoading] = useState<boolean>(false);
  
  // Data stores
  const [bureauData, setBureauData] = useState<any[]>([]);
  const [regionData, setRegionData] = useState<any[]>([]);
  const [overlapData, setOverlapData] = useState<any[]>([]);
  const [ageingData, setAgeingData] = useState<Record<string, number>>({});
  const [disposalData, setDisposalData] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  
  // Institution report state
  const [institutionsList, setInstitutionsList] = useState<InstitutionItem[]>([]);
  const [selectedInstId, setSelectedInstId] = useState<string>('INST-001');
  const [institutionReport, setInstitutionReport] = useState<any>(null);
  const [instSearchTerm, setInstSearchTerm] = useState('');

  useEffect(() => {
    loadAllReports();
  }, []);

  useEffect(() => {
    if (selectedInstId) {
      loadInstitutionHistory(selectedInstId);
    }
  }, [selectedInstId]);

  const loadAllReports = async () => {
    setLoading(true);
    try {
      const [b, r, o, a, d, p, insts] = await Promise.all([
        api.getReportsBureau(),
        api.getReportsRegion(),
        api.getReportsOverlaps(),
        api.getReportsAgeing(),
        api.getReportsDisposalRate(),
        api.getReportsPerformance(),
        api.getInstitutions()
      ]);
      setBureauData(b || []);
      setRegionData(r || []);
      setOverlapData(o || []);
      setAgeingData(a || {});
      setDisposalData(d || []);
      setPerformanceData(p || []);
      setInstitutionsList(insts || []);
      if (insts && insts.length > 0 && !selectedInstId) {
        setSelectedInstId(insts[0].id);
      }
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadInstitutionHistory = async (instId: string) => {
    try {
      const rep = await api.getReportInstitutionHistory(instId);
      setInstitutionReport(rep);
    } catch (err) {
      console.error(err);
    }
  };

  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    let filename = `AICTE_CaseSync_${activeReport}_report.csv`;

    switch (activeReport) {
      case 'bureau':
        csvContent += "Bureau Code,Bureau Name,Total Cases,Active Open,Disposed,Escalated,SLA Breached\n";
        bureauData.forEach(row => {
          csvContent += `"${row.bureau_code}","${row.bureau_name}",${row.total},${row.open},${row.disposed},${row.escalated},${row.breached}\n`;
        });
        break;

      case 'region':
        csvContent += "Region,Total Cases,Active Open,SLA Breached\n";
        regionData.forEach(row => {
          csvContent += `"${row.region}",${row.total},${row.open},${row.breached}\n`;
        });
        break;

      case 'institution':
        if (institutionReport && institutionReport.cases) {
          filename = `AICTE_CaseSync_Institution_${institutionReport.institution?.aicte_permanent_id || selectedInstId}_report.csv`;
          csvContent += "Case ID,Bureau,Category,Received Date,Status,Priority,SLA Severity,Days Elapsed,Last Action Taken\n";
          institutionReport.cases.forEach((c: any) => {
            csvContent += `"${c.case_id}","${c.bureau}","${c.category}","${c.received_date}","${c.status}","${c.priority}","${c.sla_severity}",${c.days_elapsed},"${c.last_action.replace(/"/g, '""')}"\n`;
          });
        }
        break;

      case 'ageing':
        csvContent += "Ageing Bracket,Days Range,Active Pending Cases,SLA Risk Level\n";
        csvContent += `"Bracket 1","0 - 7 days",${ageingData['0_7_days'] || 0},"Low / Initial Scrutiny"\n`;
        csvContent += `"Bracket 2","8 - 15 days",${ageingData['8_15_days'] || 0},"Normal / Under Process"\n`;
        csvContent += `"Bracket 3","16 - 30 days",${ageingData['16_30_days'] || 0},"Medium / Nearing SLA"\n`;
        csvContent += `"Bracket 4","31 - 60 days",${ageingData['31_60_days'] || 0},"High / Breached Standard 30D SLA"\n`;
        csvContent += `"Bracket 5","60+ days",${ageingData['60_plus_days'] || 0},"Critical / Urgent Competent Authority Review"\n`;
        break;

      case 'disposal':
        csvContent += "Month,Cases Received,Cases Disposed,Disposal Rate (%)\n";
        disposalData.forEach(row => {
          csvContent += `"${row.month}",${row.received},${row.disposed},${row.disposal_rate}%\n`;
        });
        break;

      case 'overlaps':
        csvContent += "Alert ID,Institution,Permanent ID,Score,Level,Bureau A,Case A ID,Bureau B,Case B ID,Coordination Status,Lead Bureau,Decision\n";
        overlapData.forEach(row => {
          csvContent += `"${row.alert_id}","${row.institution}","${row.permanent_id}",${row.score},"${row.level}","${row.bureau_a}","${row.case_a_id}","${row.bureau_b}","${row.case_b_id}","${row.coordination_status}","${row.lead_bureau}","${(row.decision || '').replace(/"/g, '""')}"\n`;
        });
        break;

      case 'performance':
        csvContent += "Quarter,Cases Handled,Cases Disposed,SLA Compliance Rate,Average Resolution Days\n";
        performanceData.forEach(row => {
          csvContent += `"${row.quarter}",${row.cases_handled},${row.disposed},"${row.sla_compliance_rate}",${row.avg_resolution_days}\n`;
        });
        break;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const t = {
    title: lang === 'hi' ? 'रिपोर्ट्स एवं विश्लेषण केंद्र' : 'Reports & Analytical Intelligence',
    subtitle: lang === 'hi' 
      ? 'समीक्षा बैठकों, संसदीय प्रश्नों एवं आधिकारिक ऑडिट हेतु ब्यूरो-वार, क्षेत्र-वार व संस्थान-वार विस्तृत रिपोर्ट' 
      : 'Generate, visualize, and export compliance reports for AICTE Executive Council and Bureau audits',
    bureauReport: lang === 'hi' ? 'ब्यूरो वार' : 'Bureau-wise',
    regionReport: lang === 'hi' ? 'क्षेत्र वार' : 'Region-wise',
    institutionReport: lang === 'hi' ? 'संस्थान इतिहास' : 'Institution-wise',
    ageingReport: lang === 'hi' ? 'लंबित आयु' : 'Pending Ageing',
    disposalReport: lang === 'hi' ? 'निस्तारण दर' : 'Disposal Rate',
    overlapReport: lang === 'hi' ? 'ओवरलैप / डुप्लिकेट' : 'Overlaps & Duplicates',
    performanceReport: lang === 'hi' ? 'त्रैमासिक निष्पादन' : 'Quarterly Performance',
    exportCsv: lang === 'hi' ? 'CSV डाउनलोड करें' : 'Export CSV'
  };

  const filteredInsts = institutionsList.filter(i => {
    if (!instSearchTerm) return true;
    const q = instSearchTerm.toLowerCase();
    return i.name.toLowerCase().includes(q) || i.aicte_permanent_id.toLowerCase().includes(q);
  });

  return (
    <div>
      {/* Header with Export Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {t.title}
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            {t.subtitle}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {loading && (
            <span style={{ fontSize: '0.78rem', color: 'var(--brand-primary)', fontWeight: 600 }}>
              {lang === 'hi' ? 'डेटा लोड हो रहा है...' : 'Refreshing data...'}
            </span>
          )}
          <button className="btn-primary" onClick={exportCSV}>
            <Download size={16} /> {t.exportCsv}
          </button>
        </div>
      </div>

      {/* 7 Report Selector Tabs (Feature 6) */}
      <div style={{ 
        display: 'flex', 
        gap: '6px', 
        marginBottom: '20px', 
        flexWrap: 'wrap',
        background: 'var(--bg-secondary)',
        padding: '6px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)'
      }}>
        <button 
          className={`btn-secondary ${activeReport === 'bureau' ? 'active' : ''}`}
          onClick={() => setActiveReport('bureau')}
          style={{ fontSize: '0.78rem', padding: '6px 12px' }}
        >
          <ShieldAlert size={13} /> {t.bureauReport}
        </button>

        <button 
          className={`btn-secondary ${activeReport === 'region' ? 'active' : ''}`}
          onClick={() => setActiveReport('region')}
          style={{ fontSize: '0.78rem', padding: '6px 12px' }}
        >
          <MapPin size={13} /> {t.regionReport}
        </button>

        <button 
          className={`btn-secondary ${activeReport === 'institution' ? 'active' : ''}`}
          onClick={() => setActiveReport('institution')}
          style={{ fontSize: '0.78rem', padding: '6px 12px' }}
        >
          <Building2 size={13} /> {t.institutionReport}
        </button>

        <button 
          className={`btn-secondary ${activeReport === 'ageing' ? 'active' : ''}`}
          onClick={() => setActiveReport('ageing')}
          style={{ fontSize: '0.78rem', padding: '6px 12px' }}
        >
          <Clock size={13} /> {t.ageingReport}
        </button>

        <button 
          className={`btn-secondary ${activeReport === 'disposal' ? 'active' : ''}`}
          onClick={() => setActiveReport('disposal')}
          style={{ fontSize: '0.78rem', padding: '6px 12px' }}
        >
          <TrendingUp size={13} /> {t.disposalReport}
        </button>

        <button 
          className={`btn-secondary ${activeReport === 'overlaps' ? 'active' : ''}`}
          onClick={() => setActiveReport('overlaps')}
          style={{ fontSize: '0.78rem', padding: '6px 12px' }}
        >
          <GitMerge size={13} /> {t.overlapReport}
        </button>

        <button 
          className={`btn-secondary ${activeReport === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveReport('performance')}
          style={{ fontSize: '0.78rem', padding: '6px 12px' }}
        >
          <CalendarCheck size={13} /> {t.performanceReport}
        </button>
      </div>

      {/* 1. Bureau-wise Report */}
      {activeReport === 'bureau' && (
        <div className="surface-card" style={{ padding: '0' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>AICTE Bureau Caseload & Performance Summary</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Workload distribution, disposal counts, and SLA compliance across participating AICTE Bureaus</p>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bureau Code</th>
                  <th>Bureau Name</th>
                  <th>Total Registered</th>
                  <th>Active Pending</th>
                  <th>Disposed</th>
                  <th>Escalated</th>
                  <th>SLA Breached</th>
                </tr>
              </thead>
              <tbody>
                {bureauData.map((b) => (
                  <tr key={b.bureau_code}>
                    <td><strong className="brand-tag">{b.bureau_code}</strong></td>
                    <td><strong>{b.bureau_name}</strong></td>
                    <td style={{ fontWeight: 700 }}>{b.total}</td>
                    <td><span className="status-badge badge-amber">{b.open} Open</span></td>
                    <td><span className="status-badge badge-green">{b.disposed} Disposed</span></td>
                    <td><span className="status-badge badge-purple">{b.escalated} Escalated</span></td>
                    <td>
                      <span className={`status-badge ${b.breached > 0 ? 'badge-red' : 'badge-green'}`}>
                        {b.breached} Breached
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Region-wise Report */}
      {activeReport === 'region' && (
        <div className="surface-card" style={{ padding: '0' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Pan-India Regional Office Caseload Report</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Regional surveillance, open investigations, and jurisdictional breach indices</p>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Regional Office Jurisdiction</th>
                  <th>Total Registered Cases</th>
                  <th>Active Open Cases</th>
                  <th>SLA Breaches</th>
                  <th>Workload Share</th>
                </tr>
              </thead>
              <tbody>
                {regionData.map((r) => {
                  const totalAll = regionData.reduce((acc, curr) => acc + curr.total, 0);
                  const pct = totalAll > 0 ? ((r.total / totalAll) * 100).toFixed(1) : '0';
                  return (
                    <tr key={r.region}>
                      <td><strong>{r.region} Region</strong></td>
                      <td style={{ fontWeight: 700 }}>{r.total}</td>
                      <td><span className="status-badge badge-blue">{r.open} Open</span></td>
                      <td>
                        <span className={`status-badge ${r.breached > 0 ? 'badge-red' : 'badge-green'}`}>
                          {r.breached} Breached
                        </span>
                      </td>
                      <td style={{ width: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="progress-track" style={{ flex: 1, height: '6px' }}>
                            <div className="progress-fill" style={{ width: `${pct}%`, background: 'var(--brand-blue)' }} />
                          </div>
                          <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)' }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Institution-wise Complaint History (Feature 6 with Picker) */}
      {activeReport === 'institution' && (
        <div>
          {/* Institution Selector Bar */}
          <div className="surface-card" style={{ marginBottom: '16px', padding: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px', alignItems: 'center' }}>
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-muted)' }}>
                  Select Institution to Audit:
                </label>
                <select 
                  className="persona-select"
                  value={selectedInstId}
                  onChange={(e) => setSelectedInstId(e.target.value)}
                  style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}
                >
                  {filteredInsts.map(inst => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.aicte_permanent_id}) - {inst.region}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-muted)' }}>
                  Filter Institution Dropdown:
                </label>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '13px', color: 'var(--text-muted)' }} />
                  <input 
                    type="text"
                    placeholder="Type name or AICTE ID to filter..."
                    value={instSearchTerm}
                    onChange={(e) => setInstSearchTerm(e.target.value)}
                    style={{ width: '100%', height: '40px', paddingLeft: '32px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', fontSize: '0.82rem' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Selected Institution Master Card */}
          {institutionReport && (
            <div className="surface-card" style={{ marginBottom: '16px', padding: '16px', background: 'linear-gradient(135deg, rgba(30,58,138,0.04), rgba(59,130,246,0.04))', border: '1.5px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--brand-blue)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Authoritative Institution Master Record
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '2px' }}>
                    {institutionReport.institution?.name}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    AICTE Permanent ID: <code style={{ fontFamily: 'var(--font-mono)' }}>{institutionReport.institution?.aicte_permanent_id}</code> &bull; Region: {institutionReport.institution?.region} &bull; State: {institutionReport.institution?.state}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ textAlign: 'center', padding: '8px 14px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Complaints</div>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--brand-blue)' }}>{institutionReport.total_complaints}</strong>
                  </div>
                  <div style={{ textAlign: 'center', padding: '8px 14px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Risk Rating</div>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--status-amber)' }}>{institutionReport.institution?.risk_level || 'Medium'}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Institution Complaint History Table */}
          <div className="surface-card" style={{ padding: '0' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 800 }}>Complete Complaint & Investigation History</h4>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Case ID</th>
                    <th>Receiving Bureau</th>
                    <th>Allegation Category</th>
                    <th>Received Date</th>
                    <th>Status</th>
                    <th>Days Elapsed</th>
                    <th>Last Action Taken</th>
                  </tr>
                </thead>
                <tbody>
                  {!institutionReport || !institutionReport.cases || institutionReport.cases.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        No complaint records registered against this technical institution.
                      </td>
                    </tr>
                  ) : (
                    institutionReport.cases.map((c: any) => (
                      <tr key={c.case_id}>
                        <td><strong style={{ color: 'var(--brand-blue)', fontFamily: 'var(--font-mono)' }}>{c.case_id}</strong></td>
                        <td><span className="brand-tag">{c.bureau}</span></td>
                        <td>{c.category}</td>
                        <td>{c.received_date}</td>
                        <td>
                          <span className={`status-badge ${
                            c.status === 'Disposed' ? 'badge-green' :
                            c.status === 'Escalated' ? 'badge-purple' : 'badge-amber'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: c.sla_severity === 'red' ? 'var(--status-red)' : 'var(--text-primary)' }}>
                            {c.days_elapsed} days
                          </span>
                        </td>
                        <td style={{ fontSize: '0.78rem', maxWidth: '280px' }}>{c.last_action}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. Pending Ageing Analysis (0-7, 8-15, 16-30, 31-60, 60+ days) */}
      {activeReport === 'ageing' && (
        <div>
          {/* Visual Distribution Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <div className="surface-card" style={{ textAlign: 'center', borderTop: '4px solid var(--status-green)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>0 – 7 Days (Fresh)</span>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0', color: 'var(--status-green)' }}>
                {ageingData['0_7_days'] || 0}
              </h2>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Initial Scrutiny Window</span>
            </div>

            <div className="surface-card" style={{ textAlign: 'center', borderTop: '4px solid var(--brand-blue)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>8 – 15 Days</span>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0', color: 'var(--brand-blue)' }}>
                {ageingData['8_15_days'] || 0}
              </h2>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Under Process / Evidence</span>
            </div>

            <div className="surface-card" style={{ textAlign: 'center', borderTop: '4px solid var(--status-amber)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>16 – 30 Days</span>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0', color: 'var(--status-amber)' }}>
                {ageingData['16_30_days'] || 0}
              </h2>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>80% SLA Warning Threshold</span>
            </div>

            <div className="surface-card" style={{ textAlign: 'center', borderTop: '4px solid var(--status-red)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>31 – 60 Days</span>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0', color: 'var(--status-red)' }}>
                {ageingData['31_60_days'] || 0}
              </h2>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>SLA Breached / Overdue</span>
            </div>

            <div className="surface-card" style={{ textAlign: 'center', borderTop: '4px solid var(--status-purple)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>60+ Days (Critical)</span>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0', color: 'var(--status-purple)' }}>
                {ageingData['60_plus_days'] || 0}
              </h2>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Mandatory Executive Review</span>
            </div>
          </div>

          {/* Ageing Table Breakdown */}
          <div className="surface-card" style={{ padding: '0' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Statutory Ageing Analysis Matrix</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Granular breakdown of pending institution complaints against statutory turnaround norms</p>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ageing Bracket</th>
                    <th>Turnaround Timeline</th>
                    <th>Active Pending Cases</th>
                    <th>SLA Regulatory Severity</th>
                    <th>Mandated Regulatory Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Bracket 1</strong></td>
                    <td>0 – 7 Days</td>
                    <td style={{ fontWeight: 800, color: 'var(--status-green)' }}>{ageingData['0_7_days'] || 0}</td>
                    <td><span className="status-badge badge-green">Low (Compliant)</span></td>
                    <td style={{ fontSize: '0.78rem' }}>Automated entity resolution, verification of jurisdiction, initial notice dispatch</td>
                  </tr>
                  <tr>
                    <td><strong>Bracket 2</strong></td>
                    <td>8 – 15 Days</td>
                    <td style={{ fontWeight: 800, color: 'var(--brand-blue)' }}>{ageingData['8_15_days'] || 0}</td>
                    <td><span className="status-badge badge-blue">Normal (Active Processing)</span></td>
                    <td style={{ fontSize: '0.78rem' }}>Receipt of institution explanation, cross-bureau overlap cross-referencing</td>
                  </tr>
                  <tr>
                    <td><strong>Bracket 3</strong></td>
                    <td>16 – 30 Days</td>
                    <td style={{ fontWeight: 800, color: 'var(--status-amber)' }}>{ageingData['16_30_days'] || 0}</td>
                    <td><span className="status-badge badge-amber">Warning (80% SLA Threshold)</span></td>
                    <td style={{ fontSize: '0.78rem' }}>Standing Complaints Committee scheduling; reminder alert to Assigned Officer</td>
                  </tr>
                  <tr>
                    <td><strong>Bracket 4</strong></td>
                    <td>31 – 60 Days</td>
                    <td style={{ fontWeight: 800, color: 'var(--status-red)' }}>{ageingData['31_60_days'] || 0}</td>
                    <td><span className="status-badge badge-red">SLA Breached</span></td>
                    <td style={{ fontSize: '0.78rem' }}>Automated escalation notice to Bureau Head; explanation required for delay</td>
                  </tr>
                  <tr>
                    <td><strong>Bracket 5</strong></td>
                    <td>60+ Days</td>
                    <td style={{ fontWeight: 800, color: 'var(--status-purple)' }}>{ageingData['60_plus_days'] || 0}</td>
                    <td><span className="status-badge badge-purple">Critical Delinquency</span></td>
                    <td style={{ fontSize: '0.78rem' }}>Submission to Competent Authority (Chairman) for summary disposal directive</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. Disposal Rate Report */}
      {activeReport === 'disposal' && (
        <div className="surface-card" style={{ padding: '0' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Monthly Complaint Disposal Trend (2026)</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Month-over-month receipt, resolution volume, and disposal velocity index</p>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Calendar Month</th>
                  <th>New Cases Received</th>
                  <th>Cases Disposed</th>
                  <th>Monthly Disposal Rate</th>
                  <th>Visual Velocity</th>
                </tr>
              </thead>
              <tbody>
                {disposalData.map((d) => (
                  <tr key={d.month}>
                    <td><strong>{d.month}</strong></td>
                    <td>{d.received}</td>
                    <td><span className="status-badge badge-green">{d.disposed} Disposed</span></td>
                    <td><strong style={{ color: 'var(--brand-blue)' }}>{d.disposal_rate}%</strong></td>
                    <td style={{ width: '220px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="progress-track" style={{ flex: 1, height: '7px' }}>
                          <div 
                            className="progress-fill" 
                            style={{ 
                              width: `${d.disposal_rate}%`, 
                              background: d.disposal_rate >= 85 ? 'var(--status-green)' : 'var(--status-amber)' 
                            }} 
                          />
                        </div>
                        <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)' }}>{d.disposal_rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Overlapping & Duplicate Cases Report */}
      {activeReport === 'overlaps' && (
        <div className="surface-card" style={{ padding: '0' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Cross-Bureau Overlap & Duplicate Coordination Audit</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Log of all parallel complaints flagged across AICTE Bureaus with resolution status and designated Lead Bureau</p>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Alert ID</th>
                  <th>Institution Master</th>
                  <th>AICTE ID</th>
                  <th>Overlap Score</th>
                  <th>Bureau A (Case ID)</th>
                  <th>Bureau B (Case ID)</th>
                  <th>Coordination Status</th>
                  <th>Designated Lead</th>
                </tr>
              </thead>
              <tbody>
                {overlapData.map((o) => (
                  <tr key={o.alert_id}>
                    <td><strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{o.alert_id}</strong></td>
                    <td><strong>{o.institution}</strong></td>
                    <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem' }}>{o.permanent_id}</code></td>
                    <td>
                      <span className={`status-badge ${o.level === 'HIGH' ? 'badge-red' : 'badge-amber'}`}>
                        {Math.round(o.score * 100)}% ({o.level})
                      </span>
                    </td>
                    <td>
                      <div>{o.bureau_a}</div>
                      <code style={{ fontSize: '0.72rem', color: 'var(--brand-blue)' }}>{o.case_a_id}</code>
                    </td>
                    <td>
                      <div>{o.bureau_b}</div>
                      <code style={{ fontSize: '0.72rem', color: 'var(--brand-blue)' }}>{o.case_b_id}</code>
                    </td>
                    <td>
                      <span className={`status-badge ${o.coordination_status === 'RESOLVED' ? 'badge-green' : 'badge-blue'}`}>
                        {o.coordination_status}
                      </span>
                    </td>
                    <td>
                      <strong>{o.lead_bureau}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. Quarterly Performance Report */}
      {activeReport === 'performance' && (
        <div className="surface-card" style={{ padding: '0' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Quarterly Vigilance & Disposal Performance (CY 2026)</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Institutional oversight metrics, statutory compliance ratios, and average turnaround days</p>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Evaluation Quarter</th>
                  <th>Cases Handled</th>
                  <th>Cases Disposed</th>
                  <th>SLA Compliance Rate</th>
                  <th>Average Resolution Days</th>
                  <th>Executive Status</th>
                </tr>
              </thead>
              <tbody>
                {performanceData.map((p) => (
                  <tr key={p.quarter}>
                    <td><strong>{p.quarter}</strong></td>
                    <td style={{ fontWeight: 700 }}>{p.cases_handled}</td>
                    <td><span className="status-badge badge-green">{p.disposed} Disposed</span></td>
                    <td><strong style={{ color: 'var(--brand-blue)' }}>{p.sla_compliance_rate}</strong></td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{p.avg_resolution_days} Days</span>
                    </td>
                    <td>
                      <span className="status-badge badge-blue">
                        <CheckCircle size={12} /> Approved by Council
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
