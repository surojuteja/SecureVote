import api from './api'

export const electionService = {
  getElections: (params = {}) => api.get('/elections', { params }),
  getElection: (id) => api.get(`/elections/${id}`),
  createElection: (data) => api.post('/elections', data),
  updateElection: (id, data) => api.put(`/elections/${id}`, data),
  deleteElection: (id) => api.delete(`/elections/${id}`),

  getCandidates: (electionId) => api.get(`/elections/${electionId}/candidates`),
  addCandidate: (electionId, data) => api.post(`/elections/${electionId}/candidates`, data),
  updateCandidate: (id, data) => api.put(`/candidates/${id}`, data),
  deleteCandidate: (id) => api.delete(`/candidates/${id}`),

  getResults: (electionId) => api.get(`/results/${electionId}`),

  // Candidate applications
  applyAsCandidate: (electionId, data) => api.post(`/elections/${electionId}/apply`, data),
  getApplications: (electionId) => api.get(`/elections/${electionId}/applications`),
  reviewApplication: (electionId, appId, data) => api.put(`/elections/${electionId}/applications/${appId}`, data),
}

export default electionService
