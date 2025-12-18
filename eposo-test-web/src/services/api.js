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