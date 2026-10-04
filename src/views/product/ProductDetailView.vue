<template>
  <div class="product-detail-page">
    <div class="page-container" v-loading="loading">
      <template v-if="product">
        <div class="detail-main">
          <!-- 左侧图片 -->
          <div class="detail-image">
            <el-image :src="displayImage" fit="contain" class="main-image">
              <template #error>
                <div class="image-placeholder">
                  <el-icon :size="64"><Picture /></el-icon>
                </div>
              </template>
            </el-image>
          </div>

          <!-- 右侧信息 -->
          <div class="detail-info">
            <h1 class="product-name">
              {{ product.name }}
              <el-tag v-if="localeStore.locale !== 'zh'" size="small" type="success" class="multi-lang-tag">
                🌐 {{ $t('product.multiLang') }}
              </el-tag>
            </h1>
            <!-- 🆕 SKU 化价格：选中规格显示 SKU 价，未选完显示价格区间；金额随展示币种换算（Phase 3 - F5） -->
            <p class="product-price" v-if="selectedSku">{{ localeStore.formatPrice(selectedSku.price) }}</p>
            <p class="product-price" v-else-if="specDims.length">{{ priceRange }}</p>
            <p class="product-price" v-else>{{ localeStore.formatPrice(product.price) }}</p>

            <!-- 🆕 原币参考价（Phase 3 - F5：日元商品 ¥3,980 → 实时人民币参考换算） -->
            <div class="original-price-box" v-if="hasOriginalPrice">
              <span class="op-label">{{ $t('product.originalPrice') }}</span>
              <span class="op-amount">{{ originalPriceText }}</span>
              <span class="op-ref" v-if="originalRate">
                {{ $t('product.rateLine', { currency: product.originalCurrency, rate: originalRate }) }}
              </span>
            </div>

            <!-- 👥 拼团入口（Phase 4 - F7：拼邮费·凑单成团） -->
            <div class="group-buy-card" v-if="groupActivity">
              <div class="gb-main-row">
                <span class="gb-tag">👥 {{ $t('groupbuy.entryTag') }}</span>
                <span class="gb-price">{{ localeStore.formatPrice(groupActivity.groupPrice) }}</span>
                <span class="gb-need">{{ $t('groupbuy.entryNeed', { count: groupActivity.requiredMembers }) }}</span>
                <span class="gb-origin">{{ localeStore.formatPrice(groupActivity.originalPrice) }}</span>
                <el-button type="danger" size="small" class="gb-open-btn" @click="handleOpenGroup" :loading="gbLoading">
                  {{ $t('groupbuy.openGroup') }}
                </el-button>
              </div>
              <div class="gb-ongoing" v-if="ongoingGroups.length">
                <div v-for="g in ongoingGroups.slice(0, 3)" :key="g.recordId" class="gb-ongoing-item">
                  <div class="gb-avatars">
                    <el-avatar
                      v-for="m in (g.members || []).slice(0, 3)"
                      :key="m.userId"
                      :size="24"
                      :src="m.avatar"
                    >{{ (m.nickname || '?').charAt(0) }}</el-avatar>
                  </div>
                  <span class="gb-missing">{{ $t('groupbuy.missingMembers', { count: g.missingMembers }) }}</span>
                  <el-button size="small" type="danger" plain @click="handleJoinGroup(g.recordId)" :loading="gbLoading">
                    {{ $t('groupbuy.joinGroup') }}
                  </el-button>
                </div>
              </div>
            </div>

            <!-- 🆕 规格选择器（Phase 1 - F1 SKU 系统） -->
            <div class="spec-section" v-if="specDims.length">
              <div class="spec-dim" v-for="dim in specDims" :key="dim.name">
                <span class="info-label spec-label">{{ dim.name }}</span>
                <div class="spec-values">
                  <el-tag
                    v-for="v in dim.values"
                    :key="v"
                    :type="selectedSpecs[dim.name] === v ? 'danger' : 'info'"
                    :effect="selectedSpecs[dim.name] === v ? 'dark' : 'plain'"
                    :class="['spec-tag', { 'spec-disabled': isValueDisabled(dim.name, v) }]"
                    @click="selectSpecValue(dim.name, v)"
                  >
                    {{ v }}
                  </el-tag>
                </div>
              </div>
              <div class="spec-hint" v-if="!selectedSku">{{ $t('product.specHint') }}</div>
            </div>

            <div class="info-row">
              <span class="info-label">{{ $t('product.stock') }}</span>
              <span>{{ currentStock }} {{ $t('common.itemsUnit') }}</span>
            </div>
            <div class="info-row" v-if="product.shopName">
              <span class="info-label">{{ $t('product.shop') }}</span>
              <span>{{ product.shopName }}</span>
            </div>
            <div class="product-desc" v-if="product.description">
              <span class="info-label">{{ $t('product.description') }}</span>
              <p>{{ product.description }}</p>
            </div>

            <!-- 🔔 降价/补货提醒 -->
            <div class="alert-buttons" v-if="userStore.isLoggedIn">
              <el-button
                :type="alertStatus.priceAlert ? 'warning' : 'default'"
                size="small"
                :icon="alertStatus.priceAlert ? 'Bell' : undefined"
                @click="handlePriceAlert"
                :loading="alertLoading"
                plain
              >
                {{ alertStatus.priceAlert ? $t('product.priceAlertOn') : $t('product.priceAlert') }}
              </el-button>
              <el-button
                v-if="product && product.stock === 0"
                :type="alertStatus.restockAlert ? 'success' : 'default'"
                size="small"
                @click="handleRestockAlert"
                :loading="alertLoading"
                plain
              >
                {{ alertStatus.restockAlert ? $t('product.restockOn') : $t('product.restockAlert') }}
              </el-button>
            </div>

            <!-- 🚀 社交证明 -->
            <div class="social-proof" v-if="productStats">
              <span class="social-item" v-if="productStats.viewersCount > 0">
                {{ $t('product.viewers', { count: productStats.viewersCount }) }}
              </span>
              <span class="social-item" v-if="productStats.todayOrderCount > 0">
                {{ $t('product.todaySold', { count: productStats.todayOrderCount }) }}
              </span>
              <span class="social-item" v-if="productStats.totalSalesCount > 0">
                {{ $t('product.totalSales', { count: productStats.totalSalesCount }) }}
              </span>
            </div>

            <el-divider />

            <div class="quantity-row">
              <span class="info-label">{{ $t('product.quantity') }}</span>
              <el-input-number v-model="quantity" :min="1" :max="currentStock || 99" size="large" />
            </div>

            <!-- 🎁 积分抵扣（Phase 4 - F8：下单立省） -->
            <div class="points-row" v-if="userStore.isLoggedIn && pointsSummary.points > 0">
              <el-checkbox v-model="usePoints">
                {{ $t('points.useInOrder', { points: pointsSummary.points }) }}
              </el-checkbox>
              <span v-if="usePoints && pointsDeduction" class="points-hint">
                {{ $t('points.deductEst', { points: pointsDeduction.pointsUsed, amount: localeStore.formatPrice(pointsDeduction.deductAmount) }) }}
              </span>
              <span v-if="pointsSummary.levelDiscount > 0" class="level-hint">
                {{ $t('points.levelDiscountTag', { level: pointsSummary.levelName, percent: Math.round(pointsSummary.levelDiscount * 100) }) }}
              </span>
            </div>

            <div class="action-buttons">
              <el-button type="primary" plain size="large" @click="handleFavorite" :loading="favLoading">
                {{ $t('product.favorite') }}
              </el-button>
              <el-button type="warning" size="large" @click="handleAddCart" :loading="cartLoading">
                <el-icon><ShoppingCart /></el-icon> {{ $t('product.addToCart') }}
              </el-button>
              <el-button type="danger" size="large" @click="handleBuyNow" :loading="buyLoading">
                {{ $t('product.buyNow') }}
              </el-button>
            </div>

            <!-- 🧾 预估到手价（Phase 3 - F6：商品价 + 国际运费 + 跨境综合税） -->
            <div class="tax-card" v-if="taxEstimate">
              <div class="tax-card-title">{{ $t('tax.title') }}</div>
              <div class="tax-row">
                <span>{{ $t('tax.itemAmount') }} × {{ quantity }}</span>
                <span>{{ localeStore.formatPrice(taxEstimate.itemAmount) }}</span>
              </div>
              <div class="tax-row">
                <span>{{ $t('tax.shipping') }}</span>
                <span v-if="taxEstimate.freeShipping" class="tax-free">{{ $t('common.free') }}</span>
                <span v-else>{{ localeStore.formatPrice(taxEstimate.shippingFee) }}</span>
              </div>
              <div class="tax-row" v-if="!taxEstimate.freeShipping && taxEstimate.freeShippingThreshold">
                <span class="tax-hint">{{ $t('tax.shippingFree', { threshold: localeStore.formatPrice(taxEstimate.freeShippingThreshold) }) }}</span>
              </div>
              <div class="tax-row">
                <span>{{ $t('tax.taxLine', { name: taxEstimate.taxName, rate: taxEstimate.taxRatePercent }) }}</span>
                <span>{{ localeStore.formatPrice(taxEstimate.taxAmount) }}</span>
              </div>
              <div class="tax-row tax-total">
                <span>{{ $t('tax.total') }}</span>
                <span class="tax-total-amount">{{ localeStore.formatPrice(taxEstimate.totalAmount) }}</span>
              </div>
              <div class="tax-note">{{ taxEstimate.note || $t('tax.note') }} · {{ $t('tax.taxableHint') }}</div>
            </div>
            <div class="tax-card" v-else-if="taxLoading">
              <el-skeleton :rows="4" animated />
            </div>
          </div>
        </div>

        <!-- 🆕 价格走势（Phase 1 - F2，ECharts 版，多币种跟随换算） -->
        <div class="price-history-section" v-if="priceHistory.length >= 2">
          <div class="ph-header">
            <h2 class="section-title ph-title">{{ $t('product.phTitle') }}</h2>
            <div class="ph-stats">
              <span>{{ $t('product.phLow') }} <strong class="ph-low">{{ localeStore.formatPrice(phMin) }}</strong></span>
              <span>{{ $t('product.phHigh') }} <strong class="ph-high">{{ localeStore.formatPrice(phMax) }}</strong></span>
              <span>{{ $t('product.phCurrent') }} <strong class="ph-current">{{ localeStore.formatPrice(phCurrent) }}</strong></span>
            </div>
          </div>
          <PriceTrendChart :history="priceHistory" />
        </div>

        <!-- 🗣️ AI 口碑档案 2.0（Phase 4 - F9：持久化档案 + 买家印象标签墙，优先于实时 AI 总结） -->
        <div class="ai-summary-section reputation-section" v-if="reputation">
          <div class="ai-summary-header">
            <h2 class="section-title">{{ $t('reputation.title') }}</h2>
            <el-tag type="warning" size="small">{{ $t('product.basedOnReviews', { count: reputation.reviewCount }) }}</el-tag>
            <el-tag v-if="!reputation.exactLang" type="info" size="small">{{ $t('reputation.translating') }}</el-tag>
          </div>
          <div class="ai-summary-body">
            <!-- 买家印象标签墙 -->
            <div class="impression-wall" v-if="reputation.impressions && reputation.impressions.length">
              <span class="impression-label">{{ $t('reputation.impressions') }}</span>
              <el-tag
                v-for="(imp, i) in reputation.impressions"
                :key="i"
                :type="imp.sentiment === 'NEGATIVE' ? 'danger' : (imp.sentiment === 'NEUTRAL' ? 'info' : 'success')"
                effect="light"
                class="impression-tag"
              >{{ imp.tag }} ×{{ imp.count }}</el-tag>
            </div>
            <div class="ai-rating-row" v-if="reputation.recommendScore != null">
              <span class="ai-rating-label">{{ $t('reputation.recommendScore') }}</span>
              <el-progress
                :percentage="Math.min(100, Math.max(0, reputation.recommendScore))"
                :stroke-width="14"
                striped
                class="score-bar"
                :color="reputation.recommendScore >= 80 ? '#67c23a' : (reputation.recommendScore >= 60 ? '#e6a23c' : '#f56c6c')"
              />
            </div>
            <div class="ai-summary-text" v-if="reputation.summary">{{ reputation.summary }}</div>
            <div class="ai-pros-cons">
              <div class="ai-pros">
                <h4>{{ $t('product.pros') }}</h4>
                <ul>
                  <li v-for="(pro, i) in reputation.pros" :key="'rp'+i">{{ pro }}</li>
                </ul>
              </div>
              <div class="ai-cons">
                <h4>{{ $t('product.cons') }}</h4>
                <ul>
                  <li v-for="(con, i) in reputation.cons" :key="'rc'+i">{{ con }}</li>
                </ul>
              </div>
            </div>
            <div class="ai-best-for" v-if="reputation.bestFor">
              {{ $t('product.bestFor') }}{{ reputation.bestFor }}
            </div>
          </div>
        </div>

        <!-- 🚀 AI 评价总结（加载中） -->
        <div class="ai-summary-section" v-else-if="aiLoading">
          <div class="ai-summary-header">
            <h2 class="section-title">{{ $t('product.aiAnalyzing') }}</h2>
          </div>
          <el-skeleton :rows="3" animated />
        </div>

        <!-- 🚀 AI 评价总结（已生成） -->
        <div class="ai-summary-section" v-else-if="aiSummary">
          <div class="ai-summary-header">
            <h2 class="section-title">{{ $t('product.aiSummary') }}</h2>
            <el-tag type="warning" size="small">{{ $t('product.basedOnReviews', { count: aiSummary.reviewCount }) }}</el-tag>
          </div>
          <div class="ai-summary-body">
            <div class="ai-rating-row">
              <span class="ai-rating-label">{{ $t('product.aiRating') }}</span>
              <el-rate v-model="aiSummary.aiRating" disabled show-score :colors="['#f56c6c', '#f56c6c', '#f56c6c']" :max="5" />
            </div>
            <div class="ai-summary-text">{{ aiSummary.summary }}</div>
            <div class="ai-pros-cons">
              <div class="ai-pros">
                <h4>{{ $t('product.pros') }}</h4>
                <ul>
                  <li v-for="(pro, i) in aiSummary.pros" :key="'pro'+i">{{ pro }}</li>
                </ul>
              </div>
              <div class="ai-cons">
                <h4>{{ $t('product.cons') }}</h4>
                <ul>
                  <li v-for="(con, i) in aiSummary.cons" :key="'con'+i">{{ con }}</li>
                </ul>
              </div>
            </div>
            <div class="ai-best-for" v-if="aiSummary.bestFor">
              {{ $t('product.bestFor') }}{{ aiSummary.bestFor }}
            </div>
          </div>
        </div>

        <!-- 🛒 买了这款的人也买了（Tier 2.1b） -->
        <div class="recommend-section" v-if="frequentlyBought.length > 0">
          <h2 class="section-title">{{ $t('product.boughtTogetherTitle') }}</h2>
          <div class="recommend-grid">
            <div
              v-for="item in frequentlyBought"
              :key="item.id"
              class="recommend-card"
              @click="$router.push(`/product/${item.id}`)"
            >
              <el-image :src="item.coverImage" fit="cover" class="recommend-image">
                <template #error>
                  <div class="image-placeholder"><el-icon :size="32"><Picture /></el-icon></div>
                </template>
              </el-image>
              <div class="recommend-info">
                <p class="recommend-name">{{ item.name }}</p>
                <p class="recommend-price">{{ localeStore.formatPrice(item.price) }}</p>
                <el-tag size="small" type="warning">{{ $t('product.coBuyCount', { count: item.coOccurrenceCount }) }}</el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- 商品评价 -->
        <div class="review-section">
          <h2 class="section-title">{{ $t('product.reviewsTitle') }}</h2>
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
          <el-empty v-else :description="$t('product.noReviews')" />
        </div>

        <!-- 👀 猜你还想看（Tier 2.1a） -->
        <div class="recommend-section" v-if="similarProducts.length > 0">
          <h2 class="section-title">{{ $t('product.similarTitle') }}</h2>
          <div class="recommend-grid">
            <div
              v-for="item in similarProducts"
              :key="item.id"
              class="recommend-card"
              @click="$router.push(`/product/${item.id}`)"
            >
              <el-image :src="item.coverImage" fit="cover" class="recommend-image">
                <template #error>
                  <div class="image-placeholder"><el-icon :size="32"><Picture /></el-icon></div>
                </template>
              </el-image>
              <div class="recommend-info">
                <p class="recommend-name">{{ item.name }}</p>
                <p class="recommend-price">{{ localeStore.formatPrice(item.price) }}</p>
                <p class="recommend-shop">{{ item.shopName }}</p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { getProductDetail, getProductReviews, toggleFavorite, getAiReviewSummary, getProductStats, getSimilarProducts, getFrequentlyBought, getProductSkus, getPriceHistory, getReviewIntelligence } from '@/api/product'
import { getTaxEstimate } from '@/api/tax'
import { addToCart } from '@/api/cart'
import { createOrder } from '@/api/order'
import { getProductGroups, getOngoingGroups, openGroup, joinGroup } from '@/api/groupBuy'
import { getPointsSummary, previewDeduction } from '@/api/points'
import { subscribePriceAlert, unsubscribePriceAlert, subscribeRestockAlert, unsubscribeRestockAlert, checkAlertStatus } from '@/api/alert'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'
import { useLocaleStore, CURRENCY_OPTIONS } from '@/stores/locale'
import PriceTrendChart from '@/components/PriceTrendChart.vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const cartStore = useCartStore()
const userStore = useUserStore()
const localeStore = useLocaleStore()

const product = ref(null)
const reviews = ref([])
const aiSummary = ref(null)
const aiLoading = ref(false)
const productStats = ref(null)
const similarProducts = ref([])
const frequentlyBought = ref([])
const alertStatus = ref({ priceAlert: false, restockAlert: false })
const alertLoading = ref(false)
const quantity = ref(1)
const loading = ref(true)
const cartLoading = ref(false)
const buyLoading = ref(false)
const favLoading = ref(false)

// 🆕 SKU 规格状态（Phase 1 - F1）
const skus = ref([])
const specDims = ref([])          // [{ name: '颜色', values: ['红','蓝'] }]
const selectedSpecs = ref({})     // { 颜色: '红' }
const selectedSku = ref(null)

