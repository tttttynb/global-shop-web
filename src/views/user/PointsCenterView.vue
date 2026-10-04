<template>
  <div class="page-container points-page" v-loading="loading">
    <h2 class="page-title">🎁 {{ $t('points.centerTitle') }}</h2>

    <!-- 总览卡 -->
    <el-card class="summary-card" shadow="never" v-if="summary">
      <div class="summary-left">
        <div class="points-balance">{{ summary.points }}</div>
        <div class="points-label">{{ $t('points.available') }}</div>
        <div class="points-sub">
          {{ $t('points.exchangeRate', { perYuan: summary.pointsPerYuan }) }}
        </div>
      </div>
      <div class="summary-mid">
        <el-tag type="warning" effect="dark" size="large" class="level-tag">
          {{ $t('points.levelIcon') }} {{ summary.levelName }}
        </el-tag>
        <div class="growth-row" v-if="summary.nextLevelName">
          <span class="growth-text">{{ $t('points.nextLevel', { name: summary.nextLevelName, gap: formatNum(summary.nextLevelGap) }) }}</span>
          <el-progress :percentage="growthPercent" :stroke-width="10" :show-text="false" class="growth-bar" />
        </div>
        <div class="growth-row" v-else>
          <span class="growth-text">{{ $t('points.maxLevel') }}</span>
        </div>
        <div class="benefit-row" v-if="summary.levelDiscount > 0">
          {{ $t('points.levelDiscountTag', { level: summary.levelName, percent: Math.round(summary.levelDiscount * 100) }) }}
        </div>
        <div class="streak-row" v-if="summary.consecutiveDays > 0">
          🔥 {{ $t('points.streak', { days: summary.consecutiveDays }) }}
        </div>
      </div>
      <div class="summary-right">
        <el-button
          type="danger"
          size="large"
          round
          :disabled="summary.signedToday"
          :loading="signing"
          @click="handleSignIn"
        >
          {{ summary.signedToday ? $t('points.signedToday') : $t('points.signIn') }}
        </el-button>
        <el-button
          v-if="!profileBonusClaimed"
          size="small"
          plain
          class="profile-bonus-btn"
          :loading="claiming"
          @click="handleClaimProfileBonus"
        >
          {{ $t('points.claimProfileBonus') }}
        </el-button>
      </div>
    </el-card>

    <el-tabs v-model="activeTab">
      <!-- ==================== 兑换商城 ==================== -->
      <el-tab-pane :label="$t('points.tabExchange')" name="exchange">
        <div v-if="coupons.length" class="coupon-grid">
          <div v-for="c in coupons" :key="c.id" class="coupon-card">
            <div class="cc-value">
              <template v-if="c.type === 2">{{ formatDiscount(c.discountValue) }}</template>
              <template v-else>{{ localeStore.formatPrice(c.discountValue) }}</template>
            </div>
            <div class="cc-info">
              <p class="cc-name">{{ c.name }}</p>
              <p class="cc-condition">{{ $t('points.minAmount', { amount: localeStore.formatPrice(c.minAmount) }) }}</p>
              <p class="cc-stock" v-if="c.remainCount != null">{{ $t('points.remain', { count: c.remainCount }) }}</p>
            </div>
            <div class="cc-action">
              <div class="cc-points">{{ c.pointsPrice }} {{ $t('points.pointsUnit') }}</div>
              <el-button
                type="warning"
                size="small"
                :disabled="(summary && summary.points < c.pointsPrice) || c.remainCount <= 0"
                :loading="exchangingId === c.id"
                @click="handleExchange(c)"
              >
                {{ $t('points.exchange') }}
              </el-button>
            </div>
          </div>
        </div>
        <el-empty v-else :description="$t('points.noCoupons')" :image-size="80" />
      </el-tab-pane>

      <!-- ==================== 积分流水 ==================== -->
      <el-tab-pane :label="$t('points.tabRecords')" name="records">
        <el-table :data="records" stripe class="records-table">
          <el-table-column prop="description" :label="$t('points.colDesc')" min-width="220">
            <template #default="{ row }">
              {{ row.description || $t('points.typeNames.' + row.type) }}
            </template>
          </el-table-column>
          <el-table-column :label="$t('points.colType')" width="130">
            <template #default="{ row }">
              <el-tag size="small" :type="typeTagType(row.type)">{{ $t('points.typeNames.' + row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('points.colChange')" width="110" align="right">
            <template #default="{ row }">
              <span :class="row.changeAmount >= 0 ? 'change-plus' : 'change-minus'">
                {{ row.changeAmount >= 0 ? '+' : '' }}{{ row.changeAmount }}
              </span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('points.colTime')" width="170">
            <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
          </el-table-column>
          <template #empty>
            <el-empty :description="$t('points.noRecords')" :image-size="80" />
          </template>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPointsSummary, getPointsRecords, signIn, claimProfileBonus, getExchangeableCoupons, exchangeCoupon } from '@/api/points'
import { useLocaleStore } from '@/stores/locale'

const { t } = useI18n()
const localeStore = useLocaleStore()

const loading = ref(false)
const signing = ref(false)
const claiming = ref(false)
const exchangingId = ref(null)
const summary = ref(null)
const records = ref([])
const coupons = ref([])
const activeTab = ref('exchange')
const profileBonusClaimed = ref(false)

// 成长值进度（当前等级 → 下一等级）：用 totalEarned 近似 growth 占比
const growthPercent = computed(() => {
  if (!summary.value?.nextLevelGap) return 100
  const growth = Number(summary.value.growth || 0)
  const gap = Number(summary.value.nextLevelGap || 0)
  // growth 为累计成长值，gap 为距下一级差额 → 当前级内进度无法精确还原，用剩余比例估算
  const pct = gap > 0 ? Math.max(0, Math.min(99, Math.round((1 - gap / Math.max(growth + gap, 1)) * 100))) : 100
  return pct
})

function formatNum(n) {
  if (n == null) return '0'
  const num = Number(n)
  return Number.isInteger(num) ? String(num) : num.toFixed(2)
}

function formatTime(str) {
  if (!str) return ''
  return String(str).replace('T', ' ').substring(0, 16)
}

function formatDiscount(v) {
  // 折扣券 discountValue 如 8.5 → 中文"8.5折"；其他语言换算为 percent-off
  const num = Number(v)
  if (localeStore.locale === 'zh') return `${num}折`
  return `${Math.round((10 - num) * 10)}% OFF`
}

function typeTagType(type) {
  if (type === 'DEDUCT_ORDER' || type === 'EXCHANGE_COUPON') return 'info'
  if (type === 'REFUND_ORDER') return 'warning'
  return 'success'
}

async function loadAll() {
  loading.value = true
  try {
    const [sRes, rRes, cRes] = await Promise.all([
      getPointsSummary(),
      getPointsRecords(),
      getExchangeableCoupons()
    ])
    summary.value = sRes.code === 200 ? sRes.data : null
    records.value = (rRes.code === 200 && rRes.data) ? rRes.data : []
    coupons.value = (cRes.code === 200 && cRes.data) ? cRes.data : []
    // 已领过画像奖励 → 流水中存在 PROFILE 类型
    profileBonusClaimed.value = records.value.some(r => r.type === 'PROFILE')
  } catch {
    ElMessage.error(t('points.loadFailed'))
  } finally {
    loading.value = false
  }
}

async function handleSignIn() {
  signing.value = true
  try {
    const res = await signIn()
    ElMessage.success(res.data || res.message || t('points.signInSuccess'))
    await loadAll()
  } catch (e) {
    ElMessage.error(e.message || t('points.signInFailed'))
  } finally {
    signing.value = false
  }
}

async function handleClaimProfileBonus() {
  claiming.value = true
  try {
    const res = await claimProfileBonus()
    if (res.code === 200) {
      ElMessage.success(res.data || t('points.profileBonusOk'))
      profileBonusClaimed.value = true
      await loadAll()
    } else {
      ElMessage.warning(res.message || t('points.profileBonusNo'))
    }
  } catch (e) {
    ElMessage.warning(e.message || t('points.profileBonusNo'))
  } finally {
    claiming.value = false
  }
}

async function handleExchange(c) {
  try {
    await ElMessageBox.confirm(
      t('points.exchangeConfirm', { points: c.pointsPrice, name: c.name }),
      t('points.exchange'),
      { type: 'warning' }
    )
  } catch {
    return
  }
  exchangingId.value = c.id
  try {
    const res = await exchangeCoupon(c.id)
    ElMessage.success(res.data || t('points.exchangeSuccess'))
    await loadAll()
  } catch (e) {
    ElMessage.error(e.message || t('points.exchangeFailed'))
  } finally {
    exchangingId.value = null
  }
}

onMounted(loadAll)
</script>

<style scoped>
.points-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 16px 60px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--gs-text-1);
  margin-bottom: 16px;
}

