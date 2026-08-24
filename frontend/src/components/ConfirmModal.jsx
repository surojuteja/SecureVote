import { AlertTriangle } from 'lucide-react'

export default function ConfirmModal({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel, variant = 'primary' }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {variant === 'danger' && <AlertTriangle size={20} style={{ color: 'var(--danger)' }} />}
            {title}
          </h3>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onCancel}>{cancelText}</button>
          <button
            className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
