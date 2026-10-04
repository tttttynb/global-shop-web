<template>
  <div class="live-watch" v-loading="loading">
    <div class="watch-layout" v-if="liveRoom">
      <!-- 左侧视频区 -->
      <div class="video-section">
        <div class="video-wrapper">
          <template v-if="liveRoom.status === 1">
            <video ref="videoRef" class="video-player" autoplay muted></video>
            <div v-if="videoError" class="video-overlay">
              <el-icon :size="48"><VideoCameraFilled /></el-icon>
              <p>视频加载中...</p>
            </div>
          </template>
          <template v-else>
            <el-image :src="liveRoom.coverImage" fit="cover" class="cover-image">
              <template #error>
                <div class="cover-fallback">
                  <el-icon :size="48"><VideoCameraFilled /></el-icon>
                </div>
              </template>
            </el-image>
            <div class="video-overlay">
              <el-icon :size="48"><VideoCameraFilled /></el-icon>
              <p>{{ liveRoom.status === 0 ? '直播尚未开始' : '直播已结束' }}</p>
            </div>
          </template>
          <!-- 🆕 闪购秒杀卡片：视频区左下角悬浮（Phase 2 - F3）；可手动关闭，开播新场次/进度广播会再次弹出 -->
          <div class="flash-sale-overlay" v-if="flashSale">
            <FlashSaleCard :sale="flashSale" :buying="fsBuying" @buy="handleFlashBuy" @close="flashSale = null" />
          </div>
        </div>
        <div class="video-info">
          <h2 class="live-title">{{ liveRoom.title }}</h2>
          <div class="live-meta">
            <span class="shop-name">{{ liveRoom.shopName }}</span>
            <span class="viewer">
              <el-icon><View /></el-icon>
              {{ liveRoom.viewerCount || 0 }} 人观看
            </span>
          </div>
        </div>
      </div>

      <!-- 右侧面板区 -->
      <div class="panel-section">
        <el-tabs v-model="activeTab" class="panel-tabs">
          <el-tab-pane label="互动弹幕" name="danmu">
            <div class="danmu-panel">
              <LiveDanmu :messages="messages" class="danmu-area" />
              <div class="send-bar">
                <el-input
                  v-model="inputMsg"
                  placeholder="发送弹幕..."
                  @keyup.enter="sendDanmu"
                  :disabled="!userStore.isLoggedIn"
                >
                  <template #append>
                    <el-button @click="sendDanmu" :disabled="!userStore.isLoggedIn">发送</el-button>
                  </template>
                </el-input>
                <div v-if="!userStore.isLoggedIn" class="login-tip">
                  <router-link to="/login">登录</router-link>后参与互动
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="商品列表" name="products">
            <div class="product-panel">
              <div v-if="liveProducts.length === 0 && (!liveRoom.products || liveRoom.products.length === 0)" class="empty-products">
                <el-empty description="暂无商品" :image-size="80" />
              </div>
              <div
                v-for="item in (liveProducts.length > 0 ? liveProducts : liveRoom.products)"
                :key="item.id"
                class="live-product-item"
                :class="{ explaining: item.isExplaining }"
              >
                <el-image :src="item.productImage || item.image" fit="cover" class="product-thumb" @click="goProduct(item.productId || item.id)">
                  <template #error>
                    <div class="thumb-placeholder">
                      <el-icon><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>
                <div class="product-detail" @click="goProduct(item.productId || item.id)">
                  <div class="product-name">{{ item.productName || item.name }}</div>
                  <div class="product-price">¥{{ item.price }}</div>
                </div>
                <el-button type="primary" size="small" :icon="ShoppingCart" @click.stop="handleAddToCart(item)">加购</el-button>
                <el-tag v-if="item.isExplaining" type="danger" size="small" class="explaining-tag">正在讲解</el-tag>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getLiveDetail, getHistoryMessages, getLiveProducts, getActiveFlashSale, buyFlashSale } from '@/api/live'
