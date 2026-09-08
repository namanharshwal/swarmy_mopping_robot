import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Rocket, Map, Compass, Navigation, MapPin,
  FolderTree, Network, MonitorUp, FileCode, Gamepad2, Brain, Eye,
  Server, Settings, Info, ChevronDown, ChevronRight, Menu, X, Wifi, WifiOff, Power, PanelLeftClose
} from 'lucide-react';

const MENU_DATA = [
  {
    title: "Operations",
    icon: <Rocket size={18} />,
    links: [
      { to: "/", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
      { to: "/launcher", label: "Mission Launcher", icon: <Rocket size={18} /> },
      { to: "/studio", label: "Swarmy Studio", icon: <Network size={18} /> },
    ]
  },
  {
    title: "Mapping & Nav",
    icon: <Map size={18} />,
    links: [
      { to: "/mapping", label: "2D Mapping (SLAM)", icon: <Map size={18} /> },
      { to: "/autonomous-mapping", label: "Auto Mapping", icon: <Compass size={18} /> },
      { to: "/navigation", label: "Auto Navigation", icon: <Navigation size={18} /> },
      { to: "/planner", label: "Route Planner", icon: <MapPin size={18} /> },
      { to: "/opcua", label: "OPC UA Interface", icon: <Server size={18} /> },
    ]
  },
  {
    title: "Development",
    icon: <FolderTree size={18} />,
    links: [
      { to: "/workspace", label: "Workspace IDE", icon: <FolderTree size={18} /> },
      { to: "/terminal", label: "Web Terminal", icon: <MonitorUp size={18} /> },
      { to: "/ros-graph", label: "ROS RQT Graph", icon: <Network size={18} /> },
      { to: "/all-launch", label: "All Launch Files", icon: <FileCode size={18} /> },
    ]
  },
  {
    title: "Robot Interface",
    icon: <Brain size={18} />,
    links: [
      { to: "/controls", label: "Teleoperation", icon: <Gamepad2 size={18} /> },
      { to: "/ai-chat", label: "AI Assistant", icon: <Brain size={18} /> },
      { to: "/robot-face", label: "Robot Face", icon: <Eye size={18} /> },
    ]
  },
  {
    title: "System",
    icon: <Server size={18} />,
    links: [
      { to: "/system", label: "System Manager", icon: <Server size={18} /> },
      { to: "/settings", label: "Settings", icon: <Settings size={18} /> },
      { to: "/about", label: "About Swarmy", icon: <Info size={18} /> },
    ]
  }
];

function NavGroup({ group, activePath, onNavClick }) {
  const isActiveGroup = group.links.some(l => l.to === activePath);
  const [isOpen, setIsOpen] = useState(isActiveGroup);

  return (
    <div className="nav-group">
      <div 
        className={`nav-group-header ${isActiveGroup ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="nav-group-title">
          <span className="icon">{group.icon}</span>
          <span>{group.title}</span>
        </div>
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </div>
      
      <div className={`nav-group-content ${isOpen ? 'open' : ''}`}>
        {group.links.map(link => (
          <Link 
            key={link.to} 
            to={link.to} 
            className={`nav-link ${activePath === link.to ? 'active-nav' : ''}`}
            onClick={onNavClick}
          >
            {link.icon} {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function SidebarMenu({ connected, handleLogout }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  useEffect(() => {
    const handleToggle = () => setMobileOpen(prev => !prev);
    window.addEventListener('toggleMobileMenu', handleToggle);
    return () => window.removeEventListener('toggleMobileMenu', handleToggle);
  }, []);

  const onNavClick = () => {
    if (window.innerWidth <= 1024) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      {/* BACKDROP FOR MOBILE */}
      {mobileOpen && (
        <div className="mobile-sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      {/* SIDEBAR CONTAINER */}
      <aside className={`smart-sidebar ${mobileOpen ? 'mobile-open' : ''} ${desktopCollapsed ? 'desktop-collapsed' : ''}`}>
        
        {/* LOGO HEADER */}
        <div className="sidebar-header">
          {!desktopCollapsed ? (
            <div className="logo-section" style={{marginBottom: 0}}>
              <h1>SWARMY</h1>
              <span className="badge">ENTERPRISE</span>
            </div>
          ) : (
            <div className="logo-mini">SW</div>
          )}
          
          <button className="collapse-btn hide-on-mobile" onClick={() => setDesktopCollapsed(!desktopCollapsed)}>
            <Menu size={20} color="#888" />
          </button>
          <button className="collapse-btn hide-on-desktop modern-close" onClick={() => setMobileOpen(false)}>
            <PanelLeftClose size={22} color="#22d3ee" />
            <span style={{fontSize: '12px', color: '#22d3ee', fontWeight: 'bold', marginLeft: '6px', fontFamily: "'Rajdhani', sans-serif"}}>HIDE MENU</span>
          </button>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="nav-container">
          {desktopCollapsed ? (
            <div className="minified-nav">
              {MENU_DATA.flatMap(g => g.links).map(link => (
                <Link key={link.to} to={link.to} className={`mini-link ${location.pathname === link.to ? 'active' : ''}`} title={link.label}>
                  {link.icon}
                </Link>
              ))}
            </div>
          ) : (
            <div className="accordion-nav">
              {MENU_DATA.map((group, idx) => (
                <NavGroup key={idx} group={group} activePath={location.pathname} onNavClick={onNavClick} />
              ))}
            </div>
          )}
        </nav>

        {/* STATUS & LOGOUT FOOTER */}
        {!desktopCollapsed && (
          <div className="sidebar-footer">
            <div className={`status-badge ${!connected ? 'disconnected' : ''}`}>
              {connected ? <><Wifi size={16} className="pulse-icon text-cyan" /> ROS Core Online</> : <><WifiOff size={16} className="text-red" /> ROS Core Offline</>}
            </div>
            <button className="btn-logout" onClick={handleLogout}>
              <Power size={16} /> Disconnect
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
