// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useNotifications } from './hooks/useNotifications'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import PostItem from './pages/PostItem'
import ItemDetail from './pages/ItemDetail'
import Profile from './pages/Profile'
import AdminPanel from './pages/AdminPanel'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex h-screen items-center justify-center"><Spinner /></div>
  return user ? children : <Navigate to="/login" replace />
}

function AdminOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user?.role === 'admin' ? children : <Navigate to="/" replace />
}

function Spinner() {
  return (
    <div className="w-10 h-10 border-4 border-campus-200 border-t-campus-600 rounded-full animate-spin" />
  )
}

export default function App() {
  useNotifications()   // Load persisted notifications from server on login
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="page-enter">
        <Routes>
          <Route path="/"          element={<Home />} />
          <Route path="/login"     element={<Login />} />
          <Route path="/register"  element={<Register />} />
          <Route path="/items/:id" element={<ItemDetail />} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/post"      element={<Protected><PostItem /></Protected>} />
          <Route path="/profile"   element={<Protected><Profile /></Protected>} />
          <Route path="/admin"     element={<AdminOnly><AdminPanel /></AdminOnly>} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
