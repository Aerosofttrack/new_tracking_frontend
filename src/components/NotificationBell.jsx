import { useEffect, useRef, useState, useCallback } from 'react';
import { TbBell } from 'react-icons/tb';
import { notificationApi } from '../api/services.js';
import { getErrorMessage } from '../api/client.js';
import './Notificationbell.css';

const POLL_INTERVAL_MS = 30000;

function timeAgo(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actioningId, setActioningId] = useState(null);
  const [error, setError] = useState('');
  const containerRef = useRef(null);

  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await notificationApi.getUnreadCount();
      setUnreadCount(res.data.data?.unreadCount || 0);
    } catch {
      // Silently ignore
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await notificationApi.getNotifications({ 
        limit: 20,
        // Get all notifications, not just unread
      });
      console.log('Notifications loaded:', res.data);
      setNotifications(res.data.data?.notifications || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll unread count in the background
  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadUnreadCount]);

  // Fetch the full list only when the dropdown opens
  useEffect(() => {
    if (open) loadNotifications();
  }, [open, loadNotifications]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkAsRead = async (notification) => {
    if (notification.isRead) return;
    try {
      await notificationApi.markAsRead(notification._id);
      setNotifications((prev) =>
        prev.map((item) =>
          item._id === notification._id ? { ...item, isRead: true, status: 'READ' } : item
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Non-critical
    }
  };

  const handleApprove = async (notification) => {
    const subUserId = notification.data?.subUserId;
    if (!subUserId) return;
    setActioningId(notification._id);
    setError('');
    try {
      await notificationApi.approveSubUser(subUserId);
      // Remove the notification from the list
      setNotifications((prev) =>
        prev.filter((item) => item._id !== notification._id)
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      // Show success message
      alert('Sub-user approved successfully!');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (notification) => {
    const subUserId = notification.data?.subUserId;
    if (!subUserId) return;
    setActioningId(notification._id);
    setError('');
    try {
      await notificationApi.rejectSubUser(subUserId);
      // Remove the notification from the list
      setNotifications((prev) =>
        prev.filter((item) => item._id !== notification._id)
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      alert('Sub-user rejected successfully!');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="notification-bell" ref={containerRef}>
      <button
        type="button"
        className="notification-bell__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <TbBell />
        {unreadCount > 0 && (
          <span className="notification-bell__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notification-bell__panel">
          <div className="notification-bell__header">
            <strong>Notifications</strong>
            <button 
              className="btn btn-sm btn-secondary"
              onClick={loadNotifications}
            >
              Refresh
            </button>
          </div>

          {error && <div className="notification-bell__error">{error}</div>}

          {loading && <div className="notification-bell__empty">Loading...</div>}

          {!loading && notifications.length === 0 && (
            <div className="notification-bell__empty">No notifications yet.</div>
          )}

          {!loading && notifications.length > 0 && (
            <ul className="notification-bell__list">
              {notifications.map((notification) => {
                const isApprovalRequest =
                  notification.type === 'SUB_USER_APPROVAL_REQUEST' &&
                  notification.status === 'PENDING';

                return (
                  <li
                    key={notification._id}
                    className={`notification-item ${notification.isRead ? '' : 'notification-item--unread'}`}
                    onClick={() => !isApprovalRequest && handleMarkAsRead(notification)}
                  >
                    <div className="notification-item__title">{notification.title}</div>
                    <div className="notification-item__message">{notification.message}</div>
                    
                    {/* Show sub-user details if available */}
                    {notification.data && (
                      <div className="notification-item__details">
                        {notification.data.subUserName && (
                          <span>Sub-User: {notification.data.subUserName}</span>
                        )}
                        {notification.data.subUserUsername && (
                          <span>Username: {notification.data.subUserUsername}</span>
                        )}
                        {notification.data.createdByName && (
                          <span>Created by: {notification.data.createdByName}</span>
                        )}
                      </div>
                    )}
                    
                    <div className="notification-item__time">{timeAgo(notification.createdAt)}</div>

                    {isApprovalRequest && (
                      <div className="notification-item__actions">
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          disabled={actioningId === notification._id}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleApprove(notification);
                          }}
                        >
                          {actioningId === notification._id ? 'Processing...' : '✅ Approve'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          disabled={actioningId === notification._id}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleReject(notification);
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}