// api/services.js - Add notification API
import { apiClient } from './client.js';

export const authApi = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (payload) => apiClient.post('/auth/register', payload),
  getProfile: () => apiClient.get('/auth/me'),
};

export function createResourceApi(endpoint) {
  return {
    getAll: (params) => apiClient.get(`/${endpoint}`, { params }),
    getById: (id) => apiClient.get(`/${endpoint}/${id}`),
    create: (payload) => apiClient.post(`/${endpoint}`, payload),
    update: (id, payload) => apiClient.patch(`/${endpoint}/${id}`, payload),
    remove: (id) => apiClient.delete(`/${endpoint}/${id}`),
  };
}

// Add notification API
export const notificationApi = {
  getNotifications: (params) => apiClient.get('/notifications', { params }),
  getUnreadCount: () => apiClient.get('/notifications/unread-count'),
  markAsRead: (id) => apiClient.patch(`/notifications/${id}/read`),
  approveSubUser: (subUserId) => apiClient.patch(`/notifications/${subUserId}/approve`),
  rejectSubUser: (subUserId) => apiClient.patch(`/notifications/${subUserId}/reject`),
};

export const subUserApi = {
  // Get sub-users with access (role-based)
  getWithAccess: (ownerUserId, status, dealerId) => {
    const params = {};
    if (ownerUserId) params.ownerUserId = ownerUserId;
    if (status) params.status = status;
    if (dealerId) params.dealerId = dealerId;
    return apiClient.get('/sub-users/with-access', { params });
  },
  
  // Get approved sub-users
  getApproved: (ownerUserId, dealerId) => {
    const params = {};
    if (ownerUserId) params.ownerUserId = ownerUserId;
    if (dealerId) params.dealerId = dealerId;
    return apiClient.get('/sub-users/approved', { params });
  },
  
  // Get pending sub-users
  getPending: (ownerUserId, dealerId) => {
    const params = {};
    if (ownerUserId) params.ownerUserId = ownerUserId;
    if (dealerId) params.dealerId = dealerId;
    return apiClient.get('/sub-users/pending', { params });
  },
  
  // Get sub-users for dropdown
  getForDropdown: (ownerUserId, dealerId) => {
    const params = {};
    if (ownerUserId) params.ownerUserId = ownerUserId;
    if (dealerId) params.dealerId = dealerId;
    return apiClient.get('/sub-users/for-dropdown', { params });
  },
};

// api/services.js
export const resourceApis = {
  users: createResourceApi('users'),
  'sub-users': createResourceApi('users'),
  dealers: createResourceApi('users'),
  employees: createResourceApi('users'),
  'license-packages': createResourceApi('license-packages'), // This should work
  licenses: createResourceApi('licenses'),
  'license-histories': createResourceApi('license-histories'),
  vehicles: createResourceApi('vehicles'),
  'vehicle-groups': createResourceApi('vehicle-groups'),
  'vehicle-group-members': createResourceApi('vehicle-group-members'),
  'user-access': createResourceApi('user-access'),
  'resource-access': createResourceApi('resource-access'),
  devices: createResourceApi('devices'),
  'device-assignments': createResourceApi('device-assignments'),
  orders: createResourceApi('orders'),
};

export const healthApi = {
  check: () => apiClient.get('/health'),
};