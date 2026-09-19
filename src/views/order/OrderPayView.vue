<template>
  <div class="page-container pay-page">
    <div class="pay-card-wrap">
      <el-card class="pay-card" shadow="always">
        <div class="pay-icon">
          <el-icon size="48" color="#e6323e"><Money /></el-icon>
        </div>
        <h2 class="pay-title">{{ $t('pay.title') }}</h2>
        <div class="pay-order-id">{{ $t('pay.orderNo') }}{{ orderId }}</div>
        <div class="pay-amount" v-if="orderAmount > 0">
          {{ $t('pay.payAmount') }}<span class="amount-num">{{ localeStore.formatPrice(orderAmount) }}</span>
        </div>

        <!-- 🆕 金额明细：商品 + 国际运费 + 跨境税（Phase 3 - F6，结算金额与展示一致） -->
        <div class="amount-breakdown" v-if="goodsAmount !== null">
          <div class="bd-row">
            <span>{{ $t('pay.goodsAmount') }}</span>
            <span>{{ localeStore.formatPrice(goodsAmount) }}</span>
          </div>
          <div class="bd-row" v-if="shippingFee > 0">
            <span>{{ $t('pay.shipping') }}</span>
            <span>{{ localeStore.formatPrice(shippingFee) }}</span>
          </div>
          <div class="bd-row" v-if="taxFee > 0">
            <span>{{ $t('pay.tax') }}</span>
            <span>{{ localeStore.formatPrice(taxFee) }}</span>
          </div>
          <div class="bd-row" v-if="discountAmount > 0">
            <span>{{ $t('pay.discount') }}</span>
            <span class="bd-discount">-{{ localeStore.formatPrice(discountAmount) }}</span>
          </div>
        </div>

        <!-- 余额提示 -->
        <div class="balance-tip" v-if="userBalance !== null">
          {{ $t('pay.balance') }}<span :class="balanceSufficient ? 'balance-ok' : 'balance-low'">{{ localeStore.formatPrice(userBalance) }}</span>
          <el-button size="small" type="primary" link @click="showRecharge = true">{{ $t('pay.recharge') }}</el-button>
        </div>

        <!-- 充值弹窗 -->
        <div v-if="showRecharge" class="recharge-box">
          <el-input-number v-model="rechargeAmount" :min="1" :max="99999" :precision="2" controls-position="right" style="width: 200px" />
          <el-button type="success" size="small" @click="handleRecharge" :loading="recharging">{{ $t('pay.confirmRecharge') }}</el-button>
          <el-button size="small" @click="showRecharge = false">{{ $t('pay.cancel') }}</el-button>
        </div>

        <!-- 支付渠道选择 -->
        <div class="pay-method" v-if="!payResult">
          <div class="method-label">{{ $t('pay.chooseMethod') }}</div>
          <el-radio-group v-model="selectedChannel" class="channel-group">
            <el-radio v-for="ch in channels" :key="ch.code" :value="ch.code" class="channel-item">
              <span class="channel-label">{{ ch.label }}</span>
              <span class="channel-tag" v-if="ch.code === 0">{{ $t('pay.recommended') }}</span>
            </el-radio>
          </el-radio-group>
          <div v-if="channels.length === 0" class="no-channel">{{ $t('pay.noChannel') }}</div>
        </div>

        <!-- 支付结果展示 -->
        <div v-if="payResult" class="pay-result">
          <el-icon :size="36" :color="payResult.status === 1 ? '#67c23a' : '#e6323e'">
            <SuccessFilled v-if="payResult.status === 1" />
            <WarningFilled v-else />
          </el-icon>
          <p class="result-text">{{ payResult.statusLabel }}</p>
          <p class="result-amount" v-if="payResult.status === 1">{{ localeStore.formatPrice(payResult.amount) }}</p>
        </div>

        <!-- 第三方支付二维码/链接（Mock） -->
        <div v-if="payResult && payResult.status === 0 && (payResult.payUrl || payResult.qrCode)" class="third-party-pay">
          <p class="mock-hint">{{ $t('pay.mockPayHint') }}</p>
          <el-button type="primary" size="small" @click="mockPayCallback(payResult)">{{ $t('pay.mockPayBtn') }}</el-button>
          <p class="polling-hint" v-if="polling">{{ $t('pay.polling') }}</p>
        </div>

        <!-- 支付按钮 -->
        <el-button v-if="!payResult || payResult.status === 2" type="danger" size="large" class="pay-btn" @click="handlePay" :loading="paying" :disabled="channels.length === 0">
          {{ paying ? $t('pay.paying') : $t('pay.confirmPay') + (orderAmount > 0 ? ' ' + localeStore.formatPrice(orderAmount) : '') }}
        </el-button>

        <!-- 支付成功后操作 -->
        <div v-if="payResult && payResult.status === 1" class="pay-actions">
          <el-button type="primary" @click="$router.push('/orders')">{{ $t('pay.viewOrder') }}</el-button>
          <el-button @click="$router.push('/')">{{ $t('pay.continueShopping') }}</el-button>
        </div>

        <!-- 支付失败重试 -->
        <div v-if="payResult && payResult.status === 2" class="pay-actions">
          <el-button type="primary" @click="resetPay">{{ $t('pay.changeMethod') }}</el-button>
          <el-button @click="$router.push('/orders')">{{ $t('pay.backToOrders') }}</el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Money, SuccessFilled, WarningFilled } from '@element-plus/icons-vue'