// 🆕 价格历史状态（Phase 1 - F2）
const priceHistory = ref([])

// 🆕 跨境税费试算状态（Phase 3 - F6）
const taxEstimate = ref(null)
const taxLoading = ref(false)
let taxTimer = null

// 👥 拼团入口状态（Phase 4 - F7）
const groupActivity = ref(null)
const ongoingGroups = ref([])
const gbLoading = ref(false)

// 🎁 积分抵扣状态（Phase 4 - F8）
const pointsSummary = ref({ points: 0, levelDiscount: 0, levelName: '' })
const usePoints = ref(false)
const pointsDeduction = ref(null)

// 🗣️ AI 口碑档案 2.0（Phase 4 - F9）
const reputation = ref(null)

// 🆕 原币参考价（Phase 3 - F5）：日元商品 ¥3,980 ≈ 人民币参考换算
const hasOriginalPrice = computed(() =>
  !!product.value?.originalPrice && product.value?.originalCurrency && product.value.originalCurrency !== 'CNY'
)
const originalPriceText = computed(() => {
  if (!hasOriginalPrice.value) return ''
  const opt = CURRENCY_OPTIONS.find(c => c.code === product.value.originalCurrency)
  const symbol = opt?.symbol || product.value.originalCurrency + ' '
  const decimals = opt?.decimals ?? 2
  return symbol + Number(product.value.originalPrice).toFixed(decimals)
})
const originalRate = computed(() => {
  if (!hasOriginalPrice.value) return null
  const r = localeStore.rateOf(product.value.originalCurrency)
  return r ? Number(r) : null
})

