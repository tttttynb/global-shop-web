import request from './request'

export function addToCart(data) {
  return request.post('/cart/add', data)
}

/** 🆕 AI 购物顾问一键全部加购（Phase 4 - F10）：items=[{productId,skuId,quantity}] */
export function batchAddToCart(items) {
  return request.post('/cart/batch', { items })
}

export function getCartList() {
  return request.get('/cart/list')
}

export function removeCartItem(id) {
  return request.delete(`/cart/remove/${id}`)
}

export function updateCartItem(id, quantity) {
  return request.put(`/cart/update/${id}`, null, { params: { quantity } })
}
