import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getProviderById, submitProfileUpdate, getSpecializations, updateProviderPhoto } from '../../api/providerApi';

const ProviderProfile = () => {
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [specializations, setSpecializations] = useState([]);
  const [photoPreview, setPhotoPreview] = useState(provider?.profilePhotoUrl || null);
const [photoBase64, setPhotoBase64] = useState(null);
  const [form, setForm] = useState({
    specialization: '',
    qualification: '',
    experienceYears: '',
    bio: '',
    clinicName: '',
    clinicAddress: '',
    consultationFee: ''
  });

  const providerId = localStorage.getItem('providerId');

  useEffect(() => {
    fetchProfile();
    getSpecializations().then(setSpecializations).catch(console.error);
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await getProviderById(providerId);
      setProvider(data);
      if (data.profilePhotoUrl) {
        setPhotoPreview(data.profilePhotoUrl);
      }
      setForm({
        specialization: data.specialization || '',
        qualification: data.qualification || '',
        experienceYears: data.experienceYears || '',
        bio: data.bio || '',
        clinicName: data.clinicName || '',
        clinicAddress: data.clinicAddress || '',
        consultationFee: data.consultationFee || ''
      });
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Photo must be less than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
      setPhotoBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (photoBase64) {
        await updateProviderPhoto(providerId, photoBase64);
        localStorage.setItem('providerPhoto', photoBase64);
      }
      await submitProfileUpdate(providerId, {
        specialization: form.specialization,
        qualification: form.qualification,
        experienceYears: parseInt(form.experienceYears) || 0,
        bio: form.bio,
        clinicName: form.clinicName,
        clinicAddress: form.clinicAddress,
        consultationFee: parseFloat(form.consultationFee) || 0
      });
      toast.success('Profile update submitted for admin approval!');
      fetchProfile();
    } catch (err) {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
        Loading profile...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
          My Profile
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
          Update your professional details and consultation fee
        </p>
      </div>

      {/* Verification / pending status banner */}
      {provider?.hasPendingChanges ? (
        <div style={{
          backgroundColor: '#fef3c7', border: '1px solid #fcd34d',
          borderRadius: '8px', padding: '12px 16px',
          marginBottom: '1.5rem', fontSize: '14px', color: '#92400e'
        }}>
          ⏳ You have pending profile changes waiting for admin approval.
          Patients still see your previous verified profile until approved.
        </div>
      ) : provider?.isVerified ? (
        <div style={{
          backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
          borderRadius: '8px', padding: '12px 16px',
          marginBottom: '1.5rem', fontSize: '14px', color: '#15803d'
        }}>
          ✅ Your profile is verified. Patients can book appointments with you.
        </div>
      ) : (
        <div style={{
          backgroundColor: '#fefce8', border: '1px solid #fde68a',
          borderRadius: '8px', padding: '12px 16px',
          marginBottom: '1.5rem', fontSize: '14px', color: '#92400e'
        }}>
          ⏳ Your profile is pending admin verification.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

        {/* Left — Edit form */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '1.5rem' }}>
            ✏️ Edit Details
          </h3>
          <form onSubmit={handleSave}>
            {/* Profile Photo Upload */}
            <div style={{
              display: 'flex', alignItems: 'center',
              gap: '1.5rem', marginBottom: '2rem',
              padding: '1.2rem',
              backgroundColor: '#f8fafc',
              border: '1px solid #E2D9CE',
              borderRadius: '12px'
            }}>
              <div style={{
                width: '90px', height: '90px', borderRadius: '50%',
                overflow: 'hidden', flexShrink: 0,
                border: '3px solid #2D6B6B',
                backgroundColor: '#E8F4F4',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Profile"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                    stroke="#2D6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                )}
              </div>
              <div>
                <p style={{ fontWeight: '700', color: '#2C2825', marginBottom: '4px', fontSize: '14px' }}>
                  Profile Photo
                </p>
                <p style={{ fontSize: '12px', color: '#8C7E72', marginBottom: '10px' }}>
                  JPG or PNG, max 2MB
                </p>
                <label style={{
                  padding: '8px 16px', fontSize: '13px', fontWeight: '600',
                  backgroundColor: '#2D6B6B', color: 'white',
                  borderRadius: '8px', cursor: 'pointer',
                  display: 'inline-block', transition: 'all 0.2s'
                }}
                  onMouseEnter={e => { e.target.style.backgroundColor = '#1F4E4E'; }}
                  onMouseLeave={e => { e.target.style.backgroundColor = '#2D6B6B'; }}
                >
                  Upload Photo
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handlePhotoChange}
                    style={{ display: 'none' }}
                  />
                </label>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={() => { setPhotoPreview(null); setPhotoBase64(null); }}
                    style={{
                      marginLeft: '8px', padding: '8px 14px', fontSize: '13px',
                      fontWeight: '600', backgroundColor: '#fee2e2', color: '#dc2626',
                      border: 'none', borderRadius: '8px', cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Specialization *</label>
              <select
                name="specialization"
                value={form.specialization}
                onChange={handleChange}
                disabled={saving}
              >
                <option value="">-- Select --</option>
                {specializations.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Qualification *</label>
              <input
                type="text"
                name="qualification"
                placeholder="e.g. MBBS, MD"
                value={form.qualification}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label>Years of Experience</label>
              <input
                type="number"
                name="experienceYears"
                placeholder="e.g. 5"
                value={form.experienceYears}
                onChange={handleChange}
                min="0"
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label>Clinic Name *</label>
              <input
                type="text"
                name="clinicName"
                placeholder="e.g. City Health Clinic"
                value={form.clinicName}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label>Clinic Address</label>
              <input
                type="text"
                name="clinicAddress"
                placeholder="e.g. 123 Main St, Mumbai"
                value={form.clinicAddress}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label>Bio</label>
              <textarea
                name="bio"
                rows={3}
                placeholder="Brief description about yourself..."
                value={form.bio}
                onChange={handleChange}
                disabled={saving}
                style={{
                  width: '100%', padding: '10px 12px',
                  border: '1px solid #cbd5e1', borderRadius: '8px',
                  fontSize: '14px', outline: 'none', resize: 'vertical'
                }}
              />
            </div>

            {/* Consultation fee — highlighted */}
            <div style={{
              backgroundColor: '#f0fdf4', border: '2px solid #16a34a',
              borderRadius: '10px', padding: '1rem', marginBottom: '1rem'
            }}>
              <label style={{
                display: 'block', fontSize: '13px', fontWeight: '700',
                color: '#15803d', marginBottom: '6px'
              }}>
                💰 Consultation Fee (₹) *
              </label>
              <input
                type="number"
                name="consultationFee"
                placeholder="e.g. 500"
                value={form.consultationFee}
                onChange={handleChange}
                min="0"
                disabled={saving}
                style={{
                  width: '100%', padding: '10px 12px',
                  border: '1px solid #bbf7d0', borderRadius: '8px',
                  fontSize: '16px', fontWeight: '700', outline: 'none',
                  color: '#15803d'
                }}
              />
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                This fee will be shown to patients during booking
              </p>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px' }}
              disabled={saving}
            >
              {saving ? 'Submitting...' : '📤 Submit for Approval'}
            </button>
          </form>
        </div>

        {/* Right — Current profile preview + pending changes */}
        <div>
          {provider?.hasPendingChanges && (
            <div className="card" style={{
              border: '2px solid #fcd34d', backgroundColor: '#fefce8',
              marginBottom: '1rem'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#92400e', marginBottom: '1rem' }}>
                ⏳ Pending Changes (awaiting approval)
              </h3>
              <div style={{ fontSize: '13px', color: '#78350f' }}>
                {provider.pendingSpecialization && (
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ color: '#94a3b8' }}>Specialization: </span>
                    <strong>{provider.pendingSpecialization}</strong>
                  </div>
                )}
                {provider.pendingQualification && (
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ color: '#94a3b8' }}>Qualification: </span>
                    <strong>{provider.pendingQualification}</strong>
                  </div>
                )}
                {provider.pendingClinicName && (
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ color: '#94a3b8' }}>Clinic: </span>
                    <strong>{provider.pendingClinicName}</strong>
                  </div>
                )}
                {provider.pendingConsultationFee && (
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ color: '#94a3b8' }}>Fee: </span>
                    <strong>₹{provider.pendingConsultationFee}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '1rem' }}>
              👁️ Current Profile
            </h3>
            <div style={{ fontSize: '14px', color: '#475569' }}>
              <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Provider ID</span>
                <span style={{ fontWeight: '600' }}>#{provider?.providerId}</span>
              </div>
              <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Specialization</span>
                <span style={{ fontWeight: '600', color: '#2563eb' }}>{provider?.specialization || '—'}</span>
              </div>
              <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Qualification</span>
                <span style={{ fontWeight: '600' }}>{provider?.qualification || '—'}</span>
              </div>
              <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Experience</span>
                <span style={{ fontWeight: '600' }}>{provider?.experienceYears || 0} years</span>
              </div>
              <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Clinic</span>
                <span style={{ fontWeight: '600' }}>{provider?.clinicName || '—'}</span>
              </div>
              <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Rating</span>
                <span style={{ fontWeight: '600' }}>⭐ {provider?.avgRating?.toFixed(1) || '0.0'}</span>
              </div>
              <div style={{
                marginTop: '1rem', padding: '12px',
                backgroundColor: '#f0fdf4', borderRadius: '8px',
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: '#15803d', fontWeight: '600' }}>Consultation Fee</span>
                <span style={{ fontSize: '22px', fontWeight: '800', color: '#15803d' }}>
                  ₹{provider?.consultationFee || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderProfile;