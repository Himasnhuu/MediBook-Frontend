import axiosInstance from './axiosInstance';

export const bookAppointment = async (appointmentData) => {
  const response = await axiosInstance.post(
    '/appointments', appointmentData);
  return response.data;
};

export const getAppointmentsByPatient = async (patientId) => {
  const response = await axiosInstance.get(
    `/appointments/patient/${patientId}`);
  return response.data;
};

export const getAppointmentsByProvider = async (providerId) => {
  const response = await axiosInstance.get(
    `/appointments/provider/${providerId}`);
  return response.data;
};

export const cancelAppointment = async (id) => {
  const response = await axiosInstance.put(
    `/appointments/${id}/cancel`);
  return response.data;
};

export const completeAppointment = async (id) => {
  const response = await axiosInstance.put(
    `/appointments/${id}/complete`);
  return response.data;
};
