import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Table from '../components/Table';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import Toast from '../components/Toast';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Edit, Unlink } from 'lucide-react';

const GuardianManagement = () => {
  const [guardians, setGuardians] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const { user } = useAuth();
  const role = user?.role?.toLowerCase() || '';
  const [selectedGuardian, setSelectedGuardian] = useState(null);
  
  // Form values
  const [fullName, setFullName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const fetchData = async () => {
    try {
      const guardianData = await api.get('/api/guardians');
      const studentData = await api.get('/api/students');
      setGuardians(guardianData.guardians);
      setStudents(studentData.students);
    } catch (err) {
      setToast('Failed to retrieve guardian directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setError('');
    setSelectedGuardian(null);
    setFullName('');
    setRelationship('');
    setPhoneNumber('');
    setEmail('');
    setStudentId(students[0]?.id || '');
    setModalOpen(true);
  };

  const openEditModal = (guardian) => {
    setError('');
    setSelectedGuardian(guardian);
    setFullName(guardian.fullName);
    setRelationship(guardian.relationship);
    setPhoneNumber(guardian.phoneNumber);
    setEmail(guardian.email);
    setStudentId('1'); // Dummy value
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    
    if (selectedGuardian) {
      if (!fullName || !relationship || !phoneNumber || !email) {
        setError('Please fill in all fields.');
        return;
      }
    } else {
      if (!fullName || !relationship || !phoneNumber || !email || !studentId) {
        setError('Please fill in all fields.');
        return;
      }
    }
    
    try {
      if (selectedGuardian) {
        await api.put(`/api/guardians/${selectedGuardian.id}`, {
          fullName,
          relationship,
          phoneNumber,
          email
        });
        setToast('Guardian profile updated successfully.');
      } else {
        await api.post('/api/guardians', {
          studentId: parseInt(studentId),
          fullName,
          relationship,
          phoneNumber,
          email
        });
        setToast('Guardian registered and associated successfully.');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUnlink = async (guardianId, studentId) => {
    if (!window.confirm('Are you sure you want to revoke authorization access for this guardian?')) return;
    try {
      await api.delete(`/api/guardians/${guardianId}/unlink/${studentId}`);
      setToast('Authorization access revoked successfully.');
      fetchData();
    } catch (err) {
      setToast(err.message);
    }
  };

  const columns = [
    { header: 'Guardian Name', accessor: 'fullName' },
    { header: 'Relationship', accessor: 'relationship' },
    { header: 'Phone Number', accessor: 'phoneNumber' },
    { header: 'Email Address', accessor: 'email' },
    {
      header: 'Linked Child',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {row.students && row.students.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <span>{s.fullName} ({s.gradeClass})</span>
              {(role === 'parent' || role === 'admin') && (
                <button 
                  onClick={() => handleUnlink(row.id, s.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--status-error)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  title="Revoke pickup authorization"
                >
                  <Unlink size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '12px' }}>
          {(role === 'parent' || role === 'admin') && (
            <button 
              onClick={(e) => { e.stopPropagation(); openEditModal(row); }}
              style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer' }}
              title="Edit Guardian Details"
            >
              <Edit size={16} />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      {toast && <Toast message={toast} type="success" onClose={() => setToast('')} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit', fontSize: '28px', color: 'var(--ink-primary)', marginBottom: '4px' }}>
            Authorized Guardians
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--ink-secondary)' }}>
            Register dynamic pickup contacts and map child permissions boundaries.
          </p>
        </div>
        {(role === 'parent' || role === 'admin') && (
          <button onClick={openAddModal} className="btn-primary" style={{ height: '44px' }}>
            <UserPlus size={18} />
            <span>Add Guardian</span>
          </button>
        )}
      </div>

      {loading ? (
        <Loader count={4} height="52px" />
      ) : (
        <Table
          columns={columns}
          data={guardians}
          searchPlaceholder="Search guardian by name, email, relationship..."
        />
      )}

      {/* Add / Edit Guardian Modal Form */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedGuardian ? "Edit Guardian Profile" : "Register Authorized Guardian"}>
        {error && <Alert message={error} type="error" />}
        
        <form onSubmit={handleSave}>
          {!selectedGuardian && (
            <div className="form-group">
              <label>Child Target</label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="form-control"
                required
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.gradeClass})</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="form-group">
            <label>Guardian Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. John Watson"
              className="form-control"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Relationship to Child</label>
            <input
              type="text"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              placeholder="e.g. Uncle, Grandmother, Nanny"
              className="form-control"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. +1-555-0199"
              className="form-control"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. guardian@example.com"
              className="form-control"
              required
            />
          </div>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Register Contact
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default GuardianManagement;
