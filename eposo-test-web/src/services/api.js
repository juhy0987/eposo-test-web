import axios from 'axios';

export const signUp = async (credentials) => {
  const { email, password, passwordConfirmation } = credentials;
  // Vite proxy will forward this request to the backend
  const response = await axios.post('/api/auth/signup', {
    email,
    password,
    passwordConfirmation,
  });
  return response.data;
};

// Upload API functions
export const initiateUpload = async (uploadData) => {
  const response = await axios.post('/api/upload/initiate', uploadData);
  return response.data;
};

export const uploadChunk = async (uploadId, formData) => {
  const response = await axios.post(`/api/upload/chunk/${uploadId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getUploadStatus = async (uploadId) => {
  const response = await axios.get(`/api/upload/status/${uploadId}`);
  return response.data;
};

export const completeUpload = async (uploadId) => {
  const response = await axios.post(`/api/upload/complete/${uploadId}`);
  return response.data;
};