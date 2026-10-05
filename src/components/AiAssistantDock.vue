<template>
  <div v-if="visible">
    <!-- 迷你客服面板 -->
    <transition name="dock-pop">
      <div v-if="open" class="dock-panel" :style="panelStyle">
        <div class="dp-header">
          <div class="dp-title-wrap">
            <span class="dp-title">AI 购物顾问</span>
            <span class="dp-online"><i class="dp-dot"></i>在线</span>
          </div>
          <div class="dp-actions">
            <el-button size="small" text class="dp-expand" @click="goFullChat">全屏对话</el-button>
            <el-icon class="dp-close" :size="18" @click="open = false"><Close /></el-icon>
          </div>
        </div>

        <!-- 未登录引导（闭环：不让人撞墙，给明确出口） -->
        <div v-if="!userStore.isLoggedIn" class="dp-login-tip">
          <p>登录后 AI 会结合你的偏好与订单来推荐、答疑。</p>
          <el-button type="primary" size="small" @click="goLogin">去登录</el-button>
        </div>

        <div v-else class="dp-body">
          <div class="dp-messages" ref="listRef">
            <!-- 开场白 -->
            <div class="dp-row assistant">
              <div class="dp-avatar"><el-icon :size="16"><Service /></el-icon></div>
              <div class="dp-bubble assistant">
                你好，我是 GlobalShop AI 顾问 ✨ 可以帮你找货、比价、查订单，问试试吧。
              </div>
            </div>

            <div v-for="(m, i) in messages" :key="i" class="dp-row" :class="m.role">
              <div v-if="m.role === 'assistant'" class="dp-avatar"><el-icon :size="16"><Service /></el-icon></div>
              <div class="dp-bubble-col">
                <div class="dp-bubble" :class="m.role">{{ m.content }}</div>
                <!-- 商品卡：AI 推荐可直加购（与全屏页同源能力） -->
                <div v-if="m.products && m.products.length" class="dp-products">
                  <div
                    v-for="p in m.products.slice(0, 3)"
                    :key="p.id"
                    class="dp-product"
                    @click="openProduct(p.id)"
                  >
                    <el-image :src="p.coverImage" fit="cover" class="dp-p-img">
                      <template #error><div class="dp-p-fallback"><el-icon><Picture /></el-icon></div></template>
                    </el-image>
                    <div class="dp-p-info">
                      <div class="dp-p-name">{{ p.name }}</div>
                      <div class="dp-p-price">{{ localeStore.formatPrice(p.price) }}</div>
                    </div>
                    <el-button
                      size="small"
                      type="primary"
                      plain
                      :disabled="addedIds.has(p.id)"
                      @click.stop="addSingle(p)"
                    >{{ addedIds.has(p.id) ? '已加' : '加购' }}</el-button>
                  </div>
                </div>
              </div>
              <div v-if="m.role === 'user'" class="dp-avatar"><el-icon :size="16"><User /></el-icon></div>
            </div>

            <!-- 思考中 -->
            <div v-if="loading" class="dp-row assistant">
              <div class="dp-avatar"><el-icon :size="16"><Service /></el-icon></div>
              <div class="dp-bubble assistant typing"><i></i><i></i><i></i></div>
            </div>
          </div>

          <!-- 快捷提问（无对话记录时给出，点即发） -->
          <div v-if="!messages.length && !loading" class="dp-quick">
            <span v-for="q in quickQuestions" :key="q" class="dp-q" @click="send(q)">{{ q }}</span>
          </div>

          <div class="dp-input">
            <el-input
              v-model="draft"
              placeholder="问我想要什么好物…"
              maxlength="200"
              @keyup.enter="send()"
            />
            <el-button
              type="primary"
              :loading="loading"
              :disabled="!draft.trim()"
              circle
              @click="send()"
            >
              <el-icon><Promotion /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 悬浮球：沿右缘可拖拽，位置记忆；轻点开面板 -->
    <div
      class="dock-ball"
      :class="{ dragging, active: open }"
      :style="{ bottom: ballBottom + 'px' }"
      @pointerdown="onBallDown"
    >
      <span class="db-pulse"></span>
      <el-icon :size="24"><Service /></el-icon>
      <span class="db-label">AI 客服</span>
    </div>
  </div>
</template>

<script setup>
/**
 * 全站 AI 客服悬浮球（买家端）
 * - 悬浮球可沿右缘拖拽、位置记忆（localStorage），轻点展开迷你对话面板
 * - 复用 /api/chat（{reply, products}），商品卡支持直接加购，与全屏对话页能力一致
 * - 闭环：面板可关（X）、未登录给明确出口、/ai/chat 页自身隐藏避免重复入口
 */
import { ref, computed, nextTick, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Service, User, Picture, Close, Promotion } from '@element-plus/icons-vue'
import { chatWithAi } from '@/api/ai'
import { addToCart } from '@/api/cart'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'
import { useLocaleStore } from '@/stores/locale'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()
const localeStore = useLocaleStore()

