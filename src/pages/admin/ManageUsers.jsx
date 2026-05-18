import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../api/axiosInstance';
import { getAllProviders } from '../../api/providerApi';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [deletingId, setDeletingId] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  const [viewUserPhoto, setViewUserPhoto] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/auth/users/all');
      setUsers(response.data);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId, role) => {
    if (!window.confirm(`Delete this ${role}? This cannot be undone.`)) return;
    setDeletingId(userId);
    try {
      await axiosInstance.delete(`/auth/users/${userId}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const getRoleBadge = (role) => {
    const map = {
      PATIENT:  'badge-info',
      PROVIDER: 'badge-success',
      ADMIN:    'badge-warning'
    };
    return map[role] || 'badge-info';
  };

  const filtered = users.filter(u => {
    const roleMatch = filterRole === 'ALL' ? true : u.role === filterRole;
    const searchMatch = search.trim() === '' ? true :
      u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search);
    return roleMatch && searchMatch;
  });

  const patientCount  = users.filter(u => u.role === 'PATIENT').length;
  const providerCount = users.filter(u => u.role === 'PROVIDER').length;
  const adminCount    = users.filter(u => u.role === 'ADMIN').length;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#2C2825' }}>
          Manage Users
        </h2>
        <p style={{ color: '#8C7E72', fontSize: '14px', marginTop: '4px' }}>
          View all registered users on the platform
        </p>
      </div>

      {/* Summary cards */}
      {!loading && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '1rem', marginBottom: '1.5rem'
        }}>
          {[
            { label: 'Total Users', value: users.length,   color: '#2C2825', bg: '#FFFFFF', border: '#E2D9CE' },
            { label: 'Patients',    value: patientCount,   color: '#2D6B6B', bg: '#E8F4F4', border: '#B8DADA' },
            { label: 'Providers',   value: providerCount,  color: '#3D7A5A', bg: '#EBF5EF', border: '#B8D8C6' },
            { label: 'Admins',      value: adminCount,     color: '#9A7230', bg: '#FDF6E8', border: '#E8C87A' },
          ].map(stat => (
            <div key={stat.label} className="card" style={{
              backgroundColor: stat.bg, border: `1px solid ${stat.border}`,
              textAlign: 'center', padding: '1.2rem 1rem'
            }}>
              <p style={{ fontSize: '32px', fontWeight: '900', color: stat.color, letterSpacing: '-1px' }}>
                {stat.value}
              </p>
              <p style={{ fontSize: '12px', color: '#8C7E72', marginTop: '5px', fontWeight: '500' }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by name, email or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: '240px', padding: '10px 14px',
            border: '1.5px solid #E2D9CE', borderRadius: '8px',
            fontSize: '14px', outline: 'none', fontFamily: 'inherit',
            color: '#2C2825', backgroundColor: '#FAFAF8'
          }}
        />
        {['ALL', 'PATIENT', 'PROVIDER', 'ADMIN'].map(r => (
          <button
            key={r}
            onClick={() => setFilterRole(r)}
            className="btn"
            style={{
              backgroundColor: filterRole === r ? '#2D6B6B' : '#F2EDE4',
              color: filterRole === r ? 'white' : '#8C7E72',
              padding: '10px 20px', fontSize: '13px', fontWeight: '600',
              border: filterRole === r ? 'none' : '1px solid #E2D9CE'
            }}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#8C7E72' }}>
          Loading users...
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '3rem',
          backgroundColor: 'white', borderRadius: '12px',
          color: '#8C7E72', border: '1px solid #E2D9CE'
        }}>
          <p style={{ fontSize: '16px', fontWeight: '600', color: '#2C2825' }}>No users found</p>
        </div>
      )}

      {/* Users table */}
      {!loading && filtered.length > 0 && (
        <div className="table-wrap">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, index) => (
                <tr key={user.id}>
                  <td style={{ color: '#8C7E72', fontSize: '13px' }}>#{index + 1}</td>
                  <td style={{ fontWeight: '600', color: '#2C2825' }}>{user.fullName}</td>
                  <td style={{ fontSize: '13px', color: '#2D6B6B' }}>{user.email}</td>
                  <td style={{ fontSize: '13px', color: '#5C524A' }}>{user.phone || '—'}</td>
                  <td>
                    <span className={`badge ${getRoleBadge(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${user.active ? 'badge-success' : 'badge-danger'}`}>
                      {user.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ fontSize: '13px', color: '#5C524A' }}>{formatDate(user.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <button
                        onClick={async () => {
                          setViewUser(user);
                          setViewUserPhoto(null);
                          if (user.role === 'PROVIDER') {
                            try {
                              const providers = await getAllProviders();
                              const match = providers.find(p => p.userId === user.id);
                              if (match?.profilePhotoUrl) setViewUserPhoto(match.profilePhotoUrl);
                            } catch (err) {
                              console.error('Could not load provider photo');
                            }
                          }
                        }}
                        style={{
                          padding: '6px 16px', fontSize: '12px', fontWeight: '600',
                          backgroundColor: '#E8F4F4', color: '#2D6B6B',
                          border: '1px solid #2D6B6B', borderRadius: '6px',
                          cursor: 'pointer', fontFamily: 'inherit'
                        }}
                      >
                        View
                      </button>
                      {user.role !== 'ADMIN' && (
                        <button
                          className="btn btn-danger"
                          style={{ padding: '6px 16px', fontSize: '12px', fontWeight: '600' }}
                          onClick={() => handleDelete(user.id, user.role)}
                          disabled={deletingId === user.id}
                        >
                          {deletingId === user.id ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                      {user.role === 'ADMIN' && (
                        <span className="badge badge-warning" style={{ fontSize: '11px' }}>Protected</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {/* ── VIEW USER MODAL ── */}
      {viewUser && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(26,21,17,0.6)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000,
          padding: '1rem', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#FAF7F2', borderRadius: '20px',
            width: '100%', maxWidth: '480px',
            boxShadow: '0 16px 48px rgba(26,21,17,0.3)'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1F4E4E, #2D6B6B)',
              padding: '1.5rem 2rem', borderRadius: '20px 20px 0 0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '50px', height: '50px', borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', flexShrink: 0
                }}>
                  {viewUserPhoto ? (
                    <img src={viewUserPhoto} alt="Profile"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <svg width="30" height="34" viewBox="0 0 130 150">
                      <circle cx="65" cy="48" r="30" fill="rgba(255,255,255,0.85)"/>
                      <path d="M0 148 Q0 88 65 88 Q130 88 130 148 Z" fill="rgba(255,255,255,0.85)"/>
                    </svg>
                  )}
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'white', marginBottom: '2px' }}>
                    {viewUser.fullName}
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
                    {viewUser.email} · {viewUser.role}
                  </p>
                </div>
              </div>
              <button onClick={() => setViewUser(null)} style={{
                background: 'rgba(255,255,255,0.15)', border: 'none',
                borderRadius: '8px', width: '34px', height: '34px',
                color: 'white', fontSize: '16px', cursor: 'pointer'
              }}>✕</button>
            </div>

            <div style={{ padding: '1.5rem 2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'USER ID', value: `#${viewUser.id}` },
                  { label: 'ROLE',    value: viewUser.role },
                  { label: 'PHONE',   value: viewUser.phone || '—' },
                  { label: 'STATUS',  value: viewUser.active ? 'Active' : 'Deactivated' },
                  { label: 'EMAIL',   value: viewUser.email },
                  { label: 'JOINED',  value: viewUser.createdAt
                      ? new Date(viewUser.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'
                  },
                ].map((item, i) => (
                  <div key={i} style={{ backgroundColor: 'white', borderRadius: '10px', padding: '0.8rem 1rem', border: '1px solid #E2D9CE' }}>
                    <p style={{ fontSize: '10px', color: '#8C7E72', fontWeight: '700', letterSpacing: '1px', marginBottom: '4px' }}>{item.label}</p>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#2C2825' }}>{item.value}</p>
                  </div>
                ))}
              </div>

              <button onClick={() => setViewUser(null)} style={{
                width: '100%', padding: '12px', fontSize: '14px', fontWeight: '600',
                backgroundColor: '#F2EDE4', color: '#5C524A',
                border: '1px solid #E2D9CE', borderRadius: '10px',
                cursor: 'pointer', fontFamily: 'inherit'
              }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
