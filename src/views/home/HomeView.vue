<template>
  <div class="home-page">
    <!-- Banner 区：主轮播 + 右侧功能入口（打破单条横幅的单调感） -->
    <div class="banner-row">
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

      <div class="banner-side">
        <router-link to="/ai/search?mode=image" class="side-entry side-ai">
          <el-icon :size="30"><MagicStick /></el-icon>
          <div class="side-text">
            <h4>AI 以图搜图</h4>
            <p>看到街拍 · 找同款</p>
          </div>
        </router-link>
        <router-link to="/live" class="side-entry side-live">
          <el-icon :size="30"><VideoCamera /></el-icon>
          <div class="side-text">
            <h4>跨境直播</h4>
            <p>边看边买 · 实时翻译</p>
          </div>
        </router-link>
      </div>
    </div>

    <div class="home-container">
      <!-- 类目快捷入口（点击进入对应关键词搜索，形成逛的闭环） -->
      <div class="cat-row" v-if="categories.length">
        <div
          class="cat-item"
          v-for="(c, i) in categories.slice(0, 8)"
          :key="c.id"
          @click="$router.push({ path: '/products', query: { categoryId: c.id } })"
        >
          <span class="cat-icon" :style="catStyle(i)">{{ c.icon || c.name.charAt(0) }}</span>
          <span class="cat-name">{{ c.name }}</span>
        </div>
      </div>

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
        <section
          class="section"
          v-for="(section, si) in feedSections"
          :key="section.key"
          :style="{ '--sec-accent': sectionAccents[(si + 1) % sectionAccents.length] }"
        >
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
import { getHomeFeed, getCategoryList } from '@/api/product'
import { getLiveList } from '@/api/live'

const banners = [
  { title: 'GlobalShop 全球好物', desc: '精选全球优质商品，品质生活从这里开始', bg: 'linear-gradient(135deg, #165dff 0%, #69a0ff 100%)' },
  { title: '新品首发 限时优惠', desc: '海量新品低至5折，先到先得', bg: 'linear-gradient(135deg, #ee0a24 0%, #ff7a6e 100%)' },
  { title: '直播购物 互动体验', desc: '主播在线讲解，边看边买更放心', bg: 'linear-gradient(135deg, #00b578 0%, #7be0b4 100%)' },
  { title: 'AI 智能推荐', desc: '千人千面，为你推荐最合适的好物', bg: 'linear-gradient(135deg, #ff8f1f 0%, #ffc46e 100%)' }
]

const liveList = ref([])
const feedSections = ref([])
const feedLoading = ref(true)
const categories = ref([])

// 分区跳色：让各楼层标题条/链接色轮换，打破全蓝的单调节奏
const sectionAccents = ['#165dff', '#ee0a24', '#ff8f1f', '#00b578']
function catStyle(i) {
  const c = sectionAccents[i % sectionAccents.length]
  return { background: `color-mix(in srgb, ${c} 12%, #fff)`, color: c }
}

onMounted(() => {
  loadLiveList()
  loadFeed()
  loadCategories()
})

async function loadCategories() {
  try {
    const res = await getCategoryList()
    categories.value = res.data || []
  } catch {
    categories.value = []
  }
}

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
  background: var(--gs-bg-page);
  min-height: 100%;
}
/* Banner 行：主轮播 + 右侧功能入口 */
.banner-row {
  max-width: var(--gs-container);
  margin: 0 auto;
  padding: 0 0;
  display: flex;
  gap: 16px;
}
.banner-carousel {
  flex: 1;
  min-width: 0;
  border-radius: var(--gs-radius-lg);
  overflow: hidden;
  box-shadow: var(--gs-shadow-1);
}
.banner-side {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.side-entry {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 22px;
  border-radius: var(--gs-radius-lg);
  color: #fff;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  overflow: hidden;
}
.side-entry:hover {
  transform: translateY(-3px);
  box-shadow: var(--gs-shadow-2);
}
.side-text h4 {
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 4px;
}
.side-text p {
  font-size: 12px;
  opacity: 0.85;
}
.side-ai {
  background: linear-gradient(135deg, #165dff 0%, #6f3bff 100%);
}
.side-live {
  background: linear-gradient(135deg, #ee0a24 0%, #ff7a45 100%);
}

/* 类目快捷入口 */
.cat-row {
  display: flex;
  gap: 8px;
  justify-content: space-between;
  margin-bottom: 36px;
  background: var(--gs-bg-card);
  border-radius: var(--gs-radius-lg);
  padding: 18px 22px;
  box-shadow: var(--gs-shadow-1);
}
.cat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex: 1;
  min-width: 0;
}
.cat-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  transition: transform 0.2s ease;
}
.cat-item:hover .cat-icon {
  transform: translateY(-3px) scale(1.05);
}
.cat-name {
  font-size: 13px;
  color: var(--gs-text-2);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  font-weight: 800;
  margin-bottom: 12px;
  letter-spacing: 1px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.banner-content p {
  font-size: 18px;
  opacity: 0.92;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}
.home-container {
  max-width: var(--gs-container);
  margin: 0 auto;
  padding: 32px 20px 64px;
}
.section {
  margin-bottom: 44px;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.section-title {
  display: flex;
  align-items: center;
  font-size: 20px;
  font-weight: 700;
  color: var(--gs-text-1);
}
/* 标题竖条：随分区跳色（默认主色） */
.section-title::before {
  content: '';
  width: 4px;
  height: 18px;
  border-radius: 2px;
  background: var(--sec-accent, var(--gs-primary));
  margin-right: 10px;
}
.section-more {
  color: var(--gs-text-3);
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s;
}
.section-more:hover {
  color: var(--gs-primary);
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
  border-radius: var(--gs-radius-lg);
  --el-card-border-radius: var(--gs-radius-lg);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.live-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--gs-shadow-2);
}
.live-card :deep(.el-card__body) {
  padding: 0;
}
.live-cover {
  position: relative;
  height: 140px;
  overflow: hidden;
  background: var(--gs-bg-hover);
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
  background: color-mix(in srgb, var(--gs-primary) 8%, #fff);
  color: var(--gs-primary);
}
.live-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: var(--gs-price);
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
  font-weight: 600;
  color: var(--gs-text-1);
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.live-viewers {
  font-size: 12px;
  color: var(--gs-text-3);
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
  color: var(--gs-text-3);
  font-weight: 400;
}
.skeleton-title {
  width: 200px;
  height: 28px;
  background: var(--gs-bg-hover);
  border-radius: 4px;
}

/* 首页 Feed 商品卡片（与 ProductCard 同一套观感规范） */
.feed-product-card {
  background: var(--gs-bg-card);
  border: 1px solid transparent;
  border-radius: var(--gs-radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  box-shadow: var(--gs-shadow-1);
}
.feed-product-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--gs-shadow-2);
  border-color: color-mix(in srgb, var(--gs-primary) 25%, #fff);
}
.feed-product-img {
  position: relative;
  height: 200px;
  overflow: hidden;
  background: var(--gs-bg-hover);
}
.feed-product-img .el-image {
  transition: transform 0.35s ease;
}
.feed-product-card:hover .feed-product-img .el-image {
  transform: scale(1.05);
}
.img-placeholder {
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gs-bg-hover);
  color: #c9cdd4;
}
.product-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  background: var(--gs-price);
  color: #fff;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
}
.feed-product-info {
  padding: 12px 14px 14px;
}
.feed-product-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--gs-text-1);
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.feed-product-meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.feed-product-price {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.3px;
  color: var(--gs-price);
}
.feed-product-shop {
  font-size: 12px;
  color: var(--gs-text-3);
}
</style>
