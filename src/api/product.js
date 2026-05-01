import request from './request'

export function getProductList() {
  return request.get('/product/list')
}

export function getProductListPaged(params) {
  return request.get('/product/list/paged', { params })
}

export function getProductDetail(id) {
  return request.get(`/product/detail/${id}`)
}

export function getProductReviews(id) {
  return request.get(`/product/${id}/reviews`)
}

export function searchProducts(keyword, page = 0, size = 10) {
  return request.get('/product/search', { params: { keyword, page, size } })
}

export function toggleFavorite(id) {
  return request.post(`/product/favorite/${id}`)
}

export function getFavorites() {
  return request.get('/product/favorites')
}

export function getCategoryList() {
  return request.get('/category/list')
}