const open = ref(false)
const messages = ref([])
const draft = ref('')
const loading = ref(false)
const addedIds = ref(new Set())
const listRef = ref(null)

const quickQuestions = [
  '推荐一款降噪耳机',
  '帮我找 500 元内的护肤品',
  '我的订单到哪了'
]

// /ai/chat 全屏页自身不再显示悬浮球
const visible = computed(() => route.path !== '/ai/chat')

// ==================== 悬浮球拖拽（仅垂直，沿右缘） ====================
const BALL_KEY = 'aiDockBottom'
const dragging = ref(false)

/** 夹取范围：上限保证面板（540 高 + 66 间距）始终放得下 */
function clampBottom(v) {
  const min = 76
  const max = Math.max(min, window.innerHeight - 620)
  return Math.min(max, Math.max(min, v))
}

const ballBottom = ref(clampBottom(Number(localStorage.getItem(BALL_KEY)) || 88))
let dragStartY = 0
let dragStartBottom = 0

function onBallDown(e) {
  dragging.value = false
  dragStartY = e.clientY
  dragStartBottom = ballBottom.value
  window.addEventListener('pointermove', onBallMove)
  window.addEventListener('pointerup', onBallUp)
}

function onBallMove(e) {
  const dy = e.clientY - dragStartY
  if (Math.abs(dy) > 4) dragging.value = true
  if (!dragging.value) return
  ballBottom.value = clampBottom(dragStartBottom - dy)
}

function onBallUp() {
  window.removeEventListener('pointermove', onBallMove)
  window.removeEventListener('pointerup', onBallUp)
  if (dragging.value) {
    localStorage.setItem(BALL_KEY, String(ballBottom.value))
    // 下一轮事件循环再复位，避免 click 误判为点开面板
    setTimeout(() => { dragging.value = false }, 0)
  } else {
    open.value = !open.value
  }
}

// 面板紧贴球上方展开；高度自适应剩余空间，任何拖拽位置都不会溢出屏幕
const panelStyle = computed(() => {
  const bottom = ballBottom.value + 66
  const maxH = Math.max(240, window.innerHeight - bottom - 10)
  return { bottom: bottom + 'px', maxHeight: maxH + 'px' }
})

watch([() => open.value, () => messages.value.length, loading], scrollToBottom)
watch(visible, (v) => { if (!v) open.value = false })

function scrollToBottom() {
  if (!open.value) return
  nextTick(() => {
    const el = listRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

// ==================== 对话 ====================
async function send(preset) {
  const text = (preset || draft.value || '').trim()
  if (!text || loading.value) return
  draft.value = ''
  messages.value.push({ role: 'user', content: text })
  loading.value = true
  try {
    const res = await chatWithAi(text)
    const data = res.data || {}
    const reply = typeof data === 'string' ? data : (data.reply || '')
    const products = Array.isArray(data.products) ? data.products : []
    messages.value.push({ role: 'assistant', content: reply || '我暂时没理解这个问题，换个说法试试？', products })
  } catch (e) {
    messages.value.push({ role: 'assistant', content: '抱歉，我暂时无法回答，请稍后再试。' })
  } finally {
    loading.value = false
  }
}

async function addSingle(p) {
  try {
    const res = await addToCart({ productId: p.id, quantity: 1 })
    if (res.code === 200) {
      const next = new Set(addedIds.value)
      next.add(p.id)
      addedIds.value = next
      cartStore.increment()
      ElMessage.success('已加入购物车')
    } else {
      ElMessage.error(res.message || '加购失败')
    }
  } catch (e) {
    ElMessage.error(e.message || '加购失败')
  }
}

function openProduct(id) {
  open.value = false
  router.push(`/product/${id}`)
}

function goFullChat() {
  open.value = false
  router.push('/ai/chat')
}

function goLogin() {
  router.push({ path: '/login', query: { redirect: route.fullPath } })
}

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onBallMove)
  window.removeEventListener('pointerup', onBallUp)
})
</script>

