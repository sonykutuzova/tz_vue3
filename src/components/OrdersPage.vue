<template>
  <div class="orders-page">
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
          <label>Статус:</label>
          <select v-model="filters.status">
            <option value="">Все заказы</option>
            <option value="active">Активные</option>
            <option value="cancelled">Отмененные</option>
          </select>
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
          <label>Скидка:</label>
          <select v-model="filters.discount">
            <option value="">Все скидки</option>
            <option value="no_discount">Без скидки (0%)</option>
            <option value="small">Маленькая (1-20%)</option>
            <option value="medium">Средняя (21-40%)</option>
            <option value="big">Большая (41%+)</option>
          </select>
        </div>

        <button @click="fetchOrders(1)" :disabled="loading" class="load-btn">
          {{ loading ? 'Загрузка...' : 'Загрузить' }}
        </button>
      </div>
    </div>

    <div class="page-content">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Загрузка...</p>
      </div>

      <div v-else-if="orders.length > 0" class="data-section">
        <div class="data-info">
          <p>Показано <strong>{{ filteredOrders.length }}</strong> из <strong>{{ meta.total }}</strong> записей</p>
          <p>Страница <strong>{{ meta.current_page }}</strong> из <strong>{{ meta.last_page }}</strong></p>
        </div>

        <div class="chart-section">
          <h3>Распределение заказов по статусам</h3>
          <div class="chart-pie">
            <div class="pie-chart">
              <div
                class="pie-segment active"
                :style="{ '--percentage': (activeOrdersCount / totalOrdersCount * 100) + '%' }"
                :title="`Активные: ${activeOrdersCount} (${Math.round(activeOrdersCount / totalOrdersCount * 100)}%)`"
              ></div>
              <div
                class="pie-segment cancelled"
                :style="{ '--percentage': (cancelledOrdersCount / totalOrdersCount * 100) + '%' }"
                :title="`Отмененные: ${cancelledOrdersCount} (${Math.round(cancelledOrdersCount / totalOrdersCount * 100)}%)`"
              ></div>
            </div>
            <div class="pie-legend">
              <div class="legend-item">
                <span class="color-dot active"></span>
                <span>Активные ({{ activeOrdersCount }})</span>
              </div>
              <div class="legend-item">
                <span class="color-dot cancelled"></span>
                <span>Отмененные ({{ cancelledOrdersCount }})</span>
              </div>
            </div>
          </div>
        </div>


        <div class="pagination" v-if="meta.last_page > 1">
          <button @click="fetchOrders(1)" :disabled="meta.current_page === 1" class="page-btn">◀◀</button>
          <button @click="fetchOrders(meta.current_page - 1)" :disabled="meta.current_page === 1" class="page-btn">◀</button>
          <span class="page-numbers">
            <button v-for="page in visiblePages" :key="page" @click="fetchOrders(page)"
                    :class="{ active: page === meta.current_page }" class="page-number">{{ page }}</button>
          </span>
          <button @click="fetchOrders(meta.current_page + 1)" :disabled="meta.current_page === meta.last_page" class="page-btn">▶</button>
          <button @click="fetchOrders(meta.last_page)" :disabled="meta.current_page === meta.last_page" class="page-btn">▶▶</button>
        </div>

        <div class="table-container">
          <div class="table-scroll-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th v-for="field in Object.keys(orders[0])" :key="field">
                    {{ formatFieldName(field) }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in filteredOrders" :key="index">
                  <td v-for="field in Object.keys(orders[0])" :key="field">
                    {{ formatFieldValue(item[field]) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="pagination" v-if="meta.last_page > 1">
          <button @click="fetchOrders(1)" :disabled="meta.current_page === 1" class="page-btn">◀◀</button>
          <button @click="fetchOrders(meta.current_page - 1)" :disabled="meta.current_page === 1" class="page-btn">◀</button>
          <span class="page-numbers">
            <button v-for="page in visiblePages" :key="page" @click="fetchOrders(page)"
                    :class="{ active: page === meta.current_page }" class="page-number">{{ page }}</button>
          </span>
          <button @click="fetchOrders(meta.current_page + 1)" :disabled="meta.current_page === meta.last_page" class="page-btn">▶</button>
          <button @click="fetchOrders(meta.last_page)" :disabled="meta.current_page === meta.last_page" class="page-btn">▶▶</button>
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
  status: '',
  warehouse: '',
  discount: ''
})
const orders = ref([])
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
  orders.value.forEach(item => {
    if (item.warehouse_name) warehouses.add(item.warehouse_name)
  })
  return Array.from(warehouses).sort()
})

