<template>
  <div class="page-container favorites-page">
    <h2 class="page-title">我的收藏</h2>
    <div v-loading="loading" class="product-grid">
      <template v-if="!loading && list.length > 0">
        <el-row :gutter="20">
          <el-col :span="6" v-for="product in list" :key="product.id" class="product-col">
            <ProductCard :product="product" />
          </el-col>
        </el-row>
      </template>
      <el-empty v-if="!loading && list.length === 0" description="暂无收藏" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getFavorites } from '@/api/product'
import ProductCard from '@/components/ProductCard.vue'

const list = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await getFavorites()
    list.value = res.data || []
  } catch {} finally { loading.value = false }
})
</script>

<style scoped>
.favorites-page { max-width: 1200px; margin: 0 auto; padding: 24px 16px; }
.page-title { font-size: 24px; font-weight: 700; margin-bottom: 24px; color: var(--gs-text-1); }
.product-grid { min-height: 300px; }
.product-col { margin-bottom: 20px; }
</style>