/* 总览卡 */
.summary-card {
  border-radius: 14px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #fff9ef 0%, #fffdf8 60%);
  border: 1px solid #f5e3bd;
}

.summary-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.summary-left {
  min-width: 150px;
}

.points-balance {
  font-size: 40px;
  font-weight: 800;
  color: var(--gs-warning);
  line-height: 1.1;
}

.points-label {
  font-size: 13px;
  color: var(--gs-text-3);
  margin-top: 2px;
}

.points-sub {
  font-size: 12px;
  color: #b8860b;
  margin-top: 6px;
}

.summary-mid {
  flex: 1;
  min-width: 200px;
}

.level-tag {
  margin-bottom: 8px;
}

.growth-row {
  margin: 6px 0;
}

.growth-text {
  font-size: 12px;
  color: var(--gs-text-3);
}

.growth-bar {
  margin-top: 4px;
}

.benefit-row {
  font-size: 12px;
  color: #b8860b;
  margin-top: 4px;
}

.streak-row {
  font-size: 12px;
  color: var(--gs-price);
  margin-top: 4px;
}

.summary-right {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.profile-bonus-btn {
  font-size: 12px;
}

/* 兑换商城 */
.coupon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}

.coupon-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #fff;
  border: 1px solid #fbe4c8;
  border-radius: var(--gs-radius-lg);
  padding: 16px;
}

.cc-value {
  min-width: 84px;
  text-align: center;
  font-size: 22px;
  font-weight: 800;
  color: var(--gs-warning);
  border-right: 1px dashed #f0d9b5;
  padding-right: 10px;
}

.cc-info {
  flex: 1;
  min-width: 0;
}

.cc-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--gs-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cc-condition,
.cc-stock {
  font-size: 12px;
  color: var(--gs-text-3);
  margin-top: 3px;
}

.cc-action {
  text-align: center;
}

.cc-points {
  font-size: 14px;
  font-weight: 700;
  color: var(--gs-price);
  margin-bottom: 6px;
}

/* 流水表 */
.records-table {
  border-radius: var(--gs-radius-lg);
  overflow: hidden;
}

.change-plus {
  color: var(--gs-success);
  font-weight: 700;
}

.change-minus {
  color: var(--gs-price);
  font-weight: 700;
}
</style>
