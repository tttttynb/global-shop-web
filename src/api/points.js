import request from './request'

// ==================== 会员积分（Phase 4 - F8） ====================

/** 积分总览：余额/等级/折扣/签到状态 */
export function getPointsSummary() {
  return request.get('/points/summary')
}

/** 积分流水（最近记录） */
export function getPointsRecords() {
  return request.get('/points/records')
}

/** 每日签到 */
export function signIn() {
  return request.post('/points/sign-in')
}

/** 完善画像奖励领取 */
export function claimProfileBonus() {
  return request.post('/points/claim-profile-bonus')
}

/** 可兑换优惠券列表 */
export function getExchangeableCoupons() {
  return request.get('/points/exchange/coupons')
}

/** 积分兑换优惠券 */
export function exchangeCoupon(couponId) {
  return request.post(`/points/exchange/${couponId}`)
}

/** 下单积分抵扣试算 amount=商品金额 */
export function previewDeduction(amount) {
  return request.get('/points/deduction-preview', { params: { amount } })
}
