import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createProvider, getSpecializations } from '../../api/providerApi';

const ProviderSetup = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const [loading, setLoading] = useState(false);
  const [specializations, setSpecializations] = useState([]);
  const [form, setForm] = useState({
    specialization: localStorage.getItem('pendingSpecialization') || '',
    qualification: '',
    experienceYears: '',
    bio: '',
    clinicName: '',
    clinicAddress: '',
    consultationFee: ''
  });

  useEffect(() => {
    getSpecializations().then(setSpecializations).catch(console.error);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.specialization || !form.qualification || !form.clinicName) {
      toast.error('Specialization, qualification and clinic name are required');
      return;
    }
    setLoading(true);
    try {
      const providerObj = await createProvider({
        userId: parseInt(userId),
        doctorName: localStorage.getItem('fullName') || '',
        specialization: form.specialization,
        qualification: form.qualification,
        experienceYears: parseInt(form.experienceYears) || 0,
        bio: form.bio,
        clinicName: form.clinicName,
        clinicAddress: form.clinicAddress,
        consultationFee: parseFloat(form.consultationFee) || 0.0
      });
      localStorage.setItem('providerId', providerObj.providerId);
      localStorage.removeItem('pendingSpecialization');
      toast.success('Profile created! Waiting for admin verification.');
      navigate('/provider/appointments');
    } catch (err) {
      toast.error(err.response?.data || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#f0f4f8', padding: '2rem 1rem'
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '16px',
        padding: '2.5rem', width: '100%', maxWidth: '540px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>👨‍⚕️</div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
            Complete Your Profile
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px' }}>
            Fill in your professional details. An admin will verify your profile before you can accept appointments.
          </p>
        </div>

        {/* Info box */}
        <div style={{
          backgroundColor: '#fef9c3', border: '1px solid #fde68a',
          borderRadius: '8px', padding: '12px 14px',
          fontSize: '13px', color: '#92400e', marginBottom: '1.5rem'
        }}>
          ⏳ After submitting, your profile will be reviewed by an admin. You will be able to manage slots and appointments once verified.
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Specialization *</label>
            <select
              name="specialization"
              value={form.specialization}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">-- Select Specialization --</option>
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
              placeholder="e.g. MBBS, MD, MS"
              value={form.qualification}
              onChange={handleChange}
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Consultation Fee (₹) *</label>
            <input
              type="number"
              name="consultationFee"
              placeholder="e.g. 500"
              value={form.consultationFee}
              onChange={handleChange}
              min="0"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Bio (optional)</label>
            <textarea
              name="bio"
              rows={3}
              placeholder="Brief description about yourself..."
              value={form.bio}
              onChange={handleChange}
              disabled={loading}
              style={{
                width: '100%', padding: '10px 12px',
                border: '1px solid #cbd5e1', borderRadius: '8px',
                fontSize: '14px', outline: 'none', resize: 'vertical'
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '15px' }}
            disabled={loading}
          >
            {loading ? 'Submitting...' : '✅ Submit Profile for Verification'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProviderSetup;
