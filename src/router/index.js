import { createRouter, createWebHistory } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import MerchantLayout from '@/layouts/MerchantLayout.vue'

const routes = [
  {
    path: '/',
    component: DefaultLayout,
    children: [
      { path: '', name: 'Home', component: () => import('@/views/home/HomeView.vue'), meta: { title: '首页' } },
      { path: 'products', name: 'Products', component: () => import('@/views/product/ProductListView.vue'), meta: { title: '全部商品' } },
      { path: 'product/:id', name: 'ProductDetail', component: () => import('@/views/product/ProductDetailView.vue'), meta: { title: '商品详情' } },
      { path: 'search', name: 'Search', component: () => import('@/views/product/SearchView.vue'), meta: { title: '搜索' } },
      { path: 'cart', name: 'Cart', component: () => import('@/views/cart/CartView.vue'), meta: { requiresAuth: true, title: '购物车' } },
      { path: 'orders', name: 'Orders', component: () => import('@/views/order/OrderListView.vue'), meta: { requiresAuth: true, title: '我的订单' } },
      { path: 'order/pay/:id', name: 'OrderPay', component: () => import('@/views/order/OrderPayView.vue'), meta: { requiresAuth: true, title: '收银台' } },
      { path: 'order/review/:orderItemId', name: 'OrderReview', component: () => import('@/views/order/OrderReviewView.vue'), meta: { requiresAuth: true } },
      { path: 'live', name: 'LiveHall', component: () => import('@/views/live/LiveHallView.vue'), meta: { title: '直播大厅' } },
      { path: 'live/:id', name: 'LiveWatch', component: () => import('@/views/live/LiveWatchView.vue'), meta: { title: '直播间' } },
      { path: 'ai/search', name: 'AiSearch', component: () => import('@/views/ai/AiSearchView.vue'), meta: { title: 'AI 搜索' } },
      { path: 'ai/chat', name: 'AiChat', component: () => import('@/views/ai/AiChatView.vue'), meta: { requiresAuth: true, meta: { title: 'AI 导购' } } },
      { path: 'profile', name: 'UserProfile', component: () => import('@/views/user/UserProfileView.vue'), meta: { requiresAuth: true } },
      { path: 'favorites', name: 'Favorites', component: () => import('@/views/product/FavoritesView.vue'), meta: { requiresAuth: true, meta: { title: '我的收藏' } } },
      { path: 'order/:id', name: 'OrderDetail', component: () => import('@/views/order/OrderDetailView.vue'), meta: { requiresAuth: true } },
      { path: 'order/:id/tracking', name: 'OrderTracking', component: () => import('@/views/order/TrackingView.vue'), meta: { requiresAuth: true } },
      { path: 'refund/apply/:orderId', name: 'RefundApply', component: () => import('@/views/order/RefundApplyView.vue'), meta: { requiresAuth: true } },
      { path: 'refunds', name: 'RefundList', component: () => import('@/views/order/RefundListView.vue'), meta: { requiresAuth: true } },
      { path: 'coupons', name: 'MyCoupons', component: () => import('@/views/coupon/MyCouponsView.vue'), meta: { requiresAuth: true } },
      { path: 'notifications', name: 'Notifications', component: () => import('@/views/notification/NotificationListView.vue'), meta: { requiresAuth: true } },
      // 🆕 Phase 4：社交拼团 + 会员积分
      { path: 'group-buy', name: 'GroupBuyZone', component: () => import('@/views/groupbuy/GroupBuyZoneView.vue'), meta: { title: '拼团专区' } },
      { path: 'group-buy/record/:id', name: 'GroupRecord', component: () => import('@/views/groupbuy/GroupRecordView.vue'), meta: { requiresAuth: true, meta: { title: '拼团详情' } } },
      { path: 'points', name: 'PointsCenter', component: () => import('@/views/user/PointsCenterView.vue'), meta: { requiresAuth: true, title: '积分中心' } },
    ]
  },
  {
    path: '/merchant',
    component: MerchantLayout,
    meta: { requiresAuth: true },
    children: [
      { path: 'apply', name: 'MerchantApply', component: () => import('@/views/merchant/MerchantApplyView.vue') },
      { path: 'products', name: 'MerchantProducts', component: () => import('@/views/merchant/MerchantProductsView.vue') },
      { path: 'product/publish', name: 'ProductPublish', component: () => import('@/views/merchant/ProductPublishView.vue') },
      { path: 'orders', name: 'MerchantOrders', component: () => import('@/views/merchant/MerchantOrdersView.vue') },
      { path: 'live/create', name: 'LiveCreate', component: () => import('@/views/live/LiveCreateView.vue') },
      { path: 'live/:id/console', name: 'LiveConsole', component: () => import('@/views/live/LiveConsoleView.vue') },
      { path: 'dashboard', name: 'MerchantDashboard', component: () => import('@/views/merchant/MerchantDashboardView.vue') },
      { path: 'refunds', name: 'MerchantRefunds', component: () => import('@/views/merchant/MerchantRefundsView.vue') },
      { path: 'coupons', name: 'MerchantCoupons', component: () => import('@/views/merchant/MerchantCouponsView.vue') },
      { path: 'group-buy', name: 'MerchantGroupBuy', component: () => import('@/views/merchant/MerchantGroupBuyView.vue') },
    ]
  },
  { path: '/login', name: 'Login', component: () => import('@/views/auth/LoginView.vue') },
  { path: '/register', name: 'Register', component: () => import('@/views/auth/RegisterView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 导航守卫 + 顶部加载进度条
router.beforeEach((to, from, next) => {
  NProgress.start()
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

router.afterEach((to) => {
  // 页面标题跟随路由（SEO/收藏夹友好）
  document.title = to.meta.title ? `${to.meta.title} - GlobalShop 全球购` : 'GlobalShop 全球购 - 跨境正品好物，直播购物'
  NProgress.done()
})

export default router
