import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES, ROUTES } from '../utils/constants';
import { getUnreadCount, getNotificationsByUser, markAllAsRead } from '../api/notificationApi';

const Navbar = () => {
  const { isAuthenticated, role, email, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (isAuthenticated() && userId) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showNotifPanel && !e.target.closest('.notif-container')) {
        setShowNotifPanel(false);
      }
      if (mobileOpen && !e.target.closest('.nav-mobile-menu') && !e.target.closest('.nav-hamburger')) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifPanel, mobileOpen]);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const fetchUnreadCount = async () => {
    try {
      const count = await getUnreadCount(userId);
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to fetch notifications');
    }
  };

  const handleOpenNotifications = async () => {
    setShowNotifPanel(!showNotifPanel);
    if (!showNotifPanel) {
      try {
        const data = await getNotificationsByUser(userId);
        setNotifications(data);
        await markAllAsRead(userId);
        setUnreadCount(0);
      } catch (err) {
        console.error('Failed to load notifications');
      }
    }
  };

  const getDashboardLink = () => {
    if (role === ROLES.PATIENT) return ROUTES.PATIENT_DASHBOARD;
    if (role === ROLES.PROVIDER) return ROUTES.PROVIDER_DASHBOARD;
    if (role === ROLES.ADMIN) return ROUTES.ADMIN_DASHBOARD;
    return ROUTES.LOGIN;
  };

  const getNotifIcon = (type) => {
    const map = {
      APPOINTMENT_BOOKED:    '📅',
      APPOINTMENT_CANCELLED: '❌',
      APPOINTMENT_COMPLETED: '✅',
      PAYMENT_SUCCESS:       '💳',
      PAYMENT_REFUNDED:      '↩️',
      REVIEW_RECEIVED:       '⭐',
    };
    return map[type] || '🔔';
  };

  const getNotifColor = (type) => {
    const map = {
      APPOINTMENT_BOOKED:    { bg: '#E8F4F4' },
      APPOINTMENT_CANCELLED: { bg: '#FBF0F0' },
      APPOINTMENT_COMPLETED: { bg: '#EBF5EF' },
      PAYMENT_SUCCESS:       { bg: '#EBF5EF' },
      PAYMENT_REFUNDED:      { bg: '#EFF6FF' },
      REVIEW_RECEIVED:       { bg: '#FDF6E8' },
    };
    return map[type] || { bg: '#F2EDE4' };
  };

  if (location.pathname === '/') return null;
  if (location.pathname === '/doctors') return null;

  return (
    <nav style={{
      backgroundColor: '#FFFFFF',
      padding: '0 1.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: '64px',
      boxShadow: '0 2px 8px rgba(44,40,37,0.08)',
      borderBottom: '1px solid #E2D9CE',
      position: 'relative',
      zIndex: 400
    }}>
      <Link to="/" style={{
        color: '#2D6B6B', textDecoration: 'none',
        fontSize: '20px', fontWeight: '800',
        letterSpacing: '-0.5px', flexShrink: 0
      }}>
        🏥 MediBook
      </Link>

      {/* ── DESKTOP NAV ── */}
      <div className="nav-desktop">
        {isAuthenticated() ? (
          <>
            <Link to={getDashboardLink()} style={{
              color: '#5C524A', textDecoration: 'none',
              fontSize: '14px', fontWeight: '600'
            }}>
              Dashboard
            </Link>
            <span style={{ color: '#8C7E72', fontSize: '13px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {email} ({role})
            </span>

            {/* Notification bell */}
            <div className="notif-container" style={{ position: 'relative' }}>
              <button
                onClick={handleOpenNotifications}
                style={{
                  background: 'none', border: '1.5px solid #E2D9CE',
                  borderRadius: '8px', padding: '6px 12px',
                  cursor: 'pointer', fontSize: '18px',
                  position: 'relative', color: '#5C524A'
                }}
              >
                🔔
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-6px', right: '-6px',
                    backgroundColor: '#C9963F', color: 'white',
                    borderRadius: '50%', width: '18px', height: '18px',
                    fontSize: '10px', fontWeight: '800',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification panel */}
              {showNotifPanel && (
                <div style={{
                  position: 'absolute', top: '48px', right: 0,
                  width: '360px', backgroundColor: 'white',
                  borderRadius: '16px', boxShadow: '0 8px 32px rgba(44,40,37,0.16)',
                  border: '1px solid #E2D9CE', zIndex: 1000,
                  maxHeight: '480px', overflowY: 'auto'
                }}>
                  <div style={{
                    padding: '1rem 1.2rem',
                    borderBottom: '1px solid #E2D9CE',
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', position: 'sticky',
                    top: 0, backgroundColor: 'white', zIndex: 1
                  }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#2C2825' }}>
                      🔔 Notifications
                    </h3>
                    <button
                      onClick={() => setShowNotifPanel(false)}
                      style={{
                        background: 'none', border: 'none',
                        fontSize: '16px', cursor: 'pointer', color: '#8C7E72'
                      }}
                    >✕</button>
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#8C7E72' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔔</div>
                      <p style={{ fontSize: '14px' }}>No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.notificationId} style={{
                        padding: '1rem 1.2rem',
                        borderBottom: '1px solid #F2EDE4',
                        backgroundColor: notif.isRead ? 'white' : '#FDF8F0',
                        transition: 'background 0.2s'
                      }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            backgroundColor: getNotifColor(notif.type).bg,
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '16px',
                            flexShrink: 0
                          }}>
                            {getNotifIcon(notif.type)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '13px', fontWeight: '700', color: '#2C2825', marginBottom: '3px' }}>
                              {notif.title}
                            </p>
                            <p style={{
                              fontSize: '12px', color: '#8C7E72', lineHeight: '1.5',
                              display: '-webkit-box', WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical', overflow: 'hidden'
                            }}
                              dangerouslySetInnerHTML={{ __html: notif.message?.substring(0, 100) + '...' }}
                            />
                            <p style={{ fontSize: '11px', color: '#C9963F', marginTop: '4px' }}>
                              {notif.createdAt
                                ? new Date(notif.createdAt).toLocaleDateString('en-IN', {
                                    day: '2-digit', month: 'short',
                                    hour: '2-digit', minute: '2-digit'
                                  })
                                : ''}
                            </p>
                          </div>
                          {!notif.isRead && (
                            <div style={{
                              width: '8px', height: '8px', borderRadius: '50%',
                              backgroundColor: '#C9963F', flexShrink: 0, marginTop: '4px'
                            }} />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <button
              onClick={logout}
              style={{
                backgroundColor: '#2D6B6B', color: 'white',
                border: 'none', padding: '6px 16px',
                borderRadius: '6px', cursor: 'pointer',
                fontWeight: '600', fontSize: '14px', fontFamily: 'inherit'
              }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to={ROUTES.LOGIN} style={{
              color: '#5C524A', textDecoration: 'none',
              fontSize: '14px', fontWeight: '600'
            }}>
              Login
            </Link>
            <Link to={ROUTES.REGISTER} style={{
              backgroundColor: '#2D6B6B', color: 'white',
              textDecoration: 'none', padding: '6px 16px',
              borderRadius: '6px', fontWeight: '600', fontSize: '14px'
            }}>
              Register
            </Link>
          </>
        )}
      </div>

      {/* ── MOBILE: notification badge + hamburger ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {isAuthenticated() && (
          <div style={{ position: 'relative' }} className="notif-container">
            <button
              className="nav-hamburger"
              onClick={handleOpenNotifications}
              style={{
                background: 'none', border: '1.5px solid #E2D9CE',
                borderRadius: '8px', padding: '6px 10px',
                cursor: 'pointer', fontSize: '18px', position: 'relative', color: '#5C524A'
              }}
            >
              🔔
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: '-5px', right: '-5px',
                  backgroundColor: '#C9963F', color: 'white',
                  borderRadius: '50%', width: '16px', height: '16px',
                  fontSize: '9px', fontWeight: '800',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {showNotifPanel && (
              <div style={{
                position: 'fixed', top: '64px', left: '0', right: '0',
                backgroundColor: 'white', borderBottom: '1px solid #E2D9CE',
                zIndex: 600, maxHeight: '70vh', overflowY: 'auto',
                boxShadow: '0 8px 32px rgba(44,40,37,0.16)'
              }}>
                <div style={{
                  padding: '1rem 1.2rem',
                  borderBottom: '1px solid #E2D9CE',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  position: 'sticky', top: 0, backgroundColor: 'white'
                }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#2C2825' }}>🔔 Notifications</h3>
                  <button onClick={() => setShowNotifPanel(false)}
                    style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#8C7E72' }}>✕</button>
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#8C7E72' }}>
                    <p style={{ fontSize: '14px' }}>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.notificationId} style={{
                      padding: '0.85rem 1.2rem', borderBottom: '1px solid #F2EDE4',
                      backgroundColor: notif.isRead ? 'white' : '#FDF8F0'
                    }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          backgroundColor: getNotifColor(notif.type).bg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0
                        }}>
                          {getNotifIcon(notif.type)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '13px', fontWeight: '700', color: '#2C2825', marginBottom: '2px' }}>{notif.title}</p>
                          <p style={{ fontSize: '12px', color: '#8C7E72' }}
                            dangerouslySetInnerHTML={{ __html: notif.message?.substring(0, 80) + '...' }} />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        <button
          className="nav-hamburger"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* ── MOBILE DROPDOWN MENU ── */}
      {mobileOpen && (
        <div className="nav-mobile-menu">
          {isAuthenticated() ? (
            <>
              <span className="nav-email">{email} · {role}</span>
              <Link to={getDashboardLink()}>Dashboard</Link>
              <Link to="/change-password">Change Password</Link>
              <button className="nav-logout-btn" onClick={() => { logout(); setMobileOpen(false); }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to={ROUTES.LOGIN}>Login</Link>
              <Link to={ROUTES.REGISTER}>Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