onMounted(() => {
  const id = route.params.id
  loadProduct(id)
  loadSkus(id)
  loadPriceHistory(id)
  loadReviews(id)
  loadAiSummary(id)
  loadStats(id)
  loadSimilar(id)
  loadFrequentlyBought(id)
  loadAlertStatus(id)
  // Phase 4：拼团入口 / 口碑档案 / 积分抵扣
  loadGroupEntry(id)
  loadReputation(id)
  loadPointsSummary()
})

async function loadProduct(id) {
  loading.value = true
  try {
    // lang 传当前界面语言：后端命中 product_translation 时返回 AI 翻译文案（Phase 3 - F5）
    const res = await getProductDetail(id, localeStore.locale)
    product.value = res.data
  } catch {
    ElMessage.error(t('messages.loadDetailFailed'))
  } finally {
    loading.value = false
  }
}

// 🆕 切换界面语言 → 重新拉取当前语言的商品文案（Phase 3 - F5）+ 口碑档案（Phase 4 - F9）
watch(() => localeStore.locale, () => {
  if (product.value?.id) {
    loadProduct(product.value.id)
    loadReputation(product.value.id)
  }
})

// 🆕 数量/规格变化 → 300ms 防抖重新试算到手价（Phase 3 - F6）
watch(
  [quantity, selectedSku, () => product.value?.id],
  () => {
    if (taxTimer) clearTimeout(taxTimer)
    taxTimer = setTimeout(loadTaxEstimate, 300)
  }
)

