<template>
  <div class="merchant-layout">
    <AppHeader />
    <div class="merchant-body">
      <aside class="merchant-sidebar">
        <el-menu :default-active="route.path" router>
          <el-menu-item index="/merchant/dashboard">
            <el-icon><DataLine /></el-icon>
            <span>数据概览</span>
          </el-menu-item>
          <el-menu-item index="/merchant/products">
            <el-icon><Goods /></el-icon>
            <span>商品管理</span>
          </el-menu-item>
          <el-menu-item index="/merchant/product/publish">
            <el-icon><Plus /></el-icon>
            <span>发布商品</span>
          </el-menu-item>
          <el-menu-item index="/merchant/orders">
            <el-icon><List /></el-icon>
            <span>订单管理</span>
          </el-menu-item>
          <el-menu-item index="/merchant/refunds">
            <el-icon><RefreshLeft /></el-icon>
            <span>退款管理</span>
          </el-menu-item>
          <el-menu-item index="/merchant/coupons">
            <el-icon><Ticket /></el-icon>
            <span>优惠券管理</span>
          </el-menu-item>
          <el-menu-item index="/merchant/group-buy">
            <el-icon><UserFilled /></el-icon>
            <span>拼团活动</span>
          </el-menu-item>
          <el-menu-item index="/merchant/live/create">
            <el-icon><VideoCamera /></el-icon>
            <span>创建直播</span>
          </el-menu-item>
        </el-menu>
      </aside>
      <main class="merchant-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getShopInfo } from '@/api/merchant'
import AppHeader from '@/components/AppHeader.vue'

const route = useRoute()
const router = useRouter()
const hasShop = ref(true)

onMounted(async () => {
  if (route.path === '/merchant/apply') return
  try {
    const res = await getShopInfo()
    if (!res.data) {
      hasShop.value = false
      router.replace('/merchant/apply')
    }
  } catch (e) {
    hasShop.value = false
    router.replace('/merchant/apply')
  }
})
</script>

<style scoped>
.merchant-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.merchant-body {
  flex: 1;
  display: flex;
}
.merchant-sidebar {
  width: 220px;
  background: var(--gs-bg-card);
  border-right: 1px solid var(--gs-border);
  min-height: calc(100vh - var(--gs-header-height));
  padding-top: 12px;
  box-sizing: border-box;
}
.merchant-sidebar .el-menu {
  border-right: none;
}
/* 菜单项圆角块状选中态 */
.merchant-sidebar :deep(.el-menu-item) {
  height: 46px;
  margin: 4px 10px;
  border-radius: var(--gs-radius-sm);
  color: var(--gs-text-2);
}
.merchant-sidebar :deep(.el-menu-item:hover) {
  background: var(--gs-bg-hover);
}
.merchant-sidebar :deep(.el-menu-item.is-active) {
  background: color-mix(in srgb, var(--gs-primary) 9%, #fff);
  color: var(--gs-primary);
  font-weight: 600;
}
.merchant-content {
  flex: 1;
  min-width: 0;
  padding: 24px 28px 48px;
  background: var(--gs-bg-page);
  box-sizing: border-box;
}
</style>
