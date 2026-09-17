// components/UserAccessPanel.jsx
import React, { useState, useEffect } from 'react';
import { FiPlus, FiCheck, FiX, FiRefreshCw, FiAlertCircle, FiUserPlus, FiUsers, FiShield, FiEdit2 } from 'react-icons/fi';
import { resourceApis } from '../api/services.js';
import { getErrorMessage } from '../api/client.js';
import Modal from './Modal.jsx';
import ResourceForm from './ResourceForm.jsx';
import './UserAccessPanel.css';

export default function UserAccessPanel({ user, resourceIcon, resource }) {
  const [subUsers, setSubUsers] = useState([]);
  const [accessMap, setAccessMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [updating, setUpdating] = useState(false);
  
  // Modal state for creating sub-user
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch sub-users and their access status
  const loadData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // STEP 1: Fetch all sub-users where parentId matches this user
      const subUsersRes = await resourceApis['sub-users'].getAll({
        parentId: user._id,
        role: 'SUB_USER',
        limit: 1000
      });
      
      const subUsersList = subUsersRes.data.data || [];
      setSubUsers(subUsersList);
      
      // STEP 2: Fetch existing user access records for this user
      const accessRes = await resourceApis['user-access'].getAll({
        ownerUserId: user._id,
        limit: 1000
      });
      
      const accessRecords = accessRes.data.data || [];
      
      // STEP 3: Create a map of sharedUserId -> access details
      const accessMapData = {};
      accessRecords.forEach(record => {
        const sharedUserId = typeof record.sharedUserId === 'object' 
          ? record.sharedUserId._id 
          : record.sharedUserId;
        if (sharedUserId) {
          accessMapData[sharedUserId] = {
            hasAccess: record.status === 'ACTIVE',
            recordId: record._id,
            status: record.status,
            isPending: record.status === 'PENDING'
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
        
        let dealerId = user.dealerId;
        if (typeof dealerId === 'object' && dealerId !== null) {
          dealerId = dealerId._id || dealerId;
        }
        
        if (!dealerId && subUser.dealerId) {
          dealerId = typeof subUser.dealerId === 'object' ? subUser.dealerId._id : subUser.dealerId;
        }
        
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

  // Open modal for creating sub-user
  const openCreate = () => {
    setModalMode('create');
    setSelectedRecord(null);
    setFormError('');
    setModalOpen(true);
  };

  // Handle sub-user creation
  const handleCreateSubUser = async (payload) => {
    setSubmitting(true);
    setFormError('');

    const data = { ...payload };
    
    // Add required fields for sub-user
    data.role = 'SUB_USER';
    data.parentId = user._id;
    data.referredByUserId = user._id;
    data.createdBy = user._id;
    data.status = 'ACTIVE'; // USER-created sub-users are active immediately
    data.approvalStatus = 'APPROVED';
    data.approvedBy = user._id;
    data.approvedAt = new Date().toISOString();
    data.canLogin = true;
    data.dealerId = user.dealerId;

    console.log('Creating sub-user with data:', data);

    try {
      // STEP 1: Create the sub-user
      const res = await resourceApis['sub-users'].create(data);
      const savedRecord = res.data.data;
      
      // STEP 2: Create User Access record
      const dealerId = typeof user.dealerId === 'object' ? user.dealerId._id : user.dealerId;
      
      const userAccessData = {
        dealerId: dealerId,
        ownerUserId: user._id,
        sharedUserId: savedRecord._id,
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
      
      await resourceApis['user-access'].create(userAccessData);
      
      showToast('Sub-user created and access granted successfully!');
      setModalOpen(false);
      loadData();
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setFormError(errorMessage);
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const hasSubUsers = subUsers.length > 0;
  const approvedCount = Object.values(accessMap).filter(a => a.hasAccess).length;
  const pendingCount = Object.values(accessMap).filter(a => a.isPending).length;

  if (loading) {
    return (
      <div className="user-access-panel">
        <div className="panel-loading">
          <div className="spinner" />
          <span>Loading sub-users...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-access-panel">
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
    <div className="user-access-panel">
      {toast && (
        <div className="toast">
          <FiCheck className="toast-icon" />
          {toast}
        </div>
      )}

      <header className="panel-header">
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
            className="btn btn-primary"
            onClick={openCreate}
          >
            <FiPlus /> Add Sub-User
          </button>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={loadData}
            disabled={loading}
          >
            <FiRefreshCw className={loading ? 'spinning' : ''} /> Refresh
          </button>
        </div>
      </header>

      {!hasSubUsers ? (
        <div className="empty-state">
          <FiUserPlus className="empty-icon" />
          <p>No sub-users found</p>
          <p className="empty-hint">
            Click <strong>"Add Sub-User"</strong> to create a new sub-user and grant them access.
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

      {/* Modal for creating sub-user */}
      <Modal
        open={modalOpen}
        title={
          <div className="modal-title">
            <span className="modal-icon">
              <FiUserPlus />
            </span>
            Create Sub-User
          </div>
        }
        onClose={() => setModalOpen(false)}
        wide
      >
        <ResourceForm
          fields={[
            { name: 'username', label: 'Username', type: 'text', required: true },
            { name: 'password', label: 'Password', type: 'password', requiredOnCreate: true, minLength: 6 },
            { name: 'name', label: 'Full Name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email' },
            { name: 'phoneNumber', label: 'Phone Number', type: 'tel', minLength: 10, maxLength: 10 },
          ]}
          record={null}
          mode="create"
          submitting={submitting}
          error={formError}
          onSubmit={handleCreateSubUser}
          fixedValues={{}}
        />
      </Modal>

      <div className="access-footer">
        <div className="access-info-text">
          <p>
            <strong>How it works:</strong>
          </p>
          <ul>
            <li>
              Click <strong>"Add Sub-User"</strong> to create a new sub-user.
            </li>
            <li>
              New sub-users get <strong>automatic access</strong> to your dashboard.
            </li>
            <li>
              Use <strong>"Revoke"</strong> to remove access for a sub-user.
            </li>
            <li>
              Use <strong>"Grant"</strong> to give access back to a sub-user.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}