import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import MerchantLayout from '@/layouts/MerchantLayout.vue'

const routes = [
  {
    path: '/',
    component: DefaultLayout,
    children: [
      { path: '', name: 'Home', component: () => import('@/views/home/HomeView.vue') },
      { path: 'products', name: 'Products', component: () => import('@/views/product/ProductListView.vue') },
      { path: 'product/:id', name: 'ProductDetail', component: () => import('@/views/product/ProductDetailView.vue') },
      { path: 'search', name: 'Search', component: () => import('@/views/product/SearchView.vue') },
      { path: 'cart', name: 'Cart', component: () => import('@/views/cart/CartView.vue'), meta: { requiresAuth: true } },
      { path: 'orders', name: 'Orders', component: () => import('@/views/order/OrderListView.vue'), meta: { requiresAuth: true } },
      { path: 'order/pay/:id', name: 'OrderPay', component: () => import('@/views/order/OrderPayView.vue'), meta: { requiresAuth: true } },
      { path: 'order/review/:orderItemId', name: 'OrderReview', component: () => import('@/views/order/OrderReviewView.vue'), meta: { requiresAuth: true } },
      { path: 'live', name: 'LiveHall', component: () => import('@/views/live/LiveHallView.vue') },
      { path: 'live/:id', name: 'LiveWatch', component: () => import('@/views/live/LiveWatchView.vue') },
      { path: 'ai/search', name: 'AiSearch', component: () => import('@/views/ai/AiSearchView.vue') },
      { path: 'ai/chat', name: 'AiChat', component: () => import('@/views/ai/AiChatView.vue'), meta: { requiresAuth: true } },
      { path: 'profile', name: 'UserProfile', component: () => import('@/views/user/UserProfileView.vue'), meta: { requiresAuth: true } },
      { path: 'favorites', name: 'Favorites', component: () => import('@/views/product/FavoritesView.vue'), meta: { requiresAuth: true } },
      { path: 'order/:id', name: 'OrderDetail', component: () => import('@/views/order/OrderDetailView.vue'), meta: { requiresAuth: true } },
      { path: 'refund/apply/:orderId', name: 'RefundApply', component: () => import('@/views/order/RefundApplyView.vue'), meta: { requiresAuth: true } },
      { path: 'refunds', name: 'RefundList', component: () => import('@/views/order/RefundListView.vue'), meta: { requiresAuth: true } },
      { path: 'coupons', name: 'MyCoupons', component: () => import('@/views/coupon/MyCouponsView.vue'), meta: { requiresAuth: true } },
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
    ]
  },
  { path: '/login', name: 'Login', component: () => import('@/views/auth/LoginView.vue') },
  { path: '/register', name: 'Register', component: () => import('@/views/auth/RegisterView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 导航守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
