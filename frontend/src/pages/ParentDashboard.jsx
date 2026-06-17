import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Users, QrCode, ClipboardList, ShieldAlert } from 'lucide-react';
import Loader from '../components/Loader';
import Toast from '../components/Toast';

const ParentDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const metricsData = await api.get('/api/dashboard/metrics');
        const studentsData = await api.get('/api/students');
        setMetrics(metricsData);
        setStudents(studentsData.students);
      } catch (err) {
        setToast('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div>
      {toast && <Toast message={toast} type="error" onClose={() => setToast('')} />}

      <h1 style={{ fontFamily: 'Outfit', fontSize: '28px', color: 'var(--ink-primary)', marginBottom: '8px' }}>
        Parent Portal
      </h1>
      <p style={{ fontSize: '15px', color: 'var(--ink-secondary)', marginBottom: '32px' }}>
        Manage your children's pickup credentials and authorized guardians.
      </p>

      {loading ? (
        <Loader count={4} height="80px" />
      ) : (
        <>
          {/* Metrics Overview Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '24px',
            marginBottom: '36px'
          }}>
            {[
              { label: 'My Children', value: metrics?.totalStudents || 0, icon: Users },
              { label: 'Authorized Guardians', value: metrics?.totalGuardians || 0, icon: Users },
              { label: 'Active QR Codes', value: metrics?.activeQrCodes || 0, icon: QrCode },
              { label: 'Total Pickups', value: metrics?.totalPickups || 0, icon: ClipboardList }
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <div key={idx} className="card-elevation" style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink-secondary)' }}>{card.label}</span>
                    <Icon size={20} color="var(--brand-primary)" />
                  </div>
                  <div style={{ fontSize: '28px', fontFamily: 'Outfit', fontWeight: 700, color: 'var(--ink-primary)' }}>
                    {card.value}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Child Profiles list */}
            <div>
              <h2 style={{ fontSize: '20px', color: 'var(--ink-primary)', marginBottom: '16px' }}>My Children</h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '24px'
              }}>
                {students.map((student) => (
                  <div key={student.id} className="card-elevation" style={{ backgroundColor: '#FFFFFF' }}>
                    <h3 style={{ fontSize: '18px', color: 'var(--ink-primary)', marginBottom: '4px' }}>
                      {student.firstName} {student.lastName}
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--ink-secondary)', marginBottom: '16px' }}>
                      Grade Level: <b>{student.gradeClass}</b>
                    </p>
                    
                    <div style={{
                      backgroundColor: 'var(--bg-canvas)',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '20px',
                      border: '1px solid var(--border-gray)'
                    }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Authorized Guardians
                      </div>
                      {student.guardians.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {student.guardians.map(g => (
                            <div key={g.id} style={{ fontSize: '13px', color: 'var(--ink-primary)', display: 'flex', justifyContent: 'space-between' }}>
                              <span>{g.fullName}</span>
                              <span style={{ color: 'var(--ink-secondary)' }}>({g.relationship})</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>
                          No guardians registered yet.
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => navigate('/parent/qr', { state: { studentId: student.id } })}
                      className="btn-primary" 
                      style={{ width: '100%' }}
                    >
                      <QrCode size={16} />
                      <span>Generate QR Code</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Pickups Feed */}
            <div>
              <h2 style={{ fontSize: '20px', color: 'var(--ink-primary)', marginBottom: '16px' }}>Recent Activity</h2>
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
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink-primary)' }}>
                            {log.studentName} was picked up
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--ink-secondary)', marginTop: '2px' }}>
                            By {log.guardianName} | Verified by {log.teacherName}
                          </div>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--ink-muted)', fontFamily: 'JetBrains Mono' }}>
                          {log.createdAt.replace('T', ' ').split('.')[0]}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--ink-secondary)', fontSize: '14px' }}>
                    No recent pickup logs found.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ParentDashboard;
