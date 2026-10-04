import dayjs from 'dayjs'
import { ref, computed, watch, onBeforeUnmount } from 'vue'

/**
 * 倒计时工具（dayjs 统一时间解析，规避 Safari 对 "YYYY-MM-DD HH:mm:ss" 的解析兼容问题）
 *
 * - parseTime(v)      → Dayjs | null：兼容 ISO（含 T）与 "YYYY-MM-DD HH:mm:ss"
 * - formatDuration(ms) → "HH:MM:SS"；超过 24h 显示 "N天HH:MM:SS"（拼团开团时长最长 168h）
 * - useCountdown(source, { onExpire }) → 单实例倒计时，source 为结束时间（值或响应式 getter）
 *   返回 { remainMs, expired, hasTarget, text, start, stop }
 */

export function parseTime(value) {
  if (!value) return null
  if (dayjs.isDayjs(value)) return value
  const d = dayjs(value)
  return d.isValid() ? d : null
}

export function formatDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const days = Math.floor(total / 86400)
  const h = String(Math.floor((total % 86400) / 3600)).padStart(2, '0')
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return days > 0 ? `${days}天 ${h}:${m}:${s}` : `${h}:${m}:${s}`
}

export function useCountdown(endTimeSource, options = {}) {
  const { onExpire } = options

  const remainMs = ref(0)
  const expired = ref(false)
  const hasTarget = ref(false)
  let timer = null

  function currentEnd() {
    const v = typeof endTimeSource === 'function' ? endTimeSource() : endTimeSource
    return parseTime(v)
  }

  function tick() {
    const end = currentEnd()
    hasTarget.value = !!end
    if (!end) {
      remainMs.value = 0
      stop()
      return
    }
    const diff = end.diff(dayjs())
    remainMs.value = Math.max(0, diff)
    if (diff <= 0) {
      expired.value = true
      stop()
      if (onExpire) onExpire()
    }
  }

  function start() {
    stop()
    tick()
    if (hasTarget.value && !expired.value) {
      timer = setInterval(tick, 1000)
    }
  }

  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  // 结束时间变化（新活动/刷新状态）时自动重启；null 时清零停止
  if (typeof endTimeSource === 'function') {
    watch(endTimeSource, () => {
      expired.value = false
      start()
    })
  }

  start()
  onBeforeUnmount(stop)

  const text = computed(() => formatDuration(remainMs.value))

  return { remainMs, expired, hasTarget, text, start, stop }
}
