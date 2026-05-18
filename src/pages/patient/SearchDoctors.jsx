import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProviders, searchProviders, getSpecializations } from '../../api/providerApi';
import { getAverageRating } from '../../api/reviewApi';

const SearchDoctors = () => {
  const [providers, setProviders] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ratings, setRatings] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchAll();
    fetchSpecializations();
  }, []);

  const fetchRatings = async (providers) => {
    const ratingMap = {};
    await Promise.all(
      providers.map(async (p) => {
        try {
          const avg = await getAverageRating(p.providerId);
          ratingMap[p.providerId] = avg || 0;
        } catch {
          ratingMap[p.providerId] = 0;
        }
      })
    );
    setRatings(ratingMap);
  };

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllProviders();
      const verified = data.filter(p => p.isVerified && p.isAvailable);
      setProviders(verified);
      fetchRatings(verified);
    } catch (err) {
      setError('Failed to load doctors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecializations = async () => {
    try {
      const data = await getSpecializations();
      setSpecializations(data);
    } catch (err) {
      console.error('Failed to load specializations');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) { fetchAll(); return; }
    setLoading(true);
    setError('');
    try {
      const data = await searchProviders(query.trim());
      setProviders(data.filter(p => p.isVerified && p.isAvailable));
    } catch (err) {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSelectedSpec('');
    fetchAll();
  };

  const filtered = selectedSpec
    ? providers.filter(p =>
        p.specialization?.toLowerCase() === selectedSpec.toLowerCase())
    : providers;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#2C2825' }}>
          Find a Doctor
        </h2>
        <p style={{ color: '#8C7E72', fontSize: '14px', marginTop: '4px' }}>
          Search by name or browse by specialization
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="Search by doctor name or specialization..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 1, padding: '12px 16px',
            border: '1.5px solid #E2D9CE', borderRadius: '8px',
            fontSize: '14px', outline: 'none',
            backgroundColor: '#FAFAF8', color: '#2C2825', fontFamily: 'inherit'
          }}
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px' }}>
          Search
        </button>
        {(query || selectedSpec) && (
          <button type="button" className="btn" onClick={handleClear}
            style={{ padding: '12px 16px', backgroundColor: '#F2EDE4', color: '#8C7E72', border: '1px solid #E2D9CE' }}>
            Clear
          </button>
        )}
      </form>

      {/* Specialization filter chips */}
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '13px', color: '#8C7E72', marginBottom: '8px', fontWeight: '600' }}>
          Browse by Specialization:
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button
            onClick={() => setSelectedSpec('')}
            className="btn"
            style={{
              padding: '6px 14px', fontSize: '12px', borderRadius: '20px',
              backgroundColor: selectedSpec === '' ? '#2D6B6B' : '#F2EDE4',
              color: selectedSpec === '' ? 'white' : '#8C7E72',
              border: selectedSpec === '' ? 'none' : '1px solid #E2D9CE'
            }}
          >
            All
          </button>
          {specializations.map(spec => (
            <button
              key={spec.id}
              onClick={() => setSelectedSpec(spec.name)}
              className="btn"
              style={{
                padding: '6px 14px', fontSize: '12px', borderRadius: '20px',
                backgroundColor: selectedSpec === spec.name ? '#2D6B6B' : '#F2EDE4',
                color: selectedSpec === spec.name ? 'white' : '#8C7E72',
                border: selectedSpec === spec.name ? 'none' : '1px solid #E2D9CE'
              }}
            >
              {spec.name}
            </button>
          ))}
        </div>
      </div>

      {selectedSpec && (
        <div style={{
          backgroundColor: '#E8F4F4', borderRadius: '8px',
          padding: '8px 14px', marginBottom: '1rem',
          fontSize: '13px', color: '#2D6B6B', display: 'inline-block',
          border: '1px solid #B8DADA'
        }}>
          Showing: <strong>{selectedSpec}</strong> — {filtered.length} doctor(s) found
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#8C7E72' }}>
          Loading doctors...
        </div>
      )}

      {error && (
        <div style={{
          backgroundColor: '#FBF0F0', color: '#A04040',
          padding: '12px 16px', borderRadius: '8px',
          marginBottom: '1rem', fontSize: '14px',
          border: '1px solid #E8C4C4'
        }}>
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '3rem',
          backgroundColor: 'white', borderRadius: '12px',
          color: '#8C7E72', border: '1px solid #E2D9CE'
        }}>
          No doctors found. Try a different search or specialization.
        </div>
      )}

      {/* Provider cards */}
      {!loading && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          {filtered.map((provider) => (
            <div key={provider.providerId} className="card" style={{
              border: '1px solid #E2D9CE', transition: 'box-shadow 0.2s'
            }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(44,40,37,0.12)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(44,40,37,0.08)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '50%',
                  overflow: 'hidden', border: '2px solid #2D6B6B',
                  backgroundColor: '#E8F4F4',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {provider.profilePhotoUrl ? (
                    <img
                      src={provider.profilePhotoUrl}
                      alt={provider.doctorName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <svg width="28" height="32" viewBox="0 0 130 150">
                      <circle cx="65" cy="48" r="30" fill="rgba(45,107,107,0.6)"/>
                      <path d="M0 148 Q0 88 65 88 Q130 88 130 148 Z" fill="rgba(45,107,107,0.6)"/>
                    </svg>
                  )}
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#2C2825' }}>
                    Dr. {provider.doctorName || `Provider #${provider.providerId}`}
                  </h3>
                  <span style={{
                    backgroundColor: '#E8F4F4', color: '#2D6B6B',
                    padding: '2px 10px', borderRadius: '12px',
                    fontSize: '12px', fontWeight: '600',
                    border: '1px solid #B8DADA'
                  }}>
                    {provider.specialization || 'General Physician'}
                  </span>
                </div>
              </div>

              <div style={{ fontSize: '13px', color: '#5C524A', marginBottom: '1rem' }}>
                <div style={{ marginBottom: '5px' }}>🎓 {provider.qualification || 'MBBS'}</div>
                <div style={{ marginBottom: '5px' }}>💼 {provider.experienceYears || 0} years experience</div>
                {provider.clinicName && <div style={{ marginBottom: '5px' }}>🏥 {provider.clinicName}</div>}
                {provider.clinicAddress && <div style={{ marginBottom: '5px' }}>📍 {provider.clinicAddress}</div>}
                <div style={{ marginBottom: '5px' }}>
                  {[1,2,3,4,5].map(star => (
                    <span key={star} style={{
                      color: star <= Math.round(ratings[provider.providerId] || 0)
                        ? '#C9963F' : '#E2D9CE',
                      fontSize: '16px'
                    }}>★</span>
                  ))}
                  <span style={{ fontSize: '12px', color: '#8C7E72', marginLeft: '4px' }}>
                    ({(ratings[provider.providerId] || 0).toFixed(1)})
                  </span>
                </div>
                <div style={{ fontWeight: '700', color: '#3D7A5A', fontSize: '15px', marginTop: '6px' }}>
                  🔥 ₹{provider.consultationFee || 0}
                </div>
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => navigate('/patient/appointments', {
                  state: { providerId: provider.providerId }
                })}
              >
                Book Appointment
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchDoctors;
