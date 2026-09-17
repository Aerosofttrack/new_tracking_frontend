// components/SubuserAccessPanel.jsx
import React, { useState, useEffect } from 'react';
import { FiShield, FiCheck, FiX, FiRefreshCw, FiAlertCircle, FiUserPlus } from 'react-icons/fi';
import { resourceApis, subUserApi } from '../api/services.js';
import { getErrorMessage } from '../api/client.js';
import './SubUserAccessPanel.css';

export default function SubUserAccessPanel({ user, resourceIcon, resource }) {
  const [subUsers, setSubUsers] = useState([]);
  const [accessMap, setAccessMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [updating, setUpdating] = useState(false);

  // Define role checks based on user
  const isAdmin = user?.role === 'ADMIN';
  const isDealer = user?.role === 'DEALER';
  const isUser = user?.role === 'USER';

  // Fetch sub-users and their access status
  const loadData = async () => {
    setLoading(true);
    setError('');
    
    try {
      let response;
      
      // Different API calls based on role
      if (isAdmin) {
        // ADMIN can see all with optional filters
        response = await subUserApi.getWithAccess();
      } else if (isDealer) {
        // DEALER sees sub-users for their dealer
        const dealerId = typeof user.dealerId === 'object' ? user.dealerId._id : user.dealerId;
        response = await subUserApi.getWithAccess(null, null, dealerId);
      } else if (isUser) {
        // USER sees only their own sub-users
        response = await subUserApi.getWithAccess(user._id);
      }
      
      const data = response?.data?.data || [];
      console.log('Sub-user data loaded:', data);
      
      // Process the data
      const subUsersList = data.map(item => ({
        ...item.subUser,
        accessStatus: item.status,
        accessRecordId: item.accessRecordId,
        owner: item.owner
      }));
      
      setSubUsers(subUsersList);
      
      // Create access map
      const accessMapData = {};
      data.forEach(item => {
        const subUserId = item.subUser?._id;
        if (subUserId) {
          accessMapData[subUserId] = {
            hasAccess: item.status === 'ACTIVE',
            recordId: item.accessRecordId,
            status: item.status,
            isPending: item.status === 'PENDING'
          };
        }
      });
      
      setAccessMap(accessMapData);
      
    } catch (err) {
      setError(getErrorMessage(err));
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      loadData();
    }
  }, [user]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  // Toggle access for a sub-user
  const toggleAccess = async (subUser) => {
    const currentAccess = accessMap[subUser._id];
    const hasAccess = currentAccess?.hasAccess || false;
    const isPending = currentAccess?.isPending || false;
    
    setUpdating(true);
    
    try {
      // Get dealerId
      let dealerId = user.dealerId;
      if (typeof dealerId === 'object' && dealerId !== null) {
        dealerId = dealerId._id || dealerId;
      }
      
      // If dealerId is null or undefined, try to get it from the sub-user
      if (!dealerId && subUser.dealerId) {
        dealerId = typeof subUser.dealerId === 'object' ? subUser.dealerId._id : subUser.dealerId;
      }
      
      if (hasAccess) {
        // REVOKE access - delete the user access record
        const recordId = accessMap[subUser._id].recordId;
        if (recordId) {
          await resourceApis['user-access'].remove(recordId);
        }
        
        setAccessMap(prev => {
          const newMap = { ...prev };
          delete newMap[subUser._id];
          return newMap;
        });
        
        showToast(`Access revoked for ${subUser.name || subUser.username}`);
      } else {
        const recordId = currentAccess?.recordId;
        
        const userAccessData = {
          dealerId: dealerId,
          ownerUserId: user._id,
          sharedUserId: subUser._id,
          permissions: {
            dashboard: true,
            liveTracking: true,
            playback: true,
            reports: true,
            alerts: true,
            settings: false
          },
          status: 'ACTIVE',
          createdBy: user._id
        };
        
        if (recordId) {
          await resourceApis['user-access'].update(recordId, {
            status: 'ACTIVE'
          });
        } else {
          await resourceApis['user-access'].create(userAccessData);
        }
        
        setAccessMap(prev => ({
          ...prev,
          [subUser._id]: {
            hasAccess: true,
            recordId: recordId || 'temp',
            status: 'ACTIVE',
            isPending: false
          }
        }));
        
        showToast(`Access granted for ${subUser.name || subUser.username}`);
      }
    } catch (err) {
      console.error('Error in toggleAccess:', err);
      showToast('Failed to update access');
    } finally {
      setUpdating(false);
      await loadData();
    }
  };

  const hasSubUsers = subUsers.length > 0;
  const approvedCount = Object.values(accessMap).filter(a => a.hasAccess).length;
  const pendingCount = Object.values(accessMap).filter(a => a.isPending).length;

  if (loading) {
    return (
      <div className="subuser-access-panel">
        <div className="panel-loading">
          <div className="spinner" />
          <span>Loading sub-users...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="subuser-access-panel">
        <div className="alert alert-error">
          <FiAlertCircle className="alert-icon" />
          <div className="alert-content">
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="subuser-access-panel">
      {toast && (
        <div className="toast">
          <FiCheck className="toast-icon" />
          {toast}
        </div>
      )}

      <div className="panel-header">
        <div>
          <h2>
            <span className="resource-icon">{resourceIcon || <FiShield />}</span>
            User Access
          </h2>
          <p>Manage your sub-users and their access</p>
        </div>
        <div className="panel-actions">
          <span className="access-count">
            <FiShield className="count-icon" />
            {approvedCount} approved · {pendingCount} pending
          </span>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={loadData}
            disabled={loading}
          >
            <FiRefreshCw className={loading ? 'spinning' : ''} /> Refresh
          </button>
        </div>
      </div>

      {!hasSubUsers ? (
        <div className="empty-state">
          <FiUserPlus className="empty-icon" />
          <p>No sub-users found</p>
          <p className="empty-hint">
            {isUser ? 'You don\'t have any sub-users yet.' : 'No sub-users found for this account.'}
          </p>
        </div>
      ) : (
        <div className="access-table-wrap">
          <table className="access-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>User Status</th>
                <th>Access Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {subUsers.map((subUser) => {
                const access = accessMap[subUser._id];
                const hasAccess = access?.hasAccess || false;
                const isPending = access?.isPending || false;
                const isUpdating = updating;
                
                return (
                  <tr key={subUser._id} className={hasAccess ? 'has-access' : ''}>
                    <td>
                      <strong>{subUser.name || '—'}</strong>
                    </td>
                    <td>{subUser.username}</td>
                    <td>{subUser.email || '—'}</td>
                    <td>
                      <span className={`status-badge ${subUser.status?.toLowerCase() || 'pending'}`}>
                        {subUser.status || 'PENDING'}
                      </span>
                    </td>
                    <td>
                      {isPending ? (
                        <span className="status-badge pending">
                          <FiX className="status-icon" /> Pending
                        </span>
                      ) : hasAccess ? (
                        <span className="status-badge approved">
                          <FiCheck className="status-icon" /> Active
                        </span>
                      ) : (
                        <span className="status-badge denied">
                          <FiX className="status-icon" /> No Access
                        </span>
                      )}
                    </td>
                    <td>
                      {isPending ? (
                        <button
                          type="button"
                          className="access-toggle approve"
                          onClick={() => toggleAccess(subUser)}
                          disabled={isUpdating}
                        >
                          {isUpdating ? 'Processing...' : '✅ Approve'}
                        </button>
                      ) : hasAccess ? (
                        <button
                          type="button"
                          className="access-toggle revoke"
                          onClick={() => toggleAccess(subUser)}
                          disabled={isUpdating}
                        >
                          {isUpdating ? 'Processing...' : '🔒 Revoke'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="access-toggle grant"
                          onClick={() => toggleAccess(subUser)}
                          disabled={isUpdating}
                        >
                          {isUpdating ? 'Processing...' : '🔓 Grant'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="access-footer">
        <div className="access-info-text">
          <p>
            <strong>How it works:</strong>
          </p>
          <ul>
            <li>
              <span className="badge-pending">⏳ Pending</span> - 
              Admin created this sub-user. Click <strong>"Approve"</strong> to grant access.
            </li>
            <li>
              <span className="badge-approved">✅ Active</span> - 
              Sub-user has full access to your dashboard.
            </li>
            <li>
              <span className="badge-revoke">🔒 Revoke</span> - 
              Remove access for this sub-user.
            </li>
            <li>
              <span className="badge-grant">🔓 Grant</span> - 
              Give access to this sub-user.
            </li>
          </ul>
          <p className="access-note">
            <strong>Note:</strong> Only approved sub-users (status: ACTIVE) will have access to your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}