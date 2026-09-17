// services/liveTrackingApi.js
// const LIVE_TRACKING_API_URL = 'http://13.200.197.115:8000';
const LIVE_TRACKING_API_URL = process.env.REACT_APP_LIVE_TRACKING_API_URL;

console.log("hello from the liveTrackingApi", LIVE_TRACKING_API_URL)
    

// Add the main admin API URL for user/device lookups
// const ADMIN_API_URL = 'https://gps-backend-3hl6.onrender.com/api/';
const ADMIN_API_URL = process.env.REACT_APP_API_URL;

console.log("hello from the admin API", ADMIN_API_URL)

async function request(path, options = {}, baseUrl = LIVE_TRACKING_API_URL) {
  const token = localStorage.getItem('token');
  // Remove any leading slash from path to avoid double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${baseUrl}${cleanPath}`;
  
  console.log('Request URL:', url); // Debug log
  
  const res = await fetch(url, {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Device management with vehicle info
  listDevices: () => request('/api/devices'),
  listConnectedDevices: () => request('/api/devices/connected'),
  getDevice: (imei) => request(`/api/devices/${imei}`),
  getDeviceStatus: (imei) => request(`/api/devices/${imei}/status`),

  // Get devices assigned to the current user (using main admin API)
  getUserDevices: async () => {
    try {
      // Use the admin API with the correct path
      // ADMIN_API_URL already includes /api, so we just need /devices/user
      const response = await request('/devices/user', {}, ADMIN_API_URL);
      return response.data || response;
    } catch (error) {
      console.error('Error fetching user devices from admin API:', error);
      // Fallback to live tracking API
      return request('/api/devices/user');
    }
  },

  // Get vehicles with location data
  getVehiclesWithLocations: async () => {
    try {
      const response = await request('/vehicles/locations', {}, ADMIN_API_URL);
      return response.data || response;
    } catch (error) {
      console.error('Error fetching vehicle locations:', error);
      return { vehicles: [] };
    }
  },

  registerDevice: (data) =>
    request('/devices', { method: 'POST', body: JSON.stringify(data) }, ADMIN_API_URL),

  updateDevice: (imei, data) =>
    request(`/devices/${imei}`, { method: 'PUT', body: JSON.stringify(data) }, ADMIN_API_URL),

  deleteDevice: (imei) =>
    request(`/devices/${imei}`, { method: 'DELETE' }, ADMIN_API_URL),

  // Location APIs (live tracking)
  getLiveLocations: () => request('/api/locations/live'),
  getLatestLocation: (imei) => request(`/api/locations/${imei}/latest`),
  getLocationHistory: (imei, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/locations/${imei}/history${qs ? `?${qs}` : ''}`);
  },
};
