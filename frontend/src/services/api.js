const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });
  
  // Handle file downloads (PDF/CSV)
  const contentType = response.headers.get('Content-Type');
  if (contentType && (contentType.includes('pdf') || contentType.includes('csv'))) {
    if (!response.ok) {
      throw new Error('Failed to download report.');
    }
    return response.blob();
  }
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  
  return data;
};

export const api = {
  get: (endpoint, options) => request(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) => request(endpoint, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: (endpoint, body, options) => request(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options }),
  delete: (endpoint, options) => request(endpoint, { method: 'DELETE', ...options })
};
