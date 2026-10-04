<template>
  <el-card shadow="hover" class="product-card" @click="goDetail">
    <div class="product-image">
      <el-image :src="product.coverImage" fit="cover" lazy>
        <template #error>
          <div class="image-placeholder">
            <el-icon :size="40"><Picture /></el-icon>
          </div>
        </template>
      </el-image>
    </div>
    <div class="product-info">
      <h3 class="product-name">{{ product.name }}</h3>
      <p class="product-desc" v-if="product.description">{{ product.description }}</p>
      <div class="product-bottom">
        <!-- 金额随展示币种换算（Phase 3 - F5 参考价） -->
        <span class="product-price">{{ localeStore.formatPrice(product.price) }}</span>
        <!-- 1688 式社会证明：已售件数 -->
        <span class="product-sales" v-if="product.salesCount > 0">已售 {{ formatSales(product.salesCount) }}</span>
        <span class="product-shop" v-else-if="product.shopName">{{ product.shopName }}</span>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useLocaleStore } from '@/stores/locale'

const props = defineProps({
  product: { type: Object, required: true }
})

const router = useRouter()
const localeStore = useLocaleStore()

function goDetail() {
  router.push(`/product/${props.product.id}`)
}

/** 销量格式化：1000+ / 1万+（1688 式） */
function formatSales(n) {
  if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万+'
  if (n >= 1000) return Math.floor(n / 1000) + '000+'
  return n
}
</script>

<style scoped>
.product-card {
  cursor: pointer;
  border-radius: var(--gs-radius-lg);
  border: 1px solid transparent;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  overflow: hidden;
  --el-card-border-radius: var(--gs-radius-lg);
}
.product-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--gs-shadow-2);
  border-color: color-mix(in srgb, var(--gs-primary) 25%, #fff);
}
.product-card :deep(.el-card__body) {
  padding: 0;
}
.product-image {
  height: 200px;
  overflow: hidden;
  background: var(--gs-bg-hover);
}
.product-image .el-image {
  width: 100%;
  height: 100%;
  transition: transform 0.35s ease;
}
.product-card:hover .product-image .el-image {
  transform: scale(1.05);
}
.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--gs-bg-hover);
  color: #c9cdd4;
}
.product-info {
  padding: 12px 14px 14px;
}
.product-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--gs-text-1);
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.product-desc {
  font-size: 12px;
  color: var(--gs-text-3);
  margin-bottom: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.product-bottom {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.product-price {
  color: var(--gs-price);
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.3px;
}
.product-shop {
  font-size: 12px;
  color: var(--gs-text-3);
  max-width: 45%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.product-sales {
  font-size: 12px;
  color: var(--gs-text-3);
}
</style>
