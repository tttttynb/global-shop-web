<template>
  <!-- 公告条：随页面滚走，不占吸顶空间 -->
  <div class="announce-bar">✈️ 跨境直邮 · 满 ¥199 包邮 · 全球好物 AI 帮你选</div>
  <header class="app-header">
    <div class="header-inner">
      <router-link to="/" class="logo">
        <span class="logo-mark"><el-icon :size="18"><Shop /></el-icon></span>
        <span>GlobalShop</span>
      </router-link>

      <nav class="nav-links">
        <router-link to="/">{{ $t('header.home') }}</router-link>
        <router-link to="/products">{{ $t('header.allProducts') }}</router-link>
        <router-link to="/live">{{ $t('header.live') }}</router-link>
        <router-link to="/group-buy" class="nav-groupbuy">{{ $t('header.groupBuy') }}</router-link>
        <router-link to="/ai/search">{{ $t('header.aiSearch') }}</router-link>
        <router-link to="/ai/chat">{{ $t('header.aiChat') }}</router-link>
      </nav>

      <div class="header-right">
        <div class="search-box">
          <!-- 淘宝式搜索下拉：搜索历史 + 热搜榜 -->
          <el-popover
            trigger="focus"
            placement="bottom-start"
            :width="320"
            popper-class="search-suggest-popper"
          >
            <template #reference>
              <el-input
                v-model="searchKeyword"
                :placeholder="$t('header.searchPlaceholder')"
                @keyup.enter="handleSearch"
                size="default"
                clearable
              >
                <template #append>
                  <el-button @click="handleSearch">
                    <el-icon><Search /></el-icon>
                  </el-button>
                </template>
              </el-input>
            </template>
            <div class="search-suggest">
              <div class="ss-section" v-if="searchHistory.length">
                <div class="ss-head">
                  <span>搜索历史</span>
                  <el-icon class="ss-clear" :size="14" @click="clearSearchHistory"><Delete /></el-icon>
                </div>
                <div class="ss-chips">
                  <span v-for="w in searchHistory" :key="w" class="ss-chip" @click="quickSearch(w)">{{ w }}</span>
                </div>
              </div>
              <div class="ss-section">
                <div class="ss-head"><span>热搜榜</span></div>
                <div
                  class="ss-hot-item"
                  v-for="(w, i) in hotWords"
                  :key="w"
                  @click="quickSearch(w)"
                >
                  <span class="ss-rank" :class="{ top: i < 3 }">{{ i + 1 }}</span>
                  <span class="ss-word">{{ w }}</span>
                  <span class="ss-hot-tag" v-if="i < 2">🔥</span>
                </div>
              </div>
            </div>
          </el-popover>
          <!-- 🆕 以图搜图入口（Phase 2 - F4） -->
          <el-tooltip :content="$t('header.imageSearchTip')" placement="bottom">
            <router-link to="/ai/search?mode=image" class="camera-entry">
              <el-icon :size="20"><Camera /></el-icon>
            </router-link>
          </el-tooltip>
        </div>

        <!-- 🆕 语言切换（Phase 3 - F5） -->
        <el-dropdown trigger="click" @command="handleLangChange">
          <span class="switcher" :title="$t('header.language')">
            🌐 {{ localeStore.localeOption.label }}
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="l in supportedLocales"
                :key="l.code"
                :command="l.code"
                :class="{ active: localeStore.locale === l.code }"
              >
                {{ l.flag }} {{ l.label }}
                <el-icon v-if="localeStore.locale === l.code" style="margin-left:6px"><Check /></el-icon>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- 🆕 币种切换（Phase 3 - F5，汇率来自 exchange_rate 表，Redis 缓存 1h） -->
        <el-dropdown trigger="click" @command="handleCurrencyChange">
          <span class="switcher" :title="$t('header.currency')">
            💱 {{ localeStore.currencyOption.code }}
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="c in currencyOptions"
                :key="c.code"
                :command="c.code"
              >
                {{ c.symbol }} {{ c.label }}
                <el-icon v-if="localeStore.currency === c.code" style="margin-left:6px"><Check /></el-icon>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- 通知铃铛 -->
        <el-popover
          v-if="userStore.isLoggedIn"
          placement="bottom"
          :width="300"
          trigger="click"
          @show="fetchNotifications"
        >
          <template #reference>
            <span class="notif-icon">
              <el-badge :value="notifCount" :hidden="notifCount === 0">
                <el-icon :size="22"><Bell /></el-icon>
              </el-badge>
            </span>
          </template>
          <div class="notif-popover">
            <div class="notif-header">
              <span>📬 {{ $t('header.notifications') }}（{{ $t('header.unread', { count: notifCount }) }}）</span>
              <el-button text size="small" @click="clearNotifications" v-if="notifications.length > 0">{{ $t('header.clear') }}</el-button>
            </div>
            <div v-if="notifications.length === 0" class="notif-empty">{{ $t('header.noNotifications') }}</div>
            <template v-for="n in notifications.slice(0, 8)" :key="n.id">
              <div
                class="notif-item"
                :class="{ unread: n.isRead === 0 }"
                @click="handleNotifClick(n)"
              >
                <span class="notif-type">{{ typeEmoji(n.type) }}</span>
                <div class="notif-text">
                  <span class="notif-msg">{{ n.title }}</span>
                  <span class="notif-sub">{{ n.content?.substring(0, 40) }}{{ n.content?.length > 40 ? '...' : '' }}</span>
                </div>
              </div>
            </template>
            <div class="notif-footer" v-if="notifications.length > 0">
              <el-button text size="small" @click="goToNotifications">{{ $t('header.viewAll') }}</el-button>
            </div>
          </div>
        </el-popover>

        <router-link to="/cart" class="cart-icon" v-if="userStore.isLoggedIn">
          <el-badge :value="cartStore.itemCount" :hidden="cartStore.itemCount === 0">
            <el-icon :size="22"><ShoppingCart /></el-icon>
          </el-badge>
        </router-link>

        <template v-if="userStore.isLoggedIn">
          <el-dropdown>
            <span class="user-info">
              <el-icon><User /></el-icon>
              {{ userStore.username }}
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="$router.push('/profile')">{{ $t('header.profile') }}</el-dropdown-item>
                <el-dropdown-item @click="$router.push('/orders')">{{ $t('header.myOrders') }}</el-dropdown-item>
                <el-dropdown-item @click="$router.push('/favorites')">{{ $t('header.favorites') }}</el-dropdown-item>
                <el-dropdown-item @click="$router.push('/coupons')">{{ $t('header.myCoupons') }}</el-dropdown-item>
                <el-dropdown-item @click="$router.push('/points')">{{ $t('header.pointsCenter') }}</el-dropdown-item>
                <el-dropdown-item @click="$router.push('/refunds')">{{ $t('header.refundRecords') }}</el-dropdown-item>
                <el-dropdown-item divided @click="$router.push('/merchant/apply')">{{ $t('header.openShop') }}</el-dropdown-item>
                <el-dropdown-item @click="$router.push('/merchant/dashboard')">{{ $t('header.merchantCenter') }}</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">{{ $t('header.logout') }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template v-else>
          <router-link to="/login">
            <el-button type="primary" size="small">{{ $t('header.login') }}</el-button>
          </router-link>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'
