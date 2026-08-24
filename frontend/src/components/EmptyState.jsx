import { Inbox } from 'lucide-react'

export default function EmptyState({ icon: Icon = Inbox, title = 'No data', message = 'Nothing to display here yet.' }) {
  return (
    <div className="empty-state">
      <Icon size={64} />
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  )
}
