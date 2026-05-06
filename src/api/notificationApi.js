import axiosInstance from './axiosInstance';

export const sendAppointmentBookedNotification = async (data) => {
  try {
    const response = await axiosInstance.post('/notifications/appointment-booked', data);
    return response.data;
  } catch (err) {
    console.error('Notification failed:', err);
  }
};

export const sendAppointmentCancelledNotification = async (data) => {
  try {
    const response = await axiosInstance.post('/notifications/appointment-cancelled', data);
    return response.data;
  } catch (err) {
    console.error('Notification failed:', err);
  }
};

export const sendAppointmentCompletedNotification = async (data) => {
  try {
    const response = await axiosInstance.post('/notifications/appointment-completed', data);
    return response.data;
  } catch (err) {
    console.error('Notification failed:', err);
  }
};

export const sendPaymentSuccessNotification = async (data) => {
  try {
    const response = await axiosInstance.post('/notifications/payment-success', data);
    return response.data;
  } catch (err) {
    console.error('Notification failed:', err);
  }
};

export const sendPaymentRefundedNotification = async (data) => {
  try {
    const response = await axiosInstance.post('/notifications/payment-refunded', data);
    return response.data;
  } catch (err) {
    console.error('Notification failed:', err);
  }
};

export const getNotificationsByUser = async (userId) => {
  const response = await axiosInstance.get(`/notifications/user/${userId}`);
  return response.data;
};

export const getUnreadNotifications = async (userId) => {
  const response = await axiosInstance.get(`/notifications/user/${userId}/unread`);
  return response.data;
};

export const getUnreadCount = async (userId) => {
  const response = await axiosInstance.get(`/notifications/user/${userId}/count`);
  return response.data;
};

export const markAsRead = async (notificationId) => {
  const response = await axiosInstance.put(`/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllAsRead = async (userId) => {
  const response = await axiosInstance.put(`/notifications/user/${userId}/read-all`);
  return response.data;
};
