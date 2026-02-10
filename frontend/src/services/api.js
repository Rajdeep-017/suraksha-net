import axios from 'axios';

const API_BASE_URL = "http://127.0.0.1:8000/api";

export const getAccidents = () => axios.get(`${API_BASE_URL}/accidents`);

export const predictRisk = (data) => axios.post(`${API_BASE_URL}/predict-risk`, data);