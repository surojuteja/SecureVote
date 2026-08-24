export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p className="text-secondary">{message}</p>
    </div>
  )
}
