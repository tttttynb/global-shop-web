import request from './request'

/** 订阅降价提醒 */
export function subscribePriceAlert(id) {
  return request.post(`/alert/price/${id}`)
}

/** 取消降价提醒 */
export function unsubscribePriceAlert(id) {
  return request.delete(`/alert/price/${id}`)
}

/** 订阅补货提醒 */
export function subscribeRestockAlert(id) {
  return request.post(`/alert/restock/${id}`)
}

/** 取消补货提醒 */
export function unsubscribeRestockAlert(id) {
  return request.delete(`/alert/restock/${id}`)
}

/** 查询提醒状态 */
export function checkAlertStatus(id) {
  return request.get(`/alert/check/${id}`)
}

/** 获取通知列表 */
export function getNotifications() {
  return request.get('/alert/notifications')
}
