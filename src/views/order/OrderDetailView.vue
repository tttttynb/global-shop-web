<template>
  <div class="page-container order-detail-page">
    <h2 class="page-title">订单详情</h2>
    <div v-loading="loading">
      <template v-if="order">
        <el-card class="detail-card">
          <div class="order-header">
            <span class="order-id">订单号：{{ order.id }}</span>
            <el-tag :type="statusTagType(order.status)">{{ statusText(order.status) }}</el-tag>
          </div>

          <el-divider />

          <div v-if="order.receiverName" class="address-section">
            <h3>收货信息</h3>
            <p><strong>{{ order.receiverName }}</strong> {{ order.receiverPhone }}</p>
            <p>{{ order.receiverAddress }}</p>
          </div>

          <el-divider v-if="order.receiverName" />

          <h3>商品信息</h3>
          <div v-for="item in order.items" :key="item.id" class="order-item">
            <el-image :src="item.coverImage" fit="cover" class="item-image">
              <template #error><div class="img-placeholder"><el-icon><Picture /></el-icon></div></template>
            </el-image>
            <div class="item-info">
              <span class="item-name">{{ item.productName }}</span>
              <span class="item-qty">x{{ item.quantity }}</span>
            </div>
            <span class="item-price">¥{{ item.price?.toFixed(2) }}</span>
          </div>

          <el-divider />

          <div class="order-summary">
            <div v-if="order.discountAmount > 0" class="summary-row">
              <span>优惠金额</span>
              <span class="discount">-¥{{ order.discountAmount?.toFixed(2) }}</span>
            </div>
            <div class="summary-row">
              <span>实付金额</span>
              <span class="total-amount">¥{{ order.totalAmount?.toFixed(2) }}</span>
            </div>
            <div class="summary-row">
              <span>下单时间</span>
              <span>{{ order.createTime }}</span>
            </div>
          </div>

          <div class="order-actions" v-if="order.status === 0">
            <el-button type="danger" @click="$router.push(`/order/pay/${order.id}`)">去支付</el-button>
          </div>
          <div class="order-actions" v-if="order.status === 1 || order.status === 4">
            <el-button type="warning" @click="$router.push(`/refund/apply?orderId=${order.id}`)">申请退款</el-button>
          </div>
        </el-card>
      </template>
      <el-empty v-if="!loading && !order" description="订单不存在" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getOrderDetail } from '@/api/order'

const route = useRoute()
const loading = ref(true)
const order = ref(null)

function statusText(s) {
  return { 0: '待付款', 1: '已支付', 2: '已取消', 3: '已发货', 4: '已收货', 5: '已评价' }[s] || '未知'
}
function statusTagType(s) {
  return { 0: 'warning', 1: '', 2: 'info', 3: 'primary', 4: 'success', 5: 'success' }[s] || 'info'
}

onMounted(async () => {
  try {
    const res = await getOrderDetail(route.params.id)
    order.value = res.data
  } catch {} finally { loading.value = false }
})
</script>

<style scoped>
.order-detail-page { max-width: 700px; margin: 0 auto; padding: 24px 16px; }
.page-title { font-size: 24px; font-weight: 700; margin-bottom: 24px; }
.detail-card { border-radius: 12px; }
.order-header { display: flex; justify-content: space-between; align-items: center; }
.order-id { font-weight: 600; font-size: 16px; }
.address-section h3 { font-size: 16px; margin-bottom: 8px; }
.address-section p { font-size: 14px; color: #606266; margin: 4px 0; }
.order-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f5f5f5; }
.order-item:last-child { border-bottom: none; }
.item-image { width: 60px; height: 60px; border-radius: 6px; flex-shrink: 0; }
.img-placeholder { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: #f5f5f5; color: #ccc; }
.item-info { flex: 1; display: flex; justify-content: space-between; }
.item-name { font-size: 14px; }
.item-qty { color: #909399; }
.item-price { font-weight: 600; color: #f56c6c; min-width: 80px; text-align: right; }
.order-summary { margin-top: 12px; }
.summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: #606266; }
.total-amount { font-size: 20px; font-weight: 700; color: #e6323e; }
.discount { color: #67c23a; }
.order-actions { margin-top: 16px; text-align: right; }
</style>
