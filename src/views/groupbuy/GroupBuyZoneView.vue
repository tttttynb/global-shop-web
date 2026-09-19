<template>
  <div class="page-container groupbuy-page">
    <h2 class="page-title">👥 {{ $t('groupbuy.zoneTitle') }}</h2>
    <p class="zone-subtitle">{{ $t('groupbuy.zoneSubtitle') }}</p>

    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <!-- ==================== 拼团专区 ==================== -->
      <el-tab-pane :label="$t('groupbuy.tabZone')" name="zone">
        <div v-if="zoneLoading" class="loading-wrap"><el-skeleton :rows="6" animated /></div>
        <div v-else-if="activities.length" class="activity-grid">
          <div v-for="a in activities" :key="a.activityId" class="activity-card">
            <div class="ac-img-wrap" @click="$router.push(`/product/${a.productId}`)">
              <el-image :src="a.coverImage" fit="cover" class="ac-img">
                <template #error>
                  <div class="ac-img-fallback"><el-icon :size="40"><Picture /></el-icon></div>
                </template>
              </el-image>
              <span class="ac-discount" v-if="a.discountRate">-{{ Math.round((1 - a.discountRate) * 100) }}%</span>
            </div>
            <div class="ac-info">
              <p class="ac-name" @click="$router.push(`/product/${a.productId}`)">{{ a.productName }}</p>
              <p class="ac-shop">{{ a.shopName }}</p>
              <div class="ac-price-row">
                <span class="ac-group-price">{{ localeStore.formatPrice(a.groupPrice) }}</span>
                <span class="ac-origin-price">{{ localeStore.formatPrice(a.originalPrice) }}</span>
              </div>
              <div class="ac-meta">
                <el-tag size="small" type="danger" effect="plain">
                  {{ $t('groupbuy.requiredMembers', { count: a.requiredMembers }) }}
                </el-tag>
                <span class="ac-sold" v-if="a.soldCount > 0">{{ $t('groupbuy.soldCount', { count: a.soldCount }) }}</span>
              </div>
              <div class="ac-actions">
                <el-button type="danger" size="small" @click="handleOpen(a)" :loading="openingId === a.activityId">
                  {{ $t('groupbuy.openGroup') }}
                </el-button>
                <el-button v-if="a.ongoingGroups > 0" size="small" plain @click="showOngoing(a)">
                  {{ $t('groupbuy.ongoingCount', { count: a.ongoingGroups }) }}
                </el-button>
              </div>
            </div>
          </div>
        </div>
        <el-empty v-else :description="$t('groupbuy.noActivities')" />
      </el-tab-pane>

      <!-- ==================== 我的拼团 ==================== -->
      <el-tab-pane :label="$t('groupbuy.tabMine')" name="mine">
        <div v-if="mineLoading" class="loading-wrap"><el-skeleton :rows="4" animated /></div>
        <div v-else-if="myGroups.length" class="my-group-list">
          <div v-for="g in myGroups" :key="g.recordId" class="my-group-card" @click="$router.push(`/group-buy/record/${g.recordId}`)">
            <el-image :src="g.coverImage" fit="cover" class="mg-img">
              <template #error>
                <div class="ac-img-fallback"><el-icon :size="28"><Picture /></el-icon></div>
              </template>
            </el-image>
            <div class="mg-info">
              <p class="mg-name">{{ g.productName }}</p>
              <p class="mg-meta">
                {{ $t('groupbuy.groupPriceLabel') }}
                <strong>{{ localeStore.formatPrice(g.groupPrice) }}</strong>
                · {{ g.memberCount }}/{{ g.requiredMembers }}
              </p>
              <p class="mg-countdown" v-if="g.status === 0 && countdowns[g.recordId]">
                ⏳ {{ $t('groupbuy.countdownLabel') }} {{ countdowns[g.recordId] }}
              </p>
            </div>
            <el-tag :type="statusTagType(g.status)" class="mg-status">{{ statusText(g.status) }}</el-tag>
            <el-button v-if="g.status === 0" type="danger" size="small" plain @click.stop="$router.push(`/group-buy/record/${g.recordId}`)">
              {{ $t('groupbuy.inviteFriends') }}
            </el-button>
          </div>
        </div>
        <el-empty v-else :description="$t('groupbuy.noMyGroups')">
          <el-button type="primary" @click="activeTab = 'zone'">{{ $t('groupbuy.goBrowse') }}</el-button>
        </el-empty>
      </el-tab-pane>
    </el-tabs>

    <!-- 正在拼的团（选择参团） -->
    <el-dialog v-model="ongoingVisible" :title="$t('groupbuy.pickGroupTitle')" width="480px">
      <div v-for="g in ongoingList" :key="g.recordId" class="ongoing-row">
        <div class="ongoing-avatars">
          <el-avatar v-for="m in (g.members || []).slice(0, 4)" :key="m.userId" :size="30" :src="m.avatar">
            {{ (m.nickname || '?').charAt(0) }}
          </el-avatar>
        </div>
        <div class="ongoing-info">
          <span class="ongoing-missing">{{ $t('groupbuy.missingMembers', { count: g.missingMembers }) }}</span>
          <span class="ongoing-expire" v-if="g.expireTime">{{ formatTime(g.expireTime) }}</span>
        </div>
        <el-button type="danger" size="small" @click="handleJoin(g.recordId)" :loading="joiningId === g.recordId">
          {{ $t('groupbuy.joinGroup') }}
        </el-button>
      </div>
      <el-empty v-if="!ongoingList.length" :description="$t('groupbuy.noOngoing')" :image-size="60" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import { getGroupActivities, getOngoingGroups, openGroup, joinGroup, getMyGroups } from '@/api/groupBuy'
