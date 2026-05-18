import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProviders, getSpecializations } from '../api/providerApi';
import { getSlotsByProvider } from '../api/scheduleApi';

const DoctorsPage = () => {
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [selectedSpec, setSelectedSpec] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
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
      console.error('Failed to load');
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
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const filtered = providers.filter(p => {
    const specMatch = selectedSpec
      ? p.specialization?.toLowerCase() === selectedSpec.toLowerCase()
      : true;
    const searchMatch = searchQuery.trim()
      ? p.doctorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.specialization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.clinicName?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return specMatch && searchMatch;
  });

  const slotsByDate = slots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {});

  return (
    <div style={{ backgroundColor: '#FAF7F2', minHeight: '100vh' }}>

      {/* Navbar */}
      <nav style={{
        backgroundColor: '#FFFFFF', padding: '0 3rem',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', height: '70px',
        boxShadow: '0 2px 12px rgba(44,40,37,0.08)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <span style={{ fontSize: '28px' }}>🏥</span>
          <div>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#2D6B6B' }}>MediBook</span>
            <div style={{ fontSize: '10px', color: '#8C7E72', letterSpacing: '1.5px' }}>HEALTHCARE PLATFORM</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '9px 20px', fontSize: '14px', fontWeight: '600',
              backgroundColor: 'transparent', color: '#5C524A',
              border: '1.5px solid #E2D9CE', borderRadius: '8px',
              cursor: 'pointer', fontFamily: 'inherit'
            }}
          >
            ← Back to Home
          </button>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '9px 20px', fontSize: '14px', fontWeight: '600',
              backgroundColor: 'transparent', color: '#2D6B6B',
              border: '2px solid #2D6B6B', borderRadius: '8px',
              cursor: 'pointer', fontFamily: 'inherit'
            }}
          >
            Login
          </button>
          <button
            onClick={() => navigate('/register')}
            style={{
              padding: '9px 20px', fontSize: '14px', fontWeight: '700',
              backgroundColor: '#C9963F', color: 'white',
              border: 'none', borderRadius: '8px',
              cursor: 'pointer', fontFamily: 'inherit'
            }}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero bar */}
      <div style={{
        background: 'linear-gradient(135deg, #1F4E4E, #2D6B6B)',
        padding: '3rem', textAlign: 'center'
      }}>
        <p style={{ color: '#F0C878', fontWeight: '700', fontSize: '12px', letterSpacing: '2px', marginBottom: '8px' }}>
          OUR SPECIALISTS
        </p>
        <h1 style={{ fontSize: '38px', fontWeight: '800', color: 'white', marginBottom: '8px' }}>
          Find Your Doctor
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '16px' }}>
          Browse all verified specialists — click any card to view full profile and available slots
        </p>
      </div>

      {/* Filters */}
      <div style={{
        backgroundColor: 'white', padding: '1.5rem 3rem',
        borderBottom: '1px solid #E2D9CE',
        position: 'sticky', top: '70px', zIndex: 99
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <input
            type="text"
            placeholder="Search by doctor name, specialization or clinic..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '12px 18px',
              border: '1.5px solid #E2D9CE', borderRadius: '10px',
              fontSize: '14px', outline: 'none',
              backgroundColor: '#FAF7F2', color: '#2C2825',
              fontFamily: 'inherit', marginBottom: '1rem'
            }}
            onFocus={e => { e.target.style.borderColor = '#2D6B6B'; }}
            onBlur={e => { e.target.style.borderColor = '#E2D9CE'; }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#8C7E72', fontWeight: '600', marginRight: '4px' }}>Filter:</span>
            <button
              onClick={() => setSelectedSpec('')}
              style={{
                padding: '6px 16px', fontSize: '12px', borderRadius: '20px',
                fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
                border: '1.5px solid',
                backgroundColor: selectedSpec === '' ? '#2D6B6B' : 'white',
                color: selectedSpec === '' ? 'white' : '#5C524A',
                borderColor: selectedSpec === '' ? '#2D6B6B' : '#E2D9CE'
              }}
            >
              All ({providers.length})
            </button>
            {specializations.map(spec => {
              const count = providers.filter(p =>
                p.specialization?.toLowerCase() === spec.name.toLowerCase()
              ).length;
              return count > 0 ? (
                <button
                  key={spec.id}
                  onClick={() => setSelectedSpec(spec.name)}
                  style={{
                    padding: '6px 16px', fontSize: '12px', borderRadius: '20px',
                    fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
                    border: '1.5px solid',
                    backgroundColor: selectedSpec === spec.name ? '#2D6B6B' : 'white',
                    color: selectedSpec === spec.name ? 'white' : '#5C524A',
                    borderColor: selectedSpec === spec.name ? '#2D6B6B' : '#E2D9CE'
                  }}
                >
                  {spec.name} ({count})
                </button>
              ) : null;
            })}
          </div>
        </div>
      </div>

      {/* Results */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 3rem' }}>
        <p style={{ fontSize: '14px', color: '#8C7E72', marginBottom: '1.5rem' }}>
          Showing <strong style={{ color: '#2D6B6B' }}>{filtered.length}</strong> doctor(s)
          {selectedSpec && ` in ${selectedSpec}`}
        </p>

        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#8C7E72' }}>
            Loading doctors...
          </div>
        )}

        {!loading && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            {filtered.map(provider => (
              <div
                key={provider.providerId}
                onClick={() => { setDetailDoctor(provider); setShowDoctorDetail(true); }}
                style={{
                  backgroundColor: 'white', borderRadius: '20px',
                  overflow: 'hidden', border: '1px solid #E2D9CE',
                  transition: 'all 0.2s', cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(44,40,37,0.06)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(45,107,107,0.15)';
                  e.currentTarget.style.borderColor = '#2D6B6B';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(44,40,37,0.06)';
                  e.currentTarget.style.borderColor = '#E2D9CE';
                }}
              >
                {/* Photo */}
                <div style={{
                  width: '100%', height: '220px', position: 'relative',
                  background: 'linear-gradient(135deg, #E8F4F4 0%, #C8E6E6 50%, #2D6B6B 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <svg width="140" height="160" viewBox="0 0 130 150" style={{ marginBottom: '-8px' }}>
                    <circle cx="65" cy="48" r="30" fill="rgba(255,255,255,0.9)"/>
                    <path d="M0 148 Q0 88 65 88 Q130 88 130 148 Z" fill="rgba(255,255,255,0.9)"/>
                  </svg>
                  <div style={{ position: 'absolute', bottom: '12px', left: '12px' }}>
                    <span style={{
                      backgroundColor: 'rgba(255,255,255,0.95)', color: '#2D6B6B',
                      padding: '4px 12px', borderRadius: '20px',
                      fontSize: '11px', fontWeight: '700'
                    }}>
                      {provider.specialization}
                    </span>
                  </div>
                  <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    <span style={{
                      backgroundColor: '#EBF5EF', color: '#3D7A5A',
                      padding: '3px 10px', borderRadius: '20px',
                      fontSize: '10px', fontWeight: '700'
                    }}>
                      ✓ Verified
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding: '1.2rem', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#2C2825', marginBottom: '6px' }}>
                    Dr. {provider.doctorName || `Provider #${provider.providerId}`}
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '3px', marginBottom: '6px' }}>
                    {[1,2,3,4,5].map(star => (
                      <span key={star} style={{
                        color: star <= Math.round(provider.avgRating || 0) ? '#C9963F' : '#E2D9CE',
                        fontSize: '16px'
                      }}>★</span>
                    ))}
                    <span style={{ fontSize: '12px', color: '#8C7E72', marginLeft: '3px' }}>
                      ({(provider.avgRating || 0).toFixed(1)})
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#8C7E72' }}>
                      💼 {provider.experienceYears || 0} yrs exp
                    </span>
                    <span style={{ fontSize: '16px', fontWeight: '800', color: '#2D6B6B' }}>
                      ₹{provider.consultationFee || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: '#8C7E72' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
                <p style={{ fontSize: '16px', fontWeight: '600' }}>No doctors found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── DOCTOR DETAIL MODAL ── */}
      {showDoctorDetail && detailDoctor && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(26,21,17,0.6)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FAF7F2', borderRadius: '20px',
            width: '100%', maxWidth: '560px',
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 16px 48px rgba(26,21,17,0.3)'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1F4E4E, #2D6B6B)',
              padding: '2rem', borderRadius: '20px 20px 0 0',
              textAlign: 'center', position: 'relative'
            }}>
              <button
                onClick={() => setShowDoctorDetail(false)}
                style={{
                  position: 'absolute', top: '1rem', right: '1rem',
                  background: 'rgba(255,255,255,0.2)', border: 'none',
                  borderRadius: '8px', width: '34px', height: '34px',
                  fontSize: '16px', cursor: 'pointer', color: 'white'
                }}
              >✕</button>
              <div style={{
                width: '90px', height: '90px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem',
                border: '3px solid rgba(255,255,255,0.4)',
                overflow: 'hidden'
              }}>
                <svg width="60" height="70" viewBox="0 0 130 150">
                  <circle cx="65" cy="48" r="30" fill="rgba(255,255,255,0.9)"/>
                  <path d="M0 148 Q0 88 65 88 Q130 88 130 148 Z" fill="rgba(255,255,255,0.9)"/>
                </svg>
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'white', marginBottom: '6px' }}>
                Dr. {detailDoctor.doctorName || `Provider #${detailDoctor.providerId}`}
              </h2>
              <span style={{
                backgroundColor: 'rgba(201,150,63,0.3)', color: '#F0C878',
                padding: '4px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '700'
              }}>
                {detailDoctor.specialization}
              </span>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '12px' }}>
                {[1,2,3,4,5].map(star => (
                  <span key={star} style={{
                    color: star <= Math.round(detailDoctor.avgRating || 0) ? '#F0C878' : 'rgba(255,255,255,0.3)',
                    fontSize: '22px'
                  }}>★</span>
                ))}
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginLeft: '6px', alignSelf: 'center' }}>
                  {(detailDoctor.avgRating || 0).toFixed(1)} / 5.0
                </span>
              </div>
            </div>

            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { icon: '🎓', label: 'Qualification', value: detailDoctor.qualification || 'MBBS' },
                  { icon: '💼', label: 'Experience', value: `${detailDoctor.experienceYears || 0} years` },
                  { icon: '🏥', label: 'Clinic', value: detailDoctor.clinicName || '—' },
                  { icon: '📍', label: 'Location', value: detailDoctor.clinicAddress || '—' },
                ].map((item, i) => (
                  <div key={i} style={{
                    backgroundColor: 'white', borderRadius: '10px',
                    padding: '1rem', border: '1px solid #E2D9CE'
                  }}>
                    <p style={{ fontSize: '11px', color: '#8C7E72', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      {item.icon} {item.label.toUpperCase()}
                    </p>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#2C2825' }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {detailDoctor.bio && (
                <div style={{
                  backgroundColor: 'white', borderRadius: '10px',
                  padding: '1rem', border: '1px solid #E2D9CE', marginBottom: '1.5rem'
                }}>
                  <p style={{ fontSize: '11px', color: '#8C7E72', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '6px' }}>ABOUT</p>
                  <p style={{ fontSize: '14px', color: '#5C524A', lineHeight: '1.7' }}>{detailDoctor.bio}</p>
                </div>
              )}

              <div style={{
                backgroundColor: '#E8F4F4', borderRadius: '10px',
                padding: '1rem 1.5rem', border: '1px solid #2D6B6B',
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: '1.5rem'
              }}>
                <div>
                  <p style={{ fontSize: '11px', color: '#2D6B6B', fontWeight: '700', letterSpacing: '0.5px' }}>CONSULTATION FEE</p>
                  <p style={{ fontSize: '28px', fontWeight: '800', color: '#1F4E4E' }}>₹{detailDoctor.consultationFee || 0}</p>
                </div>
                <span style={{
                  backgroundColor: '#EBF5EF', color: '#3D7A5A',
                  padding: '6px 16px', borderRadius: '20px',
                  fontSize: '12px', fontWeight: '700', border: '1px solid #3D7A5A'
                }}>✓ Verified Doctor</span>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => { setShowDoctorDetail(false); handleViewSlots(detailDoctor); }}
                  style={{
                    flex: 1, padding: '13px', fontSize: '14px', fontWeight: '600',
                    backgroundColor: '#F2EDE4', color: '#5C524A',
                    border: '1.5px solid #E2D9CE', borderRadius: '10px',
                    cursor: 'pointer', fontFamily: 'inherit'
                  }}
                >
                  📅 View Available Slots
                </button>
                <button
                  onClick={() => { setShowDoctorDetail(false); navigate('/register'); }}
                  style={{
                    flex: 1, padding: '13px', fontSize: '14px', fontWeight: '700',
                    backgroundColor: '#C9963F', color: 'white',
                    border: 'none', borderRadius: '10px',
                    cursor: 'pointer', fontFamily: 'inherit'
                  }}
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
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(26,21,17,0.6)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '20px',
            padding: '2rem', width: '100%', maxWidth: '520px',
            maxHeight: '80vh', overflowY: 'auto',
            boxShadow: '0 16px 48px rgba(26,21,17,0.3)'
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '1.5rem',
              paddingBottom: '1rem', borderBottom: '1px solid #E2D9CE'
            }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#2C2825' }}>
                  Dr. {selectedProvider.doctorName}
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
                  fontSize: '16px', cursor: 'pointer', color: '#8C7E72'
                }}
              >✕</button>
            </div>

            <p style={{ fontSize: '12px', fontWeight: '700', color: '#8C7E72', letterSpacing: '1px', marginBottom: '1rem' }}>
              UPCOMING AVAILABLE SLOTS
            </p>

            {loadingSlots && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#8C7E72' }}>Loading slots...</div>
            )}

            {!loadingSlots && slots.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#FAF7F2', borderRadius: '10px', color: '#8C7E72' }}>
                No upcoming slots available
              </div>
            )}

            {!loadingSlots && Object.entries(slotsByDate).map(([date, dateSlots]) => (
              <div key={date} style={{ marginBottom: '1.2rem' }}>
                <p style={{
                  fontSize: '12px', fontWeight: '700', color: '#5C524A',
                  marginBottom: '8px', padding: '5px 12px',
                  backgroundColor: '#F2EDE4', borderRadius: '6px', display: 'inline-block'
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

            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #E2D9CE' }}>
              <button
                onClick={() => { setShowSlots(false); navigate('/register'); }}
                style={{
                  width: '100%', padding: '14px', fontSize: '15px',
                  fontWeight: '700', backgroundColor: '#C9963F', color: 'white',
                  border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit'
                }}
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

export default DoctorsPage;
