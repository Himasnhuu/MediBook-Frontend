import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getPaymentsByPatient, refundPayment } from '../../api/paymentApi';
import { sendPaymentRefundedNotification } from '../../api/notificationApi';

const PatientPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refundingId, setRefundingId] = useState(null);
  const patientId = localStorage.getItem('userId');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await getPaymentsByPatient(patientId);
      setPayments(data);
    } catch (err) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (paymentId) => {
    if (!window.confirm('Request a refund for this payment?')) return;
    setRefundingId(paymentId);
    try {
      await refundPayment(paymentId);
      await sendPaymentRefundedNotification({
        userId: String(patientId),
        recipientEmail: localStorage.getItem('email'),
        amount: String(payments.find(p => p.paymentId === paymentId)?.amount || 0),
        transactionId: payments.find(p => p.paymentId === paymentId)?.transactionId || ''
      });
      toast.success('Refund processed successfully');
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data || 'Refund failed');
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
      PAID:     'badge-success',
      PENDING:  'badge-warning',
      REFUNDED: 'badge-info',
      FAILED:   'badge-danger'
    };
    return map[status] || 'badge-info';
  };

  const getStatusIcon = (status) => {
    const map = {
      PAID:     '✅',
      PENDING:  '⏳',
      REFUNDED: '↩️',
      FAILED:   '❌'
    };
    return map[status] || '•';
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
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
          My Payments
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
          View your payment history and request refunds
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
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
            backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0'
          }}>
            <p style={{ fontSize: '12px', color: '#16a34a', fontWeight: '700',
              textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Total Paid
            </p>
            <p style={{ fontSize: '28px', fontWeight: '800', color: '#15803d', marginTop: '6px' }}>
              ₹{totalPaid.toFixed(2)}
            </p>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              {payments.filter(p => p.status === 'PAID').length} transaction(s)
            </p>
          </div>

          <div className="card" style={{
            backgroundColor: '#eff6ff', border: '1px solid #bfdbfe'
          }}>
            <p style={{ fontSize: '12px', color: '#2563eb', fontWeight: '700',
              textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Total Refunded
            </p>
            <p style={{ fontSize: '28px', fontWeight: '800', color: '#1d4ed8', marginTop: '6px' }}>
              ₹{totalRefunded.toFixed(2)}
            </p>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              {payments.filter(p => p.status === 'REFUNDED').length} refund(s)
            </p>
          </div>

          <div className="card" style={{
            backgroundColor: '#fafafa', border: '1px solid #e2e8f0'
          }}>
            <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '700',
              textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Total Transactions
            </p>
            <p style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', marginTop: '6px' }}>
              {payments.length}
            </p>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
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
          color: '#64748b'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>💳</div>
          <p style={{ fontSize: '16px', fontWeight: '600' }}>No payments yet</p>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>
            Your payment history will appear here after booking appointments
          </p>
        </div>
      )}

      {/* Payments table */}
      {!loading && payments.length > 0 && (
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
                  <td style={{ fontWeight: '700', color: '#1e293b' }}>
                    ₹{payment.amount?.toFixed(2)}
                  </td>
                  <td>{payment.mode}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(payment.status)}`}>
                      {getStatusIcon(payment.status)} {payment.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                    {payment.transactionId
                      ? payment.transactionId.substring(0, 16) + '...'
                      : '—'}
                  </td>
                  <td style={{ fontSize: '12px' }}>
                    {formatDate(payment.paidAt)}
                  </td>
                  <td>
                    {payment.status === 'PAID' && (
                      <button
                        className="btn btn-warning"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => handleRefund(payment.paymentId)}
                        disabled={refundingId === payment.paymentId}
                      >
                        {refundingId === payment.paymentId ? '...' : '↩️ Refund'}
                      </button>
                    )}
                    {payment.status === 'REFUNDED' && (
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        Refunded {formatDate(payment.refundedAt)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PatientPayments;
