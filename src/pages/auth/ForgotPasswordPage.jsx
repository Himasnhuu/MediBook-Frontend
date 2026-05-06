import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { forgotPasswordSendOtp, resetPassword } from '../../api/authApi';
import { validatePassword, getPasswordStrength } from '../../utils/passwordUtils';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // 'email' → 'otp' → 'reset'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (otpTimer > 0) {
      const t = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [otpTimer]);

  const passwordValidation = validatePassword(newPassword);
  const passwordStrength = getPasswordStrength(newPassword);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) { toast.error('Enter your email'); return; }
    setLoading(true);
    try {
      await forgotPasswordSendOtp(email);
      toast.success(`OTP sent to ${email}!`);
      setStep('otp');
      setOtpTimer(60);
    } catch (err) {
      toast.error(err.response?.data || 'Email not found');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) { toast.error('Enter 6-digit OTP'); return; }
    setStep('reset');
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!passwordValidation.isValid) {
      toast.error('Password does not meet requirements');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email, otp, newPassword);
      toast.success('Password reset successfully! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px 14px',
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
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔑</div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#2C2825', marginBottom: '6px' }}>
            {step === 'email' && 'Forgot Password'}
            {step === 'otp' && 'Verify OTP'}
            {step === 'reset' && 'Reset Password'}
          </h1>
          <p style={{ fontSize: '13px', color: '#8C7E72' }}>
            {step === 'email' && 'Enter your email to receive an OTP'}
            {step === 'otp' && `OTP sent to ${email}`}
            {step === 'reset' && 'Create your new password'}
          </p>
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '2rem' }}>
          {['email', 'otp', 'reset'].map((s, i) => (
            <div key={s} style={{
              width: '32px', height: '4px', borderRadius: '2px',
              backgroundColor: ['email', 'otp', 'reset'].indexOf(step) >= i
                ? '#2D6B6B' : '#E2D9CE',
              transition: 'background 0.3s'
            }} />
          ))}
        </div>

        {/* ── STEP 1: Email ── */}
        {step === 'email' && (
          <form onSubmit={handleSendOtp}>
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#5C524A', display: 'block', marginBottom: '6px' }}>
                Email Address
              </label>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#2D6B6B'; }}
                onBlur={e => { e.target.style.borderColor = '#E2D9CE'; }}
              />
            </div>
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '13px', fontSize: '15px', fontWeight: '700',
              backgroundColor: loading ? '#8C7E72' : '#2D6B6B', color: 'white',
              border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit'
            }}>
              {loading ? 'Sending OTP...' : 'Send OTP →'}
            </button>
          </form>
        )}

        {/* ── STEP 2: OTP ── */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp}>
            <div style={{
              backgroundColor: '#E8F4F4', border: '1px solid #2D6B6B',
              borderRadius: '10px', padding: '1rem', textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              <p style={{ fontSize: '13px', color: '#1F4E4E', fontWeight: '600' }}>
                Check your inbox at <strong>{email}</strong>
              </p>
              <p style={{ fontSize: '12px', color: '#2D6B6B', marginTop: '4px' }}>
                Valid for 10 minutes
              </p>
            </div>

            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#5C524A', display: 'block', marginBottom: '6px' }}>
                Enter 6-Digit OTP
              </label>
              <input
                type="text" value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="_ _ _ _ _ _" maxLength={6}
                style={{ ...inputStyle, textAlign: 'center', fontSize: '24px', fontWeight: '800', letterSpacing: '12px' }}
                onFocus={e => { e.target.style.borderColor = '#2D6B6B'; }}
                onBlur={e => { e.target.style.borderColor = '#E2D9CE'; }}
              />
            </div>

            <button type="submit" disabled={otp.length !== 6} style={{
              width: '100%', padding: '13px', fontSize: '15px', fontWeight: '700',
              backgroundColor: otp.length !== 6 ? '#8C7E72' : '#2D6B6B', color: 'white',
              border: 'none', borderRadius: '10px',
              cursor: otp.length !== 6 ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              marginBottom: '12px'
            }}>
              Verify OTP →
            </button>

            <div style={{ textAlign: 'center' }}>
              {otpTimer > 0 ? (
                <p style={{ fontSize: '13px', color: '#8C7E72' }}>
                  Resend in <strong style={{ color: '#2D6B6B' }}>{otpTimer}s</strong>
                </p>
              ) : (
                <button type="button"
                  onClick={async () => {
                    await forgotPasswordSendOtp(email);
                    toast.success('New OTP sent!');
                    setOtpTimer(60);
                  }}
                  style={{ background: 'none', border: 'none', color: '#2D6B6B', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Resend OTP
                </button>
              )}
            </div>
          </form>
        )}

        {/* ── STEP 3: New Password ── */}
        {step === 'reset' && (
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#5C524A', display: 'block', marginBottom: '6px' }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  style={{ ...inputStyle, paddingRight: '44px' }}
                  onFocus={e => { e.target.style.borderColor = '#2D6B6B'; }}
                  onBlur={e => { e.target.style.borderColor = '#E2D9CE'; }}
                />
                <button type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>

              {newPassword && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#8C7E72' }}>Password strength</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div style={{ height: '4px', backgroundColor: '#E2D9CE', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '2px',
                      backgroundColor: passwordStrength.color,
                      width: passwordStrength.label === 'Weak' ? '20%'
                        : passwordStrength.label === 'Fair' ? '50%'
                        : passwordStrength.label === 'Good' ? '75%' : '100%',
                      transition: 'width 0.3s, background 0.3s'
                    }} />
                  </div>
                </div>
              )}
            </div>

            {newPassword && (
              <div style={{
                backgroundColor: '#FAF7F2', borderRadius: '10px',
                padding: '12px', marginBottom: '1rem', border: '1px solid #E2D9CE'
              }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#5C524A', marginBottom: '8px', letterSpacing: '0.5px' }}>
                  PASSWORD REQUIREMENTS
                </p>
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
                      backgroundColor: item.rule.test(newPassword) ? '#16A34A' : '#E2D9CE',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px', color: 'white', flexShrink: 0, transition: 'background 0.2s'
                    }}>
                      {item.rule.test(newPassword) ? '✓' : ''}
                    </span>
                    <span style={{ fontSize: '12px', color: item.rule.test(newPassword) ? '#16A34A' : '#8C7E72', transition: 'color 0.2s' }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#5C524A', display: 'block', marginBottom: '6px' }}>
                Confirm Password
              </label>
              <input
                type="password" value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                style={{
                  ...inputStyle,
                  borderColor: confirmPassword && confirmPassword !== newPassword ? '#DC2626' : '#E2D9CE'
                }}
                onFocus={e => { e.target.style.borderColor = '#2D6B6B'; }}
                onBlur={e => { e.target.style.borderColor = confirmPassword && confirmPassword !== newPassword ? '#DC2626' : '#E2D9CE'; }}
              />
              {confirmPassword && confirmPassword !== newPassword && (
                <p style={{ fontSize: '12px', color: '#DC2626', marginTop: '4px' }}>Passwords do not match</p>
              )}
              {confirmPassword && confirmPassword === newPassword && (
                <p style={{ fontSize: '12px', color: '#16A34A', marginTop: '4px' }}>✓ Passwords match</p>
              )}
            </div>

            <button type="submit" disabled={loading || !passwordValidation.isValid || newPassword !== confirmPassword}
              style={{
                width: '100%', padding: '13px', fontSize: '15px', fontWeight: '700',
                backgroundColor: loading || !passwordValidation.isValid || newPassword !== confirmPassword
                  ? '#8C7E72' : '#2D6B6B',
                color: 'white', border: 'none', borderRadius: '10px',
                cursor: loading || !passwordValidation.isValid || newPassword !== confirmPassword
                  ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit'
              }}>
              {loading ? 'Resetting...' : 'Reset Password ✓'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '13px', color: '#8C7E72' }}>
          Remember your password?{' '}
          <Link to="/login" style={{ color: '#2D6B6B', fontWeight: '700', textDecoration: 'none' }}>
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