import { addToCart } from '@/api/cart'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'
import LiveDanmu from '@/components/LiveDanmu.vue'
import FlashSaleCard from '@/components/FlashSaleCard.vue'
import { VideoCameraFilled, View, Picture, ShoppingCart } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const liveRoom = ref(null)
const loading = ref(false)
const activeTab = ref('danmu')
const messages = ref([])
const inputMsg = ref('')
const videoRef = ref(null)
const videoError = ref(false)
const liveProducts = ref([])
const cartStore = useCartStore()

// 🆕 闪购秒杀状态（Phase 2 - F3）
const flashSale = ref(null)
const fsBuying = ref(false)
let fsEndTimer = null

let ws = null
let flvPlayer = null

async function fetchDetail() {
  loading.value = true
  try {
    const res = await getLiveDetail(route.params.id)
    liveRoom.value = res.data
    // 加载历史弹幕（修复：后端分页接口返回 {list,total,...}，且参数为 page/size 两个数字）
    try {
      const msgRes = await getHistoryMessages(route.params.id, 1, 50)
      messages.value = msgRes.data?.list || []
    } catch (e) { /* ignore */ }
    // 加载直播间商品
    try {
      const prodRes = await getLiveProducts(route.params.id)
      liveProducts.value = prodRes.data || []
    } catch (e) { /* ignore */ }
    // 🆕 中途进入直播间时恢复进行中的秒杀卡片
    loadActiveFlashSale()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function loadActiveFlashSale() {
  try {
    const res = await getActiveFlashSale(route.params.id)
    flashSale.value = res.data || null
  } catch (e) {
    flashSale.value = null
  }
}

// 🆕 处理秒杀 WebSocket 事件：START/STOCK_UPDATE 更新卡片，END 展示终态 3 秒后收起
function handleFlashSaleEvent(data) {
  if (!data || !data.action) return
  if (fsEndTimer) {
    clearTimeout(fsEndTimer)
    fsEndTimer = null
  }
  if (data.action === 'START' || data.action === 'STOCK_UPDATE') {
    flashSale.value = data.sale
  } else if (data.action === 'END') {
    flashSale.value = data.sale ? { ...data.sale, status: 1 } : null
    if (flashSale.value) {
      fsEndTimer = setTimeout(() => { flashSale.value = null }, 3000)
    }
  }
}

async function handleFlashBuy(sale) {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  fsBuying.value = true
  try {
    const res = await buyFlashSale(sale.id, 1)
    ElMessage.success('🎉 抢购成功！5 分钟内完成支付哦，正在跳转收银台…')
    router.push(`/order/pay/${res.data}`)
  } catch (e) {
    // 拦截器已展示后端错误信息（已抢空/限购/已结束等）
    loadActiveFlashSale() // 抢购失败时刷新一次卡片状态
  } finally {
    fsBuying.value = false
  }
}

function initFlvPlayer() {
  if (!liveRoom.value || liveRoom.value.status !== 1 || !liveRoom.value.pullUrl) return
  import('flv.js').then(flvModule => {
    const flv = flvModule.default || flvModule
    if (flv.isSupported() && videoRef.value) {
      flvPlayer = flv.createPlayer({
        type: 'flv',
        url: liveRoom.value.pullUrl
      })
      flvPlayer.attachMediaElement(videoRef.value)
      flvPlayer.on('error', () => { videoError.value = true })
      flvPlayer.load()
      flvPlayer.play().catch(() => { videoError.value = true })
    } else {
      videoError.value = true
    }
  }).catch(() => {
    videoError.value = true
  })
}

function initWebSocket() {
  const id = route.params.id
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  // 🆕 修复：后端要求 token 查询参数鉴权，缺失会直接拒绝连接
  const token = localStorage.getItem('token') || ''
  ws = new WebSocket(`${protocol}//${window.location.host}/ws/live/${id}?token=${encodeURIComponent(token)}`)
  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      // 🆕 修复：按信封 type 分发 —— 弹幕取 data 内层（与历史弹幕实体格式对齐），秒杀事件单独处理
      if (msg.type === 'flash_sale') {
        handleFlashSaleEvent(msg.data)
      } else if (msg.type === 'message' && msg.data) {
        messages.value.push(msg.data)
      } else {
        messages.value.push(msg)
      }
    } catch (e) {
      console.error('WebSocket message parse error', e)
    }
  }
  ws.onerror = (e) => {
    console.error('WebSocket error', e)
  }
}

