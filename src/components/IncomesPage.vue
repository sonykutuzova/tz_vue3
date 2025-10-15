<template>
  <div class="incomes-page">
    <div class="page-header">
      <div class="filters">
        <div class="date-filter">
          <label>Дата с:</label>
          <input type="date" v-model="filters.dateFrom" />
        </div>
        <div class="date-filter">
          <label>Дата по:</label>
          <input type="date" v-model="filters.dateTo" />
        </div>

        <div class="filter-item">
          <label>Склад:</label>
          <select v-model="filters.warehouse">
            <option value="">Все склады</option>
            <option v-for="warehouse in warehouseOptions" :key="warehouse" :value="warehouse">
              {{ warehouse }}
            </option>
          </select>
        </div>

        <div class="filter-item">
          <label>Количество:</label>
          <select v-model="filters.quantity">
            <option value="">Все</option>
            <option value="small">Маленькие (1-10)</option>
            <option value="medium">Средние (11-50)</option>
            <option value="large">Крупные (51+)</option>
          </select>
        </div>

        <div class="filter-item">
          <label>Статус цены:</label>
          <select v-model="filters.price">
            <option value="">Все</option>
            <option value="with_price">С ценой</option>
            <option value="without_price">Без цены</option>
          </select>
        </div>

        <button @click="fetchIncomes(1)" :disabled="loading" class="load-btn">
          {{ loading ? 'Загрузка...' : 'Загрузить' }}
        </button>
      </div>
    </div>

    <!-- Контент занимает все оставшееся пространство -->
    <div class="page-content">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Загрузка...</p>
      </div>

      <div v-else-if="incomes.length > 0" class="data-section">
        <div class="data-info">
          <p>Показано <strong>{{ filteredIncomes.length }}</strong> из <strong>{{ meta.total }}</strong> записей</p>
          <p>Страница <strong>{{ meta.current_page }}</strong> из <strong>{{ meta.last_page }}</strong></p>
        </div>

        <div class="chart-section">
          <h3>Распределение доходов по складам</h3>
          <div class="chart">
            <div
              v-for="(item, index) in chartData"
              :key="index"
              class="chart-bar"
            >
              <div class="bar-label">{{ item.label }}</div>
              <div class="bar-container">
                <div
                  class="bar"
                  :style="{ height: (item.value / maxChartValue * 100) + '%' }"
                  :title="`${item.label}: ${item.value} единиц`"
                ></div>
              </div>
              <div class="bar-value">{{ item.value }}</div>
            </div>
          </div>
        </div>

        <div class="pagination" v-if="meta.last_page > 1">
          <button @click="fetchIncomes(1)" :disabled="meta.current_page === 1" class="page-btn">◀◀</button>
          <button @click="fetchIncomes(meta.current_page - 1)" :disabled="meta.current_page === 1" class="page-btn">◀</button>
          <span class="page-numbers">
            <button v-for="page in visiblePages" :key="page" @click="fetchIncomes(page)"
                    :class="{ active: page === meta.current_page }" class="page-number">{{ page }}</button>
          </span>
          <button @click="fetchIncomes(meta.current_page + 1)" :disabled="meta.current_page === meta.last_page" class="page-btn">▶</button>
          <button @click="fetchIncomes(meta.last_page)" :disabled="meta.current_page === meta.last_page" class="page-btn">▶▶</button>
        </div>

        <div class="table-container">
          <div class="table-scroll-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th v-for="field in Object.keys(incomes[0])" :key="field">
                    {{ formatFieldName(field) }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in filteredIncomes" :key="index">
                  <td v-for="field in Object.keys(incomes[0])" :key="field">
                    {{ formatFieldValue(item[field]) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="pagination" v-if="meta.last_page > 1">
          <button @click="fetchIncomes(1)" :disabled="meta.current_page === 1" class="page-btn">◀◀</button>
          <button @click="fetchIncomes(meta.current_page - 1)" :disabled="meta.current_page === 1" class="page-btn">◀</button>
          <span class="page-numbers">
            <button v-for="page in visiblePages" :key="page" @click="fetchIncomes(page)"
                    :class="{ active: page === meta.current_page }" class="page-number">{{ page }}</button>
          </span>
          <button @click="fetchIncomes(meta.current_page + 1)" :disabled="meta.current_page === meta.last_page" class="page-btn">▶</button>
          <button @click="fetchIncomes(meta.last_page)" :disabled="meta.current_page === meta.last_page" class="page-btn">▶▶</button>
        </div>
      </div>

      <div v-else class="no-data">
        <p>Нет данных для отображения</p>
        <p>Выберите даты и нажмите "Загрузить"</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { wildberriesApi } from '../api/wildberriesApi.js'

const filters = ref({
  dateFrom: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
  dateTo: new Date().toISOString().split('T')[0],
  warehouse: '',
  quantity: '',
  price: ''
})
const incomes = ref([])
const loading = ref(false)
const meta = ref({
  current_page: 1,
  last_page: 1,
  total: 0
})

const visiblePages = computed(() => {
  const current = meta.value.current_page
  const last = meta.value.last_page
  const pages = []

  for (let i = Math.max(1, current - 2); i <= Math.min(last, current + 2); i++) {
    pages.push(i)
  }
  return pages
})

const warehouseOptions = computed(() => {
  const warehouses = new Set()
  incomes.value.forEach(item => {
    if (item.warehouse_name) warehouses.add(item.warehouse_name)
  })
  return Array.from(warehouses).sort()
})

const totalQuantity = computed(() => {
  return filteredIncomes.value.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0)
})

const filteredIncomes = computed(() => {
  return incomes.value.filter(item => {
    const warehouseMatch = !filters.value.warehouse || item.warehouse_name === filters.value.warehouse

    const quantity = parseInt(item.quantity) || 0
    const quantityMatch = !filters.value.quantity ||
      (filters.value.quantity === 'small' && quantity >= 1 && quantity <= 10) ||
      (filters.value.quantity === 'medium' && quantity > 10 && quantity <= 50) ||
      (filters.value.quantity === 'large' && quantity > 50)

    const priceMatch = !filters.value.price ||
      (filters.value.price === 'with_price' && parseFloat(item.total_price) > 0) ||
      (filters.value.price === 'without_price' && parseFloat(item.total_price) === 0)

    return warehouseMatch && quantityMatch && priceMatch
  })
})

const chartData = computed(() => {
  const warehouseStats = {}

  filteredIncomes.value.forEach(item => {
    const warehouse = item.warehouse_name || 'Не указан'
    const quantity = parseInt(item.quantity) || 0
    warehouseStats[warehouse] = (warehouseStats[warehouse] || 0) + quantity
  })

  return Object.entries(warehouseStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8)
    .map(([label, value]) => ({ label, value }))
})

const maxChartValue = computed(() => {
  return Math.max(...chartData.value.map(item => item.value), 1)
})

const fetchIncomes = async (page = 1) => {
  loading.value = true
  try {
    const response = await wildberriesApi.getIncomes({
      dateFrom: filters.value.dateFrom,
      dateTo: filters.value.dateTo,
      page: page,
      limit: 500
    })

    incomes.value = response.data || []
    meta.value = response.meta || { current_page: 1, last_page: 1, total: 0 }

    console.log('Данные доходов загружены:', incomes.value.length, 'записей')

  } catch (error) {
    console.error('Ошибка загрузки доходов:', error)
  } finally {
    loading.value = false
  }
}

const formatFieldName = (field) => {
  const fieldNames = {
    'income_id': 'ID дохода',
    'number': 'Номер',
    'date': 'Дата',
    'last_change_date': 'Последнее изменение',
    'supplier_article': 'Артикул поставщика',
    'tech_size': 'Размер',
    'barcode': 'Штрихкод',
    'quantity': 'Количество',
    'total_price': 'Общая цена',
    'date_close': 'Дата закрытия',
    'warehouse_name': 'Склад',
    'nm_id': 'NM ид',
  }

  return fieldNames[field] || field
}

const formatFieldValue = (value) => {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'boolean') return value ? 'Да' : 'Нет'
  if (typeof value === 'string' && value.length > 20) {
    return value.substring(0, 8) + '...'
  }
  return value
}

onMounted(() => {
  fetchIncomes(1)
})
</script>

<style scoped>
.chart-section {
  background: white;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 25px;
}

.chart-section h3 {
  margin-bottom: 20px;
  text-align: center;
  color: #333;
}

.chart {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 200px;
  gap: 15px;
}

.chart-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 80px;
}

