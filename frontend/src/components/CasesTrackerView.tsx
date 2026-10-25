import { useState } from 'react';
import { 
  Search, Plus, ArrowRight, Send, User, X, 
  Upload, FileText, Link as LinkIcon, Copy, 
  Clock, RotateCcw
} from 'lucide-react';
import type { CaseItem, Persona, SupportingDocumentItem } from '../types';
import { api } from '../api';

interface CasesTrackerViewProps {
  cases: CaseItem[];
  currentPersona: Persona;
  onRefresh: () => void;
  lang: 'en' | 'hi';
}

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'faculty_salary', label: 'Faculty & Staff Salary Delays' },
  { value: 'unapproved_courses', label: 'Unapproved Courses & Intake Violations' },
  { value: 'capitation_fee', label: 'Capitation Fee & Admission Irregularity' },
  { value: 'fee_refund', label: 'Fee Refund Denial on Cancellation' },
  { value: 'court_litigation', label: 'Court Litigation / Writ Petitions' },
  { value: 'approval_eoa_dispute', label: 'Extension of Approval (EoA) / Norms' },
  { value: 'ragging_harassment', label: 'Anti-Ragging / Student Grievance' },
  { value: 'infrastructure_deficiency', label: 'Infrastructure & Lab Deficit' }
];

const REGION_OPTIONS = [
  { value: 'all', label: 'All Regions' },
  { value: 'Central', label: 'Central (Bhopal/Raipur/Ahmedabad)' },
  { value: 'Eastern', label: 'Eastern (Kolkata/Bhubaneswar/Patna)' },
  { value: 'Northern', label: 'Northern (Kanpur/Lucknow/Dehradun)' },
  { value: 'North-West', label: 'North-West (Chandigarh/Delhi/Jaipur)' },
  { value: 'Southern', label: 'Southern (Chennai/Kerala)' },
  { value: 'South-Central', label: 'South-Central (Hyderabad/AP)' },
  { value: 'South-Western', label: 'South-Western (Bengaluru)' },
  { value: 'Western', label: 'Western (Mumbai/Pune/Goa)' }
];

