import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Table from '../components/Table';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import Toast from '../components/Toast';
import Loader from '../components/Loader';
import { UserPlus, Edit, Trash2 } from 'lucide-react';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Add Student');
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // Form values
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gradeClass, setGradeClass] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const fetchStudents = async () => {
    try {
      const data = await api.get('/api/students');
      setStudents(data.students);
    } catch (err) {
      setToast('Failed to load student directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const openAddModal = () => {
    setError('');
    setSelectedStudent(null);
    setFirstName('');
    setLastName('');
    setGradeClass('');
    setParentEmail('');
    setModalTitle('Add Student');
    setModalOpen(true);
  };

  const openEditModal = (student) => {
    setError('');
    setSelectedStudent(student);
    setFirstName(student.firstName);
    setLastName(student.lastName);
    setGradeClass(student.gradeClass);
    setParentEmail(''); // Hidden on edit
    setModalTitle('Edit Student');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!firstName || !lastName || !gradeClass) {
      setError('Please fill in all required fields.');
      return;
    }
    
    try {
      if (selectedStudent) {
        // Edit student
        await api.put(`/api/students/${selectedStudent.id}`, {
          firstName,
          lastName,
          gradeClass
        });
        setToast('Student updated successfully.');
      } else {
        // Add student
        if (!parentEmail) {
          setError('Parent email is required for registration.');
          return;
        }
        await api.post('/api/students', {
          firstName,
          lastName,
          gradeClass,
          parentEmail
        });
        setToast('Student added successfully.');
      }
      setModalOpen(false);
      fetchStudents();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student record?')) return;
    try {
      await api.delete(`/api/students/${id}`);
      setToast('Student record deleted successfully.');
      fetchStudents();
    } catch (err) {
      setToast(err.message);
    }
  };

  const columns = [
    { header: 'Student Name', render: (row) => `${row.firstName} ${row.lastName}` },
    { header: 'Grade / Class', accessor: 'gradeClass' },
    { header: 'Parent Email', render: (row) => row.parentEmail || 'N/A' },
    {
      header: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={(e) => { e.stopPropagation(); openEditModal(row); }}
            style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer' }}
          >
            <Edit size={16} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
            style={{ background: 'none', border: 'none', color: 'var(--status-error)', cursor: 'pointer' }}
          >
            <Trash2 size={16} />
          </button>
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
            Student Registry
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--ink-secondary)' }}>
            Admin portal to perform CRUD configurations on student profiles.
          </p>
        </div>
        <button onClick={openAddModal} className="btn-primary" style={{ height: '44px' }}>
          <UserPlus size={18} />
          <span>Add Student</span>
        </button>
      </div>

      {loading ? (
        <Loader count={4} height="52px" />
      ) : (
        <Table
          columns={columns}
          data={students}
          searchPlaceholder="Search student by name or class..."
        />
      )}

      {/* Add / Edit Modal Form */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalTitle}>
        {error && <Alert message={error} type="error" />}
        
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="form-control"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="form-control"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Class / Grade</label>
            <input
              type="text"
              value={gradeClass}
              onChange={(e) => setGradeClass(e.target.value)}
              placeholder="e.g. Grade 2-B"
              className="form-control"
              required
            />
          </div>
          
          {!selectedStudent && (
            <div className="form-group">
              <label>Parent Email Address</label>
              <input
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                placeholder="Enter linked parent account email"
                className="form-control"
                required
              />
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StudentManagement;
