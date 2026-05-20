import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { loginUser, getUserByEmail } from '../../api/authApi';
import { getProviderByUserId } from '../../api/providerApi';
import { ROLES, ROUTES } from '../../utils/constants';

/* ── Inline SVG Icons ─────────────────────────────────────── */
const MailIcon = ({ active }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke={active ? '#2D6B6B' : '#b0a098'} strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke 0.2s' }}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,12 2,6" />
  </svg>
);

const LockIcon = ({ active }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke={active ? '#2D6B6B' : '#b0a098'} strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke 0.2s' }}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeOn = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

/* ── CSS injected once ────────────────────────────────────── */
const CSS = `
  @keyframes lp-spin { to { transform: rotate(360deg); } }
  @keyframes lp-fadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes lp-blob1 {
    0%,100% { transform: translate(0,0) scale(1); }
    33%      { transform: translate(32px,-44px) scale(1.06); }
    66%      { transform: translate(-22px,22px) scale(0.94); }
  }
  @keyframes lp-blob2 {
    0%,100% { transform: translate(0,0) scale(1); }
    40%      { transform: translate(-28px,36px) scale(1.08); }
    70%      { transform: translate(18px,-20px) scale(0.93); }
  }
  @keyframes lp-blob3 {
    0%,100% { transform: translate(0,0); }
    50%      { transform: translate(14px,-32px); }
  }
  .lp-card   { animation: lp-fadeUp 0.5s ease forwards; }
  .lp-blob1  { animation: lp-blob1 14s infinite ease-in-out; }
  .lp-blob2  { animation: lp-blob2 18s infinite ease-in-out; }
  .lp-blob3  { animation: lp-blob3 11s infinite ease-in-out; }

  .lp-input {
    width: 100%; box-sizing: border-box;
    padding: 12px 14px 12px 42px;
    border: 1.5px solid #E2D9CE; border-radius: 11px;
    font-size: 14px; outline: none; font-family: inherit;
    color: #2C2825; background: #fdfcfb;
    transition: border-color .2s, box-shadow .2s, background .2s;
  }
  .lp-input:focus {
    border-color: #2D6B6B;
    box-shadow: 0 0 0 3px rgba(45,107,107,0.13);
    background: #fff;
  }
  .lp-input::placeholder { color: #c0b4aa; }

  .lp-btn {
    width: 100%; padding: 14px 24px;
    background: linear-gradient(135deg, #2D6B6B 0%, #1a5252 100%);
    color: white; border: none; border-radius: 12px;
    font-size: 15px; font-weight: 700; font-family: inherit; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 9px;
    box-shadow: 0 4px 20px rgba(45,107,107,0.38);
    transition: transform .22s ease, box-shadow .22s ease;
    letter-spacing: 0.3px;
  }
  .lp-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(45,107,107,0.48);
  }
  .lp-btn:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 3px 12px rgba(45,107,107,0.3);
  }
  .lp-btn:disabled { opacity: .68; cursor: not-allowed; }

  .lp-outline-btn {
    display: block; width: 100%; padding: 13px 24px; box-sizing: border-box;
    border: 2px solid #2D6B6B; border-radius: 12px;
    color: #2D6B6B; font-weight: 700; font-size: 14px; font-family: inherit;
    text-align: center; text-decoration: none; background: transparent;
    transition: background .2s, color .2s, transform .2s;
    cursor: pointer;
  }
  .lp-outline-btn:hover {
    background: #2D6B6B; color: white;
    transform: translateY(-1px);
  }

  .lp-stat-card {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.16);
    border-radius: 12px; padding: 12px 6px; text-align: center;
    backdrop-filter: blur(4px);
    transition: transform .2s, background .2s;
  }
  .lp-stat-card:hover { transform: translateY(-2px); background: rgba(255,255,255,0.16); }

  .lp-feature {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 12px;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    transition: background .2s;
  }
  .lp-feature:hover { background: rgba(255,255,255,0.14); }

  @media (max-width: 800px) {
    .lp-left   { display: none !important; }
    .lp-right  { padding: 2.2rem 1.5rem !important; }
    .lp-card   { max-width: 440px !important; border-radius: 20px !important; }
    .lp-outer  { padding: 2rem 1rem !important; align-items: flex-start !important; padding-top: 3rem !important; }
  }
`;

const LoginPage = () => {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [loading, setLoading]         = useState(false);
  const [showPass, setShowPass]       = useState(false);
  const [emailFocus, setEmailFocus]   = useState(false);
  const [passFocus, setPassFocus]     = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please enter email and password'); return; }
    setLoading(true);
    try {
      localStorage.clear();
      const token = await loginUser(email, password);
      login(token);
      const { parseToken } = await import('../../utils/tokenUtils');
      const payload   = parseToken(token);
      const role      = payload.role;
      const userEmail = payload.sub;
      localStorage.setItem('email', userEmail);
      localStorage.setItem('role', role);
      const userObj = await getUserByEmail(userEmail);
      localStorage.setItem('userId',   String(userObj.id));
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
      if (role === ROLES.PATIENT)  navigate(ROUTES.PATIENT_DASHBOARD);
      else if (role === ROLES.PROVIDER) navigate(ROUTES.PROVIDER_DASHBOARD);
      else if (role === ROLES.ADMIN)    navigate(ROUTES.ADMIN_DASHBOARD);
    } catch (err) {
      toast.error(err.response?.data || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>

      {/* ── Page wrapper ── */}
      <div className="lp-outer" style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #eef9f9 0%, #e8f5ef 45%, #f3eeff 100%)',
        padding: '2rem 1.5rem', position: 'relative', overflow: 'hidden',
      }}>

        {/* Animated background blobs */}
        <div className="lp-blob1" style={{
          position: 'fixed', top: '-180px', left: '-180px',
          width: '520px', height: '520px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(45,107,107,0.13) 0%, transparent 72%)',
          pointerEvents: 'none',
        }} />
        <div className="lp-blob2" style={{
          position: 'fixed', bottom: '-160px', right: '-120px',
          width: '480px', height: '480px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,150,63,0.10) 0%, transparent 72%)',
          pointerEvents: 'none',
        }} />
        <div className="lp-blob3" style={{
          position: 'fixed', top: '38%', right: '8%',
          width: '280px', height: '280px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(45,107,107,0.07) 0%, transparent 72%)',
          pointerEvents: 'none',
        }} />

        {/* ── Card ── */}
        <div className="lp-card" style={{
          display: 'flex', width: '100%', maxWidth: '900px',
          borderRadius: '24px', overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(44,40,37,0.14), 0 6px 24px rgba(44,40,37,0.07)',
          border: '1px solid rgba(226,217,206,0.5)',
          position: 'relative', zIndex: 1,
        }}>

          {/* ── LEFT PANEL ── */}
          <div className="lp-left" style={{
            flex: '0 0 340px',
            background: 'linear-gradient(160deg, #1c7a7a 0%, #104f4f 55%, #093b3b 100%)',
            padding: '3rem 2.5rem',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Decorative circles */}
            <div style={{ position:'absolute', top:'-80px', right:'-80px', width:'240px', height:'240px',
              borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }} />
            <div style={{ position:'absolute', bottom:'-60px', left:'-60px', width:'200px', height:'200px',
              borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }} />
            <div style={{ position:'absolute', top:'46%', left:'-30px', width:'110px', height:'110px',
              borderRadius:'50%', background:'rgba(201,150,63,0.1)', pointerEvents:'none' }} />

            <div style={{ position: 'relative' }}>
              {/* Brand */}
              <div style={{ marginBottom: '2.5rem' }}>
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
                  India's most trusted platform for booking verified doctors and managing your complete health journey.
                </p>
              </div>

              {/* Stats */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'2rem' }}>
                {[
                  { val:'50K+',  label:'Patients'    },
                  { val:'1.2K+', label:'Doctors'     },
                  { val:'98%',   label:'Satisfaction' },
                ].map(({ val, label }) => (
                  <div key={label} className="lp-stat-card">
                    <div style={{ fontSize:'18px', fontWeight:'800', color:'white' }}>{val}</div>
                    <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.56)', marginTop:'2px', fontWeight:'600' }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Features */}
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {[
                  { icon:'📅', title:'Easy Scheduling',  desc:'Book in under 2 minutes'    },
                  { icon:'📋', title:'Digital Records',   desc:'Access anytime, anywhere'   },
                  { icon:'💳', title:'Secure Payments',   desc:'Safe & transparent billing' },
                  { icon:'🔔', title:'Smart Reminders',   desc:'Never miss an appointment'  },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="lp-feature">
                    <span style={{ fontSize:'20px', flexShrink:0 }}>{icon}</span>
                    <div>
                      <div style={{ fontSize:'13px', fontWeight:'700', color:'white' }}>{title}</div>
                      <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.52)', marginTop:'1px' }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust chips */}
            <div style={{
              marginTop:'2rem', paddingTop:'1.5rem',
              borderTop:'1px solid rgba(255,255,255,0.12)',
              display:'flex', gap:'8px', flexWrap:'wrap',
            }}>
              {[
                { icon:'🔒', label:'Secure'   },
                { icon:'✔',  label:'Verified' },
                { icon:'⚡', label:'Fast'     },
              ].map(({ icon, label }) => (
                <div key={label} style={{
                  display:'flex', alignItems:'center', gap:'5px',
                  padding:'5px 10px',
                  background:'rgba(255,255,255,0.1)',
                  border:'1px solid rgba(255,255,255,0.15)',
                  borderRadius:'20px',
                }}>
                  <span style={{ fontSize:'13px' }}>{icon}</span>
                  <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.78)', fontWeight:'600' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="lp-right" style={{
            flex:1, backgroundColor:'white',
            padding:'3rem 2.5rem',
            display:'flex', flexDirection:'column', justifyContent:'center',
          }}>

            {/* Header */}
            <div style={{ marginBottom:'2rem' }}>
              <p style={{
                fontSize:'11px', fontWeight:'800', color:'#2D6B6B',
                letterSpacing:'2px', textTransform:'uppercase', marginBottom:'8px',
              }}>Welcome back</p>
              <h1 style={{
                fontSize:'28px', fontWeight:'800', color:'#0e2828',
                letterSpacing:'-0.7px', marginBottom:'8px', lineHeight:'1.2',
              }}>
                Sign in to your account
              </h1>
              <p style={{ color:'#8C7E72', fontSize:'14px', lineHeight:'1.65' }}>
                Manage appointments, health records & payments — all in one place.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin}>

              {/* Email */}
              <div style={{ marginBottom:'1.1rem' }}>
                <label style={{
                  display:'block', fontSize:'13px', fontWeight:'700',
                  color:'#3d3028', marginBottom:'7px', letterSpacing:'0.2px',
                }}>
                  Email Address
                </label>
                <div style={{ position:'relative' }}>
                  <span style={{
                    position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)',
                    display:'flex', alignItems:'center', pointerEvents:'none',
                  }}>
                    <MailIcon active={emailFocus} />
                  </span>
                  <input
                    className="lp-input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setEmailFocus(true)}
                    onBlur={() => setEmailFocus(false)}
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom:'0.6rem' }}>
                <label style={{
                  display:'block', fontSize:'13px', fontWeight:'700',
                  color:'#3d3028', marginBottom:'7px', letterSpacing:'0.2px',
                }}>
                  Password
                </label>
                <div style={{ position:'relative' }}>
                  <span style={{
                    position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)',
                    display:'flex', alignItems:'center', pointerEvents:'none',
                  }}>
                    <LockIcon active={passFocus} />
                  </span>
                  <input
                    className="lp-input"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setPassFocus(true)}
                    onBlur={() => setPassFocus(false)}
                    disabled={loading}
                    style={{ paddingRight:'44px' }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                    style={{
                      position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)',
                      background:'none', border:'none', cursor:'pointer', padding:0,
                      color:'#8C7E72', display:'flex', alignItems:'center',
                      transition:'color 0.2s',
                    }}
                  >
                    {showPass ? <EyeOff /> : <EyeOn />}
                  </button>
                </div>
              </div>

              {/* Forgot */}
              <div style={{ textAlign:'right', marginBottom:'1.5rem' }}>
                <Link to="/forgot-password" style={{
                  fontSize:'13px', color:'#2D6B6B', fontWeight:'700',
                  textDecoration:'none', transition:'opacity 0.2s',
                }}>
                  Forgot Password?
                </Link>
              </div>

              {/* Submit */}
              <button type="submit" className="lp-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span style={{
                      display:'inline-block', width:'18px', height:'18px', flexShrink:0,
                      border:'2.5px solid rgba(255,255,255,0.35)', borderTopColor:'white',
                      borderRadius:'50%', animation:'lp-spin 0.7s linear infinite',
                    }} />
                    Signing in...
                  </>
                ) : 'Sign In →'}
              </button>
            </form>

            {/* Divider */}
            <div style={{ display:'flex', alignItems:'center', gap:'12px', margin:'1.5rem 0' }}>
              <div style={{ flex:1, height:'1px', background:'#EDE5D8' }} />
              <span style={{ fontSize:'12px', color:'#a0928a', fontWeight:'600' }}>New to MediBook?</span>
              <div style={{ flex:1, height:'1px', background:'#EDE5D8' }} />
            </div>

            {/* Register CTA */}
            <Link to={ROUTES.REGISTER} className="lp-outline-btn">
              Create an Account
            </Link>

            {/* Security note */}
            <p style={{
              textAlign:'center', marginTop:'1.5rem',
              fontSize:'11.5px', color:'#b0a098', lineHeight:'1.6',
            }}>
              🔒 256-bit SSL · HIPAA Compliant · Trusted by 50,000+ users
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
