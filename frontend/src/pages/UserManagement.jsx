import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Table from '../components/Table';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import Toast from '../components/Toast';
import Loader from '../components/Loader';
import Badge from '../components/Badge';
import { UserPlus, Edit, Trash2 } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Add User');
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Form values
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('parent');
  const [isActive, setIsActive] = useState(true);
  
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const fetchUsers = async () => {
    try {
      const data = await api.get('/api/users');
      setUsers(data.users);
    } catch (err) {
      setToast('Failed to load user directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAddModal = () => {
    setError('');
    setSelectedUser(null);
    setFullName('');
    setEmail('');
    setRole('parent');
    setIsActive(true);
    setModalTitle('Add User');
    setModalOpen(true);
  };

  const openEditModal = (user) => {
    setError('');
    setSelectedUser(user);
    setFullName(user.fullName);
    setEmail(user.email);
    setRole(user.role);
    setIsActive(user.isActive);
    setModalTitle('Edit User');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!fullName || !email || !role) {
      setError('Please fill in all required fields.');
      return;
    }
    
    try {
      if (selectedUser) {
        // Edit User
        const payload = {
          fullName,
          email,
          role,
          isActive
        };
        await api.put(`/api/users/${selectedUser.id}`, payload);
        setToast('User profile updated successfully.');
      } else {
        // Add User
        await api.post('/api/users', {
          fullName,
          email,
          role
        });
        setToast('User created successfully.');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    try {
      await api.delete(`/api/users/${id}`);
      setToast('User deleted successfully.');
      fetchUsers();
    } catch (err) {
      setError(err.message);
      setToast(err.message);
    }
  };

  const columns = [
    { header: 'Full Name', accessor: 'fullName' },
    { header: 'Email Address', accessor: 'email' },
    { header: 'Role', accessor: 'role' },
    {
      header: 'Status',
      render: (row) => (
        <Badge status={row.isActive ? 'Active' : 'Expired'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={(e) => { e.stopPropagation(); openEditModal(row); }}
            style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer' }}
            title="Edit User"
          >
            <Edit size={16} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
            style={{ background: 'none', border: 'none', color: 'var(--status-error)', cursor: 'pointer' }}
            title="Delete User"
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
            System Users
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--ink-secondary)' }}>
            Admin portal to perform CRUD operations on teacher, parent, and admin user credentials.
          </p>
        </div>
        <button onClick={openAddModal} className="btn-primary" style={{ height: '44px' }}>
          <UserPlus size={18} />
          <span>Add User</span>
        </button>
      </div>

      {loading ? (
        <Loader count={4} height="52px" />
      ) : (
        <Table
          columns={columns}
          data={users}
          searchPlaceholder="Search users by name or email..."
        />
      )}

      {/* Add / Edit Modal Form */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalTitle}>
        {error && <Alert message={error} type="error" />}
        
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="form-control"
              placeholder="e.g. Robert Davis"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-control"
              placeholder="user@school.edu"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Access Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="form-control"
              required
            >
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="parent">Parent</option>
            </select>
          </div>
          
          {selectedUser && (
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
              <input
                type="checkbox"
                id="isActiveCheckbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="isActiveCheckbox" style={{ marginBottom: 0, cursor: 'pointer', fontWeight: 600 }}>
                Account is Active
              </label>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save User
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;