import { useLocaleStore, CURRENCY_OPTIONS } from '@/stores/locale'
import { SUPPORTED_LOCALES } from '@/i18n'
import { getNotifications, getUnreadCount, markAsRead } from '@/api/notification'

const router = useRouter()
const { t } = useI18n()
const userStore = useUserStore()
const cartStore = useCartStore()
const localeStore = useLocaleStore()
const supportedLocales = SUPPORTED_LOCALES
const currencyOptions = CURRENCY_OPTIONS
const searchKeyword = ref('')
const notifications = ref([])
const notifCount = ref(0)
let notifTimer = null
let ws = null

// ==================== 淘宝式搜索下拉：热搜榜 + 搜索历史 ====================
const hotWords = ['蓝牙耳机', 'Switch', '香水', '精华', '运动鞋', '坚果']
const HISTORY_KEY = 'searchHistory'
const searchHistory = ref(JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'))

function saveSearchHistory(word) {
  if (!word) return
  const list = [word, ...searchHistory.value.filter(w => w !== word)].slice(0, 8)
  searchHistory.value = list
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list))
}

function clearSearchHistory() {
  searchHistory.value = []
  localStorage.removeItem(HISTORY_KEY)
}

/** 点热搜/历史词直接搜索（闭环：点词 → 结果页） */
function quickSearch(word) {
  searchKeyword.value = word
  saveSearchHistory(word)
  router.push({ path: '/search', query: { keyword: word } })
}

// 🆕 语言切换（Phase 3 - F5）：界面语言即时生效，商品文案由各页面按 locale 重新拉取
function handleLangChange(code) {
  if (code === localeStore.locale) return
  localeStore.setLocale(code)
  ElMessage.success(t('messages.langSwitched'))
}

