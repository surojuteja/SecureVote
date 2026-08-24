import api from './api'

export const voteService = {
  castVote: (election_id, candidate_id) =>
    api.post('/votes', { election_id, candidate_id }),

  getVoterElections: () => api.get('/voter/elections'),
  getVoterElection: (id) => api.get(`/voter/elections/${id}`),
  getVotingStatus: (electionId) => api.get(`/voter/voting-status/${electionId}`),
  getVoterProfile: () => api.get('/voter/profile'),
  updateVoterProfile: (data) => api.put('/voter/profile', data),
}

export default voteService
