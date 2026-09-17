// config/dashboardNav.js
// Defines the sidebar menu per role, matching the AERO GPS-SCHEMA mockups.
// Each item: key (unique), label, icon (lookup key used in Layout.jsx iconMap), path.

export const ROLE_NAV = {
ADMIN: [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/' },
  { key: 'dealers', label: 'Dealers', icon: 'dealers', path: '/resources/dealers' },
  { key: 'users', label: 'Users', icon: 'users', path: '/resources/users' },
  { key: 'employees', label: 'Employees', icon: 'employees', path: '/resources/employees' },
  { key: 'vehicles', label: 'Vehicles', icon: 'vehicles', path: '/resources/vehicles' },
  { key: 'live-tracking', label: 'Live Tracking', icon: 'live-tracking', path: '/live-tracking' },
  { key: 'devices', label: 'Devices', icon: 'devices', path: '/resources/devices' },
  { key: 'license-packages', label: 'License Packages', icon: 'packages', path: '/resources/license-packages' },
  { key: 'orders', label: 'My Orders', icon: 'orders', path: '/resources/orders' }, // ADD
  { key: 'resources', label: 'Resources', icon: 'resources', path: '/resources/resource-access' },
  { key: 'reports', label: 'Reports', icon: 'reports', path: '/reports' },
  { key: 'alerts', label: 'Alerts', icon: 'alerts', path: '/alerts' },
  { key: 'subscribers', label: 'Subscribers', icon: 'subscribers', path: '/subscribers' },
  { key: 'settings', label: 'Settings', icon: 'settings', path: '/settings' },
],

DEALER: [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/' },
  { key: 'devices', label: 'Devices', icon: 'devices', path: '/resources/devices' },
  { key: 'vehicles', label: 'Vehicles', icon: 'vehicles', path: '/resources/vehicles' },
  { key: 'live-tracking', label: 'Live Tracking', icon: 'live-tracking', path: '/live-tracking' },
  { key: 'users', label: 'Users', icon: 'users', path: '/resources/users' },
  { key: 'license-packages', label: 'License Packages', icon: 'packages', path: '/resources/license-packages' },
  { key: 'orders', label: 'My Orders', icon: 'orders', path: '/resources/orders' }, // ADD
  { key: 'resources', label: 'Resources', icon: 'resources', path: '/resources/resource-access' },
  { key: 'reports', label: 'Reports', icon: 'reports', path: '/reports' },
  { key: 'alerts', label: 'Alerts', icon: 'alerts', path: '/alerts' },
  { key: 'geofence', label: 'Geofence', icon: 'geofence', path: '/geofence' },
  { key: 'subscriptions', label: 'Subscriptions', icon: 'subscriptions', path: '/subscriptions' },
  { key: 'profile', label: 'Profile', icon: 'profile', path: '/profile' },
  { key: 'settings', label: 'Settings', icon: 'settings', path: '/settings' },
  // { key: 'vehicle-groups', label: 'Vehicle Groups', icon: 'vehicle-groups', path: '/resources/vehicle-groups' },
],

USER: [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/' },
  { key: 'vehicles', label: 'Vehicles', icon: 'vehicles', path: '/resources/vehicles' },
  { key: 'live-tracking', label: 'Live Tracking', icon: 'live-tracking', path: '/live-tracking' },
  { key: 'vehicle-groups', label: 'Vehicle Groups', icon: 'vehicle-groups', path: '/resources/vehicle-groups' },
  { key: 'orders', label: 'My Orders', icon: 'orders', path: '/resources/orders' }, // ADD
  { key: 'reports', label: 'Reports', icon: 'reports', path: '/reports' },
  { key: 'geofence', label: 'Geofence', icon: 'geofence', path: '/geofence' },
  { key: 'alerts', label: 'Alerts', icon: 'alerts', path: '/alerts' },
  { key: 'resources', label: 'Resources', icon: 'resources', path: '/resources/resource-access' },
  { key: 'profile', label: 'Profile', icon: 'profile', path: '/profile' },
  { key: 'settings', label: 'Settings', icon: 'settings', path: '/settings' },
],

SUB_USER: [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/' },
  { key: 'vehicles', label: 'Vehicles', icon: 'vehicles', path: '/resources/vehicles' },
  { key: 'live-tracking', label: 'Live Tracking', icon: 'live-tracking', path: '/live-tracking' },
  { key: 'orders', label: 'My Orders', icon: 'orders', path: '/resources/orders' }, // ADD (SUB_USER is in orders' roles list too)
  { key: 'reports', label: 'Reports', icon: 'reports', path: '/reports' },
  { key: 'alerts', label: 'Alerts', icon: 'alerts', path: '/alerts' },
  { key: 'profile', label: 'Profile', icon: 'profile', path: '/profile' },
],
  ADMIN: [
    { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/' },
    { key: 'dealers', label: 'Dealers', icon: 'dealers', path: '/resources/dealers' },
    { key: 'users', label: 'Users', icon: 'users', path: '/resources/users' },
    { key: 'employees', label: 'Employees', icon: 'employees', path: '/resources/employees' },
    { key: 'live-tracking', label: 'Live Tracking', icon: 'live-tracking', path: '/live-tracking' },
    { key: 'vehicles', label: 'Vehicles', icon: 'vehicles', path: '/resources/vehicles' },
    { key: 'devices', label: 'Devices', icon: 'devices', path: '/resources/devices' },
    { key: 'license-packages', label: 'License Packages', icon: 'packages', path: '/resources/license-packages' },
    { key: 'reports', label: 'Reports', icon: 'reports', path: '/reports' },
    { key: 'alerts', label: 'Alerts', icon: 'alerts', path: '/alerts' },
    { key: 'subscribers', label: 'Subscribers', icon: 'subscribers', path: '/subscribers' },
    { key: 'settings', label: 'Settings', icon: 'settings', path: '/settings' },
  ],

  DEALER: [
    { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/' },
    { key: 'devices', label: 'Devices', icon: 'devices', path: '/resources/devices' },
    { key: 'vehicles', label: 'Vehicles', icon: 'vehicles', path: '/resources/vehicles' },
    { key: 'live-tracking', label: 'Live Tracking', icon: 'live-tracking', path: '/live-tracking' },
    { key: 'users', label: 'Users', icon: 'users', path: '/resources/users' },
    { key: 'license-packages', label: 'License Packages', icon: 'packages', path: '/resources/license-packages' },
    { key: 'reports', label: 'Reports', icon: 'reports', path: '/reports' },
    { key: 'alerts', label: 'Alerts', icon: 'alerts', path: '/alerts' },
    { key: 'geofence', label: 'Geofence', icon: 'geofence', path: '/geofence' },
    { key: 'subscriptions', label: 'Subscriptions', icon: 'subscriptions', path: '/subscriptions' },
    { key: 'profile', label: 'Profile', icon: 'profile', path: '/profile' },
    { key: 'settings', label: 'Settings', icon: 'settings', path: '/settings' },
  ],

  USER: [
    { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/' },
    { key: 'vehicles', label: 'Vehicles', icon: 'vehicles', path: '/resources/vehicles' },
    { key: 'live-tracking', label: 'Live Tracking', icon: 'live-tracking', path: '/live-tracking' },
    { key: 'vehicle-groups', label: 'Vehicle Groups', icon: 'vehicle-groups', path: '/resources/vehicle-groups' },
    { key: 'reports', label: 'Reports', icon: 'reports', path: '/reports' },
    { key: 'geofence', label: 'Geofence', icon: 'geofence', path: '/geofence' },
    { key: 'alerts', label: 'Alerts', icon: 'alerts', path: '/alerts' },
    { key: 'resources', label: 'Resources', icon: 'resources', path: '/resources/resource-access' },
    { key: 'profile', label: 'Profile', icon: 'profile', path: '/profile' },
    { key: 'settings', label: 'Settings', icon: 'settings', path: '/settings' },
  ],

  // SUB_USER inherits a trimmed version of USER's menu — reuse and filter
  // out anything that doesn't make sense for a sub-account.
  SUB_USER: [
    { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/' },
    { key: 'vehicles', label: 'Vehicles', icon: 'vehicles', path: '/resources/vehicles' },
    { key: 'live-tracking', label: 'Live Tracking', icon: 'live-tracking', path: '/live-tracking' },
    { key: 'reports', label: 'Reports', icon: 'reports', path: '/reports' },
    { key: 'alerts', label: 'Alerts', icon: 'alerts', path: '/alerts' },
    { key: 'profile', label: 'Profile', icon: 'profile', path: '/profile' },
  ],
};

export function getNavForRole(role) {
  return ROLE_NAV[role] || [];
}