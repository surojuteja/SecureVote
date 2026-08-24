import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration)
    }
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.type === 'success' && <CheckCircle size={20} style={{ color: 'var(--success)', flexShrink: 0 }} />}
            {toast.type === 'error' && <AlertCircle size={20} style={{ color: 'var(--danger)', flexShrink: 0 }} />}
            {toast.type === 'warning' && <AlertTriangle size={20} style={{ color: 'var(--warning)', flexShrink: 0 }} />}
            {toast.type === 'info' && <Info size={20} style={{ color: 'var(--info)', flexShrink: 0 }} />}
            <span style={{ fontSize: '0.875rem', flex: 1 }}>{toast.message}</span>
            <button className="toast-close" onClick={() => removeToast(toast.id)} aria-label="Close toast">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
