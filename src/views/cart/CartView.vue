<template>
  <div class="page-container cart-page">
    <h2 class="page-title">{{ $t('cart.title') }}</h2>

    <div v-if="loading" class="loading-wrap">
      <el-skeleton :rows="5" animated />
    </div>

    <template v-else-if="cartList.length > 0">
      <el-card v-for="shop in cartList" :key="shop.shopId" class="shop-card" shadow="hover">
        <template #header>
          <div class="shop-header">
            <el-icon><Shop /></el-icon>
            <span class="shop-name">{{ shop.shopName }}</span>
          </div>
        </template>
        <div v-for="item in shop.items" :key="item.cartItemId" class="cart-item">
          <el-image :src="item.coverImage" fit="cover" class="item-image">
            <template #error>
              <div class="image-placeholder">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
          <div class="item-info">
            <router-link :to="`/product/${item.productId}`" class="item-name">{{ item.productName }}</router-link>
            <div v-if="item.skuSpec && item.skuSpec !== '默认规格'" class="item-spec">{{ $t('cart.spec') }}{{ item.skuSpec }}</div>
            <div class="item-price">{{ localeStore.formatPrice(item.price) }}</div>
          </div>
          <div class="item-quantity">
            <el-input-number v-model="item.quantity" :min="1" :max="99" size="small" @change="(val) => handleUpdateQty(item.cartItemId, val)" />
          </div>
          <div class="item-subtotal">{{ localeStore.formatPrice(item.itemTotalAmount) }}</div>
          <el-button type="danger" text :icon="Delete" @click="handleRemove(item.cartItemId)" :loading="removingId === item.cartItemId">
            {{ $t('cart.delete') }}
          </el-button>
        </div>
      </el-card>

      <div class="checkout-bar">
        <!-- 🆕 运费/税费提示（Phase 3 - F6：结算时自动计入） -->
        <div class="bar-tax-hint">{{ $t('cart.taxHint') }}</div>
        <!-- 🆕 积分抵扣（Phase 4 - F8） -->
        <div class="points-deduct" v-if="pointsSummary.points > 0">
          <el-checkbox v-model="usePoints" @change="handleUsePointsChange">
            {{ $t('cart.usePoints', { points: pointsSummary.points }) }}
          </el-checkbox>
          <span v-if="usePoints && deduction" class="deduct-hint">
            {{ $t('cart.pointsDeductEst', { points: deduction.pointsUsed, amount: localeStore.formatPrice(deduction.deductAmount) }) }}
          </span>
        </div>
        <div class="total-info">
          {{ $t('cart.totalLabel') }}<span class="total-price">{{ localeStore.formatPrice(totalAmount) }}</span>
        </div>
        <el-button type="danger" size="large" @click="handleCheckout" :loading="checkingOut">
          {{ $t('cart.checkout') }}
        </el-button>
      </div>
    </template>

    <el-empty v-else :description="$t('cart.empty')">
      <el-button type="primary" @click="$router.push('/products')">{{ $t('cart.goShopping') }}</el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Delete, Shop, Picture } from '@element-plus/icons-vue'
import { getCartList, removeCartItem, updateCartItem } from '@/api/cart'
import { checkoutCart } from '@/api/order'
import { getPointsSummary, previewDeduction } from '@/api/points'
import { useCartStore } from '@/stores/cart'
import { useLocaleStore } from '@/stores/locale'

const router = useRouter()
const { t } = useI18n()
const cartStore = useCartStore()
const localeStore = useLocaleStore()

const loading = ref(false)
const cartList = ref([])
const removingId = ref(null)
const checkingOut = ref(false)

// 🆕 积分抵扣（Phase 4 - F8）
const usePoints = ref(false)
const pointsSummary = ref({ points: 0 })
const deduction = ref(null)

const totalAmount = computed(() => {
  let sum = 0
  cartList.value.forEach(shop => {
    shop.items.forEach(item => {
      sum += item.itemTotalAmount
    })
  })
  return sum
})

