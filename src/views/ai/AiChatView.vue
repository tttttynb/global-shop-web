<template>
  <div class="ai-chat-page">
    <!-- 顶部标题栏 -->
    <div class="chat-header">
      <div class="header-info">
        <span class="header-title">AI 购物顾问</span>
        <el-tag v-if="tierTag" :type="tierTagType" size="small" class="tier-badge">
          {{ tierTag }}
        </el-tag>
        <span class="online-dot"></span>
        <span class="online-text">在线</span>
      </div>
      <div class="header-greeting" v-if="greeting">{{ greeting }}</div>
    </div>

    <!-- 消息区域 -->
    <div class="chat-messages" ref="messagesRef">
      <div
        v-for="(msg, idx) in messages"
        :key="idx"
        class="message-row"
        :class="msg.role"
      >
        <!-- AI 头像 -->
        <el-avatar v-if="msg.role === 'assistant'" :size="36" class="avatar">
          <el-icon :size="20"><Service /></el-icon>
        </el-avatar>

        <div class="bubble-col">
          <!-- AI 回复渲染轻量 Markdown；用户消息保持纯文本 -->
          <div v-if="msg.role === 'assistant'" class="bubble assistant md" v-html="richText(msg.content)"></div>
          <div v-else class="bubble user">{{ msg.content }}</div>

          <!-- 🆕 商品卡片（Phase 4 - F10：工具命中商品可一键加购） -->
          <div v-if="msg.products && msg.products.length" class="product-cards">
            <div
              v-for="p in msg.products"
              :key="p.id"
              class="product-card"
              @click="$router.push(`/product/${p.id}`)"
            >
              <el-image :src="p.coverImage" fit="cover" class="card-img">
                <template #error>
                  <div class="card-img-fallback"><el-icon><Picture /></el-icon></div>
                </template>
              </el-image>
              <div class="card-info">
                <div class="card-name">{{ p.name }}</div>
                <div class="card-price">{{ localeStore.formatPrice(p.price) }}</div>
              </div>
              <el-button
                size="small"
                type="primary"
                plain
                :disabled="addedIds.has(p.id)"
                @click.stop="addSingle(msg, p)"
              >
                {{ addedIds.has(p.id) ? '已加入' : '加购' }}
              </el-button>
            </div>
            <el-button
              class="batch-add-btn"
              type="danger"
              size="small"
              :loading="batchAdding"
              @click="addAll(msg)"
            >
              🛒 一键全部加购（{{ msg.products.length }} 件）
            </el-button>
          </div>
        </div>

        <!-- 用户头像 -->
        <el-avatar v-if="msg.role === 'user'" :size="36" class="avatar">
          <el-icon :size="20"><User /></el-icon>
        </el-avatar>
      </div>

      <!-- AI 思考中 -->
      <div v-if="loading" class="message-row assistant">
        <el-avatar :size="36" class="avatar">
          <el-icon :size="20"><Service /></el-icon>
        </el-avatar>
        <div class="bubble assistant typing-bubble">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>

      <!-- 快捷问题（仅欢迎消息时显示） -->
      <div v-if="messages.length <= 1 && !loading" class="quick-questions">
        <p class="quick-label">你可以试着问我：</p>
        <div class="quick-btns">
          <el-button
            v-for="q in quickQuestions"
            :key="q"
            round
            size="small"
            @click="sendQuick(q)"
          >
            {{ q }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 底部输入区域 -->
    <div class="chat-input-area">
      <el-input
        v-model="inputMsg"
        placeholder="输入您的问题..."
        @keyup.enter="sendMessage"
        :disabled="loading"
        size="large"
        class="chat-input"
      />
      <el-button
        type="primary"
        :icon="Promotion"
        size="large"
        @click="sendMessage"
        :loading="loading"
        :disabled="!inputMsg.trim()"
        class="send-btn"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick, onMounted, computed } from 'vue'
import { Service, User, Promotion, Picture } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { chatWithAi, getUserProfile } from '@/api/ai'
import { addToCart, batchAddToCart } from '@/api/cart'
import { useCartStore } from '@/stores/cart'
import { useLocaleStore } from '@/stores/locale'
import { renderRichText as richText } from '@/utils/richText'

const localeStore = useLocaleStore()
const cartStore = useCartStore()

const messages = ref([
  { role: 'assistant', content: '你好！我是GlobalShop AI购物顾问，有什么可以帮您的？' }
])
const inputMsg = ref('')
const loading = ref(false)
const messagesRef = ref(null)
const greeting = ref('')
const tierTag = ref('')
const tierTagType = ref('info')
const userTier = ref('')

// 🆕 商品卡片加购状态（Phase 4 - F10）
const addedIds = reactive(new Set())
const batchAdding = ref(false)

/** 单个商品加购 */
async function addSingle(msg, p) {
  try {
    const res = await addToCart({ productId: p.id, quantity: 1 })
    if (res.code === 200) {
      addedIds.add(p.id)
      cartStore.increment()
      ElMessage.success('已加入购物车')
    } else {
      ElMessage.error(res.message || '加购失败')
    }
  } catch (e) {
    ElMessage.error(e.message || '加购失败')
  }
}

/** 一键全部加购 */
async function addAll(msg) {
  batchAdding.value = true
  try {
    const items = msg.products.map(p => ({ productId: p.id, quantity: 1 }))
    const res = await batchAddToCart(items)
    if (res.code === 200) {
      msg.products.forEach(p => {
        addedIds.add(p.id)
        cartStore.increment()
      })
      ElMessage.success(res.data || '已加入购物车')
    } else {
      ElMessage.error(res.message || '加购失败')
    }
  } catch (e) {
    ElMessage.error(e.message || '加购失败')
  } finally {
    batchAdding.value = false
  }
}

/** 层级标签映射 */
const tierLabelMap = { PREMIUM: '🏆 高端优选', MID: '🥈 品质甄选', BUDGET: '🥉 实惠推荐', NEW: '👤 新客探索' }
const tierTagTypeMap = { PREMIUM: 'danger', MID: 'warning', BUDGET: 'success', NEW: 'info' }

/** 默认快捷问题（🆕 Phase 4 - F10 金牌导购风格） */
const defaultQuickQuestions = [
  '预算500元，送女朋友什么礼物好？',
  '帮我配一套露营装备',
  '我的订单状态怎么样？',
  '有什么口碑好的热门商品？'
]

/** 层级特定的快捷问题 */
const tierQuickQuestions = {
  PREMIUM: [
    '预算5000元，推荐一块高端腕表',
    '有什么限量款值得入手？',
    '帮我搭配一套商务出差装备',
    '我的订单物流到哪了？'
  ],
  MID: [
    '预算2000元，推荐高性价比数码产品',
    '帮我配一套健身装备',
    '最近有什么促销活动？',
    '有什么口碑好的商品？'
  ],
  BUDGET: [
    '预算300元以内有什么超值好物？',
    '怎么签到领积分抵现？',
    '有什么秒杀活动？',
    '怎么使用优惠券？'
  ],
  NEW: [
    '推荐一些热门商品',
    '预算1000元的新用户好物清单',
    '平台有什么特色功能？',
    '运费怎么计算？'
  ]
}

const quickQuestions = ref(defaultQuickQuestions)

