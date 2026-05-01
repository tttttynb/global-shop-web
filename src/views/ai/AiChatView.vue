<template>
  <div class="ai-chat-page">
    <!-- 顶部标题栏 -->
    <div class="chat-header">
      <div class="header-info">
        <span class="header-title">AI 智能客服</span>
        <span class="online-dot"></span>
        <span class="online-text">在线</span>
      </div>
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

        <div class="bubble" :class="msg.role">
          {{ msg.content }}
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
import { ref, nextTick, onMounted } from 'vue'
import { Service, User, Promotion } from '@element-plus/icons-vue'
import { chatWithAi } from '@/api/ai'

const messages = ref([
  { role: 'assistant', content: '你好！我是GlobalShop AI客服，有什么可以帮您的？' }
])
const inputMsg = ref('')
const loading = ref(false)
const messagesRef = ref(null)

const quickQuestions = [
  '我的订单状态怎么样？',
  '推荐一些热门商品',
  '如何申请退款？',
  '运费怎么计算？'
]

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
    messages.value.push({ role: 'assistant', content: res.data })
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

onMounted(() => {
  scrollToBottom()
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
  border-radius: 12px;
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
  color: #303133;
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
  color: #67c23a;
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
  color: #409eff;
}

.message-row.user .avatar {
  background: #409eff;
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

.bubble.assistant {
  background: #f4f4f5;
  color: #303133;
  border-top-left-radius: 4px;
}

.bubble.user {
  background: #409eff;
  color: #fff;
  border-top-right-radius: 4px;
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
  color: #909399;
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
