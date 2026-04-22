// src/components/Navbar.jsx
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import {
  Search, Bell, PlusCircle, User, LogOut, LayoutDashboard,
  Shield, Menu, X, BookMarked
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, logout }             = useAuth()
  const { notifications, markRead }  = useSocket()
  const navigate                     = useNavigate()
  const location                     = useLocation()
  const [menuOpen, setMenuOpen]      = useState(false)
  const [notifOpen, setNotifOpen]    = useState(false)
  const [search, setSearch]          = useState('')

  const unread = notifications.filter(n => !n.read).length

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/?q=${encodeURIComponent(search.trim())}`)
      setSearch('')
      setMenuOpen(false)
    }
  }

  const isActive = (path) => location.pathname === path

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-8 h-8 bg-campus-600 rounded-lg flex items-center justify-center group-hover:bg-campus-700 transition-colors">
              <BookMarked className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-campus-900 text-lg hidden sm:block">
              Campus<span className="text-campus-500">Find</span>
            </span>
          </Link>

          {/* Search bar — desktop */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md hidden md:flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search items..."
                className="input pl-9 pr-4 text-sm"
              />
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Post button */}
                <Link to="/post"
                  className="btn-primary flex items-center gap-1.5 text-sm hidden sm:flex">
                  <PlusCircle className="w-4 h-4" />
                  Post Item
                </Link>

                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5 text-slate-600" />
                    {unread > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold animate-pulse-slow">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 top-12 w-80 card shadow-xl border border-slate-100 overflow-hidden animate-fade-up z-50">
                      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-semibold text-sm text-slate-800">Notifications</h3>
                        <button onClick={() => setNotifOpen(false)} className="text-slate-400 hover:text-slate-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                        {notifications.length === 0 ? (
                          <p className="text-center text-slate-400 text-sm py-6">No notifications yet</p>
                        ) : notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => markRead(n.id)}
                            className={`px-4 py-3 cursor-pointer transition-colors ${n.read ? 'text-slate-500' : 'bg-campus-50 text-slate-800'} hover:bg-slate-50`}
                          >
                            <p className="text-sm">{n.message}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {new Date(n.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Nav links */}
                <Link to="/dashboard"
                  className={`p-2 rounded-xl hidden sm:flex hover:bg-slate-100 transition-colors ${isActive('/dashboard') ? 'bg-campus-50 text-campus-600' : 'text-slate-600'}`}>
                  <LayoutDashboard className="w-5 h-5" />
                </Link>
                <Link to="/profile"
                  className={`p-2 rounded-xl hidden sm:flex hover:bg-slate-100 transition-colors ${isActive('/profile') ? 'bg-campus-50 text-campus-600' : 'text-slate-600'}`}>
                  <User className="w-5 h-5" />
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin"
                    className="p-2 rounded-xl text-amber-500 hover:bg-amber-50 transition-colors hidden sm:flex">
                    <Shield className="w-5 h-5" />
                  </Link>
                )}
                <button onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors hidden sm:flex">
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 hidden sm:flex">
                <Link to="/login" className="btn-secondary text-sm">Sign In</Link>
                <Link to="/register" className="btn-primary text-sm">Register</Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="sm:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="sm:hidden border-t border-slate-100 pb-3 pt-2 space-y-1 animate-fade-up">
            <form onSubmit={handleSearch} className="px-2 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search items..."
                  className="input pl-9 text-sm"
                />
              </div>
            </form>

            {user ? (
              <>
                <MobileLink to="/post" icon={<PlusCircle className="w-4 h-4" />} label="Post Item" onClick={() => setMenuOpen(false)} />
                <MobileLink to="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" onClick={() => setMenuOpen(false)} />
                <MobileLink to="/profile" icon={<User className="w-4 h-4" />} label="Profile" onClick={() => setMenuOpen(false)} />
                {user.role === 'admin' && (
                  <MobileLink to="/admin" icon={<Shield className="w-4 h-4" />} label="Admin Panel" onClick={() => setMenuOpen(false)} />
                )}
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </>
            ) : (
              <div className="flex gap-2 px-2 pt-1">
                <Link to="/login" className="btn-secondary text-sm flex-1 text-center" onClick={() => setMenuOpen(false)}>Sign In</Link>
                <Link to="/register" className="btn-primary text-sm flex-1 text-center" onClick={() => setMenuOpen(false)}>Register</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

function MobileLink({ to, icon, label, onClick }) {
  return (
    <Link to={to} onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
      {icon} {label}
    </Link>
  )
}