async function loadTaxEstimate() {
  const pid = product.value?.id
  if (!pid) return
  taxLoading.value = true
  try {
    const res = await getTaxEstimate(pid, selectedSku.value?.id ?? null, quantity.value)
    taxEstimate.value = res.code === 200 ? res.data : null
  } catch {
    taxEstimate.value = null // 试算失败静默降级，不阻塞主流程
  } finally {
    taxLoading.value = false
  }
}

// ==================== 👥 拼团入口（Phase 4 - F7） ====================

async function loadGroupEntry(id) {
  try {
    const res = await getProductGroups(id)
    groupActivity.value = res.code === 200 ? res.data : null
    if (groupActivity.value?.activityId) {
      const gRes = await getOngoingGroups(groupActivity.value.activityId)
      ongoingGroups.value = (gRes.code === 200 && gRes.data) ? gRes.data.filter(g => g.status === 0) : []
    }
  } catch {
    groupActivity.value = null // 无拼团活动静默降级
  }
}

async function handleOpenGroup() {
  if (!checkLogin()) return
  gbLoading.value = true
  try {
    const res = await openGroup(groupActivity.value.activityId)
    const { orderId, recordId } = res.data || {}
    ElMessage.success(t('groupbuy.openSuccess'))
    if (orderId) {
      router.push(`/order/pay/${orderId}`)
    } else if (recordId) {
      router.push(`/group-buy/record/${recordId}`)
    }
  } catch (e) {
    ElMessage.error(e.message || t('groupbuy.opFailed'))
  } finally {
    gbLoading.value = false
  }
}

async function handleJoinGroup(recordId) {
  if (!checkLogin()) return
  gbLoading.value = true
  try {
    const res = await joinGroup(recordId)
    const { orderId } = res.data || {}
    ElMessage.success(t('groupbuy.joinSuccess'))
    if (orderId) {
      router.push(`/order/pay/${orderId}`)
    } else {
      router.push(`/group-buy/record/${recordId}`)
    }
  } catch (e) {
    ElMessage.error(e.message || t('groupbuy.opFailed'))
  } finally {
    gbLoading.value = false
  }
}

// ==================== 🎁 积分抵扣（Phase 4 - F8） ====================

async function loadPointsSummary() {
  if (!userStore.isLoggedIn) return
  try {
    const res = await getPointsSummary()
    if (res.code === 200 && res.data) pointsSummary.value = res.data
  } catch {
    // 静默失败 — 不展示抵扣入口
  }
}

async function refreshPointsPreview() {
  if (!usePoints.value || !product.value) {
    pointsDeduction.value = null
    return
  }
  const unit = Number(selectedSku.value?.price ?? product.value.price ?? 0)
  const amount = unit * quantity.value
  if (amount <= 0) return
  try {
    const res = await previewDeduction(amount)
    pointsDeduction.value = res.code === 200 ? res.data : null
  } catch {
    pointsDeduction.value = null
  }
}

watch([usePoints, quantity, selectedSku], () => refreshPointsPreview())

// ==================== 🗣️ AI 口碑档案 2.0（Phase 4 - F9） ====================

async function loadReputation(id) {
  try {
    const res = await getReviewIntelligence(id, localeStore.locale)
    reputation.value = res.code === 200 && res.data ? res.data : null
  } catch {
    reputation.value = null // 无档案/评价不足时回退旧版 AI 总结
  }
}

// ==================== 🆕 SKU 规格逻辑 ====================

async function loadSkus(id) {
  try {
    const res = await getProductSkus(id)
    skus.value = res.data || []
    parseSpecDims()
  } catch {
    skus.value = []
  }
}

function skuSpecObj(sku) {
  try {
    return JSON.parse(sku.specJson || '{}')
  } catch {
    return {}
  }
}

// 从所有 SKU 的 specJson 中解析出规格维度与可选值（默认 SKU 的 {} 会产生 0 个维度，自然走单规格展示）
function parseSpecDims() {
  const dimMap = new Map()
  for (const sku of skus.value) {
    for (const [name, value] of Object.entries(skuSpecObj(sku))) {
      if (!dimMap.has(name)) dimMap.set(name, new Set())
      dimMap.get(name).add(value)
    }
  }
  specDims.value = [...dimMap.entries()].map(([name, vals]) => ({ name, values: [...vals] }))
  // 单维度且只有一个值时无需用户选择，直接选中
  selectedSpecs.value = {}
  for (const dim of specDims.value) {
    if (dim.values.length === 1) {
      selectedSpecs.value[dim.name] = dim.values[0]
    }
  }
  matchSelectedSku()
}

// 根据已选规格匹配唯一 SKU（未选完则为 null）
function matchSelectedSku() {
  if (!specDims.value.length) {
    // 无规格维度：落到默认/唯一 SKU（若有）
    selectedSku.value = skus.value.length === 1 ? skus.value[0] : null
    return
  }
  const allSelected = specDims.value.every(d => selectedSpecs.value[d.name])
  if (!allSelected) {
    selectedSku.value = null
    return
  }
  selectedSku.value = skus.value.find(sku => {
    const spec = skuSpecObj(sku)
    return specDims.value.every(d => spec[d.name] === selectedSpecs.value[d.name])
  }) || null
}

