// src/pages/Profile.jsx
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { User, Mail, CreditCard, ShieldCheck, Save } from 'lucide-react'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({ name: user?.name || '', avatar_url: user?.avatar_url || '' })
  const [loading, setLoading] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.put('/auth/me', form)
      updateUser(data)
      toast.success('Profile updated!')
    } catch {
      toast.error('Update failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-3xl font-bold text-slate-900 mb-8">Your Profile</h1>

      {/* Avatar */}
      <div className="card p-8 mb-6 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-campus-100 text-campus-700 flex items-center justify-center text-3xl font-bold font-display mb-3">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <h2 className="font-display text-xl font-bold text-slate-900">{user?.name}</h2>
        <span className={`badge mt-2 ${user?.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-campus-100 text-campus-700'}`}>
          {user?.role === 'admin' ? '⭐ Admin' : 'Student'}
        </span>
      </div>

      {/* Info cards */}
      <div className="card p-6 mb-6 space-y-3">
        <InfoLine icon={<Mail />} label="Email" value={user?.email} />
        {user?.college_id && <InfoLine icon={<CreditCard />} label="College ID" value={user?.college_id} />}
        <InfoLine icon={<ShieldCheck />} label="Role" value={user?.role} />
      </div>

      {/* Edit form */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Edit Profile</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Display Name</label>
            <input value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Your name" className="input" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Avatar URL</label>
            <input value={form.avatar_url}
              onChange={e => setForm(f => ({ ...f, avatar_url: e.target.value }))}
              placeholder="https://..." className="input" />
          </div>
          <button type="submit" disabled={loading}
            className="btn-primary flex items-center gap-2 text-sm">
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}

function InfoLine({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-campus-400 w-4 h-4 shrink-0">{icon}</span>
      <span className="text-slate-400 w-24 shrink-0 text-xs font-semibold uppercase tracking-wide">{label}</span>
      <span className="text-slate-700 capitalize">{value}</span>
    </div>
  )
}
