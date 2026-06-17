import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { QrCode, ClipboardList, CheckCircle, Clock } from 'lucide-react';
import Toast from '../components/Toast';
import Alert from '../components/Alert';
import Loader from '../components/Loader';

const GenerateQR = () => {
  const location = useLocation();
  const [students, setStudents] = useState([]);
  const [guardians, setGuardians] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selection States
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedGuardianId, setSelectedGuardianId] = useState('');
  const [expiryHours, setExpiryHours] = useState('2');
  
  // Generated result states
  const [qrUri, setQrUri] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const studentData = await api.get('/api/students');
        setStudents(studentData.students);
        
        // Auto-select student if passed from dashboard
        const preselectedStudentId = location.state?.studentId;
        if (preselectedStudentId) {
          setSelectedStudentId(preselectedStudentId.toString());
        } else if (studentData.students.length > 0) {
          setSelectedStudentId(studentData.students[0].id.toString());
        }
      } catch (err) {
        setToast('Failed to load profile parameters.');
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [location]);

  // Update guardians list when selected student changes
  useEffect(() => {
    if (selectedStudentId) {
      const student = students.find(s => s.id.toString() === selectedStudentId);
      if (student && student.guardians) {
        setGuardians(student.guardians);
        if (student.guardians.length > 0) {
          setSelectedGuardianId(student.guardians[0].id.toString());
        } else {
          setSelectedGuardianId('');
        }
      }
    }
  }, [selectedStudentId, students]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError('');
    setQrUri('');
    
    if (!selectedStudentId || !selectedGuardianId) {
      setError('Please select both a student and an authorized guardian.');
      return;
    }
    
    setGenerating(true);
    try {
      const result = await api.post('/api/qr/generate', {
        studentId: parseInt(selectedStudentId),
        guardianId: parseInt(selectedGuardianId),
        expiryHours: parseInt(expiryHours)
      });
      setQrUri(result.qrImageBase64);
      setExpiresAt(result.expiresAt);
      setToast('QR Code generated and active.');
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      {toast && <Toast message={toast} type="success" onClose={() => setToast('')} />}

      <h1 style={{ fontFamily: 'Outfit', fontSize: '28px', color: 'var(--ink-primary)', marginBottom: '4px' }}>
        Generate QR Authorization
      </h1>
      <p style={{ fontSize: '15px', color: 'var(--ink-secondary)', marginBottom: '32px' }}>
        Create dynamic, time-bound pickup credentials for guardians.
      </p>

      {loading ? (
        <Loader count={3} height="60px" />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '32px'
        }}>
          {/* Form settings */}
          <div className="card-elevation" style={{ backgroundColor: '#FFFFFF', height: 'fit-content' }}>
            <h3 style={{ fontSize: '18px', color: 'var(--ink-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClipboardList size={18} color="var(--brand-primary)" />
              <span>QR Parameters</span>
            </h3>

            {error && <Alert message={error} type="error" />}

            <form onSubmit={handleGenerate}>
              <div className="form-group">
                <label>Select Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="form-control"
                  required
                >
                  <option value="" disabled>Choose a child</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.gradeClass})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Select Guardian</label>
                <select
                  value={selectedGuardianId}
                  onChange={(e) => setSelectedGuardianId(e.target.value)}
                  className="form-control"
                  required
                  disabled={guardians.length === 0}
                >
                  {guardians.length === 0 ? (
                    <option value="">No authorized guardians mapped</option>
                  ) : (
                    <>
                      <option value="" disabled>Choose a guardian</option>
                      {guardians.map(g => (
                        <option key={g.id} value={g.id}>{g.fullName} ({g.relationship})</option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>Expiration Window</label>
                <select
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(e.target.value)}
                  className="form-control"
                  required
                >
                  <option value="1">1 Hour</option>
                  <option value="2">2 Hours (Default)</option>
                  <option value="4">4 Hours</option>
                  <option value="8">8 Hours</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={generating || guardians.length === 0}
                className="btn-primary"
                style={{ width: '100%', marginTop: '16px' }}
              >
                {generating ? 'Encrypting...' : 'Generate Secure QR'}
              </button>
            </form>
          </div>

          {/* QR Preview Block */}
          <div className="card-elevation" style={{
            backgroundColor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            minHeight: '340px'
          }}>
            {qrUri ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  padding: '16px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border-gray)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-sm)',
                  marginBottom: '20px'
                }}>
                  <img src={qrUri} alt="Pickup Authorization QR" style={{ width: '200px', height: '200px', display: 'block' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-success)', fontWeight: 600, fontSize: '15px', marginBottom: '8px' }}>
                  <CheckCircle size={18} />
                  <span>QR Code Active</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ink-secondary)', fontSize: '13px' }}>
                  <Clock size={14} />
                  <span>Expires: {expiresAt.replace('T', ' ').split('.')[0]} UTC</span>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--ink-muted)' }}>
                <QrCode size={64} strokeWidth={1} style={{ marginBottom: '16px' }} />
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: '8px' }}>
                  Awaiting Generation
                </h4>
                <p style={{ fontSize: '14px', maxWidth: '240px', lineHeight: 1.5 }}>
                  Configure parameters on the left and click generate to render secure QR token.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateQR;