// 🆕 币种切换（Phase 3 - F5）：全站金额按实时汇率换算为参考价展示
async function handleCurrencyChange(code) {
  if (code === localeStore.currency) return
  localeStore.setCurrency(code)
  if (code !== 'CNY' && !localeStore.ratesLoaded) {
    await localeStore.loadRates()
    if (!localeStore.ratesLoaded) {
      ElMessage.warning(t('messages.ratesLoadFailed'))
      return
    }
  }
  ElMessage.success(t('messages.currencySwitched', { currency: code }))
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    fetchNotifications()
    fetchUnreadCount()
    notifTimer = setInterval(fetchUnreadCount, 60000)
    connectNotificationWs()
  }
})

// 登录状态变化时连接/断开 WebSocket
watch(() => userStore.isLoggedIn, (val) => {
  if (val) {
    fetchNotifications()
    fetchUnreadCount()
    connectNotificationWs()
  } else {
    disconnectWs()
  }
})

onUnmounted(() => {
  if (notifTimer) clearInterval(notifTimer)
  disconnectWs()
})

function connectNotificationWs() {
  try {
    const token = localStorage.getItem('token')
    if (!token) return
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = location.host
    ws = new WebSocket(`${protocol}//${host}/ws/notification?token=${token}`)
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        // 实时推送的新通知 — 插到列表最前面
        notifications.value.unshift(data)
        notifications.value = notifications.value.slice(0, 30)
        notifCount.value++
      } catch { /* ignore */ }
    }
    ws.onclose = () => {
      // 断线重连（5秒后）
      setTimeout(() => {
        if (userStore.isLoggedIn) connectNotificationWs()
      }, 5000)
    }
  } catch { /* ignore */ }
}

function disconnectWs() {
  if (ws) {
    ws.onclose = null // 防止重连
    ws.close()
    ws = null
  }
}

async function fetchNotifications() {
  try {
    const res = await getNotifications(1, 10)
    if (res.code === 200 && res.data) {
      notifications.value = res.data
    }
  } catch {
    // 静默失败
  }
}

async function fetchUnreadCount() {
  try {
    const res = await getUnreadCount()
    if (res.code === 200 && res.data) {
      notifCount.value = res.data.unreadCount || 0
    }
  } catch {
    // 静默失败
  }
}

async function handleNotifClick(item) {
  // 标记已读
  if (item.isRead === 0) {
    try {
      await markAsRead(item.id)
      item.isRead = 1
      notifCount.value = Math.max(0, notifCount.value - 1)
    } catch { /* ignore */ }
  }

  // 跳转
  const { targetType, targetId } = item
  if (!targetType || targetType === 'NONE' || !targetId) return
  switch (targetType) {
    case 'ORDER':
      router.push(`/order/${targetId}`)
      break
    case 'PRODUCT':
      router.push(`/product/${targetId}`)
      break
    case 'LIVE':
      router.push(`/live/${targetId}`)
      break
    case 'COUPON':
      router.push('/coupons')
      break
  }
}

function typeEmoji(type) {
  const map = { ORDER_STATUS: '📦', COUPON_EXPIRE: '🎫', LIVE_START: '📺', PROMOTION: '🎉', SYSTEM: '🔔' }
  return map[type] || '🔔'
}

function clearNotifications() {
  notifications.value = []
  notifCount.value = 0
}

function goToNotifications() {
  router.push('/notifications')
}

function handleSearch() {
  const kw = searchKeyword.value.trim()
  if (kw) {
    saveSearchHistory(kw)
    router.push({ path: '/search', query: { keyword: kw } })
  }
}

function handleLogout() {
  userStore.logout()
  router.push('/')
}
</script>