function sendDanmu() {
  if (!inputMsg.value.trim() || !ws) return
  ws.send(JSON.stringify({
    content: inputMsg.value,
    nickname: userStore.username || '游客',
    type: 0
  }))
  inputMsg.value = ''
}

function goProduct(productId) {
  router.push(`/product/${productId}`)
}

async function handleAddToCart(product) {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  try {
    await addToCart({ productId: product.productId, quantity: 1 })
    cartStore.fetchCart()
    ElMessage.success('已加入购物车')
  } catch (e) {
    ElMessage.error('加入失败')
  }
}

onMounted(async () => {
  await fetchDetail()
  if (liveRoom.value) {
    initFlvPlayer()
    initWebSocket()
  }
})

onUnmounted(() => {
  ws?.close()
  if (fsEndTimer) {
    clearTimeout(fsEndTimer)
    fsEndTimer = null
  }
  if (flvPlayer) {
    flvPlayer.pause()
    flvPlayer.unload()
    flvPlayer.detachMediaElement()
    flvPlayer.destroy()
    flvPlayer = null
  }
})
</script>

<style scoped>
.live-watch {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px;
  min-height: 500px;
}
.watch-layout {
  display: flex;
  gap: 16px;
  height: calc(100vh - 120px);
  min-height: 500px;
}

/* 左侧视频区 60% */
.video-section {
  flex: 0 0 60%;
  display: flex;
  flex-direction: column;
}
.video-wrapper {
  position: relative;
  width: 100%;
  padding-top: 56.25%;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}
.video-player {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000;
}
.cover-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.cover-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #1a1a2e;
  color: #555;
}
.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  gap: 12px;
  font-size: 16px;
}
/* 🆕 秒杀卡片悬浮层：视频区左下角 */
.flash-sale-overlay {
  position: absolute;
  left: 16px;
  bottom: 16px;
  z-index: 20;
}
.video-info {
  padding: 12px 0;
}
.live-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}
.live-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  color: #666;
  font-size: 14px;
}
.viewer {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 右侧面板区 40% */
.panel-section {
  flex: 0 0 38%;
  display: flex;
  flex-direction: column;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
}
.panel-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.panel-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
}
.panel-tabs :deep(.el-tab-pane) {
  height: 100%;
}
.panel-tabs :deep(.el-tabs__header) {
  margin: 0;
  padding: 0 12px;
}

/* 弹幕面板 */
.danmu-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.danmu-area {
  flex: 1;
  overflow: hidden;
}
.send-bar {
  padding: 8px 12px;
  border-top: 1px solid #ebeef5;
}
.login-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  text-align: center;
}
.login-tip a {
  color: #409eff;
}

/* 商品面板 */
.product-panel {
  padding: 8px;
  overflow-y: auto;
  height: 100%;
}
.empty-products {
  padding: 40px 0;
}
.live-product-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
}
.live-product-item:hover {
  background: #f5f7fa;
}
.live-product-item.explaining {
  background: #fef0f0;
  border: 1px solid #f56c6c;
}
.product-thumb {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  flex-shrink: 0;
}
.thumb-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #f5f5f5;
  color: #ccc;
}
.product-detail {
  flex: 1;
  min-width: 0;
}
.product-name {
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}
.product-price {
  color: #f56c6c;
  font-size: 15px;
  font-weight: 600;
}
.explaining-tag {
  flex-shrink: 0;
}
</style>
