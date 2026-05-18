import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProviders, getSpecializations } from '../api/providerApi';
import { getSlotsByProvider } from '../api/scheduleApi';

const Home = () => {
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDoctorDetail, setShowDoctorDetail] = useState(false);
  const [detailDoctor, setDetailDoctor] = useState(null);
  const [showSlots, setShowSlots] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [providerData, specData] = await Promise.all([
        getAllProviders(),
        getSpecializations()
      ]);
      const verified = providerData
        .filter(p => p.isVerified && p.isAvailable)
        .sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
      setProviders(verified);
      setSpecializations(specData);
    } catch (err) {
      console.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewSlots = async (provider) => {
    setSelectedProvider(provider);
    setShowSlots(true);
    setLoadingSlots(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await getSlotsByProvider(provider.providerId);
      const available = data
        .filter(s => s.status === 'AVAILABLE' && s.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
        .slice(0, 12);
      setSlots(available);
    } catch (err) {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const slotsByDate = slots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {});

  return (
    <div style={{ backgroundColor: '#FAF7F2', minHeight: '100vh' }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        backgroundColor: '#FFFFFF',
        padding: '0 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '70px',
        boxShadow: '0 2px 12px rgba(44,40,37,0.08)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '26px' }}>🏥</span>
          <div>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#2D6B6B', letterSpacing: '-0.5px' }}>
              MediBook
            </span>
            <div style={{ fontSize: '10px', color: '#8C7E72', letterSpacing: '1.5px', marginTop: '-2px', display: 'none' }}
              className="home-tagline">
              HEALTHCARE PLATFORM
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '8px 18px', fontSize: '14px', fontWeight: '600',
              backgroundColor: 'transparent', color: '#2D6B6B',
              border: '2px solid #2D6B6B', borderRadius: '8px',
              cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit'
            }}
            onMouseEnter={e => { e.target.style.backgroundColor = '#2D6B6B'; e.target.style.color = 'white'; }}
            onMouseLeave={e => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#2D6B6B'; }}
          >
            Login
          </button>
          <button
            onClick={() => navigate('/register')}
            style={{
              padding: '8px 18px', fontSize: '14px', fontWeight: '700',
              backgroundColor: '#C9963F', color: 'white',
              border: 'none', borderRadius: '8px',
              cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit'
            }}
            onMouseEnter={e => { e.target.style.backgroundColor = '#A67830'; }}
            onMouseLeave={e => { e.target.style.backgroundColor = '#C9963F'; }}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div className="home-hero" style={{
        background: 'linear-gradient(135deg, #1F4E4E 0%, #2D6B6B 60%, #3D8C8C 100%)',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: '400px', height: '400px', borderRadius: '50%',
          backgroundColor: 'rgba(201,150,63,0.1)'
        }} />
        <div style={{
          position: 'absolute', bottom: '-60px', left: '-60px',
          width: '300px', height: '300px', borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.05)'
        }} />
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{
            display: 'inline-block',
            backgroundColor: 'rgba(201,150,63,0.2)', color: '#F0C878',
            padding: '6px 20px', borderRadius: '20px', fontSize: '13px',
            fontWeight: '600', marginBottom: '1.5rem',
            border: '1px solid rgba(201,150,63,0.3)', letterSpacing: '0.5px'
          }}>
            🏥 India's Trusted Healthcare Platform
          </div>
          <h1 className="home-hero-title" style={{
            fontWeight: '800', color: 'white',
            lineHeight: '1.15', marginBottom: '1.2rem', letterSpacing: '-1px'
          }}>
            Book Smarter.<br />
            Heal Faster.<br />
            <span style={{ color: '#F0C878' }}>Care Better.</span>
          </h1>
          <p className="home-hero-subtitle" style={{
            color: 'rgba(255,255,255,0.9)',
            lineHeight: '1.8', maxWidth: '520px', margin: '0 auto 2.5rem',
            fontWeight: '400', letterSpacing: '0.2px'
          }}>
            Find the right doctor, book an appointment instantly,
            and manage your health — all in one place.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/register')}
              style={{
                padding: '15px 36px', fontSize: '16px', fontWeight: '700',
                backgroundColor: '#C9963F', color: 'white',
                border: 'none', borderRadius: '10px', cursor: 'pointer',
                transition: 'all 0.2s', fontFamily: 'inherit',
                boxShadow: '0 4px 16px rgba(201,150,63,0.4)'
              }}
              onMouseEnter={e => { e.target.style.backgroundColor = '#A67830'; e.target.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.target.style.backgroundColor = '#C9963F'; e.target.style.transform = 'translateY(0)'; }}
            >
              Book an Appointment →
            </button>
            <button
              onClick={() => document.getElementById('doctors').scrollIntoView({ behavior: 'smooth' })}
              style={{
                padding: '15px 36px', fontSize: '16px', fontWeight: '600',
                backgroundColor: 'transparent', color: 'white',
                border: '2px solid rgba(255,255,255,0.4)', borderRadius: '10px',
                cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit'
              }}
              onMouseEnter={e => { e.target.style.borderColor = 'white'; e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,255,255,0.4)'; e.target.style.backgroundColor = 'transparent'; }}
            >
              Explore Doctors ↓
            </button>
          </div>
        </div>
      </div>

      {/* ── STATS BAR ── */}
      <div className="home-stats" style={{
        backgroundColor: '#FFFFFF',
        display: 'flex', justifyContent: 'center',
        flexWrap: 'wrap',
        borderBottom: '1px solid #E2D9CE'
      }}>
        {[
          { value: `${providers.length}+`, label: 'Verified Doctors' },
          { value: `${specializations.length}+`, label: 'Specializations' },
          { value: '100%', label: 'Secure Payments' },
          { value: '24/7', label: 'Platform Access' }
        ].map((stat, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '34px', fontWeight: '900', color: '#2D6B6B', letterSpacing: '-1px' }}>{stat.value}</p>
            <p style={{ fontSize: '13px', color: '#8C7E72', marginTop: '4px', fontWeight: '500', letterSpacing: '0.3px' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── WHY CHOOSE US ── */}
      <div className="home-section" style={{ backgroundColor: '#FAF7F2' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p style={{ color: '#C9963F', fontWeight: '700', fontSize: '13px', letterSpacing: '2px', marginBottom: '8px' }}>OUR PROMISE</p>
            <h2 className="home-section-title" style={{ fontWeight: '800', color: '#2C2825', marginBottom: '12px' }}>Why Choose MediBook?</h2>
            <p style={{ color: '#8C7E72', fontSize: '16px', maxWidth: '500px', margin: '0 auto' }}>
              Everything you need for seamless, stress-free healthcare
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {[
              { icon: '🔍', title: 'Find Specialists', desc: 'Search verified doctors by specialization, location, or name. View full profiles and patient ratings.' },
              { icon: '📅', title: 'Book Instantly', desc: 'See real-time slot availability and confirm your appointment in just a few clicks.' },
              { icon: '💳', title: 'Secure Payments', desc: 'Pay with UPI, Card, Wallet or Cash. Full payment history and easy refunds.' },
              { icon: '🗂️', title: 'Health Records', desc: 'Access your complete medical history, prescriptions and upcoming follow-ups anytime.' },
              { icon: '✅', title: 'Verified Doctors', desc: 'Every provider is carefully reviewed and verified by our admin team before going live.' },
              { icon: '⭐', title: 'Trusted Reviews', desc: 'Read genuine patient reviews and make informed decisions about your healthcare.' }
            ].map((f, i) => (
              <div key={i} style={{
                backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '2rem',
                border: '1px solid #E2D9CE', transition: 'all 0.2s', cursor: 'default'
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(45,107,107,0.12)';
                  e.currentTarget.style.borderColor = '#2D6B6B';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#E2D9CE';
                }}
              >
                <div style={{
                  width: '56px', height: '56px', borderRadius: '14px',
                  backgroundColor: '#E8F4F4', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '26px', marginBottom: '1.2rem',
                  border: '1px solid rgba(45,107,107,0.15)'
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontWeight: '700', color: '#2C2825', marginBottom: '8px', fontSize: '16px' }}>{f.title}</h3>
                <p style={{ fontSize: '13px', color: '#8C7E72', lineHeight: '1.7' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div className="home-section" style={{ backgroundColor: '#FFFFFF' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p style={{ color: '#C9963F', fontWeight: '700', fontSize: '13px', letterSpacing: '2px', marginBottom: '8px' }}>SIMPLE PROCESS</p>
            <h2 className="home-section-title" style={{ fontWeight: '800', color: '#2C2825', marginBottom: '12px' }}>How It Works</h2>
            <p style={{ color: '#8C7E72', fontSize: '16px' }}>Get started in 3 simple steps</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '3rem' }}>
            {[
              { step: '01', icon: '📝', title: 'Create Account', desc: 'Register as a Patient or Doctor in under a minute — completely free.' },
              { step: '02', icon: '🔍', title: 'Find Your Doctor', desc: 'Browse specialists by category, view profiles, ratings and consultation fees.' },
              { step: '03', icon: '✅', title: 'Book & Pay', desc: 'Select an available slot, confirm your booking and pay securely online.' }
            ].map((item, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '52px', fontWeight: '900',
                  background: 'linear-gradient(135deg, #2D6B6B 0%, #B8DADA 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: '0.5rem', fontFamily: 'Inter, sans-serif',
                  letterSpacing: '-2px', lineHeight: 1
                }}>
                  {item.step}
                </div>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  backgroundColor: '#E8F4F4', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1rem', fontSize: '28px',
                  border: '2px solid #2D6B6B'
                }}>
                  {item.icon}
                </div>
                <h3 style={{ fontWeight: '700', color: '#2C2825', marginBottom: '8px', fontSize: '17px' }}>{item.title}</h3>
                <p style={{ fontSize: '13px', color: '#8C7E72', lineHeight: '1.7' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BROWSE DOCTORS ── */}
      <div id="doctors" className="home-section" style={{ backgroundColor: '#FAF7F2' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p style={{ color: '#C9963F', fontWeight: '700', fontSize: '13px', letterSpacing: '2px', marginBottom: '8px' }}>OUR SPECIALISTS</p>
            <h2 className="home-section-title" style={{ fontWeight: '800', color: '#2C2825', marginBottom: '12px' }}>Meet Our Doctors</h2>
            <p style={{ color: '#8C7E72', fontSize: '16px', maxWidth: '480px', margin: '0 auto' }}>
              Verified and trusted healthcare professionals ready to help you
            </p>
          </div>

          {loading && <div style={{ textAlign: 'center', padding: '4rem', color: '#8C7E72' }}>Loading doctors...</div>}

          {/* ── ROTATING DOCTOR CAROUSEL ── */}
          {!loading && providers.length > 0 && (
            <div style={{ position: 'relative', overflow: 'hidden', padding: '1rem 0' }}>
              <style>{`
                .carousel-track {
                  display: flex;
                  gap: 1.5rem;
                  width: max-content;
                  animation: scrollLeft 30s linear infinite;
                }
                .carousel-track:hover {
                  animation-play-state: paused;
                }
                @keyframes scrollLeft {
                  0%   { transform: translateX(0); }
                  100% { transform: translateX(-50%); }
                }
                .doctor-card:hover {
                  transform: translateY(-6px) scale(1.02) !important;
                  box-shadow: 0 12px 32px rgba(45,107,107,0.2) !important;
                  border-color: #2D6B6B !important;
                }
              `}</style>

              <div className="carousel-track">
                {[...providers, ...providers].map((provider, index) => (
                  <div
                    key={`${provider.providerId}-${index}`}
                    className="doctor-card"
                    onClick={() => { setDetailDoctor(provider); setShowDoctorDetail(true); }}
                    style={{
                      width: '320px',
                      flexShrink: 0,
                      backgroundColor: 'white',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      border: '1px solid #E2D9CE',
                      transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(44,40,37,0.06)'
                    }}
                  >
                    {/* Photo area */}
                    <div style={{
                      width: '100%', height: '240px',
                      background: 'linear-gradient(160deg, #E8F4F4 0%, #B8DADA 40%, #2D6B6B 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative', overflow: 'hidden'
                    }}>
                      {provider.profilePhotoUrl ? (
                        <img
                          src={provider.profilePhotoUrl}
                          alt={provider.doctorName}
                          style={{
                            width: '100%', height: '100%',
                            objectFit: 'cover', objectPosition: 'center top'
                          }}
                        />
                      ) : (
                        <svg width="130" height="150" viewBox="0 0 130 150">
                          {/* Head */}
                          <circle cx="65" cy="48" r="30" fill="rgba(255,255,255,0.9)"/>
                          {/* Shoulders / body arc */}
                          <path d="M0 148 Q0 88 65 88 Q130 88 130 148 Z" fill="rgba(255,255,255,0.9)"/>
                        </svg>
                      )}

                      {/* Specialization badge */}
                      <div style={{ position: 'absolute', bottom: '14px', left: '14px', backgroundColor: 'rgba(255,255,255,0.95)', color: '#2D6B6B', padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                        {provider.specialization}
                      </div>

                      {/* Verified badge */}
                      <div style={{ position: 'absolute', top: '14px', right: '14px', backgroundColor: '#EBF5EF', color: '#3D7A5A', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3D7A5A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Verified
                      </div>
                    </div>

                    {/* Info strip */}
                    <div style={{ padding: '1.2rem 1.2rem 1.4rem', textAlign: 'center' }}>
                      <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#2C2825', marginBottom: '8px' }}>
                        Dr. {provider.doctorName || `Provider #${provider.providerId}`}
                      </h3>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '3px', marginBottom: '8px' }}>
                        {[1,2,3,4,5].map(star => (
                          <span key={star} style={{
                            color: star <= Math.round(provider.avgRating || 0) ? '#C9963F' : '#E2D9CE',
                            fontSize: '18px'
                          }}>★</span>
                        ))}
                        <span style={{ fontSize: '12px', color: '#8C7E72', marginLeft: '4px' }}>
                          ({(provider.avgRating || 0).toFixed(1)})
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#8C7E72', letterSpacing: '0.3px' }}>
                        Click to view profile →
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Fade edges */}
              <div style={{
                position: 'absolute', top: 0, left: 0,
                width: '60px', height: '100%',
                background: 'linear-gradient(to right, #FAF7F2, transparent)',
                pointerEvents: 'none', zIndex: 2
              }} />
              <div style={{
                position: 'absolute', top: 0, right: 0,
                width: '60px', height: '100%',
                background: 'linear-gradient(to left, #FAF7F2, transparent)',
                pointerEvents: 'none', zIndex: 2
              }} />
            </div>
          )}

          {/* See All button */}
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button
              onClick={() => navigate('/doctors')}
              style={{
                padding: '14px 40px', fontSize: '15px', fontWeight: '700',
                backgroundColor: 'transparent', color: '#2D6B6B',
                border: '2px solid #2D6B6B', borderRadius: '10px',
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.target.style.backgroundColor = '#2D6B6B'; e.target.style.color = 'white'; }}
              onMouseLeave={e => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#2D6B6B'; }}
            >
              View All Doctors & Book →
            </button>
          </div>
        </div>
      </div>

      {/* ── CTA SECTION ── */}
      <div className="home-section" style={{ background: 'linear-gradient(135deg, #1F4E4E, #2D6B6B)', textAlign: 'center' }}>
        <p style={{ color: '#F0C878', fontWeight: '700', fontSize: '13px', letterSpacing: '2px', marginBottom: '12px' }}>JOIN US TODAY</p>
        <h2 style={{ fontSize: '38px', fontWeight: '800', color: 'white', marginBottom: '12px' }}>
          Ready to Take Control<br />of Your Health?
        </h2>
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.75)', maxWidth: '480px', margin: '0 auto 2.5rem' }}>
          Join thousands of patients who trust MediBook for their healthcare needs
        </p>
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/register')}
            style={{
              padding: '15px 40px', fontSize: '16px', fontWeight: '700',
              backgroundColor: '#C9963F', color: 'white',
              border: 'none', borderRadius: '10px', cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.target.style.backgroundColor = '#A67830'; e.target.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.target.style.backgroundColor = '#C9963F'; e.target.style.transform = 'translateY(0)'; }}
          >
            Create Free Account
          </button>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '15px 40px', fontSize: '16px', fontWeight: '600',
              backgroundColor: 'transparent', color: 'white',
              border: '2px solid rgba(255,255,255,0.4)', borderRadius: '10px',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.target.style.borderColor = 'white'; }}
            onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,255,255,0.4)'; }}
          >
            Already have an account?
          </button>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ backgroundColor: '#1A1511', color: '#8C7E72', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
          <span style={{ fontSize: '26px' }}>🏥</span>
          <span style={{ fontSize: '20px', fontWeight: '800', color: 'white', letterSpacing: '-0.5px' }}>MediBook</span>
        </div>
        <p style={{ fontSize: '13px', marginBottom: '16px', color: '#8C7E72' }}>Book Smarter. Heal Faster. Care Better.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {['Privacy Policy', 'Terms of Service', 'Contact Us'].map(link => (
            <span key={link} style={{ fontSize: '12px', color: '#5C524A', cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseEnter={e => { e.target.style.color = '#8C7E72'; }}
              onMouseLeave={e => { e.target.style.color = '#5C524A'; }}>
              {link}
            </span>
          ))}
        </div>
        <div style={{ width: '60px', height: '1px', backgroundColor: '#2C2825', margin: '0 auto 16px' }} />
        <p style={{ fontSize: '12px', color: '#3D342D' }}>© 2026 MediBook. All rights reserved.</p>
      </div>

      {/* ── DOCTOR DETAIL MODAL ── */}
      {showDoctorDetail && detailDoctor && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(26,21,17,0.65)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '20px',
            width: '100%', maxWidth: '560px', maxHeight: '88vh', overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(26,21,17,0.35)'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #1F4E4E 0%, #2D6B6B 100%)',
              padding: '2rem', borderRadius: '20px 20px 0 0',
              position: 'relative'
            }}>
              <button
                onClick={() => setShowDoctorDetail(false)}
                style={{
                  position: 'absolute', top: '16px', right: '16px',
                  background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px', width: '36px', height: '36px',
                  fontSize: '16px', cursor: 'pointer', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                ✕
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%',
                  overflow: 'hidden', border: '3px solid rgba(255,255,255,0.4)',
                  backgroundColor: '#E8F4F4', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {detailDoctor.profilePhotoUrl ? (
                    <img src={detailDoctor.profilePhotoUrl} alt={detailDoctor.doctorName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <svg width="48" height="48" viewBox="0 0 130 150">
                      <circle cx="65" cy="48" r="30" fill="#2D6B6B" opacity="0.7"/>
                      <path d="M0 148 Q0 88 65 88 Q130 88 130 148 Z" fill="#2D6B6B" opacity="0.7"/>
                    </svg>
                  )}
                </div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>
                    Dr. {detailDoctor.doctorName || `Provider #${detailDoctor.providerId}`}
                  </h3>
                  <span style={{
                    backgroundColor: 'rgba(255,255,255,0.15)', color: '#F0C878',
                    padding: '4px 14px', borderRadius: '20px',
                    fontSize: '12px', fontWeight: '700', display: 'inline-block'
                  }}>
                    {detailDoctor.specialization || 'General Physician'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
                    {[1,2,3,4,5].map(star => (
                      <span key={star} style={{
                        color: star <= Math.round(detailDoctor.avgRating || 0) ? '#F0C878' : 'rgba(255,255,255,0.3)',
                        fontSize: '16px'
                      }}>★</span>
                    ))}
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginLeft: '4px' }}>
                      ({(detailDoctor.avgRating || 0).toFixed(1)})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '2rem' }}>
              {/* Info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1.5rem' }}>
                {[
                  { icon: '🎓', label: 'Qualification', value: detailDoctor.qualification || 'MBBS' },
                  { icon: '💼', label: 'Experience', value: `${detailDoctor.experienceYears || 0} years` },
                  { icon: '🏥', label: 'Clinic', value: detailDoctor.clinicName || '—' },
                  { icon: '📍', label: 'Location', value: detailDoctor.clinicAddress || '—' },
                ].map((item, i) => (
                  <div key={i} style={{
                    backgroundColor: '#FAF7F2', borderRadius: '10px',
                    padding: '12px 14px', border: '1px solid #E2D9CE'
                  }}>
                    <p style={{ fontSize: '11px', color: '#8C7E72', fontWeight: '600', marginBottom: '3px', letterSpacing: '0.5px' }}>
                      {item.icon} {item.label}
                    </p>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: '#2C2825' }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Bio */}
              {detailDoctor.bio && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: '#8C7E72', letterSpacing: '1px', marginBottom: '8px' }}>ABOUT</p>
                  <p style={{ fontSize: '13px', color: '#5C524A', lineHeight: '1.7' }}>{detailDoctor.bio}</p>
                </div>
              )}

              {/* Fee */}
              <div style={{
                backgroundColor: '#E8F4F4', borderRadius: '12px',
                padding: '14px 18px', marginBottom: '1.5rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontSize: '14px', color: '#2D6B6B', fontWeight: '600' }}>Consultation Fee</span>
                <span style={{ fontSize: '22px', fontWeight: '800', color: '#1F4E4E' }}>
                  ₹{detailDoctor.consultationFee || 0}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => { setShowDoctorDetail(false); handleViewSlots(detailDoctor); }}
                  style={{
                    flex: 1, padding: '13px', fontSize: '14px', fontWeight: '600',
                    backgroundColor: 'transparent', color: '#2D6B6B',
                    border: '2px solid #2D6B6B', borderRadius: '10px',
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.target.style.backgroundColor = '#2D6B6B'; e.target.style.color = 'white'; }}
                  onMouseLeave={e => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#2D6B6B'; }}
                >
                  📅 View Available Slots
                </button>
                <button
                  onClick={() => { setShowDoctorDetail(false); navigate('/register'); }}
                  style={{
                    flex: 1, padding: '13px', fontSize: '14px', fontWeight: '700',
                    backgroundColor: '#C9963F', color: 'white',
                    border: 'none', borderRadius: '10px',
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.target.style.backgroundColor = '#A67830'; }}
                  onMouseLeave={e => { e.target.style.backgroundColor = '#C9963F'; }}
                >
                  Book Appointment →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SLOTS MODAL ── */}
      {showSlots && selectedProvider && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(26,21,17,0.6)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '20px', padding: '2rem',
            width: '100%', maxWidth: '520px', maxHeight: '80vh', overflowY: 'auto',
            boxShadow: '0 16px 48px rgba(26,21,17,0.3)'
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #E2D9CE'
            }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#2C2825' }}>
                  Dr. {selectedProvider.doctorName || `Provider #${selectedProvider.providerId}`}
                </h3>
                <p style={{ color: '#2D6B6B', fontSize: '13px', fontWeight: '600', marginTop: '2px' }}>
                  {selectedProvider.specialization} · {selectedProvider.clinicName}
                </p>
              </div>
              <button
                onClick={() => setShowSlots(false)}
                style={{
                  background: 'none', border: '1.5px solid #E2D9CE',
                  borderRadius: '8px', width: '36px', height: '36px',
                  fontSize: '16px', cursor: 'pointer', color: '#8C7E72',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '12px', fontWeight: '700', color: '#8C7E72', letterSpacing: '1px', marginBottom: '1rem' }}>
              UPCOMING AVAILABLE SLOTS
            </p>

            {loadingSlots && <div style={{ textAlign: 'center', padding: '2rem', color: '#8C7E72' }}>Loading slots...</div>}

            {!loadingSlots && slots.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#FAF7F2', borderRadius: '10px', color: '#8C7E72' }}>
                No upcoming slots available
              </div>
            )}

            {!loadingSlots && slots.length > 0 && (
              <div>
                {Object.entries(slotsByDate).map(([date, dateSlots]) => (
                  <div key={date} style={{ marginBottom: '1.2rem' }}>
                    <p style={{
                      fontSize: '12px', fontWeight: '700', color: '#5C524A',
                      marginBottom: '8px', padding: '5px 12px',
                      backgroundColor: '#F2EDE4', borderRadius: '6px',
                      display: 'inline-block', letterSpacing: '0.3px'
                    }}>
                      📅 {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
                        weekday: 'long', day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {dateSlots.map(slot => (
                        <span key={slot.slotId} style={{
                          padding: '7px 14px', borderRadius: '8px',
                          backgroundColor: '#E8F4F4', border: '1.5px solid #2D6B6B',
                          fontSize: '13px', color: '#1F4E4E', fontWeight: '600'
                        }}>
                          {slot.startTime} - {slot.endTime}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #E2D9CE' }}>
              <p style={{ fontSize: '13px', color: '#8C7E72', marginBottom: '12px', textAlign: 'center' }}>
                Create a free account to book an appointment
              </p>
              <button
                onClick={() => { setShowSlots(false); navigate('/register'); }}
                style={{
                  width: '100%', padding: '14px', fontSize: '15px', fontWeight: '700',
                  backgroundColor: '#C9963F', color: 'white',
                  border: 'none', borderRadius: '10px', cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.target.style.backgroundColor = '#A67830'; }}
                onMouseLeave={e => { e.target.style.backgroundColor = '#C9963F'; }}
              >
                Register & Book Appointment →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
