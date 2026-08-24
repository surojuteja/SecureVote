import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

export default function VoterLayout({ children, title = 'Your Voting Portal' }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="app-layout">
      <Sidebar mobile={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="main-content">
        <Header title={title} onMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  )
}
