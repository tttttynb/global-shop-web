<template>
  <div class="page-container refund-list-page">
    <h2 class="page-title">退款记录</h2>
    <div v-loading="loading">
      <template v-if="list.length > 0">
        <el-card v-for="item in list" :key="item.id" class="refund-card" shadow="hover">
          <div class="refund-header">
            <span>退款单号：{{ item.id }}</span>
            <el-tag :type="statusType(item.status)">{{ statusText(item.status) }}</el-tag>
          </div>
          <div class="refund-info">
            <span>订单号：{{ item.orderId }}</span>
            <span class="refund-amount">退款金额：¥{{ item.refundAmount?.toFixed(2) }}</span>
          </div>
          <div class="refund-reason">原因：{{ item.reason }}</div>
          <div class="refund-actions" v-if="item.status === 0">
            <el-button type="danger" size="small" text @click="handleCancel(item.id)">取消退款</el-button>
          </div>
        </el-card>
      </template>
      <el-empty v-if="!loading && list.length === 0" description="暂无退款记录" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getRefundList, cancelRefund } from '@/api/order'

const loading = ref(true)
const list = ref([])

function statusText(s) {
  return { 0: '待审核', 1: '商家同意', 2: '商家拒绝', 3: '退款成功', 4: '已取消' }[s] || '未知'
}
function statusType(s) {
  return { 0: 'warning', 1: '', 2: 'danger', 3: 'success', 4: 'info' }[s] || 'info'
}

async function loadList() {
  loading.value = true
  try {
    const res = await getRefundList()
    list.value = res.data || []
  } catch {} finally { loading.value = false }
}

async function handleCancel(id) {
  try {
    await cancelRefund(id)
    ElMessage.success('已取消退款')
    await loadList()
  } catch {}
}

onMounted(loadList)
</script>

<style scoped>
.refund-list-page { max-width: 700px; margin: 0 auto; padding: 24px 16px; }
.page-title { font-size: 24px; font-weight: 700; margin-bottom: 24px; }
.refund-card { margin-bottom: 12px; border-radius: var(--gs-radius-lg); }
.refund-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 14px; font-weight: 600; }
.refund-info { display: flex; justify-content: space-between; font-size: 13px; color: var(--gs-text-2); margin-bottom: 4px; }
.refund-amount { color: var(--gs-price); font-weight: 600; }
.refund-reason { font-size: 13px; color: var(--gs-text-3); }
.refund-actions { margin-top: 8px; text-align: right; }
</style>
