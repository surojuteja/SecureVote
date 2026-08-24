import api from './api'

export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),

  getVoters: (params = {}) => api.get('/admin/voters', { params }),
  getVoter: (id) => api.get(`/admin/voters/${id}`),
  createVoter: (data) => api.post('/admin/voters', data),
  updateVoter: (id, data) => api.put(`/admin/voters/${id}`, data),
  deleteVoter: (id) => api.delete(`/admin/voters/${id}`),
  enrollFace: (id, face_image) => api.post(`/admin/voters/${id}/enroll-face`, { face_image }),
  approveVoter: (id) => api.post(`/admin/voters/${id}/approve`),
  getLoginHistory: (params = {}) => api.get('/admin/login-history', { params }),

  getAdminResults: (electionId) => api.get(`/admin/results/${electionId}`),
}

export default adminService
