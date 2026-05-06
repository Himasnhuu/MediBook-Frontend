import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getAllProviders, verifyProvider, approveProfileUpdate, rejectProfileUpdate } from '../../api/providerApi';
import axiosInstance from '../../api/axiosInstance';

const ManageProviders = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterVerified, setFilterVerified] = useState('ALL');
  const [verifyingId, setVerifyingId] = useState(null);
  const [actioningUpdateId, setActioningUpdateId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState('');
  const [viewProvider, setViewProvider] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showChangesModal, setShowChangesModal] = useState(null);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const data = await getAllProviders();
      setProviders(data);
    } catch (err) {
      toast.error('Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (providerId) => {
    if (!window.confirm('Verify this provider?')) return;
    setVerifyingId(providerId);
    try {
      await verifyProvider(providerId);
      toast.success('Provider verified successfully');
      fetchProviders();
    } catch (err) {
      toast.error('Failed to verify provider');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleApproveUpdate = async (providerId) => {
    setActioningUpdateId(providerId);
    try {
      await approveProfileUpdate(providerId);
      toast.success('Profile update approved!');
      fetchProviders();
    } catch (err) {
      toast.error('Failed to approve update');
    } finally {
      setActioningUpdateId(null);
    }
  };

  const handleRejectUpdate = async (providerId) => {
    if (!window.confirm('Reject this profile update?')) return;
    setActioningUpdateId(providerId);
    try {
      await rejectProfileUpdate(providerId);
      toast.success('Profile update rejected');
      fetchProviders();
    } catch (err) {
      toast.error('Failed to reject update');
    } finally {
      setActioningUpdateId(null);
    }
  };

  const handleDelete = async (providerId) => {
    if (!window.confirm('Delete this provider? This cannot be undone.')) return;
    setDeletingId(providerId);
    try {
      await axiosInstance.delete(`/providers/${providerId}`);
      toast.success('Provider deleted successfully');
      fetchProviders();
    } catch (err) {
      toast.error('Failed to delete provider');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = providers.filter(p => {
    const verifiedMatch =
      filterVerified === 'ALL' ? true :
      filterVerified === 'VERIFIED' ? p.isVerified :
      !p.isVerified;

    const searchMatch = search.trim() === '' ? true :
      p.specialization?.toLowerCase().includes(search.toLowerCase()) ||
      p.clinicName?.toLowerCase().includes(search.toLowerCase()) ||
      p.qualification?.toLowerCase().includes(search.toLowerCase()) ||
      String(p.providerId).includes(search);

    return verifiedMatch && searchMatch;
  });

  const pendingCount      = providers.filter(p => !p.isVerified).length;
  const verifiedCount     = providers.filter(p => p.isVerified).length;
  const pendingUpdateCount = providers.filter(p => p.hasPendingChanges).length;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
          Manage Providers
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
          Verify and manage healthcare providers on the platform
        </p>
      </div>

      {/* Summary cards */}
      {!loading && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '1rem', marginBottom: '1.5rem'
        }}>
          {[
            { label: 'Total',           value: providers.length,  color: '#1e293b', bg: '#f8fafc', border: '#e2e8f0' },
            { label: 'Verified',        value: verifiedCount,     color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
            { label: 'Pending Verify',  value: pendingCount,      color: '#d97706', bg: '#fefce8', border: '#fde68a' },
            { label: 'Pending Updates', value: pendingUpdateCount, color: '#7c3aed', bg: '#faf5ff', border: '#ddd6fe' },
          ].map(stat => (
            <div key={stat.label} className="card" style={{
              backgroundColor: stat.bg, border: `1px solid ${stat.border}`,
              textAlign: 'center', padding: '1rem'
            }}>
              <p style={{ fontSize: '28px', fontWeight: '800', color: stat.color }}>
                {stat.value}
              </p>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Pending alerts */}
      {pendingCount > 0 && (
        <div style={{
          backgroundColor: '#fefce8', border: '1px solid #fde68a',
          borderRadius: '8px', padding: '12px 16px',
          marginBottom: '8px', fontSize: '14px', color: '#92400e',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          ⚠️ <strong>{pendingCount} provider(s)</strong> are waiting for verification
        </div>
      )}
      {pendingUpdateCount > 0 && (
        <div style={{
          backgroundColor: '#faf5ff', border: '1px solid #ddd6fe',
          borderRadius: '8px', padding: '12px 16px',
          marginBottom: '1.5rem', fontSize: '14px', color: '#6d28d9',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          🔄 <strong>{pendingUpdateCount} provider(s)</strong> have profile updates awaiting approval
        </div>
      )}

      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by specialization, clinic, qualification..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: '240px', padding: '10px 14px',
            border: '1px solid #cbd5e1', borderRadius: '8px',
            fontSize: '14px', outline: 'none'
          }}
        />
        {['ALL', 'VERIFIED', 'PENDING'].map(f => (
          <button
            key={f}
            onClick={() => setFilterVerified(f)}
            className="btn"
            style={{
              backgroundColor: filterVerified === f ? '#4338ca' : '#f1f5f9',
              color: filterVerified === f ? 'white' : '#64748b',
              padding: '10px 16px', fontSize: '13px'
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          Loading providers...
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '3rem',
          backgroundColor: 'white', borderRadius: '12px', color: '#64748b'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>👨‍⚕️</div>
          <p style={{ fontSize: '16px', fontWeight: '600' }}>No providers found</p>
        </div>
      )}

      {/* Providers table */}
      {!loading && filtered.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>User ID</th>
                <th>Specialization</th>
                <th>Qualification</th>
                <th>Experience</th>
                <th>Clinic</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(provider => (
                <tr key={provider.providerId}>
                  <td>#{provider.providerId}</td>
                  <td>#{provider.userId}</td>
                  <td style={{ fontWeight: '600', color: '#2563eb' }}>
                    {provider.specialization || '—'}
                  </td>
                  <td>{provider.qualification || '—'}</td>
                  <td>{provider.experienceYears || 0} yrs</td>
                  <td style={{ fontSize: '13px' }}>{provider.clinicName || '—'}</td>
                  <td>⭐ {provider.avgRating?.toFixed(1) || '0.0'}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span className={`badge ${provider.isVerified ? 'badge-success' : 'badge-warning'}`}>
                        {provider.isVerified ? '✓ Verified' : '⏳ Pending'}
                      </span>
                      {provider.hasPendingChanges && (
                        <span className="badge badge-warning">
                          🔄 Update Pending
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => { setViewProvider(provider); setShowViewModal(true); }}
                        style={{
                          padding: '6px 14px', fontSize: '12px', fontWeight: '600',
                          backgroundColor: '#E8F4F4', color: '#2D6B6B',
                          border: '1px solid #2D6B6B', borderRadius: '6px',
                          cursor: 'pointer', fontFamily: 'inherit'
                        }}
                      >
                        👁 View
                      </button>
                      {!provider.isVerified && !provider.hasPendingChanges && (
                        <button
                          className="btn btn-success"
                          style={{ padding: '6px 10px', fontSize: '11px' }}
                          onClick={() => handleVerify(provider.providerId)}
                          disabled={verifyingId === provider.providerId}
                        >
                          {verifyingId === provider.providerId ? '...' : '✓ Verify'}
                        </button>
                      )}
                      {provider.hasPendingChanges && (
                        <>
                          <button
                            onClick={() => setShowChangesModal(provider)}
                            style={{
                              padding: '6px 14px', fontSize: '12px', fontWeight: '600',
                              backgroundColor: '#FFF8E8', color: '#C9963F',
                              border: '1px solid #C9963F', borderRadius: '6px',
                              cursor: 'pointer', fontFamily: 'inherit'
                            }}
                          >
                            📋 See Changes
                          </button>
                          <button
                            className="btn btn-success"
                            style={{ padding: '6px 10px', fontSize: '11px' }}
                            onClick={() => handleApproveUpdate(provider.providerId)}
                            disabled={actioningUpdateId === provider.providerId}
                          >
                            ✓ Approve
                          </button>
                          <button
                            className="btn btn-warning"
                            style={{ padding: '6px 10px', fontSize: '11px' }}
                            onClick={() => handleRejectUpdate(provider.providerId)}
                            disabled={actioningUpdateId === provider.providerId}
                          >
                            ✕ Reject
                          </button>
                        </>
                      )}
                      {provider.isVerified && !provider.hasPendingChanges && (
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Verified ✓</span>
                      )}
                      {!provider.isVerified && !provider.hasPendingChanges && (
                        <button
                          className="btn btn-danger"
                          style={{ padding: '6px 10px', fontSize: '11px' }}
                          onClick={() => handleDelete(provider.providerId)}
                          disabled={deletingId === provider.providerId}
                        >
                          {deletingId === provider.providerId ? '...' : '🗑️'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* ── VIEW PROVIDER PROFILE MODAL ── */}
      {showViewModal && viewProvider && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(26,21,17,0.6)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000,
          padding: '1rem', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#FAF7F2', borderRadius: '20px',
            width: '100%', maxWidth: '600px',
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 16px 48px rgba(26,21,17,0.3)'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1F4E4E, #2D6B6B)',
              padding: '1.5rem 2rem', borderRadius: '20px 20px 0 0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '60px', height: '60px', borderRadius: '50%',
                  overflow: 'hidden', border: '2px solid rgba(255,255,255,0.3)',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {viewProvider.profilePhotoUrl ? (
                    <img src={viewProvider.profilePhotoUrl} alt="Provider"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  )}
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'white', marginBottom: '3px' }}>
                    Dr. {viewProvider.doctorName || `Provider #${viewProvider.providerId}`}
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
                    {viewProvider.specialization} · Provider #{viewProvider.providerId}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowViewModal(false)} style={{
                background: 'rgba(255,255,255,0.15)', border: 'none',
                borderRadius: '8px', width: '34px', height: '34px',
                color: 'white', fontSize: '16px', cursor: 'pointer'
              }}>✕</button>
            </div>

            <div style={{ padding: '1.5rem 2rem' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
                  backgroundColor: viewProvider.isVerified ? '#EBF5EF' : '#FFF8E8',
                  color: viewProvider.isVerified ? '#3D7A5A' : '#C9963F',
                  border: `1px solid ${viewProvider.isVerified ? '#3D7A5A' : '#C9963F'}`
                }}>
                  {viewProvider.isVerified ? '✓ Verified' : '⏳ Pending Verification'}
                </span>
                <span style={{
                  padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
                  backgroundColor: viewProvider.isAvailable ? '#EBF5EF' : '#FEE2E2',
                  color: viewProvider.isAvailable ? '#3D7A5A' : '#DC2626',
                  border: `1px solid ${viewProvider.isAvailable ? '#3D7A5A' : '#DC2626'}`
                }}>
                  {viewProvider.isAvailable ? '🟢 Available' : '🔴 Unavailable'}
                </span>
                {viewProvider.hasPendingChanges && (
                  <span style={{
                    padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
                    backgroundColor: '#EEF2FF', color: '#4338CA', border: '1px solid #4338CA'
                  }}>
                    📋 Update Pending
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'PROVIDER ID',      value: `#${viewProvider.providerId}` },
                  { label: 'USER ID',           value: `#${viewProvider.userId}` },
                  { label: 'QUALIFICATION',     value: viewProvider.qualification || '—' },
                  { label: 'EXPERIENCE',        value: `${viewProvider.experienceYears || 0} years` },
                  { label: 'CLINIC',            value: viewProvider.clinicName || '—' },
                  { label: 'LOCATION',          value: viewProvider.clinicAddress || '—' },
                  { label: 'CONSULTATION FEE', value: `₹${viewProvider.consultationFee || 0}` },
                  { label: 'RATING',            value: `⭐ ${(viewProvider.avgRating || 0).toFixed(1)} / 5.0` },
                ].map((item, i) => (
                  <div key={i} style={{
                    backgroundColor: 'white', borderRadius: '10px',
                    padding: '0.8rem 1rem', border: '1px solid #E2D9CE'
                  }}>
                    <p style={{ fontSize: '10px', color: '#8C7E72', fontWeight: '700', letterSpacing: '1px', marginBottom: '4px' }}>
                      {item.label}
                    </p>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#2C2825' }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {viewProvider.bio && (
                <div style={{
                  backgroundColor: 'white', borderRadius: '10px',
                  padding: '1rem', border: '1px solid #E2D9CE', marginBottom: '1rem'
                }}>
                  <p style={{ fontSize: '10px', color: '#8C7E72', fontWeight: '700', letterSpacing: '1px', marginBottom: '6px' }}>BIO</p>
                  <p style={{ fontSize: '14px', color: '#5C524A', lineHeight: '1.7' }}>{viewProvider.bio}</p>
                </div>
              )}

              {viewProvider.hasPendingChanges && (
                <div style={{
                  backgroundColor: '#FFF8E8', border: '1px solid #C9963F',
                  borderRadius: '10px', padding: '1rem', marginBottom: '1rem'
                }}>
                  <p style={{ fontSize: '13px', color: '#A67830', fontWeight: '600' }}>
                    ⚠️ This provider has pending profile changes awaiting your approval.
                  </p>
                  <button
                    onClick={() => { setShowViewModal(false); setShowChangesModal(viewProvider); }}
                    style={{
                      marginTop: '8px', padding: '7px 16px', fontSize: '12px',
                      fontWeight: '700', backgroundColor: '#C9963F', color: 'white',
                      border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit'
                    }}
                  >
                    View Requested Changes →
                  </button>
                </div>
              )}

              <button onClick={() => setShowViewModal(false)} style={{
                width: '100%', padding: '12px', fontSize: '14px', fontWeight: '600',
                backgroundColor: '#F2EDE4', color: '#5C524A',
                border: '1px solid #E2D9CE', borderRadius: '10px',
                cursor: 'pointer', fontFamily: 'inherit'
              }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SEE PENDING CHANGES MODAL ── */}
      {showChangesModal && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(26,21,17,0.6)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1001,
          padding: '1rem', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#FAF7F2', borderRadius: '20px',
            width: '100%', maxWidth: '620px',
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 16px 48px rgba(26,21,17,0.3)'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #92400e, #C9963F)',
              padding: '1.5rem 2rem', borderRadius: '20px 20px 0 0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'white', marginBottom: '3px' }}>
                  Pending Profile Changes
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px' }}>
                  Dr. {showChangesModal.doctorName} is requesting these updates
                </p>
              </div>
              <button onClick={() => setShowChangesModal(null)} style={{
                background: 'rgba(255,255,255,0.15)', border: 'none',
                borderRadius: '8px', width: '34px', height: '34px',
                color: 'white', fontSize: '16px', cursor: 'pointer'
              }}>✕</button>
            </div>

            <div style={{ padding: '1.5rem 2rem' }}>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#FEE2E2' }} />
                  <span style={{ fontSize: '12px', color: '#8C7E72' }}>Current value</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#DCFCE7' }} />
                  <span style={{ fontSize: '12px', color: '#8C7E72' }}>Requested change</span>
                </div>
              </div>

              <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E2D9CE', marginBottom: '1.5rem' }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr',
                  backgroundColor: '#F2EDE4', padding: '10px 16px',
                  borderBottom: '1px solid #E2D9CE'
                }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#5C524A', letterSpacing: '1px' }}>FIELD</span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#DC2626', letterSpacing: '1px' }}>CURRENT</span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#16A34A', letterSpacing: '1px' }}>REQUESTED</span>
                </div>

                {[
                  { field: 'Specialization', current: showChangesModal.specialization,   pending: showChangesModal.pendingSpecialization },
                  { field: 'Qualification',  current: showChangesModal.qualification,    pending: showChangesModal.pendingQualification },
                  { field: 'Experience',
                    current: `${showChangesModal.experienceYears || 0} years`,
                    pending: showChangesModal.pendingExperienceYears != null ? `${showChangesModal.pendingExperienceYears} years` : null },
                  { field: 'Clinic Name',    current: showChangesModal.clinicName,       pending: showChangesModal.pendingClinicName },
                  { field: 'Clinic Address', current: showChangesModal.clinicAddress,    pending: showChangesModal.pendingClinicAddress },
                  { field: 'Consultation Fee',
                    current: `₹${showChangesModal.consultationFee || 0}`,
                    pending: showChangesModal.pendingConsultationFee != null ? `₹${showChangesModal.pendingConsultationFee}` : null },
                  { field: 'Bio',            current: showChangesModal.bio || '—',       pending: showChangesModal.pendingBio },
                ].map((row, i, arr) => {
                  const hasChange = row.pending !== null && row.pending !== undefined && row.pending !== row.current;
                  return (
                    <div key={i} style={{
                      display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr',
                      padding: '12px 16px',
                      borderBottom: i < arr.length - 1 ? '1px solid #F2EDE4' : 'none',
                      backgroundColor: hasChange ? '#FFFBF0' : 'white'
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#5C524A' }}>
                        {row.field}
                        {hasChange && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#C9963F' }}>●</span>}
                      </span>
                      <span style={{
                        fontSize: '13px', color: hasChange ? '#DC2626' : '#5C524A',
                        backgroundColor: hasChange ? '#FEE2E2' : 'transparent',
                        padding: hasChange ? '2px 8px' : '0', borderRadius: '4px',
                        display: 'inline-block',
                        textDecoration: hasChange ? 'line-through' : 'none',
                        opacity: hasChange ? 0.8 : 1
                      }}>
                        {row.current || '—'}
                      </span>
                      <span style={{
                        fontSize: '13px', color: hasChange ? '#16A34A' : '#8C7E72',
                        backgroundColor: hasChange ? '#DCFCE7' : 'transparent',
                        padding: hasChange ? '2px 8px' : '0', borderRadius: '4px',
                        display: 'inline-block', fontWeight: hasChange ? '700' : '400'
                      }}>
                        {row.pending || '—'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {showChangesModal.pendingProfilePhotoUrl && (
                <div style={{
                  backgroundColor: 'white', borderRadius: '12px',
                  padding: '1rem', border: '1px solid #E2D9CE', marginBottom: '1.5rem'
                }}>
                  <p style={{ fontSize: '11px', color: '#8C7E72', fontWeight: '700', letterSpacing: '1px', marginBottom: '12px' }}>
                    PROFILE PHOTO CHANGE
                  </p>
                  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '11px', color: '#DC2626', fontWeight: '600', marginBottom: '6px' }}>CURRENT</p>
                      <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #E2D9CE', backgroundColor: '#E8F4F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {showChangesModal.profilePhotoUrl ? (
                          <img src={showChangesModal.profilePhotoUrl} alt="Current" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8C7E72" strokeWidth="1.5">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </svg>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: '20px', color: '#C9963F' }}>→</div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '11px', color: '#16A34A', fontWeight: '600', marginBottom: '6px' }}>REQUESTED</p>
                      <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #16A34A' }}>
                        <img src={showChangesModal.pendingProfilePhotoUrl} alt="Pending" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowChangesModal(null)} style={{
                  flex: 1, padding: '12px', fontSize: '14px', fontWeight: '600',
                  backgroundColor: '#F2EDE4', color: '#5C524A',
                  border: '1px solid #E2D9CE', borderRadius: '10px',
                  cursor: 'pointer', fontFamily: 'inherit'
                }}>
                  Close
                </button>
                <button onClick={async () => { await handleRejectUpdate(showChangesModal.providerId); setShowChangesModal(null); }} style={{
                  flex: 1, padding: '12px', fontSize: '14px', fontWeight: '700',
                  backgroundColor: '#FEE2E2', color: '#DC2626',
                  border: '1px solid #DC2626', borderRadius: '10px',
                  cursor: 'pointer', fontFamily: 'inherit'
                }}>
                  ✕ Reject Changes
                </button>
                <button onClick={async () => { await handleApproveUpdate(showChangesModal.providerId); setShowChangesModal(null); }} style={{
                  flex: 1, padding: '12px', fontSize: '14px', fontWeight: '700',
                  backgroundColor: '#2D6B6B', color: 'white',
                  border: 'none', borderRadius: '10px',
                  cursor: 'pointer', fontFamily: 'inherit'
                }}>
                  ✓ Approve Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageProviders;
