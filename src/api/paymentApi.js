import axiosInstance from './axiosInstance';

export const processPayment = async (paymentData) => {
  const response = await axiosInstance.post('/payments', paymentData);
  return response.data;
};

export const getPaymentsByPatient = async (patientId) => {
  const response = await axiosInstance.get(`/payments/patient/${patientId}`);
  return response.data;
};

export const getPaymentsByProvider = async (providerId) => {
  const response = await axiosInstance.get(`/payments/provider/${providerId}`);
  return response.data;
};

export const getProviderRevenue = async (providerId) => {
  const response = await axiosInstance.get(`/payments/revenue/${providerId}`);
  return response.data;
};

export const refundPayment = async (paymentId) => {
  const response = await axiosInstance.put(`/payments/${paymentId}/refund`);
  return response.data;
};

export const requestRefund = async (paymentId) => {
  const response = await axiosInstance.put(`/payments/${paymentId}/request-refund`);
  return response.data;
};

export const getAllPayments = async () => {
  const response = await axiosInstance.get('/payments');
  return response.data;
};

export const approveRefund = async (paymentId) => {
  const response = await axiosInstance.put(`/payments/${paymentId}/refund`);
  return response.data;
};

export const rejectRefund = async (paymentId) => {
  const response = await axiosInstance.put(`/payments/${paymentId}/reject-refund`);
  return response.data;
};

export const getPaymentStatus = async (paymentId) => {
  const response = await axiosInstance.get(`/payments/${paymentId}/status`);
  return response.data;
};

export const createRazorpayOrder = async (amount, appointmentId) => {
  const response = await axiosInstance.post('/payments/razorpay/create-order', {
    amount,
    appointmentId
  });
  return response.data;
};

export const verifyRazorpayPayment = async (data) => {
  const response = await axiosInstance.post('/payments/razorpay/verify', data);
  return response.data;
};
