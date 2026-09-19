<template>
  <div class="home-page">
    <!-- Banner轮播 -->
    <el-carousel :interval="4000" height="360px" class="banner-carousel">
      <el-carousel-item v-for="banner in banners" :key="banner.title">
        <div class="banner-item" :style="{ background: banner.bg }">
          <div class="banner-content">
            <h2>{{ banner.title }}</h2>
            <p>{{ banner.desc }}</p>
          </div>
        </div>
      </el-carousel-item>
    </el-carousel>

    <div class="home-container">
      <!-- 正在直播 -->
      <section class="section" v-if="liveList.length > 0">
        <div class="section-header">
          <h2 class="section-title">🔴 正在直播</h2>
          <router-link to="/live" class="section-more">查看全部 ›</router-link>
        </div>
        <div class="live-scroll-wrapper">
          <div class="live-scroll">
            <el-card v-for="live in liveList" :key="live.id" shadow="hover" class="live-card" @click="$router.push(`/live/${live.id}`)">
              <div class="live-cover">
                <el-image :src="live.coverImage" fit="cover" class="live-cover-img">
                  <template #error>
                    <div class="live-cover-placeholder">
                      <el-icon :size="32"><VideoCamera /></el-icon>
                    </div>
                  </template>
                </el-image>
                <span class="live-badge">直播中</span>
              </div>
              <div class="live-info">
                <h4 class="live-title">{{ live.title }}</h4>
                <span class="live-viewers"><el-icon><View /></el-icon> {{ live.viewerCount || 0 }}</span>
              </div>
            </el-card>
          </div>
        </div>
      </section>

      <!-- 个性化商品分区 -->
      <template v-if="feedLoading">
        <section class="section" v-for="n in 2" :key="'skel'+n">
          <div class="section-header">
            <h2 class="section-title skeleton-title">&nbsp;</h2>
          </div>
          <el-row :gutter="20">
            <el-col :span="6" v-for="m in 8" :key="m">
              <el-skeleton animated>
                <template #template>
                  <el-skeleton-item variant="image" style="width: 100%; height: 200px" />
                  <div style="padding: 12px">
                    <el-skeleton-item variant="h3" style="width: 80%" />
                    <el-skeleton-item variant="text" style="width: 60%; margin-top: 8px" />
                  </div>
                </template>
              </el-skeleton>
            </el-col>
          </el-row>
        </section>
      </template>

      <template v-else>
        <section class="section" v-for="section in feedSections" :key="section.key">
          <div class="section-header">
            <div class="section-title-row">
              <h2 class="section-title">{{ section.title }}</h2>
              <span class="section-subtitle">{{ section.subtitle }}</span>
            </div>
            <router-link :to="section.link" class="section-more">查看全部 ›</router-link>
          </div>
          <el-row :gutter="20">
            <el-col :span="6" v-for="product in section.products" :key="product.id" class="product-col">
              <div class="feed-product-card" @click="$router.push(`/product/${product.id}`)">
                <div class="feed-product-img">
                  <el-image :src="product.coverImage" fit="cover" style="width:100%;height:200px">
                    <template #error>
                      <div class="img-placeholder"><el-icon :size="40"><Picture /></el-icon></div>
                    </template>
                  </el-image>
                  <span class="product-tag" v-if="product.tag">{{ product.tag }}</span>
                </div>
                <div class="feed-product-info">
                  <h4 class="feed-product-name">{{ product.name }}</h4>
                  <div class="feed-product-meta">
                    <span class="feed-product-price">¥{{ product.price }}</span>
                    <span class="feed-product-shop">{{ product.shopName }}</span>
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getHomeFeed } from '@/api/product'
import { getLiveList } from '@/api/live'

const banners = [
  { title: 'GlobalShop 全球好物', desc: '精选全球优质商品，品质生活从这里开始', bg: 'linear-gradient(135deg, #409eff 0%, #79bbff 100%)' },
  { title: '新品首发 限时优惠', desc: '海量新品低至5折，先到先得', bg: 'linear-gradient(135deg, #f56c6c 0%, #fab6b6 100%)' },
  { title: '直播购物 互动体验', desc: '主播在线讲解，边看边买更放心', bg: 'linear-gradient(135deg, #67c23a 0%, #b3e19d 100%)' },
  { title: 'AI 智能推荐', desc: '千人千面，为你推荐最合适的好物', bg: 'linear-gradient(135deg, #e6a23c 0%, #f3d19e 100%)' }
]

const liveList = ref([])
const feedSections = ref([])
const feedLoading = ref(true)

onMounted(() => {
  loadLiveList()
  loadFeed()
})

async function loadLiveList() {
  try {
    const res = await getLiveList(1)
    liveList.value = res.data || []
  } catch {
    liveList.value = []
  }
}

async function loadFeed() {
  feedLoading.value = true
  try {
    const res = await getHomeFeed()
    if (res.code === 200 && res.data) {
      feedSections.value = res.data.sections || []
    }
  } catch {
    // 失败时显示空，不阻塞页面
    feedSections.value = []
  } finally {
    feedLoading.value = false
  }
}
</script>

<style scoped>
.home-page {
  background: #f5f7fa;
  min-height: 100%;
}
.banner-carousel {
  border-radius: 0;
}
.banner-item {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.banner-content {
  text-align: center;
  color: #fff;
}
.banner-content h2 {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 12px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.banner-content p {
  font-size: 18px;
  opacity: 0.9;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px 60px;
}
.section {
  margin-bottom: 40px;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.section-title {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
}
.section-more {
  color: #409eff;
  text-decoration: none;
  font-size: 14px;
}
.section-more:hover {
  text-decoration: underline;
}

/* 直播横向滚动 */
.live-scroll-wrapper {
  overflow-x: auto;
  padding-bottom: 8px;
}
.live-scroll {
  display: flex;
  gap: 16px;
  min-width: min-content;
}
.live-card {
  width: 220px;
  flex-shrink: 0;
  cursor: pointer;
  transition: transform 0.2s;
}
.live-card:hover {
  transform: translateY(-4px);
}
.live-card :deep(.el-card__body) {
  padding: 0;
}
.live-cover {
  position: relative;
  height: 140px;
  overflow: hidden;
}
.live-cover-img {
  width: 100%;
  height: 100%;
}
.live-cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #409eff33, #79bbff33);
  color: #409eff;
}
.live-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #f56c6c;
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}
.live-info {
  padding: 10px 12px;
}
.live-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.live-viewers {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
}

.product-col {
  margin-bottom: 20px;
}

.section-title-row {
  display: flex;
  align-items: center;
  gap: 16px;
}
.section-subtitle {
  font-size: 14px;
  color: #909399;
  font-weight: 400;
}
.skeleton-title {
  width: 200px;
  height: 28px;
  background: #e8e8e8;
  border-radius: 4px;
}

/* 首页 Feed 商品卡片 */
.feed-product-card {
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.feed-product-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
.feed-product-img {
  position: relative;
  height: 200px;
  overflow: hidden;
  background: #f5f7fa;
}
.img-placeholder {
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #dcdfe6;
}
.product-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #f56c6c;
  color: #fff;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
}
.feed-product-info {
  padding: 12px 14px;
}
.feed-product-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.feed-product-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.feed-product-price {
  font-size: 18px;
  font-weight: 700;
  color: #f56c6c;
}
.feed-product-shop {
  font-size: 12px;
  color: #909399;
}
</style>
