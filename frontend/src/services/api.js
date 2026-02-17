import axios from 'axios';

const API_BASE_URL = "http://127.0.0.1:8000/api";

export const fetchSaferRoute = async (params) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/navigate-safe`, params);
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};