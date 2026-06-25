const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  const isLocalIp = /^192\.168\./.test(hostname) || 
                    /^10\./.test(hostname) || 
                    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname);
  if (isLocalIp) {
    return `http://${hostname}:5000`;
  }
  console.warn("REACT_APP_API_URL environment variable is not defined. Falling back to default Render backend URL.");
  return 'https://authorized-pickup-qr-system.onrender.com';
};

const API_URL = getApiUrl();

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
