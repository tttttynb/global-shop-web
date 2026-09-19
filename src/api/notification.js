import request from './request'

/** 获取通知列表 */
export function getNotifications(page = 1, size = 20) {
  return request.get('/notification/list', { params: { page, size } })
}

/** 获取未读数量 */
export function getUnreadCount() {
  return request.get('/notification/unread')
}

/** 标记单条已读 */
export function markAsRead(id) {
  return request.post(`/notification/${id}/read`)
}

/** 全部标记已读 */
export function markAllAsRead() {
  return request.post('/notification/read-all')
}

/** 删除通知 */
export function deleteNotification(id) {
  return request.delete(`/notification/${id}`)
}
