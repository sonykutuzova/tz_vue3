
const API_KEY = import.meta.env.VITE_API_KEY || 'E6kUTYrYwZq2tN4QEtyzsbEBk3ie';

async function apiRequest(endpoint, params = {}) {
  const queryParams = new URLSearchParams({
    ...params,
    key: API_KEY
  });

  // Используйте относительный путь для работы с прокси!
  const response = await fetch(`/api${endpoint}?${queryParams}`);
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