<template>
  <div class="page-container tracking-page">
    <div class="tracking-header">
      <el-button type="default" @click="$router.back()" :icon="'ArrowLeft'" link>
        <el-icon><ArrowLeft /></el-icon> 返回订单
      </el-button>
      <h2 class="page-title">物流追踪</h2>
    </div>

    <div v-loading="loading">
      <template v-if="shipment">
        <!-- 物流基本信息卡片 -->
        <el-card class="info-card" shadow="hover">
          <div class="carrier-info">
            <div class="carrier-name">{{ shipment.carrierName }}</div>
            <div class="tracking-number">
              运单号：<span class="tn-value">{{ shipment.trackingNumber }}</span>
              <el-button size="small" type="primary" link @click="copyTrackingNumber">复制</el-button>
            </div>
          </div>
          <div class="status-badge">
            <el-tag :type="statusTagType(shipment.status)" size="large" effect="dark">
              {{ shipment.statusLabel }}
            </el-tag>
          </div>
          <div class="extra-info" v-if="shipment.estimatedDelivery">
            <span>预计送达：{{ shipment.estimatedDelivery }}</span>
          </div>
          <div class="extra-info" v-if="shipment.currentLocation">
            <span>当前位置：{{ shipment.currentLocation }}</span>
          </div>
        </el-card>

        <!-- 物流轨迹时间线 -->
        <el-card class="timeline-card" shadow="hover">
          <h3 class="timeline-title">物流详情</h3>
          <el-timeline v-if="shipment.trackingNodes && shipment.trackingNodes.length > 0">
            <el-timeline-item
              v-for="(node, index) in shipment.trackingNodes"
              :key="index"
              :timestamp="node.time"
              :color="index === 0 ? '#409eff' : '#c0c4cc'"
              :hollow="index !== 0"
              size="large"
            >
              <div class="timeline-node">
                <div class="node-status">{{ node.status }}</div>
                <div class="node-location" v-if="node.location">
                  <el-icon><LocationFilled /></el-icon> {{ node.location }}
                </div>
                <div class="node-desc">{{ node.description }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="暂无物流轨迹" />
        </el-card>

        <!-- 刷新按钮 -->
        <div class="refresh-bar">
          <el-button @click="handleRefresh" :loading="refreshing">
            <el-icon><Refresh /></el-icon> 刷新物流信息
          </el-button>
        </div>
      </template>
      <el-empty v-if="!loading && !shipment" description="暂无物流信息">
        <el-button type="primary" @click="$router.back()">返回订单</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, LocationFilled, Refresh } from '@element-plus/icons-vue'
import { getShipmentByOrder, refreshTracking } from '@/api/shipment'

const route = useRoute()
const loading = ref(true)
const refreshing = ref(false)
const shipment = ref(null)

function statusTagType(status) {
  return { 0: 'warning', 1: '', 2: 'primary', 3: 'success', 4: 'danger' }[status] || 'info'
}

function copyTrackingNumber() {
  if (shipment.value?.trackingNumber) {
    navigator.clipboard.writeText(shipment.value.trackingNumber)
    ElMessage.success('运单号已复制')
  }
}

async function fetchShipment() {
  loading.value = true
  try {
    const res = await getShipmentByOrder(route.params.id)
    shipment.value = res.data
  } catch (e) {
    // 物流信息不存在
    shipment.value = null
  } finally {
    loading.value = false
  }
}

async function handleRefresh() {
  if (!shipment.value) return
  refreshing.value = true
  try {
    const res = await refreshTracking(shipment.value.id)
    shipment.value = res.data
    ElMessage.success('物流信息已刷新')
  } catch (e) {
    ElMessage.error('刷新失败')
  } finally {
    refreshing.value = false
  }
}

onMounted(fetchShipment)
</script>

<style scoped>
.tracking-page {
  max-width: 640px;
  margin: 0 auto;
  padding: 24px 16px;
}

.tracking-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

.info-card {
  margin-bottom: 20px;
  border-radius: 12px;
}

.carrier-info {
  margin-bottom: 12px;
}

.carrier-name {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
}

.tracking-number {
  font-size: 14px;
  color: #606266;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.tn-value {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 4px;
}

.status-badge {
  margin-bottom: 12px;
}

.extra-info {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.timeline-card {
  border-radius: 12px;
}

.timeline-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #303133;
}

.timeline-node {
  padding: 4px 0;
}

.node-status {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.node-location {
  font-size: 13px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 4px 0;
}

.node-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}

.refresh-bar {
  text-align: center;
  margin-top: 20px;
}
</style>
