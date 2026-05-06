import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getProviderRevenue, getPaymentsByProvider } from '../../api/paymentApi';

const Earnings = () => {
  const [payments, setPayments] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const providerId = localStorage.getItem('providerId');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [paymentsData, revenue] = await Promise.all([
        getPaymentsByProvider(providerId),
        getProviderRevenue(providerId)
      ]);
      setPayments(paymentsData);
      setTotalRevenue(revenue);
    } catch (err) {
      toast.error('Failed to load earnings data');
    } finally {
      setLoading(false);
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

  // Summary calculations
  const totalPaid      = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + (p.amount || 0), 0);
  const totalRefunded  = payments.filter(p => p.status === 'REFUNDED').reduce((s, p) => s + (p.amount || 0), 0);
  const totalPending   = payments.filter(p => p.status === 'PENDING').reduce((s, p) => s + (p.amount || 0), 0);

  const filtered = filterStatus === 'ALL'
    ? payments
    : payments.filter(p => p.status === filterStatus);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
          Earnings
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
          Track your revenue and payment history
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          Loading earnings...
        </div>
      )}

      {!loading && (
        <>
          {/* Summary cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1rem', marginBottom: '2rem'
          }}>
            {/* Net Revenue — from backend */}
            <div className="card" style={{
              backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
              gridColumn: 'span 1'
            }}>
              <p style={{
                fontSize: '11px', fontWeight: '700', color: '#16a34a',
                textTransform: 'uppercase', letterSpacing: '0.8px'
              }}>
                Net Revenue
              </p>
              <p style={{ fontSize: '32px', fontWeight: '800', color: '#15803d', marginTop: '6px' }}>
                ₹{totalRevenue?.toFixed(2) || '0.00'}
              </p>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                from backend calculation
              </p>
            </div>

            {/* Total Paid */}
            <div className="card" style={{
              backgroundColor: '#eff6ff', border: '1px solid #bfdbfe'
            }}>
              <p style={{
                fontSize: '11px', fontWeight: '700', color: '#2563eb',
                textTransform: 'uppercase', letterSpacing: '0.8px'
              }}>
                Total Collected
              </p>
              <p style={{ fontSize: '28px', fontWeight: '800', color: '#1d4ed8', marginTop: '6px' }}>
                ₹{totalPaid.toFixed(2)}
              </p>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                {payments.filter(p => p.status === 'PAID').length} payment(s)
              </p>
            </div>

            {/* Refunded */}
            <div className="card" style={{
              backgroundColor: '#fafafa', border: '1px solid #e2e8f0'
            }}>
              <p style={{
                fontSize: '11px', fontWeight: '700', color: '#64748b',
                textTransform: 'uppercase', letterSpacing: '0.8px'
              }}>
                Refunded
              </p>
              <p style={{ fontSize: '28px', fontWeight: '800', color: '#475569', marginTop: '6px' }}>
                ₹{totalRefunded.toFixed(2)}
              </p>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                {payments.filter(p => p.status === 'REFUNDED').length} refund(s)
              </p>
            </div>

            {/* Pending */}
            <div className="card" style={{
              backgroundColor: '#fefce8', border: '1px solid #fde68a'
            }}>
              <p style={{
                fontSize: '11px', fontWeight: '700', color: '#ca8a04',
                textTransform: 'uppercase', letterSpacing: '0.8px'
              }}>
                Pending
              </p>
              <p style={{ fontSize: '28px', fontWeight: '800', color: '#92400e', marginTop: '6px' }}>
                ₹{totalPending.toFixed(2)}
              </p>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                {payments.filter(p => p.status === 'PENDING').length} pending
              </p>
            </div>
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {['ALL', 'PAID', 'REFUNDED', 'PENDING', 'FAILED'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="btn"
                style={{
                  backgroundColor: filterStatus === s ? '#0f766e' : '#f1f5f9',
                  color: filterStatus === s ? 'white' : '#64748b',
                  padding: '8px 16px', fontSize: '13px'
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Empty */}
          {filtered.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '3rem',
              backgroundColor: 'white', borderRadius: '12px', color: '#64748b'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>💰</div>
              <p style={{ fontSize: '16px', fontWeight: '600' }}>No payments found</p>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>
                Earnings will appear here once patients book and pay for appointments
              </p>
            </div>
          )}

          {/* Payments table */}
          {filtered.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table>
                <thead>
                  <tr>
                    <th>Payment ID</th>
                    <th>Appointment</th>
                    <th>Patient ID</th>
                    <th>Amount</th>
                    <th>Mode</th>
                    <th>Status</th>
                    <th>Transaction ID</th>
                    <th>Paid At</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(payment => (
                    <tr key={payment.paymentId}>
                      <td>#{payment.paymentId}</td>
                      <td>#{payment.appointmentId}</td>
                      <td>#{payment.patientId}</td>
                      <td style={{ fontWeight: '700', color: '#15803d' }}>
                        ₹{payment.amount?.toFixed(2)}
                      </td>
                      <td>{payment.mode}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(payment.status)}`}>
                          {getStatusIcon(payment.status)} {payment.status}
                        </span>
                      </td>
                      <td style={{
                        fontSize: '11px', color: '#94a3b8',
                        fontFamily: 'monospace'
                      }}>
                        {payment.transactionId
                          ? payment.transactionId.substring(0, 16) + '...'
                          : '—'}
                      </td>
                      <td style={{ fontSize: '12px' }}>
                        {formatDate(payment.paidAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Earnings;