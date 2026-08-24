import api from './api'

export const authService = {
  voterLogin: (voter_id, face_image) =>
    api.post('/auth/login', { voter_id, face_image }),

  register: (data) =>
    api.post('/auth/register', data),

  adminLogin: (username, password, face_image = null) =>
    api.post('/auth/admin-login', { username, password, face_image }),

  faceVerify: (voter_id, face_image) =>
    api.post('/auth/face-verify', { voter_id, face_image }),

  getMe: () => api.get('/auth/me'),

  logout: () => api.post('/auth/logout'),
}

export default authService
