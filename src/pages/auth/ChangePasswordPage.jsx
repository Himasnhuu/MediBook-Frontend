import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { changePassword } from '../../api/authApi';
import { validatePassword, getPasswordStrength } from '../../utils/passwordUtils';

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const email = localStorage.getItem('email');
  const role = localStorage.getItem('role');

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordValidation = validatePassword(form.newPassword);
  const passwordStrength = getPasswordStrength(form.newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.currentPassword) { toast.error('Enter current password'); return; }
    if (!passwordValidation.isValid) { toast.error('New password does not meet requirements'); return; }
    if (form.newPassword !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (form.currentPassword === form.newPassword) { toast.error('New password must be different from current'); return; }

    setLoading(true);
    try {
      await changePassword(email, form.currentPassword, form.newPassword);
      toast.success('Password changed successfully!');
      if (role === 'PATIENT') navigate('/patient/dashboard');
      else if (role === 'PROVIDER') navigate('/provider/dashboard');
      else navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px 44px 12px 14px',
    border: '1.5px solid #E2D9CE', borderRadius: '8px',
    fontSize: '14px', outline: 'none',
    backgroundColor: 'white', color: '#2C2825',
    fontFamily: 'inherit', boxSizing: 'border-box',
    transition: 'border 0.2s'
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#FAF7F2', padding: '2rem 1rem'
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '20px',
        padding: '2.5rem', width: '100%', maxWidth: '440px',
        boxShadow: '0 8px 32px rgba(44,40,37,0.12)',
        border: '1px solid #E2D9CE'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔒</div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#2C2825', marginBottom: '6px' }}>
            Change Password
          </h1>
          <p style={{ fontSize: '13px', color: '#8C7E72' }}>
            Logged in as <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Current Password */}
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#5C524A', display: 'block', marginBottom: '6px' }}>
              Current Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showCurrent ? 'text' : 'password'}
                value={form.currentPassword}
                onChange={e => setForm({ ...form, currentPassword: e.target.value })}
                placeholder="Enter current password"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#2D6B6B'; }}
                onBlur={e => { e.target.style.borderColor = '#E2D9CE'; }}
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
                {showCurrent ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#5C524A', display: 'block', marginBottom: '6px' }}>
              New Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNew ? 'text' : 'password'}
                value={form.newPassword}
                onChange={e => setForm({ ...form, newPassword: e.target.value })}
                placeholder="Enter new password"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#2D6B6B'; }}
                onBlur={e => { e.target.style.borderColor = '#E2D9CE'; }}
              />
              <button type="button" onClick={() => setShowNew(!showNew)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
                {showNew ? '🙈' : '👁'}
              </button>
            </div>

            {form.newPassword && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#8C7E72' }}>Strength</span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: passwordStrength.color }}>{passwordStrength.label}</span>
                </div>
                <div style={{ height: '4px', backgroundColor: '#E2D9CE', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '2px',
                    backgroundColor: passwordStrength.color,
                    width: passwordStrength.label === 'Weak' ? '20%' : passwordStrength.label === 'Fair' ? '50%' : passwordStrength.label === 'Good' ? '75%' : '100%',
                    transition: 'width 0.3s'
                  }} />
                </div>
              </div>
            )}
          </div>

          {form.newPassword && (
            <div style={{ backgroundColor: '#FAF7F2', borderRadius: '10px', padding: '12px', marginBottom: '1rem', border: '1px solid #E2D9CE' }}>
              {[
                { rule: /.{8,}/, label: 'At least 8 characters' },
                { rule: /[A-Z]/, label: 'One uppercase letter' },
                { rule: /[a-z]/, label: 'One lowercase letter' },
                { rule: /[0-9]/, label: 'One number' },
                { rule: /[@#$%^&*!]/, label: 'One symbol (@#$%^&*!)' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{
                    width: '16px', height: '16px', borderRadius: '50%',
                    backgroundColor: item.rule.test(form.newPassword) ? '#16A34A' : '#E2D9CE',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', color: 'white', flexShrink: 0
                  }}>
                    {item.rule.test(form.newPassword) ? '✓' : ''}
                  </span>
                  <span style={{ fontSize: '12px', color: item.rule.test(form.newPassword) ? '#16A34A' : '#8C7E72' }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Confirm Password */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#5C524A', display: 'block', marginBottom: '6px' }}>
              Confirm New Password
            </label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="Re-enter new password"
              style={{ ...inputStyle, borderColor: form.confirmPassword && form.confirmPassword !== form.newPassword ? '#DC2626' : '#E2D9CE' }}
              onFocus={e => { e.target.style.borderColor = '#2D6B6B'; }}
              onBlur={e => { e.target.style.borderColor = form.confirmPassword && form.confirmPassword !== form.newPassword ? '#DC2626' : '#E2D9CE'; }}
            />
            {form.confirmPassword && form.confirmPassword !== form.newPassword && (
              <p style={{ fontSize: '12px', color: '#DC2626', marginTop: '4px' }}>Passwords do not match</p>
            )}
            {form.confirmPassword && form.confirmPassword === form.newPassword && (
              <p style={{ fontSize: '12px', color: '#16A34A', marginTop: '4px' }}>✓ Passwords match</p>
            )}
          </div>

          <button type="submit"
            disabled={loading || !passwordValidation.isValid || form.newPassword !== form.confirmPassword}
            style={{
              width: '100%', padding: '13px', fontSize: '15px', fontWeight: '700',
              backgroundColor: loading || !passwordValidation.isValid || form.newPassword !== form.confirmPassword
                ? '#8C7E72' : '#2D6B6B',
              color: 'white', border: 'none', borderRadius: '10px',
              cursor: 'pointer', fontFamily: 'inherit', marginBottom: '12px'
            }}>
            {loading ? 'Changing...' : 'Change Password ✓'}
          </button>

          <button type="button"
            onClick={() => navigate(-1)}
            style={{
              width: '100%', padding: '12px', fontSize: '14px', fontWeight: '600',
              backgroundColor: '#F2EDE4', color: '#5C524A',
              border: '1px solid #E2D9CE', borderRadius: '10px',
              cursor: 'pointer', fontFamily: 'inherit'
            }}>
            ← Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
