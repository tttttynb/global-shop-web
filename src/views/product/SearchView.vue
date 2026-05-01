<template>
  <div class="search-page">
    <div class="page-container">
      <h2 class="page-title">搜索 "{{ keyword }}" 的结果</h2>

      <div v-loading="loading" class="search-grid">
        <template v-if="!loading && productList.length > 0">
          <el-row :gutter="20">
            <el-col :span="6" v-for="product in productList" :key="product.id" class="product-col">
              <ProductCard :product="product" />
            </el-col>
          </el-row>
        </template>
        <el-empty v-if="!loading && productList.length === 0" description="未找到相关商品" />
      </div>

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
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { searchProducts } from '@/api/product'
import ProductCard from '@/components/ProductCard.vue'

const route = useRoute()

const keyword = ref('')
const productList = ref([])
const loading = ref(false)
const page = ref(0)
const size = ref(12)
const total = ref(0)

onMounted(() => {
  keyword.value = route.query.keyword || ''
  if (keyword.value) {
    doSearch()
  }
})

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
    const res = await searchProducts(keyword.value, page.value, size.value)
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
  } catch {
    productList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handlePageChange(newPage) {
  page.value = newPage - 1
  doSearch()
}
</script>

<style scoped>
.search-page {
  background: #f5f7fa;
  min-height: 100%;
  padding: 30px 0 60px;
}
.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}
.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 24px;
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
</style>
