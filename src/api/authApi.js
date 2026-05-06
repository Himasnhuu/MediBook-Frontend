import axiosInstance from './axiosInstance';

export const loginUser = async (email, password) => {
  const response = await axiosInstance.post('/auth/login', {
    email,
    password
  });
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await axiosInstance.post(
    '/auth/register', userData);
  return response.data;
};

export const getUserByEmail = async (email) => {
  const response = await axiosInstance.get(
    `/auth/user?email=${email}`);
  return response.data;
};

export const sendOtp = async (email) => {
  const response = await axiosInstance.post(
    `/auth/send-otp?email=${email}`
  );
  return response.data;
};

export const verifyOtp = async (email, otp) => {
  const response = await axiosInstance.post(
    `/auth/verify-otp?email=${email}&otp=${otp}`
  );
  return response.data;
};

export const forgotPasswordSendOtp = async (email) => {
  const response = await axiosInstance.post(
    `/auth/forgot-password/send-otp?email=${email}`
  );
  return response.data;
};

export const resetPassword = async (email, otp, newPassword) => {
  const response = await axiosInstance.post(
    `/auth/forgot-password/reset?email=${email}&otp=${otp}&newPassword=${newPassword}`
  );
  return response.data;
};

export const changePassword = async (email, currentPassword, newPassword) => {
  const response = await axiosInstance.post(
    `/auth/change-password?email=${email}&currentPassword=${currentPassword}&newPassword=${newPassword}`
  );
  return response.data;
};
