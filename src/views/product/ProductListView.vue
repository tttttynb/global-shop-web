<template>
  <div class="product-list-page">
    <div class="page-container">
      <h2 class="page-title">全部商品</h2>

      <!-- 筛选栏卡片化：类目 + 排序 tab + 价格区间（淘宝/京东式） -->
      <div class="filter-bar">
        <div class="filter-row">
          <el-radio-group v-model="selectedCategory" @change="loadProducts">
            <el-radio-button :value="null">全部</el-radio-button>
            <el-radio-button v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</el-radio-button>
          </el-radio-group>
        </div>
        <div class="filter-row filter-sort-row">
          <div class="sort-tabs">
            <button
              v-for="t in sortTabs"
              :key="t.key"
              class="sort-tab"
              :class="{ active: sort === t.key || (t.key === 'price' && sort.startsWith('price')) }"
              @click="handleSortTab(t.key)"
            >
              {{ t.label }}
              <span v-if="t.key === 'price'" class="price-arrow">{{ sort === 'price_asc' ? '↑' : (sort === 'price_desc' ? '↓' : '⇅') }}</span>
            </button>
          </div>
          <div class="price-filter">
            <el-input-number v-model="minPrice" :min="0" :max="999999" :controls="false" placeholder="最低价" class="price-input" />
            <span class="price-sep">—</span>
            <el-input-number v-model="maxPrice" :min="0" :max="999999" :controls="false" placeholder="最高价" class="price-input" />
            <el-button size="small" type="primary" plain @click="applyPriceFilter">确定</el-button>
            <el-button v-if="minPrice !== null || maxPrice !== null" size="small" text @click="clearPriceFilter">清空</el-button>
          </div>
        </div>
      </div>

      <div v-loading="loading" class="product-grid">
        <template v-if="!loading && productList.length > 0">
          <el-row :gutter="20">
            <el-col :span="6" v-for="product in productList" :key="product.id" class="product-col">
              <ProductCard :product="product" />
            </el-col>
          </el-row>
        </template>
        <el-empty v-if="!loading && productList.length === 0" description="暂无商品" />
      </div>

      <div class="pagination-wrap" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="loadProducts"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getProductListPaged, getCategoryList } from '@/api/product'
import ProductCard from '@/components/ProductCard.vue'

const route = useRoute()
const productList = ref([])
const loading = ref(true)
const categories = ref([])
const selectedCategory = ref(null)
const sort = ref('latest')
const minPrice = ref(null)
const maxPrice = ref(null)
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)

// 排序 tab（淘宝式：综合/销量/价格可切换升降序）
const sortTabs = [
  { key: 'latest', label: '综合' },
  { key: 'sales', label: '销量' },
  { key: 'price', label: '价格' }
]

function handleSortTab(key) {
  if (key === 'price') {
    // 价格 tab：在升/降序之间切换
    sort.value = sort.value === 'price_asc' ? 'price_desc' : 'price_asc'
  } else {
    sort.value = key
  }
  loadProducts()
}

function applyPriceFilter() {
  currentPage.value = 1
  loadProducts()
}

function clearPriceFilter() {
  minPrice.value = null
  maxPrice.value = null
  currentPage.value = 1
  loadProducts()
}

// 支持外部入口（如首页类目贴片）带 categoryId 直达已筛选的列表
const queryCategoryId = Number(route.query.categoryId)
if (queryCategoryId) selectedCategory.value = queryCategoryId

async function loadCategories() {
  try {
    const res = await getCategoryList()
    categories.value = res.data || []
  } catch {}
}

async function loadProducts() {
  loading.value = true
  try {
    const res = await getProductListPaged({
      categoryId: selectedCategory.value,
      sort: sort.value,
      page: currentPage.value,
      size: pageSize.value,
      minPrice: minPrice.value,
      maxPrice: maxPrice.value
    })
    const data = res.data || {}
    productList.value = data.list || []
    total.value = data.total || 0
  } catch {
    productList.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCategories()
  loadProducts()
})
</script>

<style scoped>
.product-list-page { background: var(--gs-bg-page); min-height: 100%; padding: 24px 0 60px; }
.page-container { max-width: var(--gs-container); margin: 0 auto; padding: 0 20px; }
.page-title { font-size: 22px; font-weight: 700; color: var(--gs-text-1); margin-bottom: 16px; }
/* 筛选栏卡片化：白底 + 圆角 + 轻阴影 */
.filter-bar {
  margin-bottom: 20px;
  background: var(--gs-bg-card);
  border-radius: var(--gs-radius-lg);
  padding: 14px 18px;
  box-shadow: var(--gs-shadow-1);
}
.filter-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.filter-row + .filter-row {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--gs-divider);
}
.filter-sort-row {
  justify-content: space-between;
}
/* 排序 tab（淘宝式） */
.sort-tabs {
  display: flex;
  gap: 4px;
}
.sort-tab {
  border: none;
  background: transparent;
  font-size: 14px;
  color: var(--gs-text-2);
  padding: 6px 14px;
  border-radius: var(--gs-radius-sm);
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 2px;
}
.sort-tab:hover {
  color: var(--gs-primary);
  background: var(--gs-bg-hover);
}
.sort-tab.active {
  color: var(--gs-primary);
  font-weight: 600;
  background: color-mix(in srgb, var(--gs-primary) 9%, #fff);
}
.price-arrow {
  font-size: 12px;
}
/* 价格区间 */
.price-filter {
  display: flex;
  align-items: center;
  gap: 8px;
}
.price-input {
  width: 100px;
}
.price-input :deep(.el-input__inner) {
  text-align: left;
}
.price-sep {
  color: var(--gs-text-3);
}
.product-grid { min-height: 300px; }
.product-col { margin-bottom: 20px; }
.pagination-wrap { text-align: center; margin-top: 28px; }
</style>
