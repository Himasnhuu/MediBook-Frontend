import axiosInstance from './axiosInstance';

export const getRecordsByPatient = async (patientId) => {
  const response = await axiosInstance.get(`/records/patient/${patientId}`);
  return response.data;
};

export const getRecordsByPatientSorted = async (patientId) => {
  const response = await axiosInstance.get(`/records/patient/${patientId}/sorted`);
  return response.data;
};

export const getRecordByAppointment = async (appointmentId) => {
  const response = await axiosInstance.get(`/records/appointment/${appointmentId}`);
  return response.data;
};

export const createRecord = async (recordData) => {
  const response = await axiosInstance.post('/records', recordData);
  return response.data;
};

export const updateRecord = async (recordId, recordData) => {
  const response = await axiosInstance.put(`/records/${recordId}`, recordData);
  return response.data;
};

export const getRecordsByProvider = async (providerId) => {
  const response = await axiosInstance.get(`/records/provider/${providerId}`);
  return response.data;
};
