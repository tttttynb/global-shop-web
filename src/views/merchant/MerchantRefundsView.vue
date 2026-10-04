<template>
  <div class="merchant-refunds">
    <h2 class="page-title">退款管理</h2>
    <el-card class="table-card">
      <el-table v-loading="loading" :data="list" stripe>
        <el-table-column prop="id" label="退款单号" width="80" />
        <el-table-column prop="orderId" label="订单号" width="80" />
        <el-table-column label="退款金额" width="120" align="center">
          <template #default="{ row }"><span style="color: var(--gs-price); font-weight: 600;">¥{{ row.refundAmount?.toFixed(2) }}</span></template>
        </el-table-column>
        <el-table-column prop="reason" label="退款原因" min-width="150" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center">
          <template #default="{ row }">
            <template v-if="row.status === 0">
              <el-button type="success" size="small" @click="handleApprove(row.id)">同意</el-button>
              <el-button type="danger" size="small" @click="handleReject(row.id)">拒绝</el-button>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getShopRefunds, approveRefund, rejectRefund } from '@/api/merchant'

const loading = ref(true)
const list = ref([])

function statusText(s) { return { 0: '待审核', 1: '已同意', 2: '已拒绝', 3: '退款成功', 4: '已取消' }[s] || '未知' }
function statusType(s) { return { 0: 'warning', 1: 'success', 2: 'danger', 3: 'success', 4: 'info' }[s] || 'info' }

async function loadList() {
  loading.value = true
  try { const res = await getShopRefunds(); list.value = res.data || [] } catch {} finally { loading.value = false }
}

async function handleApprove(id) {
  try { await approveRefund(id); ElMessage.success('已同意退款'); await loadList() } catch {}
}

async function handleReject(id) {
  try {
    const { value } = await ElMessageBox.prompt('请输入拒绝原因', '拒绝退款', { inputPlaceholder: '原因' })
    await rejectRefund(id, value); ElMessage.success('已拒绝'); await loadList()
  } catch {}
}

onMounted(loadList)
</script>

<style scoped>
.merchant-refunds { max-width: 960px; }
.page-title { font-size: 20px; font-weight: 600; margin-bottom: 20px; color: var(--gs-text-1); }
.table-card { border-radius: 8px; }
</style>
