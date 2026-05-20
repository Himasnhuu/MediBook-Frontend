import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { registerUser, sendOtp, verifyOtp } from '../../api/authApi';
import { validatePassword } from '../../utils/passwordUtils';
import { getSpecializations } from '../../api/providerApi';
import { ROUTES } from '../../utils/constants';

/* ── SVG Icons ───────────────────────────────────────────── */
const Icon = ({ d, cx, cy, r, x1, y1, x2, y2, rx, ry, points, active, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={active ? '#2D6B6B' : '#b0a098'} strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke 0.2s' }}>
    {d && <path d={d} />}
    {cx !== undefined && <circle cx={cx} cy={cy} r={r} />}
    {x1 !== undefined && <line x1={x1} y1={y1} x2={x2} y2={y2} />}
    {rx !== undefined && <rect x={rx} y={ry} width="18" height="11" rx="2" ry="2" />}
    {points && <polyline points={points} />}
  </svg>
);

const UserIcon    = ({ active }) => <Icon active={active} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" cx="12" cy="7" r="4" />;
const MailIcon    = ({ active }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke={active ? '#2D6B6B' : '#b0a098'} strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" style={{ transition:'stroke 0.2s' }}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,12 2,6" />
  </svg>
);
const PhoneIcon   = ({ active }) => <Icon active={active} d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.19 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />;
const LockIcon    = ({ active }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke={active ? '#2D6B6B' : '#b0a098'} strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" style={{ transition:'stroke 0.2s' }}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const EyeOn  = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

/* ── Password strength ───────────────────────────────────── */
const getStrength = (pwd) => {
  if (!pwd) return 0;
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd))        s++;
  if (/[0-9]/.test(pwd))        s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s;
};
const STRENGTH = [
  { label: '',       color: '#E2D9CE' },
  { label: 'Weak',   color: '#ef4444' },
  { label: 'Fair',   color: '#f97316' },
  { label: 'Good',   color: '#eab308' },
  { label: 'Strong', color: '#22c55e' },
];

/* ── Reusable input with left icon ───────────────────────── */
const Field = ({ label, children }) => (
  <div style={{ marginBottom: '1.1rem' }}>
    <label style={{
      display:'block', fontSize:'13px', fontWeight:'700',
      color:'#3d3028', marginBottom:'7px', letterSpacing:'0.2px',
    }}>{label}</label>
    {children}
  </div>
);

const IconInput = ({ icon, children }) => (
  <div style={{ position:'relative' }}>
    <span style={{
      position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)',
      display:'flex', alignItems:'center', pointerEvents:'none',
    }}>{icon}</span>
    {children}
  </div>
);

