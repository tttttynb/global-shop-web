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
  background: #fff;
  border-right: 1px solid #e6e6e6;
  min-height: calc(100vh - 60px);
}
.merchant-sidebar .el-menu {
  border-right: none;
}
.merchant-content {
  flex: 1;
  padding: 24px;
  background: #f5f5f5;
}
</style>
