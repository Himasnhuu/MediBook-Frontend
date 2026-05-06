import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getRecordsByPatientSorted } from '../../api/medicalRecordApi';

const PatientRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const patientId = localStorage.getItem('userId');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await getRecordsByPatientSorted(patientId);
      setRecords(data);
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
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
          My Medical Records
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
          View your diagnosis, prescriptions and follow-up dates
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          Loading records...
        </div>
      )}

      {/* Empty */}
      {!loading && records.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '3rem',
          backgroundColor: 'white', borderRadius: '12px',
          color: '#64748b'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🗂️</div>
          <p style={{ fontSize: '16px', fontWeight: '600' }}>No medical records yet</p>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>
            Records will appear here after a doctor completes your appointment
          </p>
        </div>
      )}

      {/* Two-column layout — list + detail */}
      {!loading && records.length > 0 && (
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>

          {/* Records list */}
          <div style={{ flex: '0 0 340px' }}>
            {records.map(record => (
              <div
                key={record.recordId}
                onClick={() => setSelectedRecord(record)}
                className="card"
                style={{
                  cursor: 'pointer', marginBottom: '10px',
                  border: '2px solid',
                  borderColor: selectedRecord?.recordId === record.recordId
                    ? '#2563eb' : '#e2e8f0',
                  backgroundColor: selectedRecord?.recordId === record.recordId
                    ? '#f0f7ff' : 'white',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>
                      Record #{record.recordId}
                    </p>
                    <p style={{ color: '#2563eb', fontSize: '13px', marginTop: '2px' }}>
                      {record.diagnosis || 'No diagnosis noted'}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>
                      Appointment #{record.appointmentId}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>
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
                color: '#94a3b8'
              }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>👈</div>
                <p>Select a record to view details</p>
              </div>
            ) : (
              <div className="card">
                {/* Detail header */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: '1.5rem',
                  paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0'
                }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
                      Record #{selectedRecord.recordId}
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>
                      Created on {formatDate(selectedRecord.createdAt)}
                    </p>
                  </div>
                  <span className="badge badge-info">
                    Appointment #{selectedRecord.appointmentId}
                  </span>
                </div>

                {/* Diagnosis */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{
                    fontSize: '11px', fontWeight: '700',
                    color: '#94a3b8', textTransform: 'uppercase',
                    letterSpacing: '0.8px', marginBottom: '6px'
                  }}>
                    Diagnosis
                  </p>
                  <div style={{
                    backgroundColor: '#fef9c3', border: '1px solid #fde68a',
                    borderRadius: '8px', padding: '12px',
                    fontSize: '14px', color: '#1e293b'
                  }}>
                    {selectedRecord.diagnosis || 'No diagnosis recorded'}
                  </div>
                </div>

                {/* Prescription */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{
                    fontSize: '11px', fontWeight: '700',
                    color: '#94a3b8', textTransform: 'uppercase',
                    letterSpacing: '0.8px', marginBottom: '6px'
                  }}>
                    Prescription
                  </p>
                  <div style={{
                    backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
                    borderRadius: '8px', padding: '12px',
                    fontSize: '14px', color: '#1e293b',
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
                      color: '#94a3b8', textTransform: 'uppercase',
                      letterSpacing: '0.8px', marginBottom: '6px'
                    }}>
                      Doctor's Notes
                    </p>
                    <div style={{
                      backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
                      borderRadius: '8px', padding: '12px',
                      fontSize: '14px', color: '#1e293b',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {selectedRecord.notes}
                    </div>
                  </div>
                )}

                {/* Follow-up date */}
                {selectedRecord.followUpDate && (
                  <div style={{
                    backgroundColor: '#fef3c7', border: '1px solid #fcd34d',
                    borderRadius: '8px', padding: '12px',
                    fontSize: '14px', color: '#92400e',
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}>
                    <span style={{ fontSize: '18px' }}>📅</span>
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
                      📎 View Attachment
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
