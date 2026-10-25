import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ChevronRight, Sparkles, X,
  MapPin
} from 'lucide-react';
import type { InstitutionItem } from '../types';
import { api } from '../api';

interface Institution360ViewProps {
  institutions: InstitutionItem[];
  lang: 'en' | 'hi';
}

export const Institution360View: React.FC<Institution360ViewProps> = ({
  institutions,
  lang
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [activeInstitutionId, setActiveInstitutionId] = useState<string | null>(null);
  const [inst360Data, setInst360Data] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Live Entity Resolution Sandbox
  const [sandboxInput, setSandboxInput] = useState('A.B.C Inst of Engg & Tech');
  const [sandboxId, setSandboxId] = useState('');
  const [sandboxResult, setSandboxResult] = useState<any>(null);
  const [resolving, setResolving] = useState(false);

  // Filter institutions list
  const filteredInsts = institutions.filter((inst) => {
    if (selectedRegion !== 'all' && inst.region.toLowerCase() !== selectedRegion.toLowerCase()) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match = (
        inst.name.toLowerCase().includes(q) ||
        inst.aicte_permanent_id.toLowerCase().includes(q) ||
        inst.aliases.some((a) => a.toLowerCase().includes(q)) ||
        inst.state.toLowerCase().includes(q)
      );
      if (!match) return false;
    }
    return true;
  });

  const handleOpen360 = async (id: string) => {
    setActiveInstitutionId(id);
    setLoadingDetail(true);
    try {
      const data = await api.getInstitution360(id);
      setInst360Data(data);
    } catch (err) {
      console.error(err);
      alert('Failed to load institution 360 data');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleTestResolution = async () => {
    if (!sandboxInput.trim()) return;
    setResolving(true);
    try {
      const res = await api.resolveInstitution(sandboxInput, sandboxId || undefined);
      setSandboxResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setResolving(false);
    }
  };

  useEffect(() => {
    handleTestResolution();
  }, []);

  const t = {
    title: lang === 'hi' ? 'संस्थान 360 एवं मास्टर पहचान निर्देशिका' : 'Institution 360 & Central Master Directory',
    subtitle: lang === 'hi' 
      ? 'एकीकृत प्रोफाइल, ज्ञात उपनाम (Aliases), जोखिम रेटिंग और सभी ब्यूरो में सक्रिय मामलों का संपूर्ण दृश्य' 
      : 'Comprehensive single-view of institution profiles, verified aliases, risk indicators, and cross-bureau history',
    sandboxTitle: lang === 'hi' ? 'संस्थान पहचान संकल्प सैंडबॉक्स (Entity Resolution Tester)' : 'Live Entity Resolution Tester (Tier 1–4 Resolution Engine)',
    searchPlaceholder: lang === 'hi' ? 'संस्थान का नाम, उपनाम या एआईसीटीई आईडी खोजें...' : 'Search college name, alias, AICTE Permanent ID...',
    allRegions: lang === 'hi' ? 'सभी क्षेत्र' : 'All Regions',
    view360: lang === 'hi' ? 'संस्थान 360 देखें' : 'View Institution 360'
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          {t.title}
        </h2>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          {t.subtitle}
        </p>
      </div>

      {/* Interactive Entity Resolution Sandbox Card */}
      <div className="surface-card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--brand-accent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <Sparkles size={18} color="var(--brand-accent)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{t.sandboxTitle}</h3>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
          Test how CaseSync resolves arbitrary spelling variants, abbreviations, or missing IDs to the single authoritative AICTE master profile.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '10px', marginBottom: '12px' }}>
          <input 
            type="text"
            placeholder="Type misspelled college name (e.g. A.B.C Inst of Engg & Tech, ANEC Pune)..."
            value={sandboxInput}
            onChange={(e) => setSandboxInput(e.target.value)}
            style={{ 
              padding: '9px 12px', 
              borderRadius: 'var(--radius-sm)', 
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '0.86rem'
            }}
          />
          <input 
            type="text"
            placeholder="Optional Permanent ID..."
            value={sandboxId}
            onChange={(e) => setSandboxId(e.target.value)}
            style={{ 
              padding: '9px 12px', 
              borderRadius: 'var(--radius-sm)', 
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '0.86rem'
            }}
          />
          <button className="btn-primary" onClick={handleTestResolution} disabled={resolving}>
            {resolving ? 'Resolving...' : 'Test Resolution'}
          </button>
        </div>

        {/* Sandbox Resolution Result Badge */}
        {sandboxResult && (
          <div style={{ 
            background: sandboxResult.matched ? 'var(--status-green-bg)' : 'var(--status-amber-bg)', 
            padding: '12px 16px', 
            borderRadius: 'var(--radius-md)', 
            border: `1px solid ${sandboxResult.matched ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`status-badge ${sandboxResult.matched ? 'badge-green' : 'badge-amber'}`}>
                  {sandboxResult.tier} &bull; {Math.round(sandboxResult.confidence * 100)}% Confidence
                </span>
                {sandboxResult.matched && (
                  <strong>{sandboxResult.institution?.name}</strong>
                )}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Explanation: {sandboxResult.explanation}
              </div>
            </div>

            {sandboxResult.matched && (
              <button 
                className="btn-secondary" 
                style={{ fontSize: '0.75rem', padding: '5px 10px' }}
                onClick={() => handleOpen360(sandboxResult.institution.id)}
              >
                Inspect 360 Profile
              </button>
            )}
          </div>
        )}
      </div>

      {/* Directory Search & Filters */}
      <div className="surface-card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input 
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '9px 12px 9px 36px', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-secondary)',
                fontSize: '0.86rem'
              }}
            />
          </div>

          <select 
            className="persona-select"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            style={{ padding: '9px 12px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}
          >
            <option value="all">{t.allRegions}</option>
            <option value="South-Western">South-Western</option>
            <option value="Western">Western</option>
            <option value="South-Central">South-Central</option>
            <option value="North-West">North-West</option>
            <option value="Eastern">Eastern</option>
            <option value="Central">Central</option>
            <option value="Southern">Southern</option>
            <option value="Northern">Northern</option>
          </select>
        </div>
      </div>

      {/* Institutions Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
        {filteredInsts.map((inst) => (
          <div 
            key={inst.id}
            className="surface-card"
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              borderLeft: inst.risk_level === 'High' ? '4px solid var(--status-red)' :
                          inst.risk_level === 'Medium' ? '4px solid var(--status-amber)' : '4px solid var(--status-green)'
            }}
            onClick={() => handleOpen360(inst.id)}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span className="brand-tag">{inst.region}</span>
                <span className={`status-badge ${
                  inst.risk_level === 'High' ? 'badge-red' :
                  inst.risk_level === 'Medium' ? 'badge-amber' : 'badge-green'
                }`}>
                  Risk: {inst.risk_level}
                </span>
              </div>

              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '4px' }}>
                {inst.name}
              </h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
                Permanent ID: {inst.aicte_permanent_id}
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                {inst.district}, {inst.state}
              </div>

              {/* Aliases List */}
              <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', marginBottom: '10px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Verified Spelling Aliases:
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {inst.aliases.join(' • ')}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.78rem' }}>
                Active Open Cases: <strong>{inst.open_cases || 0}</strong>{' '}
                {inst.has_cross_bureau_activity && (
                  <span className="status-badge badge-red" style={{ fontSize: '0.68rem', padding: '1px 5px' }}>
                    Multi-Bureau Active
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--brand-blue)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                {t.view360} <ChevronRight size={14} />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Institution 360 Full Screen Modal / View */}
      {activeInstitutionId && (
        <div className="modal-overlay" onClick={() => setActiveInstitutionId(null)}>
          <div className="modal-container" style={{ maxWidth: '960px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="brand-tag">Institution 360 Dossier</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  {inst360Data?.institution?.name || 'Loading...'}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  AICTE Permanent ID: {inst360Data?.institution?.aicte_permanent_id}
                </div>
              </div>
              <button className="icon-btn" onClick={() => setActiveInstitutionId(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {loadingDetail ? (
                <div style={{ padding: '30px', textAlign: 'center' }}>Compiling Dossier...</div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                    <div className="case-box">
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Approval Status</div>
                      <strong style={{ fontSize: '0.88rem' }}>{inst360Data?.institution?.approval_status}</strong>
                    </div>
                    <div className="case-box">
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Approved Intake</div>
                      <strong style={{ fontSize: '0.88rem' }}>{inst360Data?.institution?.approved_intake} Seats</strong>
                    </div>
                    <div className="case-box">
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Head / Principal</div>
                      <strong style={{ fontSize: '0.88rem' }}>{inst360Data?.institution?.principal_name}</strong>
                    </div>
                    <div className="case-box">
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Risk Rating</div>
                      <strong style={{ fontSize: '0.88rem', color: inst360Data?.institution?.risk_level === 'High' ? 'var(--status-red)' : 'var(--text-primary)' }}>
                        {inst360Data?.institution?.risk_level}
                      </strong>
                    </div>
                  </div>

                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-primary)' }}>
                    Cross-Bureau Cases & Regulatory Actions ({inst360Data?.cases?.length || 0})
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                    {inst360Data?.cases?.map((c: any) => (
                      <div key={c.id} className="case-box" style={{ borderLeft: '3px solid var(--brand-blue)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <div>
                            <span className="brand-tag">{c.bureau_name}</span>{' '}
                            <strong style={{ fontSize: '0.88rem' }}>{c.id}</strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                              Received {c.received_days_ago} days ago
                            </span>
                          </div>
                          <span className={`status-badge ${
                            c.status === 'Disposed' ? 'badge-green' :
                            c.status === 'Escalated' ? 'badge-purple' : 'badge-amber'
                          }`}>
                            {c.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>{c.category_name}: {c.summary}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Last Action: {c.last_action}
                        </div>
                      </div>
                    ))}
                  </div>

                  {inst360Data?.overlaps?.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '8px', color: 'var(--status-red)' }}>
                        Active Overlap Alerts on this Institution ({inst360Data.overlaps.length})
                      </h4>
                      {inst360Data.overlaps.map((ovr: any) => (
                        <div key={ovr.alert_id} className="explain-box">
                          <strong>{ovr.badge}</strong> &bull; Score: {Math.round(ovr.score * 100)}%
                          <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                            Between {ovr.case_a.bureau_name} ({ovr.case_a.id}) and {ovr.case_b.bureau_name} ({ovr.case_b.id})
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setActiveInstitutionId(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
