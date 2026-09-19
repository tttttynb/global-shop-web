import request from './request'

// ==================== 社交拼团（Phase 4 - F7） ====================

/** 拼团专区：进行中的活动列表（公开） */
export function getGroupActivities() {
  return request.get('/group-buy/activities')
}

/** 活动详情（公开） */
export function getGroupActivity(id) {
  return request.get(`/group-buy/activity/${id}`)
}

/** 活动下进行中的团列表（公开，分享落地） */
export function getOngoingGroups(activityId) {
  return request.get(`/group-buy/activity/${activityId}/groups`)
}

/** 某商品的可参与拼团入口（公开，商品详情页） */
export function getProductGroups(productId) {
  return request.get(`/group-buy/product/${productId}`)
}

/** 开团（需登录），返回团记录ID */
export function openGroup(activityId, addressId) {
  return request.post(`/group-buy/open/${activityId}`, null, { params: { addressId } })
}

/** 参团（需登录），返回团记录ID */
export function joinGroup(recordId, addressId) {
  return request.post(`/group-buy/join/${recordId}`, null, { params: { addressId } })
}

/** 我的拼团（需登录） */
export function getMyGroups() {
  return request.get('/group-buy/my')
}

/** 团详情（需登录，含成员坑位/倒计时） */
export function getGroupRecord(id) {
  return request.get(`/group-buy/record/${id}`)
}

// ==================== 商家侧 ====================

/** 创建拼团活动 */
export function createGroupActivity(data) {
  return request.post('/group-buy/merchant/activity', data)
}

/** 我的店铺拼团活动列表 */
export function getMerchantActivities() {
  return request.get('/group-buy/merchant/activities')
}

/** 上架/下架活动 status: 1上架 0下架 */
export function updateActivityStatus(id, status) {
  return request.post(`/group-buy/merchant/activity/${id}/status`, null, { params: { status } })
}
