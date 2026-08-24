import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Edit, Trash2, CalendarDays, Clock, Users, Search, Vote } from 'lucide-react'
import AdminLayout from '../../layouts/AdminLayout'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'
import ConfirmModal from '../../components/ConfirmModal'
import { useToast } from '../../components/Toast'
import electionService from '../../services/electionService'

export default function ElectionList() {
  const [elections, setElections] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')
  const navigate = useNavigate()
  const { addToast } = useToast()

  const fetchElections = async () => {
    try {
      const res = await electionService.getElections()
      if (res.data.success) setElections(res.data.data.elections || [])
    } catch (err) {
      addToast('Failed to load elections', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchElections() }, [])

  const handleDelete = async () => {
    try {
      await electionService.deleteElection(deleteId)
      addToast('Election deleted/cancelled', 'success')
      setDeleteId(null)
      fetchElections()
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete election', 'error')
    }
  }

  const statusBadge = (status) => {
    const cls = {
      UPCOMING: 'badge-upcoming', ACTIVE: 'badge-active',
      COMPLETED: 'badge-completed', CANCELLED: 'badge-cancelled',
    }
    return <span className={`badge ${cls[status] || ''}`}>{status}</span>
  }

  const formatDate = (iso) => {
    if (!iso) return '-'
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const filtered = elections.filter(e => {
    const matchesFilter = filter === 'ALL' || e.status === filter
    const matchesSearch = !search || e.title.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <AdminLayout title="Election Management">
      <div className="page-header">
        <div className="page-title">
          <h1>Electoral Contests & Schedules</h1>
          <p>Create, configure, and monitor electronic elections</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/admin/elections/create')}>
          <Plus size={18} /> Schedule New Election
        </button>
      </div>

      <div className="toolbar">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input
            className="form-input"
            placeholder="Search elections by title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['ALL', 'ACTIVE', 'UPCOMING', 'COMPLETED'].map(f => (
            <button
              key={f}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilter(f)}
            >
              {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No elections found"
          message="Schedule a new election contest to get started."
        />
      ) : (
        <div className="elections-grid">
          {filtered.map(e => (
            <div className="election-card" key={e.id}>
              <div className="election-card-top">
                <div>
                  <h3>{e.title}</h3>
                  <p>{e.description || 'Configured election parameters.'}</p>
                </div>
                {statusBadge(e.status)}
              </div>

              <div className="election-card-meta">
                <div className="election-card-meta-row">
                  <span><CalendarDays size={14} style={{ display: 'inline', marginRight: 6 }} /> Start:</span>
                  <strong style={{ color: '#ffffff' }}>{formatDate(e.start_datetime)}</strong>
                </div>
                <div className="election-card-meta-row">
                  <span><Clock size={14} style={{ display: 'inline', marginRight: 6 }} /> End:</span>
                  <strong style={{ color: '#ffffff' }}>{formatDate(e.end_datetime)}</strong>
                </div>
                <div className="election-card-meta-row">
                  <span>Nominees:</span>
                  <strong style={{ color: '#ffffff' }}>{e.total_candidates} candidates</strong>
                </div>
                <div className="election-card-meta-row">
                  <span>Ballots Cast:</span>
                  <strong style={{ color: 'var(--primary)' }}>{e.total_votes} votes</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => navigate(`/admin/elections/${e.id}`)}
                >
                  <Eye size={15} /> Details
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => navigate(`/admin/elections/${e.id}/edit`)}
                  title="Edit"
                >
                  <Edit size={15} />
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setDeleteId(e.id)}
                  title="Delete/Cancel"
                  style={{ color: 'var(--danger)', borderColor: 'rgba(244, 63, 94, 0.3)' }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteId && (
        <ConfirmModal
          title="Delete or Cancel Election"
          message="Are you sure you want to proceed? If ballots have already been cast, the election will be safely cancelled instead of permanently deleted."
          confirmText="Confirm Action"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </AdminLayout>
  )
}
