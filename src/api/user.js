import request from './request'

export function login(data) {
  return request.post('/user/login', data)
}

export function register(data) {
  return request.post('/user/register', data)
}

export function getProfile() {
  return request.get('/user/profile')
}

export function updateProfile(data) {
  return request.put('/user/profile', data)
}

export function getAddressList() {
  return request.get('/user/address/list')
}

export function addAddress(data) {
  return request.post('/user/address', data)
}

export function updateAddress(id, data) {
  return request.put(`/user/address/${id}`, data)
}

export function deleteAddress(id) {
  return request.delete(`/user/address/${id}`)
}
