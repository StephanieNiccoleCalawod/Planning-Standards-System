import { useAppStore } from "../store/useAppStore";
import logo from "../logo/image 2.svg";

const NAV_TREE = [
  {
    section: "Overview",
    items: [
      { key: "dashboard", label: "Dashboard", routeKey: "dashboard", icon: "dashboard" },
    ],
  },
  {
    section: "Services",
    items: [
      { key: "serviceCatalogue", label: "Service Catalogue", routeKey: "serviceCatalogue", icon: "catalogue" },
      { key: "kpiStandards", label: "KPI Standards", routeKey: "kpiStandards", icon: "target" },
    ],
  },
  {
    section: "Configuration",
    items: [
      { key: "slaConfiguration", label: "SLA Configuration", routeKey: "slaConfiguration", icon: "sliders" },
      { key: "holidayCalendar", label: "Holiday Calendar", routeKey: "holidayCalendar", icon: "calendar" },
      { key: "evaluationPeriods", label: "Evaluation Periods", routeKey: "evaluationPeriods", icon: "clock" },
    ],
  },
  {
    section: "Commitments",
    items: [
      { key: "opcrCommitments", label: "OPCR Commitments", routeKey: "opcrCommitments", icon: "file" },
    ],
  },
  {
    section: "System",
    items: [
      { key: "users", label: "Users", routeKey: "users", icon: "users" },
      { key: "officeSettings", label: "Office Settings", routeKey: "officeSettings", icon: "settings" },
      { key: "versionHistory", label: "Version History", routeKey: "versionHistory", icon: "history" },
    ],
  },
];

const ICONS = {
  dashboard: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  catalogue: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="10" x2="8" y2="20" />
    </svg>
  ),
  target: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  sliders: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M19.07 4.93l-1.42 1.42M6.34 17.66l-1.42 1.42M19.07 19.07l-1.42-1.42M6.34 6.34L4.92 4.92" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  file: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="14" x2="16" y2="14" />
      <line x1="8" y1="18" x2="13" y2="18" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  history: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="15" y2="18" />
    </svg>
  ),
};

export default function Sidebar({ active, setActive, isOpen, onClose }) {
  return (
    <>
      {isOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={onClose} 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            zIndex: 998,
            cursor: 'pointer'
          }}
        />
      )}
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        {/* Dynamic override style tag to fully bypass default layout lines */}
        <style dangerouslySetInnerHTML={{ __html: `
          .sidebar {
            width: 260px;
            background: #500000 !important;
            color: #ffffff;
            display: flex;
            flex-direction: column;
            height: 100vh;
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            box-sizing: border-box;
            border-right: 1px solid rgba(255, 255, 255, 0.05);
            font-family: "DM Sans", sans-serif;
            z-index: 1000;
            overflow: hidden;
            transition: transform 0.3s ease-in-out;
          }
          @media (max-width: 960px) {
            .sidebar {
              transform: translateX(-100%);
            }
            .sidebar.open {
              transform: translateX(0);
            }
          }
          .sidebar-logo {
            padding: 16px 20px 12px;
            display: flex;
            align-items: center;
            gap: 12px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          }
          .sidebar-logo-mark {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          .sidebar-logo-text {
            font-size: 14px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: 0.5px;
          }
          .sidebar-nav {
            padding: 12px 0;
            flex: 1;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 10px;
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
          }
          .sidebar-nav::-webkit-scrollbar {
            display: none;          /* Chrome, Safari and Opera */
          }
          .nav-section {
            display: flex;
            flex-direction: column;
            gap: 3px;
          }
          .nav-section-title {
            font-size: 10.5px !important;
            letter-spacing: 0.08em !important;
            text-transform: uppercase !important;
            color: rgba(255, 255, 255, 0.38) !important;
            padding: 6px 20px 2px 20px !important;
            font-weight: 700 !important;
            margin: 0 !important;
          }
          .nav-branch {
            position: relative !important;
            margin-left: 0 !important;
            padding-left: 0 !important;
          }
          .nav-branch::before {
            display: none !important;
          }
          .nav-leaf {
            position: relative;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 7px 20px;
            margin: 0;
            font-size: 13.5px;
            color: rgba(255, 255, 255, 0.65) !important;
            cursor: pointer;
            border-radius: 0 !important;
            transition: background 0.15s ease, color 0.15s ease;
            border-left: none !important;
            box-shadow: none !important;
          }
          .nav-leaf::before {
            display: none !important;
          }
          .nav-leaf:hover {
            color: #ffffff !important;
            background: rgba(255, 255, 255, 0.04) !important;
          }
          .nav-leaf.active {
            color: #ffffff !important;
            background: rgba(255, 255, 255, 0.08) !important;
            font-weight: 600;
          }
          .nav-leaf.active .nav-leaf-icon {
            color: #ffffff !important;
          }
          .nav-leaf-icon {
            width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(255, 255, 255, 0.65);
            flex-shrink: 0;
            transition: color 0.15s ease;
          }
          .nav-leaf:hover .nav-leaf-icon {
            color: #ffffff !important;
          }
          .nav-leaf-label {
            line-height: 1.2;
          }
          .sidebar-footer {
            padding: 12px 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
            background: rgba(0, 0, 0, 0.1);
          }
          .sidebar-user {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .sidebar-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: var(--gold, #C8960C) !important;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            font-weight: 700;
            color: #ffffff;
            flex-shrink: 0;
          }
          .sidebar-user-name {
            font-size: 13px;
            font-weight: 600;
            color: #ffffff;
            line-height: 1.2;
          }
          .sidebar-user-role {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.45);
            margin-top: 2px;
          }
        `}} />
  
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">
            <img src={logo} alt="PUP Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <span className="sidebar-logo-text">PUP Caloocan</span>
        </div>
  
        <div className="sidebar-nav">
          {NAV_TREE.map((section) => (
            <div key={section.section} className="nav-section">
              <div className="nav-section-title">{section.section.toUpperCase()}</div>
              <div className="nav-branch">
                {section.items.map((item) => (
                  <div
                    key={item.key}
                    onClick={() => setActive(item.routeKey)}
                    className={`nav-leaf ${active === item.routeKey ? "active" : ""}`}
                  >
                    <span className="nav-leaf-icon">{ICONS[item.icon]}</span>
                    <span className="nav-leaf-label">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
  
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', background: 'rgba(0, 0, 0, 0.1)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255, 255, 255, 0.45)', marginBottom: 6, letterSpacing: '0.05em' }}>
            CHANGE ROLE
          </div>
          <select
            value={useAppStore.getState().userRole}
            onChange={(e) => useAppStore.getState().setUserRole(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px',
              borderRadius: 6,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#fff',
              fontSize: 13,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="Admin" style={{ background: '#1a1a2e', color: '#fff' }}>Admin</option>
            <option value="Staff" style={{ background: '#1a1a2e', color: '#fff' }}>Staff</option>
          </select>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">A</div>
            <div>
              <div className="sidebar-user-name">Admin</div>
              <div className="sidebar-user-role">Administrative System</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
