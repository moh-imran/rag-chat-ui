import React, { useState, useEffect } from 'react'
import AdminPanel from './components/AdminPanel'
import AdminHeader from './components/AdminHeader'
import AdminSidebar from './components/AdminSidebar'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import UserManagement from './components/UserManagement'
import Analytics from './components/Analytics'
import Conversations from './components/Conversations'
import SystemMonitor from './components/SystemMonitor'

export default function App() {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<string>('dashboard')

  // Check for stored token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      setToken(storedToken)
    }
    setLoading(false)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    setToken(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <div className="text-[var(--text-secondary)]">Loading...</div>
      </div>
    )
  }

  if (!token) {
    return <Auth onAuthSuccess={setToken} />
  }

  return (
    <div className="flex min-h-screen mesh-bg text-[var(--text-primary)]">
      <AdminSidebar activeView={activeView} onNavigate={setActiveView} />
      <div className="flex-1 flex flex-col">
        <AdminHeader title="RAG Chat UI — Admin" onLogout={handleLogout} />
        <main className="p-6 flex-1 overflow-auto">
          {activeView === 'dashboard' && <Dashboard token={token} />}
          {activeView === 'users' && <UserManagement token={token} />}
          {activeView === 'analytics' && <Analytics token={token} />}
          {activeView === 'conversations' && <Conversations token={token} />}
          {activeView === 'system' && <SystemMonitor token={token} />}
          {(activeView === 'integrations' || activeView === 'etl') && <AdminPanel />}
        </main>
      </div>
    </div>
  )
}
