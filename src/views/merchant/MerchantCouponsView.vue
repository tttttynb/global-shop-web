<template>
  <div class="merchant-coupons">
    <div class="page-header">
      <h2 class="page-title">优惠券管理</h2>
      <el-button type="primary" @click="showCreateDialog = true">创建优惠券</el-button>
    </div>

    <el-card class="table-card">
      <el-table v-loading="loading" :data="couponList" stripe>
        <el-table-column prop="name" label="优惠券名称" min-width="140" />
        <el-table-column label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.type === 1 ? 'warning' : ''">{{ row.type === 1 ? '满减' : '折扣' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="面额/折扣" width="110" align="center">
          <template #default="{ row }">
            {{ row.type === 1 ? `¥${row.discountValue}` : `${row.discountValue}折` }}
          </template>
        </el-table-column>
        <el-table-column label="使用门槛" width="110" align="center">
          <template #default="{ row }">
            {{ row.minAmount > 0 ? `满¥${row.minAmount}` : '无门槛' }}
          </template>
        </el-table-column>
        <el-table-column label="库存" width="80" align="center">
          <template #default="{ row }">{{ row.stock }}</template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="160" />
        <el-table-column prop="endTime" label="结束时间" width="160" />
        <template #empty>
          <el-empty description="还没有优惠券，创建一张帮助商品转化">
            <div class="empty-actions">
              <el-button type="primary" @click="showCreateDialog = true">创建优惠券</el-button>
            </div>
          </el-empty>
        </template>
      </el-table>
    </el-card>

    <!-- 创建优惠券弹窗 -->
    <el-dialog v-model="showCreateDialog" title="创建优惠券" width="500px" destroy-on-close>
      <el-form :model="form" label-width="90px">
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="如：满100减20" />
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="form.type">
            <el-radio :value="1">满减</el-radio>
            <el-radio :value="2">折扣</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="面额/折扣">
          <el-input-number v-model="form.discountValue" :min="0" :precision="2" />
          <span style="margin-left:8px;color:var(--gs-text-3)">{{ form.type === 1 ? '元' : '折 (如8.5表示85折)' }}</span>
        </el-form-item>
        <el-form-item label="使用门槛">
          <el-input-number v-model="form.minAmount" :min="0" :precision="2" />
          <span style="margin-left:8px;color:var(--gs-text-3)">元 (0表示无门槛)</span>
        </el-form-item>
        <el-form-item label="发放数量">
          <el-input-number v-model="form.stock" :min="1" />
        </el-form-item>
        <el-form-item label="有效期">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="createLoading" @click="handleCreate">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { createCoupon, getMerchantCoupons } from '@/api/merchant'

const loading = ref(false)
const couponList = ref([])
const showCreateDialog = ref(false)
const createLoading = ref(false)
const dateRange = ref([])

const form = ref({
  name: '',
  type: 1,
  discountValue: 10,
  minAmount: 100,
  stock: 100
})

async function fetchCoupons() {
  loading.value = true
  try {
    const res = await getMerchantCoupons()
    couponList.value = res.data || []
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  if (!form.value.name) return ElMessage.warning('请输入优惠券名称')
  if (!dateRange.value || dateRange.value.length < 2) return ElMessage.warning('请选择有效期')
  createLoading.value = true
  try {
    await createCoupon({
      ...form.value,
      startTime: dateRange.value[0],
      endTime: dateRange.value[1]
    })
    ElMessage.success('创建成功')
    showCreateDialog.value = false
    form.value = { name: '', type: 1, discountValue: 10, minAmount: 100, stock: 100 }
    dateRange.value = []
    await fetchCoupons()
  } catch (e) {
    ElMessage.error('创建失败')
  } finally {
    createLoading.value = false
  }
}

onMounted(fetchCoupons)
</script>

<style scoped>
.merchant-coupons { max-width: 960px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-title { font-size: 20px; font-weight: 600; margin: 0; color: var(--gs-text-1); }
.table-card { border-radius: var(--gs-radius-lg); }
</style>
