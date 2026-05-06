import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { loginUser, getUserByEmail } from '../../api/authApi';
import { getProviderByUserId } from '../../api/providerApi';
import { ROLES, ROUTES } from '../../utils/constants';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      localStorage.clear();

      const token = await loginUser(email, password);
      login(token);

      const { parseToken } = await import('../../utils/tokenUtils');
      const payload = parseToken(token);
      const role = payload.role;
      const userEmail = payload.sub;

      localStorage.setItem('email', userEmail);
      localStorage.setItem('role', role);

      const userObj = await getUserByEmail(userEmail);
      localStorage.setItem('userId', String(userObj.id));
      localStorage.setItem('fullName', userObj.fullName || '');

      if (role === ROLES.PROVIDER) {
        try {
          const providerObj = await getProviderByUserId(userObj.id);
          localStorage.setItem('providerId', String(providerObj.providerId));
        } catch {
          localStorage.removeItem('providerId');
          navigate('/provider/setup');
          return;
        }
      }

      toast.success('Login successful!');
      if (role === ROLES.PATIENT) navigate(ROUTES.PATIENT_DASHBOARD);
      else if (role === ROLES.PROVIDER) navigate(ROUTES.PROVIDER_DASHBOARD);
      else if (role === ROLES.ADMIN) navigate(ROUTES.ADMIN_DASHBOARD);

    } catch (err) {
      toast.error(err.response?.data || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f0f4f8'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🏥</div>
          <h1 style={{
            fontSize: '26px', fontWeight: '700',
            color: '#1e293b', marginBottom: '4px'
          }}>
            MediBook
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            Your Healthcare Companion
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '1rem' }}>
            <Link to="/forgot-password"
              style={{ fontSize: '13px', color: '#2D6B6B', fontWeight: '600', textDecoration: 'none' }}>
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Quick login buttons for testing */}
        <div style={{ marginTop: '1.5rem' }}>
          <p style={{
            textAlign: 'center', fontSize: '12px',
            color: '#94a3b8', marginBottom: '8px'
          }}>
            Quick login for testing:
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn"
              style={{
                flex: 1, fontSize: '12px', padding: '8px',
                backgroundColor: '#dbeafe', color: '#2563eb'
              }}
              onClick={() => {
                setEmail('rahul.patient@medibook.com');
                setPassword('patient123');
              }}
            >
              Patient
            </button>
            <button
              className="btn"
              style={{
                flex: 1, fontSize: '12px', padding: '8px',
                backgroundColor: '#dcfce7', color: '#16a34a'
              }}
              onClick={() => {
                setEmail('dr.himanshu@medibook.com');
                setPassword('doctor123');
              }}
            >
              Doctor
            </button>
            <button
              className="btn"
              style={{
                flex: 1, fontSize: '12px', padding: '8px',
                backgroundColor: '#fef9c3', color: '#ca8a04'
              }}
              onClick={() => {
                setEmail('admin@medibook.com');
                setPassword('admin123');
              }}
            >
              Admin
            </button>
          </div>
        </div>

        {/* Register link */}
        <p style={{
          textAlign: 'center', marginTop: '1.5rem',
          fontSize: '14px', color: '#64748b'
        }}>
          Don't have an account?{' '}
          <Link to={ROUTES.REGISTER} style={{
            color: '#2563eb', fontWeight: '600',
            textDecoration: 'none'
          }}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
