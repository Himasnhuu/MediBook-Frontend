import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getAppointmentsByProvider, completeAppointment } from '../../api/appointmentApi';
import { createRecord, getRecordsByProvider } from '../../api/medicalRecordApi';
import { sendAppointmentCompletedNotification } from '../../api/notificationApi';

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

  const providerId = localStorage.getItem('providerId');

  useEffect(() => {
    fetchAppointments();
    fetchRecords();
  }, []);

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
      SCHEDULED: 'badge-info',
      COMPLETED: 'badge-success',
      CANCELLED: 'badge-danger',
      NO_SHOW:   'badge-warning'
    };
    return map[status] || 'badge-info';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const FILTERS = ['ALL', 'SCHEDULED', 'COMPLETED', 'CANCELLED'];

  const filtered = filter === 'ALL'
    ? appointments
    : appointments.filter(a => a.status === filter);

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

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
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
                <th>ID</th>
                <th>Patient ID</th>
                <th>Date</th>
                <th>Time</th>
                <th>Service</th>
                <th>Mode</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(appt => (
                <tr key={appt.appointmentId}>
                  <td>#{appt.appointmentId}</td>
                  <td>#{appt.patientId}</td>
                  <td>{formatDate(appt.appointmentDate)}</td>
                  <td style={{ fontSize: '13px' }}>
                    {appt.startTime} - {appt.endTime}
                  </td>
                  <td>{appt.serviceType}</td>
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