/** 加载用户画像，设置个性化欢迎语和快捷问题 */
async function loadUserProfile() {
  try {
    const token = localStorage.getItem('token')
    if (!token) return

    const res = await getUserProfile()
    if (res.code === 200 && res.data) {
      const profile = res.data
      const tier = profile.userTier || 'NEW'
      userTier.value = tier
      tierTag.value = tierLabelMap[tier] || ''
      tierTagType.value = tierTagTypeMap[tier] || 'info'

      // 构建个性化问候语
      const greetings = {
        PREMIUM: '尊敬的 VIP 客户您好！我是您的私人购物顾问「小波」，很高兴为您服务 🎩',
        MID: '您好！我是您的专属购物助手「小波」，为您甄选品质好物 ✨',
        BUDGET: '嗨！我是您的贴心购物助手「小波」，帮您淘到实惠好货 🛍️',
        NEW: '欢迎来到 GlobalShop！我是您的购物向导「小波」，让我带您探索全球好物 🌍'
      }
      greeting.value = greetings[tier] || greetings.NEW

      // 更新欢迎消息
      const welcomeGreetings = {
        PREMIUM: '尊敬的 VIP 客户您好！我是您的私人购物顾问「小波」。有什么高端好物需要我为您寻觅？🎩',
        MID: '您好！我是您的专属购物助手「小波」，为您甄选品质好物。有什么可以帮您的？✨',
        BUDGET: '嗨！我是「小波」，您的贴心购物助手。帮您淘实惠、找好货，有什么想看看的？🛍️',
        NEW: '欢迎来到 GlobalShop！我是「小波」，您的购物向导。有什么想了解的，尽管问我！🌍'
      }
      messages.value[0] = {
        role: 'assistant',
        content: welcomeGreetings[tier] || welcomeGreetings.NEW
      }

      // 更新快捷问题
      quickQuestions.value = tierQuickQuestions[tier] || defaultQuickQuestions
    }
  } catch {
    // 静默失败 — 未登录或接口异常时使用默认配置
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

async function sendMessage() {
  if (!inputMsg.value.trim()) return
  const userMsg = inputMsg.value.trim()
  inputMsg.value = ''
  messages.value.push({ role: 'user', content: userMsg })
  scrollToBottom()

  loading.value = true
  try {
    const res = await chatWithAi(userMsg)
    // 🆕 Phase 4 - F10：后端返回 {reply, products}（products=工具命中的可加购商品卡片）
    const data = res.data || {}
    const reply = typeof data === 'string' ? data : (data.reply || '')
    const products = Array.isArray(data.products) ? data.products : []
    messages.value.push({ role: 'assistant', content: reply, products })
  } catch (e) {
    messages.value.push({ role: 'assistant', content: '抱歉，我暂时无法回答，请稍后再试。' })
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

function sendQuick(question) {
  inputMsg.value = question
  sendMessage()
}

onMounted(async () => {
  scrollToBottom()
  await loadUserProfile()
})
</script>

<style scoped>
.ai-chat-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 130px);
  max-width: 860px;
  margin: 0 auto;
  background: #fff;
  border-radius: var(--gs-radius-lg);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.chat-header {
  padding: 16px 24px;
  border-bottom: 1px solid #ebeef5;
  background: #fafafa;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--gs-text-1);
}

.tier-badge {
  font-size: 12px;
}

.header-greeting {
  margin-top: 8px;
  font-size: 13px;
  color: var(--gs-text-3);
  font-style: italic;
}

.online-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #67c23a;
  display: inline-block;
}

.online-text {
  font-size: 13px;
  color: var(--gs-success);
}

/* 消息区域 */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #f9fafb;
}

.message-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.message-row.user {
  justify-content: flex-end;
}

.message-row.assistant {
  justify-content: flex-start;
}

.avatar {
  flex-shrink: 0;
  background: #e8f4fd;
  color: var(--gs-primary);
}

.message-row.user .avatar {
  background: var(--gs-primary);
  color: #fff;
}

.bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

/* 🆕 气泡 + 商品卡片纵向布局（Phase 4 - F10） */
.bubble-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 85%;
  min-width: 0;
}

.bubble-col .bubble {
  max-width: 100%;
  align-self: flex-start;
}

.product-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.product-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  padding: 8px 10px;
  cursor: pointer;
  transition: box-shadow 0.2s, border-color 0.2s;
}

.product-card:hover {
  border-color: var(--gs-primary);
  box-shadow: 0 2px 10px rgba(64, 158, 255, 0.15);
}

.card-img {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  flex-shrink: 0;
}

.card-img-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--gs-bg-hover);
  color: var(--gs-text-3);
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-name {
  font-size: 13px;
  color: var(--gs-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-price {
  font-size: 14px;
  font-weight: 700;
  color: #e6323e;
  margin-top: 4px;
}

.batch-add-btn {
  align-self: flex-start;
}

.bubble.assistant {
  background: var(--gs-bg-hover);
  color: var(--gs-text-1);
  border-top-left-radius: 4px;
}

.bubble.user {
  background: var(--gs-primary);
  color: #fff;
  border-top-right-radius: 4px;
  white-space: pre-wrap;
}

/* AI 回复富文本（renderRichText 产物）
   v-html 注入的内容不带 scoped 标记，必须用 :deep() 命中 */
.bubble.md :deep(p) {
  margin: 0 0 8px;
}
.bubble.md :deep(p:last-child) {
  margin-bottom: 0;
}
.bubble.md :deep(strong) {
  font-weight: 700;
  color: var(--gs-text-1);
}
.bubble.md :deep(ul),
.bubble.md :deep(ol) {
  margin: 0 0 8px;
  padding-left: 20px;
}
.bubble.md :deep(li) {
  margin-bottom: 4px;
}
.bubble.md :deep(hr) {
  border: none;
  border-top: 1px solid var(--gs-border);
  margin: 10px 0;
}

/* 打字动画 */
.typing-bubble {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 14px 20px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #909399;
  animation: bounce 1.4s infinite ease-in-out;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-8px);
  }
}

/* 快捷问题 */
.quick-questions {
  padding: 8px 0 0 46px;
}

.quick-label {
  font-size: 13px;
  color: var(--gs-text-3);
  margin-bottom: 10px;
}

.quick-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-btns .el-button {
  font-size: 13px;
}

/* 输入区域 */
.chat-input-area {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #ebeef5;
  background: #fff;
}

.chat-input {
  flex: 1;
}

.chat-input :deep(.el-input__wrapper) {
  border-radius: 20px;
  padding: 4px 16px;
}

.send-btn {
  border-radius: 50%;
  width: 44px;
  height: 44px;
  padding: 0;
}
</style>
