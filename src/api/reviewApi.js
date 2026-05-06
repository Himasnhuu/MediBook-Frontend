import axiosInstance from './axiosInstance';

export const submitReview = async (reviewData) => {
  const response = await axiosInstance.post('/reviews', reviewData);
  return response.data;
};

export const getReviewsByProvider = async (providerId) => {
  const response = await axiosInstance.get(`/reviews/provider/${providerId}`);
  return response.data;
};

export const getAverageRating = async (providerId) => {
  const response = await axiosInstance.get(`/reviews/provider/${providerId}/rating`);
  return response.data;
};

export const getReviewsByPatient = async (patientId) => {
  const response = await axiosInstance.get(`/reviews/patient/${patientId}`);
  return response.data;
};

export const checkReviewExists = async (appointmentId) => {
  const response = await axiosInstance.get(`/reviews/appointment/${appointmentId}/exists`);
  return response.data;
};

export const getReviewByAppointment = async (appointmentId) => {
  const response = await axiosInstance.get(`/reviews/appointment/${appointmentId}`);
  return response.data;
};
