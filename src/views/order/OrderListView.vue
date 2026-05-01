<template>
  <div class="page-container orders-page">
    <h2 class="page-title">我的订单</h2>

    <el-tabs v-model="activeTab" class="order-tabs">
      <el-tab-pane label="全部" name="all" />
      <el-tab-pane label="待付款" name="0" />
      <el-tab-pane label="待发货" name="1" />
      <el-tab-pane label="待收货" name="3" />
      <el-tab-pane label="已完成" name="4" />
    </el-tabs>

    <div v-if="loading" class="loading-wrap">
      <el-skeleton :rows="5" animated />
    </div>

    <template v-else-if="filteredOrders.length > 0">
      <el-card v-for="order in filteredOrders" :key="order.id" class="order-card" shadow="hover" @click="$router.push(`/order/${order.id}`)" style="cursor:pointer">
        <div class="order-header">
          <div class="order-meta">
            <span class="order-id">订单号：{{ order.id }}</span>
            <span class="order-time">{{ order.createTime }}</span>
          </div>
          <el-tag :type="statusTagType(order.status)" effect="plain">{{ statusText(order.status) }}</el-tag>
        </div>

        <div class="order-items">
          <div v-for="item in order.items" :key="item.id" class="order-item">
            <span class="oi-name">{{ item.productName }}</span>
            <span class="oi-quantity">x{{ item.quantity }}</span>
            <span class="oi-price">¥{{ item.price.toFixed(2) }}</span>
          </div>
        </div>

        <div class="order-footer">
          <div class="order-total">
            合计：<span class="total-amount">¥{{ order.totalAmount.toFixed(2) }}</span>
          </div>
          <div class="order-actions">
            <el-button v-if="order.status === 0" type="danger" @click="$router.push(`/order/pay/${order.id}`)">
              去支付
            </el-button>
            <el-button v-if="order.status === 3" type="primary" @click.stop="handleConfirm(order.id)" :loading="confirmingId === order.id">
              确认收货
            </el-button>
            <el-button v-if="order.status === 1" type="warning" plain @click.stop="$router.push(`/refund/apply/${order.id}`)">
              申请退款
            </el-button>
            <template v-if="order.status === 4">
              <el-button v-for="item in order.items" :key="item.id" type="success" plain @click.stop="$router.push(`/order/review/${item.id}`)">
                评价「{{ item.productName.length > 6 ? item.productName.slice(0, 6) + '...' : item.productName }}」
              </el-button>
            </template>
          </div>
        </div>
      </el-card>
    </template>

    <el-empty v-else description="暂无相关订单" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getMyOrders, confirmReceipt } from '@/api/order'

const loading = ref(false)
const activeTab = ref('all')
const orders = ref([])
const confirmingId = ref(null)

const filteredOrders = computed(() => {
  if (activeTab.value === 'all') return orders.value
  const status = Number(activeTab.value)
  return orders.value.filter(o => o.status === status)
})

function statusText(status) {
  const map = { 0: '待付款', 1: '待发货', 2: '已取消', 3: '待收货', 4: '已收货', 5: '已评价', 6: '退款中', 7: '已退款' }
  return map[status] || '未知'
}

function statusTagType(status) {
  const map = { 0: 'warning', 1: '', 2: 'info', 3: 'primary', 4: 'success', 5: 'success', 6: 'danger', 7: 'info' }
  return map[status] || 'info'
}

async function fetchOrders() {
  loading.value = true
  try {
    const res = await getMyOrders()
    orders.value = res.data || []
  } catch (e) {
    ElMessage.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

async function handleConfirm(orderId) {
  confirmingId.value = orderId
  try {
    await confirmReceipt(orderId)
    ElMessage.success('确认收货成功')
    await fetchOrders()
  } catch (e) {
    ElMessage.error('确认收货失败')
  } finally {
    confirmingId.value = null
  }
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.orders-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 16px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 20px;
  color: #1a1a2e;
}

.order-tabs {
  margin-bottom: 20px;
}

.order-card {
  margin-bottom: 16px;
  border-radius: 12px;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.order-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.order-id {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.order-time {
  font-size: 12px;
  color: #909399;
}

.order-items {
  margin-bottom: 12px;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
  font-size: 14px;
  color: #606266;
}

.oi-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.oi-quantity {
  color: #909399;
  min-width: 40px;
  text-align: center;
}

.oi-price {
  font-weight: 500;
  min-width: 80px;
  text-align: right;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.order-total {
  font-size: 14px;
  color: #606266;
}

.total-amount {
  font-size: 18px;
  font-weight: 700;
  color: #e6323e;
}

.order-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.loading-wrap {
  padding: 24px 0;
}
</style>
