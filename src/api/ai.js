import request from './request'

export function semanticSearch(keyWord) {
  return request.get('/ai/semantic', { params: { keyWord } })
}

export function chatWithAi(message) {
  return request.get('/chat', { params: { message } })
}

export function initVectors() {
  return request.get('/ai/init-vectors')
}
