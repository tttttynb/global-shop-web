import request from './request'

export function claimCoupon(id) {
  return request.post(`/coupon/claim/${id}`)
}

export function getMyCoupons() {
  return request.get('/coupon/my')
}

export function getAvailableCoupons(shopId, amount) {
  return request.get('/coupon/available', { params: { shopId, amount } })
}