function selectSpecValue(dimName, value) {
  if (selectedSpecs.value[dimName] === value) {
    delete selectedSpecs.value[dimName]
  } else {
    selectedSpecs.value[dimName] = value
  }
  // 触发响应式更新
  selectedSpecs.value = { ...selectedSpecs.value }
  matchSelectedSku()
}

// 某规格值在当前已选组合下是否无货（置灰）
function isValueDisabled(dimName, value) {
  const assumed = { ...selectedSpecs.value, [dimName]: value }
  const candidates = skus.value.filter(sku => {
    const spec = skuSpecObj(sku)
    return Object.entries(assumed).every(([k, v]) => spec[k] === v)
  })
  return candidates.length > 0 && candidates.every(s => !s.stock || s.stock <= 0)
}

const displayImage = computed(() => {
  if (selectedSku.value?.image) return selectedSku.value.image
  return product.value?.coverImage
})

const priceRange = computed(() => {
  const prices = skus.value.map(s => Number(s.price)).filter(p => !isNaN(p))
  if (!prices.length) return localeStore.formatPrice(product.value?.price ?? 0)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return min === max
    ? localeStore.formatPrice(min)
    : `${localeStore.formatPrice(min)} ~ ${localeStore.formatPrice(max)}`
})

const currentStock = computed(() => {
  if (specDims.value.length && !selectedSku.value) {
    // 未选完规格：展示所有 SKU 库存之和
    return skus.value.reduce((s, sku) => s + (sku.stock || 0), 0)
  }
  if (selectedSku.value) return selectedSku.value.stock || 0
  return product.value?.stock || 0
})

// 规格切换后数量越界时自动回夹
watch(currentStock, (stock) => {
  if (quantity.value > (stock || 1)) quantity.value = Math.max(1, stock || 1)
})

// ==================== 🆕 价格走势图逻辑 ====================

async function loadPriceHistory(id) {
  try {
    const res = await getPriceHistory(id, 90)
    priceHistory.value = res.data || []
  } catch {
    priceHistory.value = []
  }
}

const phPrices = computed(() => priceHistory.value.map(h => Number(h.price)))
const phMin = computed(() => (phPrices.value.length ? Math.min(...phPrices.value).toFixed(2) : '0.00'))
const phMax = computed(() => (phPrices.value.length ? Math.max(...phPrices.value).toFixed(2) : '0.00'))
const phCurrent = computed(() => (phPrices.value.length ? phPrices.value[phPrices.value.length - 1].toFixed(2) : '0.00'))

async function loadReviews(id) {
  try {
    const res = await getProductReviews(id)
    reviews.value = res.data || []
  } catch {
    reviews.value = []
  }
}

async function loadAiSummary(id) {
  aiLoading.value = true
  try {
    const res = await getAiReviewSummary(id)
    if (res.code === 200) {
      aiSummary.value = res.data
    }
  } catch {
    // 评论数不足或 AI 不可用时静默失败
    aiSummary.value = null
  } finally {
    aiLoading.value = false
  }
}

async function loadStats(id) {
  try {
    const res = await getProductStats(id)
    if (res.code === 200) {
      productStats.value = res.data
    }
  } catch {
    productStats.value = null
  }
}

async function loadSimilar(id) {
  try {
    const res = await getSimilarProducts(id, 8)
    if (res.code === 200) {
      similarProducts.value = res.data || []
    }
  } catch {
    similarProducts.value = []
  }
}

async function loadFrequentlyBought(id) {
  try {
    const res = await getFrequentlyBought(id, 8)
    if (res.code === 200) {
      frequentlyBought.value = res.data || []
    }
  } catch {
    frequentlyBought.value = []
  }
}

async function loadAlertStatus(id) {
  if (!userStore.isLoggedIn) return
  try {
    const res = await checkAlertStatus(id)
    if (res.code === 200) {
      alertStatus.value = res.data
    }
  } catch {
    // 静默失败
  }
}

async function handlePriceAlert() {
  if (!checkLogin()) return
  alertLoading.value = true
  try {
    if (alertStatus.value.priceAlert) {
      await unsubscribePriceAlert(product.value.id)
      alertStatus.value.priceAlert = false
      ElMessage.success(t('messages.alertUnsubscribed'))
    } else {
      await subscribePriceAlert(product.value.id)
      alertStatus.value.priceAlert = true
      ElMessage.success(t('messages.alertSubscribed'))
    }
  } catch {
    ElMessage.error(t('messages.opFailed'))
  } finally {
    alertLoading.value = false
  }
}

async function handleRestockAlert() {
  if (!checkLogin()) return
  alertLoading.value = true
  try {
    if (alertStatus.value.restockAlert) {
      await unsubscribeRestockAlert(product.value.id)
      alertStatus.value.restockAlert = false
      ElMessage.success(t('messages.restockUnsubscribed'))
    } else {
      await subscribeRestockAlert(product.value.id)
      alertStatus.value.restockAlert = true
      ElMessage.success(t('messages.restockSubscribed'))
    }
  } catch {
    ElMessage.error(t('messages.opFailed'))
  } finally {
    alertLoading.value = false
  }
}

