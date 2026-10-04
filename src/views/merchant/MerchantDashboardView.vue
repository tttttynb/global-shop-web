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

      <!-- ====== 客户画像分布（Tier 2.3，ECharts 环形图 + 明细） ====== -->
      <el-card class="analytics-card" shadow="hover" v-if="data.customerTiers">
        <template #header><h3>👥 客户画像分布</h3></template>
        <div class="tier-layout" v-if="tierOption">
          <EChartBase :option="tierOption" :height="240" class="tier-chart" />
          <div class="tier-rows">
            <div v-for="(count, tier) in data.customerTiers" :key="tier" class="tier-row">
              <span class="tier-label">{{ tierIcon(tier) }} {{ tierName(tier) }}</span>
              <el-progress
                :percentage="tierPercent(tier, count)"
                :color="tierColor(tier)"
                :stroke-width="20"
                :show-text="false"
                style="flex: 1; margin: 0 12px;"
              />
              <span class="tier-count">{{ count }} 人</span>
            </div>
          </div>
        </div>
        <div v-else>
          <div v-for="(count, tier) in data.customerTiers" :key="tier" class="tier-row">
            <span class="tier-label">{{ tierIcon(tier) }} {{ tierName(tier) }}</span>
            <el-progress
              :percentage="tierPercent(tier, count)"
              :color="tierColor(tier)"
              :stroke-width="20"
              :show-text="false"
              style="flex: 1; margin: 0 12px;"
            />
            <span class="tier-count">{{ count }} 人</span>
          </div>
        </div>
      </el-card>

      <!-- ====== 商品转化 Top 5（Tier 2.3，ECharts 横向条形图 + 明细表） ====== -->
      <el-card class="analytics-card" shadow="hover" v-if="data.productConversion && data.productConversion.length > 0">
        <template #header><h3>📊 商品转化 Top 5</h3></template>
        <EChartBase v-if="convOption" :option="convOption" :height="convChartHeight" />
        <el-table :data="data.productConversion" size="small" stripe style="margin-top: 12px;">
          <el-table-column prop="productName" label="商品名" />
          <el-table-column prop="views" label="浏览数" width="80" />
          <el-table-column prop="orders" label="下单数" width="80" />
          <el-table-column prop="conversionRate" label="转化率" width="90">
            <template #default="{ row }">
              <el-tag :type="convTagType(row.conversionRate)" size="small">
                {{ row.conversionRate }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- ====== 优惠券 ROI（Tier 2.3） ====== -->
      <el-card class="analytics-card" shadow="hover" v-if="data.couponRoi">
        <template #header><h3>🎫 优惠券 ROI</h3></template>
        <el-row :gutter="16">
          <el-col :span="6">
            <div class="roi-card">
              <div class="roi-value">{{ data.couponRoi.totalIssued || 0 }}</div>
              <div class="roi-label">发放数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="roi-card">
              <div class="roi-value">{{ data.couponRoi.totalClaimed || 0 }}</div>
              <div class="roi-label">已领取</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="roi-card">
              <div class="roi-value">{{ data.couponRoi.totalUsed || 0 }}</div>
              <div class="roi-label">已使用</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="roi-card">
              <div class="roi-value roi-highlight">{{ data.couponRoi.roiPercent || 'N/A' }}</div>
              <div class="roi-label">ROI</div>
            </div>
          </el-col>
        </el-row>
        <div class="roi-detail" v-if="data.couponRoi.totalDiscountAmount">
          总优惠金额：<strong>¥{{ Number(data.couponRoi.totalDiscountAmount).toFixed(2) }}</strong>
          &nbsp;|&nbsp;
          带来收入：<strong>¥{{ Number(data.couponRoi.totalRevenue).toFixed(2) }}</strong>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getDashboard } from '@/api/merchant'
import EChartBase from '@/components/EChartBase.vue'

const loading = ref(true)
const data = ref({})

onMounted(async () => {
  try {
    const res = await getDashboard()
    data.value = res.data || {}
  } catch {} finally { loading.value = false }
})

function tierIcon(tier) {
  return { PREMIUM: '🏆', MID: '🥈', BUDGET: '🥉', NEW: '👤' }[tier] || '👤'
}
function tierName(tier) {
  return { PREMIUM: '高端用户', MID: '中端用户', BUDGET: '实惠用户', NEW: '新用户' }[tier] || tier
}
function tierColor(tier) {
  return { PREMIUM: '#e6a23c', MID: '#409eff', BUDGET: '#67c23a', NEW: '#909399' }[tier] || '#909399'
}

