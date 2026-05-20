import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getAllPayments, approveRefund, rejectRefund } from '../../api/paymentApi';

const ManageRefunds = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await getAllPayments();
      setPayments(data.filter(p => p.status === 'REFUND_REQUESTED'));
    } catch (err) {
      toast.error('Failed to load refund requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (paymentId) => {
    if (!window.confirm('Approve this refund?')) return;
    setApprovingId(paymentId);
    try {
      await approveRefund(paymentId);
      toast.success('Refund approved successfully');
      fetchPayments();
    } catch (err) {
      toast.error('Failed to approve refund');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (paymentId) => {
    if (!window.confirm('Reject this refund request?')) return;
    setRejectingId(paymentId);
    try {
      await rejectRefund(paymentId);
      toast.success('Refund request rejected');
      fetchPayments();
    } catch (err) {
      toast.error('Failed to reject refund');
    } finally {
      setRejectingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#2C2825' }}>
          Manage Refunds
        </h2>
        <p style={{ color: '#8C7E72', fontSize: '14px', marginTop: '4px' }}>
          Review and approve patient refund requests
        </p>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#8C7E72' }}>
          Loading refund requests...
        </div>
      )}

      {!loading && payments.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '3rem',
          backgroundColor: 'white', borderRadius: '12px',
          color: '#8C7E72', border: '1px solid #E2D9CE'
        }}>
          <p style={{ fontSize: '16px', fontWeight: '600', color: '#2C2825' }}>
            No pending refund requests
          </p>
        </div>
      )}

      {!loading && payments.length > 0 && (
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
                <th>Paid At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.paymentId}>
                  <td>#{payment.paymentId}</td>
                  <td>#{payment.appointmentId}</td>
                  <td>#{payment.patientId}</td>
                  <td style={{ fontWeight: '700', color: '#2C2825' }}>
                    ₹{payment.amount?.toFixed(2)}
                  </td>
                  <td>{payment.mode}</td>
                  <td style={{ fontSize: '12px' }}>{formatDate(payment.paidAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn btn-success"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => handleApprove(payment.paymentId)}
                        disabled={approvingId === payment.paymentId}
                      >
                        {approvingId === payment.paymentId ? 'Approving...' : 'Approve Refund'}
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => handleReject(payment.paymentId)}
                        disabled={rejectingId === payment.paymentId}
                      >
                        {rejectingId === payment.paymentId ? 'Rejecting...' : 'Reject'}
                      </button>
                    </div>
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

export default ManageRefunds;
