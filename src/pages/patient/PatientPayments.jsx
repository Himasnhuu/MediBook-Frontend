import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getPaymentsByPatient, requestRefund } from '../../api/paymentApi';
import { getAppointmentsByPatient } from '../../api/appointmentApi';
import { sendPaymentRefundedNotification } from '../../api/notificationApi';

const PatientPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refundingId, setRefundingId] = useState(null);
  const [appointmentsMap, setAppointmentsMap] = useState({});
  const patientId = localStorage.getItem('userId');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const [data, appointments] = await Promise.all([
        getPaymentsByPatient(patientId),
        getAppointmentsByPatient(patientId)
      ]);
      setPayments(data);
      const map = {};
      appointments.forEach(a => { map[a.appointmentId] = a; });
      setAppointmentsMap(map);
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
                <th>Appointment</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>Status</th>
                <th>Transaction ID</th>
                <th>Paid At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.paymentId}>
                  <td>#{payment.paymentId}</td>
                  <td>#{payment.appointmentId}</td>
                  <td style={{ fontWeight: '700', color: '#2C2825' }}>
                    ₹{payment.amount?.toFixed(2)}
                  </td>
                  <td style={{ color: '#5C524A' }}>{payment.mode}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '11px', color: '#8C7E72', fontFamily: 'monospace' }}>
                    {payment.transactionId
                      ? payment.transactionId.substring(0, 16) + '...'
                      : '—'}
                  </td>
                  <td style={{ fontSize: '12px', color: '#5C524A' }}>
                    {formatDate(payment.paidAt)}
                  </td>
                  <td>
                    {payment.status === 'PAID' &&
                     appointmentsMap[payment.appointmentId]?.status !== 'COMPLETED' && (
                      <button
                        className="btn btn-warning"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => handleRefund(payment.paymentId)}
                        disabled={refundingId === payment.paymentId}
                      >
                        {refundingId === payment.paymentId ? 'Processing...' : 'Request Refund'}
                      </button>
                    )}
                    {payment.status === 'PAID' &&
                     appointmentsMap[payment.appointmentId]?.status === 'COMPLETED' && (
                      <span style={{ fontSize: '12px', color: '#8C7E72' }}>
                        Non-refundable
                      </span>
                    )}
                    {payment.status === 'REFUND_REQUESTED' && (
                      <span style={{ fontSize: '12px', color: '#9A7230', fontWeight: '600' }}>
                        Pending Admin Approval
                      </span>
                    )}
                    {payment.status === 'REFUNDED' && (
                      <span style={{ fontSize: '12px', color: '#8C7E72' }}>
                        Refunded {formatDate(payment.refundedAt)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      )}
    </div>
  );
};

export default PatientPayments;
