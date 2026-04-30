import api from './api';

export const getOverallAnalytics = () => api.get('/transactions/analytics/overall');