/* ── Global CSS ──────────────────────────────────────────── */
const CSS = `
  @keyframes rp-spin { to { transform: rotate(360deg); } }
  @keyframes rp-fadeUp {
    from { opacity:0; transform:translateY(22px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes rp-stepIn {
    from { opacity:0; transform:translateX(16px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes rp-blob1 {
    0%,100% { transform:translate(0,0) scale(1); }
    33%      { transform:translate(30px,-42px) scale(1.05); }
    66%      { transform:translate(-20px,20px) scale(0.95); }
  }
  @keyframes rp-blob2 {
    0%,100% { transform:translate(0,0) scale(1); }
    40%      { transform:translate(-26px,34px) scale(1.07); }
    70%      { transform:translate(16px,-18px) scale(0.94); }
  }
  .rp-card  { animation: rp-fadeUp 0.5s ease forwards; }
  .rp-blob1 { animation: rp-blob1 14s infinite ease-in-out; }
  .rp-blob2 { animation: rp-blob2 18s infinite ease-in-out; }
  .rp-step  { animation: rp-stepIn 0.35s ease forwards; }

  .rp-input {
    width:100%; box-sizing:border-box;
    padding:12px 14px 12px 42px;
    border:1.5px solid #E2D9CE; border-radius:11px;
    font-size:14px; outline:none; font-family:inherit;
    color:#2C2825; background:#fdfcfb;
    transition:border-color .2s, box-shadow .2s, background .2s;
  }
  .rp-input:focus {
    border-color:#2D6B6B;
    box-shadow:0 0 0 3px rgba(45,107,107,0.13);
    background:#fff;
  }
  .rp-input::placeholder { color:#c0b4aa; }
  .rp-select {
    width:100%; box-sizing:border-box;
    padding:12px 14px; border:1.5px solid #E2D9CE; border-radius:11px;
    font-size:14px; outline:none; font-family:inherit;
    color:#2C2825; background:#fdfcfb;
    transition:border-color .2s, box-shadow .2s;
    cursor:pointer;
  }
  .rp-select:focus { border-color:#2D6B6B; box-shadow:0 0 0 3px rgba(45,107,107,0.13); }

  .rp-btn {
    width:100%; padding:14px 24px;
    background:linear-gradient(135deg, #2D6B6B 0%, #1a5252 100%);
    color:white; border:none; border-radius:12px;
    font-size:15px; font-weight:700; font-family:inherit; cursor:pointer;
    display:flex; align-items:center; justify-content:center; gap:9px;
    box-shadow:0 4px 20px rgba(45,107,107,0.38);
    transition:transform .22s ease, box-shadow .22s ease;
    letter-spacing:0.3px;
  }
  .rp-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 10px 30px rgba(45,107,107,0.48); }
  .rp-btn:active:not(:disabled) { transform:translateY(0); box-shadow:0 3px 12px rgba(45,107,107,0.3); }
  .rp-btn:disabled { opacity:.68; cursor:not-allowed; }

  .rp-role-card {
    flex:1; padding:18px 10px; border-radius:14px;
    border:2px solid #E2D9CE; background:white; cursor:pointer;
    display:flex; flex-direction:column; align-items:center; gap:7px;
    font-family:inherit; transition:all 0.25s ease;
  }
  .rp-role-card:hover { border-color:#2D6B6B; background:#f5fbfb; transform:translateY(-2px); }
  .rp-role-card.active {
    border-color:#2D6B6B;
    background:linear-gradient(135deg,#e6f5f5,#cce9e9);
    box-shadow:0 6px 18px rgba(45,107,107,0.2);
    transform:translateY(-2px);
  }

  .rp-trust {
    display:flex; align-items:center; gap:10px;
    padding:10px 14px; border-radius:10px;
    background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.15);
    transition:background 0.2s;
  }
  .rp-trust:hover { background:rgba(255,255,255,0.16); }

  @media (max-width: 840px) {
    .rp-left  { display:none !important; }
    .rp-right { padding:2.2rem 1.5rem !important; max-height:none !important; }
    .rp-card  { max-width:460px !important; border-radius:20px !important; }
    .rp-outer { padding:2rem 1rem !important; align-items:flex-start !important; padding-top:2.5rem !important; }
  }
`;

const RegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('form');
  const [formData, setFormData] = useState({
    fullName:'', email:'', passwordHash:'', confirmPassword:'',
    phone:'', role:'PATIENT', specialization:'',
  });
  const [otp, setOtp]                           = useState('');
  const [otpTimer, setOtpTimer]                 = useState(0);
  const [specializations, setSpecializations]   = useState([]);
  const [loading, setLoading]                   = useState(false);
  const [otpLoading, setOtpLoading]             = useState(false);
  const [showPass, setShowPass]                 = useState(false);
  const [showConfirm, setShowConfirm]           = useState(false);
  const [focus, setFocus]                       = useState({});

  useEffect(() => {
    getSpecializations().then(setSpecializations).catch(console.error);
  }, []);

  useEffect(() => {
    if (otpTimer > 0) {
      const t = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [otpTimer]);

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
  const setF = (name, val) => setFocus(f => ({ ...f, [name]: val }));

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.passwordHash || !formData.phone) {
      toast.error('Please fill in all required fields'); return;
    }
    if (formData.passwordHash !== formData.confirmPassword) {
      toast.error('Passwords do not match'); return;
    }
    const check = validatePassword(formData.passwordHash);
    if (!check.isValid) {
      toast.error('Password requirements not met: ' + check.errors[0]); return;
    }
    if (formData.role === 'PROVIDER' && !formData.specialization) {
      toast.error('Please select your specialization'); return;
    }
    setLoading(true);
    try {
      await sendOtp(formData.email);
      toast.success(`OTP sent to ${formData.email}!`);
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
    if (!otp || otp.length !== 6) { toast.error('Please enter the 6-digit OTP'); return; }
    setOtpLoading(true);
    try {
      await verifyOtp(formData.email, otp);
      await registerUser({
        fullName: formData.fullName, email: formData.email,
        passwordHash: formData.passwordHash, phone: formData.phone, role: formData.role,
      });
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
    } catch {
      toast.error('Failed to resend OTP');
    }
  };

  const strength = getStrength(formData.passwordHash);
  const strengthInfo = STRENGTH[strength];

  return (
    <>
      <style>{CSS}</style>

      <div className="rp-outer" style={{
        minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
        background:'linear-gradient(135deg, #eef9f9 0%, #e8f5ef 45%, #f3eeff 100%)',
        padding:'2rem 1.5rem', position:'relative', overflow:'hidden',
      }}>

        {/* Background blobs */}
        <div className="rp-blob1" style={{
          position:'fixed', top:'-180px', left:'-180px', width:'520px', height:'520px',
          borderRadius:'50%', background:'radial-gradient(circle, rgba(45,107,107,0.12) 0%, transparent 72%)',
          pointerEvents:'none',
        }} />
        <div className="rp-blob2" style={{
          position:'fixed', bottom:'-150px', right:'-110px', width:'480px', height:'480px',
          borderRadius:'50%', background:'radial-gradient(circle, rgba(201,150,63,0.09) 0%, transparent 72%)',
          pointerEvents:'none',
        }} />

        {/* Card */}
        <div className="rp-card" style={{
          display:'flex', width:'100%', maxWidth:'960px',
          borderRadius:'24px', overflow:'hidden',
          boxShadow:'0 24px 80px rgba(44,40,37,0.14), 0 6px 24px rgba(44,40,37,0.07)',
          border:'1px solid rgba(226,217,206,0.5)',
          position:'relative', zIndex:1,
        }}>

          {/* ── LEFT PANEL ── */}
          <div className="rp-left" style={{
            flex:'0 0 330px',
            background:'linear-gradient(160deg, #1c7a7a 0%, #104f4f 55%, #093b3b 100%)',
            padding:'3rem 2.5rem',
            display:'flex', flexDirection:'column', justifyContent:'space-between',
            position:'relative', overflow:'hidden',
          }}>
            <div style={{ position:'absolute', top:'-80px', right:'-80px', width:'240px', height:'240px',
              borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }} />
            <div style={{ position:'absolute', bottom:'-60px', left:'-60px', width:'200px', height:'200px',
              borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }} />

            <div style={{ position:'relative' }}>
              {/* Brand */}
              <div style={{ marginBottom:'2rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
                  <div style={{
                    width:'42px', height:'42px', borderRadius:'12px',
                    background:'rgba(255,255,255,0.18)', border:'1px solid rgba(255,255,255,0.22)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px',
                  }}>🏥</div>
                  <span style={{ fontSize:'26px', fontWeight:'900', color:'white', letterSpacing:'-0.5px' }}>
                    MediBook
                  </span>
                </div>
                <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.62)', lineHeight:'1.65' }}>
                  Join thousands of patients and verified healthcare professionals on India's most trusted platform.
                </p>
              </div>

              {/* Step progress on left */}
              <div style={{
                background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.14)',
                borderRadius:'14px', padding:'16px', marginBottom:'1.75rem',
              }}>
                <p style={{ fontSize:'11px', fontWeight:'700', color:'rgba(255,255,255,0.5)', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:'12px' }}>
                  Registration Steps
                </p>
                {[
                  { n:1, label:'Fill account details' },
                  { n:2, label:'Verify your email' },
                  { n:3, label:'Start using MediBook' },
                ].map(({ n, label }) => {
                  const done = (step === 'otp' && n === 1) || (step === 'done' && n <= 2);
                  const active = (step === 'form' && n === 1) || (step === 'otp' && n === 2);
                  return (
                    <div key={n} style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
                      <div style={{
                        width:'26px', height:'26px', borderRadius:'50%', flexShrink:0,
                        background: done ? '#22c55e' : active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.15)',
                        color: done ? 'white' : active ? '#2D6B6B' : 'rgba(255,255,255,0.4)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:'12px', fontWeight:'800', transition:'all 0.3s',
                      }}>
                        {done ? '✓' : n}
                      </div>
                      <span style={{
                        fontSize:'13px', fontWeight: active ? '700' : '500',
                        color: done ? '#86efac' : active ? 'white' : 'rgba(255,255,255,0.45)',
                        transition:'color 0.3s',
                      }}>{label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Trust */}
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {[
                  { icon:'🔒', label:'Secure OTP Authentication', desc:'Email-verified sign up' },
                  { icon:'✔',  label:'100% Verified Doctors',     desc:'Licensed & credentialed' },
                  { icon:'⚡', label:'Instant Account Access',    desc:'Ready in 2 minutes' },
                ].map(({ icon, label, desc }) => (
                  <div key={label} className="rp-trust">
                    <span style={{ fontSize:'20px', flexShrink:0 }}>{icon}</span>
                    <div>
                      <div style={{ fontSize:'12px', fontWeight:'700', color:'white' }}>{label}</div>
                      <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.5)', marginTop:'1px' }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom quote */}
            <div style={{
              marginTop:'2rem', paddingTop:'1.5rem',
              borderTop:'1px solid rgba(255,255,255,0.12)',
            }}>
              <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.5)', lineHeight:'1.7', fontStyle:'italic' }}>
                "MediBook made it incredibly easy to find the right specialist and book an appointment the same day."
              </p>
              <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', marginTop:'6px', fontWeight:'600' }}>
                — Priya S., Mumbai
              </p>
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="rp-right" style={{
            flex:1, backgroundColor:'white',
            padding:'2.5rem', overflowY:'auto', maxHeight:'92vh',
          }}>

            {/* Step indicator (top of form) */}
            <div style={{
              display:'flex', alignItems:'center', gap:'6px', marginBottom:'1.75rem',
            }}>
              {['Account Details', 'Verify Email'].map((label, i) => {
                const isActive  = (step === 'form' && i === 0) || (step === 'otp' && i === 1);
                const isDone    = step === 'otp' && i === 0;
                return (
                  <div key={label} style={{ display:'flex', alignItems:'center', gap:'6px', ...(i > 0 ? { flex:1 } : {}) }}>
                    {i > 0 && (
                      <div style={{
                        flex:1, height:'2px', borderRadius:'2px',
                        background: isDone || isActive ? '#2D6B6B' : '#E2D9CE',
                        transition:'background 0.4s',
                        margin:'0 2px',
                      }} />
                    )}
                    <div style={{
                      width:'28px', height:'28px', borderRadius:'50%', flexShrink:0,
                      background: isDone ? '#22c55e' : isActive ? '#2D6B6B' : '#F2EDE4',
                      color: isDone || isActive ? 'white' : '#8C7E72',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'13px', fontWeight:'800', transition:'all 0.3s',
                    }}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    <span style={{
                      fontSize:'12px', fontWeight:'700', whiteSpace:'nowrap',
                      color: isDone ? '#22c55e' : isActive ? '#2D6B6B' : '#a0928a',
                      transition:'color 0.3s',
                    }}>{label}</span>
                  </div>
                );
              })}
            </div>

            {/* Header */}
            <div style={{ marginBottom:'1.5rem' }}>
              <p style={{
                fontSize:'11px', fontWeight:'800', color:'#2D6B6B',
                letterSpacing:'2px', textTransform:'uppercase', marginBottom:'6px',
              }}>
                {step === 'form' ? 'Step 1 of 2' : 'Step 2 of 2'}
              </p>
              <h1 style={{
                fontSize:'26px', fontWeight:'800', color:'#0e2828',
                letterSpacing:'-0.6px', marginBottom:'6px', lineHeight:'1.2',
              }}>
                {step === 'form' ? 'Create Your Account' : 'Verify Your Email'}
              </h1>
              <p style={{ color:'#8C7E72', fontSize:'13px', lineHeight:'1.6' }}>
                {step === 'form'
                  ? 'Book doctors, manage records & payments — all in one place.'
                  : `We sent a 6-digit OTP to ${formData.email}`}
              </p>
            </div>

            {/* ── STEP 1: Registration Form ── */}
            {step === 'form' && (
              <div className="rp-step">
                {/* Role cards */}
                <div style={{ display:'flex', gap:'12px', marginBottom:'1.5rem' }}>
                  {[
                    { value:'PATIENT',  icon:'👤', label:"I'm a Patient",  sub:'Book doctors & manage health' },
                    { value:'PROVIDER', icon:'🩺', label:"I'm a Doctor",   sub:'Manage your practice online'  },
                  ].map(({ value, icon, label, sub }) => (
                    <button
                      key={value}
                      type="button"
                      className={`rp-role-card${formData.role === value ? ' active' : ''}`}
                      onClick={() => setFormData({ ...formData, role: value })}
                    >
                      <span style={{
                        fontSize:'26px', width:'50px', height:'50px', borderRadius:'50%',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        background: formData.role === value ? 'rgba(45,107,107,0.14)' : '#F2EDE4',
                        transition:'background 0.25s',
                      }}>{icon}</span>
                      <span style={{
                        fontSize:'13px', fontWeight:'700',
                        color: formData.role === value ? '#1a5252' : '#5C524A',
                        transition:'color 0.25s',
                      }}>{label}</span>
                      <span style={{ fontSize:'11px', color:'#8C7E72', lineHeight:'1.4', textAlign:'center' }}>{sub}</span>
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSendOtp}>
                  <Field label="Full Name">
                    <IconInput icon={<UserIcon active={focus.fullName} />}>
                      <input
                        className="rp-input" type="text" name="fullName"
                        placeholder="Enter your full name"
                        value={formData.fullName} onChange={handleChange} disabled={loading}
                        onFocus={() => setF('fullName', true)} onBlur={() => setF('fullName', false)}
                        autoComplete="name"
                      />
                    </IconInput>
                  </Field>

                  <Field label="Email Address">
                    <IconInput icon={<MailIcon active={focus.email} />}>
                      <input
                        className="rp-input" type="email" name="email"
                        placeholder="you@example.com"
                        value={formData.email} onChange={handleChange} disabled={loading}
                        onFocus={() => setF('email', true)} onBlur={() => setF('email', false)}
                        autoComplete="email"
                      />
                    </IconInput>
                  </Field>

                  <Field label="Phone Number">
                    <IconInput icon={<PhoneIcon active={focus.phone} />}>
                      <input
                        className="rp-input" type="tel" name="phone"
                        placeholder="+91 98765 43210"
                        value={formData.phone} onChange={handleChange} disabled={loading}
                        onFocus={() => setF('phone', true)} onBlur={() => setF('phone', false)}
                        autoComplete="tel"
                      />
                    </IconInput>
                  </Field>

                  {/* Password side-by-side */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                    <div>
                      <Field label="Password">
                        <div style={{ position:'relative' }}>
                          <span style={{
                            position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)',
                            display:'flex', alignItems:'center', pointerEvents:'none',
                          }}>
                            <LockIcon active={focus.passwordHash} />
                          </span>
                          <input
                            className="rp-input" type={showPass ? 'text' : 'password'}
                            name="passwordHash" placeholder="Min 8 chars"
                            value={formData.passwordHash} onChange={handleChange} disabled={loading}
                            onFocus={() => setF('passwordHash', true)} onBlur={() => setF('passwordHash', false)}
                            style={{ paddingRight:'40px' }}
                            autoComplete="new-password"
                          />
                          <button type="button" onClick={() => setShowPass(p => !p)}
                            style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)',
                              background:'none', border:'none', cursor:'pointer', padding:0,
                              color:'#8C7E72', display:'flex', alignItems:'center' }}>
                            {showPass ? <EyeOff /> : <EyeOn />}
                          </button>
                        </div>
                      </Field>
                      {/* Strength indicator */}
                      {formData.passwordHash && (
                        <div style={{ marginTop:'-8px', marginBottom:'8px' }}>
                          <div style={{ display:'flex', gap:'4px', marginBottom:'4px' }}>
                            {[1,2,3,4].map(i => (
                              <div key={i} style={{
                                flex:1, height:'3px', borderRadius:'2px',
                                background: i <= strength ? strengthInfo.color : '#E2D9CE',
                                transition:'background 0.3s',
                              }} />
                            ))}
                          </div>
                          <span style={{ fontSize:'11px', fontWeight:'700', color: strengthInfo.color }}>
                            {strengthInfo.label}
                          </span>
                        </div>
                      )}
                    </div>

                    <Field label="Confirm Password">
                      <div style={{ position:'relative' }}>
                        <span style={{
                          position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)',
                          display:'flex', alignItems:'center', pointerEvents:'none',
                        }}>
                          <LockIcon active={focus.confirmPassword} />
                        </span>
                        <input
                          className="rp-input" type={showConfirm ? 'text' : 'password'}
                          name="confirmPassword" placeholder="Re-enter"
                          value={formData.confirmPassword} onChange={handleChange} disabled={loading}
                          onFocus={() => setF('confirmPassword', true)} onBlur={() => setF('confirmPassword', false)}
                          style={{
                            paddingRight:'40px',
                            borderColor: formData.confirmPassword
                              ? (formData.confirmPassword === formData.passwordHash ? '#22c55e' : '#ef4444')
                              : '#E2D9CE',
                          }}
                          autoComplete="new-password"
                        />
                        <button type="button" onClick={() => setShowConfirm(p => !p)}
                          style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)',
                            background:'none', border:'none', cursor:'pointer', padding:0,
                            color:'#8C7E72', display:'flex', alignItems:'center' }}>
                          {showConfirm ? <EyeOff /> : <EyeOn />}
                        </button>
                      </div>
                    </Field>
                  </div>

                  {formData.role === 'PROVIDER' && (
                    <Field label="Specialization">
                      <select
                        className="rp-select"
                        name="specialization" value={formData.specialization}
                        onChange={handleChange} disabled={loading}
                      >
                        <option value="">-- Select Specialization --</option>
                        {specializations.map(s => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </Field>
                  )}

                  {/* OTP info */}
                  <div style={{
                    display:'flex', alignItems:'center', gap:'8px',
                    background:'#E8F4F4', border:'1px solid #b2d8d8',
                    borderRadius:'10px', padding:'10px 14px',
                    marginBottom:'1.25rem', fontSize:'12px', color:'#1F4E4E',
                  }}>
                    <span>📧</span>
                    <span>A 6-digit OTP will be sent to your email for verification</span>
                  </div>

                  <button type="submit" className="rp-btn" disabled={loading}>
                    {loading ? (
                      <>
                        <span style={{
                          display:'inline-block', width:'18px', height:'18px', flexShrink:0,
                          border:'2.5px solid rgba(255,255,255,0.35)', borderTopColor:'white',
                          borderRadius:'50%', animation:'rp-spin 0.7s linear infinite',
                        }} />
                        Sending OTP...
                      </>
                    ) : 'Send Verification OTP →'}
                  </button>
                </form>
              </div>
            )}

            {/* ── STEP 2: OTP ── */}
            {step === 'otp' && (
              <div className="rp-step">
                <form onSubmit={handleVerifyAndRegister}>
                  {/* OTP info card */}
                  <div style={{
                    background:'linear-gradient(135deg, #E8F4F4, #d4ecec)',
                    border:'1px solid #b2d8d8', borderRadius:'16px',
                    padding:'1.5rem', textAlign:'center', marginBottom:'1.5rem',
                  }}>
                    <div style={{ fontSize:'40px', marginBottom:'10px' }}>📧</div>
                    <p style={{ fontSize:'15px', fontWeight:'800', color:'#1F4E4E', marginBottom:'4px' }}>
                      Check your inbox!
                    </p>
                    <p style={{ fontSize:'13px', color:'#2D6B6B' }}>
                      OTP sent to <strong>{formData.email}</strong>
                    </p>
                    <p style={{ fontSize:'11px', color:'#8C7E72', marginTop:'6px' }}>
                      Valid for 10 minutes · Check spam if not received
                    </p>
                  </div>

                  <Field label="Enter 6-Digit OTP">
                    <input
                      type="text" placeholder="_ _ _ _ _ _"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6} disabled={otpLoading}
                      style={{
                        width:'100%', boxSizing:'border-box',
                        textAlign:'center', fontSize:'32px', fontWeight:'900',
                        letterSpacing:'16px', color:'#2D6B6B',
                        padding:'14px 14px', border:'1.5px solid #E2D9CE',
                        borderRadius:'12px', outline:'none', fontFamily:'inherit',
                        background:'#fdfcfb', transition:'border-color 0.2s, box-shadow 0.2s',
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = '#2D6B6B';
                        e.target.style.boxShadow = '0 0 0 3px rgba(45,107,107,0.13)';
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = '#E2D9CE';
                        e.target.style.boxShadow = 'none';
                      }}
                      autoComplete="one-time-code"
                    />
                  </Field>

                  <button
                    type="submit" className="rp-btn"
                    disabled={otpLoading || otp.length !== 6}
                    style={{ marginBottom:'12px' }}
                  >
                    {otpLoading ? (
                      <>
                        <span style={{
                          display:'inline-block', width:'18px', height:'18px', flexShrink:0,
                          border:'2.5px solid rgba(255,255,255,0.35)', borderTopColor:'white',
                          borderRadius:'50%', animation:'rp-spin 0.7s linear infinite',
                        }} />
                        Verifying...
                      </>
                    ) : '✅ Verify & Create Account'}
                  </button>

                  {/* Resend */}
                  <div style={{ textAlign:'center', marginBottom:'12px' }}>
                    {otpTimer > 0 ? (
                      <p style={{ fontSize:'13px', color:'#8C7E72' }}>
                        Resend OTP in <strong style={{ color:'#2D6B6B' }}>{otpTimer}s</strong>
                      </p>
                    ) : (
                      <button type="button" onClick={handleResendOtp} style={{
                        background:'none', border:'none', color:'#2D6B6B',
                        fontSize:'13px', fontWeight:'700', cursor:'pointer', textDecoration:'underline',
                      }}>
                        📧 Resend OTP
                      </button>
                    )}
                  </div>

                  {/* Back */}
                  <button type="button" onClick={() => { setStep('form'); setOtp(''); }} style={{
                    width:'100%', padding:'12px', fontSize:'13px', fontWeight:'700',
                    background:'#F2EDE4', color:'#5C524A',
                    border:'1px solid #E2D9CE', borderRadius:'12px',
                    cursor:'pointer', fontFamily:'inherit', transition:'background 0.2s',
                  }}
                    onMouseEnter={e => e.target.style.background = '#EDE5D8'}
                    onMouseLeave={e => e.target.style.background = '#F2EDE4'}
                  >
                    ← Back to Edit Details
                  </button>
                </form>
              </div>
            )}

            {/* Login link */}
            <p style={{ textAlign:'center', marginTop:'1.5rem', fontSize:'13.5px', color:'#8C7E72' }}>
              Already have an account?{' '}
              <Link to={ROUTES.LOGIN} style={{ color:'#2D6B6B', fontWeight:'800', textDecoration:'none' }}>
                Sign in here
              </Link>
            </p>

            <p style={{
              textAlign:'center', marginTop:'1rem',
              fontSize:'11.5px', color:'#b0a098', lineHeight:'1.6',
            }}>
              🔒 256-bit SSL · HIPAA Compliant · Your data is safe with us
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;
