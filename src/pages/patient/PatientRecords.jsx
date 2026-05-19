import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getRecordsByPatientSorted } from '../../api/medicalRecordApi';
import { getAppointmentsByPatient } from '../../api/appointmentApi';
import { getAllProviders } from '../../api/providerApi';

const PatientRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [appointmentsMap, setAppointmentsMap] = useState({});
  const [providersMap, setProvidersMap] = useState({});
  const patientId = localStorage.getItem('userId');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const [records, appointments, providers] = await Promise.all([
        getRecordsByPatientSorted(patientId),
        getAppointmentsByPatient(patientId),
        getAllProviders()
      ]);
      setRecords(records);

      const apptMap = {};
      appointments.forEach(a => { apptMap[a.appointmentId] = a; });
      setAppointmentsMap(apptMap);

      const provMap = {};
      providers.forEach(p => { provMap[p.providerId] = p; });
      setProvidersMap(provMap);
    } catch (err) {
      toast.error('Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#2C2825' }}>
          My Medical Records
        </h2>
        <p style={{ color: '#8C7E72', fontSize: '14px', marginTop: '4px' }}>
          View your diagnosis, prescriptions and follow-up dates
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#8C7E72' }}>
          Loading records...
        </div>
      )}

      {/* Empty */}
      {!loading && records.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '3rem',
          backgroundColor: 'white', borderRadius: '12px',
          color: '#8C7E72', border: '1px solid #E2D9CE'
        }}>
          <p style={{ fontSize: '16px', fontWeight: '600', color: '#2C2825' }}>No medical records yet</p>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>
            Records will appear here after a doctor completes your appointment
          </p>
        </div>
      )}

      {/* Two-column layout — list + detail */}
      {!loading && records.length > 0 && (
        <div className="profile-grid" style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>

          {/* Records list */}
          <div style={{ flex: '0 0 340px', minWidth: 0 }}>
            {records.map(record => (
              <div
                key={record.recordId}
                onClick={() => setSelectedRecord(record)}
                className="card"
                style={{
                  cursor: 'pointer', marginBottom: '10px',
                  border: '2px solid',
                  borderColor: selectedRecord?.recordId === record.recordId
                    ? '#2D6B6B' : '#E2D9CE',
                  backgroundColor: selectedRecord?.recordId === record.recordId
                    ? '#E8F4F4' : 'white',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontWeight: '700', color: '#2C2825', fontSize: '14px' }}>
                      Record #{record.recordId}
                    </p>
                    <p style={{ color: '#2D6B6B', fontSize: '13px', marginTop: '2px' }}>
                      {record.diagnosis || 'No diagnosis noted'}
                    </p>
                    <p style={{ color: '#8C7E72', fontSize: '12px', marginTop: '4px' }}>
                      Dr. {providersMap[record.providerId]?.doctorName || `Provider #${record.providerId}`}
                    </p>
                    <p style={{ color: '#8C7E72', fontSize: '12px', marginTop: '2px' }}>
                      {appointmentsMap[record.appointmentId]?.appointmentDate || ''}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '11px', color: '#8C7E72' }}>
                      {formatDate(record.createdAt)}
                    </p>
                    {record.followUpDate && (
                      <span className="badge badge-warning" style={{ marginTop: '4px', display: 'block' }}>
                        Follow-up
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Record detail panel */}
          <div style={{ flex: 1 }}>
            {!selectedRecord ? (
              <div style={{
                textAlign: 'center', padding: '3rem',
                backgroundColor: 'white', borderRadius: '12px',
                color: '#8C7E72', border: '1px solid #E2D9CE'
              }}>
                <p>Select a record from the list to view details</p>
              </div>
            ) : (
              <div className="card">
                {/* Detail header */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: '1.5rem',
                  paddingBottom: '1rem', borderBottom: '1px solid #E2D9CE'
                }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#2C2825' }}>
                      Record #{selectedRecord.recordId}
                    </h3>
                    <p style={{ color: '#8C7E72', fontSize: '13px', marginTop: '2px' }}>
                      Created on {formatDate(selectedRecord.createdAt)}
                    </p>
                  </div>
                  <span className="badge badge-info">
                    Appointment #{selectedRecord.appointmentId}
                  </span>
                </div>

                {/* Doctor Info */}
                <div style={{
                  backgroundColor: '#E8F4F4', border: '1px solid #B8DADA',
                  borderRadius: '8px', padding: '12px',
                  marginBottom: '1.5rem',
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', flexWrap: 'wrap', gap: '8px'
                }}>
                  <div>
                    <p style={{ fontWeight: '700', color: '#2C2825', fontSize: '15px' }}>
                      Dr. {providersMap[selectedRecord.providerId]?.doctorName || `Provider #${selectedRecord.providerId}`}
                    </p>
                    <p style={{ color: '#2D6B6B', fontSize: '13px', marginTop: '2px' }}>
                      {providersMap[selectedRecord.providerId]?.specialization || '—'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '12px', color: '#8C7E72' }}>Appointment Date</p>
                    <p style={{ fontWeight: '700', color: '#2C2825', fontSize: '14px' }}>
                      {formatDate(appointmentsMap[selectedRecord.appointmentId]?.appointmentDate)}
                    </p>
                  </div>
                </div>

                {/* Diagnosis */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{
                    fontSize: '11px', fontWeight: '700',
                    color: '#8C7E72', textTransform: 'uppercase',
                    letterSpacing: '0.8px', marginBottom: '6px'
                  }}>
                    Diagnosis
                  </p>
                  <div style={{
                    backgroundColor: '#E8F4F4', border: '1px solid #B8DADA',
                    borderRadius: '8px', padding: '12px',
                    fontSize: '14px', color: '#2C2825'
                  }}>
                    {selectedRecord.diagnosis || 'No diagnosis recorded'}
                  </div>
                </div>

                {/* Prescription */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{
                    fontSize: '11px', fontWeight: '700',
                    color: '#8C7E72', textTransform: 'uppercase',
                    letterSpacing: '0.8px', marginBottom: '6px'
                  }}>
                    Prescription
                  </p>
                  <div style={{
                    backgroundColor: '#EBF5EF', border: '1px solid #B8D8C6',
                    borderRadius: '8px', padding: '12px',
                    fontSize: '14px', color: '#2C2825',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {selectedRecord.prescription || 'No prescription recorded'}
                  </div>
                </div>

                {/* Notes */}
                {selectedRecord.notes && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{
                      fontSize: '11px', fontWeight: '700',
                      color: '#8C7E72', textTransform: 'uppercase',
                      letterSpacing: '0.8px', marginBottom: '6px'
                    }}>
                      Doctor's Notes
                    </p>
                    <div style={{
                      backgroundColor: '#FAF7F2', border: '1px solid #E2D9CE',
                      borderRadius: '8px', padding: '12px',
                      fontSize: '14px', color: '#2C2825',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {selectedRecord.notes}
                    </div>
                  </div>
                )}

                {/* Follow-up date */}
                {selectedRecord.followUpDate && (
                  <div style={{
                    backgroundColor: '#FDF6E8', border: '1px solid #E8C87A',
                    borderRadius: '8px', padding: '12px',
                    fontSize: '14px', color: '#9A7230',
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}>
                    <span>
                      <strong>Follow-up Date:</strong> {formatDate(selectedRecord.followUpDate)}
                    </span>
                  </div>
                )}

                {/* Attachment */}
                {selectedRecord.attachmentUrl && (
                  <div style={{ marginTop: '1rem' }}>
                    <a
                      href={selectedRecord.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary"
                      style={{ display: 'inline-block', textDecoration: 'none', padding: '10px 20px' }}
                    >
                      View Attachment
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientRecords;
