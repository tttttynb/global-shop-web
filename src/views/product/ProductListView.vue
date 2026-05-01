<template>
  <div class="product-list-page">
    <div class="page-container">
      <h2 class="page-title">全部商品</h2>

      <!-- 分类筛选 -->
      <div class="filter-bar">
        <el-radio-group v-model="selectedCategory" @change="loadProducts" size="default">
          <el-radio-button :value="null">全部</el-radio-button>
          <el-radio-button v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</el-radio-button>
        </el-radio-group>
        <el-select v-model="sortBy" @change="loadProducts" placeholder="排序" style="width: 140px; margin-left: 16px">
          <el-option label="最新上架" value="latest" />
          <el-option label="价格从低到高" value="price_asc" />
          <el-option label="价格从高到低" value="price_desc" />
          <el-option label="销量优先" value="sales" />
        </el-select>
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
import { getProductListPaged, getCategoryList } from '@/api/product'
import ProductCard from '@/components/ProductCard.vue'

const productList = ref([])
const loading = ref(true)
const categories = ref([])
const selectedCategory = ref(null)
const sortBy = ref('latest')
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)

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
      sort: sortBy.value,
      page: currentPage.value,
      size: pageSize.value
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
.product-list-page { background: #f5f7fa; min-height: 100%; padding: 30px 0 60px; }
.page-container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
.page-title { font-size: 24px; font-weight: 600; color: #303133; margin-bottom: 16px; }
.filter-bar { display: flex; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 8px; }
.product-grid { min-height: 300px; }
.product-col { margin-bottom: 20px; }
.pagination-wrap { text-align: center; margin-top: 24px; }
</style>
