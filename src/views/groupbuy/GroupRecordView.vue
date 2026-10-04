<template>
  <div class="page-container group-record-page" v-loading="loading">
    <template v-if="record">
      <!-- 状态横幅 -->
      <div class="status-banner" :class="'banner-' + record.status">
        <template v-if="record.status === 0">
          <div class="banner-title">🔥 {{ $t('groupbuy.recordMissing', { count: record.missingMembers }) }}</div>
          <div class="banner-countdown" v-if="countdown">⏳ {{ $t('groupbuy.countdownLabel') }} {{ countdown }}</div>
        </template>
        <template v-else-if="record.status === 1">
          <div class="banner-title">🎉 {{ $t('groupbuy.statusFormed') }}</div>
          <div class="banner-sub" v-if="record.formTime">{{ formatTime(record.formTime) }}</div>
        </template>
        <template v-else>
          <div class="banner-title">😔 {{ $t('groupbuy.statusFailed') }}</div>
          <div class="banner-sub">{{ $t('groupbuy.failedHint') }}</div>
        </template>
      </div>

      <!-- 商品信息 -->
      <el-card class="record-card" shadow="never">
        <div class="product-row" @click="$router.push(`/product/${record.productId}`)">
          <el-image :src="record.coverImage" fit="cover" class="pr-img">
            <template #error>
              <div class="pr-img-fallback"><el-icon :size="32"><Picture /></el-icon></div>
            </template>
          </el-image>
          <div class="pr-info">
            <p class="pr-name">{{ record.productName }}</p>
            <p class="pr-shop">{{ record.shopName }}</p>
            <div class="pr-price-row">
              <span class="pr-group-price">{{ localeStore.formatPrice(record.groupPrice) }}</span>
              <span class="pr-origin-price">{{ localeStore.formatPrice(record.originalPrice) }}</span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 成员坑位 -->
      <el-card class="record-card" shadow="never">
        <div class="members-title">
          {{ $t('groupbuy.memberSlots', { current: record.memberCount, required: record.requiredMembers }) }}
        </div>
        <div class="member-slots">
          <div v-for="m in record.members" :key="m.userId" class="member-slot">
            <el-badge v-if="m.isLeader === 1" :value="$t('groupbuy.leaderBadge')" type="warning" class="leader-badge">
              <el-avatar :size="52" :src="m.avatar">{{ (m.nickname || '?').charAt(0) }}</el-avatar>
            </el-badge>
            <el-avatar v-else :size="52" :src="m.avatar">{{ (m.nickname || '?').charAt(0) }}</el-avatar>
            <span class="member-name">{{ m.nickname || $t('groupbuy.anonymous') }}</span>
            <el-tag v-if="m.status === 0" size="small" type="warning">{{ $t('groupbuy.memberUnpaid') }}</el-tag>
            <el-tag v-else-if="m.status === 2" size="small" type="info">{{ $t('groupbuy.memberRefunded') }}</el-tag>
          </div>
          <!-- 空坑位 -->
          <div v-for="n in emptySlots" :key="'empty-' + n" class="member-slot empty">
            <div class="empty-avatar">?</div>
            <span class="member-name">{{ $t('groupbuy.waitingSeat') }}</span>
          </div>
        </div>
      </el-card>

      <!-- 操作区 -->
      <div class="action-area">
        <template v-if="record.status === 0">
          <el-button v-if="!record.myStatus" type="danger" size="large" class="main-action"
                     :loading="joining" @click="handleJoin">
            {{ $t('groupbuy.joinNow', { price: localeStore.formatPrice(record.groupPrice) }) }}
          </el-button>
          <el-alert v-else-if="record.myStatus === 'JOINED'" type="warning" :closable="false" class="my-status-alert"
                    :title="$t('groupbuy.joinedUnpaidHint')">
            <el-button size="small" type="warning" @click="$router.push('/orders')">{{ $t('groupbuy.goPay') }}</el-button>
          </el-alert>
          <el-alert v-else type="success" :closable="false" class="my-status-alert" :title="$t('groupbuy.joinedPaidHint')" />
          <el-button size="large" :icon="Share" @click="handleShare">{{ $t('groupbuy.inviteFriends') }}</el-button>
        </template>
        <el-button v-else size="large" type="primary" @click="$router.push(`/product/${record.productId}`)">
          {{ $t('groupbuy.viewProduct') }}
        </el-button>
      </div>

      <!-- 分享弹窗：扫码参团 + 复制链接 -->
      <el-dialog v-model="shareVisible" :title="$t('groupbuy.inviteFriends')" width="320px" align-center>
        <div class="share-body">
          <div class="qr-wrap">
            <QrcodeVue :value="shareUrl" :size="200" level="M" render-as="canvas" />
          </div>
          <div class="share-hint">{{ $t('groupbuy.shareScanHint') }}</div>
          <el-button type="primary" plain @click="copyShareLink">{{ $t('groupbuy.copyLink') }}</el-button>
        </div>
      </el-dialog>
    </template>

    <el-empty v-else-if="!loading" :description="$t('groupbuy.recordNotFound')">
      <el-button type="primary" @click="$router.push('/group-buy')">{{ $t('groupbuy.goBrowse') }}</el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Picture, Share } from '@element-plus/icons-vue'
