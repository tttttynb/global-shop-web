<template>
  <div class="danmu-container">
    <div class="danmu-list" ref="listRef">
      <div
        v-for="msg in messages"
        :key="msg.id || msg._key"
        class="danmu-item"
        :class="msgClass(msg.type)"
      >
        <!-- 系统消息 -->
        <template v-if="msg.type === 3">
          <div class="system-msg">{{ msg.content }}</div>
        </template>
        <!-- AI回复 -->
        <template v-else-if="msg.type === 2">
          <span class="nickname ai-nick">[AI助理]</span>
          <span class="msg-icon">🤖</span>
          <span class="msg-content">{{ msg.content }}</span>
        </template>
        <!-- 提问 -->
        <template v-else-if="msg.type === 1">
          <span class="nickname">[{{ msg.nickname }}]</span>
          <span class="msg-icon">❓</span>
          <span class="msg-content">{{ msg.content }}</span>
        </template>
        <!-- 普通弹幕 -->
        <template v-else>
          <span class="nickname">[{{ msg.nickname }}]</span>
          <span class="msg-content">{{ msg.content }}</span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  messages: { type: Array, default: () => [] }
})

const listRef = ref(null)

function scrollToBottom() {
  nextTick(() => {
    if (listRef.value) {
      listRef.value.scrollTop = listRef.value.scrollHeight
    }
  })
}

watch(() => props.messages.length, () => {
  scrollToBottom()
})

function msgClass(type) {
  if (type === 1) return 'question'
  if (type === 2) return 'ai-reply'
  if (type === 3) return 'system'
  return 'normal'
}
</script>

<style scoped>
.danmu-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.danmu-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
}
.danmu-item {
  margin-bottom: 8px;
  font-size: 13px;
  line-height: 1.6;
  padding: 4px 8px;
  border-radius: 6px;
}
.danmu-item.normal {
  background: transparent;
}
.danmu-item.question {
  background: #fdf6ec;
  border-left: 3px solid #e6a23c;
}
.danmu-item.ai-reply {
  background: #ecf5ff;
  border-left: 3px solid #409eff;
}
.danmu-item.system {
  text-align: center;
}
.system-msg {
  font-size: 12px;
  color: #999;
}
.nickname {
  color: #409eff;
  font-weight: 500;
  margin-right: 4px;
}
.ai-nick {
  color: #67c23a;
}
.msg-icon {
  margin-right: 4px;
}
.msg-content {
  word-break: break-all;
}
</style>