import { useLocaleStore } from '@/stores/locale'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const { t } = useI18n()
const localeStore = useLocaleStore()
const userStore = useUserStore()

const activeTab = ref('zone')
const activities = ref([])
const myGroups = ref([])
const zoneLoading = ref(false)
const mineLoading = ref(false)
const openingId = ref(null)
const joiningId = ref(null)
const ongoingVisible = ref(false)
const ongoingList = ref([])

// 倒计时（我的拼团 tab）
const countdowns = ref({})
let tickTimer = null

function checkLogin() {
  if (!userStore.isLoggedIn) {
    ElMessage.warning(t('messages.loginFirst'))
    router.push({ path: '/login', query: { redirect: '/group-buy' } })
    return false
  }
  return true
}

async function loadActivities() {
  zoneLoading.value = true
  try {
    const res = await getGroupActivities()
    activities.value = res.code === 200 ? (res.data || []) : []
  } catch {
    activities.value = []
  } finally {
    zoneLoading.value = false
  }
}

async function loadMyGroups() {
  if (!userStore.isLoggedIn) return
  mineLoading.value = true
  try {
    const res = await getMyGroups()
    myGroups.value = res.code === 200 ? (res.data || []) : []
    startCountdown()
  } catch {
    myGroups.value = []
  } finally {
    mineLoading.value = false
  }
}

function handleTabChange(name) {
  if (name === 'mine') loadMyGroups()
}

function startCountdown() {
  stopCountdown()
  tickTimer = setInterval(() => {
    const map = {}
    for (const g of myGroups.value) {
      if (g.status === 0 && g.expireTime) {
        const remain = new Date(g.expireTime).getTime() - Date.now()
        map[g.recordId] = remain > 0 ? humanize(remain) : '00:00:00'
      }
    }
    countdowns.value = map
  }, 1000)
}

function stopCountdown() {
  if (tickTimer) {
    clearInterval(tickTimer)
    tickTimer = null
  }
}

function humanize(ms) {
  const s = Math.floor(ms / 1000)
  const h = String(Math.floor(s / 3600)).padStart(2, '0')
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const sec = String(s % 60).padStart(2, '0')
  return `${h}:${m}:${sec}`
}

function formatTime(str) {
  if (!str) return ''
  return String(str).replace('T', ' ').substring(0, 16)
}

function statusTagType(status) {
  return status === 1 ? 'success' : status === 2 ? 'info' : 'danger'
}

function statusText(status) {
  return status === 1 ? t('groupbuy.statusFormed') : status === 2 ? t('groupbuy.statusFailed') : t('groupbuy.statusOngoing')
}