<style scoped>
/* 公告条：渐变暖色，随滚动离场 */
.announce-bar {
  background: linear-gradient(90deg, #ee0a24 0%, #ff7a45 100%);
  color: #fff;
  font-size: 12px;
  letter-spacing: 2px;
  text-align: center;
  padding: 6px 0;
}
.app-header {
  background: var(--gs-bg-card);
  box-shadow: 0 1px 0 var(--gs-border), 0 2px 12px rgba(15, 24, 44, 0.04);
  position: sticky;
  top: 0;
  z-index: 100;
}
.header-inner {
  max-width: var(--gs-container);
  margin: 0 auto;
  height: var(--gs-header-height);
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 24px;
}
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 19px;
  font-weight: 800;
  letter-spacing: -0.3px;
  color: var(--gs-text-1);
  white-space: nowrap;
}
.logo-mark {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--gs-primary), #4c8dff);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(22, 93, 255, 0.35);
}
.nav-links {
  display: flex;
  gap: 22px;
}
.nav-links a {
  position: relative;
  color: var(--gs-text-2);
  font-size: 14px;
  transition: color 0.2s;
  white-space: nowrap;
  padding: 21px 2px;
}
/* 选中态下划线指示条 */
.nav-links a::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 12px;
  width: 0;
  height: 3px;
  border-radius: 2px;
  background: var(--gs-primary);
  transform: translateX(-50%);
  transition: width 0.2s ease;
}
/* 👥 拼团专区入口高亮（Phase 4 - F7） */
.nav-links a.nav-groupbuy {
  color: var(--gs-price);
  font-weight: 600;
}
.nav-links a.nav-groupbuy::after {
  background: var(--gs-price);
}
.nav-links a:hover {
  color: var(--gs-primary);
}
.nav-links a.router-link-active {
  color: var(--gs-primary);
  font-weight: 600;
}
.nav-links a.router-link-active::after {
  width: 20px;
}
.header-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 16px;
}
.search-box {
  width: 320px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.search-box .el-input {
  flex: 1;
  min-width: 0;
}
/* 胶囊形搜索框 */
.search-box :deep(.el-input__wrapper) {
  border-radius: 999px;
}
.search-box :deep(.el-input-group__append) {
  border-radius: 0 999px 999px 0;
  background: var(--gs-primary);
  color: #fff;
  border-color: var(--gs-primary);
}
.search-box :deep(.el-input-group__append .el-icon) {
  color: #fff;
}
/* 淘宝式搜索下拉（槽内容携带本组件作用域） */
.search-suggest { padding: 4px 2px; }
.ss-section + .ss-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--gs-divider);
}
.ss-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--gs-text-3);
  margin-bottom: 8px;
}
.ss-clear { cursor: pointer; }
.ss-clear:hover { color: var(--gs-primary); }
.ss-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.ss-chip {
  font-size: 13px;
  color: var(--gs-text-2);
  background: var(--gs-bg-hover);
  border-radius: 999px;
  padding: 4px 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.ss-chip:hover {
  color: var(--gs-primary);
  background: color-mix(in srgb, var(--gs-primary) 8%, #fff);
}
.ss-hot-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: var(--gs-radius-sm);
  cursor: pointer;
  font-size: 13px;
  color: var(--gs-text-1);
}
.ss-hot-item:hover { background: var(--gs-bg-hover); }
.ss-rank {
  width: 18px;
  text-align: center;
  font-size: 12px;
  color: var(--gs-text-3);
  font-style: italic;
  font-weight: 700;
}
.ss-rank.top { color: var(--gs-price); }
.ss-word { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ss-hot-tag { font-size: 12px; }
/* 🆕 以图搜图相机入口 */
.camera-entry {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: var(--gs-radius);
  color: var(--gs-text-2);
  background: var(--gs-bg-hover);
  transition: all 0.2s;
  flex-shrink: 0;
}
.camera-entry:hover {
  color: #fff;
  background: var(--gs-primary);
}
.cart-icon {
  cursor: pointer;
  color: var(--gs-text-2);
  display: flex;
  align-items: center;
}
.cart-icon:hover {
  color: var(--gs-primary);
}
/* 🆕 语言/币种切换器（Phase 3 - F5） */
.switcher {
  cursor: pointer;
  color: var(--gs-text-2);
  font-size: 13px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 2px;
  outline: none;
}
.switcher:hover {
  color: var(--gs-primary);
}
.user-info {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: var(--gs-text-2);
  font-size: 14px;
}
.notif-icon {
  cursor: pointer;
  color: var(--gs-text-2);
  display: flex;
  align-items: center;
}
.notif-icon:hover {
  color: var(--gs-primary);
}
.notif-popover .notif-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--gs-divider);
  margin-bottom: 8px;
  font-weight: 600;
}
.notif-empty {
  text-align: center;
  color: var(--gs-text-3);
  padding: 20px 0;
  font-size: 13px;
}
.notif-item {
  padding: 10px 8px;
  border-bottom: 1px solid var(--gs-divider);
  cursor: pointer;
  font-size: 13px;
  display: flex;
  gap: 8px;
  align-items: flex-start;
}
.notif-item.unread {
  background: color-mix(in srgb, var(--gs-primary) 8%, #fff);
}
.notif-item:hover {
  background: color-mix(in srgb, var(--gs-primary) 12%, #fff);
}
.notif-type {
  font-size: 16px;
  flex-shrink: 0;
  padding-top: 1px;
}
.notif-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.notif-msg {
  color: var(--gs-text-1);
  font-weight: 500;
  line-height: 1.4;
}
.notif-sub {
  color: var(--gs-text-3);
  font-size: 12px;
  line-height: 1.3;
}
.notif-footer {
  text-align: center;
  padding: 8px 0 0;
  border-top: 1px solid var(--gs-divider);
  margin-top: 4px;
}
</style>
