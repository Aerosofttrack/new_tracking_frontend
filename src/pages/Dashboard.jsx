import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiChevronDown,
  FiPackage,
  FiShoppingCart,
  FiCheckCircle,
  FiFileText,
  FiCalendar,
  FiUsers,
  FiCpu,
  FiTruck,
  FiUser,
  FiFolder,
  FiUsers as FiUsersAlt,
  FiSettings,
  FiLogOut,
} from 'react-icons/fi';
import { FaStore, FaCar, FaUserCircle } from 'react-icons/fa';
import { resourceApis } from '../api/services.js';
import { useAuth } from '../context/AuthContext.jsx';
import DonutChart from '../components/charts/DonutChart.jsx';
import TrendLineChart from '../components/charts/TrendLineChart.jsx';
import NotificationBell from '../components/NotificationBell.jsx';
import './Dashboard.css';

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

async function fetchTotal(apiKey, params = {}) {
  try {
    const api = resourceApis[apiKey];
    if (!api) return 0;
    const res = await api.getAll({ limit: 1, ...params });
    const payload = res?.data?.data;
    if (payload && !Array.isArray(payload) && payload.meta?.total !== undefined) {
      return payload.meta.total;
    }
    if (res?.data?.meta?.total !== undefined) return res.data.meta.total;
    if (Array.isArray(payload)) return payload.length;
    if (Array.isArray(res?.data)) return res.data.length;
    return 0;
  } catch (err) {
    console.error(`Error fetching total for ${apiKey}:`, err);
    return 0;
  }
}

