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
              <span v-if="item.skuSpec && item.skuSpec !== '默认规格'" class="item-spec" style="font-size:12px;color:var(--gs-text-3);background:#f5f7fa;border-radius:4px;padding:2px 8px;align-self:flex-start;">{{ item.skuSpec }}</span>
              <span class="item-qty">x{{ item.quantity }}</span>
            </div>
            <span class="item-price">{{ localeStore.formatPrice(item.price) }}</span>
          </div>

          <el-divider />

          <div class="order-summary">
            <div v-if="order.discountAmount > 0" class="summary-row">
              <span>优惠金额</span>
              <span class="discount">-{{ localeStore.formatPrice(order.discountAmount) }}</span>
            </div>
            <!-- 🆕 国际运费 + 跨境税（Phase 3 - F6） -->
            <div v-if="Number(order.shippingFee) > 0" class="summary-row">
              <span>{{ $t('order.shippingFee') }}</span>
              <span>{{ localeStore.formatPrice(order.shippingFee) }}</span>
            </div>
            <div v-if="Number(order.taxFee) > 0" class="summary-row">
              <span>{{ $t('order.taxFee') }}</span>
              <span>{{ localeStore.formatPrice(order.taxFee) }}</span>
            </div>
            <div class="summary-row">
              <span>实付金额</span>
              <span class="total-amount">{{ localeStore.formatPrice(order.totalAmount) }}</span>
            </div>
            <!-- 🆕 下单时锁汇快照（Phase 3 - F5：结算金额与展示一致，可追溯） -->
            <div v-if="order.currency && order.currency !== 'CNY'" class="summary-row forex-row">
              <span>{{ $t('order.forexSnapshot') }}</span>
              <span>
                {{ order.currency }} {{ Number(order.originalAmount || 0).toFixed(2) }}
                · {{ $t('order.lockedRate') }} 1 {{ order.currency }} = {{ order.exchangeRate }} CNY
              </span>
            </div>
            <div v-if="order.paymentType" class="summary-row">
              <span>支付方式</span>
              <span>{{ order.paymentType }}</span>
            </div>
            <div v-if="order.payTime" class="summary-row">
              <span>支付时间</span>
              <span>{{ order.payTime }}</span>
            </div>
            <div class="summary-row">
              <span>下单时间</span>
              <span>{{ order.createTime }}</span>
            </div>
          </div>

          <!-- 物流追踪卡片（订单已发货时显示） -->
          <template v-if="order.status === 3 && order.carrierName">
            <el-divider />
            <div class="shipping-card">
              <h3>物流信息</h3>
              <div class="shipping-info">
                <span class="shipping-carrier">{{ order.carrierName }}</span>
                <span class="shipping-tracking">运单号：{{ order.trackingNumber }}</span>
                <span v-if="order.shippedAt" class="shipping-time">发货时间：{{ order.shippedAt }}</span>
              </div>
              <div class="shipping-actions">
                <el-button type="primary" @click="$router.push(`/order/${order.id}/tracking`)">
                  查看物流详情
                </el-button>
                <el-button type="success" @click="handleConfirm(order.id)" :loading="confirming">
                  确认收货
                </el-button>
              </div>
            </div>
          </template>

          <div class="order-actions" v-if="order.status === 0">
            <el-button type="danger" @click="$router.push(`/order/pay/${order.id}`)">去支付</el-button>
          </div>
          <div class="order-actions" v-if="order.status === 3 && !order.carrierName">
            <el-button type="success" @click="handleConfirm(order.id)" :loading="confirming">确认收货</el-button>
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
import { ElMessage } from 'element-plus'
import { getOrderDetail, confirmReceipt } from '@/api/order'
import { useLocaleStore } from '@/stores/locale'

const route = useRoute()
const localeStore = useLocaleStore()
const loading = ref(true)
const confirming = ref(false)
const order = ref(null)

function statusText(s) {
  return { 0: '待付款', 1: '已支付', 2: '已取消', 3: '已发货', 4: '已收货', 5: '已评价' }[s] || '未知'
}
function statusTagType(s) {
  return { 0: 'warning', 1: '', 2: 'info', 3: 'primary', 4: 'success', 5: 'success' }[s] || 'info'
}

async function handleConfirm(orderId) {
  confirming.value = true
  try {
    await confirmReceipt(orderId)
    ElMessage.success('确认收货成功！')
    // 刷新订单
    const res = await getOrderDetail(route.params.id)
    order.value = res.data
  } catch (e) {
    ElMessage.error('确认收货失败')
  } finally {
    confirming.value = false
  }
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
.detail-card { border-radius: var(--gs-radius-lg); }
.order-header { display: flex; justify-content: space-between; align-items: center; }
.order-id { font-weight: 600; font-size: 16px; }
.address-section h3 { font-size: 16px; margin-bottom: 8px; }
.address-section p { font-size: 14px; color: var(--gs-text-2); margin: 4px 0; }
.order-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f5f5f5; }
.order-item:last-child { border-bottom: none; }
.item-image { width: 60px; height: 60px; border-radius: 6px; flex-shrink: 0; }
.img-placeholder { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: var(--gs-bg-hover); color: #ccc; }
.item-info { flex: 1; display: flex; justify-content: space-between; }
.item-name { font-size: 14px; }
.item-qty { color: var(--gs-text-3); }
.item-price { font-weight: 600; color: var(--gs-price); min-width: 80px; text-align: right; }
.order-summary { margin-top: 12px; }
.summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: var(--gs-text-2); }
.total-amount { font-size: 20px; font-weight: 700; color: #e6323e; }
.discount { color: var(--gs-success); }
/* 🆕 锁汇快照行（Phase 3 - F5） */
.forex-row span:last-child { font-size: 12px; color: var(--gs-primary); text-align: right; }
.order-actions { margin-top: 16px; text-align: right; }

/* Shipping card */
.shipping-card {
  background: #f0f9ff;
  border: 1px solid #b3d8ff;
  border-radius: 10px;
  padding: 16px;
  margin-top: 8px;
}
.shipping-card h3 {
  font-size: 16px;
  margin: 0 0 12px 0;
  color: var(--gs-text-1);
}
.shipping-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 14px;
}
.shipping-carrier {
  font-size: 15px;
  font-weight: 600;
  color: var(--gs-text-1);
}
.shipping-tracking {
  font-size: 14px;
  color: var(--gs-text-2);
  font-family: 'Courier New', monospace;
}
.shipping-time {
  font-size: 13px;
  color: var(--gs-text-3);
}
.shipping-actions {
  display: flex;
  gap: 12px;
}
</style>
