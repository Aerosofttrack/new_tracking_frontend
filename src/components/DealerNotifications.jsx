// components/DealerNotifications.jsx - Updated
import { useEffect, useState } from 'react';
import { notificationApi } from '../api/services.js';
import { useAuth } from '../context/AuthContext.jsx';
import { resourceApis } from '../api/services.js';
import './DealerNotifications.css';

export default function DealerNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      // Get all pending approval notifications
      const response = await notificationApi.getNotifications({
        type: 'SUB_USER_APPROVAL_REQUEST',
        status: 'PENDING',
        isRead: false,
        limit: 50,
      });
      
      const notifications = response.data.data?.notifications || [];
      
      // Filter out notifications for sub-users that are already ACTIVE
      const filteredNotifications = await Promise.all(
        notifications.map(async (notification) => {
          const subUserId = notification.data?.subUserId;
          if (!subUserId) return notification;
          
          try {
            // Check if the sub-user is already active
            const userRes = await resourceApis.users.getById(subUserId);
            const subUser = userRes.data.data;
            
            // If the sub-user is already ACTIVE, don't show this notification
            if (subUser && subUser.status === 'ACTIVE') {
              // Optionally mark the notification as read/processed
              try {
                await notificationApi.markAsRead(notification._id);
              } catch (e) {
                // Ignore
              }
              return null; // Filter out this notification
            }
          } catch (err) {
            console.error('Error checking sub-user status:', err);
          }
          return notification;
        })
      );
      
      // Remove null entries (notifications for already active sub-users)
      setNotifications(filteredNotifications.filter(n => n !== null));
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'DEALER') {
      fetchNotifications();
      
      // Poll every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleApprove = async (subUserId) => {
    setProcessingId(subUserId);
    setError('');
    try {
      await notificationApi.approveSubUser(subUserId);
      // Remove the notification from the list
      setNotifications(prev => prev.filter(n => n.data?.subUserId !== subUserId));
      alert('✅ Sub-user approved successfully!');
    } catch (error) {
      console.error('Error approving sub-user:', error);
      setError('Failed to approve sub-user. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (subUserId) => {
    setProcessingId(subUserId);
    setError('');
    try {
      await notificationApi.rejectSubUser(subUserId);
      // Remove the notification from the list
      setNotifications(prev => prev.filter(n => n.data?.subUserId !== subUserId));
      alert('❌ Sub-user rejected successfully!');
    } catch (error) {
      console.error('Error rejecting sub-user:', error);
      setError('Failed to reject sub-user. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  if (user?.role !== 'DEALER') {
    return null;
  }

  return (
    <div className="dealer-notifications">
      <div className="notification-header">
        <h2>Pending Sub-User Approvals</h2>
        {notifications.length > 0 && (
          <span className="notification-badge">{notifications.length}</span>
        )}
        <button 
          className="btn btn-sm btn-secondary"
          onClick={fetchNotifications}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <p>Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <p>No pending approval requests</p>
        </div>
      ) : (
        <div className="notification-list">
          {notifications.map((notification) => (
            <div key={notification._id} className="notification-item">
              <div className="notification-content">
                <h4>{notification.title}</h4>
                <p>{notification.message}</p>
                <div className="notification-meta">
                  {notification.data?.subUserName && (
                    <span><strong>Sub-User:</strong> {notification.data.subUserName}</span>
                  )}
                  {notification.data?.subUserUsername && (
                    <span><strong>Username:</strong> {notification.data.subUserUsername}</span>
                  )}
                  {notification.data?.createdByName && (
                    <span><strong>Created by:</strong> {notification.data.createdByName}</span>
                  )}
                  <span className="notification-time">
                    {new Date(notification.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="notification-actions">
                <button
                  className="btn btn-success"
                  onClick={() => handleApprove(notification.data.subUserId)}
                  disabled={processingId === notification.data.subUserId}
                >
                  {processingId === notification.data.subUserId ? 'Processing...' : '✅ Approve'}
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleReject(notification.data.subUserId)}
                  disabled={processingId === notification.data.subUserId}
                >
                  {processingId === notification.data.subUserId ? 'Processing...' : '❌ Reject'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}