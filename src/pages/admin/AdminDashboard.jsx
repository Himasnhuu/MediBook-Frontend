import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import ManageProviders from './ManageProviders';
import ManageUsers from './ManageUsers';
import ManageSpecializations from './ManageSpecializations';
import ManageRefunds from './ManageRefunds';

const NAV_ITEMS = [
  { path: '/admin/providers',        label: 'Manage Providers', short: 'P' },
  { path: '/admin/users',            label: 'Manage Users',     short: 'U' },
  { path: '/admin/specializations',  label: 'Specializations',  short: 'S' },
  { path: '/admin/refunds',          label: 'Manage Refunds',   short: 'R' },
];

const AdminDashboard = () => {
  const { email, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [adminPhoto, setAdminPhoto] = useState(localStorage.getItem('adminPhoto') || null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname]);

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

  const truncateEmail = (e) => e && e.length > 22 ? e.slice(0, 20) + '…' : e;

  const sidebarWidth = isMobile ? '260px' : (sidebarOpen ? '240px' : '64px');

  return (
    <div className="dashboard-wrapper">

      {/* ── MOBILE OVERLAY ── */}
      {isMobile && sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <div
        className={`dashboard-sidebar${isMobile ? (sidebarOpen ? ' open' : '') : ''}`}
        style={{
          width: sidebarWidth,
          background: 'linear-gradient(180deg, #1A1511 0%, #2C2825 100%)',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        {/* Toggle button — desktop only */}
        {!isMobile && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'none', border: 'none',
              color: '#5C524A', cursor: 'pointer',
              fontSize: '12px', padding: '14px 16px',
              textAlign: 'right', letterSpacing: '1px',
              transition: 'color 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#8C7E72'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#5C524A'; }}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        )}

        {/* ── PROFILE SECTION ── */}
        {(sidebarOpen || isMobile) && (
          <div style={{
            padding: isMobile ? '1rem 1.25rem 1.25rem' : '0.5rem 1.25rem 1.25rem',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            marginBottom: '0.5rem'
          }}>
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(false)}
                style={{
                  background: 'none', border: 'none', color: '#5C524A',
                  cursor: 'pointer', fontSize: '16px', marginBottom: '0.75rem',
                  display: 'block', marginLeft: 'auto', padding: '4px'
                }}
              >✕</button>
            )}
            <label style={{ cursor: 'pointer', display: 'block' }} title="Click to change photo">
              <div style={{
                width: '68px', height: '68px', borderRadius: '50%',
                margin: '0 auto 10px', padding: '2px',
                background: 'linear-gradient(135deg, #C9963F, #2D6B6B)',
              }}>
                <div style={{
                  width: '100%', height: '100%', borderRadius: '50%',
                  overflow: 'hidden', backgroundColor: '#2C2825',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {adminPhoto ? (
                    <img src={adminPhoto} alt="Admin"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <svg width="42" height="48" viewBox="0 0 130 150">
                      <circle cx="65" cy="48" r="30" fill="rgba(255,255,255,0.7)"/>
                      <path d="M0 148 Q0 88 65 88 Q130 88 130 148 Z" fill="rgba(255,255,255,0.7)"/>
                    </svg>
                  )}
                </div>
              </div>
              <input type="file" accept="image/jpeg,image/png"
                onChange={handleAdminPhotoChange} style={{ display: 'none' }} />
            </label>

            <p style={{
              color: '#D8D0C5', fontSize: '13px', fontWeight: '500',
              textAlign: 'center', marginBottom: '6px'
            }}>
              {truncateEmail(email)}
            </p>

            <div style={{ textAlign: 'center' }}>
              <span style={{
                display: 'inline-block',
                backgroundColor: 'rgba(201,150,63,0.18)', color: '#E8C87A',
                border: '1px solid rgba(201,150,63,0.35)',
                borderRadius: '20px', fontSize: '10px', fontWeight: '700',
                padding: '3px 12px', letterSpacing: '1.2px'
              }}>
                ADMINISTRATOR
              </span>
            </div>
          </div>
        )}

        {/* Collapsed avatar — desktop only */}
        {!sidebarOpen && !isMobile && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem 0 1rem' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '50%', padding: '2px',
              background: 'linear-gradient(135deg, #C9963F, #2D6B6B)',
            }}>
              <div style={{
                width: '100%', height: '100%', borderRadius: '50%',
                backgroundColor: '#2C2825', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {adminPhoto ? (
                  <img src={adminPhoto} alt="Admin"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <svg width="22" height="26" viewBox="0 0 130 150">
                    <circle cx="65" cy="48" r="30" fill="rgba(255,255,255,0.7)"/>
                    <path d="M0 148 Q0 88 65 88 Q130 88 130 148 Z" fill="rgba(255,255,255,0.7)"/>
                  </svg>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── NAV ITEMS ── */}
        <nav style={{ flex: 1, padding: '0.25rem 0' }}>
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const showLabel = sidebarOpen || isMobile;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  width: '100%',
                  background: isActive ? 'rgba(201,150,63,0.12)' : 'transparent',
                  border: 'none',
                  borderLeft: isActive ? '3px solid #C9963F' : '3px solid transparent',
                  cursor: 'pointer',
                  color: isActive ? '#F0C878' : '#8C7E72',
                  padding: showLabel ? '13px 20px' : '13px 0',
                  fontSize: '14px',
                  fontWeight: isActive ? '700' : '400',
                  transition: 'all 0.15s ease',
                  textAlign: showLabel ? 'left' : 'center',
                  fontFamily: 'inherit'
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.color = '#B8AFA6';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#8C7E72';
                  }
                }}
              >
                {showLabel ? item.label : item.short}
              </button>
            );
          })}
        </nav>

        {/* ── BOTTOM ACTIONS ── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '0.5rem' }}>
          {(sidebarOpen || isMobile) && (
            <button
              onClick={() => navigate('/change-password')}
              style={{
                width: '100%', background: 'none', border: 'none',
                cursor: 'pointer', color: '#8C7E72',
                padding: '11px 20px', fontSize: '13px', fontWeight: '500',
                textAlign: 'left', fontFamily: 'inherit', transition: 'color 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#B8AFA6'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#8C7E72'; }}
            >
              Change Password
            </button>
          )}

          <button
            onClick={logout}
            style={{
              width: '100%', background: 'none', border: 'none',
              cursor: 'pointer', color: '#C87070',
              padding: (sidebarOpen || isMobile) ? '11px 20px' : '11px 0',
              fontSize: '13px', fontWeight: '600',
              textAlign: (sidebarOpen || isMobile) ? 'left' : 'center',
              fontFamily: 'inherit', transition: 'all 0.2s', marginBottom: '0.5rem'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#F08080';
              e.currentTarget.style.backgroundColor = 'rgba(200,112,112,0.08)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#C87070';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {(sidebarOpen || isMobile) ? 'Logout' : '←'}
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div
        className="dashboard-content"
        style={{ backgroundColor: '#FAF7F2', padding: '2rem' }}
      >
        {/* Mobile hamburger */}
        {isMobile && (
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
            ☰ Menu
          </button>
        )}

        <Routes>
          <Route index element={<Navigate to="/admin/providers" replace />} />
          <Route path="providers" element={<ManageProviders />} />
          <Route path="users"     element={<ManageUsers />} />
          <Route path="specializations" element={<ManageSpecializations />} />
          <Route path="refunds"   element={<ManageRefunds />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminDashboard;
