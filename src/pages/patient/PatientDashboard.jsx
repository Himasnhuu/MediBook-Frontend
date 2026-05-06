import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import SearchDoctors from './SearchDoctors';
import PatientAppointments from './PatientAppointments';
import PatientRecords from './PatientRecords';
import PatientPayments from './PatientPayments';

const NAV_ITEMS = [
  { path: '/patient/search',       label: '🔍 Search Doctors'    },
  { path: '/patient/appointments', label: '📅 My Appointments'   },
  { path: '/patient/records',      label: '🗂️ My Records'        },
  { path: '/patient/payments',     label: '💳 My Payments'       },
];

const PatientDashboard = () => {
  const { email, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [patientPhoto, setPatientPhoto] = useState(localStorage.getItem('patientPhoto') || null);

  const handlePatientPhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Photo must be less than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPatientPhoto(reader.result);
      localStorage.setItem('patientPhoto', reader.result);
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
        {/* Toggle button */}
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
            <label style={{ cursor: 'pointer', display: 'block' }} title="Click to change photo">
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                overflow: 'hidden', margin: '0 auto 6px',
                border: '2px solid rgba(255,255,255,0.3)',
                backgroundColor: 'rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative'
              }}>
                {patientPhoto ? (
                  <img src={patientPhoto} alt="Profile"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '28px' }}>🧑</span>
                )}
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: 0, transition: 'opacity 0.2s', borderRadius: '50%'
                }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = 1; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = 0; }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
              </div>
              <input type="file" accept="image/jpeg,image/png"
                onChange={handlePatientPhotoChange}
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
              Patient
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
          <Route index element={<Navigate to="/patient/search" replace />} />
          <Route path="search"       element={<SearchDoctors />} />
          <Route path="appointments" element={<PatientAppointments />} />
          <Route path="records"      element={<PatientRecords />} />
          <Route path="payments"     element={<PatientPayments />} />
        </Routes>
      </div>

    </div>
  );
};

export default PatientDashboard;
