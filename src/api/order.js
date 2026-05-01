import request from './request'

export function createOrder(data) {
  return request.post('/order/create', data)
}

export function getMyOrders() {
  return request.get('/order/my')
}

export function checkoutCart() {
  return request.post('/order/checkout')
}

export function payOrder(id) {
  return request.post(`/order/pay/${id}`)
}

export function confirmReceipt(id) {
  return request.post(`/order/confirm-receipt/${id}`)
}

export function submitReview(data) {
  return request.post('/order/review', data)
}

export function getOrderDetail(id) {
  return request.get(`/order/${id}`)
}

export function applyRefund(data) {
  return request.post('/order/refund/apply', data)
}

export function getRefundList() {
  return request.get('/order/refund/list')
}

export function getRefundDetail(id) {
  return request.get(`/order/refund/${id}`)
}

export function cancelRefund(id) {
  return request.post(`/order/refund/${id}/cancel`)
}