function formatDateTime(date) {
  const datePart = date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${datePart} | ${timePart}`;
}

function initialsFor(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

function roleLabel(role) {
  switch (role) {
    case 'ADMIN':
      return 'Super Admin';
    case 'DEALER':
      return 'Dealer';
    case 'USER':
      return 'User';
    case 'SUB_USER':
      return 'Sub User';
    case 'EMPLOYEE':
      return 'Employee';
    default:
      return role || '';
  }
}

// ---------------------------------------------------------------------------
// User menu (avatar + dropdown)
// ---------------------------------------------------------------------------
function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <div className="user-menu" ref={containerRef}>
      <button
        type="button"
        className="dash-user-chip"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div className="dash-avatar">
          {user?.profilePicture ? (
            <img src={user.profilePicture} alt={user?.name} />
          ) : (
            initialsFor(user?.name)
          )}
        </div>
        <div className="dash-user-meta">
          <strong>{user?.name || 'User'}</strong>
          <small>{roleLabel(user?.role)}</small>
        </div>
        <FiChevronDown className={`dash-chevron ${open ? 'dash-chevron--open' : ''}`} />
      </button>

      {open && (
        <div className="user-menu__panel" role="menu">
          <div className="user-menu__header">
            <div className="dash-avatar dash-avatar--lg">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt={user?.name} />
              ) : (
                <FaUserCircle />
              )}
            </div>
            <div>
              <strong>{user?.name || 'User'}</strong>
              <small>{user?.email || user?.username || ''}</small>
            </div>
          </div>

          <div className="user-menu__divider" />

          <Link
            to="/profile"
            className="user-menu__item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <FiUser /> Profile
          </Link>
          <Link
            to="/settings"
            className="user-menu__item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <FiSettings /> Settings
          </Link>

          <div className="user-menu__divider" />

          <button
            type="button"
            className="user-menu__item user-menu__item--danger"
            role="menuitem"
            onClick={handleLogout}
          >
            <FiLogOut /> Logout
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared header
// ---------------------------------------------------------------------------
function DashboardHeader({ title, welcomeName }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="dash-header">
      <div>
        <h1 className="dash-title">{title}</h1>
        <p className="dash-subtitle">Welcome back, {welcomeName}!</p>
      </div>
      <div className="dash-header-right">
        <div className="dash-datetime">
          <FiCalendar />
          <span>{formatDateTime(now)}</span>
        </div>
        {/* <NotificationBell /> */}
        <UserMenu />
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Reusable presentational pieces
// ---------------------------------------------------------------------------
function StatCard({ icon, color, value, label, sublabel, linkTo, linkLabel }) {
  return (
    <div className={`stat-tile stat-tile--${color}`}>
      <div className="stat-tile__top">
        <div className={`stat-tile__icon stat-tile__icon--${color}`}>{icon}</div>
      </div>
      <strong className="stat-tile__value">{value}</strong>
      <span className="stat-tile__label">{label}</span>
      {sublabel && <small className="stat-tile__sublabel">{sublabel}</small>}
      {linkTo && (
        <Link to={linkTo} className={`stat-tile__link stat-tile__link--${color}`}>
          {linkLabel} <span aria-hidden="true">&rarr;</span>
        </Link>
      )}
    </div>
  );
}

function ExpiryCallout({ count, description, linkTo }) {
  return (
    <div className="panel expiry-callout">
      <h2>License Expiry in 30 Days</h2>
      <div className="expiry-callout__body">
        <div className="expiry-callout__icon">
          <FiCalendar />
        </div>
        <div>
          <strong className="expiry-callout__count">{count}</strong>
          <span className="expiry-callout__text">Licenses Expiring Soon</span>
        </div>
      </div>
      <p className="expiry-callout__desc">{description}</p>
      {linkTo && (
        <Link to={linkTo} className="btn btn-danger-soft">
          View Expiring Licenses <span aria-hidden="true">&rarr;</span>
        </Link>
      )}
    </div>
  );
}

function SystemSummaryItem({ icon, color, label, value, total }) {
  const pct = total ? ((value / total) * 100).toFixed(1) : '0.0';
  return (
    <div className="system-summary-item">
      <div className={`system-summary-item__icon system-summary-item__icon--${color}`}>
        {icon}
      </div>
      <div>
        <span className="system-summary-item__label">{label}</span>
        <strong className="system-summary-item__value">{value.toLocaleString()}</strong>
        <small className="system-summary-item__pct">
          {pct}% of total {label.split(' ')[1]?.toLowerCase()}
        </small>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ADMIN dashboard
// ---------------------------------------------------------------------------
function AdminDashboard() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({
    dealers: 0,
    users: 0,
    employees: 0,
    vehicles: 0,
    devices: 0,
    packages: 0,
  });
  const [licenseCounts, setLicenseCounts] = useState({
    total: 0,
    used: 0,
    available: 0,
  });

  useEffect(() => {
    (async () => {
      const [
        dealers,
        users,
        employees,
        vehicles,
        devices,
        packages,
        licensesActive,
      ] = await Promise.all([
        fetchTotal('users', { role: 'DEALER' }),
        fetchTotal('users', { role: 'USER' }),
        fetchTotal('users', { role: 'EMPLOYEE' }),
        fetchTotal('vehicles'),
        fetchTotal('devices'),
        fetchTotal('license-packages'),
        fetchTotal('licenses', { status: 'ACTIVE' }),
      ]);
      setCounts({ dealers, users, employees, vehicles, devices, packages });
      setLicenseCounts({
        total: licensesActive,
        used: licensesActive,
        available: 0,
      });
    })();
  }, []);

  const trendLabels = ["Dec '25", "Jan '26", "Feb '26", "Mar '26", "Apr '26", "May '26"];
  const trendSeries = useMemo(
    () => [
      { name: 'License Sold', color: '#3457d5', data: [1050, 1180, 1300, 1520, 1220, 1380] },
      { name: 'License Used', color: '#1f9d55', data: [640, 700, 760, 900, 620, 760] },
    ],
    []
  );

  const usageTotal = licenseCounts.used + licenseCounts.available;
  const donutData = [
    { label: 'Used License', value: licenseCounts.used, color: '#1f9d55' },
    { label: 'Available License', value: licenseCounts.available, color: '#f2b84b' },
    { label: 'Expired / Inactive', value: 0, color: '#dc2626' },
  ];

  return (
    <div className="page">
      <DashboardHeader
        title="Admin Dashboard"
        welcomeName={user?.name || 'Admin'}
      />

      <section className="stats-row stats-row--5">
        <StatCard icon={<FaStore />} color="purple" value={counts.dealers} label="Dealers Count" sublabel="Total registered dealers" />
        <StatCard icon={<FiUsers />} color="green" value={counts.users} label="Users Count" sublabel="Total system users" />
        <StatCard icon={<FiUser />} color="blue" value={counts.employees} label="Employee Count" sublabel="Total employees" />
        <StatCard icon={<FaCar />} color="orange" value={counts.vehicles} label="Vehicle Count" sublabel="Total vehicles" />
        <StatCard icon={<FiCpu />} color="teal" value={counts.devices} label="Devices Count" sublabel="Total devices" />
      </section>

      <section className="panel">
        <h2>License Overview</h2>
        <div className="license-overview-grid">
          <StatCard icon={<FiPackage />} color="purple" value={counts.packages} label="License Package Count" sublabel="Total license packages" />
          <StatCard icon={<FiShoppingCart />} color="blue" value={licenseCounts.total} label="License Sold" sublabel="Total licenses sold" />
          <StatCard icon={<FiCheckCircle />} color="red" value={licenseCounts.used} label="License Used" sublabel="Total licenses used" />
          <StatCard icon={<FiFileText />} color="green" value={licenseCounts.available} label="License Available" sublabel="Total available licenses" />
        </div>
      </section>

      <div className="dash-grid-2">
        <section className="panel">
          <h2>License Usage Summary</h2>
          <div className="donut-row">
            <DonutChart
              data={donutData}
              centerValue={usageTotal.toLocaleString()}
              centerLabel="Total Sold"
            />
            <ul className="donut-legend">
              {donutData.map((d) => (
                <li key={d.label}>
                  <span className="legend-dot" style={{ background: d.color }} />
                  <span className="legend-label">{d.label}</span>
                  <span className="legend-value">
                    {d.value.toLocaleString()} (
                    {usageTotal ? ((d.value / usageTotal) * 100).toFixed(2) : '0.00'}%)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="panel">
          <h2>Monthly License Trend (Sold vs Used)</h2>
          <TrendLineChart labels={trendLabels} series={trendSeries} />
        </section>
      </div>

      <section className="panel">
        <h2>System Summary</h2>
        <div className="system-summary-grid">
          <SystemSummaryItem icon={<FaStore />} color="blue" label="Active Dealers" value={counts.dealers} total={counts.dealers} />
          <SystemSummaryItem icon={<FiUser />} color="green" label="Active Users" value={counts.users} total={counts.users} />
          <SystemSummaryItem icon={<FiCpu />} color="orange" label="Active Devices" value={counts.devices} total={counts.devices} />
          <SystemSummaryItem icon={<FaCar />} color="purple" label="Active Vehicles" value={counts.vehicles} total={counts.vehicles} />
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DEALER dashboard
// ---------------------------------------------------------------------------
function DealerDashboard() {
  const { user } = useAuth();
  const dealerId =
    typeof user?.dealerId === 'object' ? user?.dealerId?._id : user?.dealerId || user?._id;

  const [packageCounts, setPackageCounts] = useState({
    packages: 0,
    totalLicenses: 0,
    available: 0,
    used: 0,
  });
  const [otherCounts, setOtherCounts] = useState({
    users: 0,
    devices: 0,
    vehicles: 0,
    expiring: 0,
  });

  useEffect(() => {
    (async () => {
      const [packages, users, devices, vehicles] = await Promise.all([
        fetchTotal('license-packages', { dealerId }),
        fetchTotal('users', { role: 'USER', dealerId }),
        fetchTotal('devices', { dealerId }),
        fetchTotal('vehicles', { dealerId }),
      ]);
      setPackageCounts((prev) => ({ ...prev, packages }));
      setOtherCounts((prev) => ({ ...prev, users, devices, vehicles }));

      try {
        const res = await resourceApis['license-packages'].getAll({ dealerId, limit: 1000 });
        const payload = res?.data?.data;
        const licensePackages = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(res?.data)
          ? res.data
          : [];

        const totalLicenses = licensePackages.reduce((sum, p) => sum + (p.licenseCount || 0), 0);
        const used = licensePackages.reduce((sum, p) => sum + (p.usedLicenseCount || 0), 0);
        const available = Math.max(totalLicenses - used, 0);

        setPackageCounts((prev) => ({ ...prev, totalLicenses, used, available }));
      } catch (err) {
        console.error('Error fetching dealer license package summary:', err);
      }

      try {
        const res = await resourceApis.licenses.getAll({ dealerId, limit: 1000 });
        const payload = res?.data?.data;
        const licenses = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(res?.data)
          ? res.data
          : [];

        const now = new Date();
        const in30Days = new Date();
        in30Days.setDate(now.getDate() + 30);

        const expiringCount = licenses.filter((l) => {
          if (!l.expiryDate) return false;
          const exp = new Date(l.expiryDate);
          return exp >= now && exp <= in30Days;
        }).length;

        setOtherCounts((prev) => ({ ...prev, expiring: expiringCount }));
      } catch (err) {
        console.error('Error fetching dealer license expiry summary:', err);
      }
    })();
  }, [dealerId]);

  const total = packageCounts.available + packageCounts.used;
  const donutData = [
    { label: 'Available License', value: packageCounts.available, color: '#1f9d55' },
    { label: 'Used License', value: packageCounts.used, color: '#f2b84b' },
  ];

  return (
    <div className="page">
      <DashboardHeader title="Dealer Dashboard" welcomeName={user?.name || 'Dealer'} />

      <section className="panel">
        <h2>License Packages Overview</h2>
        <div className="license-overview-grid license-overview-grid--4">
          <StatCard icon={<FiPackage />} color="purple" value={packageCounts.packages} label="License Packages" />
          <StatCard icon={<FiFileText />} color="blue" value={packageCounts.totalLicenses} label="Total License Count" />
          <StatCard icon={<FiCheckCircle />} color="green" value={packageCounts.available} label="Available License" />
          <StatCard icon={<FiUser />} color="orange" value={packageCounts.used} label="Used License" />
        </div>
      </section>

      <section className="stats-row stats-row--4">
        <StatCard icon={<FiUsersAlt />} color="blue" value={otherCounts.users} label="Users Count" linkTo="/resources/users" linkLabel="View all users" />
        <StatCard icon={<FiCpu />} color="green" value={otherCounts.devices} label="Devices Count" linkTo="/resources/devices" linkLabel="View all devices" />
        <StatCard icon={<FaCar />} color="orange" value={otherCounts.vehicles} label="Vehicles Count" linkTo="/resources/vehicles" linkLabel="View all vehicles" />
        <StatCard icon={<FiCalendar />} color="purple" value={otherCounts.expiring} label="License Expiry in 30 Days" linkTo="/resources/licenses" linkLabel="View expiring licenses" />
      </section>

      <div className="dash-grid-2">
        <section className="panel">
          <h2>License Usage Summary</h2>
          <div className="donut-row">
            <DonutChart data={donutData} centerValue={total.toLocaleString()} centerLabel="Total" />
            <ul className="donut-legend">
              {donutData.map((d) => (
                <li key={d.label}>
                  <span className="legend-dot" style={{ background: d.color }} />
                  <span className="legend-label">{d.label}</span>
                  <span className="legend-value">
                    {d.value.toLocaleString()} (
                    {total ? ((d.value / total) * 100).toFixed(1) : '0.0'}%)
                  </span>
                </li>
              ))}
              <li className="donut-legend__rate">
                <span className="legend-label">Utilization Rate</span>
                <span className="legend-value">
                  {total ? ((packageCounts.used / total) * 100).toFixed(1) : '0.0'}%
                </span>
              </li>
            </ul>
          </div>
        </section>

        <ExpiryCallout
          count={otherCounts.expiring}
          description="These licenses will expire in the next 30 days."
          linkTo="/resources/licenses"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// USER / SUB_USER dashboard
// ---------------------------------------------------------------------------
function UserDashboard() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({
    vehicles: 0,
    userAccess: 0,
    resourceAccess: 0,
    vehicleGroups: 0,
    expiring: 0,
  });
  const [expiringLicenses, setExpiringLicenses] = useState([]);

  useEffect(() => {
    (async () => {
      const [vehicles, vehicleGroups] = await Promise.all([
        fetchTotal('vehicles', { ownerUserId: user?._id }),
        fetchTotal('vehicle-groups', { ownerUserId: user?._id }),
      ]);
      let userAccess = 0;
      let resourceAccess = 0;
      try {
        const res = await resourceApis['user-access'].getAll({ ownerUserId: user?._id, limit: 1000 });
        userAccess = (res.data?.data || []).length;
      } catch (err) {
        console.error('Error fetching user access count:', err);
      }
      try {
        const res = await resourceApis['resource-access'].getAll({ ownerUserId: user?._id, limit: 1000 });
        resourceAccess = (res.data?.data || []).length;
      } catch (err) {
        console.error('Error fetching resource access count:', err);
      }
      setCounts({ vehicles, userAccess, resourceAccess, vehicleGroups, expiring: 0 });
      setExpiringLicenses([]);
    })();
  }, [user?._id]);

  const statusData = [
    { label: 'Online', value: Math.round(counts.vehicles * 0.43), color: '#1f9d55' },
    { label: 'Offline', value: Math.round(counts.vehicles * 0.39), color: '#f2b84b' },
    { label: 'Inactive', value: Math.round(counts.vehicles * 0.18), color: '#dc2626' },
  ];

  return (
    <div className="page">
      <DashboardHeader title="User Dashboard" welcomeName={user?.name || 'User'} />

      <section className="stats-row stats-row--5">
        <StatCard icon={<FaCar />} color="blue" value={counts.vehicles} label="Vehicle Count" sublabel="Total vehicles you can access" />
        <StatCard icon={<FiUser />} color="green" value={counts.userAccess} label="User Access Count" sublabel="Users you can manage" />
        <StatCard icon={<FiFolder />} color="purple" value={counts.resourceAccess} label="Resource Access Count" sublabel="Resources you can access" />
        <StatCard icon={<FiUsersAlt />} color="orange" value={counts.vehicleGroups} label="Vehicle Groups Count" sublabel="Groups you have access to" />
        <StatCard icon={<FiCalendar />} color="red" value={counts.expiring} label="License Expiry in 30 Days" sublabel="Licenses expiring soon" />
      </section>

      <div className="dash-grid-2">
        <section className="panel">
          <h2>Vehicle Overview</h2>
          <div className="donut-row">
            <DonutChart data={statusData} centerValue={counts.vehicles} centerLabel="Total" />
            <ul className="donut-legend">
              {statusData.map((d) => (
                <li key={d.label}>
                  <span className="legend-dot" style={{ background: d.color }} />
                  <span className="legend-label">{d.label}</span>
                  <span className="legend-value">
                    {d.value} (
                    {counts.vehicles ? ((d.value / counts.vehicles) * 100).toFixed(2) : '0.00'}%)
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <Link to="/resources/vehicles" className="btn btn-secondary btn-block panel-cta">
            <FiTruck /> View all vehicles
          </Link>
        </section>

        <section className="panel">
          <div className="panel-header-row">
            <h2>License Expiry in Next 30 Days</h2>
            <Link to="/resources/licenses" className="panel-view-all">
              View all &rarr;
            </Link>
          </div>
          {expiringLicenses.length === 0 ? (
            <div className="empty-state">No licenses expiring in the next 30 days.</div>
          ) : (
            <table className="expiry-table">
              <thead>
                <tr>
                  <th>Vehicle / Device</th>
                  <th>License Type</th>
                  <th>Expiry Date</th>
                  <th>Days Left</th>
                </tr>
              </thead>
              <tbody>
                {expiringLicenses.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="expiry-table__vehicle">
                        <FaCar />
                        <div>
                          <strong>{row.vehicleNumber}</strong>
                          <small>{row.deviceLabel}</small>
                        </div>
                      </div>
                    </td>
                    <td>{row.licenseType}</td>
                    <td>{row.expiryDate}</td>
                    <td>
                      <span className={`days-pill days-pill--${row.urgency}`}>
                        {row.daysLeft} days
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Link to="/resources/licenses" className="btn btn-secondary btn-block panel-cta">
            <FiCalendar /> View all expiring licenses
          </Link>
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Entry point — switches on role
// ---------------------------------------------------------------------------
export default function Dashboard() {
  const { user } = useAuth();

  if (user?.role === 'ADMIN') return <AdminDashboard />;
  if (user?.role === 'DEALER') return <DealerDashboard />;
  return <UserDashboard />;
}