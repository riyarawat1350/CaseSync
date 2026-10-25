import React, { useState, useEffect } from 'react';
import { 
  Bell, CheckCircle2, AlertTriangle, ShieldAlert, 
  Clock, GitMerge, ExternalLink, CheckCheck, X
} from 'lucide-react';
import { api } from '../api';

interface AlertsCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToCase: (caseId: string) => void;
  onNavigateToOverlap: (alertId: string) => void;
  onAlertsUpdated?: () => void;
  lang: 'en' | 'hi';
}

export const AlertsCenterModal: React.FC<AlertsCenterModalProps> = ({
  isOpen,
  onClose,
  onNavigateToCase,
  onNavigateToOverlap,
  onAlertsUpdated,
  lang
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({
    DUPLICATE_OVERLAP: 0,
    PENDING_REMINDER: 0,
    ESCALATION: 0,
    SLA_ALERT: 0
  });

  const fetchAlerts = async () => {
    try {
      const data = await api.getAlerts(selectedCategory);
      setAlerts(data.alerts || []);
      setUnreadTotal(data.unread_total || 0);
      setCategoryCounts(data.category_counts || {
        DUPLICATE_OVERLAP: 0,
        PENDING_REMINDER: 0,
        ESCALATION: 0,
        SLA_ALERT: 0
      });
    } catch (err) {
      console.error("Failed to load alerts:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAlerts();
    }
  }, [isOpen, selectedCategory]);

  if (!isOpen) return null;

  const handleMarkRead = async (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.markAlertRead(alertId);
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_read: true } : a));
      setUnreadTotal(prev => Math.max(0, prev - 1));
      if (onAlertsUpdated) onAlertsUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllAlertsRead();
      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
      setUnreadTotal(0);
      setCategoryCounts({
        DUPLICATE_OVERLAP: 0,
        PENDING_REMINDER: 0,
        ESCALATION: 0,
        SLA_ALERT: 0
      });
      if (onAlertsUpdated) onAlertsUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAlertClick = async (alert: any) => {
    if (!alert.is_read) {
      await api.markAlertRead(alert.id);
    }
    onClose();
    if (alert.target_type === 'overlap') {
      onNavigateToOverlap(alert.target_id);
    } else {
      onNavigateToCase(alert.target_id);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'DUPLICATE_OVERLAP':
        return <GitMerge size={16} color="var(--status-red)" />;
      case 'SLA_ALERT':
        return <Clock size={16} color="var(--status-amber)" />;
      case 'ESCALATION':
        return <ShieldAlert size={16} color="var(--status-purple)" />;
      case 'PENDING_REMINDER':
        return <AlertTriangle size={16} color="var(--status-blue)" />;
      default:
        return <Bell size={16} color="var(--brand-blue)" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <span className="status-badge badge-red" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>CRITICAL</span>;
      case 'high':
        return <span className="status-badge badge-amber" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>HIGH</span>;
      case 'medium':
        return <span className="status-badge badge-blue" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>MEDIUM</span>;
      default:
        return <span className="status-badge" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>INFO</span>;
    }
  };

  const t = {
    title: lang === 'hi' ? 'सूचना एवं सतर्कता केंद्र' : 'Alerts & Notification Center',
    subtitle: lang === 'hi' 
      ? 'ओवरलैप, लंबित स्मरणपत्र, उच्चाधिकारी निष्पादन व एसएलए चेतावनी सूचनाएं' 
      : 'Real-time vigilance notifications across AICTE Bureaus and Cells',
    markAllRead: lang === 'hi' ? 'सभी को पढ़ा हुआ चिन्हित करें' : 'Mark All Read',
    allAlerts: lang === 'hi' ? 'सभी' : 'All Alerts',
    overlapAlerts: lang === 'hi' ? 'ओवरलैप / डुप्लिकेट' : 'Duplicate / Overlaps',
    slaAlerts: lang === 'hi' ? 'एसएलए चेतावनी' : 'SLA Alerts (80% & Breached)',
    escalationAlerts: lang === 'hi' ? 'केस निष्पादन' : 'Escalations',
    reminderAlerts: lang === 'hi' ? 'लंबित स्मरणपत्र' : 'Pending Reminders'
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-container" 
        style={{ maxWidth: '780px', width: '92%' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '8px', 
              background: 'rgba(30, 58, 138, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Bell size={20} color="var(--brand-blue)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{t.title}</h3>
                {unreadTotal > 0 && (
                  <span className="status-badge badge-red" style={{ fontSize: '0.72rem' }}>
                    {unreadTotal} Unread
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.subtitle}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {unreadTotal > 0 && (
              <button 
                className="btn-secondary" 
                onClick={handleMarkAllRead}
                style={{ fontSize: '0.74rem', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <CheckCheck size={14} /> {t.markAllRead}
              </button>
            )}
            <button className="icon-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Category Tabs with Count Badges (Feature 5) */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          padding: '12px 20px', 
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-secondary)',
          overflowX: 'auto'
        }}>
          <button 
            className={`btn-secondary ${selectedCategory === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('ALL')}
            style={{ fontSize: '0.76rem', padding: '6px 12px' }}
          >
            {t.allAlerts} ({unreadTotal})
          </button>

          <button 
            className={`btn-secondary ${selectedCategory === 'DUPLICATE_OVERLAP' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('DUPLICATE_OVERLAP')}
            style={{ fontSize: '0.76rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <GitMerge size={13} /> {t.overlapAlerts}
            {categoryCounts.DUPLICATE_OVERLAP > 0 && (
              <span className="nav-badge-pill" style={{ background: 'var(--status-red)' }}>
                {categoryCounts.DUPLICATE_OVERLAP}
              </span>
            )}
          </button>

          <button 
            className={`btn-secondary ${selectedCategory === 'SLA_ALERT' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('SLA_ALERT')}
            style={{ fontSize: '0.76rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Clock size={13} /> {t.slaAlerts}
            {categoryCounts.SLA_ALERT > 0 && (
              <span className="nav-badge-pill" style={{ background: 'var(--status-amber)' }}>
                {categoryCounts.SLA_ALERT}
              </span>
            )}
          </button>

          <button 
            className={`btn-secondary ${selectedCategory === 'ESCALATION' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('ESCALATION')}
            style={{ fontSize: '0.76rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ShieldAlert size={13} /> {t.escalationAlerts}
            {categoryCounts.ESCALATION > 0 && (
              <span className="nav-badge-pill" style={{ background: 'var(--status-purple)' }}>
                {categoryCounts.ESCALATION}
              </span>
            )}
          </button>

          <button 
            className={`btn-secondary ${selectedCategory === 'PENDING_REMINDER' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('PENDING_REMINDER')}
            style={{ fontSize: '0.76rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <AlertTriangle size={13} /> {t.reminderAlerts}
            {categoryCounts.PENDING_REMINDER > 0 && (
              <span className="nav-badge-pill" style={{ background: 'var(--status-blue)' }}>
                {categoryCounts.PENDING_REMINDER}
              </span>
            )}
          </button>
        </div>

        {/* Alerts List */}
        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '16px' }}>
          {alerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={40} color="var(--status-green)" style={{ margin: '0 auto 12px' }} />
              <h4>No alerts in this category</h4>
              <p style={{ fontSize: '0.82rem' }}>All active cases and bureau workflows are currently within compliance bounds.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {alerts.map((alt) => (
                <div 
                  key={alt.id}
                  onClick={() => handleAlertClick(alt)}
                  style={{ 
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: alt.is_read ? 'var(--bg-secondary)' : 'var(--bg-surface)',
                    border: alt.is_read ? '1px solid var(--border-subtle)' : '1.5px solid var(--brand-blue)',
                    boxShadow: alt.is_read ? 'none' : '0 2px 8px rgba(30, 58, 138, 0.08)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getCategoryIcon(alt.category)}
                      <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                        {alt.title}
                      </strong>
                      {getSeverityBadge(alt.severity)}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {alt.created_at}
                      </span>
                      {!alt.is_read && (
                        <button 
                          className="icon-btn" 
                          style={{ width: '22px', height: '22px' }}
                          title="Mark read"
                          onClick={(e) => handleMarkRead(alt.id, e)}
                        >
                          <CheckCheck size={14} color="var(--brand-blue)" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '4px 0 8px' }}>
                    {alt.message}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem' }}>
                    <span style={{ color: 'var(--brand-blue)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Target: {alt.target_type.toUpperCase()} &bull; {alt.target_id} <ExternalLink size={12} />
                    </span>

                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                      Click to open {alt.target_type === 'overlap' ? 'coordination thread' : 'case details'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Total {alerts.length} notifications loaded
          </span>
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
