<template>
  <div class="page-container pay-page">
    <div class="pay-card-wrap">
      <el-card class="pay-card" shadow="always">
        <div class="pay-icon">
          <el-icon size="48" color="#e6323e"><Money /></el-icon>
        </div>
        <h2 class="pay-title">订单支付</h2>
        <div class="pay-order-id">订单号：{{ orderId }}</div>

        <div class="pay-method">
          <div class="method-label">选择支付方式</div>
          <el-radio-group v-model="payMethod">
            <el-radio value="alipay">支付宝</el-radio>
            <el-radio value="wechat">微信支付</el-radio>
          </el-radio-group>
        </div>

        <el-button type="danger" size="large" class="pay-btn" @click="handlePay" :loading="paying">
          确认支付
        </el-button>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Money } from '@element-plus/icons-vue'
import { payOrder } from '@/api/order'

const route = useRoute()
const router = useRouter()

const orderId = ref(route.params.id)
const payMethod = ref('alipay')
const paying = ref(false)

async function handlePay() {
  paying.value = true
  try {
    await payOrder(orderId.value)
    ElMessage.success('支付成功')
    router.push('/orders')
  } catch (e) {
    ElMessage.error(e.message || '支付失败，请重试')
  } finally {
    paying.value = false
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
  width: 420px;
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
  margin-bottom: 32px;
}

.pay-method {
  margin-bottom: 32px;
}

.method-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
}

.pay-btn {
  width: 100%;
  font-size: 16px;
  height: 48px;
  border-radius: 8px;
}
</style>
