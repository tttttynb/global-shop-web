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

      <!-- 🚚 收货地址（京东式结算：先选地址再结算） -->
      <div class="addr-bar" v-if="cartList.length">
        <el-icon class="addr-icon"><Location /></el-icon>
        <template v-if="addresses.length">
          <el-select v-model="selectedAddressId" class="addr-select" placeholder="选择收货地址">
            <el-option
              v-for="a in addresses"
              :key="a.id"
              :value="a.id"
              :label="`${a.receiverName} ${a.phone}｜${a.province}${a.city}${a.district}${a.detailAddress}${a.isDefault ? '（默认）' : ''}`"
            />
          </el-select>
          <router-link to="/profile" class="addr-manage">管理地址</router-link>
          <el-button size="small" text type="primary" @click="showAddrDialog = true">+ 新增地址</el-button>
        </template>
        <template v-else>
          <span class="addr-none">还没有收货地址，结算前请先新增一个</span>
          <el-button size="small" type="primary" @click="showAddrDialog = true">+ 新增收货地址</el-button>
        </template>
      </div>

      <!-- 🚚 凑单免运费进度（淘宝/京东式闭环提示，规则：满¥199包邮） -->
      <div class="free-ship-progress" v-if="totalAmount < 199">
        <span class="fsp-text">🚚 再买 <b>{{ localeStore.formatPrice(199 - totalAmount) }}</b> 免国际运费</span>
        <el-progress class="fsp-bar" :percentage="Math.min(100, Math.round((totalAmount / 199) * 100))" :stroke-width="8" :show-text="false" />
        <span class="fsp-threshold">满¥199包邮</span>
      </div>
      <div class="free-ship-progress done" v-else>
        <span class="fsp-text">🎉 已满 ¥199，本单免国际运费</span>
      </div>

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

    <!-- 新增收货地址弹窗 -->
    <el-dialog v-model="showAddrDialog" title="新增收货地址" width="460px" align-center>
      <el-form :model="addrForm" label-width="80px">
        <el-form-item label="收货人"><el-input v-model="addrForm.receiverName" placeholder="姓名" /></el-form-item>
        <el-form-item label="手机号"><el-input v-model="addrForm.phone" placeholder="联系电话" /></el-form-item>
        <el-form-item label="所在地区">
          <div class="addr-region">
            <el-input v-model="addrForm.province" placeholder="省" />
            <el-input v-model="addrForm.city" placeholder="市" />
            <el-input v-model="addrForm.district" placeholder="区/县" />
          </div>
        </el-form-item>
        <el-form-item label="详细地址"><el-input v-model="addrForm.detailAddress" placeholder="街道、门牌号" /></el-form-item>
        <el-form-item label=" "><el-checkbox v-model="addrForm.isDefault">设为默认地址</el-checkbox></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddrDialog = false">取消</el-button>
        <el-button type="primary" :loading="addrSaving" @click="handleAddAddress">保存并使用</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Delete, Shop, Picture, Location } from '@element-plus/icons-vue'
import { getCartList, removeCartItem, updateCartItem } from '@/api/cart'
import { checkoutCart } from '@/api/order'
import { getAddressList, addAddress } from '@/api/user'
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

// 🚚 收货地址（京东式结算：先选地址再结算，快照写入订单）
const addresses = ref([])
const selectedAddressId = ref(null)
const showAddrDialog = ref(false)
const addrSaving = ref(false)
const addrForm = ref({ receiverName: '', phone: '', province: '', city: '', district: '', detailAddress: '', isDefault: false })

async function loadAddresses() {
  try {
    const res = await getAddressList()
    addresses.value = res.data || []
    const def = addresses.value.find(a => a.isDefault) || addresses.value[0]
    if (def) selectedAddressId.value = def.id
  } catch {}
}

async function handleAddAddress() {
  const f = addrForm.value
  if (!f.receiverName || !f.phone || !f.detailAddress) {
    ElMessage.warning('请填写收货人、手机号和详细地址')
    return
  }
  addrSaving.value = true
  try {
    const res = await addAddress(f)
    ElMessage.success('地址已保存')
    showAddrDialog.value = false
    await loadAddresses()
    if (res.data?.id) selectedAddressId.value = res.data.id
    addrForm.value = { receiverName: '', phone: '', province: '', city: '', district: '', detailAddress: '', isDefault: false }
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    addrSaving.value = false
  }
}

async function handleCheckout() {
  // 闭环：结算必须有收货地址，没有就引导新增
  if (!selectedAddressId.value) {
    ElMessage.warning('请先选择或新增收货地址')
    showAddrDialog.value = true
    return
  }
  checkingOut.value = true
  try {
    const res = await checkoutCart(usePoints.value, selectedAddressId.value)
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
  loadAddresses()
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
  color: var(--gs-text-1);
}

.shop-card {
  margin-bottom: 16px;
  border-radius: var(--gs-radius-lg);
}

.shop-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--gs-text-1);
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
  background: var(--gs-bg-hover);
  color: var(--gs-text-3);
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
  color: var(--gs-text-1);
  text-decoration: none;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-name:hover {
  color: var(--gs-primary);
}

.item-spec {
  display: inline-block;
  font-size: 12px;
  color: var(--gs-text-3);
  background: var(--gs-bg-hover);
  border-radius: 4px;
  padding: 2px 8px;
  margin-bottom: 6px;
}

.item-price {
  font-size: 13px;
  color: var(--gs-text-3);
}

.item-quantity {
  font-size: 14px;
  color: var(--gs-text-2);
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

/* 收货地址栏（京东式结算第一步） */
.addr-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--gs-bg-card);
  border: 1px solid color-mix(in srgb, var(--gs-primary) 18%, #fff);
  border-radius: var(--gs-radius);
  padding: 12px 16px;
  margin-bottom: 12px;
}
.addr-icon {
  color: var(--gs-primary);
  font-size: 18px;
}
.addr-select {
  flex: 1;
  min-width: 0;
  max-width: 560px;
}
.addr-select :deep(.el-select__wrapper) {
  border-radius: var(--gs-radius-sm);
}
.addr-manage {
  font-size: 13px;
  color: var(--gs-primary);
  white-space: nowrap;
}
.addr-none {
  font-size: 13px;
  color: var(--gs-text-2);
}
.addr-region {
  display: flex;
  gap: 8px;
  width: 100%;
}

/* 凑单免运费进度 */
.free-ship-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  background: color-mix(in srgb, var(--gs-warning) 8%, #fff);
  border: 1px dashed color-mix(in srgb, var(--gs-warning) 40%, #fff);
  border-radius: var(--gs-radius);
  padding: 10px 16px;
  margin-bottom: 12px;
}
.free-ship-progress.done {
  background: color-mix(in srgb, var(--gs-success) 8%, #fff);
  border-color: color-mix(in srgb, var(--gs-success) 35%, #fff);
}
.fsp-text {
  font-size: 13px;
  color: var(--gs-text-2);
  white-space: nowrap;
}
.fsp-text b { color: var(--gs-price); }
.fsp-bar { flex: 1; }
.fsp-threshold {
  font-size: 12px;
  color: var(--gs-text-3);
  white-space: nowrap;
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
  color: var(--gs-text-2);
}

/* 🆕 结算栏运费/税费提示（Phase 3 - F6） */
.bar-tax-hint {
  margin-right: auto;
  font-size: 12px;
  color: var(--gs-text-3);
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