import QrcodeVue from 'qrcode.vue'
import { getGroupRecord, joinGroup } from '@/api/groupBuy'
import { useCountdown } from '@/composables/useCountdown'
import { useLocaleStore } from '@/stores/locale'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const localeStore = useLocaleStore()
const userStore = useUserStore()

const record = ref(null)
const loading = ref(false)
const joining = ref(false)
const shareVisible = ref(false)
const shareUrl = ref('')

// dayjs 解析 + 统一格式（超 24h 显示"N天 HH:MM:SS"，开团时长最长 168h 也能正常展示）
const { hasTarget, expired: cdExpired, text: cdText } = useCountdown(
  () => (record.value && record.value.status === 0 && record.value.expireTime) ? record.value.expireTime : null,
  { onExpire: () => loadRecord() } // 已到期，刷新状态
)
const countdown = computed(() => (hasTarget.value && !cdExpired.value) ? cdText.value : '')

const emptySlots = computed(() => {
  if (!record.value) return 0
  return Math.max(0, record.value.requiredMembers - (record.value.members?.length || 0))
})

function formatTime(str) {
  if (!str) return ''
  return String(str).replace('T', ' ').substring(0, 16)
}

async function loadRecord() {
  loading.value = true
  try {
    const res = await getGroupRecord(route.params.id)
    record.value = res.code === 200 ? res.data : null
  } catch {
    record.value = null
  } finally {
    loading.value = false
  }
}

async function handleJoin() {
  if (!userStore.isLoggedIn) {
    ElMessage.warning(t('messages.loginFirst'))
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  joining.value = true
  try {
    const res = await joinGroup(record.value.recordId)
    const { orderId } = res.data || {}
    ElMessage.success(t('groupbuy.joinSuccess'))
    if (orderId) router.push(`/order/pay/${orderId}`)
    else loadRecord()
  } catch (e) {
    ElMessage.error(e.message || t('groupbuy.opFailed'))
  } finally {
    joining.value = false
  }
}

function handleShare() {
  shareUrl.value = window.location.href
  shareVisible.value = true
}

async function copyShareLink() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    ElMessage.success(t('groupbuy.linkCopied'))
  } catch {
    ElMessage.info(shareUrl.value)
  }
}

onMounted(loadRecord)
</script>

<style scoped>
.group-record-page {
  max-width: 640px;
  margin: 0 auto;
  padding: 24px 16px 60px;
}

/* 状态横幅 */
.status-banner {
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  color: #fff;
  margin-bottom: 16px;
}

.banner-0 {
  background: linear-gradient(135deg, #ff6034, #ee0a24);
}

.banner-1 {
  background: linear-gradient(135deg, #67c23a, #4ca428);
}

.banner-2 {
  background: linear-gradient(135deg, #a0a4ab, #7d828a);
}

.banner-title {
  font-size: 20px;
  font-weight: 700;
}

.banner-countdown,
.banner-sub {
  font-size: 14px;
  margin-top: 6px;
  opacity: 0.92;
}

/* 卡片 */
.record-card {
  border-radius: 12px;
  margin-bottom: 16px;
}

.product-row {
  display: flex;
  gap: 14px;
  cursor: pointer;
}

.pr-img {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  flex-shrink: 0;
}

.pr-img-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #c0c4cc;
}

.pr-info {
  flex: 1;
  min-width: 0;
}

.pr-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.pr-shop {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.pr-price-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.pr-group-price {
  font-size: 22px;
  font-weight: 700;
  color: #ee0a24;
}

.pr-origin-price {
  font-size: 13px;
  color: #909399;
  text-decoration: line-through;
}

/* 成员坑位 */
.members-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 14px;
}

.member-slots {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  justify-content: center;
}

.member-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 64px;
}

.member-slot .el-avatar {
  background: #ffc9c1;
  color: #ee0a24;
  font-size: 18px;
}

.empty-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 2px dashed #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  font-size: 20px;
}

.member-name {
  font-size: 12px;
  color: #606266;
  max-width: 64px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.leader-badge :deep(.el-badge__content) {
  font-size: 10px;
}

/* 操作区 */
.action-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: stretch;
}

.main-action {
  font-size: 16px;
  font-weight: 700;
}

.my-status-alert {
  border-radius: 10px;
}

/* 分享弹窗 */
.share-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}
.qr-wrap {
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 12px;
  background: #fff;
}
.share-hint {
  font-size: 13px;
  color: #909399;
}
</style>
