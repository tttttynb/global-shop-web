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
                <el-table-column label="规格" width="120">
                  <template #default="{ row: item }">{{ item.skuSpec && item.skuSpec !== '默认规格' ? item.skuSpec : '-' }}</template>
                </el-table-column>
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
            <span style="color: var(--gs-price); font-weight: 600;">¥{{ row.totalAmount?.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="物流" width="160" align="center">
          <template #default="{ row }">
            <span v-if="row.carrierName" style="font-size:13px;">{{ row.carrierName }}<br/>{{ row.trackingNumber }}</span>
            <span v-else style="color:var(--gs-text-3);">-</span>
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
              @click="openDeliverDialog(row.id)"
            >发货</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无订单，先把商品推广出去吧">
            <div class="empty-actions">
              <el-button type="primary" @click="$router.push('/merchant/product/publish')">发布商品引流</el-button>
              <el-button @click="$router.push('/merchant/live/create')">开播带货</el-button>
            </div>
          </el-empty>
        </template>
      </el-table>
    </el-card>

    <!-- 发货弹窗 -->
    <el-dialog v-model="deliverDialogVisible" title="填写物流信息" width="420px" :close-on-click-modal="false">
      <el-form :model="deliverForm" label-width="80px">
        <el-form-item label="物流公司" required>
          <el-select v-model="deliverForm.carrierName" placeholder="请选择物流公司" style="width: 100%" filterable allow-create>
            <el-option-group label="国内快递">
              <el-option label="顺丰速运" value="顺丰速运" />
              <el-option label="中通快递" value="中通快递" />
              <el-option label="圆通速递" value="圆通速递" />
              <el-option label="韵达快递" value="韵达快递" />
              <el-option label="EMS" value="EMS" />
            </el-option-group>
            <el-option-group label="国际快递">
              <el-option label="DHL" value="DHL" />
              <el-option label="FedEx" value="FedEx" />
              <el-option label="UPS" value="UPS" />
            </el-option-group>
          </el-select>
        </el-form-item>
        <el-form-item label="运单号" required>
          <el-input v-model="deliverForm.trackingNumber" placeholder="请输入运单号" />
        </el-form-item>
        <el-form-item label="快递编码">
          <el-input v-model="deliverForm.carrierCode" placeholder="选填，如SF/ZTO/DHL" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="deliverDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleDeliver" :loading="delivering">
          确认发货
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getMerchantOrders, deliverOrder } from '@/api/merchant'

const loading = ref(false)
const orderList = ref([])
const delivering = ref(false)
const deliverDialogVisible = ref(false)
const deliverForm = ref({
  orderId: null,
  carrierName: '',
  carrierCode: '',
  trackingNumber: ''
})

const statusMap = {
  0: { label: '待付款', type: 'warning' },
  1: { label: '已支付', type: '' },
  2: { label: '已取消', type: 'info' },
  3: { label: '已发货', type: 'primary' },
  4: { label: '已收货', type: 'success' },
  5: { label: '已评价', type: 'success' }
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

const openDeliverDialog = (orderId) => {
  deliverForm.value = {
    orderId: orderId,
    carrierName: '',
    carrierCode: '',
    trackingNumber: ''
  }
  deliverDialogVisible.value = true
}

const handleDeliver = async () => {
  if (!deliverForm.value.carrierName.trim()) {
    ElMessage.warning('请选择物流公司')
    return
  }
  if (!deliverForm.value.trackingNumber.trim()) {
    ElMessage.warning('请填写运单号')
    return
  }
  delivering.value = true
  try {
    await deliverOrder({
      orderId: deliverForm.value.orderId,
      carrierName: deliverForm.value.carrierName,
      carrierCode: deliverForm.value.carrierCode || '',
      trackingNumber: deliverForm.value.trackingNumber
    })
    ElMessage.success('发货成功！')
    deliverDialogVisible.value = false
    await fetchOrders()
  } catch (e) {
    ElMessage.error(e.message || '发货失败')
  } finally {
    delivering.value = false
  }
}

onMounted(fetchOrders)
</script>

<style scoped>
.merchant-orders {
  max-width: 1060px;
}
.page-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  color: var(--gs-text-1);
}
.table-card {
  border-radius: 8px;
}
.order-detail {
  padding: 12px 20px;
}
</style>
