import { useState, useEffect } from 'react'
import { History, Shield, CheckCircle2, XCircle } from 'lucide-react'
import AdminLayout from '../../layouts/AdminLayout'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'
import { useToast } from '../../components/Toast'
import adminService from '../../services/adminService'

export default function LoginHistory() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { addToast } = useToast()

  const fetchHistory = async () => {
    try {
      const res = await adminService.getLoginHistory({ page, per_page: 20 })
      if (res.data.success) {
        setHistory(res.data.data.history)
        setTotalPages(res.data.data.pages)
      }
    } catch (err) {
      addToast('Failed to load login history', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHistory() }, [page])

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleString()
  }

  return (
    <AdminLayout title="Login History">
      <div className="page-header">
        <div className="page-title">
          <h1><History size={24} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} /> Login History</h1>
          <p>Monitor user and admin login activities</p>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : history.length === 0 ? (
        <EmptyState title="No login history found" message="No login attempts recorded yet." />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Role</th>
                <th>Voter ID</th>
                <th>Status</th>
                <th>IP Address</th>
                <th>User Agent</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDate(h.login_time)}</td>
                  <td>
                    {h.role === 'ADMIN' ? (
                      <span className="badge badge-verified"><Shield size={12} style={{marginRight: 4}}/> Admin</span>
                    ) : (
                      <span className="badge badge-primary">Voter</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 500 }}>{h.voter_id || '-'}</td>
                  <td>
                    {h.status === 'SUCCESS' ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--success)' }}>
                        <CheckCircle2 size={16} /> Success
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--danger)' }}>
                        <XCircle size={16} /> Failed
                      </span>
                    )}
                  </td>
                  <td>{h.ip_address || '-'}</td>
                  <td style={{ fontSize: '0.8rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={h.user_agent}>
                    {h.user_agent || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20, gap: 10 }}>
          <button 
            className="btn btn-ghost btn-sm" 
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </button>
          <span style={{ display: 'flex', alignItems: 'center' }}>
            Page {page} of {totalPages}
          </span>
          <button 
            className="btn btn-ghost btn-sm" 
            disabled={page === totalPages} 
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </AdminLayout>
  )
}