<style scoped>
/* ==================== 悬浮球 ==================== */
.dock-ball {
  position: fixed;
  right: 16px;
  z-index: 1900;
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: linear-gradient(135deg, #165dff 0%, #6f3bff 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  cursor: pointer;
  user-select: none;
  touch-action: none;
  box-shadow: 0 6px 18px rgba(22, 93, 255, 0.4);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.dock-ball:hover { transform: scale(1.06); }
.dock-ball.active {
  background: linear-gradient(135deg, #0e42d2 0%, #5a2fd6 100%);
}
.dock-ball.dragging {
  transition: none;
  transform: scale(1.04);
  box-shadow: 0 10px 26px rgba(22, 93, 255, 0.5);
}
.db-label {
  font-size: 10px;
  line-height: 1;
  letter-spacing: 0.5px;
}
/* 呼吸光圈：吸引注意但不吵 */
.db-pulse {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid rgba(22, 93, 255, 0.45);
  animation: db-pulse 2.2s ease-out infinite;
  pointer-events: none;
}
.dock-ball.active .db-pulse { display: none; }
@keyframes db-pulse {
  0% { transform: scale(0.92); opacity: 0.9; }
  70%, 100% { transform: scale(1.35); opacity: 0; }
}

/* ==================== 面板 ==================== */
.dock-panel {
  position: fixed;
  right: 16px;
  z-index: 1900;
  width: 380px;
  max-width: calc(100vw - 32px);
  height: 540px;
  max-height: calc(100vh - 140px);
  background: var(--gs-bg-card);
  border-radius: var(--gs-radius-lg);
  box-shadow: 0 12px 40px rgba(15, 24, 44, 0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.dock-pop-enter-active,
.dock-pop-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
  transform-origin: bottom right;
}
.dock-pop-enter-from,
.dock-pop-leave-to {
  opacity: 0;
  transform: scale(0.92) translateY(10px);
}

.dp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: linear-gradient(135deg, #165dff 0%, #4c8dff 100%);
  color: #fff;
  flex-shrink: 0;
}
.dp-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dp-title {
  font-size: 15px;
  font-weight: 700;
}
.dp-online {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  opacity: 0.92;
}
.dp-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #7bf1a8;
  box-shadow: 0 0 0 2px rgba(123, 241, 168, 0.3);
}
.dp-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.dp-expand {
  color: rgba(255, 255, 255, 0.9) !important;
}
.dp-expand:hover { color: #fff !important; }
.dp-close {
  cursor: pointer;
  color: rgba(255, 255, 255, 0.9);
}
.dp-close:hover { color: #fff; }

/* 未登录出口 */
.dp-login-tip {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  text-align: center;
  color: var(--gs-text-2);
  font-size: 13px;
}

.dp-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.dp-messages {
  flex: 1;
  overflow-y: auto;
  padding: 14px 12px 6px;
}
.dp-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  align-items: flex-start;
}
.dp-row.user { justify-content: flex-end; }
.dp-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--gs-primary) 10%, #fff);
  color: var(--gs-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.dp-row.user .dp-avatar {
  background: var(--gs-bg-hover);
  color: var(--gs-text-2);
  order: 2;
}
.dp-bubble-col { min-width: 0; max-width: 268px; }
.dp-bubble {
  font-size: 13px;
  line-height: 1.6;
  padding: 9px 12px;
  border-radius: 12px;
  word-break: break-word;
  white-space: pre-wrap;
}
.dp-bubble.assistant {
  background: var(--gs-bg-hover);
  color: var(--gs-text-1);
  border-top-left-radius: 4px;
}
.dp-bubble.user {
  background: var(--gs-primary);
  color: #fff;
  border-top-right-radius: 4px;
}

/* 商品卡 */
.dp-products {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dp-product {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--gs-border);
  border-radius: var(--gs-radius);
  padding: 8px;
  cursor: pointer;
  background: var(--gs-bg-card);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.dp-product:hover {
  border-color: color-mix(in srgb, var(--gs-primary) 35%, #fff);
  box-shadow: var(--gs-shadow-1);
}
.dp-p-img {
  width: 42px;
  height: 42px;
  border-radius: 6px;
  flex-shrink: 0;
  background: var(--gs-bg-hover);
}
.dp-p-fallback {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gs-bg-hover);
  color: var(--gs-text-3);
}
.dp-p-info { flex: 1; min-width: 0; }
.dp-p-name {
  font-size: 12px;
  color: var(--gs-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 3px;
}
.dp-p-price {
  font-size: 14px;
  font-weight: 800;
  color: var(--gs-price);
}

/* 思考中动画 */
.dp-bubble.typing {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 12px;
}
.dp-bubble.typing i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--gs-text-3);
  animation: dp-typing 1.2s infinite ease-in-out;
}
.dp-bubble.typing i:nth-child(2) { animation-delay: 0.18s; }
.dp-bubble.typing i:nth-child(3) { animation-delay: 0.36s; }
@keyframes dp-typing {
  0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-3px); }
}

/* 快捷提问 */
.dp-quick {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 12px 10px;
}
.dp-q {
  font-size: 12px;
  color: var(--gs-text-2);
  background: var(--gs-bg-card);
  border: 1px solid var(--gs-border);
  border-radius: 999px;
  padding: 5px 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.dp-q:hover {
  color: var(--gs-primary);
  border-color: var(--gs-primary);
  background: color-mix(in srgb, var(--gs-primary) 6%, #fff);
}

/* 输入区 */
.dp-input {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  border-top: 1px solid var(--gs-divider);
  background: var(--gs-bg-card);
  flex-shrink: 0;
}
.dp-input :deep(.el-input__wrapper) {
  border-radius: 999px;
}
</style>
