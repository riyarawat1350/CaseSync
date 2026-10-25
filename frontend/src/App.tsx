import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, GitMerge, FileText, 
  Building2, BarChart3, Bell, Moon, Sun, 
  Globe, Shield, LogOut, Menu, X
} from 'lucide-react';
import { DashboardView } from './components/DashboardView';
import { OverlapCenterView } from './components/OverlapCenterView';
import { CasesTrackerView } from './components/CasesTrackerView';
import { Institution360View } from './components/Institution360View';
import { ReportsView } from './components/ReportsView';
import { AlertsCenterModal } from './components/AlertsCenterModal';
import { LoginView } from './components/LoginView';
import { api } from './api';
import type { 
  DashboardAnalytics, CaseItem, InstitutionItem, 
  OverlapAlert, Persona 
} from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'overlaps' | 'cases' | 'institutions' | 'reports'>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Authentication & Session (Feature 7)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(api.getStoredToken());
  });

  // Personas & Active User
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [currentPersona, setCurrentPersona] = useState<Persona>(() => {
    const saved = api.getStoredUser();
    return saved || {
      id: 'senior_mgmt',
      username: 'chairman',
      name: 'Prof. T. G. Sitharam',
      role: 'Chairman / Competent Authority',
      bureau: 'MGMT',
      bureau_name: 'Executive Management',
      permissions: ['ALL_DATA_READ', 'APPROVE_ESCALATIONS', 'EXECUTIVE_REPORTS', 'FULL_ADMIN']
    };
  });

  // Data Stores
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [institutions, setInstitutions] = useState<InstitutionItem[]>([]);
  const [overlaps, setOverlaps] = useState<OverlapAlert[]>([]);
  const [selectedOverlap, setSelectedOverlap] = useState<OverlapAlert | null>(null);

  // Alerts Center Modal (Feature 5)
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const loadAllData = async () => {
    try {
      const [p, an, c, inst, ovr, altData] = await Promise.all([
        api.getPersonas(),
        api.getDashboardAnalytics(),
        api.getCases(),
        api.getInstitutions(),
        api.getOverlaps(),
        api.getAlerts()
      ]);
      setPersonas(p || []);
      setAnalytics(an);
      setCases(c || []);
      setInstitutions(inst || []);
      setOverlaps(ovr || []);
      setUnreadAlertsCount(altData?.unread_total || 0);
    } catch (err) {
      console.error("Failed to load CaseSync data:", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
      const interval = setInterval(loadAllData, 20000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, currentPersona.id]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'hi' : 'en');
  };

  const handlePersonaChange = (personaId: string) => {
    const match = personas.find(p => p.id === personaId);
    if (match) {
      setCurrentPersona(match);
      localStorage.setItem('casesync_user', JSON.stringify(match));
    }
  };

  const handleLoginSuccess = (user: any) => {
    setCurrentPersona(user);
    setIsAuthenticated(true);
    loadAllData();
  };

  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
  };

  const t = {
    govIndia: lang === 'hi' ? 'भारत सरकार | Government of India' : 'Government of India | भारत सरकार',
    aicteDept: lang === 'hi' ? 'अखिल भारतीय तकनीकी शिक्षा परिषद (विनियमन ब्यूरो)' : 'All India Council for Technical Education (Regulation Bureau)',
    sihCode: 'SIH 2026 | Problem ID: 26264',
    gigwDesign: 'GIGW-aligned design',
    dashboard: lang === 'hi' ? 'डैशबोर्ड' : 'Dashboard',
    overlapCenter: lang === 'hi' ? 'ओवरलैप केंद्र' : 'Overlap Center',
    casesTracker: lang === 'hi' ? 'केस ट्रैकर' : 'Cases Tracker',
    institution360: lang === 'hi' ? 'संस्थान 360' : 'Institution 360',
    reports: lang === 'hi' ? 'रिपोर्ट्स' : 'Reports',
    roleLabel: lang === 'hi' ? 'सक्रिय पद (Demo):' : 'Active Role (Demo):',
    logout: lang === 'hi' ? 'लॉग आउट' : 'Sign Out'
  };

  const activeOverlapsTotal = overlaps.filter(o => o.coordination_status !== 'RESOLVED' && o.level === 'HIGH').length;

  // Render Login View if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="app-layout">
        <header className="gov-topbar">
          <div>
            <span>{t.govIndia}</span> &bull; <strong>{t.aicteDept}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ opacity: 0.9 }}>{t.sihCode} &bull; {t.gigwDesign}</span>
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

        <LoginView onLoginSuccess={handleLoginSuccess} lang={lang} />
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Official Government Topbar */}
      <header className="gov-topbar">
        <div>
          <span>{t.govIndia}</span> &bull; <strong>{t.aicteDept}</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ opacity: 0.9 }}>{t.sihCode} &bull; {t.gigwDesign}</span>
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

          {/* Desktop Navigation Links */}
          <div className="nav-links nav-links-desktop">
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
              {activeOverlapsTotal > 0 && (
                <span className="nav-badge-pill" style={{ background: 'var(--status-red)' }}>
                  {activeOverlapsTotal}
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

          {/* Desktop Persona Switcher & Tooling */}
          <div className="nav-actions nav-actions-desktop">
            {/* Persona Dropdown (Demo Shortcut) */}
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

            {/* Notification Bell Badge (Feature 5: Alerts Center) */}
            <div style={{ position: 'relative' }}>
              <button 
                className="icon-btn" 
                onClick={() => setShowAlertsModal(true)}
                title="Alerts Center (Duplicate Overlaps, SLA, Escalations, Reminders)"
                style={{ position: 'relative' }}
              >
                <Bell size={18} />
                {unreadAlertsCount > 0 && (
                  <span 
                    style={{ 
                      position: 'absolute', 
                      top: '-4px', 
                      right: '-4px', 
                      background: 'var(--status-red)', 
                      color: '#ffffff', 
                      borderRadius: '50%', 
                      width: '18px', 
                      height: '18px', 
                      fontSize: '0.66rem', 
                      fontWeight: 700, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      boxShadow: '0 0 0 2px var(--bg-surface)'
                    }}
                  >
                    {unreadAlertsCount > 99 ? '99+' : unreadAlertsCount}
                  </span>
                )}
              </button>
            </div>

            {/* Dark / Light Mode */}
            <button 
              className="icon-btn" 
              onClick={toggleTheme}
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Logout Button */}
            <button 
              className="icon-btn" 
              onClick={handleLogout}
              title={t.logout}
              style={{ color: 'var(--text-muted)' }}
            >
              <LogOut size={18} />
            </button>
          </div>

          {/* Mobile Header Actions (Alerts Bell + Hamburger) */}
          <div className="mobile-header-actions">
            <button 
              className="icon-btn" 
              onClick={() => setShowAlertsModal(true)}
              title="Alerts Center"
              style={{ position: 'relative' }}
            >
              <Bell size={18} />
              {unreadAlertsCount > 0 && (
                <span 
                  style={{ 
                    position: 'absolute', 
                    top: '-2px', 
                    right: '-2px', 
                    background: 'var(--status-red)', 
                    color: '#ffffff', 
                    borderRadius: '50%', 
                    width: '16px', 
                    height: '16px', 
                    fontSize: '0.62rem', 
                    fontWeight: 700, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center'
                  }}
                >
                  {unreadAlertsCount > 99 ? '99+' : unreadAlertsCount}
                </span>
              )}
            </button>

            <button 
              className="icon-btn mobile-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              title="Open Navigation Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Swipeable Tab Scroll Navigation */}
        <div className="mobile-tab-scroll">
          <button 
            className={`mobile-tab-pill ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
          >
            <LayoutDashboard size={14} />
            {t.dashboard}
          </button>

          <button 
            className={`mobile-tab-pill ${activeTab === 'overlaps' ? 'active' : ''}`}
            onClick={() => { setActiveTab('overlaps'); setMobileMenuOpen(false); }}
          >
            <GitMerge size={14} />
            {t.overlapCenter}
            {activeOverlapsTotal > 0 && (
              <span className="nav-badge-pill" style={{ background: 'var(--status-red)', color: '#ffffff' }}>
                {activeOverlapsTotal}
              </span>
            )}
          </button>

          <button 
            className={`mobile-tab-pill ${activeTab === 'cases' ? 'active' : ''}`}
            onClick={() => { setActiveTab('cases'); setMobileMenuOpen(false); }}
          >
            <FileText size={14} />
            {t.casesTracker}
          </button>

          <button 
            className={`mobile-tab-pill ${activeTab === 'institutions' ? 'active' : ''}`}
            onClick={() => { setActiveTab('institutions'); setMobileMenuOpen(false); }}
          >
            <Building2 size={14} />
            {t.institution360}
          </button>

          <button 
            className={`mobile-tab-pill ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => { setActiveTab('reports'); setMobileMenuOpen(false); }}
          >
            <BarChart3 size={14} />
            {t.reports}
          </button>
        </div>

        {/* Mobile Dropdown Panel for Role Switching & Settings */}
        {mobileMenuOpen && (
          <div className="mobile-dropdown-menu">
            <div className="mobile-user-profile">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="brand-tag">{currentPersona.bureau}</span>
                <strong style={{ fontSize: '0.88rem' }}>{currentPersona.name}</strong>
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{currentPersona.role}</span>
            </div>

            <div style={{ marginTop: '10px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t.roleLabel}</span>
              <select 
                className="persona-select" 
                style={{ width: '100%', marginTop: '6px', padding: '8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}
                value={currentPersona.id}
                onChange={(e) => {
                  handlePersonaChange(e.target.value);
                  setMobileMenuOpen(false);
                }}
              >
                {personas.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.bureau})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button 
                className="btn-secondary" 
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem', padding: '8px' }}
                onClick={toggleTheme}
              >
                {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </button>

              <button 
                className="btn-secondary" 
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem', padding: '8px' }}
                onClick={toggleLang}
              >
                <Globe size={14} />
                {lang === 'en' ? 'हिंदी' : 'English'}
              </button>
            </div>

            <button 
              className="btn-secondary" 
              style={{ width: '100%', marginTop: '10px', color: 'var(--status-red)', justifyContent: 'center', fontSize: '0.82rem', padding: '9px' }}
              onClick={handleLogout}
            >
              <LogOut size={15} /> {t.logout}
            </button>
          </div>
        )}
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

      {/* Dedicated Alerts Center Modal (Feature 5) */}
      <AlertsCenterModal 
        isOpen={showAlertsModal}
        onClose={() => setShowAlertsModal(false)}
        onNavigateToCase={(_caseId) => {
          setShowAlertsModal(false);
          setActiveTab('cases');
        }}
        onNavigateToOverlap={(alertId) => {
          setShowAlertsModal(false);
          const match = overlaps.find(o => o.alert_id === alertId);
          if (match) setSelectedOverlap(match);
          setActiveTab('overlaps');
        }}
        onAlertsUpdated={loadAllData}
        lang={lang}
      />
    </div>
  );
}

export default App;
