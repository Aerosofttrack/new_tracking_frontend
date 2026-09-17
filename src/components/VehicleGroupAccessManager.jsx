// components/VehicleGroupAccessManager.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { FiUsers, FiCheck, FiX, FiRefreshCw, FiAlertCircle, FiUserPlus, FiUserMinus } from 'react-icons/fi';
import { resourceApis } from '../api/services.js';
import { getErrorMessage } from '../api/client.js';
import './VehicleGroupAccessManager.css';

export default function VehicleGroupAccessManager({ 
  vehicleGroup, 
  ownerUser,
  onAccessChange 
}) {
  const [subUsers, setSubUsers] = useState([]);
  const [accessMap, setAccessMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [updating, setUpdating] = useState(false);

  // Fetch sub-users and their access to this vehicle group
  const loadData = useCallback(async () => {
    if (!ownerUser?._id || !vehicleGroup?._id) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Fetch all sub-users for this owner
      const subUsersRes = await resourceApis['sub-users'].getAll({
        ownerUserId: ownerUser._id,
        limit: 1000
      });
      
      const subUsersList = subUsersRes.data.data || [];
      setSubUsers(subUsersList);
      
      // Fetch resource access records for this vehicle group
      const accessRes = await resourceApis['resource-access'].getAll({
        resourceType: 'VEHICLE_GROUP',
        resourceId: vehicleGroup._id,
        limit: 1000
      });
      
      const accessRecords = accessRes.data.data || [];
      
      // Create a map of sharedUserId -> access details
      const accessMapData = {};
      accessRecords.forEach(record => {
        const sharedUserId = typeof record.sharedUserId === 'object' 
          ? record.sharedUserId._id 
          : record.sharedUserId;
        if (sharedUserId) {
          accessMapData[sharedUserId] = {
            hasAccess: true,
            recordId: record._id,
            userAccessId: record.userAccessId,
            permissions: record.permissions || {}
          };
        }
      });
      
      setAccessMap(accessMapData);
      
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [ownerUser, vehicleGroup]);

  useEffect(() => {
    if (vehicleGroup?._id && ownerUser?._id) {
      loadData();
    }
  }, [vehicleGroup, ownerUser, loadData]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  // Toggle access for a sub-user
  const toggleAccess = async (subUser) => {
    const hasAccess = accessMap[subUser._id]?.hasAccess || false;
    setUpdating(true);
    
    try {
      if (hasAccess) {
        // Remove access - delete the resource access record
        const recordId = accessMap[subUser._id].recordId;
        if (recordId) {
          await resourceApis['resource-access'].remove(recordId);
        }
        
        // Update local state
        setAccessMap(prev => {
          const newMap = { ...prev };
          delete newMap[subUser._id];
          return newMap;
        });
        
        showToast(`Access removed for ${subUser.name || subUser.username}`);
      } else {
        // First, check if user_access exists for this sub-user
        const userAccessRes = await resourceApis['user-access'].getAll({
          ownerUserId: ownerUser._id,
          sharedUserId: subUser._id,
          limit: 1
        });
        
        let userAccessId = null;
        const userAccessRecords = userAccessRes.data.data || [];
        
        if (userAccessRecords.length > 0) {
          // Use existing user_access
          userAccessId = userAccessRecords[0]._id;
        } else {
          // Create user_access first
          const newUserAccess = await resourceApis['user-access'].create({
            dealerId: ownerUser.dealerId,
            ownerUserId: ownerUser._id,
            sharedUserId: subUser._id,
            status: 'APPROVED',
            createdBy: ownerUser._id
          });
          userAccessId = newUserAccess.data.data._id;
        }
        
        // Now create resource_access
        await resourceApis['resource-access'].create({
          dealerId: ownerUser.dealerId,
          ownerUserId: ownerUser._id,
          sharedUserId: subUser._id,
          userAccessId: userAccessId,
          resourceType: 'VEHICLE_GROUP',
          resourceId: vehicleGroup._id,
          permissions: {
            tracking: true,
            playback: true,
            reports: true,
            history: true,
            commands: false
          },
          status: 'ACTIVE',
          createdBy: ownerUser._id
        });
        
        // Update local state
        setAccessMap(prev => ({
          ...prev,
          [subUser._id]: {
            hasAccess: true,
            recordId: 'temp',
            userAccessId: userAccessId,
            permissions: {
              tracking: true,
              playback: true,
              reports: true,
              history: true,
              commands: false
            }
          }
        }));
        
        showToast(`Access granted for ${subUser.name || subUser.username}`);
      }
      
      // Notify parent component about the change
      if (onAccessChange) {
        onAccessChange();
      }
      
      // Reload data to get updated records
      await loadData();
      
    } catch (err) {
      setError(getErrorMessage(err));
      showToast('Failed to update access');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="vehicle-group-access-manager">
        <div className="access-loading">
          <div className="spinner" />
          <span>Loading sub-user access...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vehicle-group-access-manager">
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

  if (subUsers.length === 0) {
    return (
      <div className="vehicle-group-access-manager">
        <div className="access-empty-state">
          <FiUsers className="empty-icon" />
          <p>No sub-users available</p>
          <p className="empty-hint">Create sub-users first to grant them access to this vehicle group.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vehicle-group-access-manager">
      {toast && (
        <div className="toast">
          <FiCheck className="toast-icon" />
          {toast}
        </div>
      )}

      <div className="access-header">
        <div className="access-title">
          <FiUsers className="title-icon" />
          <h3>Sub-User Access Management</h3>
        </div>
        <button 
          type="button" 
          className="btn btn-secondary btn-sm" 
          onClick={loadData}
          disabled={loading}
        >
          <FiRefreshCw className={loading ? 'spinning' : ''} /> Refresh
        </button>
      </div>

      <div className="access-info">
        <p>Grant or revoke access to this vehicle group for your sub-users.</p>
        <span className="sub-user-count">
          {subUsers.length} sub-user{subUsers.length > 1 ? 's' : ''} available
        </span>
      </div>

      <div className="access-table-wrap">
        <table className="access-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Status</th>
              <th>Access</th>
            </tr>
          </thead>
          <tbody>
            {subUsers.map((subUser) => {
              const hasAccess = accessMap[subUser._id]?.hasAccess || false;
              const isUpdating = updating;
              
              return (
                <tr key={subUser._id} className={hasAccess ? 'has-access' : ''}>
                  <td>{subUser.name || '—'}</td>
                  <td>{subUser.username}</td>
                  <td>{subUser.email || '—'}</td>
                  <td>
                    <span className={`status-badge ${subUser.status?.toLowerCase() || 'pending'}`}>
                      {subUser.status || 'PENDING'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`access-toggle ${hasAccess ? 'granted' : 'denied'}`}
                      onClick={() => toggleAccess(subUser)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <span className="updating-spinner">...</span>
                      ) : hasAccess ? (
                        <>
                          <FiCheck /> Access Granted
                        </>
                      ) : (
                        <>
                          <FiX /> No Access
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="access-footer">
        <div className="access-stats">
          <span className="granted-count">
            <FiCheck className="stat-icon" />
            {Object.keys(accessMap).filter(id => accessMap[id]?.hasAccess).length} sub-users have access
          </span>
        </div>
      </div>
    </div>
  );
}