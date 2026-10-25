import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, GitMerge, FileText, 
  Building2, BarChart3, Bell, Moon, Sun, 
  Globe, Shield
} from 'lucide-react';
import { DashboardView } from './components/DashboardView';
import { OverlapCenterView } from './components/OverlapCenterView';
import { CasesTrackerView } from './components/CasesTrackerView';
import { Institution360View } from './components/Institution360View';
import { ReportsView } from './components/ReportsView';
import { api } from './api';
import type { 
  DashboardAnalytics, CaseItem, InstitutionItem, 
  OverlapAlert, Persona 
} from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'overlaps' | 'cases' | 'institutions' | 'reports'>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [lang, setLang] = useState<'en' | 'hi'>('en');

  // Personas & Active User
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [currentPersona, setCurrentPersona] = useState<Persona>({
    id: 'senior_mgmt',
    name: 'Prof. T. G. Sitharam',
    role: 'Chairman / Competent Authority',
    bureau: 'MGMT',
    bureau_name: 'Executive Management',
    permissions: ['ALL_DATA_READ', 'APPROVE_ESCALATIONS', 'EXECUTIVE_REPORTS']
  });

  // Data Stores
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [institutions, setInstitutions] = useState<InstitutionItem[]>([]);
  const [overlaps, setOverlaps] = useState<OverlapAlert[]>([]);
  const [selectedOverlap, setSelectedOverlap] = useState<OverlapAlert | null>(null);

  // Notifications Popover
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const loadAllData = async () => {
    try {
      const [p, an, c, inst, ovr] = await Promise.all([
        api.getPersonas(),
        api.getDashboardAnalytics(),
        api.getCases(),
        api.getInstitutions(),
        api.getOverlaps()
      ]);
      setPersonas(p || []);
      setAnalytics(an);
      setCases(c || []);
      setInstitutions(inst || []);
      setOverlaps(ovr || []);
    } catch (err) {
      console.error("Failed to load CaseSync data:", err);
    }
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 20000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'hi' : 'en');
  };

  const handlePersonaChange = (personaId: string) => {
    const match = personas.find(p => p.id === personaId);
    if (match) setCurrentPersona(match);
  };

  const t = {
    govIndia: lang === 'hi' ? 'भारत सरकार | Government of India' : 'Government of India | भारत सरकार',
    aicteDept: lang === 'hi' ? 'अखिल भारतीय तकनीकी शिक्षा परिषद (विनियमन ब्यूरो)' : 'All India Council for Technical Education (Regulation Bureau)',
    sihCode: 'SIH 2026 | Problem ID: 26264',
    dashboard: lang === 'hi' ? 'डैशबोर्ड' : 'Dashboard',
    overlapCenter: lang === 'hi' ? 'ओवरलैप केंद्र' : 'Overlap Center',
    casesTracker: lang === 'hi' ? 'केस ट्रैकर' : 'Cases Tracker',
    institution360: lang === 'hi' ? 'संस्थान 360' : 'Institution 360',
    reports: lang === 'hi' ? 'रिपोर्ट्स' : 'Reports',
    roleLabel: lang === 'hi' ? 'सक्रिय पद:' : 'Role View:',
  };

  const notificationItems = [
    ...(overlaps.filter(o => o.level === 'HIGH').map(o => ({
      id: o.alert_id,
      title: `Potential Overlap: ${o.institution_name}`,
      desc: `High overlap (${Math.round(o.score * 100)}%) between ${o.case_a.bureau_name} and ${o.case_b.bureau_name}`,
      time: 'Urgent Action Required',
      type: 'overlap'
    }))),
    ...(cases.filter(c => c.sla_severity === 'red').map(c => ({
      id: c.id,
      title: `SLA Breached: Case ${c.id}`,
      desc: `${c.institution_name} - ${c.category_name} (${c.sla_label})`,
      time: `${c.days_elapsed} days elapsed`,
      type: 'sla'
    })))
  ];

  return (
    <div className="app-layout">
      {/* Official Government Topbar */}
      <header className="gov-topbar">
        <div>
          <span>{t.govIndia}</span> &bull; <strong>{t.aicteDept}</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ opacity: 0.9 }}>{t.sihCode}</span>
          <button 
            onClick={toggleLang}
            style={{ 
              background: 'rgba(255,255,255,0.15)', 
              border: 'none', 
              color: '#ffffff', 
              padding: '2px 8px', 
              borderRadius: '4px',
              fontSize: '0.74rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Globe size={12} /> {lang === 'en' ? 'हिंदी' : 'English'}
          </button>
        </div>
      </header>

      {/* Main Sticky Navbar */}
      <nav className="main-navbar">
        <div className="navbar-container">
          {/* Brand */}
          <div className="brand-section">
            <div className="brand-emblem">
              <Shield size={24} />
            </div>
            <div className="brand-text">
              <h1>
                CaseSync
                <span className="brand-tag">AICTE SIH26264</span>
              </h1>
              <div className="brand-subtitle">
                Integrated Institution Complaint Monitoring & Coordination
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="nav-links">
            <button 
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={16} />
              {t.dashboard}
            </button>

            <button 
              className={`nav-item ${activeTab === 'overlaps' ? 'active' : ''}`}
              onClick={() => setActiveTab('overlaps')}
            >
              <GitMerge size={16} />
              {t.overlapCenter}
              {overlaps.filter(o => o.level === 'HIGH').length > 0 && (
                <span className="nav-badge-pill">
                  {overlaps.filter(o => o.level === 'HIGH').length}
                </span>
              )}
            </button>

            <button 
              className={`nav-item ${activeTab === 'cases' ? 'active' : ''}`}
              onClick={() => setActiveTab('cases')}
            >
              <FileText size={16} />
              {t.casesTracker}
            </button>

            <button 
              className={`nav-item ${activeTab === 'institutions' ? 'active' : ''}`}
              onClick={() => setActiveTab('institutions')}
            >
              <Building2 size={16} />
              {t.institution360}
            </button>

            <button 
              className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              <BarChart3 size={16} />
              {t.reports}
            </button>
          </div>

          {/* Persona Switcher & Tooling */}
          <div className="nav-actions">
            {/* Persona Dropdown */}
            <div className="persona-selector">
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t.roleLabel}</span>
              <select 
                className="persona-select"
                value={currentPersona.id}
                onChange={(e) => handlePersonaChange(e.target.value)}
              >
                {personas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.bureau})
                  </option>
                ))}
              </select>
            </div>

            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button 
                className="icon-btn" 
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications & SLA Alerts"
              >
                <Bell size={18} />
                {notificationItems.length > 0 && <span className="indicator-dot" />}
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div style={{ 
                  position: 'absolute', 
                  right: 0, 
                  top: '46px', 
                  width: '340px', 
                  background: 'var(--bg-surface)', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: 'var(--radius-lg)', 
                  boxShadow: 'var(--shadow-xl)', 
                  zIndex: 200,
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <strong style={{ fontSize: '0.9rem' }}>SLA Alerts & Overlaps</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{notificationItems.length} active</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                    {notificationItems.length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No pending alerts</p>
                    ) : (
                      notificationItems.map((n, i) => (
                        <div 
                          key={i} 
                          style={{ 
                            padding: '8px 10px', 
                            borderRadius: 'var(--radius-sm)', 
                            background: 'var(--bg-secondary)',
                            borderLeft: `3px solid ${n.type === 'overlap' ? 'var(--status-red)' : 'var(--status-amber)'}`,
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            setShowNotifications(false);
                            if (n.type === 'overlap') setActiveTab('overlaps');
                            else setActiveTab('cases');
                          }}
                        >
                          <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{n.title}</strong>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.74rem' }}>{n.desc}</div>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{n.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dark / Light Mode */}
            <button 
              className="icon-btn" 
              onClick={toggleTheme}
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Viewport */}
      <main className="main-viewport">
        {activeTab === 'dashboard' && (
          <DashboardView 
            analytics={analytics} 
            onSelectOverlap={(ovr) => {
              setSelectedOverlap(ovr);
              setActiveTab('overlaps');
            }}
            onNavigateTab={(tab) => setActiveTab(tab as any)}
            lang={lang}
          />
        )}

        {activeTab === 'overlaps' && (
          <OverlapCenterView 
            overlaps={overlaps}
            currentPersona={currentPersona}
            onRefresh={loadAllData}
            selectedOverlap={selectedOverlap}
            setSelectedOverlap={setSelectedOverlap}
            lang={lang}
          />
        )}

        {activeTab === 'cases' && (
          <CasesTrackerView 
            cases={cases}
            currentPersona={currentPersona}
            onRefresh={loadAllData}
            lang={lang}
          />
        )}

        {activeTab === 'institutions' && (
          <Institution360View 
            institutions={institutions}
            lang={lang}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView 
            lang={lang}
          />
        )}
      </main>
    </div>
  );
}

export default App;
