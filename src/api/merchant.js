import request from './request'

export function applyShop(data) {
  return request.post('/merchant/shop/apply', data)
}

export function publishProduct(data) {
  return request.post('/merchant/product/publish', data)
}

export function getMerchantOrders() {
  return request.get('/merchant/order/list')
}

export function deliverOrder(data) {
  return request.post('/merchant/order/deliver', data)
}

export function aiAnalyzeProduct(imageUrl, keyword) {
  return request.get('/merchant/ai/analyze', { params: { imageUrl, keyword } })
}

export function getMerchantProducts() {
  return request.get('/merchant/product/list')
}

export function updateProduct(id, data) {
  return request.put(`/merchant/product/${id}`, data)
}

export function toggleProductStatus(id, status) {
  return request.post(`/merchant/product/${id}/status`, null, { params: { status } })
}

export function deleteProduct(id) {
  return request.delete(`/merchant/product/${id}`)
}

export function getShopInfo() {
  return request.get('/merchant/shop/info')
}

export function updateShopInfo(data) {
  return request.put('/merchant/shop/info', data)
}

export function getDashboard() {
  return request.get('/merchant/dashboard')
}

export function getShopRefunds() {
  return request.get('/merchant/refund/list')
}

export function approveRefund(id) {
  return request.post(`/merchant/refund/${id}/approve`)
}

export function rejectRefund(id, reason) {
  return request.post(`/merchant/refund/${id}/reject`, null, { params: { reason } })
}

export function createCoupon(data) {
  return request.post('/merchant/coupon/create', data)
}

export function getMerchantCoupons() {
  return request.get('/merchant/coupon/list')
}