async function handleOpen(a) {
  if (!checkLogin()) return
  openingId.value = a.activityId
  try {
    const res = await openGroup(a.activityId)
    const { orderId, recordId } = res.data || {}
    ElMessage.success(t('groupbuy.openSuccess'))
    if (orderId) router.push(`/order/pay/${orderId}`)
    else if (recordId) router.push(`/group-buy/record/${recordId}`)
  } catch (e) {
    ElMessage.error(e.message || t('groupbuy.opFailed'))
  } finally {
    openingId.value = null
  }
}

async function showOngoing(a) {
  ongoingVisible.value = true
  ongoingList.value = []
  try {
    const res = await getOngoingGroups(a.activityId)
    ongoingList.value = (res.code === 200 && res.data) ? res.data.filter(g => g.status === 0) : []
  } catch {
    ongoingList.value = []
  }
}

async function handleJoin(recordId) {
  if (!checkLogin()) return
  joiningId.value = recordId
  try {
    const res = await joinGroup(recordId)
    const { orderId } = res.data || {}
    ElMessage.success(t('groupbuy.joinSuccess'))
    ongoingVisible.value = false
    if (orderId) router.push(`/order/pay/${orderId}`)
    else router.push(`/group-buy/record/${recordId}`)
  } catch (e) {
    ElMessage.error(e.message || t('groupbuy.opFailed'))
  } finally {
    joiningId.value = null
  }
}

onMounted(() => {
  loadActivities()
})

onBeforeUnmount(stopCountdown)
</script>

<style scoped>
.groupbuy-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 16px 60px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 4px;
}

.zone-subtitle {
  font-size: 13px;
  color: #909399;
  margin-bottom: 16px;
}

.loading-wrap {
  padding: 24px 0;
}

/* 活动卡片网格 */
.activity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.activity-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s, box-shadow 0.2s;
}

.activity-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(238, 10, 36, 0.12);
}

.ac-img-wrap {
  position: relative;
  cursor: pointer;
}

.ac-img {
  width: 100%;
  height: 180px;
  display: block;
}

.ac-img-fallback {
  width: 100%;
  height: 100%;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #c0c4cc;
}

.ac-discount {
  position: absolute;
  top: 8px;
  left: 8px;
  background: linear-gradient(90deg, #ff6034, #ee0a24);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  border-radius: 4px;
  padding: 2px 8px;
}

.ac-info {
  padding: 12px;
}

.ac-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ac-name:hover {
  color: #ee0a24;
}

.ac-shop {
  font-size: 12px;
  color: #909399;
  margin: 4px 0 8px;
}

.ac-price-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
}

.ac-group-price {
  font-size: 20px;
  font-weight: 700;
  color: #ee0a24;
}

.ac-origin-price {
  font-size: 13px;
  color: #909399;
  text-decoration: line-through;
}

.ac-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.ac-sold {
  font-size: 12px;
  color: #909399;
}

.ac-actions {
  display: flex;
  gap: 8px;
}

/* 我的拼团 */
.my-group-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.my-group-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fff;
  border-radius: 12px;
  padding: 14px 16px;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.my-group-card:hover {
  box-shadow: 0 4px 16px rgba(238, 10, 36, 0.1);
}

.mg-img {
  width: 72px;
  height: 72px;
  border-radius: 8px;
  flex-shrink: 0;
}

.mg-info {
  flex: 1;
  min-width: 0;
}

.mg-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mg-meta {
  font-size: 13px;
  color: #606266;
  margin: 4px 0;
}

.mg-meta strong {
  color: #ee0a24;
}

.mg-countdown {
  font-size: 12px;
  color: #e6a23c;
}

/* 参团弹窗 */
.ongoing-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.ongoing-row:last-child {
  border-bottom: none;
}

.ongoing-avatars {
  display: flex;
}

.ongoing-avatars .el-avatar {
  margin-right: -8px;
  border: 2px solid #fff;
  background: #ffc9c1;
  color: #ee0a24;
  font-size: 13px;
}

.ongoing-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ongoing-missing {
  font-size: 13px;
  font-weight: 600;
  color: #ee0a24;
}

.ongoing-expire {
  font-size: 12px;
  color: #909399;
}
</style>
