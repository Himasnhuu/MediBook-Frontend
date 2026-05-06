import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProviderAppointments from './ProviderAppointments';
import ManageSlots from './ManageSlots';
import Earnings from './Earnings';
import ProviderProfile from './ProviderProfile';

const NAV_ITEMS = [
  { path: '/provider/appointments', label: '📅 My Appointments' },
  { path: '/provider/slots',        label: '🕐 Manage Slots'    },
  { path: '/provider/earnings',     label: '💰 Earnings'        },
  { path: '/provider/profile',      label: '👤 My Profile'      },
];

const ProviderDashboard = () => {
  const { email, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const providerId = localStorage.getItem('providerId');

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>

      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? '240px' : '60px',
        backgroundColor: '#1F4E4E',
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
            borderBottom: '1px solid #2A6060',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              overflow: 'hidden', margin: '0 auto 6px',
              border: '2px solid #0f766e',
              backgroundColor: '#E8F4F4',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {localStorage.getItem('providerPhoto') ? (
                <img
                  src={localStorage.getItem('providerPhoto')}
                  alt="Profile"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: '24px' }}>👨‍⚕️</span>
              )}
            </div>
            <p style={{
              color: '#E8F4F4', fontSize: '13px',
              textAlign: 'center', wordBreak: 'break-all'
            }}>
              {email}
            </p>
            <p style={{
              color: '#C9963F', fontSize: '11px',
              textAlign: 'center', marginTop: '2px'
            }}>
              Provider
            </p>
            {providerId && (
              <p style={{
                color: '#8C7E72', fontSize: '11px',
                textAlign: 'center', marginTop: '2px'
              }}>
                ID: #{providerId}
              </p>
            )}
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
                  background: isActive ? '#2D6B6B' : 'none',
                  border: 'none', cursor: 'pointer',
                  color: isActive ? 'white' : '#8C7E72',
                  padding: sidebarOpen ? '12px 20px' : '12px 0',
                  fontSize: '14px', fontWeight: isActive ? '600' : '400',
                  transition: 'all 0.15s',
                  textAlign: sidebarOpen ? 'left' : 'center',
                  borderLeft: isActive ? '3px solid #C9963F' : '3px solid transparent'
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
            borderTop: '1px solid #2A6060',
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
        {/* Warning if providerId is missing */}
        {!providerId && (
          <div style={{
            backgroundColor: '#fef3c7', border: '1px solid #fcd34d',
            borderRadius: '8px', padding: '12px 16px',
            marginBottom: '1.5rem', fontSize: '14px', color: '#92400e'
          }}>
            ⚠️ Provider profile not found. Please make sure your provider profile is created.
          </div>
        )}

        <Routes>
          <Route index element={<Navigate to="/provider/appointments" replace />} />
          <Route path="appointments" element={<ProviderAppointments />} />
          <Route path="slots"        element={<ManageSlots />} />
          <Route path="earnings"     element={<Earnings />} />
          <Route path="profile" element={<ProviderProfile />} />
        </Routes>
      </div>

    </div>
  );
};

export default ProviderDashboard;
