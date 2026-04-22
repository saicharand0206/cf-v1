// src/pages/Register.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BookMarked, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Register() {
  const { register } = useAuth()
  const navigate     = useNavigate()
  const [form, setForm]       = useState({ name: '', email: '', college_id: '', password: '', confirm: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) { toast.error('Name, email, and password are required'); return }
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await register({ name: form.name, email: form.email, college_id: form.college_id || undefined, password: form.password })
      toast.success('Account created! Welcome!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-campus-50 via-white to-slate-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-campus-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-campus-200">
            <BookMarked className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Create account</h1>
          <p className="text-slate-500 text-sm mt-1">Join Campus Find today</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name *</label>
              <input value={form.name} onChange={set('name')} placeholder="Your full name" className="input" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email *</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@college.edu" className="input" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                College ID <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input value={form.college_id} onChange={set('college_id')} placeholder="e.g. 23BCS001" className="input" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password *</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Min 6 characters"
                  className="input pr-10"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirm Password *</label>
              <input
                type="password"
                value={form.confirm}
                onChange={set('confirm')}
                placeholder="Repeat password"
                className={`input ${form.confirm && form.confirm !== form.password ? 'border-red-300 focus:ring-red-400' : ''}`}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-campus-600 font-semibold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
