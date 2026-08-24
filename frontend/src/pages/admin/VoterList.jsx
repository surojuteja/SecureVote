import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, Eye, ShieldCheck, Check } from 'lucide-react'
import AdminLayout from '../../layouts/AdminLayout'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'
import ConfirmModal from '../../components/ConfirmModal'
import { useToast } from '../../components/Toast'
import adminService from '../../services/adminService'

export default function VoterList() {
  const [voters, setVoters] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const navigate = useNavigate()
  const { addToast } = useToast()

  const fetchVoters = async () => {
    try {
      const res = await adminService.getVoters({ search, status: statusFilter })
      if (res.data.success) setVoters(res.data.data.voters)
    } catch (err) {
      addToast('Failed to load voters', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchVoters() }, [search, statusFilter])

  const handleDelete = async () => {
    try {
      await adminService.deleteVoter(deleteId)
      addToast('Voter deactivated successfully', 'success')
      setDeleteId(null)
      fetchVoters()
    } catch (err) {
      addToast('Failed to deactivate voter', 'error')
    }
  }

  const handleApprove = async (id) => {
    try {
      await adminService.approveVoter(id)
      addToast('Voter approved successfully', 'success')
      fetchVoters()
    } catch (err) {
      addToast('Failed to approve voter', 'error')
    }
  }

  return (
    <AdminLayout title="Voter Management">
      <div className="page-header">
        <div className="page-title">
          <h1>Voters</h1>
          <p>Manage registered voters and face enrollment</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/admin/voters/new')}>
          <Plus size={18} /> Add Voter
        </button>
      </div>

      <div className="toolbar">
        <div className="search-input-wrapper">
          <Search />
          <input
            className="form-input"
            placeholder="Search by name or voter ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="form-input" style={{ width: 180 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Voters</option>
          <option value="eligible">Eligible</option>
          <option value="ineligible">Ineligible</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
        </select>
      </div>

      {loading ? <LoadingSpinner /> : voters.length === 0 ? (
        <EmptyState title="No voters found" message="Add voters to get started." />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Voter ID</th>
                <th>Full Name</th>
                <th>Status</th>
                <th>Face</th>
                <th>Eligible</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {voters.map(v => (
                <tr key={v.id}>
                  <td style={{ fontWeight: 600 }}>{v.voter_id}</td>
                  <td>{v.full_name}</td>
                  <td>
                    <span className={`badge ${v.is_verified ? 'badge-verified' : 'badge-unverified'}`}>
                      {v.is_verified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td>
                    {v.has_face_registered ? (
                      <ShieldCheck size={18} style={{ color: 'var(--success)' }} />
                    ) : (
                      <span className="text-muted text-xs">Not registered</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${v.is_eligible ? 'badge-eligible' : 'badge-ineligible'}`}>
                      {v.is_eligible ? 'Eligible' : 'Ineligible'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {!v.is_eligible && (
                        <button className="btn btn-ghost btn-sm" onClick={() => handleApprove(v.id)} title="Approve" style={{ color: 'var(--success)' }}>
                          <Check size={16} />
                        </button>
                      )}
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/admin/voters/${v.id}`)} title="Edit">
                        <Edit size={16} />
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setDeleteId(v.id)} title="Deactivate" style={{ color: 'var(--danger)' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteId && (
        <ConfirmModal
          title="Deactivate Voter"
          message="Are you sure you want to deactivate this voter? They will no longer be able to login or vote."
          confirmText="Deactivate"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </AdminLayout>
  )
}
