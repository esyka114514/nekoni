import axios from 'axios';

let token = localStorage.getItem('webui_token');

export const setToken = (newToken) => {
  token = newToken;
  if (newToken) {
    localStorage.setItem('webui_token', newToken);
  } else {
    localStorage.removeItem('webui_token');
  }
};

axios.interceptors.request.use(config => {
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      setToken(null);
      window.location.hash = '/login';
    }
    return Promise.reject(error);
  }
);

export const login = (key) => {
  return axios.post('/api/login', { key });
};

export const getSystemStats = () => {
  return axios.get('/api/system-stats');
};

export const getJobs = () => {
  return axios.get('/api/jobs');
};

export const getServices = () => {
  return axios.get('/api/http-services');
};

export const getProjectInfo = () => {
  return axios.get('/api/project-info');
};