const totalItemCount = computed(() => {
  let count = 0
  cartList.value.forEach(shop => {
    shop.items.forEach(item => {
      count += item.quantity
    })
  })
  return count
})

async function fetchCart() {
  loading.value = true
  try {
    const res = await getCartList()
    cartList.value = res.data || []
    cartStore.setCount(totalItemCount.value)
  } catch (e) {
    ElMessage.error(t('messages.fetchCartFailed'))
  } finally {
    loading.value = false
  }
}

async function handleRemove(cartItemId) {
  removingId.value = cartItemId
  try {
    await removeCartItem(cartItemId)
    ElMessage.success(t('messages.removed'))
    await fetchCart()
  } catch (e) {
    ElMessage.error(t('messages.removeFailed'))
  } finally {
    removingId.value = null
  }
}

async function handleUpdateQty(cartItemId, quantity) {
  try {
    await updateCartItem(cartItemId, quantity)
    await fetchCart()
  } catch (e) {
    ElMessage.error(t('messages.qtyUpdateFailed'))
  }
}

async function handleCheckout() {
  checkingOut.value = true
  try {
    const res = await checkoutCart(usePoints.value)
    const orderId = res.data
    ElMessage.success(t('messages.orderSuccess'))
    cartStore.setCount(0)
    router.push(`/order/pay/${orderId}`)
  } catch (e) {
    ElMessage.error(e.message || t('messages.checkoutFailed'))
  } finally {
    checkingOut.value = false
  }
}

// ==================== 积分抵扣（Phase 4 - F8） ====================

async function loadPointsSummary() {
  try {
    const res = await getPointsSummary()
    if (res.code === 200 && res.data) {
      pointsSummary.value = res.data
    }
  } catch {
    // 静默失败 — 无积分账户时不展示抵扣入口
  }
}

async function handleUsePointsChange(val) {
  if (!val) {
    deduction.value = null
    return
  }
  await refreshDeductionPreview()
}

async function refreshDeductionPreview() {
  if (!usePoints.value || totalAmount.value <= 0) return
  try {
    const res = await previewDeduction(totalAmount.value)
    deduction.value = res.code === 200 ? res.data : null
  } catch {
    deduction.value = null
  }
}

// 购物车金额变化时同步刷新抵扣试算
watch(totalAmount, () => refreshDeductionPreview())

onMounted(() => {
  fetchCart()
  loadPointsSummary()
})
</script>

<style scoped>
.cart-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 16px 100px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 24px;
  color: #1a1a2e;
}

.shop-card {
  margin-bottom: 16px;
  border-radius: 12px;
}

.shop-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.cart-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.cart-item:last-child {
  border-bottom: none;
}

.item-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  flex-shrink: 0;
  overflow: hidden;
}

.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #c0c4cc;
  font-size: 24px;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  text-decoration: none;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-name:hover {
  color: #409eff;
}

.item-spec {
  display: inline-block;
  font-size: 12px;
  color: #909399;
  background: #f5f7fa;
  border-radius: 4px;
  padding: 2px 8px;
  margin-bottom: 6px;
}

.item-price {
  font-size: 13px;
  color: #909399;
}

.item-quantity {
  font-size: 14px;
  color: #606266;
  min-width: 40px;
  text-align: center;
}

.item-subtotal {
  font-size: 16px;
  font-weight: 600;
  color: #e6323e;
  min-width: 90px;
  text-align: right;
}

.checkout-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
  padding: 16px 32px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 24px;
  z-index: 100;
}

.total-info {
  font-size: 15px;
  color: #606266;
}

/* 🆕 结算栏运费/税费提示（Phase 3 - F6） */
.bar-tax-hint {
  margin-right: auto;
  font-size: 12px;
  color: #909399;
}

/* 🆕 积分抵扣（Phase 4 - F8） */
.points-deduct {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.deduct-hint {
  color: #e6323e;
  font-weight: 600;
}

.total-price {
  font-size: 22px;
  font-weight: 700;
  color: #e6323e;
}

.loading-wrap {
  padding: 24px 0;
}
</style>
