import request from './request'

/**
 * 创建支付订单
 * @param {Object} data - { orderId: Number, channel: Number }
 *   channel: 0-余额 1-支付宝 2-微信 3-Stripe
 * @returns {Promise} PaymentResultVo
 */
export function createPayment(data) {
  return request.post('/payment/create', data)
}

/**
 * 查询支付订单状态
 * @param {Number} paymentId - 支付订单ID
 * @returns {Promise} PaymentOrder
 */
export function queryPaymentStatus(paymentId) {
  return request.get(`/payment/status/${paymentId}`)
}

/**
 * 获取当前支持的支付渠道列表
 * @returns {Promise} [{code, name, label}, ...]
 */
export function getPaymentChannels() {
  return request.get('/payment/channels')
}

/**
 * 余额充值
 * @param {Number} amount - 充值金额
 * @returns {Promise}
 */
export function rechargeBalance(amount) {
  return request.post('/user/recharge', { amount })
}
