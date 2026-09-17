// components/DealerApprovalList.jsx
import { useEffect, useState } from 'react';
import { notificationApi } from '../api/services.js';

export function DealerApprovalList() {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    setLoading(true);
    try {
      const response = await notificationApi.getNotifications({
        type: 'SUB_USER_APPROVAL_REQUEST',
        isRead: false,
      });
      setPendingApprovals(response.data.data.notifications);
    } catch (error) {
      console.error('Error fetching approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (subUserId, action) => {
    try {
      await notificationApi.handleAction(subUserId, action);
      // Refresh the list
      fetchPendingApprovals();
    } catch (error) {
      console.error('Error handling approval:', error);
    }
  };

  return (
    <div className="dealer-approval-list">
      <h2>Pending Sub-User Approvals</h2>
      {loading ? (
        <p>Loading...</p>
      ) : pendingApprovals.length === 0 ? (
        <p>No pending approvals</p>
      ) : (
        pendingApprovals.map((notification) => (
          <div key={notification._id} className="approval-item">
            <div className="approval-info">
              <strong>{notification.data.subUserName}</strong>
              <p>Username: {notification.data.subUserUsername}</p>
              <p>Created by: {notification.data.createdByName}</p>
              <small>Requested: {new Date(notification.createdAt).toLocaleString()}</small>
            </div>
            <div className="approval-actions">
              <button
                className="btn btn-success"
                onClick={() => handleApproval(notification.data.subUserId, 'APPROVE')}
              >
                Approve
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleApproval(notification.data.subUserId, 'REJECT')}
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}