import { getOrderDetail } from '@/api/order'
import { createPayment, queryPaymentStatus, getPaymentChannels, rechargeBalance } from '@/api/payment'
import { useLocaleStore } from '@/stores/locale'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const localeStore = useLocaleStore()

const orderId = ref(route.params.id)
const orderAmount = ref(0)
const userBalance = ref(null)
const channels = ref([])
const selectedChannel = ref(0)
const paying = ref(false)
const payResult = ref(null)
const polling = ref(false)
let pollTimer = null

// 🆕 订单费用明细（Phase 3 - F6：运费/税费已计入 totalAmount）
const shippingFee = ref(0)
const taxFee = ref(0)
const discountAmount = ref(0)
const goodsAmount = computed(() => {
  if (!orderAmount.value) return null
  const g = orderAmount.value - shippingFee.value - taxFee.value
  return g > 0 ? g : null
})

// 充值
const showRecharge = ref(false)
const rechargeAmount = ref(100)
const recharging = ref(false)

const balanceSufficient = computed(() => {
  return userBalance.value !== null && userBalance.value >= orderAmount.value
})

onMounted(async () => {
  // 1. 加载订单金额（含运费/税费明细）
  try {
    const res = await getOrderDetail(orderId.value)
    if (res.data) {
      orderAmount.value = res.data.totalAmount || 0
      shippingFee.value = Number(res.data.shippingFee) || 0
      taxFee.value = Number(res.data.taxFee) || 0
      discountAmount.value = Number(res.data.discountAmount) || 0
    }
  } catch (e) {
    ElMessage.error(t('messages.orderInfoFailed'))
  }

  // 2. 加载可用支付渠道
  try {
    const res = await getPaymentChannels()
    if (res.data && res.data.length > 0) {
      channels.value = res.data
      selectedChannel.value = res.data[0].code // 默认选第一个
    }
  } catch (e) {
    // 降级：至少显示余额支付
    channels.value = [{ code: 0, name: 'balance', label: '余额支付' }]
  }

  // 3. 尝试加载余额（通过user profile接口）
  try {
    const { getProfile } = await import('@/api/user')
    const profileRes = await getProfile()
    if (profileRes.data) {
      userBalance.value = profileRes.data.balance || 0
    }
  } catch (e) {
    // 余额加载失败，忽略
  }
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

async function handlePay() {
  paying.value = true
  payResult.value = null

  try {
    const res = await createPayment({
      orderId: Number(orderId.value),
      channel: selectedChannel.value
    })

    const data = res.data
    payResult.value = data

    if (data.status === 1) {
      // 余额支付：立即成功
      ElMessage.success(t('pay.paySuccess'))
      userBalance.value = userBalance.value !== null ? userBalance.value - data.amount : null
    } else if (data.status === 0 && (data.payUrl || data.qrCode || data.clientSecret)) {
      // 第三方支付：需要等回调，启动轮询
      ElMessage.info(t('pay.waitCallback'))
      startPolling(data.paymentId)
    } else if (data.status === 2) {
      ElMessage.error(t('pay.payFailed'))
    }
  } catch (e) {
    ElMessage.error(e.message || t('pay.payFailed'))
  } finally {
    paying.value = false
  }
}

function startPolling(paymentId) {
  polling.value = true
  let pollCount = 0
  const maxPolls = 60 // 最多轮询3分钟

  pollTimer = setInterval(async () => {
    pollCount++
    try {
      const res = await queryPaymentStatus(paymentId)
      if (res.data && res.data.status !== 0) {
        clearInterval(pollTimer)
        polling.value = false
        // 更新支付结果
        payResult.value = {
          ...payResult.value,
          status: res.data.status,
          statusLabel: getStatusLabel(res.data.status)
        }
        if (res.data.status === 1) {
          ElMessage.success(t('pay.paySuccess'))
        } else {
          ElMessage.error(t('pay.payFailed'))
        }
      }
    } catch (e) {
      // 轮询出错，继续
    }
    if (pollCount >= maxPolls) {
      clearInterval(pollTimer)
      polling.value = false
      ElMessage.warning(t('pay.payTimeout'))
    }
  }, 3000)
}

async function mockPayCallback(paymentResult) {
  // 模拟第三方支付回调
  try {
    const channelName = channels.value.find(c => c.code === paymentResult.channel)?.name || 'alipay'
    await fetch(`/api/payment/callback/${channelName}?out_trade_no=${paymentResult.outTradeNo}&trade_no=MOCK${Date.now()}&status=success`, { method: 'POST' })
    ElMessage.success(t('pay.paySuccess'))
    // 立即更新状态
    clearInterval(pollTimer)
    polling.value = false
    payResult.value = { ...paymentResult, status: 1, statusLabel: '支付成功' }
  } catch (e) {
    ElMessage.error(t('pay.payFailed'))
  }
}

function resetPay() {
  payResult.value = null
}

function getStatusLabel(status) {
  const map = { 0: '待支付', 1: '支付成功', 2: '支付失败', 3: '已退款', 4: '已关闭' }
  return map[status] || '未知'
}

async function handleRecharge() {
  if (rechargeAmount.value <= 0) {
    ElMessage.warning(t('pay.rechargeInvalid'))
    return
  }
  recharging.value = true
  try {
    await rechargeBalance(rechargeAmount.value)
    ElMessage.success(t('pay.rechargeSuccess'))
    userBalance.value = (userBalance.value || 0) + rechargeAmount.value
    showRecharge.value = false
  } catch (e) {
    ElMessage.error(e.message || t('pay.rechargeFailed'))
  } finally {
    recharging.value = false
  }
}
</script>

<style scoped>
.pay-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 48px 16px;
}

.pay-card-wrap {
  display: flex;
  justify-content: center;
}

.pay-card {
  width: 460px;
  border-radius: 16px;
  text-align: center;
  padding: 24px;
}

.pay-icon {
  margin-bottom: 16px;
}

.pay-title {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.pay-order-id {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.pay-amount {
  font-size: 16px;
  color: #303133;
  margin-bottom: 16px;
}

.amount-num {
  font-size: 24px;
  font-weight: 700;
  color: #e6323e;
}

/* 🆕 金额明细（Phase 3 - F6） */
.amount-breakdown {
  margin: 0 auto 16px;
  max-width: 300px;
  padding: 10px 14px;
  background: #fafafa;
  border-radius: 8px;
  text-align: left;
}
.bd-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #606266;
  padding: 3px 0;
}
.bd-discount {
  color: #67c23a;
}

.balance-tip {
  font-size: 14px;
  color: #606266;
  margin-bottom: 20px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.balance-ok {
  color: #67c23a;
  font-weight: 600;
}

.balance-low {
  color: #e6323e;
  font-weight: 600;
}

.recharge-box {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  margin-bottom: 20px;
}

.pay-method {
  margin-bottom: 24px;
  text-align: left;
}

.method-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
}

.channel-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.channel-item {
  padding: 10px 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  width: 100%;
  margin: 0 !important;
  transition: border-color 0.3s;
}

.channel-item:hover {
  border-color: #409eff;
}

.channel-label {
  font-size: 15px;
  font-weight: 500;
}

.channel-tag {
  font-size: 11px;
  background: #ecf5ff;
  color: #409eff;
  padding: 2px 8px;
  border-radius: 4px;
  margin-left: 8px;
}

.no-channel {
  font-size: 14px;
  color: #909399;
  padding: 20px;
}

.pay-btn {
  width: 100%;
  font-size: 16px;
  height: 48px;
  border-radius: 8px;
}

.pay-result {
  margin-bottom: 24px;
}

.result-text {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 12px 0 4px;
}

.result-amount {
  font-size: 14px;
  color: #909399;
}

.third-party-pay {
  margin-bottom: 20px;
  padding: 16px;
  background: #fdf6ec;
  border-radius: 8px;
}

.mock-hint {
  font-size: 13px;
  color: #e6a23c;
  margin-bottom: 8px;
}

.polling-hint {
  font-size: 13px;
  color: #409eff;
  margin-top: 8px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.pay-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 16px;
}
</style>
