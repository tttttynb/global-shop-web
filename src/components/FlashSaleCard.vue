<template>
  <div class="flash-sale-card" v-if="sale">
    <div class="fs-header">
      <span class="fs-badge">⚡ 限时秒杀</span>
      <span class="fs-countdown" :class="{ urgent: remainSeconds <= 30 }">
        {{ countdownText }}
      </span>
    </div>

    <div class="fs-body">
      <el-image :src="sale.productImage" fit="cover" class="fs-image">
        <template #error>
          <div class="fs-image-placeholder">📦</div>
        </template>
      </el-image>
      <div class="fs-info">
        <div class="fs-name">{{ sale.productName }}</div>
        <div class="fs-spec" v-if="sale.skuSpec && sale.skuSpec !== '默认规格'">{{ sale.skuSpec }}</div>
        <div class="fs-price-row">
          <span class="fs-price">¥{{ Number(sale.flashPrice).toFixed(2) }}</span>
          <span class="fs-original" v-if="sale.originalPrice">¥{{ Number(sale.originalPrice).toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <div class="fs-progress">
      <el-progress
        :percentage="sale.soldPercent || 0"
        :stroke-width="10"
        color="#ff4d4f"
        :show-text="false"
      />
      <div class="fs-progress-text">
        <span>🔥 已抢 {{ sale.soldPercent || 0 }}%</span>
        <span v-if="sale.remainQty > 0">仅剩 {{ sale.remainQty }} 件</span>
        <span v-else class="fs-soldout">已抢空</span>
      </div>
    </div>

    <el-button
      class="fs-buy-btn"
      type="danger"
      size="large"
      round
      :loading="buying"
      :disabled="sale.remainQty <= 0 || ended || sale.status !== 0"
      @click="$emit('buy', sale)"
    >
      {{ sale.remainQty <= 0 ? '已抢空' : ((ended || sale.status !== 0) ? '已结束' : '立即抢购') }}
    </el-button>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'

const props = defineProps({
  sale: { type: Object, default: null },
  buying: { type: Boolean, default: false }
})
defineEmits(['buy'])

const remainSeconds = ref(0)
const ended = ref(false)
let timer = null

function parseEndTime(endTime) {
  if (!endTime) return null
  // 后端 LocalDateTime 序列化为 ISO 字符串（无时区，按本地时间解析）
  const d = new Date(typeof endTime === 'string' ? endTime.replace(' ', 'T') : endTime)
  return isNaN(d.getTime()) ? null : d
}

function tick() {
  const end = parseEndTime(props.sale?.endTime)
  if (!end) return
  const diff = Math.floor((end.getTime() - Date.now()) / 1000)
  remainSeconds.value = Math.max(0, diff)
  if (diff <= 0) {
    ended.value = true
    stopTimer()
  }
}

function startTimer() {
  stopTimer()
  ended.value = false
  tick()
  timer = setInterval(tick, 1000)
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const countdownText = computed(() => {
  const s = remainSeconds.value
  const mm = String(Math.floor(s / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `⏰ ${mm}:${ss}`
})

// sale 变化（新活动/进度广播）时重置计时；END 事件由父组件直接移除卡片
watch(() => props.sale?.id, (id) => {
  if (id) startTimer()
  else stopTimer()
}, { immediate: true })

onUnmounted(stopTimer)
</script>

<style scoped>
.flash-sale-card {
  width: 300px;
  background: linear-gradient(160deg, #fff1f0 0%, #ffffff 40%);
  border: 2px solid #ff4d4f;
  border-radius: 12px;
  padding: 12px 14px 14px;
  box-shadow: 0 8px 32px rgba(255, 77, 79, 0.35);
  animation: fs-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes fs-pop {
  from { transform: scale(0.7) translateY(20px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}
.fs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.fs-badge {
  background: linear-gradient(90deg, #ff4d4f, #ff7a45);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
}
.fs-countdown {
  font-size: 15px;
  font-weight: 700;
  color: #ff4d4f;
  font-variant-numeric: tabular-nums;
}
.fs-countdown.urgent {
  animation: fs-blink 0.6s infinite alternate;
}
@keyframes fs-blink {
  from { opacity: 1; }
  to { opacity: 0.35; }
}
.fs-body {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
.fs-image {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  flex-shrink: 0;
  background: #f5f5f5;
}
.fs-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  background: #f5f5f5;
  border-radius: 8px;
}
.fs-info {
  flex: 1;
  min-width: 0;
}
.fs-name {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fs-spec {
  font-size: 11px;
  color: #909399;
  background: #f5f7fa;
  border-radius: 3px;
  padding: 1px 6px;
  display: inline-block;
  margin: 3px 0;
}
.fs-price-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.fs-price {
  font-size: 20px;
  font-weight: 800;
  color: #ff4d4f;
}
.fs-original {
  font-size: 12px;
  color: #c0c4cc;
  text-decoration: line-through;
}
.fs-progress {
  margin-bottom: 10px;
}
.fs-progress-text {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #ff4d4f;
  margin-top: 4px;
}
.fs-soldout {
  color: #909399;
}
.fs-buy-btn {
  width: 100%;
  font-weight: 700;
  letter-spacing: 2px;
}
</style>
