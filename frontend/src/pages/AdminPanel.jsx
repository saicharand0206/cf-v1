// src/pages/AdminPanel.jsx
import { useState, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import {
  Users, Package, Trash2, Shield, ShieldOff,
  BarChart3, PackageX, PackageCheck, RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'

const TABS = ['overview', 'items', 'users']

export default function AdminPanel() {
  const [tab, setTab]       = useState('overview')
  const [stats, setStats]   = useState(null)
  const [items, setItems]   = useState([])
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [s, i, u] = await Promise.all([
        api.get('/admin/stats').then(r => r.data),
        api.get('/admin/items').then(r => r.data),
        api.get('/admin/users').then(r => r.data),
      ])
      setStats(s); setItems(i); setUsers(u)
    } catch { toast.error('Failed to load admin data') }
      finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const deleteItem = async (id) => {
    if (!window.confirm('Delete this item?')) return
    try {
      await api.delete(`/admin/items/${id}`)
      setItems(prev => prev.filter(i => i.id !== id))
      toast.success('Item deleted')
    } catch { toast.error('Delete failed') }
  }

  const toggleRole = async (uid, role) => {
    const newRole = role === 'admin' ? 'user' : 'admin'
    try {
      const { data } = await api.put(`/admin/users/${uid}/role`, { role: newRole })
      setUsers(prev => prev.map(u => u.id === uid ? data : u))
      toast.success(`Role updated to ${newRole}`)
    } catch { toast.error('Update failed') }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">Admin Panel</h1>
          <p className="text-slate-500 text-sm mt-1">Manage Campus Find system</p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6 w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all
              ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard icon={<Users />} label="Total Users" value={stats.total_users} color="blue" />
          <StatCard icon={<Package />} label="Total Items" value={stats.total_items} color="slate" />
          <StatCard icon={<PackageX />} label="Lost" value={stats.lost_items} color="red" />
          <StatCard icon={<Package />} label="Found" value={stats.found_items} color="green" />
          <StatCard icon={<PackageCheck />} label="Returned" value={stats.returned_items} color="purple" />
        </div>
      )}

      {/* Items */}
      {tab === 'items' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['ID', 'Title', 'Category', 'Status', 'Owner', 'Date', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">#{item.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 max-w-[200px] truncate">{item.title}</td>
                    <td className="px-4 py-3 capitalize text-slate-500">{item.category}</td>
                    <td className="px-4 py-3">
                      <span className={`badge capitalize text-xs
                        ${item.status === 'lost' ? 'badge-lost' : item.status === 'found' ? 'badge-found' : 'badge-returned'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{item.owner_name}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {item.date_lost ? format(new Date(item.date_lost), 'MMM d, yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteItem(item.id)}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['ID', 'Name', 'Email', 'College ID', 'Role', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">#{u.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                    <td className="px-4 py-3 text-slate-500">{u.email}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{u.college_id || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`badge capitalize ${u.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {format(new Date(u.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleRole(u.id, u.role)}
                        title={u.role === 'admin' ? 'Remove admin' : 'Make admin'}
                        className={`p-1.5 rounded-lg transition-colors
                          ${u.role === 'admin'
                            ? 'text-amber-500 hover:bg-amber-50'
                            : 'text-slate-400 hover:bg-slate-100'}`}>
                        {u.role === 'admin' ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color }) {
  const c = {
    blue:   'bg-blue-50 text-blue-500 border-blue-100',
    slate:  'bg-slate-50 text-slate-500 border-slate-200',
    red:    'bg-red-50 text-red-500 border-red-100',
    green:  'bg-green-50 text-green-500 border-green-100',
    purple: 'bg-purple-50 text-purple-500 border-purple-100',
  }
  return (
    <div className={`card p-5 border ${c[color]}`}>
      <div className="flex items-center gap-3">
        <span className="w-5 h-5 shrink-0">{icon}</span>
        <div>
          <p className="text-2xl font-bold font-display text-slate-900">{value}</p>
          <p className="text-xs text-slate-500 mt-0.5">{label}</p>
        </div>
      </div>
    </div>
  )
}