export const CasesTrackerView: React.FC<CasesTrackerViewProps> = ({
  cases,
  currentPersona,
  onRefresh,
  lang
}) => {
  // Search & Filter state (Feature 3)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBureau, setSelectedBureau] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [activeCase, setActiveCase] = useState<CaseItem | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  // Case action form state (Feature 4)
  const [actionType, setActionType] = useState('Scrutiny Completed');
  const [actionRemarks, setActionRemarks] = useState('');
  const [newStatus, setNewStatus] = useState('Under Process');

  // Sub-Panels in Drawer
  const [activeSubPanel, setActiveSubPanel] = useState<'none' | 'transfer' | 'escalate' | 'link' | 'duplicate' | 'upload'>('none');

  // Transfer state
  const [transferTarget, setTransferTarget] = useState('RO');
  const [transferReason, setTransferReason] = useState('');

  // Escalate state
  const [escalateTarget, setEscalateTarget] = useState('Advisor (Regulation)');
  const [escalateReason, setEscalateReason] = useState('');

  // Link state
  const [linkTargetId, setLinkTargetId] = useState('');
  const [linkReason, setLinkReason] = useState('Parallel cross-bureau inquiry');

  // Duplicate state
  const [duplicatePrimaryId, setDuplicatePrimaryId] = useState('');
  const [duplicateReason, setDuplicateReason] = useState('Duplicate complaint received on identical matter');

  // Document upload state
  const [docName, setDocName] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);

  // New Case Intake state
  const [newInstitutionName, setNewInstitutionName] = useState('');
  const [newCategory, setNewCategory] = useState('faculty_salary');
  const [newSummary, setNewSummary] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newComplainant] = useState('Student Grievance');
  const [newBureau, setNewBureau] = useState('PGRC');
  const [submitting, setSubmitting] = useState(false);

  // Filter cases logic (combines search + 5 filters + date range)
  const filteredCases = cases.filter((c) => {
    if (selectedBureau !== 'all' && c.bureau_code.toLowerCase() !== selectedBureau.toLowerCase()) return false;
    if (selectedRegion !== 'all' && c.region && c.region.toLowerCase() !== selectedRegion.toLowerCase()) return false;
    if (selectedCategory !== 'all' && c.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;
    if (selectedStatus !== 'all' && c.status.toLowerCase() !== selectedStatus.toLowerCase()) return false;
    if (selectedPriority !== 'all' && c.priority.toLowerCase() !== selectedPriority.toLowerCase()) return false;

    // Date range filter
    if (fromDate && c.received_date && c.received_date < fromDate) return false;
    if (toDate && c.received_date && c.received_date > toDate) return false;

    // Search by Institution Name, AICTE Permanent ID, Case ID, Summary, Aliases
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match = (
        c.id.toLowerCase().includes(q) ||
        (c.source_ref_no && c.source_ref_no.toLowerCase().includes(q)) ||
        (c.summary && c.summary.toLowerCase().includes(q)) ||
        (c.submitted_name && c.submitted_name.toLowerCase().includes(q)) ||
        (c.institution_name && c.institution_name.toLowerCase().includes(q)) ||
        (c.aicte_permanent_id && c.aicte_permanent_id.toLowerCase().includes(q)) ||
        (c.assigned_officer && c.assigned_officer.toLowerCase().includes(q)) ||
        (c.category_name && c.category_name.toLowerCase().includes(q))
      );
      if (!match) return false;
    }
    return true;
  });

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedBureau('all');
    setSelectedRegion('all');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setSelectedPriority('all');
    setFromDate('');
    setToDate('');
  };

  const hasActiveFilters = Boolean(
    searchTerm || selectedBureau !== 'all' || selectedRegion !== 'all' || 
    selectedCategory !== 'all' || selectedStatus !== 'all' || 
    selectedPriority !== 'all' || fromDate || toDate
  );

  // Workflow Handlers (Feature 4)
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
      setActiveSubPanel('none');
      setTransferReason('');
      onRefresh();
      const updated = await api.getCaseDetail(activeCase.id);
      setActiveCase(updated);
      alert(`Case successfully transferred to ${transferTarget}. Audit trail recorded.`);
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
      setActiveSubPanel('none');
      setEscalateReason('');
      onRefresh();
      const updated = await api.getCaseDetail(activeCase.id);
      setActiveCase(updated);
      alert(`Case successfully escalated to ${escalateTarget}. Alert raised.`);
    } catch (err) {
      console.error(err);
      alert('Failed to escalate case');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLinkCase = async () => {
    if (!activeCase || !linkTargetId.trim()) return;
    setSubmitting(true);
    try {
      await api.linkCases(activeCase.id, {
        user_name: currentPersona.name,
        bureau: currentPersona.bureau,
        target_case_id: linkTargetId.trim(),
        reason: linkReason
      });
      setActiveSubPanel('none');
      setLinkTargetId('');
      onRefresh();
      const updated = await api.getCaseDetail(activeCase.id);
      setActiveCase(updated);
      alert(`Case successfully linked to ${linkTargetId}. Visible on both case records.`);
    } catch (err) {
      console.error(err);
      alert('Failed to link cases');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkDuplicate = async () => {
    if (!activeCase || !duplicatePrimaryId.trim()) return;
    setSubmitting(true);
    try {
      await api.markDuplicate(activeCase.id, {
        user_name: currentPersona.name,
        bureau: currentPersona.bureau,
        primary_case_id: duplicatePrimaryId.trim(),
        reason: duplicateReason
      });
      setActiveSubPanel('none');
      setDuplicatePrimaryId('');
      onRefresh();
      const updated = await api.getCaseDetail(activeCase.id);
      setActiveCase(updated);
      alert(`Case marked as duplicate of ${duplicatePrimaryId}. Investigation consolidated.`);
    } catch (err) {
      console.error(err);
      alert('Failed to mark duplicate');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadDocument = async () => {
    if (!activeCase || (!docName.trim() && !docFile)) {
      alert('Please provide a document title or select a file.');
      return;
    }
    setSubmitting(true);
    try {
      const fileName = docName.trim() || (docFile ? docFile.name : `Evidence_${Date.now()}.pdf`);
      const fileSize = docFile ? docFile.size : 340000;
      await api.uploadDocument(activeCase.id, {
        name: fileName,
        size: fileSize,
        uploader: currentPersona.name,
        bureau: currentPersona.bureau,
        file_type: docFile?.type || 'application/pdf'
      });
      setDocName('');
      setDocFile(null);
      setActiveSubPanel('none');
      onRefresh();
      const updated = await api.getCaseDetail(activeCase.id);
      setActiveCase(updated);
      alert('Supporting document uploaded and logged in immutable audit trail.');
    } catch (err) {
      console.error(err);
      alert('Failed to upload document');
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
        category_name: CATEGORY_OPTIONS.find(c => c.value === newCategory)?.label || newCategory,
        summary: newSummary,
        description: newDescription || newSummary,
        complainant_type: newComplainant,
        source_channel: 'Online Portal Intake',
        bureau_code: newBureau,
        priority: 'Medium'
      });
      setShowNewModal(false);
      setNewInstitutionName('');
      setNewSummary('');
      setNewDescription('');
      onRefresh();
      alert('New complaint registered. CaseSync resolved institution identity and evaluated cross-bureau overlap.');
    } catch (err) {
      console.error(err);
      alert('Failed to create case');
    } finally {
      setSubmitting(false);
    }
  };

  const t = {
    title: lang === 'hi' ? 'एकीकृत केस ट्रैकर' : 'Unified Cases Tracker & Audit Ledger',
    subtitle: lang === 'hi' 
      ? 'सभी AICTE ब्यूरो (विनियमन, पीजीआरसी, क्षेत्रीय कार्यालय व लीगल सेल) के मामलों की केंद्रीय सूची' 
      : 'Comprehensive lifecycle tracking across Regulation Bureau, PGRC, Regional Offices, and Legal Cell',
    searchPlaceholder: lang === 'hi' 
      ? 'संस्थान, Permanent ID, Case ID या शिकायत से खोजें...' 
      : 'Search by Institution Name, AICTE Permanent ID, Case ID, keywords...',
    newComplaint: lang === 'hi' ? 'नई शिकायत दर्ज करें' : 'Intake New Complaint',
    allBureaus: lang === 'hi' ? 'सभी ब्यूरो / सेल' : 'All Bureaus / Cells',
    allStatuses: lang === 'hi' ? 'सभी स्थितियाँ' : 'All Statuses',
    allPriorities: lang === 'hi' ? 'सभी प्राथमिकता' : 'All Priorities',
  };

  return (
    <div>
      {/* Header bar with primary action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {t.title}
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            {t.subtitle}
          </p>
        </div>

        <button className="btn-primary" onClick={() => setShowNewModal(true)}>
          <Plus size={16} /> {t.newComplaint}
        </button>
      </div>

      {/* Advanced Filter & Search Bar (Feature 3) */}
      <div className="surface-card" style={{ marginBottom: '16px', padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'center' }}>
          {/* Main Search Input */}
          <div style={{ position: 'relative', gridColumn: 'span 2' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="search-input"
              style={{ width: '100%', paddingLeft: '38px', paddingRight: '12px', height: '40px' }}
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Bureau Filter */}
          <select 
            className="persona-select"
            value={selectedBureau}
            onChange={(e) => setSelectedBureau(e.target.value)}
            style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}
          >
            <option value="all">{t.allBureaus}</option>
            <option value="RB">Regulation Bureau (RB)</option>
            <option value="PGRC">Public Grievance Redressal (PGRC)</option>
            <option value="RO">Regional Offices (RO)</option>
            <option value="LEGAL">Legal Cell</option>
            <option value="AB">Approval Bureau (AB)</option>
          </select>

          {/* Region Filter */}
          <select 
            className="persona-select"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}
          >
            {REGION_OPTIONS.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select 
            className="persona-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}
          >
            {CATEGORY_OPTIONS.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select 
            className="persona-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}
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
            <option value="Duplicate/Closed">Duplicate/Closed</option>
          </select>

          {/* Date Range: From */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '2px' }}>From Date</span>
            <input 
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{ width: '100%', height: '36px', padding: '0 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', fontSize: '0.8rem' }}
            />
          </div>

          {/* Date Range: To */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '2px' }}>To Date</span>
            <input 
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{ width: '100%', height: '36px', padding: '0 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', fontSize: '0.8rem' }}
            />
          </div>
        </div>

        {/* Active Filter Chips & Clear All */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Active Filters:
            </span>

            {searchTerm && (
              <span className="filter-chip">
                Search: "{searchTerm}"
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setSearchTerm('')} />
              </span>
            )}

            {selectedBureau !== 'all' && (
              <span className="filter-chip">
                Bureau: {selectedBureau}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setSelectedBureau('all')} />
              </span>
            )}

            {selectedRegion !== 'all' && (
              <span className="filter-chip">
                Region: {selectedRegion}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setSelectedRegion('all')} />
              </span>
            )}

            {selectedCategory !== 'all' && (
              <span className="filter-chip">
                Category: {CATEGORY_OPTIONS.find(c => c.value === selectedCategory)?.label || selectedCategory}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setSelectedCategory('all')} />
              </span>
            )}

            {selectedStatus !== 'all' && (
              <span className="filter-chip">
                Status: {selectedStatus}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setSelectedStatus('all')} />
              </span>
            )}

            {(fromDate || toDate) && (
              <span className="filter-chip">
                Date: {fromDate || 'Start'} → {toDate || 'End'}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => { setFromDate(''); setToDate(''); }} />
              </span>
            )}

            {!hasActiveFilters && (
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>None (Displaying all records)</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Showing {filteredCases.length} of {cases.length} cases
            </span>

            {hasActiveFilters && (
              <button 
                className="btn-secondary" 
                onClick={clearAllFilters}
                style={{ padding: '4px 10px', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <RotateCcw size={12} /> Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Case Table Displaying all 10 Required Fields (Feature 2) */}
      <div className="surface-card" style={{ padding: '0' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '160px' }}>1. Case ID & Dates</th>
                <th style={{ width: '220px' }}>2. Resolved Institution</th>
                <th style={{ width: '160px' }}>3. Bureau & Officer</th>
                <th style={{ width: '200px' }}>4. Category & Allegation</th>
                <th style={{ minWidth: '220px' }}>5. Last Action Taken</th>
                <th style={{ minWidth: '180px' }}>6. Next Action Required</th>
                <th style={{ width: '130px' }}>7. Status & SLA</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Inspect</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No complaint cases match your search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => (
                  <tr key={c.id}>
                    {/* 1. Unique Case ID & Dates */}
                    <td>
                      <strong style={{ color: 'var(--brand-blue)', fontFamily: 'var(--font-mono)', fontSize: '0.84rem' }}>
                        {c.id}
                      </strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Recd: <strong style={{ color: 'var(--text-primary)' }}>{c.received_date || 'N/A'}</strong>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Disposal: <strong>{c.expected_disposal_date || c.due_date || 'N/A'}</strong>
                      </div>
                    </td>

                    {/* 2. Resolved Institution */}
                    <td>
                      <strong style={{ fontSize: '0.84rem' }}>{c.institution_name}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        AICTE ID: {c.aicte_permanent_id || 'N/A'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--brand-navy)' }}>
                        Region: <strong>{c.region || 'Central'}</strong>
                      </div>
                    </td>

                    {/* 3. Presently Assigned Bureau/Cell & Officer */}
                    <td>
                      <span className="brand-tag" style={{ fontSize: '0.7rem' }}>{c.bureau_name}</span>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-primary)', marginTop: '4px', fontWeight: 600 }}>
                        {c.assigned_officer}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Ref: {c.source_ref_no}
                      </div>
                    </td>

                    {/* 4. Category & Allegation Summary */}
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                        {c.category_name}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}>
                        {c.summary}
                      </div>
                    </td>

                    {/* 5. Last Action Taken & Date of Last Action */}
                    <td>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {c.last_action}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={11} /> Date: <strong>{c.last_action_date || c.received_date}</strong>
                      </div>
                    </td>

                    {/* 6. Next Action Required */}
                    <td>
                      <div style={{ fontSize: '0.8rem', color: 'var(--brand-blue)', fontWeight: 600 }}>
                        {c.next_action || 'Pending officer evaluation'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Target: {c.expected_disposal_date || c.due_date}
                      </div>
                    </td>

                    {/* 7. Current Status & SLA Bar */}
                    <td>
                      <span className={`status-badge ${
                        c.status === 'Disposed' ? 'badge-green' :
                        c.status === 'Escalated' ? 'badge-purple' :
                        c.status === 'Action Initiated' ? 'badge-red' :
                        c.status === 'Transferred' ? 'badge-blue' : 'badge-amber'
                      }`}>
                        {c.status}
                      </span>
                      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: c.sla_severity === 'red' ? 'var(--status-red)' : 'var(--text-muted)', marginTop: '4px' }}>
                        {c.sla_label}
                      </div>
                      <div className="progress-track" style={{ height: '5px', marginTop: '2px' }}>
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

                    {/* 8. Inspect Action */}
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '6px 10px', fontSize: '0.74rem' }}
                        onClick={() => setActiveCase(c)}
                        title="View Full Case Details & Audit Workflow"
                      >
                        Inspect <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case Details Drawer / Modal with Workflow & Supporting Documents (Feature 2 & 4) */}
      {activeCase && (
        <div className="modal-overlay" onClick={() => setActiveCase(null)}>
          <div className="modal-container" style={{ maxWidth: '820px' }} onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="brand-tag">{activeCase.bureau_name}</span>
                  <strong style={{ fontSize: '1.2rem', fontFamily: 'var(--font-mono)' }}>{activeCase.id}</strong>
                  <span className={`status-badge ${
                    activeCase.status === 'Disposed' ? 'badge-green' :
                    activeCase.status === 'Escalated' ? 'badge-purple' : 'badge-amber'
                  }`}>
                    {activeCase.status}
                  </span>
                  {activeCase.is_duplicate && (
                    <span className="status-badge badge-blue">
                      Duplicate of {activeCase.duplicate_of_id}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Intake Channel: {activeCase.source_channel} &bull; Reference: {activeCase.source_ref_no}
                </div>
              </div>

              <button className="icon-btn" onClick={() => setActiveCase(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              {/* Mandatory 10 Case Fields Matrix (Feature 2) */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                gap: '10px', 
                background: 'var(--bg-secondary)', 
                padding: '14px', 
                borderRadius: 'var(--radius-md)', 
                marginBottom: '16px',
                border: '1px solid var(--border-subtle)'
              }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    1. Unique Case ID
                  </span>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--brand-blue)', fontFamily: 'var(--font-mono)' }}>
                    {activeCase.id}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    2. Date of Receipt
                  </span>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700 }}>
                    {activeCase.received_date || 'N/A'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    3. Category
                  </span>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700 }}>
                    {activeCase.category_name}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    4. Current Status
                  </span>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                    {activeCase.status}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    5. Assigned Bureau
                  </span>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700 }}>
                    {activeCase.bureau_name} ({activeCase.bureau_code})
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    6. Assigned Officer
                  </span>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700 }}>
                    {activeCase.assigned_officer}
                  </div>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    7. Last Action Taken & 8. Date
                  </span>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>
                    {activeCase.last_action} (on {activeCase.last_action_date || activeCase.received_date})
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    9. Next Action Required
                  </span>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--brand-blue)' }}>
                    {activeCase.next_action || 'Pending review'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    10. Expected Disposal
                  </span>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: activeCase.sla_severity === 'red' ? 'var(--status-red)' : 'var(--text-primary)' }}>
                    {activeCase.expected_disposal_date || activeCase.due_date || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Resolved Institution Identity */}
              <div className="case-box" style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Resolved Institution Master Match
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: '2px' }}>
                  {activeCase.institution_name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  AICTE Permanent ID: <code style={{ fontFamily: 'var(--font-mono)' }}>{activeCase.aicte_permanent_id}</code> &bull; Region: {activeCase.region || 'Regional Office'}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Name on Received Complaint: <em>"{activeCase.submitted_name}"</em>
                </div>
              </div>

              {/* Allegation Summary & Description */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.84rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Allegation Summary & Complainant
                </h4>
                <div style={{ fontSize: '0.94rem', fontWeight: 700, marginBottom: '6px' }}>
                  {activeCase.summary}
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
                  {activeCase.description}
                </p>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={14} /> Complainant: <strong>{activeCase.complainant_type}</strong> (Identity Masked for Whistleblower Protection)
                </div>
              </div>

              {/* Reciprocally Linked Cases (Feature 4 & 9) */}
              {activeCase.linked_case_ids && activeCase.linked_case_ids.length > 0 && (
                <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(30, 58, 138, 0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(30, 58, 138, 0.2)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--brand-blue)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <LinkIcon size={14} /> Parallel Linked Cross-Bureau Matters ({activeCase.linked_case_ids.length})
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {activeCase.linked_case_ids.map(lid => (
                      <span key={lid} style={{ padding: '4px 10px', borderRadius: '4px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600 }}>
                        {lid}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Supporting Documents Section (Feature 4) */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '0.84rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Supporting Documents & Evidence Files ({activeCase.documents?.length || 0})
                  </h4>
                  <button 
                    className="btn-secondary" 
                    style={{ padding: '4px 8px', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => setActiveSubPanel(activeSubPanel === 'upload' ? 'none' : 'upload')}
                  >
                    <Upload size={12} /> Upload Document
                  </button>
                </div>

                {/* Sub-Panel: Document Upload Form */}
                {activeSubPanel === 'upload' && (
                  <div style={{ padding: '14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '12px' }}>
                    <strong style={{ fontSize: '0.84rem', display: 'block', marginBottom: '8px' }}>
                      Upload Supporting Document to Official Record
                    </strong>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '10px', alignItems: 'center' }}>
                      <input 
                        type="text"
                        placeholder="Document Title (e.g. Verification_Report_Oct2026.pdf)"
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                        style={{ padding: '8px 10px', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}
                      />
                      <input 
                        type="file" 
                        onChange={(e) => setDocFile(e.target.files ? e.target.files[0] : null)}
                        style={{ fontSize: '0.75rem' }}
                      />
                      <button className="btn-primary" onClick={handleUploadDocument} disabled={submitting}>
                        Upload & Log Audit
                      </button>
                    </div>
                  </div>
                )}

                {/* Document List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {!activeCase.documents || activeCase.documents.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                      No supporting documents uploaded yet.
                    </div>
                  ) : (
                    activeCase.documents.map((doc: SupportingDocumentItem) => (
                      <div 
                        key={doc.id}
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          padding: '8px 12px', 
                          background: 'var(--bg-secondary)', 
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '0.8rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={16} color="var(--brand-blue)" />
                          <div>
                            <strong>{doc.name}</strong>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              Uploaded by: {doc.uploader} ({doc.bureau}) &bull; {doc.timestamp}
                            </div>
                          </div>
                        </div>

                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : 'Verified'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Official Action Workflow Toolbar (Feature 4) */}
              <div style={{ 
                background: 'var(--bg-secondary)', 
                padding: '16px', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid var(--border-subtle)',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '0.86rem', fontWeight: 800, marginBottom: '10px', color: 'var(--text-primary)' }}>
                  Execute Official Action as {currentPersona.name} ({currentPersona.bureau})
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Action Type
                    </label>
                    <select 
                      className="persona-select" 
                      style={{ width: '100%', background: 'var(--bg-surface)', padding: '8px', border: '1px solid var(--border-subtle)' }}
                      value={actionType}
                      onChange={(e) => setActionType(e.target.value)}
                    >
                      <option value="Scrutiny Completed">Scrutiny Completed</option>
                      <option value="Notice Issued">Show Cause Notice Issued under Reg 14(3)</option>
                      <option value="Inspection Ordered">Physical Inspection Ordered</option>
                      <option value="Hearing Scheduled">Joint Hearing Scheduled</option>
                      <option value="Compliance Verified">Compliance Verified</option>
                      <option value="Closed Satisfactory">Case Closed (Disposed)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
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
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Officer Order / Action Remarks
                  </label>
                  <input 
                    type="text" 
                    placeholder="Enter official remarks, dispatch order reference, or findings..."
                    value={actionRemarks}
                    onChange={(e) => setActionRemarks(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', fontSize: '0.84rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button 
                    className="btn-primary" 
                    onClick={handleAddAction}
                    disabled={submitting || !actionRemarks.trim()}
                  >
                    <Send size={14} /> Log Action & Append Audit
                  </button>

                  <button 
                    className="btn-secondary"
                    onClick={() => setActiveSubPanel(activeSubPanel === 'transfer' ? 'none' : 'transfer')}
                  >
                    Transfer Bureau
                  </button>

                  <button 
                    className="btn-secondary"
                    onClick={() => setActiveSubPanel(activeSubPanel === 'escalate' ? 'none' : 'escalate')}
                  >
                    Escalate
                  </button>

                  <button 
                    className="btn-secondary"
                    onClick={() => setActiveSubPanel(activeSubPanel === 'link' ? 'none' : 'link')}
                  >
                    <LinkIcon size={13} /> Link Case
                  </button>

                  <button 
                    className="btn-secondary"
                    onClick={() => setActiveSubPanel(activeSubPanel === 'duplicate' ? 'none' : 'duplicate')}
                  >
                    <Copy size={13} /> Mark Duplicate
                  </button>
                </div>

                {/* Sub-Panel: Transfer */}
                {activeSubPanel === 'transfer' && (
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
                {activeSubPanel === 'escalate' && (
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

                {/* Sub-Panel: Link Case */}
                {activeSubPanel === 'link' && (
                  <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Link to Parallel Case ID:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr auto', gap: '8px' }}>
                      <input 
                        type="text"
                        placeholder="Target Case ID (e.g. CS-2026-RB-00001)"
                        value={linkTargetId}
                        onChange={(e) => setLinkTargetId(e.target.value)}
                        style={{ padding: '6px', fontSize: '0.8rem', border: '1px solid var(--border-subtle)' }}
                      />
                      <input 
                        type="text" 
                        placeholder="Linking reason / joint investigation notes..."
                        value={linkReason}
                        onChange={(e) => setLinkReason(e.target.value)}
                        style={{ padding: '6px', fontSize: '0.8rem', border: '1px solid var(--border-subtle)' }}
                      />
                      <button className="btn-primary" onClick={handleLinkCase} disabled={submitting}>
                        Confirm Link
                      </button>
                    </div>
                  </div>
                )}

                {/* Sub-Panel: Mark Duplicate */}
                {activeSubPanel === 'duplicate' && (
                  <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Consolidate into Primary Case:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr auto', gap: '8px' }}>
                      <input 
                        type="text"
                        placeholder="Primary Case ID (e.g. CS-2026-PGRC-00001)"
                        value={duplicatePrimaryId}
                        onChange={(e) => setDuplicatePrimaryId(e.target.value)}
                        style={{ padding: '6px', fontSize: '0.8rem', border: '1px solid var(--border-subtle)' }}
                      />
                      <input 
                        type="text" 
                        placeholder="Consolidation justification..."
                        value={duplicateReason}
                        onChange={(e) => setDuplicateReason(e.target.value)}
                        style={{ padding: '6px', fontSize: '0.8rem', border: '1px solid var(--border-subtle)' }}
                      />
                      <button className="btn-primary" onClick={handleMarkDuplicate} disabled={submitting}>
                        Confirm Duplicate
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Immutable Action History Timeline (Audit Trail) */}
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
