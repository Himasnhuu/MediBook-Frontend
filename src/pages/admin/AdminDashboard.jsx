import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import ManageProviders from './ManageProviders';
import ManageUsers from './ManageUsers';
import ManageSpecializations from './ManageSpecializations';

const NAV_ITEMS = [
  { path: '/admin/providers', label: '👨‍⚕️ Manage Providers' },
  { path: '/admin/users',     label: '👥 Manage Users'     },
  { path: '/admin/specializations', label: '🏥 Specializations'     },
];

const AdminDashboard = () => {
  const { email, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [adminPhoto, setAdminPhoto] = useState(localStorage.getItem('adminPhoto') || null);

  const handleAdminPhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Max 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setAdminPhoto(reader.result);
      localStorage.setItem('adminPhoto', reader.result);
      toast.success('Profile photo updated!');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>

      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? '240px' : '60px',
        backgroundColor: '#2C2825',
        transition: 'width 0.2s',
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem 0',
        flexShrink: 0
      }}>
        {/* Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            background: 'none', border: 'none',
            color: '#8C7E72', cursor: 'pointer',
            fontSize: '18px', padding: '8px 16px',
            textAlign: 'right', marginBottom: '1rem'
          }}
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>

        {/* User info */}
        {sidebarOpen && (
          <div style={{
            padding: '0 1rem 1rem',
            borderBottom: '1px solid #3D3530',
            marginBottom: '1rem'
          }}>
            <label style={{ cursor: 'pointer' }} title="Click to change photo">
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                overflow: 'hidden', margin: '0 auto 6px',
                border: '2px solid rgba(255,255,255,0.3)',
                backgroundColor: 'rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {adminPhoto ? (
                  <img src={adminPhoto} alt="Admin"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '28px' }}>👤</span>
                )}
              </div>
              <input type="file" accept="image/jpeg,image/png"
                onChange={handleAdminPhotoChange}
                style={{ display: 'none' }} />
            </label>
            <p style={{
              color: '#E8E0D5', fontSize: '13px',
              textAlign: 'center', wordBreak: 'break-all'
            }}>
              {email}
            </p>
            <p style={{
              color: '#C9963F', fontSize: '11px',
              textAlign: 'center', marginTop: '2px'
            }}>
              Administrator
            </p>
          </div>
        )}

        {/* Nav items */}
        <nav style={{ flex: 1 }}>
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  width: '100%',
                  background: isActive ? '#C9963F' : 'none',
                  border: 'none', cursor: 'pointer',
                  color: isActive ? 'white' : '#8C7E72',
                  padding: sidebarOpen ? '12px 20px' : '12px 0',
                  fontSize: '14px', fontWeight: isActive ? '600' : '400',
                  transition: 'all 0.15s',
                  textAlign: sidebarOpen ? 'left' : 'center',
                  borderLeft: isActive ? '3px solid #E8C87A' : '3px solid transparent'
                }}
              >
                {sidebarOpen ? item.label : item.label.split(' ')[0]}
              </button>
            );
          })}
        </nav>

        {/* Change Password */}
        {sidebarOpen && (
          <div
            onClick={() => navigate('/change-password')}
            style={{
              padding: '10px 16px', cursor: 'pointer',
              fontSize: '14px', color: 'rgba(255,255,255,0.75)',
              display: 'flex', alignItems: 'center', gap: '10px',
              borderRadius: '8px', transition: 'all 0.2s',
              margin: '0 4px'
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            🔒 Change Password
          </div>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          style={{
            background: 'none', border: 'none',
            color: '#f87171', cursor: 'pointer',
            padding: sidebarOpen ? '12px 20px' : '12px 0',
            fontSize: '14px', fontWeight: '600',
            textAlign: sidebarOpen ? 'left' : 'center',
            borderTop: '1px solid #3D3530',
            marginTop: '0.5rem'
          }}
        >
          {sidebarOpen ? '🚪 Logout' : '🚪'}
        </button>
      </div>

      {/* Main content */}
      <div style={{
        flex: 1, padding: '2rem',
        backgroundColor: '#FAF7F2',
        overflowY: 'auto'
      }}>
        <Routes>
          <Route index element={<Navigate to="/admin/providers" replace />} />
          <Route path="providers" element={<ManageProviders />} />
          <Route path="users"     element={<ManageUsers />} />
          <Route path="specializations" element={<ManageSpecializations />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminDashboard;
