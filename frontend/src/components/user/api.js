import Cookies from 'js-cookie';

const BASE_URL = 'http://localhost:8000/api'; // Replace with env variable in production

const refreshToken = async () => {
  const refresh = Cookies.get('refresh');
  if (!refresh) {
    throw new Error('No refresh token available');
  }
  const response = await fetch(`${BASE_URL}/token/refresh/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh }),
  });
  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }
  const data = await response.json();
  Cookies.set('access', data.access);
  return data.access;
};

export const apiFetch = async (url, options = {}) => {
  let token = Cookies.get('access');
  if (!token) {
    throw new Error('No token found, please log in');
  }

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers,
    });
    if (response.status === 401) {
      // Token might be expired, try refreshing
      token = await refreshToken();
      const retryResponse = await fetch(`${BASE_URL}${url}`, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!retryResponse.ok) {
        throw new Error(`API request failed: ${retryResponse.status}`);
      }
      return retryResponse;
    }
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    return response;
  } catch (error) {
    throw error;
  }
};