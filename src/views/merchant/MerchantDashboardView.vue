<template>
  <div class="dashboard-page">
    <h2 class="page-title">数据概览</h2>
    <div v-loading="loading">
      <el-row :gutter="20" class="stat-row">
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-value">{{ data.todayOrders || 0 }}</div>
            <div class="stat-label">今日订单</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-value">¥{{ (data.todaySales || 0).toFixed(2) }}</div>
            <div class="stat-label">今日销售额</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-value">{{ data.pendingShipment || 0 }}</div>
            <div class="stat-label">待发货</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-value">{{ data.totalProducts || 0 }}</div>
            <div class="stat-label">商品总数</div>
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-value">{{ data.totalOrders || 0 }}</div>
            <div class="stat-label">总订单数</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-value">¥{{ (data.totalSales || 0).toFixed(2) }}</div>
            <div class="stat-label">总销售额</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-value">{{ data.pendingRefunds || 0 }}</div>
            <div class="stat-label">待处理退款</div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getDashboard } from '@/api/merchant'

const loading = ref(true)
const data = ref({})

onMounted(async () => {
  try {
    const res = await getDashboard()
    data.value = res.data || {}
  } catch {} finally { loading.value = false }
})
</script>

<style scoped>
.dashboard-page { max-width: 960px; }
.page-title { font-size: 20px; font-weight: 600; margin-bottom: 20px; color: #303133; }
.stat-card { text-align: center; border-radius: 12px; }
.stat-value { font-size: 28px; font-weight: 700; color: #409eff; margin-bottom: 8px; }
.stat-label { font-size: 14px; color: #909399; }
</style>
