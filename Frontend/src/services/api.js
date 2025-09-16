// API utility functions
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const fetchReports = async () => {
  const response = await axios.get(`${API_BASE_URL}/reports`);
  return response.data;
};

export const submitReport = async (data) => {
  const response = await axios.post(`${API_BASE_URL}/reports`, data);
  return response.data;
};

// Add more API functions as needed
