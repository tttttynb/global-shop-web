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

      <!-- 热门商品 -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">🔥 热门商品</h2>
          <router-link to="/products" class="section-more">查看全部 ›</router-link>
        </div>
        <template v-if="productLoading">
          <el-row :gutter="20">
            <el-col :span="6" v-for="n in 8" :key="n">
              <el-skeleton animated :loading="true">
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
        </template>
        <template v-else>
          <el-row :gutter="20">
            <el-col :span="6" v-for="product in productList" :key="product.id" class="product-col">
              <ProductCard :product="product" />
            </el-col>
          </el-row>
        </template>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getProductList } from '@/api/product'
import { getLiveList } from '@/api/live'
import ProductCard from '@/components/ProductCard.vue'

const banners = [
  { title: 'GlobalShop 全球好物', desc: '精选全球优质商品，品质生活从这里开始', bg: 'linear-gradient(135deg, #409eff 0%, #79bbff 100%)' },
  { title: '新品首发 限时优惠', desc: '海量新品低至5折，先到先得', bg: 'linear-gradient(135deg, #f56c6c 0%, #fab6b6 100%)' },
  { title: '直播购物 互动体验', desc: '主播在线讲解，边看边买更放心', bg: 'linear-gradient(135deg, #67c23a 0%, #b3e19d 100%)' },
  { title: 'AI 智能推荐', desc: '千人千面，为你推荐最合适的好物', bg: 'linear-gradient(135deg, #e6a23c 0%, #f3d19e 100%)' }
]

const liveList = ref([])
const productList = ref([])
const productLoading = ref(true)

onMounted(() => {
  loadLiveList()
  loadProducts()
})

async function loadLiveList() {
  try {
    const res = await getLiveList(1)
    liveList.value = res.data || []
  } catch {
    liveList.value = []
  }
}

async function loadProducts() {
  productLoading.value = true
  try {
    const res = await getProductList()
    productList.value = res.data || []
  } catch {
    productList.value = []
  } finally {
    productLoading.value = false
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
</style>
