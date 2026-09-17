import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { TbMenu2, TbX } from 'react-icons/tb';
import {
  FiZap,
  FiLogOut,
  FiMapPin,
  FiGrid,
  FiPackage,
  FiFileText,
  FiBell,
  FiUserPlus,
  FiSettings,
  FiUser,
  FiUsers,
  FiCpu,
  FiNavigation,
  FiFolder,
  FiCreditCard,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import { MdOutlineDashboard } from 'react-icons/md';
import { FaUserCircle, FaCar, FaUserTie, FaStore } from 'react-icons/fa';
import { getNavForRole } from '../config/dashboardNav.js';
import { useAuth } from '../context/AuthContext.jsx';
import NotificationBell from './NotificationBell.jsx';
import './Layout.css';

// Maps the `icon` key used in config/dashboardNav.js to a react-icons component.
const NAV_ICON_MAP = {
  dashboard: <MdOutlineDashboard />,
  dealers: <FaStore />,
  users: <FiUsers />,
  employees: <FaUserTie />,
  vehicles: <FaCar />,
  devices: <FiCpu />,
  packages: <FiPackage />,
  orders: <FiFileText />,
  reports: <FiFileText />,
  alerts: <FiBell />,
  subscribers: <FiUserPlus />,
  subscriptions: <FiCreditCard />,
  settings: <FiSettings />,
  geofence: <FiMapPin />,
  profile: <FiUser />,
  'live-tracking': <FiNavigation />,
  'vehicle-groups': <FiFolder />,
  resources: <FiFolder />,
};

function getNavIcon(item) {
  return NAV_ICON_MAP[item.icon] || <FiGrid />;
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobile = () => setMobileOpen(false);

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 960) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = getNavForRole(user?.role);
  const LICENSE_ACTIVATION_ROLES = ['ADMIN', 'DEALER'];

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'app-shell--menu-open' : ''}`}>
      {/* Mobile-only top bar with the menu toggle */}
      <div className="mobile-topbar">
        <button
          type="button"
          className="mobile-topbar__toggle"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <TbX /> : <TbMenu2 />}
        </button>
        <div className="mobile-topbar__brand">
          <span className="brand-icon"><img src='/aero.png' alt="Aero" /></span>
          <span className="brand-icon"><img src='/aero.png' /></span>
          <strong>AERO GPS-SCHEMA</strong>
        </div>
        <NotificationBell />
      </div>

      {mobileOpen && <div className="sidebar-overlay" onClick={closeMobile} />}

      <aside className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-icon">
              <img src='/aero.png' alt="Aero" />
              {/* <FiMapPin /><img src='/aero.png' /> */}
            </div>
            <div className={`brand-text ${sidebarCollapsed ? 'hidden' : ''}`}>
              <strong>AERO</strong>
              <small>GPS-SCHEMA</small>
            </div>
          </div>
          {/* SINGLE TOGGLE BUTTON - ONLY THIS ONE EXISTS NOW */}
          <button
            className="sidebar-toggle-btn"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              end={item.path === '/'}
              onClick={closeMobile}
              data-tooltip={item.label}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{getNavIcon(item)}</span>
              <span className={`nav-text ${sidebarCollapsed ? 'hidden' : ''}`}>{item.label}</span>
            </NavLink>
          ))}

          {user?.role && LICENSE_ACTIVATION_ROLES.includes(user.role) && (
            <NavLink to="/license-activation" onClick={closeMobile} data-tooltip="Activate License" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon"><FiZap /></span>
              <span className={`nav-text ${sidebarCollapsed ? 'hidden' : ''}`}>Activate License</span>
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          {/* <div className="user-chip">
            <div className="avatar">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt={user?.name} />
              ) : (
                <FaUserCircle />
              )}
            </div>
            <div className={`user-info ${sidebarCollapsed ? 'hidden' : ''}`}>
              <strong>{user?.name}</strong>
              <small>{user?.role}</small>
            </div>
          </div>
          </div> */}
          <button
            type="button"
            className={`btn btn-secondary btn-block ${sidebarCollapsed ? 'btn-icon-only' : ''}`}
            onClick={handleLogout}
          >
            <FiLogOut />
            <span className={`btn-text ${sidebarCollapsed ? 'hidden' : ''}`}>Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
        <div className="main-content-header">
          {!sidebarCollapsed && (
            <button
              className="collapse-btn desktop-only"
              onClick={toggleSidebar}
              aria-label="Collapse sidebar"
            >
              <FiChevronLeft />
            </button>
          )}
          {/* <Outlet /> */}
        </div>
      </main>
    </div>
  );
}