import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ScanLine, History, CheckCircle, AlertTriangle } from 'lucide-react';
import Loader from '../components/Loader';
import Toast from '../components/Toast';

const TeacherDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await api.get('/api/dashboard/metrics');
        setMetrics(data);
      } catch (err) {
        setToast('Failed to load dismissal parameters.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <div>
      {toast && <Toast message={toast} type="error" onClose={() => setToast('')} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit', fontSize: '28px', color: 'var(--ink-primary)', marginBottom: '4px' }}>
            Teacher Dashboard
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--ink-secondary)' }}>
            Dismissal verification desk and scan control station.
          </p>
        </div>
        <button onClick={() => navigate('/teacher/scanner')} className="btn-primary" style={{ height: '48px', padding: '0 24px' }}>
          <ScanLine size={20} />
          <span style={{ fontSize: '15px' }}>Scan QR Code</span>
        </button>
      </div>

      {loading ? (
        <Loader count={3} height="80px" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Dismissal summary row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '24px'
          }}>
            {[
              { label: "Today's Releases", value: metrics?.todayPickups || 0, icon: CheckCircle, color: 'var(--status-success)' },
              { label: "Rejected Scans", value: metrics?.rejectedPickups || 0, icon: AlertTriangle, color: 'var(--status-error)' },
              { label: "Active QR Tokens", value: metrics?.activeQrCodes || 0, icon: ScanLine, color: 'var(--brand-primary)' }
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <div key={idx} className="card-elevation" style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink-secondary)' }}>{card.label}</span>
                    <Icon size={20} color={card.color} />
                  </div>
                  <div style={{ fontSize: '28px', fontFamily: 'Outfit', fontWeight: 700, color: 'var(--ink-primary)' }}>
                    {card.value}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Teacher scan logs feed */}
          <div>
            <h2 style={{ fontSize: '20px', color: 'var(--ink-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={20} color="var(--brand-primary)" />
              <span>My Dismissal Logs (Today)</span>
            </h2>
            
            <div className="card-elevation" style={{ padding: '0', backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
              {metrics?.recentActivity && metrics.recentActivity.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {metrics.recentActivity.map((log, idx) => (
                    <div key={log.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 24px',
                      borderBottom: idx !== metrics.recentActivity.length - 1 ? '1px solid var(--border-gray)' : 'none'
                    }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: log.status === 'APPROVED' ? 'var(--status-success)' : 'var(--status-error)'
                          }} />
                          {log.studentName}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--ink-secondary)', marginTop: '4px', marginLeft: '16px' }}>
                          Presented by {log.guardianName} {log.rejectionReason ? `| Reason: ${log.rejectionReason}` : ''}
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--ink-muted)', fontFamily: 'JetBrains Mono' }}>
                        {log.createdAt.replace('T', ' ').split('.')[0]}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--ink-secondary)', fontSize: '14px' }}>
                  No scans committed today. Click "Scan QR Code" to begin.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
