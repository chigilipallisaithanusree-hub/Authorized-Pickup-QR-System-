import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Users, 
  QrCode, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import { 
  ResponsiveContainer, 
  AreaChart, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const data = await api.get('/api/dashboard/metrics');
        setMetrics(data);
      } catch (err) {
        setToast('Failed to load system metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  const COLORS = ['#2D5288', '#22C55E', '#EF4444'];

  return (
    <div>
      {toast && <Toast message={toast} type="error" onClose={() => setToast('')} />}

      <h1 style={{ fontFamily: 'Outfit', fontSize: '28px', color: 'var(--ink-primary)', marginBottom: '4px' }}>
        System Analytics
      </h1>
      <p style={{ fontSize: '15px', color: 'var(--ink-secondary)', marginBottom: '32px' }}>
        Real-time visibility into dismissal statistics and safety anomalies.
      </p>

      {loading ? (
        <Loader count={4} height="80px" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Metrics Overview Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px'
          }}>
            {[
              { label: 'Total Students', value: metrics?.totalStudents || 0, icon: Users, color: 'var(--brand-primary)' },
              { label: 'Active Guardians', value: metrics?.totalGuardians || 0, icon: Users, color: 'var(--brand-primary)' },
              { label: 'Active QRs', value: metrics?.activeQrCodes || 0, icon: QrCode, color: 'var(--brand-primary)' },
              { label: "Today's Pickups", value: metrics?.todayPickups || 0, icon: CheckCircle, color: 'var(--status-success)' },
              { label: 'Rejected Scans', value: metrics?.rejectedPickups || 0, icon: AlertTriangle, color: 'var(--status-error)' },
              { label: 'Expired QRs', value: metrics?.expiredQrCodes || 0, icon: Clock, color: 'var(--status-warning)' }
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <div key={idx} className="card-elevation" style={{ padding: '20px', backgroundColor: '#FFFFFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-secondary)' }}>{card.label}</span>
                    <Icon size={18} color={card.color} />
                  </div>
                  <div style={{ fontSize: '24px', fontFamily: 'Outfit', fontWeight: 700, color: 'var(--ink-primary)' }}>
                    {card.value}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {/* Pickup Trends Area Chart */}
            <div className="card-elevation" style={{ backgroundColor: '#FFFFFF' }}>
              <h3 style={{ fontSize: '16px', color: 'var(--ink-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} color="var(--brand-primary)" />
                <span>Dismissal Activity Trends (Last 7 Days)</span>
              </h3>
              <div style={{ width: '100%', height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics?.charts?.pickupTrends || []}>
                    <XAxis dataKey="date" stroke="var(--ink-secondary)" fontSize={11} tickLine={false} />
                    <YAxis stroke="var(--ink-secondary)" fontSize={11} tickLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="approved" stroke="var(--status-success)" fill="rgba(34, 197, 94, 0.15)" strokeWidth={2} name="Approved" />
                    <Area type="monotone" dataKey="rejected" stroke="var(--status-error)" fill="rgba(239, 68, 68, 0.1)" strokeWidth={2} name="Rejected" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* QR Status Pie Chart */}
            <div className="card-elevation" style={{ backgroundColor: '#FFFFFF' }}>
              <h3 style={{ fontSize: '16px', color: 'var(--ink-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <QrCode size={18} color="var(--brand-primary)" />
                <span>QR Tokens Distribution</span>
              </h3>
              <div style={{ width: '100%', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                <div style={{ width: '160px', height: '160px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics?.charts?.qrDistribution || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {(metrics?.charts?.qrDistribution || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(metrics?.charts?.qrDistribution || []).map((entry, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: COLORS[index % COLORS.length] }} />
                      <span style={{ fontSize: '13px', color: 'var(--ink-primary)', fontWeight: 500 }}>
                        {entry.name}: <b>{entry.value}</b>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {/* Live Dismissal History logs */}
            <div className="card-elevation" style={{ backgroundColor: '#FFFFFF', padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-gray)' }}>
                <h3 style={{ fontSize: '16px', color: 'var(--ink-primary)' }}>Live Verification Feed</h3>
              </div>
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
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink-primary)' }}>
                          {log.studentName}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--ink-secondary)', marginTop: '4px' }}>
                          By {log.guardianName} | Scan: <b>{log.status}</b>
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
                  No pickup logs available.
                </div>
              )}
            </div>

            {/* High Priority Alerts Panel */}
            <div className="card-elevation" style={{ backgroundColor: '#FFFFFF', padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-gray)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} color="var(--status-error)" />
                <h3 style={{ fontSize: '16px', color: 'var(--ink-primary)' }}>Security Alert Timeline</h3>
              </div>
              <div style={{ overflowY: 'auto', maxHeight: '380px' }}>
                {metrics?.recentActivity && metrics.recentActivity.filter(l => l.status === 'REJECTED').length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {metrics.recentActivity.filter(l => l.status === 'REJECTED').map((log, idx) => (
                      <div key={log.id} style={{
                        padding: '16px 24px',
                        borderBottom: '1px solid var(--border-gray)',
                        backgroundColor: 'rgba(239, 68, 68, 0.02)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--status-error)' }}>
                            {log.rejectionReason}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--ink-muted)', fontFamily: 'JetBrains Mono' }}>
                            {log.createdAt.split('T')[1].split('.')[0]}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--ink-secondary)', marginTop: '4px' }}>
                          Child: {log.studentName} | Gate IP: {log.ipAddress}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--ink-secondary)', fontSize: '14px' }}>
                    No safety alert anomalies logged.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
