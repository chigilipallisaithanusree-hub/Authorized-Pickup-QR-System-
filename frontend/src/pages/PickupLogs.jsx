import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Toast from '../components/Toast';
import Loader from '../components/Loader';

const PickupLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await api.get('/api/pickups/logs');
        setLogs(data.logs);
      } catch (err) {
        setToast('Failed to load transaction logs.');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const columns = [
    { header: 'Student Name', accessor: 'studentName' },
    { header: 'Guardian Name', render: (row) => `${row.guardianName} (${row.guardianName ? 'Authorized' : 'Unauthorized'})` },
    { header: 'Verified By (Teacher)', accessor: 'teacherName' },
    {
      header: 'Verification Status',
      render: (row) => <Badge status={row.status}>{row.status}</Badge>
    },
    {
      header: 'Timestamp',
      render: (row) => (
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '13px' }}>
          {row.createdAt.replace('T', ' ').split('.')[0]}
        </span>
      )
    },
    { header: 'IP Address / Detail', accessor: 'ipAddress' }
  ];

  return (
    <div>
      {toast && <Toast message={toast} type="error" onClose={() => setToast('')} />}

      <h1 style={{ fontFamily: 'Outfit', fontSize: '28px', color: 'var(--ink-primary)', marginBottom: '4px' }}>
        Pickup Records & Audit Trails
      </h1>
      <p style={{ fontSize: '15px', color: 'var(--ink-secondary)', marginBottom: '32px' }}>
        Complete security log record tracking student dismissal releases.
      </p>

      {loading ? (
        <Loader count={5} height="52px" />
      ) : (
        <Table
          columns={columns}
          data={logs}
          searchPlaceholder="Search logs by student, guardian, teacher, status..."
        />
      )}
    </div>
  );
};

export default PickupLogs;
