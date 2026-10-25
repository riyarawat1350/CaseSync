import { useState } from 'react';
import { 
  Search, Plus, ArrowRight, 
  Send, User, X
} from 'lucide-react';
import type { CaseItem, Persona } from '../types';
import { api } from '../api';

interface CasesTrackerViewProps {
  cases: CaseItem[];
  currentPersona: Persona;
  onRefresh: () => void;
  lang: 'en' | 'hi';
}

export const CasesTrackerView: React.FC<CasesTrackerViewProps> = ({
  cases,
  currentPersona,
  onRefresh,
  lang
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBureau, setSelectedBureau] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');

  const [activeCase, setActiveCase] = useState<CaseItem | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  // Case action form state
  const [actionType, setActionType] = useState('Scrutiny Completed');
  const [actionRemarks, setActionRemarks] = useState('');
  const [newStatus, setNewStatus] = useState('Under Process');

  // Transfer modal state
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferTarget, setTransferTarget] = useState('RO');
  const [transferReason, setTransferReason] = useState('');

  // Escalate modal state
  const [showEscalate, setShowEscalate] = useState(false);
  const [escalateTarget, setEscalateTarget] = useState('Advisor (Regulation)');
  const [escalateReason, setEscalateReason] = useState('');

  // New Case Intake state
  const [newInstitutionName, setNewInstitutionName] = useState('');
  const [newCategory, setNewCategory] = useState('faculty_salary');
  const [newSummary, setNewSummary] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newComplainant] = useState('Student Grievance');
  const [newBureau, setNewBureau] = useState('PGRC');
  const [submitting, setSubmitting] = useState(false);

  // Filter cases
  const filteredCases = cases.filter((c) => {
    if (selectedBureau !== 'all' && c.bureau_code.toLowerCase() !== selectedBureau.toLowerCase()) return false;
    if (selectedStatus !== 'all' && c.status.toLowerCase() !== selectedStatus.toLowerCase()) return false;
    if (selectedPriority !== 'all' && c.priority.toLowerCase() !== selectedPriority.toLowerCase()) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match = (
        c.id.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q) ||
        c.submitted_name.toLowerCase().includes(q) ||
        (c.institution_name && c.institution_name.toLowerCase().includes(q)) ||
        (c.aicte_permanent_id && c.aicte_permanent_id.toLowerCase().includes(q))
      );
      if (!match) return false;
    }
    return true;
  });

  const handleAddAction = async () => {
    if (!activeCase || !actionRemarks.trim()) return;
    setSubmitting(true);
    try {
      await api.addCaseAction(activeCase.id, {
        user_name: currentPersona.name,
        bureau: currentPersona.bureau,
        action_type: actionType,
        remarks: actionRemarks,
        new_status: newStatus
      });
      setActionRemarks('');
      onRefresh();
      const updated = await api.getCaseDetail(activeCase.id);
      setActiveCase(updated);
      alert('Action logged successfully in immutable audit timeline.');
    } catch (err) {
      console.error(err);
      alert('Failed to log action');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransfer = async () => {
    if (!activeCase || !transferReason.trim()) return;
    setSubmitting(true);
    try {
      await api.transferCase(activeCase.id, {
        user_name: currentPersona.name,
        from_bureau: activeCase.bureau_code,
        to_bureau: transferTarget,
        reason: transferReason
      });
      setShowTransfer(false);
      setTransferReason('');
      onRefresh();
      const updated = await api.getCaseDetail(activeCase.id);
      setActiveCase(updated);
      alert(`Case successfully transferred to ${transferTarget}.`);
    } catch (err) {
      console.error(err);
      alert('Failed to transfer case');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEscalate = async () => {
    if (!activeCase || !escalateReason.trim()) return;
    setSubmitting(true);
    try {
      await api.escalateCase(activeCase.id, {
        user_name: currentPersona.name,
        bureau: currentPersona.bureau,
        target_authority: escalateTarget,
        justification: escalateReason
      });
      setShowEscalate(false);
      setEscalateReason('');
      onRefresh();
      const updated = await api.getCaseDetail(activeCase.id);
      setActiveCase(updated);
      alert(`Case successfully escalated to ${escalateTarget}.`);
    } catch (err) {
      console.error(err);
      alert('Failed to escalate case');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateNewCase = async () => {
    if (!newInstitutionName.trim() || !newSummary.trim()) {
      alert('Please fill out institution name and summary');
      return;
    }
    setSubmitting(true);
    try {
      await api.createCase({
        submitted_name: newInstitutionName,
        category: newCategory,
        category_name: newCategory.replace('_', ' ').toUpperCase(),
        summary: newSummary,
        description: newDescription || newSummary,
        complainant_type: newComplainant,
        source_channel: 'CaseSync Unified Intake',
        bureau_code: newBureau,
        priority: 'Medium',
        sla_days: 30
      });
      setShowNewModal(false);
      setNewInstitutionName('');
      setNewSummary('');
      setNewDescription('');
      onRefresh();
      alert('New complaint registered. Hybrid Overlap Engine evaluated duplicate risk automatically!');
    } catch (err) {
      console.error(err);
      alert('Failed to register case');
    } finally {
      setSubmitting(false);
    }
  };

  const t = {
    title: lang === 'hi' ? 'एकीकृत शिकायत एवं मामला ट्रैकर' : 'Unified Complaint & Case Tracker',
    subtitle: lang === 'hi' 
      ? 'समस्त ब्यूरो/प्रकोष्ठों की शिकायतों की एकल-खिड़की स्थिति, इतिहास व SLA निगरानी' 
      : 'Single-window lifecycle tracking across Regulation Bureau, PGRC, Regional Offices and Legal Cell',
    registerNew: lang === 'hi' ? 'नई शिकायत दर्ज करें' : 'Register New Complaint',
    searchPlaceholder: lang === 'hi' ? 'केस आईडी, कॉलेज का नाम या स्थायी आईडी खोजें...' : 'Search Case ID, college alias, Permanent ID, or allegation keyword...',
    allBureaus: lang === 'hi' ? 'सभी ब्यूरो' : 'All Bureaus',
    allStatuses: lang === 'hi' ? 'सभी स्थितियाँ' : 'All Statuses',
    allPriorities: lang === 'hi' ? 'सभी प्राथमिकता' : 'All Priorities'
  };

  return (
    <div>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {t.title}
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            {t.subtitle}
          </p>
        </div>

        <button 
          className="btn-primary"
          onClick={() => setShowNewModal(true)}
        >
          <Plus size={16} /> {t.registerNew}
        </button>
      </div>

      {/* Filter Ribbon */}
      <div className="surface-card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '14px', alignItems: 'center' }}>
          {/* Search Box */}
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
                color: 'var(--text-primary)',
                fontSize: '0.86rem'
              }}
            />
          </div>

          {/* Bureau Filter */}
          <select 
            className="persona-select"
            value={selectedBureau}
            onChange={(e) => setSelectedBureau(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '9px 12px', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-secondary)'
            }}
          >
            <option value="all">{t.allBureaus}</option>
            <option value="RB">Regulation Bureau (RB)</option>
            <option value="PGRC">Grievance Redressal (PGRC)</option>
            <option value="RO">Regional Offices (RO)</option>
            <option value="LEGAL">Legal Cell</option>
          </select>

          {/* Status Filter */}
          <select 
            className="persona-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '9px 12px', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-secondary)'
            }}
          >
            <option value="all">{t.allStatuses}</option>
            <option value="Received">Received</option>
            <option value="Under Scrutiny">Under Scrutiny</option>
            <option value="Under Process">Under Process</option>
            <option value="Action Initiated">Action Initiated</option>
            <option value="Pending (Awaiting Input)">Pending (Awaiting Input)</option>
            <option value="Transferred">Transferred</option>
            <option value="Escalated">Escalated</option>
            <option value="Disposed">Disposed</option>
          </select>

          {/* Priority Filter */}
          <select 
            className="persona-select"
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '9px 12px', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-secondary)'
            }}
          >
            <option value="all">{t.allPriorities}</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Case Table */}
      <div className="surface-card" style={{ padding: '0' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Case ID & Source</th>
                <th>Resolved Institution</th>
                <th>Bureau & Officer</th>
                <th>Category & Allegation</th>
                <th>Status</th>
                <th>SLA Countdown</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((c) => (
                <tr key={c.id}>
                  {/* Case ID */}
                  <td>
                    <strong style={{ color: 'var(--brand-blue)' }}>{c.id}</strong>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      Ref: {c.source_ref_no}
                    </div>
                  </td>

                  {/* Institution */}
                  <td>
                    <strong>{c.institution_name}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <em>Reported: "{c.submitted_name}"</em>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      ID: {c.aicte_permanent_id}
                    </div>
                  </td>

                  {/* Bureau */}
                  <td>
                    <span className="brand-tag">{c.bureau_name}</span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {c.assigned_officer}
                    </div>
                  </td>

                  {/* Category & Summary */}
                  <td style={{ maxWidth: '280px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>{c.category_name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.summary}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td>
                    <span className={`status-badge ${
                      c.status === 'Disposed' ? 'badge-green' :
                      c.status === 'Escalated' ? 'badge-purple' :
                      c.status === 'Action Initiated' ? 'badge-red' :
                      c.status === 'Transferred' ? 'badge-blue' : 'badge-amber'
                    }`}>
                      {c.status}
                    </span>
                  </td>

                  {/* SLA Tracker */}
                  <td style={{ minWidth: '150px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: c.sla_severity === 'red' ? 'var(--status-red)' : 'var(--text-secondary)', marginBottom: '4px' }}>
                      {c.sla_label}
                    </div>
                    <div className="progress-track" style={{ height: '6px' }}>
                      <div 
                        className="progress-fill" 
                        style={{ 
                          width: `${Math.min(100, c.pct_elapsed || 0)}%`,
                          background: c.sla_severity === 'red' ? 'var(--status-red)' :
                                      c.sla_severity === 'amber' ? 'var(--status-amber)' : 'var(--status-green)'
                        }}
                      />
                    </div>
                  </td>

                  {/* Action Link */}
                  <td>
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                      onClick={() => setActiveCase(c)}
                    >
                      Inspect <ArrowRight size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case Details Drawer / Modal */}
      {activeCase && (
        <div className="modal-overlay" onClick={() => setActiveCase(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="brand-tag">{activeCase.bureau_name}</span>
                  <strong style={{ fontSize: '1.15rem' }}>{activeCase.id}</strong>
                  <span className={`status-badge ${
                    activeCase.status === 'Disposed' ? 'badge-green' :
                    activeCase.status === 'Escalated' ? 'badge-purple' : 'badge-amber'
                  }`}>
                    {activeCase.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Source: {activeCase.source_channel} &bull; Ref: {activeCase.source_ref_no}
                </div>
              </div>

              <button className="icon-btn" onClick={() => setActiveCase(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* Institution Identity Card */}
              <div className="case-box" style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Resolved Institution Master Match
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 800, marginTop: '2px' }}>
                  {activeCase.institution_name}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  AICTE Permanent ID: <code style={{ fontFamily: 'var(--font-mono)' }}>{activeCase.aicte_permanent_id}</code> &bull; Region: {(activeCase as any).region || 'Regional'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Original Name on Complaint Document: <em>"{activeCase.submitted_name}"</em>
                </div>
              </div>

              {/* Allegation Summary */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.86rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Allegation Summary & Complainant
                </h4>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '6px' }}>
                  {activeCase.category_name}: {activeCase.summary}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {activeCase.description}
                </p>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={14} /> Complainant: <strong>{activeCase.complainant_type}</strong> (DPDP Compliant Masking)
                </div>
              </div>

              {/* SLA Timeline Status */}
              <div style={{ 
                background: 'var(--bg-secondary)', 
                padding: '12px 16px', 
                borderRadius: 'var(--radius-md)', 
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SLA Timeline Metric</div>
                  <strong style={{ fontSize: '0.88rem', color: activeCase.sla_severity === 'red' ? 'var(--status-red)' : 'var(--text-primary)' }}>
                    {activeCase.sla_label}
                  </strong>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <div>Received: {activeCase.received_date}</div>
                  <div>SLA Due: {activeCase.due_date}</div>
                </div>
              </div>

              {/* Action History Timeline */}
              <h4 style={{ fontSize: '0.86rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Immutable Action History Timeline (Audit Trail)
              </h4>
              <div className="timeline-container">
                {activeCase.actions_history?.map((act, idx) => (
                  <div key={idx} className="timeline-step">
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        <strong>{act.action} by {act.by} ({act.bureau})</strong>
                        <span>{act.timestamp}</span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {act.remarks}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Toolbar */}
              <div style={{ 
                background: 'var(--bg-secondary)', 
                padding: '16px', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid var(--border-subtle)',
                marginTop: '16px'
              }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, marginBottom: '8px' }}>
                  Execute Official Action as {currentPersona.name} ({currentPersona.bureau})
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Action Type
                    </label>
                    <select 
                      className="persona-select" 
                      style={{ width: '100%', background: 'var(--bg-surface)', padding: '8px', border: '1px solid var(--border-subtle)' }}
                      value={actionType}
                      onChange={(e) => setActionType(e.target.value)}
                    >
                      <option value="Scrutiny Completed">Scrutiny Completed</option>
                      <option value="Notice Issued">Show Cause Notice Issued</option>
                      <option value="Inspection Ordered">Physical Inspection Ordered</option>
                      <option value="Hearing Scheduled">Joint Hearing Scheduled</option>
                      <option value="Compliance Verified">Compliance Verified</option>
                      <option value="Closed Satisfactory">Case Closed (Disposed)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Update Case Status
                    </label>
                    <select 
                      className="persona-select" 
                      style={{ width: '100%', background: 'var(--bg-surface)', padding: '8px', border: '1px solid var(--border-subtle)' }}
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                    >
                      <option value="Under Process">Under Process</option>
                      <option value="Action Initiated">Action Initiated</option>
                      <option value="Pending (Awaiting Input)">Pending (Awaiting Input)</option>
                      <option value="Disposed">Disposed</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Officer Order / Action Remarks
                  </label>
                  <input 
                    type="text"
                    placeholder="Enter detailed order notes or dispatch reference..."
                    value={actionRemarks}
                    onChange={(e) => setActionRemarks(e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '8px 12px', 
                      borderRadius: 'var(--radius-sm)', 
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-surface)',
                      fontSize: '0.84rem'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn-primary" 
                    onClick={handleAddAction}
                    disabled={submitting || !actionRemarks.trim()}
                  >
                    <Send size={14} /> Log Action
                  </button>

                  <button 
                    className="btn-secondary"
                    onClick={() => setShowTransfer(!showTransfer)}
                  >
                    Transfer Bureau
                  </button>

                  <button 
                    className="btn-secondary"
                    onClick={() => setShowEscalate(!showEscalate)}
                  >
                    Escalate
                  </button>
                </div>

                {/* Sub-Panel: Transfer */}
                {showTransfer && (
                  <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Transfer Case to Bureau:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '8px' }}>
                      <select 
                        className="persona-select" 
                        value={transferTarget}
                        onChange={(e) => setTransferTarget(e.target.value)}
                        style={{ padding: '6px', border: '1px solid var(--border-subtle)' }}
                      >
                        <option value="RB">Regulation Bureau (RB)</option>
                        <option value="PGRC">Public Grievance Cell (PGRC)</option>
                        <option value="RO">Regional Office (RO)</option>
                        <option value="LEGAL">Legal Cell</option>
                      </select>
                      <input 
                        type="text" 
                        placeholder="Jurisdiction transfer justification..."
                        value={transferReason}
                        onChange={(e) => setTransferReason(e.target.value)}
                        style={{ padding: '6px', fontSize: '0.8rem', border: '1px solid var(--border-subtle)' }}
                      />
                      <button className="btn-primary" onClick={handleTransfer} disabled={submitting}>
                        Confirm Transfer
                      </button>
                    </div>
                  </div>
                )}

                {/* Sub-Panel: Escalate */}
                {showEscalate && (
                  <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Escalate to Higher Authority:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '8px' }}>
                      <select 
                        className="persona-select" 
                        value={escalateTarget}
                        onChange={(e) => setEscalateTarget(e.target.value)}
                        style={{ padding: '6px', border: '1px solid var(--border-subtle)' }}
                      >
                        <option value="Advisor (Regulation)">Advisor (Regulation)</option>
                        <option value="Member Secretary">Member Secretary</option>
                        <option value="Competent Authority (Chairman)">Chairman (Competent Authority)</option>
                      </select>
                      <input 
                        type="text" 
                        placeholder="Urgency / statutory escalation reason..."
                        value={escalateReason}
                        onChange={(e) => setEscalateReason(e.target.value)}
                        style={{ padding: '6px', fontSize: '0.8rem', border: '1px solid var(--border-subtle)' }}
                      />
                      <button className="btn-primary" onClick={handleEscalate} disabled={submitting}>
                        Confirm Escalation
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setActiveCase(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Complaint Intake Modal */}
      {showNewModal && (
        <div className="modal-overlay" onClick={() => setShowNewModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                Register New Institution Complaint (Multi-Channel Intake)
              </h3>
              <button className="icon-btn" onClick={() => setShowNewModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Upon submission, CaseSync will automatically resolve the institution identity and execute real-time cross-bureau overlap detection.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Institution Name (as recorded on complaint)
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. A.B.C Inst of Engg & Tech, or Ambedkar College of Tech"
                    value={newInstitutionName}
                    onChange={(e) => setNewInstitutionName(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Receiving Bureau
                    </label>
                    <select 
                      className="persona-select" 
                      style={{ width: '100%', padding: '9px', border: '1px solid var(--border-subtle)' }}
                      value={newBureau}
                      onChange={(e) => setNewBureau(e.target.value)}
                    >
                      <option value="PGRC">Public Grievance Redressal Cell (PGRC)</option>
                      <option value="RB">Regulation Bureau (RB)</option>
                      <option value="RO">Regional Office (AICTE)</option>
                      <option value="LEGAL">Legal Cell</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Complaint Category
                    </label>
                    <select 
                      className="persona-select" 
                      style={{ width: '100%', padding: '9px', border: '1px solid var(--border-subtle)' }}
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    >
                      <option value="faculty_salary">Faculty Salary Non-Payment</option>
                      <option value="capitation_fee">Capitation Fee / Admission Fraud</option>
                      <option value="compliance_deficiency">Norms & Approval Deficiency</option>
                      <option value="infrastructure_deficiency">Infrastructure / Lab Deficit</option>
                      <option value="ragging">Anti-Ragging Violation</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Summary of Allegation
                  </label>
                  <input 
                    type="text"
                    placeholder="Brief 1-line summary..."
                    value={newSummary}
                    onChange={(e) => setNewSummary(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Full Description / Evidence Details
                  </label>
                  <textarea 
                    rows={4}
                    placeholder="Provide full text of the complaint received..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-sans)', fontSize: '0.84rem' }}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowNewModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleCreateNewCase} disabled={submitting}>
                Submit to CaseSync Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
