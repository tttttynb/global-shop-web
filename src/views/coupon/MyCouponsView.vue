<template>
  <div class="page-container coupon-page">
    <h2 class="page-title">我的优惠券</h2>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="未使用" name="0" />
      <el-tab-pane label="已使用" name="1" />
      <el-tab-pane label="已过期" name="2" />
    </el-tabs>
    <div v-loading="loading">
      <template v-if="filtered.length > 0">
        <el-card v-for="item in filtered" :key="item.userCouponId" class="coupon-card" shadow="hover">
          <div class="coupon-left">
            <div class="coupon-value">
              <template v-if="item.type === 1">¥{{ item.discountValue }}</template>
              <template v-else>{{ item.discountValue }}折</template>
            </div>
            <div class="coupon-condition">满{{ item.minAmount }}可用</div>
          </div>
          <div class="coupon-right">
            <div class="coupon-name">{{ item.name }}</div>
            <div class="coupon-expire">有效期至 {{ item.endTime?.split('T')[0] }}</div>
          </div>
        </el-card>
      </template>
      <el-empty v-if="!loading && filtered.length === 0" description="暂无优惠券">
        <div class="empty-actions">
          <el-button type="primary" @click="$router.push('/products')">去下单赚优惠券</el-button>
          <el-button @click="$router.push('/points')">积分商城兑换</el-button>
        </div>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getMyCoupons } from '@/api/coupon'

const loading = ref(true)
const activeTab = ref('0')
const list = ref([])

const filtered = computed(() => list.value.filter(c => String(c.status) === activeTab.value))

onMounted(async () => {
  try {
    const res = await getMyCoupons()
    list.value = res.data || []
  } catch {} finally { loading.value = false }
})
</script>

<style scoped>
.coupon-page { max-width: 700px; margin: 0 auto; padding: 24px 16px; }
.page-title { font-size: 24px; font-weight: 700; margin-bottom: 24px; }
.coupon-card { margin-bottom: 12px; border-radius: var(--gs-radius-lg); }
.coupon-card :deep(.el-card__body) { display: flex; align-items: center; gap: 20px; }
.coupon-left { width: 100px; text-align: center; flex-shrink: 0; }
.coupon-value { font-size: 24px; font-weight: 700; color: var(--gs-price); }
.coupon-condition { font-size: 12px; color: var(--gs-text-3); }
.coupon-right { flex: 1; }
.coupon-name { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
.coupon-expire { font-size: 12px; color: var(--gs-text-3); }
</style>
