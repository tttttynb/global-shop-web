<template>
  <div class="product-detail-page">
    <div class="page-container" v-loading="loading">
      <template v-if="product">
        <div class="detail-main">
          <!-- 左侧图片 -->
          <div class="detail-image">
            <el-image :src="product.coverImage" fit="contain" class="main-image">
              <template #error>
                <div class="image-placeholder">
                  <el-icon :size="64"><Picture /></el-icon>
                </div>
              </template>
            </el-image>
          </div>

          <!-- 右侧信息 -->
          <div class="detail-info">
            <h1 class="product-name">{{ product.name }}</h1>
            <p class="product-price">¥{{ product.price }}</p>
            <div class="info-row">
              <span class="info-label">库存</span>
              <span>{{ product.stock }} 件</span>
            </div>
            <div class="info-row" v-if="product.shopName">
              <span class="info-label">店铺</span>
              <span>{{ product.shopName }}</span>
            </div>
            <div class="product-desc" v-if="product.description">
              <span class="info-label">描述</span>
              <p>{{ product.description }}</p>
            </div>

            <el-divider />

            <div class="quantity-row">
              <span class="info-label">数量</span>
              <el-input-number v-model="quantity" :min="1" :max="product.stock || 99" size="large" />
            </div>

            <div class="action-buttons">
              <el-button type="primary" plain size="large" @click="handleFavorite" :loading="favLoading">
                ❤ 收藏
              </el-button>
              <el-button type="warning" size="large" @click="handleAddCart" :loading="cartLoading">
                <el-icon><ShoppingCart /></el-icon> 加入购物车
              </el-button>
              <el-button type="danger" size="large" @click="handleBuyNow" :loading="buyLoading">
                立即购买
              </el-button>
            </div>
          </div>
        </div>

        <!-- 商品评价 -->
        <div class="review-section">
          <h2 class="section-title">商品评价</h2>
          <div v-if="reviews.length > 0" class="review-list">
            <div v-for="(review, index) in reviews" :key="index" class="review-item">
              <div class="review-header">
                <span class="review-user">{{ review.username }}</span>
                <el-rate v-model="review.rating" disabled :colors="['#f56c6c', '#f56c6c', '#f56c6c']" />
                <span class="review-time">{{ review.createTime }}</span>
              </div>
              <p class="review-content">{{ review.content }}</p>
            </div>
          </div>
          <el-empty v-else description="暂无评价" />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getProductDetail, getProductReviews, toggleFavorite } from '@/api/product'
import { addToCart } from '@/api/cart'
import { createOrder } from '@/api/order'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

const product = ref(null)
const reviews = ref([])
const quantity = ref(1)
const loading = ref(true)
const cartLoading = ref(false)
const buyLoading = ref(false)
const favLoading = ref(false)

onMounted(() => {
  const id = route.params.id
  loadProduct(id)
  loadReviews(id)
})

async function loadProduct(id) {
  loading.value = true
  try {
    const res = await getProductDetail(id)
    product.value = res.data
  } catch {
    ElMessage.error('获取商品详情失败')
  } finally {
    loading.value = false
  }
}

async function loadReviews(id) {
  try {
    const res = await getProductReviews(id)
    reviews.value = res.data || []
  } catch {
    reviews.value = []
  }
}

function checkLogin() {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return false
  }
  return true
}

async function handleAddCart() {
  if (!checkLogin()) return
  cartLoading.value = true
  try {
    await addToCart({ productId: product.value.id, quantity: quantity.value })
    cartStore.increment()
    ElMessage.success('已加入购物车')
  } catch {
    ElMessage.error('加入购物车失败')
  } finally {
    cartLoading.value = false
  }
}

async function handleBuyNow() {
  if (!checkLogin()) return
  buyLoading.value = true
  try {
    const res = await createOrder({ productId: product.value.id, quantity: quantity.value })
    ElMessage.success('下单成功')
    router.push(`/order/pay/${res.data}`)
  } catch {
    ElMessage.error('下单失败')
  } finally {
    buyLoading.value = false
  }
}

async function handleFavorite() {
  if (!checkLogin()) return
  favLoading.value = true
  try {
    const res = await toggleFavorite(product.value.id)
    ElMessage.success(res.data)
  } catch {
    ElMessage.error('操作失败')
  } finally {
    favLoading.value = false
  }
}
</script>

<style scoped>
.product-detail-page {
  background: #f5f7fa;
  min-height: 100%;
  padding: 30px 0 60px;
}
.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  min-height: 400px;
}
.detail-main {
  display: flex;
  gap: 40px;
  background: #fff;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}
.detail-image {
  width: 450px;
  flex-shrink: 0;
}
.main-image {
  width: 100%;
  height: 450px;
  border-radius: 8px;
  overflow: hidden;
  background: #fafafa;
}
.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  color: #dcdfe6;
}
.detail-info {
  flex: 1;
  min-width: 0;
}
.product-name {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
  line-height: 1.4;
}
.product-price {
  font-size: 32px;
  font-weight: 700;
  color: #f56c6c;
  margin-bottom: 20px;
}
.info-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #606266;
}
.info-label {
  color: #909399;
  min-width: 36px;
}
.product-desc {
  margin-bottom: 12px;
  font-size: 14px;
  color: #606266;
}
.product-desc p {
  margin-top: 4px;
  line-height: 1.6;
}
.quantity-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}
.action-buttons {
  display: flex;
  gap: 16px;
}
.action-buttons .el-button {
  min-width: 140px;
}

/* 评价区域 */
.review-section {
  margin-top: 30px;
  background: #fff;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}
.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
}
.review-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.review-item {
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}
.review-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.review-user {
  font-weight: 500;
  color: #303133;
}
.review-time {
  margin-left: auto;
  font-size: 12px;
  color: #c0c4cc;
}
.review-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}
</style>
