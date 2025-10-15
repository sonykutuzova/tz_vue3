
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://109.73.206.144:6969';
const API_KEY = import.meta.env.VITE_API_KEY || 'E6kUTYrYwZq2tN4QEtyzsbEBk3ie';

async function apiRequest(endpoint, params = {}) {
  const queryParams = new URLSearchParams({
    ...params,
    key: API_KEY
  });

  const response = await fetch(`${API_BASE_URL}${endpoint}?${queryParams}`);
  return response.json();
}

export const wildberriesApi = {

  getStocks(params = {}) {
    return apiRequest('/api/stocks', params);
  },

  getSales(params = {}) {
    return apiRequest('/api/sales', params);
  },

  getOrders(params = {}) {
    return apiRequest('/api/orders', params);
  },

  getIncomes(params = {}) {
    return apiRequest('/api/incomes', params);
  }
};