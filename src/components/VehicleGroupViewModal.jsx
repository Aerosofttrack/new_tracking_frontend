// components/VehicleGroupViewModal.jsx
import React, { useState, useEffect } from 'react';
import { FiX, FiUsers, FiShield, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { getRefLabel } from '../utils/formatters.js';
import './VehicleGroupViewModal.css';

export default function VehicleGroupViewModal({ groupId, onClose, resourceApis }) {
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGroupDetails = async () => {
      if (!groupId) return;
      
      try {
        setLoading(true);
        const res = await resourceApis['vehicle-groups'].getById(groupId);
        const groupData = res.data.data;
        
        // Fetch vehicles
        const membersRes = await resourceApis['vehicle-group-members'].getAll({
          groupId: groupId,
          limit: 1000
        });
        const vehicles = (membersRes.data.data || [])
          .map(member => member.vehicleId)
          .filter(Boolean);
        
        // Fetch sub-user access
        const accessRes = await resourceApis['resource-access'].getAll({
          resourceType: 'VEHICLE_GROUP',
          resourceId: groupId,
          limit: 1000
        });
        const subUsers = (accessRes.data.data || [])
          .map(access => access.sharedUserId)
          .filter(Boolean);
        
        setGroup({
          ...groupData,
          vehicles,
          subUsers
        });
      } catch (err) {
        setError(err.message || 'Failed to load vehicle group details');
      } finally {
        setLoading(false);
      }
    };

    fetchGroupDetails();
  }, [groupId, resourceApis]);

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Loading...</h2>
            <button className="modal-close" onClick={onClose}>
              <FiX />
            </button>
          </div>
          <div className="modal-body">
            <div className="loading-spinner">Loading vehicle group details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Error</h2>
            <button className="modal-close" onClick={onClose}>
              <FiX />
            </button>
          </div>
          <div className="modal-body">
            <div className="error-message">{error || 'Vehicle group not found'}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content vehicle-group-view" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{group.groupName}</h2>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="group-info">
            <div className="info-row">
              <span className="info-label">Description:</span>
              <span className="info-value">{group.description || 'No description'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Status:</span>
              <span className={`status-badge ${group.status?.toLowerCase()}`}>
                {group.status}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Owner:</span>
              <span className="info-value">{getRefLabel(group.ownerUserId)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Dealer:</span>
              <span className="info-value">{getRefLabel(group.dealerId)}</span>
            </div>
          </div>

          <div className="sections-grid">
            {/* Vehicles Section */}
            <div className="section">
              <div className="section-header">
                {/* <FiCar className="section-icon" /> */}
                <h3>Vehicles ({group.vehicles?.length || 0})</h3>
              </div>
              {group.vehicles?.length > 0 ? (
                <ul className="item-list">
                  {group.vehicles.map(vehicle => (
                    <li key={vehicle._id} className="item">
                      <span className="item-name">{getRefLabel(vehicle)}</span>
                      <span className="item-status">{vehicle.status}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-message">No vehicles in this group</p>
              )}
            </div>

            {/* Sub-Users Section */}
            <div className="section">
              <div className="section-header">
                <FiUsers className="section-icon" />
                <h3>Sub-Users with Access ({group.subUsers?.length || 0})</h3>
              </div>
              {group.subUsers?.length > 0 ? (
                <ul className="item-list">
                  {group.subUsers.map(subUser => (
                    <li key={subUser._id} className="item">
                      <span className="item-name">{getRefLabel(subUser)}</span>
                      <span className="access-status">
                        <FiCheckCircle className="status-icon active" />
                        Has Access
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-message">No sub-users have access to this group</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}