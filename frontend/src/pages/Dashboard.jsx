// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import ItemCard from '../components/ItemCard'
import ChatBox from '../components/ChatBox'
import {
  PlusCircle, MessageSquare, Package, PackageCheck,
  PackageX, ChevronRight
} from 'lucide-react'

export default function Dashboard() {
  const { user }              = useAuth()
  const [myItems, setMyItems] = useState([])
  const [convos, setConvos]   = useState([])
  const [loading, setLoading] = useState(true)
  const [activeChat, setActiveChat] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/items/?per_page=100').then(r => r.data.items.filter(i => i.user_id === user.id)),
      api.get('/chat/conversations').then(r => r.data),
    ]).then(([items, conversations]) => {
      setMyItems(items)
      setConvos(conversations)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [user.id])

  const lost     = myItems.filter(i => i.status === 'lost').length
  const found    = myItems.filter(i => i.status === 'found').length
  const returned = myItems.filter(i => i.status === 'returned').length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">
            Hello, {user.name.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">Here's your activity on Campus Find</p>
        </div>
        <Link to="/post" className="btn-primary flex items-center gap-2 text-sm">
          <PlusCircle className="w-4 h-4" /> Post Item
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard icon={<PackageX className="w-5 h-5 text-red-500" />}
          label="Lost" value={lost} color="red" />
        <StatCard icon={<Package className="w-5 h-5 text-green-500" />}
          label="Found" value={found} color="green" />
        <StatCard icon={<PackageCheck className="w-5 h-5 text-blue-500" />}
          label="Returned" value={returned} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My posts */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold text-slate-800">My Posts</h2>
            <Link to="/" className="text-sm text-campus-600 hover:underline flex items-center gap-1">
              Browse all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="card animate-pulse overflow-hidden">
                  <div className="h-40 bg-slate-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : myItems.length === 0 ? (
            <div className="card p-12 text-center">
              <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No posts yet</p>
              <p className="text-sm text-slate-400 mt-1 mb-4">Post a lost or found item to get started</p>
              <Link to="/post" className="btn-primary text-sm inline-flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> Post Item
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myItems.map(item => <ItemCard key={item.id} item={item} />)}
            </div>
          )}
        </div>

        {/* Messages */}
        <div>
          <h2 className="font-display text-xl font-semibold text-slate-800 mb-4">Messages</h2>
          <div className="card divide-y divide-slate-50 overflow-hidden">
            {convos.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No conversations yet</p>
              </div>
            ) : convos.map(c => (
              <button key={c.partner.id}
                onClick={() => setActiveChat(c.partner)}
                className="w-full text-left flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-campus-100 text-campus-700 flex items-center justify-center text-sm font-bold shrink-0">
                  {c.partner.name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800 truncate">{c.partner.name}</p>
                    {c.unread_count > 0 && (
                      <span className="badge bg-campus-600 text-white text-[10px] shrink-0">
                        {c.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {c.last_message?.content || 'Start a conversation'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Open chat */}
      {activeChat && (
        <ChatBox partner={activeChat} onClose={() => setActiveChat(null)} />
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    red:   'bg-red-50 border-red-100',
    green: 'bg-green-50 border-green-100',
    blue:  'bg-blue-50 border-blue-100',
  }
  return (
    <div className={`card p-5 border ${colors[color]}`}>
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-2xl font-bold font-display text-slate-900">{value}</p>
          <p className="text-xs text-slate-500 mt-0.5">{label} Items</p>
        </div>
      </div>
    </div>
  )
}
