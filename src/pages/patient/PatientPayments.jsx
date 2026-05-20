import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getPaymentsByPatient, requestRefund } from '../../api/paymentApi';
import { getAppointmentsByPatient } from '../../api/appointmentApi';
import { getAllProviders } from '../../api/providerApi';
import { sendPaymentRefundedNotification } from '../../api/notificationApi';

const PatientPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refundingId, setRefundingId] = useState(null);
  const [appointmentsMap, setAppointmentsMap] = useState({});
  const [providersMap, setProvidersMap] = useState({});
  const [selectedPayment, setSelectedPayment] = useState(null);
  const patientId = localStorage.getItem('userId');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const [data, appointments, providers] = await Promise.all([
        getPaymentsByPatient(patientId),
        getAppointmentsByPatient(patientId),
        getAllProviders()
      ]);
      setPayments(data);
      const map = {};
      appointments.forEach(a => { map[a.appointmentId] = a; });
      setAppointmentsMap(map);
      const provMap = {};
      providers.forEach(p => { provMap[p.providerId] = p; });
      setProvidersMap(provMap);
    } catch (err) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (paymentId) => {
    if (!window.confirm('Request a refund? This will be reviewed by admin.')) return;
    setRefundingId(paymentId);
    try {
      await requestRefund(paymentId);
      await sendPaymentRefundedNotification({
        userId: String(patientId),
        recipientEmail: localStorage.getItem('email'),
        amount: String(payments.find(p => p.paymentId === paymentId)?.amount || 0),
        transactionId: payments.find(p => p.paymentId === paymentId)?.transactionId || ''
      });
      toast.success('Refund request submitted. Admin will review shortly.');
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data || 'Refund request failed');
    } finally {
      setRefundingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const map = {
      PAID:              'badge-success',
      PENDING:           'badge-warning',
      REFUNDED:          'badge-info',
      REFUND_REQUESTED:  'badge-warning',
      REFUND_REJECTED:   'badge-danger',
      FAILED:            'badge-danger'
    };
    return map[status] || 'badge-info';
  };

  const totalPaid = payments
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalRefunded = payments
    .filter(p => p.status === 'REFUNDED')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#2C2825' }}>
          My Payments
        </h2>
        <p style={{ color: '#8C7E72', fontSize: '14px', marginTop: '4px' }}>
          View your payment history and request refunds
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#8C7E72' }}>
          Loading payments...
        </div>
      )}

      {/* Summary cards */}
      {!loading && payments.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div className="card" style={{
            backgroundColor: '#EBF5EF', border: '1px solid #B8D8C6'
          }}>
            <p style={{ fontSize: '12px', color: '#3D7A5A', fontWeight: '700',
              textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Total Paid
            </p>
            <p style={{ fontSize: '28px', fontWeight: '800', color: '#2D5A42', marginTop: '6px' }}>
              ₹{totalPaid.toFixed(2)}
            </p>
            <p style={{ fontSize: '12px', color: '#8C7E72', marginTop: '4px' }}>
              {payments.filter(p => p.status === 'PAID').length} transaction(s)
            </p>
          </div>

          <div className="card" style={{
            backgroundColor: '#E8F4F4', border: '1px solid #B8DADA'
          }}>
            <p style={{ fontSize: '12px', color: '#2D6B6B', fontWeight: '700',
              textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Total Refunded
            </p>
            <p style={{ fontSize: '28px', fontWeight: '800', color: '#1F4E4E', marginTop: '6px' }}>
              ₹{totalRefunded.toFixed(2)}
            </p>
            <p style={{ fontSize: '12px', color: '#8C7E72', marginTop: '4px' }}>
              {payments.filter(p => p.status === 'REFUNDED').length} refund(s)
            </p>
          </div>

          <div className="card" style={{
            backgroundColor: '#FFFFFF', border: '1px solid #E2D9CE'
          }}>
            <p style={{ fontSize: '12px', color: '#8C7E72', fontWeight: '700',
              textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Total Transactions
            </p>
            <p style={{ fontSize: '28px', fontWeight: '800', color: '#2C2825', marginTop: '6px' }}>
              {payments.length}
            </p>
            <p style={{ fontSize: '12px', color: '#8C7E72', marginTop: '4px' }}>
              all time
            </p>
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && payments.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '3rem',
          backgroundColor: 'white', borderRadius: '12px',
          color: '#8C7E72', border: '1px solid #E2D9CE'
        }}>
          <p style={{ fontSize: '16px', fontWeight: '600', color: '#2C2825' }}>No payments yet</p>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>
            Your payment history will appear here after booking appointments
          </p>
        </div>
      )}

      {/* Payments table */}
      {!loading && payments.length > 0 && (
        <div className="table-wrap">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Doctor</th>
                <th>Appt. Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.paymentId}
                    onClick={() => setSelectedPayment(payment)}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8F5F0'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                  <td>#{payment.paymentId}</td>
                  <td>
                    <p style={{ fontWeight: '600', color: '#2C2825', fontSize: '13px', margin: 0 }}>
                      Dr. {providersMap[appointmentsMap[payment.appointmentId]?.providerId]?.doctorName || '—'}
                    </p>
                    <p style={{ color: '#2D6B6B', fontSize: '12px', margin: 0 }}>
                      {providersMap[appointmentsMap[payment.appointmentId]?.providerId]?.specialization || '—'}
                    </p>
                  </td>
                  <td style={{ fontSize: '12px', color: '#5C524A' }}>
                    {appointmentsMap[payment.appointmentId]?.appointmentDate || '—'}
                  </td>
                  <td style={{ fontWeight: '700', color: '#2C2825' }}>
                    ₹{payment.amount?.toFixed(2)}
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadge(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {selectedPayment && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(26,21,17,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, backdropFilter: 'blur(4px)'
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
                <h3 style={{ color: 'white', fontWeight: '800', fontSize: '17px', marginBottom: '2px' }}>
                  Payment #{selectedPayment.paymentId}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
                  Dr. {providersMap[appointmentsMap[selectedPayment.appointmentId]?.providerId]?.doctorName || '—'}
                  {' · '}
                  {providersMap[appointmentsMap[selectedPayment.appointmentId]?.providerId]?.specialization || '—'}
                </p>
              </div>
              <button onClick={() => setSelectedPayment(null)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none',
                  borderRadius: '8px', width: '34px', height: '34px',
                  color: 'white', fontSize: '16px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '1.5rem 2rem' }}>
              {[
                { label: 'Appointment Date', value: appointmentsMap[selectedPayment.appointmentId]?.appointmentDate || '—' },
                { label: 'Amount', value: `₹${selectedPayment.amount?.toFixed(2)}` },
                { label: 'Mode', value: selectedPayment.mode },
                { label: 'Status', value: selectedPayment.status },
                { label: 'Transaction ID', value: selectedPayment.transactionId || '—' },
                { label: 'Paid At', value: formatDate(selectedPayment.paidAt) },
                { label: 'Refunded At', value: selectedPayment.refundedAt ? formatDate(selectedPayment.refundedAt) : '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: '1px solid #E2D9CE' }}>
                  <span style={{ color: '#8C7E72', fontSize: '13px' }}>{label}</span>
                  <span style={{ fontWeight: '600', color: '#2C2825', fontSize: '13px' }}>{value}</span>
                </div>
              ))}
              <button className="btn" onClick={() => setSelectedPayment(null)}
                style={{ width: '100%', marginTop: '1rem', padding: '12px',
                  backgroundColor: '#F2EDE4', color: '#8C7E72', border: '1px solid #E2D9CE' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientPayments;
