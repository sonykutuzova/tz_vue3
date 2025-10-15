<template>
  <div id="app">
    <header class="app-header">
      <h1>Тестовое задание</h1>
      <nav class="main-nav">
        <button
          v-for="page in pages"
          :key="page.id"
          @click="currentPage = page.id"
          :class="{ active: currentPage === page.id }"
          class="nav-btn"
        >
          {{ page.title }}
        </button>
      </nav>
    </header>

    <main class="app-main">
      <component :is="currentPageComponent" />
    </main>
  </div>
</template>

<script>
import StocksPage from './components/StocksPage.vue'
import IncomesPage from './components/IncomesPage.vue'
import OrdersPage from './components/OrdersPage.vue'
import SalesPage from './components/SalesPage.vue'

export default {
  name: 'App',
  components: {
    StocksPage,
    IncomesPage,
    OrdersPage,
    SalesPage
  },
  data() {
    return {
      currentPage: 'stocks',
      pages: [
        { id: 'incomes', title: 'Доходы', component: 'IncomesPage' },
        { id: 'orders', title: 'Заказы', component: 'OrdersPage' },
        { id: 'sales', title: 'Продажи', component: 'SalesPage' },
        { id: 'stocks', title: 'Склады', component: 'StocksPage' }
      ]
    }
  },
  computed: {
    currentPageComponent() {
      return this.currentPage + '-page'
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  background-color: #f5f5f5;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: white;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border-bottom: 1px solid #e0e0e0;
}

.app-header h1 {
  color: #333;
  margin-bottom: 20px;
  text-align: center;
  font-size: 24px;
}


.main-nav {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.nav-btn {
  padding: 12px 24px;
  border: 2px solid #007bff;
  background: white;
  color: #007bff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s;
  min-width: 100px;
}

.nav-btn:hover {
  background: #007bff;
  color: white;
  transform: translateY(-1px);
}

.nav-btn.active {
  background: #007bff;
  color: white;
}

.app-main {
  flex: 1;
  padding: 0;
  background: white;
}

.stocks-page,
.incomes-page,
.orders-page,
.sales-page {
  height: 100%;
  min-height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
}
</style>