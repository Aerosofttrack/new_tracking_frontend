// components/SubUserDashboard.jsx
import React, { useState, useEffect } from 'react';
import { resourceApis } from '../api/services.js';
import { useAuth } from '../context/AuthContext.jsx';
import './SubUserDashboard.css';

export default function SubUserDashboard() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
console.log(user);

  useEffect(() => {
    if (user?.role === 'SUB_USER') {
      fetchSubUserData();
    }
  }, [user]);

  const fetchSubUserData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Get user_access records for this subuser
      const accessRes = await resourceApis['user-access'].getAll({
        sharedUserId: user._id,
        status: 'ACTIVE',
        limit: 1000
      });

      console.log(accessRes)
      
      const accessRecords = accessRes.data.data || [];
      
      if (accessRecords.length === 0) {
        setLoading(false);
        return;
      }
      
      // Get owner user IDs
      const ownerUserIds = accessRecords.map(record => 
        typeof record.ownerUserId === 'object' ? record.ownerUserId._id : record.ownerUserId
      ).filter(Boolean);
      
      // Fetch vehicles for these owners
      if (ownerUserIds.length > 0) {
        const vehiclesRes = await resourceApis.vehicles.getAll({
          ownerUserId: { $in: ownerUserIds },
          limit: 1000
        });
        console.log(vehiclesRes)
        setVehicles(vehiclesRes.data.data || []);
      }
      
      // Fetch vehicle groups for these owners
      if (ownerUserIds.length > 0) {
        const groupsRes = await resourceApis['vehicle-groups'].getAll({
          ownerUserId: { $in: ownerUserIds },
          limit: 1000
        });
        setGroups(groupsRes.data.data || []);
      }
      
    } catch (err) {
      console.error('Error fetching subuser data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="subuser-dashboard">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="subuser-dashboard">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="subuser-dashboard">
      <h1>Welcome, {user?.name || user?.username}</h1>
      <p className="subuser-info">You have access to {vehicles.length} vehicles and {groups.length} groups</p>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Vehicles</h3>
          <p className="stat-number">{vehicles.length}</p>
        </div>
        <div className="stat-card">
          <h3>Groups</h3>
          <p className="stat-number">{groups.length}</p>
        </div>
      </div>
      
      {vehicles.length > 0 && (
        <div className="section">
          <h2>Your Vehicles</h2>
          <div className="vehicle-list">
            {vehicles.map(vehicle => (
              <div key={vehicle._id} className="vehicle-card">
                <span className="vehicle-number">{vehicle.vehicleNumber}</span>
                <span className="vehicle-model">{vehicle.make} {vehicle.model}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {groups.length > 0 && (
        <div className="section">
          <h2>Your Groups</h2>
          <div className="group-list">
            {groups.map(group => (
              <div key={group._id} className="group-card">
                <span className="group-name">{group.groupName}</span>
                <span className="group-status">{group.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {vehicles.length === 0 && groups.length === 0 && (
        <div className="empty-state">
          <p>You don't have access to any vehicles or groups yet.</p>
          <p>Please contact your administrator.</p>
        </div>
      )}
    </div>
  );
}