import request from './request'

export function addToCart(data) {
  return request.post('/cart/add', data)
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
