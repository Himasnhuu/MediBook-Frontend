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

      {/* Records list */}
      {!loading && records.length > 0 && records.map(record => (
        <div
          key={record.recordId}
          onClick={() => setSelectedRecord(record)}
          className="card"
          style={{ cursor: 'pointer', marginBottom: '10px', border: '1px solid #E2D9CE' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontWeight: '700', color: '#2C2825', fontSize: '14px' }}>
                Dr. {providersMap[record.providerId]?.doctorName || `#${record.providerId}`}
              </p>
              <p style={{ color: '#2D6B6B', fontSize: '13px' }}>
                {providersMap[record.providerId]?.specialization}
              </p>
              <p style={{ color: '#2D6B6B', fontSize: '13px', marginTop: '4px' }}>
                {record.diagnosis}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '12px', color: '#8C7E72' }}>
                {formatDate(appointmentsMap[record.appointmentId]?.appointmentDate)}
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

      {/* Detail modal */}
      {selectedRecord && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(26,21,17,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#FAF7F2', borderRadius: '20px',
            width: '100%', maxWidth: '560px', maxHeight: '90vh',
            overflowY: 'auto', boxShadow: '0 16px 48px rgba(26,21,17,0.3)'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #1F4E4E, #2D6B6B)',
              padding: '1.5rem 2rem', borderRadius: '20px 20px 0 0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <h3 style={{ color: 'white', fontWeight: '800', fontSize: '17px', marginBottom: '2px' }}>
                  Medical Record #{selectedRecord.recordId}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
                  Dr. {providersMap[selectedRecord.providerId]?.doctorName} · {providersMap[selectedRecord.providerId]?.specialization}
                </p>
              </div>
              <button onClick={() => setSelectedRecord(null)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none',
                  borderRadius: '8px', width: '34px', height: '34px',
                  color: 'white', fontSize: '16px', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Body */}
            <div id="record-print-area" style={{ padding: '1.5rem 2rem' }}>
              {/* Doctor & Date Info */}
              <div style={{
                backgroundColor: '#E8F4F4', border: '1px solid #B8DADA',
                borderRadius: '8px', padding: '12px', marginBottom: '1.5rem',
                display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px'
              }}>
                <div>
                  <p style={{ fontWeight: '700', color: '#2C2825' }}>
                    Dr. {providersMap[selectedRecord.providerId]?.doctorName}
                  </p>
                  <p style={{ color: '#2D6B6B', fontSize: '13px' }}>
                    {providersMap[selectedRecord.providerId]?.specialization}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '12px', color: '#8C7E72' }}>Appointment Date</p>
                  <p style={{ fontWeight: '700', color: '#2C2825' }}>
                    {formatDate(appointmentsMap[selectedRecord.appointmentId]?.appointmentDate)}
                  </p>
                </div>
              </div>

              {/* Fields */}
              {[
                { label: 'Diagnosis', value: selectedRecord.diagnosis, bg: '#E8F4F4', border: '#B8DADA' },
                { label: 'Prescription', value: selectedRecord.prescription, bg: '#EBF5EF', border: '#B8D8C6' },
                { label: "Doctor's Notes", value: selectedRecord.notes, bg: '#FAF7F2', border: '#E2D9CE' },
              ].map(({ label, value, bg, border }) => value && (
                <div key={label} style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '11px', fontWeight: '700', color: '#8C7E72',
                    textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                    {label}
                  </p>
                  <div style={{ backgroundColor: bg, border: `1px solid ${border}`,
                    borderRadius: '8px', padding: '12px', fontSize: '14px',
                    color: '#2C2825', whiteSpace: 'pre-wrap' }}>
                    {value}
                  </div>
                </div>
              ))}

              {/* Follow-up */}
              {selectedRecord.followUpDate && (
                <div style={{
                  backgroundColor: '#FDF6E8', border: '1px solid #E8C87A',
                  borderRadius: '8px', padding: '12px', fontSize: '14px', color: '#9A7230'
                }}>
                  <strong>Follow-up Date:</strong> {formatDate(selectedRecord.followUpDate)}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ padding: '0 2rem 1.5rem', display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, padding: '12px' }}
                onClick={() => {
                  const provider = providersMap[selectedRecord.providerId];
                  const appt = appointmentsMap[selectedRecord.appointmentId];
                  const win = window.open('', '_blank');
                  win.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <title>Medical Record #${selectedRecord.recordId}</title>
                      <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { font-family: Arial, sans-serif; color: #2C2825; background: white; }
                        .page { max-width: 800px; margin: 0 auto; padding: 20px; }
                        .clinic-header { background: linear-gradient(135deg, #1F4E4E, #2D6B6B); color: white; padding: 24px 30px; border-radius: 12px 12px 0 0; display: flex; justify-content: space-between; align-items: flex-start; }
                        .clinic-name { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
                        .clinic-address { font-size: 13px; opacity: 0.8; }
                        .record-badge { background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; text-align: right; }
                        .doctor-section { background: #E8F4F4; border: 1px solid #B8DADA; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; border-top: none; }
                        .doctor-name { font-size: 16px; font-weight: 700; color: #2C2825; }
                        .doctor-spec { font-size: 13px; color: #2D6B6B; margin-top: 2px; }
                        .doctor-qual { font-size: 12px; color: #8C7E72; margin-top: 2px; }
                        .content { border: 1px solid #E2D9CE; border-top: none; padding: 16px; }
                        .section { margin-bottom: 12px; }
                        .section-title { font-size: 11px; font-weight: 700; color: white; text-transform: uppercase; letter-spacing: 1px; background: #2D6B6B; padding: 6px 12px; border-radius: 4px; margin-bottom: 12px; display: inline-block; }
                        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
                        .field { margin-bottom: 10px; }
                        .field-label { font-size: 11px; color: #8C7E72; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
                        .field-value { font-size: 13px; color: #2C2825; font-weight: 500; border-bottom: 1px solid #E2D9CE; padding-bottom: 4px; }
                        .vitals-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
                        .vital-box { background: #FAF7F2; border: 1px solid #E2D9CE; border-radius: 8px; padding: 10px; text-align: center; }
                        .vital-label { font-size: 10px; color: #8C7E72; font-weight: 600; text-transform: uppercase; }
                        .vital-value { font-size: 16px; font-weight: 700; color: #2D6B6B; margin-top: 4px; }
                        .diagnosis-box { background: #EBF5EF; border: 1px solid #B8D8C6; border-radius: 8px; padding: 12px 16px; font-size: 15px; font-weight: 600; color: #2C2825; }
                        .prescription-box { background: #F0F8F0; border: 1px solid #B8D8C6; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #2C2825; white-space: pre-wrap; min-height: 80px; }
                        .notes-box { background: #FAF7F2; border: 1px solid #E2D9CE; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #2C2825; white-space: pre-wrap; min-height: 60px; }
                        .followup-box { background: #FDF6E8; border: 2px solid #E8C87A; border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; gap: 10px; }
                        .followup-label { font-size: 13px; color: #9A7230; font-weight: 600; }
                        .followup-date { font-size: 16px; color: #9A7230; font-weight: 800; }
                        .signature-section { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 20px; border-top: 2px dashed #E2D9CE; }
                        .sig-box { text-align: center; width: 45%; }
                        .sig-line { border-top: 1px solid #2C2825; margin-top: 50px; padding-top: 8px; font-size: 12px; color: #5C524A; }
                        .footer { margin-top: 20px; padding: 12px 16px; background: #F2EDE4; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #8C7E72; }
                        .footer-badge { background: #2D6B6B; color: white; padding: 4px 10px; border-radius: 20px; font-weight: 700; }
                        .divider { border: none; border-top: 1px solid #E2D9CE; margin: 16px 0; }
                        @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } .page { padding: 10px; } .section { margin-bottom: 8px; } .divider { margin: 10px 0; } }
                      </style>
                    </head>
                    <body>
                    <div class="page">
                      <div class="clinic-header">
                        <div>
                          <div class="clinic-name">🏥 ${provider?.clinicName || 'MediBook Healthcare'}</div>
                          <div class="clinic-address">📍 ${provider?.clinicAddress || 'Address not available'}</div>
                          <div class="clinic-address" style="margin-top:4px">🏛️ Department of ${provider?.specialization || '—'}</div>
                        </div>
                        <div class="record-badge">
                          Medical Record<br/>
                          <strong>#${selectedRecord.recordId}</strong><br/>
                          <span style="font-size:11px;opacity:0.8">${new Date().toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>
                      <div class="doctor-section">
                        <div>
                          <div class="doctor-name">Dr. ${provider?.doctorName || '—'}</div>
                          <div class="doctor-spec">${provider?.specialization || '—'}</div>
                          <div class="doctor-qual">${provider?.qualification || '—'}</div>
                        </div>
                        <div style="text-align:right;font-size:12px;color:#5C524A">
                          <div>Reg. No: MED-${selectedRecord.providerId?.toString().padStart(4,'0')}</div>
                          <div style="margin-top:4px">Appt. ID: #${selectedRecord.appointmentId}</div>
                        </div>
                      </div>
                      <div class="content">
                        <div class="section">
                          <div class="section-title">Patient Information</div>
                          <div class="grid-2">
                            <div class="field"><div class="field-label">Full Name</div><div class="field-value">${localStorage.getItem('fullName') || '—'}</div></div>
                            <div class="field"><div class="field-label">Patient ID / UHID</div><div class="field-value">MED-${localStorage.getItem('userId')?.padStart(6,'0') || '—'}</div></div>
                            <div class="field"><div class="field-label">Email</div><div class="field-value">${localStorage.getItem('email') || '—'}</div></div>
                            <div class="field"><div class="field-label">Blood Group</div><div class="field-value">—</div></div>
                          </div>
                        </div>
                        <div class="section">
                          <div class="section-title">Visit Details</div>
                          <div class="grid-3">
                            <div class="field"><div class="field-label">Date of Visit</div><div class="field-value">${appt?.appointmentDate || '—'}</div></div>
                            <div class="field"><div class="field-label">Time</div><div class="field-value">${appt?.startTime || '—'} - ${appt?.endTime || '—'}</div></div>
                            <div class="field"><div class="field-label">Mode</div><div class="field-value">${appt?.modeOfConsultation?.replace('_', ' ') || '—'}</div></div>
                          </div>
                        </div>
                        <div class="section">
                          <div class="section-title">Diagnosis</div>
                          <div class="diagnosis-box">✓ ${selectedRecord.diagnosis || '—'}</div>
                        </div>
                        <hr class="divider"/>
                        <div class="section">
                          <div class="section-title">Prescribed Medicines</div>
                          <div class="prescription-box">${selectedRecord.prescription || '—'}</div>
                        </div>
                        <hr class="divider"/>
                        ${selectedRecord.followUpDate ? `
                        <div class="section">
                          <div class="section-title">Follow-up Information</div>
                          <div class="followup-box">
                            <span style="font-size:20px">📅</span>
                            <div>
                              <div class="followup-label">Next Visit Date</div>
                              <div class="followup-date">${new Date(selectedRecord.followUpDate).toLocaleDateString('en-IN', {day:'2-digit',month:'long',year:'numeric'})}</div>
                            </div>
                          </div>
                        </div>
                        ` : ''}
                        <div class="signature-section">
                          <div class="sig-box"><div class="sig-line">Patient Signature</div></div>
                          <div class="sig-box">
                            <div style="font-size:12px;color:#2D6B6B;margin-bottom:4px">Dr. ${provider?.doctorName || '—'}</div>
                            <div class="sig-line">Doctor Signature & Stamp</div>
                          </div>
                        </div>
                      </div>
                      <div class="footer">
                        <div><span class="footer-badge">MediBook</span>&nbsp; Digital Health Record System</div>
                        <div>Record ID: MR-${selectedRecord.recordId?.toString().padStart(6,'0')} &nbsp;|&nbsp; Generated: ${new Date().toLocaleString('en-IN')} &nbsp;|&nbsp; Appointment: #${selectedRecord.appointmentId}</div>
                      </div>
                    </div>
                    </body></html>
                  `);
                  win.document.close();
                  win.print();
                }}
              >
                Download PDF
              </button>
              <button className="btn" onClick={() => setSelectedRecord(null)}
                style={{ flex: 1, padding: '12px', backgroundColor: '#F2EDE4',
                  color: '#8C7E72', border: '1px solid #E2D9CE' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientRecords;
