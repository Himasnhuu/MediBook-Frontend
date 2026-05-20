import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getAppointmentsByProvider, completeAppointment } from '../../api/appointmentApi';
import { createRecord, getRecordsByProvider } from '../../api/medicalRecordApi';
import { sendAppointmentCompletedNotification } from '../../api/notificationApi';
import { getAllUsers } from '../../api/authApi';

const ProviderAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [completingId, setCompletingId] = useState(null);

  const [showRecordForm, setShowRecordForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [recordForm, setRecordForm] = useState({
    diagnosis: '',
    prescription: '',
    notes: '',
    followUpDate: ''
  });
  const [savingRecord, setSavingRecord] = useState(false);
  const [recordsMap, setRecordsMap] = useState({});
  const [viewingRecord, setViewingRecord] = useState(null);
  const [patientsMap, setPatientsMap] = useState({});
  const [searchPatient, setSearchPatient] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterMode, setFilterMode] = useState('ALL');

  const providerId = localStorage.getItem('providerId');

  useEffect(() => {
    fetchAppointments();
    fetchRecords();
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const data = await getAllUsers();
      const map = {};
      data.forEach(u => { map[u.id] = u; });
      setPatientsMap(map);
    } catch (err) {}
  };

  const fetchRecords = async () => {
    try {
      const records = await getRecordsByProvider(providerId);
      const map = {};
      records.forEach(r => { map[r.appointmentId] = r; });
      setRecordsMap(map);
    } catch (err) {
      console.error('Failed to load records');
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const data = await getAppointmentsByProvider(providerId);
      setAppointments(data);
    } catch (err) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (appointmentId) => {
    if (!window.confirm('Mark this appointment as completed?')) return;
    setCompletingId(appointmentId);
    try {
      await completeAppointment(appointmentId);
      await sendAppointmentCompletedNotification({
        userId: String(appointments.find(a => a.appointmentId === appointmentId)?.patientId),
        recipientEmail: localStorage.getItem('email'),
        appointmentId: String(appointmentId),
        doctorName: `Dr. ${localStorage.getItem('fullName') || 'Doctor'}`
      });
      toast.success('Appointment marked as completed');
      fetchAppointments();
    } catch (err) {
      toast.error('Failed to complete appointment');
    } finally {
      setCompletingId(null);
    }
  };

  const openRecordForm = (appointment) => {
    setSelectedAppointment(appointment);
    setRecordForm({ diagnosis: '', prescription: '', notes: '', followUpDate: '' });
    setShowRecordForm(true);
  };

  const handleSaveRecord = async () => {
    if (!recordForm.diagnosis) {
      toast.error('Diagnosis is required');
      return;
    }
    setSavingRecord(true);
    try {
      const saved = await createRecord({
        appointmentId: selectedAppointment.appointmentId,
        patientId: selectedAppointment.patientId,
        providerId: parseInt(providerId),
        diagnosis: recordForm.diagnosis,
        prescription: recordForm.prescription,
        notes: recordForm.notes,
        followUpDate: recordForm.followUpDate || null
      });
      setRecordsMap(prev => ({ ...prev, [selectedAppointment.appointmentId]: saved }));
      toast.success('Medical record saved successfully');
      setShowRecordForm(false);
      setSelectedAppointment(null);
    } catch (err) {
      toast.error(err.response?.data || 'Failed to save record');
    } finally {
      setSavingRecord(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      SCHEDULED: 'badge-warning',
      COMPLETED: 'badge-success',
      CANCELLED: 'badge-danger',
      NO_SHOW:   'badge-danger'
    };
    return map[status] || 'badge-info';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const fmtTime = (t) => t?.slice(0, 5) || '';

  const FILTERS = ['ALL', 'SCHEDULED', 'COMPLETED', 'CANCELLED'];

  const STATUS_ORDER = { SCHEDULED: 0, COMPLETED: 1, CANCELLED: 2, NO_SHOW: 2 };

  const filtered = appointments
    .filter(a => filter === 'ALL' || a.status === filter)
    .filter(a => {
      if (!searchPatient) return true;
      const name = patientsMap[a.patientId]?.fullName?.toLowerCase() || '';
      return name.includes(searchPatient.toLowerCase());
    })
    .filter(a => !filterDate || a.appointmentDate === filterDate)
    .filter(a => filterMode === 'ALL' || a.modeOfConsultation === filterMode)
    .sort((a, b) => {
      const so = (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3);
      if (so !== 0) return so;
      const da = new Date(`${a.appointmentDate}T${a.startTime}`);
      const db = new Date(`${b.appointmentDate}T${b.startTime}`);
      return a.status === 'SCHEDULED' ? da - db : db - da;
    });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#2C2825' }}>
          My Appointments
        </h2>
        <p style={{ color: '#8C7E72', fontSize: '14px', marginTop: '4px' }}>
          Complete appointments and create medical records
        </p>
      </div>

      {/* Summary counts */}
      {!loading && appointments.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '1rem', marginBottom: '1.5rem'
        }}>
          {[
            { label: 'Total',     value: appointments.length,                                        color: '#2C2825', bg: '#FFFFFF',  border: '#E2D9CE' },
            { label: 'Scheduled', value: appointments.filter(a => a.status === 'SCHEDULED').length,  color: '#2D6B6B', bg: '#E8F4F4',  border: '#B8DADA' },
            { label: 'Completed', value: appointments.filter(a => a.status === 'COMPLETED').length,  color: '#3D7A5A', bg: '#EBF5EF',  border: '#B8D8C6' },
            { label: 'Cancelled', value: appointments.filter(a => a.status === 'CANCELLED').length,  color: '#A04040', bg: '#FBF0F0',  border: '#E8C4C4' },
          ].map(stat => (
            <div key={stat.label} className="card" style={{
              backgroundColor: stat.bg, border: `1px solid ${stat.border}`,
              textAlign: 'center', padding: '1rem'
            }}>
              <p style={{ fontSize: '28px', fontWeight: '800', color: stat.color }}>
                {stat.value}
              </p>
              <p style={{ fontSize: '12px', color: '#8C7E72', marginTop: '4px', fontWeight: '500' }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs + search */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="btn"
            style={{
              backgroundColor: filter === f ? '#2D6B6B' : '#F2EDE4',
              color: filter === f ? 'white' : '#8C7E72',
              padding: '8px 16px', fontSize: '13px',
              border: filter === f ? 'none' : '1px solid #E2D9CE'
            }}
          >
            {f}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search patient..."
          value={searchPatient}
          onChange={e => setSearchPatient(e.target.value)}
          style={{
            padding: '8px 12px', fontSize: '13px', borderRadius: '8px',
            border: '1.5px solid #E2D9CE', outline: 'none', flex: '1', minWidth: '160px',
            backgroundColor: 'white', color: '#2C2825', fontFamily: 'inherit'
          }}
        />
        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          style={{
            padding: '8px 12px', fontSize: '13px', borderRadius: '8px',
            border: '1.5px solid #E2D9CE', outline: 'none',
            backgroundColor: 'white', color: '#2C2825', fontFamily: 'inherit'
          }}
        />
        <select
          value={filterMode}
          onChange={e => setFilterMode(e.target.value)}
          style={{
            padding: '8px 12px', fontSize: '13px', borderRadius: '8px',
            border: '1.5px solid #E2D9CE', outline: 'none',
            backgroundColor: 'white', color: '#2C2825', fontFamily: 'inherit'
          }}
        >
          <option value="ALL">All Modes</option>
          <option value="IN_PERSON">In Person</option>
          <option value="TELECONSULTATION">Teleconsultation</option>
        </select>
        {(searchPatient || filterDate || filterMode !== 'ALL') && (
          <button className="btn" onClick={() => { setSearchPatient(''); setFilterDate(''); setFilterMode('ALL'); }}
            style={{ padding: '8px 14px', fontSize: '13px', backgroundColor: '#FBF0F0', color: '#A04040', border: '1px solid #E8C4C4' }}>
            Clear
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#8C7E72' }}>
          Loading appointments...
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '3rem',
          backgroundColor: 'white', borderRadius: '12px',
          color: '#8C7E72', border: '1px solid #E2D9CE'
        }}>
          <p style={{ fontSize: '16px', fontWeight: '600', color: '#2C2825' }}>
            No {filter !== 'ALL' ? filter.toLowerCase() : ''} appointments found
          </p>
        </div>
      )}

      {/* Appointments table */}
      {!loading && filtered.length > 0 && (
        <div className="table-wrap">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--warm-bg-2)' }}>Sr. No.</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--warm-bg-2)' }}>Patient</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--warm-bg-2)' }}>Appt. Date</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--warm-bg-2)' }}>Symptoms</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--warm-bg-2)' }}>Mode</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--warm-bg-2)' }}>Status</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--warm-bg-2)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((appt, idx) => (
                <tr key={appt.appointmentId}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8F5F0'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                  <td style={{ color: '#8C7E72', fontSize: '13px' }}>{idx + 1}</td>
                  <td style={{ fontWeight: '600', color: '#2C2825' }}>
                    {patientsMap[appt.patientId]?.fullName || `#${appt.patientId}`}
                  </td>
                  <td>
                    <p style={{ fontWeight: '600', color: '#2C2825', fontSize: '13px', margin: 0 }}>
                      {formatDate(appt.appointmentDate)}
                    </p>
                    <p style={{ color: '#8C7E72', fontSize: '12px', margin: 0 }}>
                      {fmtTime(appt.startTime)} – {fmtTime(appt.endTime)}
                    </p>
                  </td>
                  <td style={{ color: '#5C524A', fontSize: '13px' }}>{appt.serviceType}</td>
                  <td style={{ fontSize: '13px', color: '#5C524A' }}>
                    {appt.modeOfConsultation === 'IN_PERSON' ? 'In Person' : 'Teleconsultation'}
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadge(appt.status)}`}>
                      {appt.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {appt.status === 'SCHEDULED' && (
                        <button
                          className="btn btn-success"
                          style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '600' }}
                          onClick={() => handleComplete(appt.appointmentId)}
                          disabled={completingId === appt.appointmentId}
                        >
                          {completingId === appt.appointmentId ? 'Completing...' : 'Complete'}
                        </button>
                      )}
                      {appt.status === 'COMPLETED' && (
                        recordsMap[appt.appointmentId] ? (
                          <button
                            className="btn"
                            style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '600',
                              backgroundColor: '#EBF5EF', color: '#3D7A5A', border: '1px solid #B8D8C6' }}
                            onClick={() => setViewingRecord(recordsMap[appt.appointmentId])}
                          >
                            View Record
                          </button>
                        ) : (
                          <button
                            className="btn btn-primary"
                            style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '600' }}
                            onClick={() => openRecordForm(appt)}
                          >
                            Add Record
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {/* ── Medical Record Modal ── */}
      {showRecordForm && selectedAppointment && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(26,21,17,0.6)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000,
          padding: '1rem', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#FAF7F2', borderRadius: '20px',
            width: '100%', maxWidth: '540px',
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 16px 48px rgba(26,21,17,0.3)'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1F4E4E, #2D6B6B)',
              padding: '1.5rem 2rem', borderRadius: '20px 20px 0 0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'white', marginBottom: '2px' }}>
                  Add Medical Record
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
                  Appointment #{selectedAppointment.appointmentId} — Patient #{selectedAppointment.patientId}
                </p>
              </div>
              <button
                onClick={() => setShowRecordForm(false)}
                style={{
                  background: 'rgba(255,255,255,0.15)', border: 'none',
                  borderRadius: '8px', width: '34px', height: '34px',
                  color: 'white', fontSize: '16px', cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.5rem 2rem' }}>
              <div className="form-group">
                <label>Diagnosis *</label>
                <input
                  type="text"
                  placeholder="e.g. Viral fever, Hypertension"
                  value={recordForm.diagnosis}
                  onChange={e => setRecordForm({ ...recordForm, diagnosis: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Prescription</label>
                <textarea
                  rows={4}
                  placeholder="List medications, dosage, frequency..."
                  value={recordForm.prescription}
                  onChange={e => setRecordForm({ ...recordForm, prescription: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  rows={3}
                  placeholder="Additional observations or instructions..."
                  value={recordForm.notes}
                  onChange={e => setRecordForm({ ...recordForm, notes: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Follow-up Date (optional)</label>
                <input
                  type="date"
                  value={recordForm.followUpDate}
                  onChange={e => setRecordForm({ ...recordForm, followUpDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '12px' }}
                  onClick={handleSaveRecord}
                  disabled={savingRecord}
                >
                  {savingRecord ? 'Saving...' : 'Save Record'}
                </button>
                <button
                  className="btn"
                  style={{
                    flex: 1, padding: '12px',
                    backgroundColor: '#F2EDE4', color: '#8C7E72',
                    border: '1px solid #E2D9CE'
                  }}
                  onClick={() => setShowRecordForm(false)}
                  disabled={savingRecord}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── View Record Modal ── */}
      {viewingRecord && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(26,21,17,0.6)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000,
          padding: '1rem', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#FAF7F2', borderRadius: '20px',
            width: '100%', maxWidth: '540px',
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 16px 48px rgba(26,21,17,0.3)'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1F4E4E, #2D6B6B)',
              padding: '1.5rem 2rem', borderRadius: '20px 20px 0 0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'white', marginBottom: '2px' }}>
                  Medical Record
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
                  Appointment #{viewingRecord.appointmentId} — Patient #{viewingRecord.patientId}
                </p>
              </div>
              <button
                onClick={() => setViewingRecord(null)}
                style={{
                  background: 'rgba(255,255,255,0.15)', border: 'none',
                  borderRadius: '8px', width: '34px', height: '34px',
                  color: 'white', fontSize: '16px', cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '1.5rem 2rem' }}>
              {[
                { label: 'Diagnosis',     value: viewingRecord.diagnosis },
                { label: 'Prescription',  value: viewingRecord.prescription },
                { label: 'Notes',         value: viewingRecord.notes },
                { label: 'Follow-up Date', value: viewingRecord.followUpDate ? formatDate(viewingRecord.followUpDate) : 'None' },
              ].map(({ label, value }) => (
                <div key={label} style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: '#8C7E72',
                    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    {label}
                  </p>
                  <div style={{
                    backgroundColor: 'white', border: '1px solid #E2D9CE',
                    borderRadius: '8px', padding: '10px 14px',
                    fontSize: '14px', color: '#2C2825', minHeight: '40px',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {value || '—'}
                  </div>
                </div>
              ))}
              <button
                className="btn"
                onClick={() => setViewingRecord(null)}
                style={{
                  width: '100%', padding: '12px', marginTop: '0.5rem',
                  backgroundColor: '#F2EDE4', color: '#8C7E72', border: '1px solid #E2D9CE'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderAppointments;
