import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { registerUser, sendOtp, verifyOtp } from '../../api/authApi';
import { validatePassword } from '../../utils/passwordUtils';
import { getSpecializations } from '../../api/providerApi';
import { ROUTES } from '../../utils/constants';

const RegisterPage = () => {
  const navigate = useNavigate();

  // Steps: 'form' → 'otp' → done
  const [step, setStep] = useState('form');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    passwordHash: '',
    confirmPassword: '',
    phone: '',
    role: 'PATIENT',
    specialization: ''
  });

  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    getSpecializations().then(setSpecializations).catch(console.error);
  }, []);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email ||
        !formData.passwordHash || !formData.phone) {
      toast.error('Please fill in all fields');
      return;
    }
    if (formData.passwordHash !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    const passwordCheck = validatePassword(formData.passwordHash);
    if (!passwordCheck.isValid) {
      toast.error('Password requirements not met: ' + passwordCheck.errors[0]);
      return;
    }
    if (formData.role === 'PROVIDER' && !formData.specialization) {
      toast.error('Please select your specialization');
      return;
    }

    setLoading(true);
    try {
      await sendOtp(formData.email);
      toast.success(`OTP sent to ${formData.email}! Check your inbox.`);
      setStep('otp');
      setOtpTimer(60);
    } catch (err) {
      toast.error(err.response?.data || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }
    setOtpLoading(true);
    try {
      // Step 1 — Verify OTP
      await verifyOtp(formData.email, otp);

      // Step 2 — Register user
      await registerUser({
        fullName: formData.fullName,
        email: formData.email,
        passwordHash: formData.passwordHash,
        phone: formData.phone,
        role: formData.role
      });

      // Save specialization for provider setup
      if (formData.role === 'PROVIDER') {
        localStorage.setItem('pendingSpecialization', formData.specialization);
      }

      toast.success('Account created successfully! Please login.');
      navigate(ROUTES.LOGIN);
    } catch (err) {
      toast.error(err.response?.data || 'Invalid OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    try {
      await sendOtp(formData.email);
      toast.success('New OTP sent!');
      setOtpTimer(60);
      setOtp('');
    } catch (err) {
      toast.error('Failed to resend OTP');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#FAF7F2', padding: '2rem 1rem'
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '20px',
        padding: '2.5rem', width: '100%', maxWidth: '500px',
        boxShadow: '0 8px 32px rgba(44,40,37,0.12)',
        border: '1px solid #E2D9CE'
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🏥</div>
          <h1 style={{
            fontSize: '26px', fontWeight: '800',
            color: '#2C2825', marginBottom: '4px'
          }}>
            {step === 'form' ? 'Create Account' : 'Verify Email'}
          </h1>
          <p style={{ color: '#8C7E72', fontSize: '14px' }}>
            {step === 'form'
              ? 'Join MediBook today'
              : `Enter the 6-digit OTP sent to ${formData.email}`}
          </p>
        </div>

        {/* ── STEP 1: Registration Form ── */}
        {step === 'form' && (
          <>
            {/* Role selector */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
              {['PATIENT', 'PROVIDER'].map(r => (
                <button
                  key={r} type="button"
                  onClick={() => setFormData({ ...formData, role: r })}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '8px',
                    border: '2px solid',
                    borderColor: formData.role === r ? '#2D6B6B' : '#E2D9CE',
                    backgroundColor: formData.role === r ? '#E8F4F4' : 'white',
                    color: formData.role === r ? '#2D6B6B' : '#8C7E72',
                    fontWeight: '700', cursor: 'pointer', fontSize: '14px',
                    fontFamily: 'inherit'
                  }}
                >
                  {r === 'PATIENT' ? '🧑‍⚕️ Patient' : '👨‍⚕️ Doctor'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSendOtp}>
              <div className="form-group">
                <label>Full Name *</label>
                <input type="text" name="fullName"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleChange} disabled={loading} />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input type="email" name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange} disabled={loading} />
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input type="tel" name="phone"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleChange} disabled={loading} />
              </div>

              <div className="form-group">
                <label>Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="passwordHash"
                    placeholder="Min 8 characters"
                    value={formData.passwordHash}
                    onChange={handleChange}
                    disabled={loading}
                    style={{ paddingRight: '40px', width: '100%', boxSizing: 'border-box' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    style={{
                      position: 'absolute', right: '10px', top: '50%',
                      transform: 'translateY(-50%)', background: 'none',
                      border: 'none', cursor: 'pointer', padding: '0',
                      color: '#64748b', display: 'flex', alignItems: 'center',
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Confirm Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                    style={{ paddingRight: '40px', width: '100%', boxSizing: 'border-box' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    style={{
                      position: 'absolute', right: '10px', top: '50%',
                      transform: 'translateY(-50%)', background: 'none',
                      border: 'none', cursor: 'pointer', padding: '0',
                      color: '#64748b', display: 'flex', alignItems: 'center',
                    }}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {formData.role === 'PROVIDER' && (
                <div className="form-group">
                  <label>Specialization *</label>
                  <select name="specialization"
                    value={formData.specialization}
                    onChange={handleChange} disabled={loading}>
                    <option value="">-- Select Specialization --</option>
                    {specializations.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Info box */}
              <div style={{
                backgroundColor: '#E8F4F4', border: '1px solid #2D6B6B',
                borderRadius: '8px', padding: '10px 14px',
                marginBottom: '1rem', fontSize: '12px', color: '#1F4E4E'
              }}>
                📧 An OTP will be sent to your email for verification
              </div>

              <button type="submit"
                style={{
                  width: '100%', padding: '14px', fontSize: '15px',
                  fontWeight: '700', backgroundColor: '#2D6B6B', color: 'white',
                  border: 'none', borderRadius: '10px', cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
                disabled={loading}
              >
                {loading ? 'Sending OTP...' : '📧 Send Verification OTP'}
              </button>
            </form>
          </>
        )}

        {/* ── STEP 2: OTP Verification ── */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyAndRegister}>

            {/* OTP success info */}
            <div style={{
              backgroundColor: '#E8F4F4', border: '1px solid #2D6B6B',
              borderRadius: '10px', padding: '1rem',
              textAlign: 'center', marginBottom: '1.5rem'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '6px' }}>📧</div>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#1F4E4E' }}>
                OTP sent successfully!
              </p>
              <p style={{ fontSize: '12px', color: '#2D6B6B', marginTop: '4px' }}>
                Check inbox of <strong>{formData.email}</strong>
              </p>
              <p style={{ fontSize: '11px', color: '#8C7E72', marginTop: '4px' }}>
                Valid for 10 minutes
              </p>
            </div>

            {/* OTP input */}
            <div className="form-group">
              <label>Enter 6-Digit OTP *</label>
              <input
                type="text"
                placeholder="_ _ _ _ _ _"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                disabled={otpLoading}
                style={{
                  textAlign: 'center', fontSize: '28px',
                  fontWeight: '800', letterSpacing: '12px',
                  color: '#2D6B6B'
                }}
              />
            </div>

            <button type="submit"
              style={{
                width: '100%', padding: '14px', fontSize: '15px',
                fontWeight: '700', backgroundColor: '#2D6B6B', color: 'white',
                border: 'none', borderRadius: '10px', cursor: 'pointer',
                fontFamily: 'inherit', marginBottom: '1rem'
              }}
              disabled={otpLoading || otp.length !== 6}
            >
              {otpLoading ? 'Verifying...' : '✅ Verify & Create Account'}
            </button>

            {/* Resend OTP */}
            <div style={{ textAlign: 'center' }}>
              {otpTimer > 0 ? (
                <p style={{ fontSize: '13px', color: '#8C7E72' }}>
                  Resend OTP in <strong style={{ color: '#2D6B6B' }}>{otpTimer}s</strong>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  style={{
                    background: 'none', border: 'none',
                    color: '#2D6B6B', fontSize: '13px',
                    fontWeight: '700', cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  📧 Resend OTP
                </button>
              )}
            </div>

            {/* Back button */}
            <button
              type="button"
              onClick={() => { setStep('form'); setOtp(''); }}
              style={{
                width: '100%', padding: '12px', fontSize: '14px',
                fontWeight: '600', backgroundColor: '#F2EDE4', color: '#5C524A',
                border: '1px solid #E2D9CE', borderRadius: '10px',
                cursor: 'pointer', fontFamily: 'inherit', marginTop: '8px'
              }}
            >
              ← Back to Edit Details
            </button>
          </form>
        )}

        {/* Login link */}
        <p style={{
          textAlign: 'center', marginTop: '1.5rem',
          fontSize: '14px', color: '#8C7E72'
        }}>
          Already have an account?{' '}
          <Link to={ROUTES.LOGIN} style={{
            color: '#2D6B6B', fontWeight: '700', textDecoration: 'none'
          }}>
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
