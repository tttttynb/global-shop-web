<template>
  <div class="notification-page">
    <div class="page-header">
      <h2>📬 消息中心</h2>
      <el-button v-if="unreadCount > 0" type="primary" size="small" @click="handleMarkAllRead">
        全部已读
      </el-button>
    </div>

    <el-card class="notif-card" v-loading="loading">
      <template v-if="notifications.length === 0 && !loading">
        <el-empty description="暂无消息通知" />
      </template>

      <div
        v-for="item in notifications"
        :key="item.id"
        class="notif-item"
        :class="{ unread: item.isRead === 0 }"
        @click="handleClick(item)"
      >
        <div class="notif-dot">
          <span v-if="item.isRead === 0" class="dot"></span>
        </div>
        <div class="notif-body">
          <div class="notif-title">
            <el-tag size="small" :type="typeTagMap[item.type] || 'info'">{{ item.typeLabel }}</el-tag>
            <span class="title-text">{{ item.title }}</span>
          </div>
          <div class="notif-content">{{ item.content }}</div>
          <div class="notif-time">{{ item.timeAgo }}</div>
        </div>
        <div class="notif-action">
          <el-button text size="small" type="danger" @click.stop="handleDelete(item.id)">删除</el-button>
        </div>
      </div>

      <div class="pagination-wrap" v-if="total > 0">
        <el-pagination
          v-model:current-page="page"
          :page-size="size"
          :total="total"
          layout="prev, pager, next"
          @current-change="fetchNotifications"
          small
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification } from '@/api/notification'

const router = useRouter()
const loading = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const page = ref(1)
const size = ref(20)
const total = ref(0)

const typeTagMap = {
  ORDER_STATUS: '',
  COUPON_EXPIRE: 'warning',
  LIVE_START: 'success',
  PROMOTION: 'danger',
  SYSTEM: 'info',
  // 🆕 Phase 4：拼团 / 积分通知
  GROUP_BUY: 'danger',
  POINTS: 'warning'
}

onMounted(() => {
  fetchNotifications()
  fetchUnreadCount()
})

async function fetchNotifications() {
  loading.value = true
  try {
    const res = await getNotifications(page.value, size.value)
    if (res.code === 200 && res.data) {
      notifications.value = res.data
      // MyBatis-Plus 分页返回的 total 在 res.data 之外，这里简单处理
    }
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
}

async function fetchUnreadCount() {
  try {
    const res = await getUnreadCount()
    if (res.code === 200 && res.data) {
      unreadCount.value = res.data.unreadCount || 0
    }
  } catch {
    // ignore
  }
}

async function handleClick(item) {
  // 标记已读
  if (item.isRead === 0) {
    try {
      await markAsRead(item.id)
      item.isRead = 1
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch {
      // ignore
    }
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
    case 'GROUP_RECORD':
      // 🆕 Phase 4 - F7：拼团通知 → 团详情（分享落地页）
      router.push(`/group-buy/record/${targetId}`)
      break
    default:
      break
  }
}

async function handleMarkAllRead() {
  try {
    await markAllAsRead()
    notifications.value.forEach(n => { n.isRead = 1 })
    unreadCount.value = 0
    ElMessage.success('已全部标为已读')
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

async function handleDelete(id) {
  try {
    await deleteNotification(id)
    const idx = notifications.value.findIndex(n => n.id === id)
    if (idx >= 0) {
      if (notifications.value[idx].isRead === 0) {
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
      notifications.value.splice(idx, 1)
    }
    ElMessage.success('已删除')
  } catch (e) {
    ElMessage.error(e.message || '删除失败')
  }
}
</script>

<style scoped>
.notification-page {
  max-width: 860px;
  margin: 0 auto;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.page-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}
.notif-card {
  border-radius: 8px;
}
.notif-item {
  display: flex;
  align-items: flex-start;
  padding: 14px 12px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background 0.15s;
}
.notif-item:last-child {
  border-bottom: none;
}
.notif-item:hover {
  background: #f9fafc;
}
.notif-item.unread {
  background: #ecf5ff;
}
.notif-dot {
  width: 20px;
  flex-shrink: 0;
  padding-top: 6px;
}
.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: #409eff;
  border-radius: 50%;
}
.notif-body {
  flex: 1;
  min-width: 0;
}
.notif-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.title-text {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}
.notif-content {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 4px;
}
.notif-time {
  font-size: 12px;
  color: #999;
}
.notif-action {
  flex-shrink: 0;
  padding-top: 2px;
  margin-left: 8px;
}
.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