const activeOrdersCount = computed(() => {
  return filteredOrders.value.filter(item => !item.is_cancel).length
})

const cancelledOrdersCount = computed(() => {
  return filteredOrders.value.filter(item => item.is_cancel).length
})

const totalOrdersCount = computed(() => {
  return filteredOrders.value.length
})

const filteredOrders = computed(() => {
  return orders.value.filter(item => {
    const statusMatch = !filters.value.status ||
      (filters.value.status === 'active' && !item.is_cancel) ||
      (filters.value.status === 'cancelled' && item.is_cancel)

    const warehouseMatch = !filters.value.warehouse || item.warehouse_name === filters.value.warehouse

    const discount = parseFloat(item.discount_percent) || 0
    const discountMatch = !filters.value.discount ||
      (filters.value.discount === 'no_discount' && discount === 0) ||
      (filters.value.discount === 'small' && discount > 0 && discount <= 20) ||
      (filters.value.discount === 'medium' && discount > 20 && discount <= 40) ||
      (filters.value.discount === 'big' && discount > 40)

    return statusMatch && warehouseMatch && discountMatch
  })
})

// Методы
const fetchOrders = async (page = 1) => {
  loading.value = true
  try {
    const response = await wildberriesApi.getOrders({
      dateFrom: filters.value.dateFrom,
      dateTo: filters.value.dateTo,
      page: page,
      limit: 500
    })

    orders.value = response.data || []
    meta.value = response.meta || { current_page: 1, last_page: 1, total: 0 }

    console.log('Данные заказов загружены:', orders.value.length, 'записей')

  } catch (error) {
    console.error('Ошибка загрузки заказов:', error)
  } finally {
    loading.value = false
  }
}

const formatFieldName = (field) => {
  const fieldNames = {
    'g_number': 'Номер заказа',
    'date': 'Дата',
    'last_change_date': 'Последнее изменение',
    'supplier_article': 'Артикул поставщика',
    'tech_size': 'Размер',
    'barcode': 'Штрихкод',
    'total_price': 'Общая цена',
    'discount_percent': 'Скидка %',
    'warehouse_name': 'Склад',
    'oblast': 'Область',
    'income_id': 'ID дохода',
    'odid': 'ID заказа',
    'nm_id': 'Артикул WB',
    'subject': 'Тема',
    'category': 'Категория',
    'brand': 'Бренд',
    'is_cancel': 'Отменен',
    'cancel_dt': 'Дата отмены'
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
  fetchOrders(1)
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

.chart-pie {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40px;
  flex-wrap: wrap;
}

.pie-chart {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: conic-gradient(
    #28a745 0% var(--percentage-active),
    #dc3545 var(--percentage-active) 100%
  );
  position: relative;
}

.pie-segment {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.pie-segment.active {
  background: conic-gradient(#dc3545 0% var(--percentage));
}

.pie-segment.cancelled {

  background: conic-gradient(transparent 0% var(--percentage), #28a745 var(--percentage) 100%);
}

.pie-legend {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.color-dot.active {
  background: #28a745;
}

.color-dot.cancelled {
  background: #dc3545;
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

.orders-page {
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
  background: #ffc107;
  color: #333;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.load-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
  color: white;
}

.load-btn:hover:not(:disabled) {
  background: #e0a800;
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
  color: #ffc107;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #ffc107;
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
  background: #ffc107;
  color: #333;
  border-color: #ffc107;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-number.active {
  background: #ffc107;
  color: #333;
  border-color: #ffc107;
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