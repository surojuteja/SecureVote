import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/admin/Dashboard'
import VoterList from './pages/admin/VoterList'
import VoterForm from './pages/admin/VoterForm'
import ElectionList from './pages/admin/ElectionList'
import ElectionForm from './pages/admin/ElectionForm'
import ElectionDetail from './pages/admin/ElectionDetail'
import AdminResults from './pages/admin/Results'
import AdminNotifications from './pages/admin/Notifications'
import AdminLoginHistory from './pages/admin/LoginHistory'

import VoterDashboard from './pages/voter/Dashboard'
import VoterElections from './pages/voter/Elections'
import VoterElectionDetail from './pages/voter/ElectionDetail'
import VotingPage from './pages/voter/VotingPage'
import VoterCalendar from './pages/voter/Calendar'
import VoterResults from './pages/voter/Results'
import VoterNotifications from './pages/voter/Notifications'
import VoterProfile from './pages/voter/Profile'

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/voters" element={<ProtectedRoute role="ADMIN"><VoterList /></ProtectedRoute>} />
        <Route path="/admin/voters/new" element={<ProtectedRoute role="ADMIN"><VoterForm /></ProtectedRoute>} />
        <Route path="/admin/voters/:id" element={<ProtectedRoute role="ADMIN"><VoterForm /></ProtectedRoute>} />
        <Route path="/admin/elections" element={<ProtectedRoute role="ADMIN"><ElectionList /></ProtectedRoute>} />
        <Route path="/admin/elections/create" element={<ProtectedRoute role="ADMIN"><ElectionForm /></ProtectedRoute>} />
        <Route path="/admin/elections/:id/edit" element={<ProtectedRoute role="ADMIN"><ElectionForm /></ProtectedRoute>} />
        <Route path="/admin/elections/:id" element={<ProtectedRoute role="ADMIN"><ElectionDetail /></ProtectedRoute>} />
        <Route path="/admin/results" element={<ProtectedRoute role="ADMIN"><AdminResults /></ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute role="ADMIN"><AdminNotifications /></ProtectedRoute>} />
        <Route path="/admin/login-history" element={<ProtectedRoute role="ADMIN"><AdminLoginHistory /></ProtectedRoute>} />

        {/* Voter Routes */}
        <Route path="/voter/dashboard" element={<ProtectedRoute role="VOTER"><VoterDashboard /></ProtectedRoute>} />
        <Route path="/voter/elections" element={<ProtectedRoute role="VOTER"><VoterElections /></ProtectedRoute>} />
        <Route path="/voter/elections/:id" element={<ProtectedRoute role="VOTER"><VoterElectionDetail /></ProtectedRoute>} />
        <Route path="/voter/elections/:id/vote" element={<ProtectedRoute role="VOTER"><VotingPage /></ProtectedRoute>} />
        <Route path="/voter/calendar" element={<ProtectedRoute role="VOTER"><VoterCalendar /></ProtectedRoute>} />
        <Route path="/voter/results" element={<ProtectedRoute role="VOTER"><VoterResults /></ProtectedRoute>} />
        <Route path="/voter/notifications" element={<ProtectedRoute role="VOTER"><VoterNotifications /></ProtectedRoute>} />
        <Route path="/voter/profile" element={<ProtectedRoute role="VOTER"><VoterProfile /></ProtectedRoute>} />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </ToastProvider>
  )
}
