import axiosInstance from './axiosInstance';

export const getAvailableSlots = async (providerId, date) => {
  const response = await axiosInstance.get(
    `/slots/available?providerId=${providerId}&date=${date}`);
  return response.data;
};

export const addSlot = async (slotData) => {
  const response = await axiosInstance.post('/slots', slotData);
  return response.data;
};

export const getSlotsByProvider = async (providerId) => {
  const response = await axiosInstance.get(
    `/slots/provider/${providerId}`);
  return response.data;
};

export const bookSlot = async (slotId) => {
  const response = await axiosInstance.put(
    `/slots/${slotId}/book`);
  return response.data;
};

export const releaseSlot = async (slotId) => {
  const response = await axiosInstance.put(
    `/slots/${slotId}/release`);
  return response.data;
};

export const deleteSlot = async (slotId) => {
  const response = await axiosInstance.delete(
    `/slots/${slotId}`);
  return response.data;
};
