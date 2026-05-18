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

  const totalPaid     = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + (p.amount || 0), 0);
  const totalRefunded = payments.filter(p => p.status === 'REFUNDED').reduce((s, p) => s + (p.amount || 0), 0);
  const totalPending  = payments.filter(p => p.status === 'PENDING').reduce((s, p) => s + (p.amount || 0), 0);

  const filtered = filterStatus === 'ALL'
    ? payments
    : payments.filter(p => p.status === filterStatus);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#2C2825' }}>
          Earnings
        </h2>
        <p style={{ color: '#8C7E72', fontSize: '14px', marginTop: '4px' }}>
          Track your revenue and payment history
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#8C7E72' }}>
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
            <div className="card" style={{ backgroundColor: '#EBF5EF', border: '1px solid #B8D8C6' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#3D7A5A', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Net Revenue
              </p>
              <p style={{ fontSize: '32px', fontWeight: '800', color: '#2D5A42', marginTop: '6px' }}>
                ₹{totalRevenue?.toFixed(2) || '0.00'}
              </p>
              <p style={{ fontSize: '12px', color: '#8C7E72', marginTop: '4px' }}>
                from backend calculation
              </p>
            </div>

            <div className="card" style={{ backgroundColor: '#E8F4F4', border: '1px solid #B8DADA' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#2D6B6B', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Total Collected
              </p>
              <p style={{ fontSize: '28px', fontWeight: '800', color: '#1F4E4E', marginTop: '6px' }}>
                ₹{totalPaid.toFixed(2)}
              </p>
              <p style={{ fontSize: '12px', color: '#8C7E72', marginTop: '4px' }}>
                {payments.filter(p => p.status === 'PAID').length} payment(s)
              </p>
            </div>

            <div className="card" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2D9CE' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#8C7E72', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Refunded
              </p>
              <p style={{ fontSize: '28px', fontWeight: '800', color: '#5C524A', marginTop: '6px' }}>
                ₹{totalRefunded.toFixed(2)}
              </p>
              <p style={{ fontSize: '12px', color: '#8C7E72', marginTop: '4px' }}>
                {payments.filter(p => p.status === 'REFUNDED').length} refund(s)
              </p>
            </div>

            <div className="card" style={{ backgroundColor: '#FDF6E8', border: '1px solid #E8C87A' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#9A7230', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Pending
              </p>
              <p style={{ fontSize: '28px', fontWeight: '800', color: '#7A5C1E', marginTop: '6px' }}>
                ₹{totalPending.toFixed(2)}
              </p>
              <p style={{ fontSize: '12px', color: '#8C7E72', marginTop: '4px' }}>
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
                  backgroundColor: filterStatus === s ? '#2D6B6B' : '#F2EDE4',
                  color: filterStatus === s ? 'white' : '#8C7E72',
                  padding: '8px 16px', fontSize: '13px',
                  border: filterStatus === s ? 'none' : '1px solid #E2D9CE'
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
              backgroundColor: 'white', borderRadius: '12px',
              color: '#8C7E72', border: '1px solid #E2D9CE'
            }}>
              <p style={{ fontSize: '16px', fontWeight: '600', color: '#2C2825' }}>No payments found</p>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>
                Earnings will appear here once patients book and pay for appointments
              </p>
            </div>
          )}

          {/* Payments table */}
          {filtered.length > 0 && (
            <div className="table-wrap">
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
                      <td style={{ fontWeight: '700', color: '#3D7A5A' }}>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Earnings;
