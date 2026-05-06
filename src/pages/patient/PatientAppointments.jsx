import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getSpecializations, getAllProviders } from '../../api/providerApi';
import { getAvailableSlots, bookSlot, getSlotsByProvider } from '../../api/scheduleApi';
import { bookAppointment, getAppointmentsByPatient, cancelAppointment } from '../../api/appointmentApi';
import { createRazorpayOrder, verifyRazorpayPayment, processPayment } from '../../api/paymentApi';
import { submitReview, checkReviewExists } from '../../api/reviewApi';
import {
  sendAppointmentBookedNotification,
  sendAppointmentCancelledNotification,
  sendPaymentSuccessNotification,
  sendPaymentRefundedNotification
} from '../../api/notificationApi';

const STEPS = ['Specialization', 'Select Doctor', 'Select Slot', 'Confirm & Pay'];

const PatientAppointments = () => {
  const patientId = localStorage.getItem('userId');
  const today = new Date().toISOString().split('T')[0];

  // Tab
  const [activeTab, setActiveTab] = useState('list');

  // My appointments
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAppointment, setReviewAppointment] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedIds, setReviewedIds] = useState(new Set());

  // Booking flow state
  const [step, setStep] = useState(0);
  const [specializations, setSpecializations] = useState([]);
  const [selectedSpec, setSelectedSpec] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(null); // holds confirmed appointment

  // Booking form
  const [form, setForm] = useState({
    serviceType: '',
    modeOfConsultation: 'IN_PERSON',
    notes: '',
    paymentMode: 'CARD'
  });

  useEffect(() => {
    fetchAppointments();
    fetchSpecializations();
  }, []);

  const checkReviews = async (appointments) => {
    const completed = appointments.filter(a => a.status === 'COMPLETED');
    const checks = await Promise.all(
      completed.map(async (a) => {
        try {
          const exists = await checkReviewExists(a.appointmentId);
          return exists ? a.appointmentId : null;
        } catch {
          return null;
        }
      })
    );
    setReviewedIds(new Set(checks.filter(Boolean)));
  };

  const fetchAppointments = async () => {
    setLoadingAppointments(true);
    try {
      const data = await getAppointmentsByPatient(patientId);
      setAppointments(data);
      await checkReviews(data);
    } catch (err) {
      toast.error('Failed to load appointments');
    } finally {
      setLoadingAppointments(false);
    }
  };

  const fetchSpecializations = async () => {
    try {
      const data = await getSpecializations();
      setSpecializations(data);
    } catch (err) {
      toast.error('Failed to load specializations');
    }
  };

  const handleSelectSpec = async (spec) => {
    setSelectedSpec(spec);
    try {
      const all = await getAllProviders();
      const filtered = all.filter(
        p => p.isVerified &&
             p.isAvailable &&
             p.specialization?.toLowerCase() === spec.name.toLowerCase()
      );
      setDoctors(filtered);
      setStep(1);
    } catch (err) {
      toast.error('Failed to load doctors');
    }
  };

  const handleSelectDoctor = async (doctor) => {
    setSelectedDoctor(doctor);
    setSlots([]);
    setSelectedSlot(null);
    setSelectedDate('');
    setStep(2);
    // Auto load all upcoming slots
    fetchAllSlots(doctor.providerId);
  };

  const fetchAllSlots = async (providerId) => {
    setLoadingSlots(true);
    try {
      const data = await getSlotsByProvider(providerId);
      const available = data
        .filter(s => s.status === 'AVAILABLE' && s.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
      setSlots(available);
      if (available.length === 0) toast.info('No upcoming slots available for this doctor');
    } catch (err) {
      toast.error('Failed to load slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const fetchSlotsByDate = async () => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    try {
      const data = await getAvailableSlots(selectedDoctor.providerId, selectedDate);
      setSlots(data);
      if (data.length === 0) toast.info('No slots on this date');
    } catch (err) {
      toast.error('Failed to load slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewForm.rating) {
      toast.error('Please select a rating');
      return;
    }
    setSubmittingReview(true);
    try {
      await submitReview({
        appointmentId: reviewAppointment.appointmentId,
        patientId: parseInt(patientId),
        providerId: reviewAppointment.providerId,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        isVisible: true,
        createdAt: new Date().toISOString()
      });
      toast.success('Review submitted! Thank you 🌟');
      setShowReviewModal(false);
      setReviewedIds(prev => new Set([...prev, reviewAppointment.appointmentId]));
    } catch (err) {
      toast.error(err.response?.data || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      await cancelAppointment(appointmentId);
      await sendAppointmentCancelledNotification({
        userId: String(patientId),
        recipientEmail: localStorage.getItem('email'),
        appointmentId: String(appointmentId),
        doctorName: 'your doctor',
        date: 'your appointment date'
      });
      toast.success('Appointment cancelled');
      fetchAppointments();
    } catch (err) {
      toast.error('Failed to cancel');
    }
  };

  const handleBooking = async () => {
    if (!form.serviceType) {
      toast.error('Please fill in the service type');
      return;
    }
    setBookingLoading(true);
    try {
      // Step 1 — Book the slot
      await bookSlot(selectedSlot.slotId);

      // Step 2 — Create appointment
      const appointment = await bookAppointment({
        patientId: parseInt(patientId),
        providerId: selectedDoctor.providerId,
        slotId: selectedSlot.slotId,
        serviceType: form.serviceType,
        appointmentDate: selectedSlot.date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        modeOfConsultation: form.modeOfConsultation,
        notes: form.notes,
        status: 'SCHEDULED'
      });

      const fee = selectedDoctor.consultationFee || 0;

      // Step 3 — If cash, skip Razorpay
      if (form.paymentMode === 'CASH') {
        await processPayment({
          appointmentId: appointment.appointmentId,
          patientId: parseInt(patientId),
          providerId: selectedDoctor.providerId,
          amount: fee,
          mode: 'CASH',
          currency: 'INR'
        });
        await sendAppointmentBookedNotification({
          userId: String(patientId),
          recipientEmail: localStorage.getItem('email'),
          appointmentId: String(appointment.appointmentId),
          doctorName: `Dr. ${selectedDoctor.doctorName}`,
          date: selectedSlot.date,
          time: selectedSlot.startTime
        });
        await sendPaymentSuccessNotification({
          userId: String(patientId),
          recipientEmail: localStorage.getItem('email'),
          amount: String(fee),
          transactionId: `APT${appointment.appointmentId}`
        });
        setConfirmed(appointment);
        setStep(4);
        fetchAppointments();
        toast.success('Appointment booked! 🎉');
        setBookingLoading(false);
        return;
      }

      // Step 4 — Create Razorpay order
      const order = await createRazorpayOrder(fee, appointment.appointmentId);

      // Step 5 — Open Razorpay checkout
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'MediBook',
        description: `Consultation with Dr. ${selectedDoctor.doctorName}`,
        order_id: order.orderId,
        prefill: {
          email: localStorage.getItem('email') || '',
        },
        theme: { color: '#2D6B6B' },
        handler: async (response) => {
          try {
            // Step 6 — Verify payment
            await verifyRazorpayPayment({
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });

            // Step 7 — Save payment in our DB
            await processPayment({
              appointmentId: appointment.appointmentId,
              patientId: parseInt(patientId),
              providerId: selectedDoctor.providerId,
              amount: fee,
              mode: form.paymentMode.toUpperCase(),
              currency: 'INR',
              transactionId: response.razorpay_payment_id
            });
            await sendAppointmentBookedNotification({
              userId: String(patientId),
              recipientEmail: localStorage.getItem('email'),
              appointmentId: String(appointment.appointmentId),
              doctorName: `Dr. ${selectedDoctor.doctorName}`,
              date: selectedSlot.date,
              time: selectedSlot.startTime
            });
            await sendPaymentSuccessNotification({
              userId: String(patientId),
              recipientEmail: localStorage.getItem('email'),
              amount: String(fee),
              transactionId: response.razorpay_payment_id
            });
            setConfirmed(appointment);
            setStep(4);
            fetchAppointments();
            toast.success('Payment successful! Appointment confirmed 🎉');
          } catch (err) {
            toast.error('Payment verification failed');
          }
          setBookingLoading(false);
        },
        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled');
            setBookingLoading(false);
          }
        }
      };

      // Load Razorpay script and open
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const rzp = new window.Razorpay(options);
        rzp.open();
      };
      document.body.appendChild(script);

    } catch (err) {
      toast.error(err.response?.data || 'Booking failed');
      setBookingLoading(false);
    }
  };

  const resetBooking = () => {
    setStep(0);
    setSelectedSpec(null);
    setSelectedDoctor(null);
    setSlots([]);
    setSelectedSlot(null);
    setSelectedDate('');
    setConfirmed(null);
    setForm({ serviceType: '', modeOfConsultation: 'IN_PERSON', notes: '', paymentMode: 'CARD' });
  };

  const getStatusBadge = (status) => {
    const map = { SCHEDULED: 'badge-info', COMPLETED: 'badge-success', CANCELLED: 'badge-danger', NO_SHOW: 'badge-warning' };
    return map[status] || 'badge-info';
  };

  // Group slots by date for display
  const slotsByDate = slots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {});

  const formatDate = (dateStr) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
      weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>Appointments</h2>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '2rem' }}>
        {['list', 'book'].map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); if (tab === 'book') resetBooking(); }}
            className="btn"
            style={{
              backgroundColor: activeTab === tab ? '#2563eb' : '#f1f5f9',
              color: activeTab === tab ? 'white' : '#64748b',
              padding: '10px 24px'
            }}>
            {tab === 'list' ? '📋 My Appointments' : '➕ Book New'}
          </button>
        ))}
      </div>

      {/* ── MY APPOINTMENTS ── */}
      {activeTab === 'list' && (
        <div>
          {loadingAppointments && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading...</div>
          )}
          {!loadingAppointments && appointments.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'white', borderRadius: '12px', color: '#64748b' }}>
              No appointments yet.{' '}
              <button className="btn btn-primary" style={{ marginLeft: '8px', padding: '8px 16px' }}
                onClick={() => setActiveTab('book')}>
                Book your first appointment
              </button>
            </div>
          )}
          {!loadingAppointments && appointments.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th><th>Date</th><th>Time</th>
                    <th>Service</th><th>Mode</th><th>Status</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(appt => (
                    <tr key={appt.appointmentId}>
                      <td>#{appt.appointmentId}</td>
                      <td>{appt.appointmentDate}</td>
                      <td>{appt.startTime} - {appt.endTime}</td>
                      <td>{appt.serviceType}</td>
                      <td>{appt.modeOfConsultation}</td>
                      <td><span className={`badge ${getStatusBadge(appt.status)}`}>{appt.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {appt.status === 'SCHEDULED' && (
                            <button
                              className="btn btn-danger"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              onClick={() => handleCancelAppointment(appt.appointmentId)}
                            >
                              Cancel
                            </button>
                          )}
                          {appt.status === 'COMPLETED' && (
                            reviewedIds.has(appt.appointmentId) ? (
                              <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>
                                ✅ Reviewed
                              </span>
                            ) : (
                              <button
                                className="btn"
                                style={{
                                  padding: '6px 12px', fontSize: '12px',
                                  backgroundColor: '#fef9c3', color: '#92400e',
                                  border: '1px solid #fde68a'
                                }}
                                onClick={() => {
                                  setReviewAppointment(appt);
                                  setReviewForm({ rating: 5, comment: '' });
                                  setShowReviewModal(true);
                                }}
                              >
                                ⭐ Write Review
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
          )}
        </div>
      )}

      {/* ── BOOK NEW ── */}
      {activeTab === 'book' && (
        <div>

          {/* Stepper — only show for steps 0-3 */}
          {step < 4 && (
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '8px' }}>
              {STEPS.map((label, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    backgroundColor: index <= step ? '#2563eb' : '#e2e8f0',
                    color: index <= step ? 'white' : '#94a3b8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '700', fontSize: '14px', flexShrink: 0
                  }}>
                    {index + 1}
                  </div>
                  <span style={{
                    marginLeft: '6px', fontSize: '13px',
                    color: index <= step ? '#2563eb' : '#94a3b8',
                    fontWeight: index === step ? '600' : '400'
                  }}>
                    {label}
                  </span>
                  {index < STEPS.length - 1 && (
                    <div style={{
                      width: '32px', height: '2px',
                      backgroundColor: index < step ? '#2563eb' : '#e2e8f0',
                      margin: '0 10px'
                    }} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── STEP 0: Select Specialization ── */}
          {step === 0 && (
            <div className="card">
              <h3 style={{ marginBottom: '0.5rem', color: '#1e293b', fontSize: '18px' }}>
                Select a Specialization
              </h3>
              <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '1.5rem' }}>
                Choose the type of doctor you need
              </p>
              {specializations.length === 0 && (
                <p style={{ color: '#94a3b8' }}>No specializations available. Please contact admin.</p>
              )}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                {specializations.map(spec => (
                  <div
                    key={spec.id}
                    onClick={() => handleSelectSpec(spec)}
                    style={{
                      border: '2px solid #e2e8f0', borderRadius: '12px',
                      padding: '1.2rem', cursor: 'pointer',
                      textAlign: 'center', transition: 'all 0.15s',
                      backgroundColor: 'white'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#2563eb';
                      e.currentTarget.style.backgroundColor = '#eff6ff';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏥</div>
                    <p style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>
                      {spec.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 1: Select Doctor ── */}
          {step === 1 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                <button className="btn"
                  style={{ backgroundColor: '#f1f5f9', color: '#64748b', padding: '8px 12px' }}
                  onClick={() => { setStep(0); setSelectedSpec(null); setDoctors([]); }}>
                  ← Back
                </button>
                <div>
                  <h3 style={{ color: '#1e293b', fontSize: '18px', fontWeight: '700' }}>
                    {selectedSpec?.name} Doctors
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '13px' }}>
                    {doctors.length} doctor(s) available
                  </p>
                </div>
              </div>

              {doctors.length === 0 && (
                <div style={{
                  textAlign: 'center', padding: '3rem',
                  backgroundColor: 'white', borderRadius: '12px', color: '#64748b'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>👨‍⚕️</div>
                  <p style={{ fontWeight: '600' }}>No doctors available for {selectedSpec?.name}</p>
                  <p style={{ fontSize: '13px', marginTop: '4px' }}>Try a different specialization</p>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {doctors.map(doctor => (
                  <div
                    key={doctor.providerId}
                    className="card"
                    style={{
                      border: '2px solid #e2e8f0', cursor: 'pointer',
                      transition: 'all 0.15s', display: 'flex',
                      alignItems: 'center', gap: '1rem'
                    }}
                    onClick={() => handleSelectDoctor(doctor)}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#2563eb';
                      e.currentTarget.style.backgroundColor = '#f8fbff';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: '64px', height: '64px', borderRadius: '50%',
                      overflow: 'hidden', border: '2px solid #2D6B6B',
                      backgroundColor: '#E8F4F4',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {doctor.profilePhotoUrl ? (
                        <img
                          src={doctor.profilePhotoUrl}
                          alt={doctor.doctorName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                          stroke="#2D6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '2px' }}>
                        Dr. {doctor.doctorName || `Provider #${doctor.providerId}`}
                      </h3>
                      <p style={{ color: '#2563eb', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
                        {doctor.specialization}
                      </p>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#64748b', flexWrap: 'wrap' }}>
                        {doctor.clinicName && <span>🏥 {doctor.clinicName}</span>}
                        {doctor.clinicAddress && <span>📍 {doctor.clinicAddress}</span>}
                        {doctor.experienceYears > 0 && <span>💼 {doctor.experienceYears} yrs exp</span>}
                        <span>🎓 {doctor.qualification || 'MBBS'}</span>
                      </div>
                    </div>

                    {/* Fee + arrow */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: '20px', fontWeight: '800', color: '#16a34a' }}>
                        ₹{doctor.consultationFee || 0}
                      </p>
                      <p style={{ fontSize: '11px', color: '#94a3b8' }}>consultation fee</p>
                      <p style={{ fontSize: '20px', color: '#2563eb', marginTop: '4px' }}>›</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 2: Select Slot ── */}
          {step === 2 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                <button className="btn"
                  style={{ backgroundColor: '#f1f5f9', color: '#64748b', padding: '8px 12px' }}
                  onClick={() => { setStep(1); setSelectedDoctor(null); setSlots([]); }}>
                  ← Back
                </button>
                <div>
                  <h3 style={{ color: '#1e293b', fontSize: '18px', fontWeight: '700' }}>
                    Dr. {selectedDoctor?.doctorName || `Provider #${selectedDoctor?.providerId}`}
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '13px' }}>
                    {selectedDoctor?.specialization} · {selectedDoctor?.clinicName}
                  </p>
                </div>
              </div>

              {/* Doctor summary card */}
              <div style={{
                backgroundColor: '#f0f9ff', border: '1px solid #bae6fd',
                borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: '8px'
              }}>
                <div style={{ fontSize: '13px', color: '#0369a1' }}>
                  <span>🎓 {selectedDoctor?.qualification}</span>
                  <span style={{ margin: '0 12px' }}>💼 {selectedDoctor?.experienceYears} yrs exp</span>
                  <span>📍 {selectedDoctor?.clinicAddress}</span>
                </div>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#16a34a' }}>
                  ₹{selectedDoctor?.consultationFee || 0}
                </span>
              </div>

              {/* Filter by date */}
              <div style={{
                backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
                borderRadius: '10px', padding: '1rem', marginBottom: '1.2rem'
              }}>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '10px', fontWeight: '600' }}>
                  🔍 Filter by date:
                </p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                  <input
                    type="date" min={today} value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    style={{
                      flex: 1, padding: '10px 12px',
                      border: '1px solid #cbd5e1', borderRadius: '8px',
                      fontSize: '14px', outline: 'none'
                    }}
                  />
                  <button className="btn btn-primary"
                    style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}
                    onClick={fetchSlotsByDate}
                    disabled={!selectedDate || loadingSlots}>
                    🔍 Check
                  </button>
                  <button className="btn"
                    style={{ padding: '10px 14px', backgroundColor: '#f1f5f9', color: '#64748b', whiteSpace: 'nowrap' }}
                    onClick={() => { setSelectedDate(''); fetchAllSlots(selectedDoctor.providerId); }}
                    disabled={loadingSlots}>
                    Show All
                  </button>
                </div>
              </div>

              {loadingSlots && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  Loading slots...
                </div>
              )}

              {!loadingSlots && slots.length === 0 && (
                <div style={{
                  textAlign: 'center', padding: '2rem',
                  backgroundColor: 'white', borderRadius: '10px', color: '#64748b'
                }}>
                  No available slots. Try a different date.
                </div>
              )}

              {/* Slots grouped by date */}
              {!loadingSlots && Object.keys(slotsByDate).map(date => (
                <div key={date} style={{ marginBottom: '1.2rem' }}>
                  <p style={{
                    fontSize: '13px', fontWeight: '700', color: '#475569',
                    marginBottom: '8px', padding: '6px 12px',
                    backgroundColor: '#f1f5f9', borderRadius: '6px',
                    display: 'inline-block'
                  }}>
                    📅 {formatDate(date)}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {slotsByDate[date].map(slot => {
                      const isSelected = selectedSlot?.slotId === slot.slotId;
                      return (
                        <button
                          key={slot.slotId}
                          onClick={() => setSelectedSlot(slot)}
                          style={{
                            padding: '10px 16px', borderRadius: '8px',
                            border: '2px solid',
                            borderColor: isSelected ? '#2563eb' : '#e2e8f0',
                            backgroundColor: isSelected ? '#2563eb' : 'white',
                            color: isSelected ? 'white' : '#475569',
                            fontWeight: '600', fontSize: '13px',
                            cursor: 'pointer', transition: 'all 0.15s'
                          }}
                        >
                          {slot.startTime} - {slot.endTime}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {selectedSlot && (
                <div style={{
                  marginTop: '1.5rem', padding: '12px 16px',
                  backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
                  borderRadius: '8px', display: 'flex',
                  justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span style={{ fontSize: '14px', color: '#16a34a', fontWeight: '600' }}>
                    ✅ Selected: {formatDate(selectedSlot.date)} · {selectedSlot.startTime} - {selectedSlot.endTime}
                  </span>
                  <button className="btn btn-primary"
                    style={{ padding: '10px 24px' }}
                    onClick={() => setStep(3)}>
                    Continue →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Confirm & Pay ── */}
          {step === 3 && (
            <div className="card" style={{ maxWidth: '600px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                <button className="btn"
                  style={{ backgroundColor: '#f1f5f9', color: '#64748b', padding: '8px 12px' }}
                  onClick={() => setStep(2)}>
                  ← Back
                </button>
                <h3 style={{ color: '#1e293b', fontSize: '18px', fontWeight: '700' }}>
                  Review & Confirm
                </h3>
              </div>

              {/* Booking summary */}
              <div style={{
                backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
                borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem'
              }}>
                <p style={{ fontWeight: '700', color: '#1e293b', marginBottom: '10px', fontSize: '15px' }}>
                  📋 Booking Summary
                </p>
                <div style={{ fontSize: '14px', color: '#475569' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Doctor</span>
                    <span style={{ fontWeight: '600', color: '#1e293b' }}>
                      Dr. {selectedDoctor?.doctorName || `#${selectedDoctor?.providerId}`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Specialization</span>
                    <span style={{ fontWeight: '600', color: '#2563eb' }}>{selectedDoctor?.specialization}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Clinic</span>
                    <span style={{ fontWeight: '600' }}>{selectedDoctor?.clinicName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Date</span>
                    <span style={{ fontWeight: '600' }}>{formatDate(selectedSlot?.date)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Time</span>
                    <span style={{ fontWeight: '600' }}>{selectedSlot?.startTime} - {selectedSlot?.endTime}</span>
                  </div>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    marginTop: '10px', paddingTop: '10px',
                    borderTop: '1px solid #e2e8f0'
                  }}>
                    <span style={{ fontWeight: '700' }}>Consultation Fee</span>
                    <span style={{ fontWeight: '800', fontSize: '18px', color: '#16a34a' }}>
                      ₹{selectedDoctor?.consultationFee || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="form-group">
                <label>Service Type *</label>
                <input
                  type="text"
                  placeholder="e.g. General Consultation, Follow-up"
                  value={form.serviceType}
                  onChange={e => setForm({ ...form, serviceType: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Mode of Consultation</label>
                <select
                  value={form.modeOfConsultation}
                  onChange={e => setForm({ ...form, modeOfConsultation: e.target.value })}
                >
                  <option value="IN_PERSON">🏥 In Person</option>
                  <option value="TELECONSULTATION">💻 Teleconsultation</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notes (optional)</label>
                <textarea
                  rows={3}
                  placeholder="Describe your symptoms..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 12px',
                    border: '1px solid #cbd5e1', borderRadius: '8px',
                    fontSize: '14px', outline: 'none', resize: 'vertical'
                  }}
                />
              </div>

              <div className="form-group">
                <label>Payment Mode</label>
                <select
                  value={form.paymentMode}
                  onChange={e => setForm({ ...form, paymentMode: e.target.value })}
                >
                  <option value="CARD">💳 Credit / Debit Card</option>
                  <option value="UPI">📱 UPI</option>
                  <option value="WALLET">👛 Wallet</option>
                  <option value="CASH">💵 Cash (Pay at clinic)</option>
                </select>
              </div>

              <button
                className="btn btn-success"
                style={{ width: '100%', padding: '14px', fontSize: '15px', marginTop: '0.5rem' }}
                onClick={handleBooking}
                disabled={bookingLoading}
              >
                {bookingLoading ? 'Processing...' : `✅ Confirm Booking & Pay ₹${selectedDoctor?.consultationFee || 0}`}
              </button>
            </div>
          )}

          {/* ── STEP 4: Confirmation Screen ── */}
          {step === 4 && confirmed && (
            <div style={{ maxWidth: '520px', margin: '0 auto', textAlign: 'center' }}>
              <div className="card">
                {/* Success icon */}
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%',
                  backgroundColor: '#f0fdf4', border: '4px solid #16a34a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '36px', margin: '0 auto 1rem'
                }}>
                  ✅
                </div>

                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#16a34a', marginBottom: '4px' }}>
                  Appointment Confirmed!
                </h2>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '1.5rem' }}>
                  Your appointment has been booked successfully
                </p>

                {/* Details */}
                <div style={{
                  backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
                  borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem',
                  textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '50%',
                      overflow: 'hidden', border: '2px solid #2D6B6B',
                      backgroundColor: '#E8F4F4',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {selectedDoctor?.profilePhotoUrl ? (
                        <img
                          src={selectedDoctor.profilePhotoUrl}
                          alt={selectedDoctor.doctorName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                          stroke="#2D6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                      )}
                    </div>
                    <div>
                      <p style={{ fontWeight: '700', color: '#1e293b' }}>
                        Dr. {selectedDoctor?.doctorName || `Provider #${selectedDoctor?.providerId}`}
                      </p>
                      <p style={{ color: '#2563eb', fontSize: '13px' }}>{selectedDoctor?.specialization}</p>
                    </div>
                  </div>

                  <div style={{ fontSize: '14px', color: '#475569' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span>🏥 Clinic</span>
                      <span style={{ fontWeight: '600' }}>{selectedDoctor?.clinicName}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span>📅 Date</span>
                      <span style={{ fontWeight: '600' }}>{formatDate(confirmed.appointmentDate)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span>⏰ Time</span>
                      <span style={{ fontWeight: '600' }}>{confirmed.startTime} - {confirmed.endTime}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span>🔖 Booking ID</span>
                      <span style={{ fontWeight: '600', color: '#2563eb' }}>APT{confirmed.appointmentId}</span>
                    </div>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      paddingTop: '8px', borderTop: '1px solid #e2e8f0', marginTop: '8px'
                    }}>
                      <span style={{ fontWeight: '700' }}>Amount Paid</span>
                      <span style={{ fontWeight: '800', color: '#16a34a', fontSize: '16px' }}>
                        ₹{selectedDoctor?.consultationFee || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '12px' }}
                    onClick={() => { setActiveTab('list'); resetBooking(); }}
                  >
                    📋 View My Appointments
                  </button>
                  <button
                    className="btn"
                    style={{ flex: 1, padding: '12px', backgroundColor: '#f1f5f9', color: '#64748b' }}
                    onClick={() => { resetBooking(); }}
                  >
                    ➕ Book Another
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* ── Review Modal ── */}
      {showReviewModal && reviewAppointment && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '16px',
            padding: '2rem', width: '100%', maxWidth: '480px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '1.5rem'
            }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
                  Write a Review
                </h3>
                <p style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>
                  Appointment #{reviewAppointment.appointmentId}
                </p>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                style={{
                  background: 'none', border: 'none',
                  fontSize: '20px', cursor: 'pointer', color: '#94a3b8'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
              <p style={{
                fontSize: '13px', fontWeight: '600',
                color: '#475569', marginBottom: '10px'
              }}>
                How would you rate your experience?
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                    style={{
                      background: 'none', border: 'none',
                      fontSize: '36px', cursor: 'pointer',
                      color: star <= reviewForm.rating ? '#f59e0b' : '#e2e8f0',
                      transition: 'color 0.15s', padding: '0'
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
              <p style={{
                fontSize: '14px', fontWeight: '700',
                color: '#f59e0b', marginTop: '8px'
              }}>
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewForm.rating]}
              </p>
            </div>

            <div className="form-group">
              <label>Your Feedback (optional)</label>
              <textarea
                rows={4}
                placeholder="Share your experience with this doctor..."
                value={reviewForm.comment}
                onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                style={{
                  width: '100%', padding: '10px 12px',
                  border: '1px solid #cbd5e1', borderRadius: '8px',
                  fontSize: '14px', outline: 'none', resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, padding: '12px' }}
                onClick={handleSubmitReview}
                disabled={submittingReview}
              >
                {submittingReview ? 'Submitting...' : '⭐ Submit Review'}
              </button>
              <button
                className="btn"
                style={{
                  flex: 1, padding: '12px',
                  backgroundColor: '#f1f5f9', color: '#64748b'
                }}
                onClick={() => setShowReviewModal(false)}
                disabled={submittingReview}
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

export default PatientAppointments;