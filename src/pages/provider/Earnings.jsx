import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getProviderRevenue, getPaymentsByProvider } from '../../api/paymentApi';
import { getAppointmentsByProvider } from '../../api/appointmentApi';
import { getAllUsers } from '../../api/authApi';

const STATUS_LABEL = {
  PAID:              'Successful',
  PENDING:           'Pending',
  REFUNDED:          'Refunded',
  REFUND_REQUESTED:  'Refund Requested',
  REFUND_REJECTED:   'Refund Failed',
  FAILED:            'Failed',
};

const STATUS_BADGE = {
  PAID:              'badge-success',
  PENDING:           'badge-warning',
  REFUNDED:          'badge-info',
  REFUND_REQUESTED:  'badge-warning',
  REFUND_REJECTED:   'badge-danger',
  FAILED:            'badge-danger',
};

const Earnings = () => {
  const [payments, setPayments] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [patientsMap, setPatientsMap] = useState({});
  const [appointmentsMap, setAppointmentsMap] = useState({});
  const [selectedPayment, setSelectedPayment] = useState(null);
  const providerId = localStorage.getItem('providerId');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [paymentsData, revenue, users, appointments] = await Promise.all([
        getPaymentsByProvider(providerId),
        getProviderRevenue(providerId),
        getAllUsers(),
        getAppointmentsByProvider(providerId),
      ]);
      setPayments(paymentsData);
      setTotalRevenue(revenue);

      const uMap = {};
      users.forEach(u => { uMap[u.id] = u; });
      setPatientsMap(uMap);

      const aMap = {};
      appointments.forEach(a => { aMap[a.appointmentId] = a; });
      setAppointmentsMap(aMap);
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Transaction ID copied!', { autoClose: 1500 });
    });
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
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#3D7A5A', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Net Revenue</p>
              <p style={{ fontSize: '32px', fontWeight: '800', color: '#2D5A42', marginTop: '6px' }}>
                ₹{totalRevenue?.toFixed(2) || '0.00'}
              </p>
              <p style={{ fontSize: '12px', color: '#8C7E72', marginTop: '4px' }}>from backend calculation</p>
            </div>

            <div className="card" style={{ backgroundColor: '#E8F4F4', border: '1px solid #B8DADA' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#2D6B6B', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Total Collected</p>
              <p style={{ fontSize: '28px', fontWeight: '800', color: '#1F4E4E', marginTop: '6px' }}>
                ₹{totalPaid.toFixed(2)}
              </p>
              <p style={{ fontSize: '12px', color: '#8C7E72', marginTop: '4px' }}>
                {payments.filter(p => p.status === 'PAID').length} payment(s)
              </p>
            </div>

            <div className="card" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2D9CE' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#8C7E72', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Refunded</p>
              <p style={{ fontSize: '28px', fontWeight: '800', color: '#5C524A', marginTop: '6px' }}>
                ₹{totalRefunded.toFixed(2)}
              </p>
              <p style={{ fontSize: '12px', color: '#8C7E72', marginTop: '4px' }}>
                {payments.filter(p => p.status === 'REFUNDED').length} refund(s)
              </p>
            </div>

            <div className="card" style={{ backgroundColor: '#FDF6E8', border: '1px solid #E8C87A' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#9A7230', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Pending</p>
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
                    <th>#</th>
                    <th>Patient</th>
                    <th>Appt. Date</th>
                    <th>Amount</th>
                    <th>Payment Method</th>
                    <th>Status</th>
                    <th>Transaction ID</th>
                    <th>Paid At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(payment => (
                    <tr key={payment.paymentId}>
                      <td style={{ color: '#8C7E72', fontSize: '12px' }}>#{payment.paymentId}</td>
                      <td style={{ fontWeight: '600', color: '#2C2825' }}>
                        {patientsMap[payment.patientId]?.fullName || `#${payment.patientId}`}
                      </td>
                      <td style={{ fontSize: '13px', color: '#5C524A' }}>
                        {appointmentsMap[payment.appointmentId]?.appointmentDate || '—'}
                      </td>
                      <td style={{ fontWeight: '700', color: '#3D7A5A' }}>
                        ₹{payment.amount?.toFixed(2)}
                      </td>
                      <td style={{ color: '#5C524A' }}>{payment.mode}</td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[payment.status] || 'badge-info'}`}>
                          {STATUS_LABEL[payment.status] || payment.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '11px', color: '#8C7E72', fontFamily: 'monospace' }}>
                        {payment.transactionId ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span title={payment.transactionId}>
                              {payment.transactionId.substring(0, 14) + '...'}
                            </span>
                            <button
                              onClick={() => copyToClipboard(payment.transactionId)}
                              title="Copy Transaction ID"
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                fontSize: '13px', padding: '2px', color: '#8C7E72',
                                lineHeight: 1
                              }}
                            >
                              &#x2398;
                            </button>
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ fontSize: '12px', color: '#5C524A' }}>
                        {formatDate(payment.paidAt)}
                      </td>
                      <td>
                        <button
                          className="btn"
                          style={{
                            padding: '5px 12px', fontSize: '12px',
                            backgroundColor: '#E8F4F4', color: '#2D6B6B',
                            border: '1px solid #B8DADA'
                          }}
                          onClick={() => setSelectedPayment(payment)}
                        >
                          View Details
                        </button>
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

      {/* View Details Modal */}
      {selectedPayment && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(26,21,17,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#FAF7F2', borderRadius: '20px',
            width: '100%', maxWidth: '460px',
            boxShadow: '0 16px 48px rgba(26,21,17,0.3)'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1F4E4E, #2D6B6B)',
              padding: '1.25rem 1.75rem', borderRadius: '20px 20px 0 0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <h3 style={{ color: 'white', fontWeight: '800', fontSize: '17px', marginBottom: '2px' }}>
                  Payment #{selectedPayment.paymentId}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
                  {patientsMap[selectedPayment.patientId]?.fullName || `Patient #${selectedPayment.patientId}`}
                </p>
              </div>
              <button onClick={() => setSelectedPayment(null)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none',
                  borderRadius: '8px', width: '34px', height: '34px',
                  color: 'white', fontSize: '16px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '1.5rem 1.75rem' }}>
              {[
                { label: 'Patient',         value: patientsMap[selectedPayment.patientId]?.fullName || `#${selectedPayment.patientId}` },
                { label: 'Patient Email',   value: patientsMap[selectedPayment.patientId]?.email || '—' },
                { label: 'Appointment Date', value: appointmentsMap[selectedPayment.appointmentId]?.appointmentDate || '—' },
                { label: 'Amount',          value: `₹${selectedPayment.amount?.toFixed(2)}` },
                { label: 'Payment Method',  value: selectedPayment.mode },
                { label: 'Status',          value: STATUS_LABEL[selectedPayment.status] || selectedPayment.status },
                { label: 'Transaction ID',  value: selectedPayment.transactionId || '—' },
                { label: 'Paid At',         value: formatDate(selectedPayment.paidAt) },
                { label: 'Refunded At',     value: selectedPayment.refundedAt ? formatDate(selectedPayment.refundedAt) : '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '9px 0', borderBottom: '1px solid #E2D9CE'
                }}>
                  <span style={{ color: '#8C7E72', fontSize: '13px' }}>{label}</span>
                  <span style={{
                    fontWeight: '600', color: '#2C2825', fontSize: '13px',
                    maxWidth: '240px', textAlign: 'right', wordBreak: 'break-all'
                  }}>{value}</span>
                </div>
              ))}
              <button className="btn" onClick={() => setSelectedPayment(null)}
                style={{
                  width: '100%', marginTop: '1rem', padding: '12px',
                  backgroundColor: '#F2EDE4', color: '#8C7E72', border: '1px solid #E2D9CE'
                }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Earnings;
