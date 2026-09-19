import request from './request'

export function semanticSearch(keyWord) {
  return request.get('/ai/semantic', { params: { keyWord } })
}

/** 🆕 AI 以图搜图（Phase 2 - F4）：FormData 携带 file 字段，视觉模型耗时较长 */
export function imageSearch(formData) {
  return request.post('/ai/image-search', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000
  })
}

export function chatWithAi(message) {
  return request.get('/chat', { params: { message }, timeout: 120000 })
}

export function initVectors() {
  return request.get('/ai/init-vectors')
}

export function getUserProfile() {
  return request.get('/user/profile/my')
}