function tierPercent(tier, count) {
  const total = Object.values(data.value.customerTiers || {}).reduce((s, c) => s + c, 0)
  return total > 0 ? Math.round((count / total) * 100) : 0
}

/** 客户分层环形图；全部为 0 时不渲染（回退进度条视图） */
const tierOption = computed(() => {
  const tiers = data.value.customerTiers
  if (!tiers) return null
  const entries = Object.entries(tiers)
  if (!entries.some(([, c]) => c > 0)) return null
  return {
    tooltip: { trigger: 'item', formatter: '{b}：{c} 人（{d}%）' },
    legend: { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { color: '#606266', fontSize: 12 } },
    series: [{
      type: 'pie',
      radius: ['42%', '68%'],
      center: ['50%', '44%'],
      avoidLabelOverlap: true,
      label: { show: false },
      data: entries.map(([tier, count]) => ({
        name: tierName(tier),
        value: count,
        itemStyle: { color: tierColor(tier) }
      }))
    }]
  }
})

/** 商品转化横向双系列条形图 */
const convOption = computed(() => {
  const list = data.value.productConversion
  if (!list || !list.length) return null
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter(params) {
        const row = list[params[0].dataIndex] || {}
        const lines = [`<b>${row.productName}</b>`]
        for (const p of params) lines.push(`${p.marker}${p.seriesName}：${p.value}`)
        lines.push(`转化率：${row.conversionRate ?? 'N/A'}`)
        return lines.join('<br/>')
      }
    },
    legend: { top: 0, itemWidth: 12, itemHeight: 8, textStyle: { color: '#606266', fontSize: 12 } },
    grid: { left: 8, right: 30, top: 30, bottom: 4, containLabel: true },
    xAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: '#909399', fontSize: 11 },
      splitLine: { lineStyle: { color: '#f0f2f5', type: 'dashed' } }
    },
    yAxis: {
      type: 'category',
      data: list.map(i => i.productName),
      inverse: true,
      axisLabel: { color: '#606266', fontSize: 12, width: 130, overflow: 'truncate' },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#e4e7ed' } }
    },
    series: [
      {
        name: '浏览数',
        type: 'bar',
        data: list.map(i => i.views),
        barMaxWidth: 13,
        itemStyle: { color: '#409eff', borderRadius: [0, 7, 7, 0] }
      },
      {
        name: '下单数',
        type: 'bar',
        data: list.map(i => i.orders),
        barMaxWidth: 13,
        itemStyle: { color: '#67c23a', borderRadius: [0, 7, 7, 0] }
      }
    ]
  }
})

const convChartHeight = computed(() => {
  const n = (data.value.productConversion || []).length
  return Math.max(220, n * 44 + 70)
})

function convTagType(rate) {
  if (rate === 'N/A') return 'info'
  const v = parseFloat(rate)
  if (v > 10) return 'success'
  if (v > 3) return 'warning'
  return 'danger'
}
</script>

<style scoped>
.dashboard-page { max-width: 960px; }
.page-title { font-size: 20px; font-weight: 600; margin-bottom: 20px; color: #303133; }
.stat-card { text-align: center; border-radius: 12px; }
.stat-value { font-size: 28px; font-weight: 700; color: #409eff; margin-bottom: 8px; }
.stat-label { font-size: 14px; color: #909399; }

/* 分析卡片 */
.analytics-card {
  margin-top: 24px;
  border-radius: 12px;
}
.analytics-card h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

/* 客户画像 */
.tier-layout {
  display: flex;
  align-items: center;
  gap: 12px;
}
.tier-chart { flex: 0 0 46%; min-width: 0; }
.tier-rows { flex: 1; min-width: 0; }
.tier-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}
.tier-label { min-width: 90px; font-size: 14px; color: #606266; }
.tier-count { min-width: 50px; font-size: 14px; color: #303133; font-weight: 500; text-align: right; }

/* ROI */
.roi-card {
  text-align: center;
  padding: 16px 8px;
  background: #fafafa;
  border-radius: 8px;
}
.roi-value { font-size: 24px; font-weight: 700; color: #409eff; margin-bottom: 4px; }
.roi-highlight { color: #e6a23c !important; }
.roi-label { font-size: 13px; color: #909399; }
.roi-detail {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
  font-size: 13px;
  color: #606266;
  text-align: center;
}
</style>
