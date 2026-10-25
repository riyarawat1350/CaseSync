import React, { useState, useEffect } from 'react';
import { 
  Download, FileSpreadsheet, ShieldAlert, 
  MapPin, GitMerge
} from 'lucide-react';
import { api } from '../api';

interface ReportsViewProps {
  lang: 'en' | 'hi';
}

export const ReportsView: React.FC<ReportsViewProps> = ({ lang }) => {
  const [activeReport, setActiveReport] = useState<'bureau' | 'region' | 'overlaps'>('bureau');
  const [bureauData, setBureauData] = useState<any[]>([]);
  const [regionData, setRegionData] = useState<any[]>([]);
  const [overlapData, setOverlapData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [b, r, o] = await Promise.all([
        api.getReportsBureau(),
        api.getReportsRegion(),
        api.getReportsOverlaps()
      ]);
      setBureauData(b || []);
      setRegionData(r || []);
      setOverlapData(o || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    let filename = `AICTE_CaseSync_${activeReport}_report.csv`;

    if (activeReport === 'bureau') {
      csvContent += "Bureau Code,Bureau Name,Total Cases,Active Open,Disposed,Escalated,SLA Breached\n";
      bureauData.forEach(row => {
        csvContent += `"${row.bureau_code}","${row.bureau_name}",${row.total},${row.open},${row.disposed},${row.escalated},${row.breached}\n`;
      });
    } else if (activeReport === 'region') {
      csvContent += "Region,Total Cases,Active Open,SLA Breached\n";
      regionData.forEach(row => {
        csvContent += `"${row.region}",${row.total},${row.open},${row.breached}\n`;
      });
    } else {
      csvContent += "Alert ID,Institution,Permanent ID,Score,Level,Bureau A,Case A ID,Bureau B,Case B ID,Coordination Status,Lead Bureau,Decision\n";
      overlapData.forEach(row => {
        csvContent += `"${row.alert_id}","${row.institution}","${row.permanent_id}",${row.score},"${row.level}","${row.bureau_a}","${row.case_a_id}","${row.bureau_b}","${row.case_b_id}","${row.coordination_status}","${row.lead_bureau}","${row.decision}"\n`;
      });
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
    title: lang === 'hi' ? 'रिपोर्ट्स एवं विश्लेषण केंद्र' : 'Reports & Analytical Exports',
    subtitle: lang === 'hi' 
      ? 'समीक्षा बैठकों एवं आधिकारिक ऑडिट हेतु ब्यूरो-वार, क्षेत्र-वार व ओवरलैप रिपोर्ट निर्यात करें' 
      : 'Generate and export on-demand compliance reports for executive meetings and cross-bureau audits',
    bureauReport: lang === 'hi' ? 'ब्यूरो वार कार्य निष्पादन रिपोर्ट' : 'Bureau Performance Report',
    regionReport: lang === 'hi' ? 'क्षेत्र वार केस भार रिपोर्ट' : 'Regional Caseload Report',
    overlapReport: lang === 'hi' ? 'क्रॉस-ब्यूरो ओवरलैप ऑडिट रिपोर्ट' : 'Overlap Audit Report',
    exportCsv: lang === 'hi' ? 'CSV डाउनलोड करें' : 'Export CSV'
  };

  return (
    <div>
      {/* Header with Export Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {t.title}
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            {t.subtitle}
          </p>
        </div>

        <button className="btn-primary" onClick={exportCSV}>
          <Download size={16} /> {t.exportCsv}
        </button>
      </div>

      {/* Report Selector Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button 
          className={`btn-secondary ${activeReport === 'bureau' ? 'active' : ''}`}
          onClick={() => setActiveReport('bureau')}
        >
          <ShieldAlert size={14} /> {t.bureauReport}
        </button>
        <button 
          className={`btn-secondary ${activeReport === 'region' ? 'active' : ''}`}
          onClick={() => setActiveReport('region')}
        >
          <MapPin size={14} /> {t.regionReport}
        </button>
        <button 
          className={`btn-secondary ${activeReport === 'overlaps' ? 'active' : ''}`}
          onClick={() => setActiveReport('overlaps')}
        >
          <GitMerge size={14} /> {t.overlapReport}
        </button>
      </div>

      {/* Report Tables Container */}
      <div className="surface-card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Compiling analytical report...</div>
        ) : (
          <>
            {/* Bureau Performance Report */}
            {activeReport === 'bureau' && (
              <div>
                <div className="card-header-bar">
                  <h3 className="card-title">
                    <FileSpreadsheet size={18} color="var(--brand-blue)" />
                    AICTE Bureau Complaint Handling & Disposal Performance Report
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Generated on 25 Oct 2026
                  </span>
                </div>

                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Bureau / Cell</th>
                        <th>Code</th>
                        <th>Total Ingested</th>
                        <th>Active Open</th>
                        <th>Disposed</th>
                        <th>Escalations</th>
                        <th>SLA Breached</th>
                        <th>Disposal Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bureauData.map((b) => (
                        <tr key={b.bureau_code}>
                          <td><strong>{b.bureau_name}</strong></td>
                          <td><code>{b.bureau_code}</code></td>
                          <td>{b.total}</td>
                          <td><span className="status-badge badge-amber">{b.open}</span></td>
                          <td><span className="status-badge badge-green">{b.disposed}</span></td>
                          <td>{b.escalated}</td>
                          <td><span className="status-badge badge-red">{b.breached}</span></td>
                          <td>
                            <strong>
                              {b.total > 0 ? Math.round((b.disposed / b.total) * 100) : 0}%
                            </strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Regional Caseload Report */}
            {activeReport === 'region' && (
              <div>
                <div className="card-header-bar">
                  <h3 className="card-title">
                    <FileSpreadsheet size={18} color="var(--brand-blue)" />
                    Pan-India AICTE Regional Office Caseload & Vigilance Report
                  </h3>
                </div>

                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>AICTE Regional Jurisdiction</th>
                        <th>Total Complaints Linked</th>
                        <th>Open Active Investigations</th>
                        <th>SLA Breached Cases</th>
                      </tr>
                    </thead>
                    <tbody>
                      {regionData.map((r) => (
                        <tr key={r.region}>
                          <td><strong>{r.region} Region</strong></td>
                          <td>{r.total}</td>
                          <td><span className="status-badge badge-amber">{r.open}</span></td>
                          <td>
                            {r.breached > 0 ? (
                              <span className="status-badge badge-red">{r.breached}</span>
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
            )}

            {/* Overlap Audit Report */}
            {activeReport === 'overlaps' && (
              <div>
                <div className="card-header-bar">
                  <h3 className="card-title">
                    <FileSpreadsheet size={18} color="var(--brand-blue)" />
                    Cross-Bureau Overlap Detection & Joint Coordination Audit Log
                  </h3>
                </div>

                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Alert ID</th>
                        <th>Institution Identity</th>
                        <th>Score</th>
                        <th>Bureau A Case</th>
                        <th>Bureau B Case</th>
                        <th>Lead Bureau</th>
                        <th>Coordination Status</th>
                        <th>Recorded Order</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overlapData.map((o) => (
                        <tr key={o.alert_id}>
                          <td><code>{o.alert_id}</code></td>
                          <td>
                            <strong>{o.institution}</strong>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{o.permanent_id}</div>
                          </td>
                          <td>
                            <span className={`status-badge ${o.score >= 0.75 ? 'badge-red' : 'badge-amber'}`}>
                              {Math.round(o.score * 100)}%
                            </span>
                          </td>
                          <td>
                            <div>{o.bureau_a}</div>
                            <code>{o.case_a_id}</code>
                          </td>
                          <td>
                            <div>{o.bureau_b}</div>
                            <code>{o.case_b_id}</code>
                          </td>
                          <td><strong>{o.lead_bureau}</strong></td>
                          <td>
                            <span className="status-badge badge-blue">
                              {o.coordination_status}
                            </span>
                          </td>
                          <td style={{ maxWidth: '240px', fontSize: '0.78rem' }}>
                            {o.decision}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
