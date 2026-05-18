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

  const [activeTab, setActiveTab] = useState('list');

  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAppointment, setReviewAppointment] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedIds, setReviewedIds] = useState(new Set());

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
  const [confirmed, setConfirmed] = useState(null);

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
      toast.success('Review submitted! Thank you.');
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
      const fee = selectedDoctor.consultationFee || 0;

      if (form.paymentMode === 'CASH') {
        await bookSlot(selectedSlot.slotId);
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
        toast.success('Appointment booked successfully!');
        setBookingLoading(false);
        return;
      }

      // For online payment — create order first, book appointment ONLY after payment
      const order = await createRazorpayOrder(fee, 0);

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
            await verifyRazorpayPayment({
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });

            // Book slot and appointment AFTER successful payment
            await bookSlot(selectedSlot.slotId);
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
            toast.success('Payment successful! Appointment confirmed.');
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
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#2C2825' }}>Appointments</h2>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '2rem' }}>
        {['list', 'book'].map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); if (tab === 'book') resetBooking(); }}
            className="btn"
            style={{
              backgroundColor: activeTab === tab ? '#2D6B6B' : '#F2EDE4',
              color: activeTab === tab ? 'white' : '#8C7E72',
              padding: '10px 24px',
              border: activeTab === tab ? 'none' : '1px solid #E2D9CE'
            }}>
            {tab === 'list' ? 'My Appointments' : '+ Book New'}
          </button>
        ))}
      </div>

      {/* ── MY APPOINTMENTS ── */}
      {activeTab === 'list' && (
        <div>
          {loadingAppointments && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#8C7E72' }}>Loading...</div>
          )}
          {!loadingAppointments && appointments.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '3rem',
              backgroundColor: 'white', borderRadius: '12px',
              color: '#8C7E72', border: '1px solid #E2D9CE'
            }}>
              <p style={{ fontWeight: '600', color: '#2C2825', marginBottom: '1rem' }}>No appointments yet.</p>
              <button className="btn btn-primary" style={{ padding: '8px 16px' }}
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
                              <span style={{ fontSize: '12px', color: '#3D7A5A', fontWeight: '600' }}>
                                Reviewed
                              </span>
                            ) : (
                              <button
                                className="btn"
                                style={{
                                  padding: '6px 12px', fontSize: '12px',
                                  backgroundColor: '#FDF6E8', color: '#9A7230',
                                  border: '1px solid #E8C87A'
                                }}
                                onClick={() => {
                                  setReviewAppointment(appt);
                                  setReviewForm({ rating: 5, comment: '' });
                                  setShowReviewModal(true);
                                }}
                              >
                                Write Review
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

          {/* Stepper */}
          {step < 4 && (
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '8px' }}>
              {STEPS.map((label, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    backgroundColor: index <= step ? '#2D6B6B' : '#E2D9CE',
                    color: index <= step ? 'white' : '#8C7E72',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '700', fontSize: '14px', flexShrink: 0
                  }}>
                    {index + 1}
                  </div>
                  <span style={{
                    marginLeft: '6px', fontSize: '13px',
                    color: index <= step ? '#2D6B6B' : '#8C7E72',
                    fontWeight: index === step ? '600' : '400'
                  }}>
                    {label}
                  </span>
                  {index < STEPS.length - 1 && (
                    <div style={{
                      width: '32px', height: '2px',
                      backgroundColor: index < step ? '#2D6B6B' : '#E2D9CE',
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
              <h3 style={{ marginBottom: '0.5rem', color: '#2C2825', fontSize: '18px' }}>
                Select a Specialization
              </h3>
              <p style={{ color: '#8C7E72', fontSize: '13px', marginBottom: '1.5rem' }}>
                Choose the type of doctor you need
              </p>
              {specializations.length === 0 && (
                <p style={{ color: '#8C7E72' }}>No specializations available. Please contact admin.</p>
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
                      border: '2px solid #E2D9CE', borderRadius: '12px',
                      padding: '1.5rem 1.2rem', cursor: 'pointer',
                      textAlign: 'center', transition: 'all 0.15s',
                      backgroundColor: 'white'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#2D6B6B';
                      e.currentTarget.style.backgroundColor = '#E8F4F4';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = '#E2D9CE';
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    <p style={{ fontWeight: '700', color: '#2C2825', fontSize: '14px' }}>
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
                  style={{ backgroundColor: '#F2EDE4', color: '#8C7E72', padding: '8px 12px', border: '1px solid #E2D9CE' }}
                  onClick={() => { setStep(0); setSelectedSpec(null); setDoctors([]); }}>
                  Back
                </button>
                <div>
                  <h3 style={{ color: '#2C2825', fontSize: '18px', fontWeight: '700' }}>
                    {selectedSpec?.name} Doctors
                  </h3>
                  <p style={{ color: '#8C7E72', fontSize: '13px' }}>
                    {doctors.length} doctor(s) available
                  </p>
                </div>
              </div>

              {doctors.length === 0 && (
                <div style={{
                  textAlign: 'center', padding: '3rem',
                  backgroundColor: 'white', borderRadius: '12px',
                  color: '#8C7E72', border: '1px solid #E2D9CE'
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <svg width="64" height="72" viewBox="0 0 130 150" style={{ opacity: 0.3 }}>
                      <circle cx="65" cy="48" r="30" fill="#2D6B6B"/>
                      <path d="M0 148 Q0 88 65 88 Q130 88 130 148 Z" fill="#2D6B6B"/>
                    </svg>
                  </div>
                  <p style={{ fontWeight: '600', color: '#2C2825' }}>No doctors available for {selectedSpec?.name}</p>
                  <p style={{ fontSize: '13px', marginTop: '4px' }}>Try a different specialization</p>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {doctors.map(doctor => (
                  <div
                    key={doctor.providerId}
                    className="card"
                    style={{
                      border: '2px solid #E2D9CE', cursor: 'pointer',
                      transition: 'all 0.15s', display: 'flex',
                      alignItems: 'center', gap: '1rem'
                    }}
                    onClick={() => handleSelectDoctor(doctor)}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#2D6B6B';
                      e.currentTarget.style.backgroundColor = '#F8FBF8';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = '#E2D9CE';
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
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
                        <svg width="34" height="38" viewBox="0 0 130 150">
                          <circle cx="65" cy="48" r="30" fill="rgba(45,107,107,0.6)"/>
                          <path d="M0 148 Q0 88 65 88 Q130 88 130 148 Z" fill="rgba(45,107,107,0.6)"/>
                        </svg>
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#2C2825', marginBottom: '2px' }}>
                        Dr. {doctor.doctorName || `Provider #${doctor.providerId}`}
                      </h3>
                      <p style={{ color: '#2D6B6B', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
                        {doctor.specialization}
                      </p>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#5C524A', flexWrap: 'wrap' }}>
                        {doctor.clinicName && <span>{doctor.clinicName}</span>}
                        {doctor.clinicAddress && <span>{doctor.clinicAddress}</span>}
                        {doctor.experienceYears > 0 && <span>{doctor.experienceYears} yrs exp</span>}
                        <span>{doctor.qualification || 'MBBS'}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: '20px', fontWeight: '800', color: '#3D7A5A' }}>
                        ₹{doctor.consultationFee || 0}
                      </p>
                      <p style={{ fontSize: '11px', color: '#8C7E72' }}>consultation fee</p>
                      <p style={{ fontSize: '20px', color: '#2D6B6B', marginTop: '4px' }}>›</p>
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
                  style={{ backgroundColor: '#F2EDE4', color: '#8C7E72', padding: '8px 12px', border: '1px solid #E2D9CE' }}
                  onClick={() => { setStep(1); setSelectedDoctor(null); setSlots([]); }}>
                  Back
                </button>
                <div>
                  <h3 style={{ color: '#2C2825', fontSize: '18px', fontWeight: '700' }}>
                    Dr. {selectedDoctor?.doctorName || `Provider #${selectedDoctor?.providerId}`}
                  </h3>
                  <p style={{ color: '#8C7E72', fontSize: '13px' }}>
                    {selectedDoctor?.specialization} · {selectedDoctor?.clinicName}
                  </p>
                </div>
              </div>

              {/* Doctor summary card */}
              <div style={{
                backgroundColor: '#E8F4F4', border: '1px solid #B8DADA',
                borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: '8px'
              }}>
                <div style={{ fontSize: '13px', color: '#2D6B6B' }}>
                  <span>{selectedDoctor?.qualification}</span>
                  <span style={{ margin: '0 12px' }}>{selectedDoctor?.experienceYears} yrs exp</span>
                  <span>{selectedDoctor?.clinicAddress}</span>
                </div>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#3D7A5A' }}>
                  ₹{selectedDoctor?.consultationFee || 0}
                </span>
              </div>

              {/* Filter by date */}
              <div style={{
                backgroundColor: '#FAF7F2', border: '1px solid #E2D9CE',
                borderRadius: '10px', padding: '1rem', marginBottom: '1.2rem'
              }}>
                <p style={{ fontSize: '13px', color: '#8C7E72', marginBottom: '10px', fontWeight: '600' }}>
                  Filter by date:
                </p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                  <input
                    type="date" min={today} value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    style={{
                      flex: 1, padding: '10px 12px',
                      border: '1.5px solid #E2D9CE', borderRadius: '8px',
                      fontSize: '14px', outline: 'none', fontFamily: 'inherit',
                      backgroundColor: '#FAFAF8'
                    }}
                  />
                  <button className="btn btn-primary"
                    style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}
                    onClick={fetchSlotsByDate}
                    disabled={!selectedDate || loadingSlots}>
                    Check
                  </button>
                  <button className="btn"
                    style={{ padding: '10px 14px', backgroundColor: '#F2EDE4', color: '#8C7E72', whiteSpace: 'nowrap', border: '1px solid #E2D9CE' }}
                    onClick={() => { setSelectedDate(''); fetchAllSlots(selectedDoctor.providerId); }}
                    disabled={loadingSlots}>
                    Show All
                  </button>
                </div>
              </div>

              {loadingSlots && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#8C7E72' }}>
                  Loading slots...
                </div>
              )}

              {!loadingSlots && slots.length === 0 && (
                <div style={{
                  textAlign: 'center', padding: '2rem',
                  backgroundColor: 'white', borderRadius: '10px',
                  color: '#8C7E72', border: '1px solid #E2D9CE'
                }}>
                  No available slots. Try a different date.
                </div>
              )}

              {/* Slots grouped by date */}
              {!loadingSlots && Object.keys(slotsByDate).map(date => (
                <div key={date} style={{ marginBottom: '1.2rem' }}>
                  <p style={{
                    fontSize: '13px', fontWeight: '700', color: '#5C524A',
                    marginBottom: '8px', padding: '6px 12px',
                    backgroundColor: '#F2EDE4', borderRadius: '6px',
                    display: 'inline-block', border: '1px solid #E2D9CE'
                  }}>
                    {formatDate(date)}
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
                            borderColor: isSelected ? '#2D6B6B' : '#E2D9CE',
                            backgroundColor: isSelected ? '#2D6B6B' : 'white',
                            color: isSelected ? 'white' : '#5C524A',
                            fontWeight: '600', fontSize: '13px',
                            cursor: 'pointer', transition: 'all 0.15s',
                            fontFamily: 'inherit'
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
                  backgroundColor: '#EBF5EF', border: '1px solid #B8D8C6',
                  borderRadius: '8px', display: 'flex',
                  justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span style={{ fontSize: '14px', color: '#3D7A5A', fontWeight: '600' }}>
                    Selected: {formatDate(selectedSlot.date)} · {selectedSlot.startTime} - {selectedSlot.endTime}
                  </span>
                  <button className="btn btn-primary"
                    style={{ padding: '10px 24px' }}
                    onClick={() => setStep(3)}>
                    Continue
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
                  style={{ backgroundColor: '#F2EDE4', color: '#8C7E72', padding: '8px 12px', border: '1px solid #E2D9CE' }}
                  onClick={() => setStep(2)}>
                  Back
                </button>
                <h3 style={{ color: '#2C2825', fontSize: '18px', fontWeight: '700' }}>
                  Review & Confirm
                </h3>
              </div>

              {/* Booking summary */}
              <div style={{
                backgroundColor: '#FAF7F2', border: '1px solid #E2D9CE',
                borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem'
              }}>
                <p style={{ fontWeight: '700', color: '#2C2825', marginBottom: '10px', fontSize: '15px' }}>
                  Booking Summary
                </p>
                <div style={{ fontSize: '14px', color: '#5C524A' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Doctor</span>
                    <span style={{ fontWeight: '600', color: '#2C2825' }}>
                      Dr. {selectedDoctor?.doctorName || `#${selectedDoctor?.providerId}`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Specialization</span>
                    <span style={{ fontWeight: '600', color: '#2D6B6B' }}>{selectedDoctor?.specialization}</span>
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
                    borderTop: '1px solid #E2D9CE'
                  }}>
                    <span style={{ fontWeight: '700' }}>Consultation Fee</span>
                    <span style={{ fontWeight: '800', fontSize: '18px', color: '#3D7A5A' }}>
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
                  <option value="IN_PERSON">In Person</option>
                  <option value="TELECONSULTATION">Teleconsultation</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notes (optional)</label>
                <textarea
                  rows={3}
                  placeholder="Describe your symptoms..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Payment Mode</label>
                <select
                  value={form.paymentMode}
                  onChange={e => setForm({ ...form, paymentMode: e.target.value })}
                >
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="UPI">UPI</option>
                  <option value="WALLET">Wallet</option>
                  <option value="CASH">Cash (Pay at clinic)</option>
                </select>
              </div>

              <button
                className="btn btn-success"
                style={{ width: '100%', padding: '14px', fontSize: '15px', marginTop: '0.5rem' }}
                onClick={handleBooking}
                disabled={bookingLoading}
              >
                {bookingLoading ? 'Processing...' : `Confirm Booking & Pay ₹${selectedDoctor?.consultationFee || 0}`}
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
                  backgroundColor: '#EBF5EF', border: '4px solid #3D7A5A',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
                    stroke="#3D7A5A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>

                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#3D7A5A', marginBottom: '4px' }}>
                  Appointment Confirmed!
                </h2>
                <p style={{ color: '#8C7E72', fontSize: '14px', marginBottom: '1.5rem' }}>
                  Your appointment has been booked successfully
                </p>

                {/* Details */}
                <div style={{
                  backgroundColor: '#FAF7F2', border: '1px solid #E2D9CE',
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
                        <svg width="26" height="30" viewBox="0 0 130 150">
                          <circle cx="65" cy="48" r="30" fill="rgba(45,107,107,0.6)"/>
                          <path d="M0 148 Q0 88 65 88 Q130 88 130 148 Z" fill="rgba(45,107,107,0.6)"/>
                        </svg>
                      )}
                    </div>
                    <div>
                      <p style={{ fontWeight: '700', color: '#2C2825' }}>
                        Dr. {selectedDoctor?.doctorName || `Provider #${selectedDoctor?.providerId}`}
                      </p>
                      <p style={{ color: '#2D6B6B', fontSize: '13px' }}>{selectedDoctor?.specialization}</p>
                    </div>
                  </div>

                  <div style={{ fontSize: '14px', color: '#5C524A' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span>Clinic</span>
                      <span style={{ fontWeight: '600' }}>{selectedDoctor?.clinicName}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span>Date</span>
                      <span style={{ fontWeight: '600' }}>{formatDate(confirmed.appointmentDate)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span>Time</span>
                      <span style={{ fontWeight: '600' }}>{confirmed.startTime} - {confirmed.endTime}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span>Booking ID</span>
                      <span style={{ fontWeight: '600', color: '#2D6B6B' }}>APT{confirmed.appointmentId}</span>
                    </div>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      paddingTop: '8px', borderTop: '1px solid #E2D9CE', marginTop: '8px'
                    }}>
                      <span style={{ fontWeight: '700' }}>Amount Paid</span>
                      <span style={{ fontWeight: '800', color: '#3D7A5A', fontSize: '16px' }}>
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
                    View My Appointments
                  </button>
                  <button
                    className="btn"
                    style={{ flex: 1, padding: '12px', backgroundColor: '#F2EDE4', color: '#8C7E72', border: '1px solid #E2D9CE' }}
                    onClick={() => { resetBooking(); }}
                  >
                    + Book Another
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
          backgroundColor: 'rgba(26,21,17,0.6)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '1rem',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#FAF7F2', borderRadius: '20px',
            width: '100%', maxWidth: '480px',
            boxShadow: '0 16px 48px rgba(26,21,17,0.3)'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1F4E4E, #2D6B6B)',
              padding: '1.5rem 2rem', borderRadius: '20px 20px 0 0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'white' }}>
                  Write a Review
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginTop: '2px' }}>
                  Appointment #{reviewAppointment.appointmentId}
                </p>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
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
              <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                <p style={{
                  fontSize: '13px', fontWeight: '600',
                  color: '#5C524A', marginBottom: '10px'
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
                        color: star <= reviewForm.rating ? '#C9963F' : '#E2D9CE',
                        transition: 'color 0.15s', padding: '0'
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <p style={{
                  fontSize: '14px', fontWeight: '700',
                  color: '#C9963F', marginTop: '8px'
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
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '12px' }}
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
                <button
                  className="btn"
                  style={{
                    flex: 1, padding: '12px',
                    backgroundColor: '#F2EDE4', color: '#8C7E72',
                    border: '1px solid #E2D9CE'
                  }}
                  onClick={() => setShowReviewModal(false)}
                  disabled={submittingReview}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientAppointments;