function checkLogin() {
  if (!userStore.isLoggedIn) {
    ElMessage.warning(t('messages.loginFirst'))
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return false
  }
  return true
}

// 🆕 多规格商品必须先选完规格
function ensureSkuSelected() {
  if (specDims.value.length && !selectedSku.value) {
    ElMessage.warning(t('messages.selectSpecFirst'))
    return false
  }
  if (currentStock.value <= 0) {
    ElMessage.warning(t('messages.soldOut'))
    return false
  }
  return true
}

async function handleAddCart() {
  if (!checkLogin()) return
  if (!ensureSkuSelected()) return
  cartLoading.value = true
  try {
    await addToCart({ productId: product.value.id, skuId: selectedSku.value?.id ?? null, quantity: quantity.value })
    cartStore.increment()
    // 闭环：成功反馈自带"去购物车"出口，点击消息直接跳转结算
    ElMessage({
      message: h('span', { class: 'cart-feedback' }, [
        t('messages.addedToCart'),
        h('span', {
          class: 'cart-feedback-link',
          onClick: () => { router.push('/cart') }
        }, t('cart.goCart') + ' ›')
      ]),
      type: 'success',
      duration: 3000
    })
  } catch {
    ElMessage.error(t('messages.addCartFailed'))
  } finally {
    cartLoading.value = false
  }
}

async function handleBuyNow() {
  if (!checkLogin()) return
  if (!ensureSkuSelected()) return
  buyLoading.value = true
  try {
    // 🆕 usePoints：勾选积分抵扣时后端自动试算并扣减（Phase 4 - F8）
    const res = await createOrder({
      productId: product.value.id,
      skuId: selectedSku.value?.id ?? null,
      quantity: quantity.value,
      usePoints: usePoints.value || null
    })
    ElMessage.success(t('messages.orderSuccess'))
    router.push(`/order/pay/${res.data}`)
  } catch {
    ElMessage.error(t('messages.orderFailed'))
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
    ElMessage.error(t('messages.opFailed'))
  } finally {
    favLoading.value = false
  }
}
</script>

<style scoped>
.product-detail-page {
  background: var(--gs-bg-hover);
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
  border-radius: var(--gs-radius-lg);
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
  background: var(--gs-bg-hover);
  color: #dcdfe6;
}
.detail-info {
  flex: 1;
  min-width: 0;
}
.product-name {
  font-size: 22px;
  font-weight: 700;
  color: var(--gs-text-1);
  margin-bottom: 14px;
  line-height: 1.4;
}
.product-price {
  font-size: 34px;
  font-weight: 800;
  letter-spacing: -0.5px;
  color: var(--gs-price);
  font-variant-numeric: tabular-nums;
  margin-bottom: 20px;
}
.info-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 14px;
  color: var(--gs-text-2);
}
.info-label {
  color: var(--gs-text-3);
  min-width: 36px;
}
.product-desc {
  margin-bottom: 12px;
  font-size: 14px;
  color: var(--gs-text-2);
}
.product-desc p {
  margin-top: 4px;
  line-height: 1.6;
}
/* 提醒按钮 */
.alert-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

/* 社交证明 */
.social-proof {
  display: flex;
  gap: 20px;
  padding: 10px 0;
}
.social-item {
  font-size: 13px;
  color: var(--gs-text-2);
}
.social-item strong {
  color: var(--gs-price);
  font-size: 15px;
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

/* 🆕 原币参考价（Phase 3 - F5） */
.multi-lang-tag {
  vertical-align: middle;
  margin-left: 8px;
}
.original-price-box {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 10px;
  margin: -12px 0 16px;
  padding: 10px 14px;
  background: linear-gradient(135deg, #f0f9ff 0%, #f8fbff 100%);
  border: 1px solid #d9ecff;
  border-radius: 8px;
}
.op-label {
  font-size: 12px;
  color: var(--gs-text-3);
}
.op-amount {
  font-size: 18px;
  font-weight: 700;
  color: var(--gs-primary);
}
.op-ref {
  font-size: 12px;
  color: var(--gs-text-3);
  margin-left: auto;
}

/* 👥 拼团入口卡片（Phase 4 - F7） */
.group-buy-card {
  margin: 0 0 16px;
  padding: 12px 14px;
  background: linear-gradient(135deg, #fff1f0 0%, #fff7f0 100%);
  border: 1px solid #ffd6d1;
  border-radius: 10px;
}
.gb-main-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.gb-tag {
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(90deg, #ff6034, #ee0a24);
  border-radius: 4px;
  padding: 2px 8px;
}
.gb-price {
  font-size: 22px;
  font-weight: 700;
  color: #ee0a24;
}
.gb-need {
  font-size: 13px;
  color: #ee0a24;
}
.gb-origin {
  font-size: 13px;
  color: var(--gs-text-3);
  text-decoration: line-through;
}
.gb-open-btn {
  margin-left: auto;
}
.gb-ongoing {
  margin-top: 10px;
  border-top: 1px dashed #ffd6d1;
  padding-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.gb-ongoing-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}
.gb-avatars {
  display: flex;
}
.gb-avatars .el-avatar {
  margin-right: -6px;
  border: 2px solid #fff;
  background: #ffc9c1;
  color: #ee0a24;
  font-size: 12px;
}
.gb-missing {
  color: #ee0a24;
  font-weight: 600;
}

/* 🎁 积分抵扣行（Phase 4 - F8） */
.points-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin: 10px 0;
  font-size: 13px;
}
.points-hint {
  color: #e6323e;
  font-weight: 600;
}
.level-hint {
  color: #b8860b;
  background: #fdf6ec;
  border: 1px solid #f5dab1;
  border-radius: 4px;
  padding: 1px 8px;
  font-size: 12px;
}

/* 🗣️ AI 口碑档案 2.0（Phase 4 - F9） */
.impression-wall {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}
.impression-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--gs-text-2);
}
.impression-tag {
  border-radius: 14px;
  font-size: 13px;
}
.score-bar {
  flex: 1;
  max-width: 320px;
}

/* 🧾 预估到手价卡片（Phase 3 - F6） */
.tax-card {
  margin-top: 20px;
  padding: 16px 18px;
  background: linear-gradient(135deg, #fffaf0 0%, #fffdf8 100%);
  border: 1px solid #f5dab1;
  border-radius: 10px;
}
.tax-card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--gs-text-1);
  margin-bottom: 10px;
}
.tax-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--gs-text-2);
  padding: 4px 0;
}
.tax-free {
  color: var(--gs-success);
  font-weight: 600;
}
.tax-hint {
  font-size: 12px;
  color: var(--gs-warning);
}
.tax-total {
  border-top: 1px dashed #f0c78a;
  margin-top: 6px;
  padding-top: 10px;
  font-weight: 600;
  color: var(--gs-text-1);
}
.tax-total-amount {
  font-size: 20px;
  font-weight: 700;
  color: var(--gs-price);
}
.tax-note {
  margin-top: 8px;
  font-size: 11px;
  color: #c0c4cc;
  line-height: 1.5;
}

