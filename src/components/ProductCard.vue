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
        <span class="product-price">¥{{ product.price }}</span>
        <span class="product-shop" v-if="product.shopName">{{ product.shopName }}</span>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  product: { type: Object, required: true }
})

const router = useRouter()

function goDetail() {
  router.push(`/product/${props.product.id}`)
}
</script>

<style scoped>
.product-card {
  cursor: pointer;
  transition: transform 0.2s;
  overflow: hidden;
}
.product-card:hover {
  transform: translateY(-4px);
}
.product-card :deep(.el-card__body) {
  padding: 0;
}
.product-image {
  height: 200px;
  overflow: hidden;
}
.product-image .el-image {
  width: 100%;
  height: 100%;
}
.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #f5f5f5;
  color: #ccc;
}
.product-info {
  padding: 12px;
}
.product-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.product-desc {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.product-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.product-price {
  color: #f56c6c;
  font-size: 18px;
  font-weight: 700;
}
.product-shop {
  font-size: 12px;
  color: #999;
}
</style>
