<template>
  <div class="page-container live-hall">
    <h2 class="page-title">直播大厅</h2>

    <el-tabs v-model="activeTab" @tab-change="onTabChange" class="hall-tabs">
      <el-tab-pane label="全部" name="all" />
      <el-tab-pane label="直播中" name="1" />
      <el-tab-pane label="未开始" name="0" />
      <el-tab-pane label="已结束" name="2" />
    </el-tabs>

    <div v-loading="loading" class="hall-content">
      <el-empty v-if="!loading && liveList.length === 0" description="暂无直播" />

      <el-row :gutter="20" v-else>
        <el-col :span="6" v-for="room in liveList" :key="room.id" class="room-col">
          <el-card shadow="hover" class="room-card" @click="goWatch(room.id)">
            <div class="room-cover">
              <el-image :src="room.coverImage" fit="cover" class="cover-img">
                <template #error>
                  <div class="cover-placeholder">
                    <el-icon :size="40"><VideoCameraFilled /></el-icon>
                  </div>
                </template>
              </el-image>
              <!-- 状态Badge -->
              <span class="status-badge" :class="statusClass(room.status)">
                <span v-if="room.status === 1" class="pulse-dot"></span>
                {{ statusText(room.status) }}
              </span>
              <!-- 观看人数 -->
              <span class="viewer-count">
                <el-icon><View /></el-icon>
                {{ room.viewerCount || 0 }}
              </span>
            </div>
            <div class="room-info">
              <div class="room-title">{{ room.title }}</div>
              <div class="room-shop">{{ room.shopName }}</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getLiveList } from '@/api/live'
import { VideoCameraFilled, View } from '@element-plus/icons-vue'

const router = useRouter()
const activeTab = ref('all')
const liveList = ref([])
const loading = ref(false)

async function fetchList() {
  loading.value = true
  try {
    const status = activeTab.value === 'all' ? undefined : Number(activeTab.value)
    const res = await getLiveList(status)
    liveList.value = res.data || []
  } catch (e) {
    console.error(e)
    liveList.value = []
  } finally {
    loading.value = false
  }
}

function onTabChange() {
  fetchList()
}

function goWatch(id) {
  router.push(`/live/${id}`)
}

function statusText(status) {
  if (status === 1) return '直播中'
  if (status === 0) return '未开始'
  return '已结束'
}

function statusClass(status) {
  if (status === 1) return 'live'
  return 'offline'
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.live-hall {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}
.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
}
.hall-tabs {
  margin-bottom: 20px;
}
.hall-content {
  min-height: 300px;
}
.room-col {
  margin-bottom: 20px;
}
.room-card {
  cursor: pointer;
  transition: transform 0.2s;
  overflow: hidden;
}
.room-card:hover {
  transform: translateY(-4px);
}
.room-card :deep(.el-card__body) {
  padding: 0;
}
.room-cover {
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 */
  overflow: hidden;
}
.cover-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #1a1a2e;
  color: #555;
}
.status-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 4px;
}
.status-badge.live {
  background: rgba(245, 63, 63, 0.85);
}
.status-badge.offline {
  background: rgba(0, 0, 0, 0.5);
}
.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #fff;
  animation: pulse 1.2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.4); }
}
.viewer-count {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.room-info {
  padding: 12px;
}
.room-title {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}
.room-shop {
  font-size: 12px;
  color: #999;
}
</style>