.bar-label {
  font-size: 11px;
  margin-bottom: 8px;
  text-align: center;
  color: #666;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
}

.bar-container {
  height: 150px;
  width: 35px;
  background: #f8f9fa;
  border-radius: 6px 6px 0 0;
  position: relative;
  border: 1px solid #e9ecef;
}

.bar {
  background: linear-gradient(180deg, #6f42c1, #5a3598);
  width: 100%;
  border-radius: 6px 6px 0 0;
  position: absolute;
  bottom: 0;
  transition: height 0.5s ease;
  min-height: 3px;
}

.bar-value {
  margin-top: 8px;
  font-size: 12px;
  font-weight: bold;
  color: #333;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-item label {
  font-weight: 600;
  color: #495057;
  font-size: 14px;
}

.filter-item select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background: white;
}

.incomes-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
}

.page-header {
  background: #f8f9fa;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  flex-shrink: 0;
}

.page-header h2 {
  margin-bottom: 15px;
  color: #333;
}

.filters {
  display: flex;
  gap: 15px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.date-filter {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.date-filter label {
  font-weight: 600;
  color: #495057;
  font-size: 14px;
}

.date-filter input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.load-btn {
  padding: 10px 20px;
  background: #6f42c1;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.load-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.load-btn:hover:not(:disabled) {
  background: #5a3598;
}

.page-content {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #6f42c1;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #6f42c1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.data-info {
  margin-bottom: 15px;
  flex-shrink: 0;
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.data-info p {
  color: #666;
  font-size: 14px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin: 15px 0;
  flex-wrap: wrap;
}

.page-btn, .page-number {
  padding: 8px 12px;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled), .page-number:hover:not(.active) {
  background: #6f42c1;
  color: white;
  border-color: #6f42c1;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-number.active {
  background: #6f42c1;
  color: white;
  border-color: #6f42c1;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.table-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: white;
  overflow: hidden;
}

.table-scroll-wrapper {
  flex: 1;
  overflow: auto;
  min-height: 0;
}

.data-table {
  width: auto;
  min-width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  white-space: nowrap;
}

.data-table th,
.data-table td {
  border: 1px solid #e0e0e0;
  padding: 8px 10px;
  text-align: left;
  min-width: 100px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.data-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 2px solid #dee2e6;
}

.data-table tr:nth-child(even) {
  background: #f9f9f9;
}

.data-table tr:hover {
  background: #f0f8ff;
}

.no-data {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #666;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px dashed #dee2e6;
}

.no-data p {
  margin: 5px 0;
  font-size: 16px;
}

.table-scroll-wrapper::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.table-scroll-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 6px;
}

.table-scroll-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 6px;
  border: 2px solid #f1f1f1;
}

.table-scroll-wrapper::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>