import request from './request'

/**
 * 根据订单ID查询物流信息
 */
export function getShipmentByOrder(orderId) {
  return request.get(`/shipment/order/${orderId}`)
}

/**
 * 根据运单号查询物流信息（公开接口）
 */
export function getShipmentByTracking(trackingNumber) {
  return request.get(`/shipment/track/${trackingNumber}`)
}

/**
 * 手动刷新物流轨迹
 */
export function refreshTracking(id) {
  return request.post(`/shipment/${id}/refresh`)
}
