import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getAppointmentsByProvider, completeAppointment } from '../../api/appointmentApi';
import { createRecord } from '../../api/medicalRecordApi';
import { sendAppointmentCompletedNotification } from '../../api/notificationApi';

const ProviderAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [completingId, setCompletingId] = useState(null);

  // Medical record form
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [recordForm, setRecordForm] = useState({
    diagnosis: '',
    prescription: '',
    notes: '',
    followUpDate: ''
  });
  const [savingRecord, setSavingRecord] = useState(false);

  const providerId = localStorage.getItem('providerId');

  useEffect(() => {
    fetchAppointments();
  }, []);

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
      await createRecord({
        appointmentId: selectedAppointment.appointmentId,
        patientId: selectedAppointment.patientId,
        providerId: parseInt(providerId),
        diagnosis: recordForm.diagnosis,
        prescription: recordForm.prescription,
        notes: recordForm.notes,
        followUpDate: recordForm.followUpDate || null
      });
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
      SCHEDULED:  'badge-info',
      COMPLETED:  'badge-success',
      CANCELLED:  'badge-danger',
      NO_SHOW:    'badge-warning'
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
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
          My Appointments
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
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
            { label: 'Total',     value: appointments.length,                                        color: '#1e293b', bg: '#f8fafc', border: '#e2e8f0' },
            { label: 'Scheduled', value: appointments.filter(a => a.status === 'SCHEDULED').length, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
            { label: 'Completed', value: appointments.filter(a => a.status === 'COMPLETED').length, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
            { label: 'Cancelled', value: appointments.filter(a => a.status === 'CANCELLED').length, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
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

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="btn"
            style={{
              backgroundColor: filter === f ? '#0f766e' : '#f1f5f9',
              color: filter === f ? 'white' : '#64748b',
              padding: '8px 16px', fontSize: '13px'
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          Loading appointments...
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '3rem',
          backgroundColor: 'white', borderRadius: '12px',
          color: '#64748b'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📅</div>
          <p style={{ fontSize: '16px', fontWeight: '600' }}>
            No {filter !== 'ALL' ? filter.toLowerCase() : ''} appointments found
          </p>
        </div>
      )}

      {/* Appointments table */}
      {!loading && filtered.length > 0 && (
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
                  <td>
                    <span style={{ fontSize: '12px' }}>
                      {appt.modeOfConsultation === 'IN_PERSON' ? '🏥 In Person' : '💻 Tele'}
                    </span>
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
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                          onClick={() => handleComplete(appt.appointmentId)}
                          disabled={completingId === appt.appointmentId}
                        >
                          {completingId === appt.appointmentId ? '...' : '✅ Complete'}
                        </button>
                      )}
                      {appt.status === 'COMPLETED' && (
                        <button
                          className="btn btn-primary"
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                          onClick={() => openRecordForm(appt)}
                        >
                          📋 Add Record
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

      {/* ── Medical Record Modal ── */}
      {showRecordForm && selectedAppointment && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '16px',
            padding: '2rem', width: '100%', maxWidth: '540px',
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}>
            {/* Modal header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '1.5rem'
            }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
                  Add Medical Record
                </h3>
                <p style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>
                  Appointment #{selectedAppointment.appointmentId} —
                  Patient #{selectedAppointment.patientId}
                </p>
              </div>
              <button
                onClick={() => setShowRecordForm(false)}
                style={{
                  background: 'none', border: 'none',
                  fontSize: '20px', cursor: 'pointer', color: '#94a3b8'
                }}
              >
                ✕
              </button>
            </div>

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
                style={{
                  width: '100%', padding: '10px 12px',
                  border: '1px solid #cbd5e1', borderRadius: '8px',
                  fontSize: '14px', outline: 'none', resize: 'vertical'
                }}
              />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                rows={3}
                placeholder="Additional observations or instructions..."
                value={recordForm.notes}
                onChange={e => setRecordForm({ ...recordForm, notes: e.target.value })}
                style={{
                  width: '100%', padding: '10px 12px',
                  border: '1px solid #cbd5e1', borderRadius: '8px',
                  fontSize: '14px', outline: 'none', resize: 'vertical'
                }}
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
                {savingRecord ? 'Saving...' : '💾 Save Record'}
              </button>
              <button
                className="btn"
                style={{
                  flex: 1, padding: '12px',
                  backgroundColor: '#f1f5f9', color: '#64748b'
                }}
                onClick={() => setShowRecordForm(false)}
                disabled={savingRecord}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderAppointments;
