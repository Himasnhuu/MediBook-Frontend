import axiosInstance from './axiosInstance';

export const getAllProviders = async () => {
  const response = await axiosInstance.get('/providers');
  return response.data;
};

export const searchProviders = async (query) => {
  const response = await axiosInstance.get(
    `/providers/search?query=${query}`);
  return response.data;
};

export const getProviderById = async (id) => {
  const response = await axiosInstance.get(`/providers/${id}`);
  return response.data;
};

export const getProviderByUserId = async (userId) => {
  const response = await axiosInstance.get(
    `/providers/user/${userId}`);
  return response.data;
};

export const createProvider = async (providerData) => {
  const response = await axiosInstance.post(
    '/providers', providerData);
  return response.data;
};

export const updateProvider = async (id, providerData) => {
  const response = await axiosInstance.put(
    `/providers/${id}`, providerData);
  return response.data;
};

export const verifyProvider = async (id) => {
  const response = await axiosInstance.put(
    `/providers/${id}/verify`);
  return response.data;
};

export const setAvailability = async (id, available) => {
  const response = await axiosInstance.put(
    `/providers/${id}/availability?available=${available}`);
  return response.data;
};

export const submitProfileUpdate = async (id, providerData) => {
  const response = await axiosInstance.put(
    `/providers/${id}/submit-update`, providerData);
  return response.data;
};

export const approveProfileUpdate = async (id) => {
  const response = await axiosInstance.put(
    `/providers/${id}/approve-update`);
  return response.data;
};

export const rejectProfileUpdate = async (id) => {
  const response = await axiosInstance.put(
    `/providers/${id}/reject-update`);
  return response.data;
};

export const updateProviderPhoto = async (providerId, photoBase64) => {
  const response = await axiosInstance.put(`/providers/${providerId}/photo`, {
    profilePhotoUrl: photoBase64
  });
  return response.data;
};

export const getSpecializations = async () => {
  const response = await axiosInstance.get('/specializations');
  return response.data;
};

export const addSpecialization = async (name) => {
  const response = await axiosInstance.post('/specializations', { name });
  return response.data;
};

export const deleteSpecialization = async (id) => {
  const response = await axiosInstance.delete(`/specializations/${id}`);
  return response.data;
};
