<template>
  <div class="search-page">
    <div class="page-container">
      <!-- 搜索标题行 -->
      <div class="search-header">
        <h2 class="page-title">搜索 "{{ keyword }}" 的结果</h2>
        <span class="result-count" v-if="!loading && total > 0">共 {{ total }} 件相关商品</span>
        <el-tag v-if="userTier" :type="tierTagType" size="large" class="tier-badge">
          {{ tierLabel }}
        </el-tag>
      </div>

      <!-- 类目聚合（淘宝式结果页聚合，点击进类目筛选列表） -->
      <div class="cat-chips" v-if="categoryChips.length > 1">
        <span class="chip-label">相关类目：</span>
        <span
          v-for="c in categoryChips"
          :key="c.id"
          class="cat-chip"
          @click="router.push({ path: '/products', query: { categoryId: c.id } })"
        >{{ c.name }}<i>{{ c.count }}</i></span>
      </div>

      <!-- 搜索模式切换 -->
      <div class="search-mode-bar" v-if="keyword">
        <el-radio-group v-model="searchMode" @change="onModeChange" size="small">
          <el-radio-button value="fulltext">全文搜索</el-radio-button>
          <el-radio-button value="semantic">AI 语义搜索</el-radio-button>
        </el-radio-group>
        <span class="mode-hint" v-if="searchMode === 'semantic'">
          基于 AI 理解你的搜索意图，结果已根据你的偏好个性化排序
        </span>
        <span class="mode-hint" v-else>
          结果已根据你的消费偏好个性化排序
        </span>
      </div>

      <!-- 商品列表 -->
      <div v-loading="loading" class="search-grid">
        <template v-if="!loading && productList.length > 0">
          <el-row :gutter="20">
            <el-col :span="6" v-for="product in productList" :key="product.id" class="product-col">
              <ProductCard :product="product" />
            </el-col>
          </el-row>
        </template>
        <el-empty v-if="!loading && productList.length === 0" description="未找到相关商品，试试换个关键词吧">
          <div class="empty-actions">
            <el-button type="primary" @click="$router.push({ path: '/ai/search', query: { keyword } })">用 AI 语义搜索再试</el-button>
            <el-button @click="$router.push('/products')">浏览全部商品</el-button>
          </div>
        </el-empty>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="total > size">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="total"
          :page-size="size"
          :current-page="page + 1"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { searchProducts, getCategoryList } from '@/api/product'
import { semanticSearch } from '@/api/ai'
import ProductCard from '@/components/ProductCard.vue'

const route = useRoute()
const router = useRouter()

const keyword = ref('')
const productList = ref([])
const loading = ref(false)
const page = ref(0)
const size = ref(12)
const total = ref(0)
const searchMode = ref('fulltext')
const userTier = ref('')

/** 用户层级标签映射 */
const tierLabelMap = { PREMIUM: '🏆 高端优选', MID: '🥈 品质甄选', BUDGET: '🥉 实惠推荐', NEW: '👤 新客探索' }
const tierTagTypeMap = { PREMIUM: 'danger', MID: 'warning', BUDGET: 'success', NEW: 'info' }

const tierLabel = ref('')
const tierTagType = ref('info')
const categories = ref([])

/** 类目聚合 chips：从当前搜索结果统计，点击跳转类目筛选列表（淘宝式结果页聚合） */
const categoryChips = computed(() => {
  if (!productList.value.length || !categories.value.length) return []
  const counts = new Map()
  productList.value.forEach(p => {
    if (p.categoryId) counts.set(p.categoryId, (counts.get(p.categoryId) || 0) + 1)
  })
  return [...counts.entries()]
    .map(([id, count]) => {
      const cat = categories.value.find(c => c.id === id)
      return cat ? { id, name: cat.name, count } : null
    })
    .filter(Boolean)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
})

onMounted(() => {
  keyword.value = route.query.keyword || ''
  loadCategories()
  if (keyword.value) {
    doSearch()
  }
})

async function loadCategories() {
  try {
    const res = await getCategoryList()
    categories.value = res.data || []
  } catch {}
}

watch(() => route.query.keyword, (newVal) => {
  keyword.value = newVal || ''
  page.value = 0
  if (keyword.value) {
    doSearch()
  } else {
    productList.value = []
    total.value = 0
  }
})

async function doSearch() {
  loading.value = true
  try {
    let res
    if (searchMode.value === 'semantic') {
      // AI 语义搜索（后端已做个性化重排）
      res = await semanticSearch(keyword.value)
      if (res.data && Array.isArray(res.data)) {
        productList.value = res.data
        total.value = res.data.length
      }
    } else {
      // 全文搜索（后端已做个性化重排）
      res = await searchProducts(keyword.value, page.value, size.value)
      const data = res.data
      if (Array.isArray(data)) {
        productList.value = data
        total.value = data.length
      } else if (data && data.content) {
        productList.value = data.content
        total.value = data.totalElements || 0
      } else {
        productList.value = data || []
        total.value = (data || []).length
      }
    }

    // 尝试从第一个商品推断个性化层级（后端已做重排，前端只做展示）
    tryDetectTier()
  } catch {
    productList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

/** 尝试读取用户画像层级（用于展示个性化标签） */
async function tryDetectTier() {
  try {
    const token = localStorage.getItem('token')
    if (!token) return
    const res = await fetch('/api/user/profile/my', {
      headers: { 'Authorization': token }
    })
    const json = await res.json()
    if (json.code === 200 && json.data) {
      const tier = json.data.userTier || 'NEW'
      userTier.value = tier
      tierLabel.value = tierLabelMap[tier] || ''
      tierTagType.value = tierTagTypeMap[tier] || 'info'
    }
  } catch {
    // 静默失败，不影响搜索体验
  }
}

function onModeChange() {
  page.value = 0
  doSearch()
}

function handlePageChange(newPage) {
  page.value = newPage - 1
  doSearch()
}
</script>

<style scoped>
.search-page {
  background: var(--gs-bg-hover);
  min-height: 100%;
  padding: 30px 0 60px;
}
.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}
.search-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}
.page-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--gs-text-1);
  margin: 0;
}
.tier-badge {
  font-size: 14px;
}
.search-mode-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}
.mode-hint {
  font-size: 13px;
  color: var(--gs-text-3);
}
.search-grid {
  min-height: 300px;
}
.product-col {
  margin-bottom: 20px;
}
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

/* 结果数 + 类目聚合 chips */
.result-count {
  font-size: 13px;
  color: var(--gs-text-3);
}
.cat-chips {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
.chip-label {
  font-size: 13px;
  color: var(--gs-text-3);
}
.cat-chip {
  font-size: 13px;
  color: var(--gs-text-2);
  background: var(--gs-bg-card);
  border: 1px solid var(--gs-border);
  border-radius: 999px;
  padding: 5px 14px;
  cursor: pointer;
  transition: all 0.15s;
}
.cat-chip i {
  font-style: normal;
  color: var(--gs-text-3);
  margin-left: 4px;
  font-size: 12px;
}
.cat-chip:hover {
  color: var(--gs-primary);
  border-color: var(--gs-primary);
  background: color-mix(in srgb, var(--gs-primary) 6%, #fff);
}
</style>
