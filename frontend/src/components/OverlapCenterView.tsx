import React, { useState } from 'react';
import { 
  GitMerge, AlertTriangle, CheckCircle, 
  MessageSquare, Send, Link as LinkIcon, 
  Copy, ShieldCheck, X
} from 'lucide-react';
import type { OverlapAlert, Persona } from '../types';
import { api } from '../api';

interface OverlapCenterViewProps {
  overlaps: OverlapAlert[];
  currentPersona: Persona;
  onRefresh: () => void;
  selectedOverlap: OverlapAlert | null;
  setSelectedOverlap: (o: OverlapAlert | null) => void;
  lang: 'en' | 'hi';
}

export const OverlapCenterView: React.FC<OverlapCenterViewProps> = ({
  overlaps,
  currentPersona,
  onRefresh,
  selectedOverlap,
  setSelectedOverlap,
  lang
}) => {
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'HIGH' | 'MEDIUM'>('ALL');
  const [coordMessage, setCoordMessage] = useState('');
  const [selectedLeadBureau, setSelectedLeadBureau] = useState('Regulation Bureau (RB)');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredOverlaps = overlaps.filter((o) => {
    if (filterLevel === 'ALL') return true;
    return o.level === filterLevel;
  });

  const handleSendCoordination = async (actionType?: string) => {
    if (!selectedOverlap) return;
    setSubmitting(true);
    try {
      await api.coordinateOverlap(selectedOverlap.alert_id, {
        author: currentPersona.name,
        role: currentPersona.role,
        message: coordMessage || `Updated coordination decision: ${actionType || 'Note Added'}`,
        action: actionType,
        lead_bureau: selectedLeadBureau,
        decision_notes: decisionNotes || coordMessage
      });
      setCoordMessage('');
      setDecisionNotes('');
      onRefresh();
      const updated = await api.getOverlaps();
      const match = updated.find((u) => u.alert_id === selectedOverlap.alert_id);
      if (match) setSelectedOverlap(match);
    } catch (err) {
      console.error(err);
      alert('Failed to send coordination update');
    } finally {
      setSubmitting(false);
    }
  };

  const t = {
    title: lang === 'hi' ? 'क्रॉस-ब्यूरो ओवरलैप केंद्र' : 'Cross-Bureau Overlap Detection Center',
    subtitle: lang === 'hi' 
      ? 'विभिन्न ब्यूरो में एक ही संस्थान पर चल रहे समानांतर मामलों की स्वचालित पहचान व समन्वय' 
      : 'Automated detection of parallel complaints across Bureaus on the same institution with explainable AI scoring',
    all: lang === 'hi' ? 'सभी ओवरलैप' : 'All Overlaps',
    highOnly: lang === 'hi' ? 'उच्च प्राथमिकता (≥ 75%)' : 'High Overlap (≥ 75%)',
    mediumOnly: lang === 'hi' ? 'मध्यम समीक्षा (50–74%)' : 'Medium Overlap (50–74%)',
    openCoordModal: lang === 'hi' ? 'समन्वय कक्ष खोलें' : 'Open Coordination Thread',
    resolved: lang === 'hi' ? 'समन्वय पूर्ण' : 'Coordinated',
    whyFlagged: lang === 'hi' ? 'पहचान के कारण (Explainability Signals)' : 'Explainability Signals (Why Flagged)',
    leadBureau: lang === 'hi' ? 'प्रस्तावित लीड ब्यूरो' : 'Recommended Lead Bureau'
  };

  return (
    <div>
      {/* Header bar with filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {t.title}
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            {t.subtitle}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`btn-secondary ${filterLevel === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterLevel('ALL')}
          >
            {t.all} ({overlaps.length})
          </button>
          <button 
            className={`btn-secondary ${filterLevel === 'HIGH' ? 'active' : ''}`}
            onClick={() => setFilterLevel('HIGH')}
          >
            {t.highOnly} ({overlaps.filter(o => o.level === 'HIGH').length})
          </button>
          <button 
            className={`btn-secondary ${filterLevel === 'MEDIUM' ? 'active' : ''}`}
            onClick={() => setFilterLevel('MEDIUM')}
          >
            {t.mediumOnly} ({overlaps.filter(o => o.level === 'MEDIUM').length})
          </button>
        </div>
      </div>

      {/* Overlaps List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {filteredOverlaps.length === 0 ? (
          <div className="surface-card" style={{ textAlign: 'center', padding: '40px' }}>
            <CheckCircle size={36} color="var(--status-green)" style={{ margin: '0 auto 12px' }} />
            <h3>No Overlaps in this filter category</h3>
            <p style={{ color: 'var(--text-muted)' }}>All registered bureau cases are operating under distinct institutions.</p>
          </div>
        ) : (
          filteredOverlaps.map((overlap) => (
            <div 
              key={overlap.alert_id} 
              className={`overlap-card level-${overlap.level.toLowerCase()}`}
            >
              {/* Header */}
              <div className="overlap-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span className={`status-badge badge-${overlap.badge_color}`}>
                      {overlap.badge}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      ID: {overlap.alert_id}
                    </span>
                    {overlap.coordination_status !== 'PENDING_COORDINATION' && (
                      <span className="status-badge badge-green">
                        <ShieldCheck size={12} /> {overlap.coordination_status}
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                    {overlap.institution_name}
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    AICTE Permanent ID: {overlap.aicte_permanent_id}
                  </div>
                </div>

                <div className={`overlap-score-pill score-${overlap.badge_color}`}>
                  <GitMerge size={16} />
                  <span>{Math.round(overlap.score * 100)}% OVERLAP</span>
                </div>
              </div>

              {/* Side by Side Cases Comparison */}
              <div className="cases-comparison-grid">
                {/* Case A */}
                <div className="case-box">
                  <div className="case-box-header">
                    <span className="case-bureau-title">{overlap.case_a.bureau_name}</span>
                    <span className="status-badge badge-blue">{overlap.case_a.id}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Originating Name: <em>"{overlap.case_a.submitted_name}"</em>
                  </div>
                  <strong style={{ fontSize: '0.9rem', display: 'block', marginBottom: '6px' }}>
                    {overlap.case_a.category_name}
                  </strong>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    {overlap.case_a.summary}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Status: <strong>{overlap.case_a.status}</strong></span>
                    <span>Officer: {overlap.case_a.assigned_officer}</span>
                  </div>
                </div>

                {/* Case B */}
                <div className="case-box">
                  <div className="case-box-header">
                    <span className="case-bureau-title">{overlap.case_b.bureau_name}</span>
                    <span className="status-badge badge-blue">{overlap.case_b.id}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Originating Name: <em>"{overlap.case_b.submitted_name}"</em>
                  </div>
                  <strong style={{ fontSize: '0.9rem', display: 'block', marginBottom: '6px' }}>
                    {overlap.case_b.category_name}
                  </strong>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    {overlap.case_b.summary}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Status: <strong>{overlap.case_b.status}</strong></span>
                    <span>Officer: {overlap.case_b.assigned_officer}</span>
                  </div>
                </div>
              </div>

              {/* Explainability Breakdown */}
              <div className="explain-box">
                <div className="explain-title">
                  <AlertTriangle size={14} color="var(--brand-accent)" />
                  {t.whyFlagged}
                </div>
                <ul className="reasons-list">
                  {overlap.reasons.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>

                {/* Signals Badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                  <span className="brand-tag">
                    Category Match: {Math.round(overlap.breakdown.category_similarity * 100)}%
                  </span>
                  <span className="brand-tag">
                    Text / Allegation Match: {Math.round(overlap.breakdown.text_similarity * 100)}%
                  </span>
                  <span className="brand-tag">
                    Time Window: {overlap.time_window_days} Days Apart
                  </span>
                  {overlap.shared_keywords.length > 0 && (
                    <span className="brand-tag">
                      Keywords: {overlap.shared_keywords.join(', ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Recommended Action & Trigger Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <strong>{t.leadBureau}:</strong> {overlap.suggested_lead_bureau} &bull;{' '}
                  <span style={{ color: 'var(--text-muted)' }}>{overlap.lead_reason}</span>
                </div>

                <button 
                  className="btn-primary"
                  onClick={() => setSelectedOverlap(overlap)}
                >
                  <MessageSquare size={16} />
                  {t.openCoordModal}
                  {overlap.thread.length > 1 && (
                    <span style={{ background: 'rgba(255,255,255,0.25)', padding: '2px 6px', borderRadius: '10px', fontSize: '0.72rem' }}>
                      {overlap.thread.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Coordination Dialog Modal */}
      {selectedOverlap && (
        <div className="modal-overlay" onClick={() => setSelectedOverlap(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`status-badge badge-${selectedOverlap.badge_color}`}>
                    {Math.round(selectedOverlap.score * 100)}% Overlap
                  </span>
                  <strong style={{ fontSize: '1.1rem' }}>{selectedOverlap.institution_name}</strong>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Cross-Bureau Joint Coordination Desk &bull; {selectedOverlap.case_a.bureau_name} ({selectedOverlap.case_a.id}) &harr; {selectedOverlap.case_b.bureau_name} ({selectedOverlap.case_b.id})
                </div>
              </div>
              <button 
                className="icon-btn" 
                onClick={() => setSelectedOverlap(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {selectedOverlap.decision && (
                <div style={{ 
                  background: 'var(--status-green-bg)', 
                  border: '1px solid rgba(16, 185, 129, 0.4)', 
                  padding: '12px 16px', 
                  borderRadius: 'var(--radius-md)', 
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <ShieldCheck size={20} color="var(--status-green)" />
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--status-green)' }}>Recorded Coordination Decision:</strong>
                    <div style={{ fontSize: '0.82rem' }}>{selectedOverlap.decision}</div>
                  </div>
                </div>
              )}

              <h4 style={{ fontSize: '0.9rem', marginBottom: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Immutable Coordination Audit Trail
              </h4>
              <div className="thread-container">
                {selectedOverlap.thread.map((msg, i) => (
                  <div 
                    key={i} 
                    className={`thread-message ${msg.role === 'System AI' ? 'system-ai' : ''}`}
                  >
                    <div className="thread-meta">
                      <strong>{msg.author} ({msg.role})</strong>
                      <span>{msg.timestamp}</span>
                    </div>
                    <div className="thread-text">{msg.message}</div>
                  </div>
                ))}
              </div>

              {/* Action Toolbar */}
              <div style={{ 
                background: 'var(--bg-secondary)', 
                borderRadius: 'var(--radius-md)', 
                padding: '14px', 
                border: '1px solid var(--border-subtle)',
                marginTop: '12px'
              }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '8px' }}>
                  Execute Joint Decision as {currentPersona.name} ({currentPersona.bureau}):
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Designate Lead Bureau
                    </label>
                    <select 
                      className="persona-select" 
                      style={{ 
                        width: '100%', 
                        background: 'var(--bg-surface)', 
                        padding: '8px', 
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)'
                      }}
                      value={selectedLeadBureau}
                      onChange={(e) => setSelectedLeadBureau(e.target.value)}
                    >
                      <option value="Regulation Bureau (RB)">Regulation Bureau (RB)</option>
                      <option value="Public Grievance Redressal Cell (PGRC)">Public Grievance Redressal Cell (PGRC)</option>
                      <option value="Regional Office (AICTE)">Regional Office (AICTE)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Decision Summary / Order Remarks
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. RB to lead regulatory action; PGRC to align complaint."
                      value={decisionNotes}
                      onChange={(e) => setDecisionNotes(e.target.value)}
                      style={{ 
                        width: '100%', 
                        padding: '8px', 
                        borderRadius: 'var(--radius-sm)', 
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        fontSize: '0.82rem'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button 
                    className="btn-primary" 
                    style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                    onClick={() => handleSendCoordination('DESIGNATE_LEAD')}
                    disabled={submitting}
                  >
                    <ShieldCheck size={14} /> Designate Lead Bureau
                  </button>

                  <button 
                    className="btn-secondary" 
                    style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                    onClick={() => handleSendCoordination('LINK_CASES')}
                    disabled={submitting}
                  >
                    <LinkIcon size={14} /> Link Cases as Parallel
                  </button>

                  <button 
                    className="btn-secondary" 
                    style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                    onClick={() => handleSendCoordination('MARK_DUPLICATE')}
                    disabled={submitting}
                  >
                    <Copy size={14} /> Mark as Duplicate (Merge)
                  </button>

                  <button 
                    className="btn-secondary" 
                    style={{ fontSize: '0.78rem', padding: '6px 12px', color: 'var(--status-red)' }}
                    onClick={() => handleSendCoordination('DISMISS')}
                    disabled={submitting}
                  >
                    <X size={14} /> Not an Overlap (Dismiss)
                  </button>
                </div>
              </div>

              {/* Reply message input */}
              <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                <input 
                  type="text"
                  placeholder="Type an official coordination note to the other Bureau officer..."
                  value={coordMessage}
                  onChange={(e) => setCoordMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendCoordination()}
                  style={{ 
                    flex: 1, 
                    padding: '10px 14px', 
                    borderRadius: 'var(--radius-md)', 
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: '0.86rem'
                  }}
                />
                <button 
                  className="btn-primary" 
                  onClick={() => handleSendCoordination()}
                  disabled={submitting || !coordMessage.trim()}
                >
                  <Send size={16} /> Send
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setSelectedOverlap(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
