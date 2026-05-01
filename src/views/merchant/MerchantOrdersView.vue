<template>
  <div class="merchant-orders">
    <h2 class="page-title">订单管理</h2>

    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="orderList"
        stripe
        style="width: 100%"
        row-key="id"
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="order-detail">
              <el-table :data="row.items" border size="small" style="max-width: 600px;">
                <el-table-column prop="productName" label="商品名称" />
                <el-table-column prop="quantity" label="数量" width="80" align="center" />
                <el-table-column label="单价" width="100" align="center">
                  <template #default="{ row: item }">¥{{ item.price?.toFixed(2) }}</template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="id" label="订单号" width="100" align="center" />
        <el-table-column prop="createTime" label="下单时间" min-width="170" />
        <el-table-column label="订单金额" width="120" align="center">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: 600;">¥{{ row.totalAmount?.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type">{{ statusMap[row.status]?.label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 1"
              type="primary"
              size="small"
              :loading="deliveringId === row.id"
              @click="handleDeliver(row.id)"
            >发货</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无订单" />
        </template>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getMerchantOrders, deliverOrder } from '@/api/merchant'

const loading = ref(false)
const orderList = ref([])
const deliveringId = ref(null)

const statusMap = {
  0: { label: '待付款', type: 'warning' },
  1: { label: '已支付', type: '' },
  2: { label: '已发货', type: 'info' },
  3: { label: '已收货', type: 'success' },
  4: { label: '已取消', type: 'info' },
  5: { label: '退款中', type: 'danger' },
  6: { label: '已退款', type: '' }
}

const fetchOrders = async () => {
  loading.value = true
  try {
    const res = await getMerchantOrders()
    orderList.value = res.data || []
  } finally {
    loading.value = false
  }
}

const handleDeliver = async (id) => {
  deliveringId.value = id
  try {
    await deliverOrder(id)
    ElMessage.success('发货成功！')
    await fetchOrders()
  } finally {
    deliveringId.value = null
  }
}

onMounted(fetchOrders)
</script>

<style scoped>
.merchant-orders {
  max-width: 960px;
}
.page-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #303133;
}
.table-card {
  border-radius: 8px;
}
.order-detail {
  padding: 12px 20px;
}
</style>
