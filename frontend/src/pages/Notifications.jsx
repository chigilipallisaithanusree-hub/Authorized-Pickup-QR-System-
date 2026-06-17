import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Toast from '../components/Toast';
import Loader from '../components/Loader';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await api.get('/api/notifications');
        setNotifications(data.notifications);
      } catch (err) {
        setToast('Failed to load notification history.');
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const columns = [
    { header: 'Recipient Email', accessor: 'recipientEmail' },
    { header: 'Type / Trigger', accessor: 'type' },
    { header: 'Subject Line', accessor: 'subject' },
    {
      header: 'Delivery Status',
      render: (row) => <Badge status={row.status === 'SENT' ? 'APPROVED' : row.status === 'FAILED' ? 'REJECTED' : 'PENDING'}>{row.status}</Badge>
    },
    {
      header: 'Enqueued Time',
      render: (row) => (
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '13px' }}>
          {row.createdAt.replace('T', ' ').split('.')[0]}
        </span>
      )
    }
  ];

  return (
    <div>
      {toast && <Toast message={toast} type="error" onClose={() => setToast('')} />}

      <h1 style={{ fontFamily: 'Outfit', fontSize: '28px', color: 'var(--ink-primary)', marginBottom: '4px' }}>
        Notification Queue Log
      </h1>
      <p style={{ fontSize: '15px', color: 'var(--ink-secondary)', marginBottom: '32px' }}>
        Email dispatch logging audit history for student pickup alerts.
      </p>

      {loading ? (
        <Loader count={5} height="52px" />
      ) : (
        <Table
          columns={columns}
          data={notifications}
          searchPlaceholder="Search email history by recipient, subject, status..."
        />
      )}
    </div>
  );
};

export default Notifications;