/* 🆕 规格选择器 */
.spec-section {
  margin-bottom: 16px;
}
.spec-dim {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}
.spec-label {
  padding-top: 5px;
}
.spec-values {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.spec-tag {
  cursor: pointer;
  user-select: none;
  padding: 4px 14px;
  font-size: 13px;
  border-radius: 4px;
  transition: all 0.2s;
}
.spec-tag:hover {
  opacity: 0.85;
}
.spec-disabled {
  opacity: 0.35;
  cursor: not-allowed;
  text-decoration: line-through;
}
.spec-hint {
  font-size: 12px;
  color: var(--gs-warning);
  margin-top: 2px;
}

/* 🆕 价格走势图 */
.price-history-section {
  margin-top: 30px;
  background: #fff;
  border-radius: var(--gs-radius-lg);
  padding: 24px 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}
.ph-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}
.ph-title {
  margin-bottom: 0;
}
.ph-stats {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: var(--gs-text-3);
}
.ph-stats strong {
  font-size: 15px;
}
.ph-low { color: var(--gs-success); }
.ph-high { color: var(--gs-price); }
.ph-current { color: var(--gs-text-1); }

/* AI 评价总结 */
.ai-summary-section {
  margin-top: 30px;
  background: linear-gradient(135deg, #fef9e7 0%, #fffdf5 100%);
  border: 1px solid #f9e79f;
  border-radius: var(--gs-radius-lg);
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}
.ai-summary-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}
.ai-summary-header .section-title {
  margin-bottom: 0;
}
.ai-summary-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.ai-rating-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.ai-rating-label {
  font-weight: 500;
  color: var(--gs-text-2);
}
.ai-summary-text {
  font-size: 15px;
  line-height: 1.7;
  color: var(--gs-text-1);
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
  border-left: 3px solid var(--gs-warning);
}
.ai-pros-cons {
  display: flex;
  gap: 24px;
}
.ai-pros, .ai-cons {
  flex: 1;
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
}
.ai-pros h4 { color: var(--gs-success); margin: 0 0 8px 0; }
.ai-cons h4 { color: var(--gs-warning); margin: 0 0 8px 0; }
.ai-pros ul, .ai-cons ul {
  margin: 0;
  padding-left: 18px;
}
.ai-pros li, .ai-cons li {
  font-size: 14px;
  color: var(--gs-text-2);
  line-height: 1.8;
}
.ai-best-for {
  font-size: 14px;
  color: var(--gs-primary);
  padding: 8px 16px;
  background: #ecf5ff;
  border-radius: 8px;
}

/* 评价区域 */
.review-section {
  margin-top: 30px;
  background: #fff;
  border-radius: var(--gs-radius-lg);
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}
.section-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--gs-text-1);
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
  color: var(--gs-text-1);
}
.review-time {
  margin-left: auto;
  font-size: 12px;
  color: #c0c4cc;
}
.review-content {
  font-size: 14px;
  color: var(--gs-text-2);
  line-height: 1.6;
}

/* 推荐区域 */
.recommend-section {
  margin-top: 30px;
  background: #fff;
  border-radius: var(--gs-radius-lg);
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}
.recommend-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.recommend-card {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  background: #fafafa;
}
.recommend-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}
.recommend-image {
  width: 100%;
  height: 160px;
  background: var(--gs-bg-hover);
}
.recommend-info {
  padding: 10px 12px 14px;
}
.recommend-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--gs-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 6px;
}
.recommend-price {
  font-size: 16px;
  font-weight: 700;
  color: var(--gs-price);
  margin-bottom: 6px;
}
.recommend-shop {
  font-size: 12px;
  color: var(--gs-text-3);
}
</style>
