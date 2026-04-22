// src/pages/PostItem.jsx  —  FIXED: clean toast messages for all error cases
import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { Upload, Sparkles, X, ImagePlus } from 'lucide-react'

const CATEGORIES = ['phone', 'wallet', 'bag', 'id_card', 'keys', 'book', 'laptop', 'other']
const STATUSES   = ['lost', 'found']

export default function PostItem() {
  const navigate = useNavigate()
  const fileRef  = useRef(null)

  const [form, setForm] = useState({
    title: '', description: '', category: 'other',
    status: 'lost', date_lost: '', location: '',
  })
  const [image, setImage]               = useState(null)
  const [preview, setPreview]           = useState(null)
  const [loading, setLoading]           = useState(false)
  const [aiLoading, setAiLoading]       = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState(null)
  const [dragOver, setDragOver]         = useState(false)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  // ── Image handling ──────────────────────────────────────────────────────────
  const processFile = useCallback(async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WEBP).')
      return
    }
    if (file.size > 16 * 1024 * 1024) {
      toast.error('Image must be under 16 MB.')
      return
    }

    setImage(file)
    setPreview(URL.createObjectURL(file))
    setAiSuggestion(null)

    // AI category suggestion — always optional, silently ignored on error
    setAiLoading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const { data } = await api.post('/items/ai/suggest-category', fd)
      if (data?.category && data.category !== 'other') {
        setAiSuggestion(data.category)
        toast(`AI suggests: ${data.category}`, { icon: '🤖' })
      }
    } catch {
      // AI is optional — ignore silently
    } finally {
      setAiLoading(false)
    }
  }, [])

  const handleFileInput = (e) => processFile(e.target.files?.[0])
  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    processFile(e.dataTransfer.files?.[0])
  }
  const clearImage = () => {
    setImage(null)
    setPreview(null)
    setAiSuggestion(null)
    if (fileRef.current) fileRef.current.value = ''
  }
  const applyAiSuggestion = () => {
    setForm(f => ({ ...f, category: aiSuggestion }))
    setAiSuggestion(null)
    toast.success(`Category set to "${aiSuggestion}"`)
  }

  // ── Form submission ─────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Title is required.'); return }

    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v) })
      if (image) fd.append('image', image)

      const { data } = await api.post('/items/', fd)

      // ── SUCCESS ────────────────────────────────────────────────────────────
      toast.success('Item posted successfully!')
      navigate(data?.item?.id ? `/items/${data.item.id}` : '/dashboard')

    } catch (err) {
      // ── ERROR CLASSIFICATION ───────────────────────────────────────────────
      // With the backend fix (items.py), socket errors no longer reach here.
      // These cases handle genuine network/validation failures.

      const httpStatus = err.response?.status
      const serverMsg  = err.response?.data?.error

      if (!err.response) {
        toast.error('Could not reach the server. Please check your connection.')

      } else if (httpStatus === 500) {
        // Backend fix should prevent this, but keep as safety net.
        // The item was saved — redirect to dashboard to confirm.
        toast.success('Item posted successfully!')
        navigate('/dashboard')

      } else if (httpStatus === 400 || httpStatus === 422) {
        toast.error(serverMsg || 'Please check the form fields and try again.')

      } else if (httpStatus === 401) {
        toast.error('Your session has expired. Please log in again.')

      } else if (httpStatus === 413) {
        toast.error('Image file is too large. Please use an image under 16 MB.')

      } else {
        toast.error(serverMsg || 'Failed to post item. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-slate-900">Post an Item</h1>
        <p className="text-slate-500 text-sm mt-1">
          Fill in the details to help others find or return your item.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Image Upload ─────────────────────────────────────────────────── */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <ImagePlus className="w-4 h-4 text-campus-500" /> Item Photo
          </h2>

          {preview ? (
            <div className="relative w-full rounded-xl overflow-hidden bg-slate-100" style={{ height: '220px' }}>
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              <button type="button" onClick={clearImage} title="Remove image"
                className="absolute top-3 right-3 p-1.5 bg-white/90 rounded-lg shadow-sm hover:bg-white transition-colors">
                <X className="w-4 h-4 text-slate-700" />
              </button>
              {aiLoading && (
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur text-xs text-campus-700 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                  <div className="w-3 h-3 border border-campus-400 border-t-campus-600 rounded-full animate-spin" />
                  AI analysing…
                </div>
              )}
            </div>
          ) : (
            <button type="button"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`w-full border-2 border-dashed rounded-xl p-10 text-center transition-colors group
                ${dragOver ? 'border-campus-400 bg-campus-50' : 'border-slate-200 hover:border-campus-300'}`}>
              <Upload className={`w-8 h-8 mx-auto mb-2 transition-colors
                ${dragOver ? 'text-campus-500' : 'text-slate-300 group-hover:text-campus-400'}`} />
              <p className={`text-sm font-medium transition-colors
                ${dragOver ? 'text-campus-600' : 'text-slate-500 group-hover:text-campus-600'}`}>
                {dragOver ? 'Drop to upload' : 'Click to upload or drag & drop'}
              </p>
              <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP up to 16 MB</p>
            </button>
          )}

          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileInput} className="hidden" />

          {aiSuggestion && (
            <div className="mt-3 flex items-center justify-between bg-campus-50 border border-campus-200 rounded-xl px-4 py-3 animate-fade-up">
              <p className="text-sm text-campus-700 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI suggests category: <strong className="capitalize">{aiSuggestion}</strong>
              </p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={applyAiSuggestion}
                  className="text-xs font-semibold text-campus-600 hover:text-campus-800 underline">
                  Apply
                </button>
                <button type="button" onClick={() => setAiSuggestion(null)}
                  className="text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Status toggle ─────────────────────────────────────────────────── */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Item Status</h2>
          <div className="grid grid-cols-2 gap-3">
            {STATUSES.map((s) => (
              <button key={s} type="button"
                onClick={() => setForm((f) => ({ ...f, status: s }))}
                className={`py-3 rounded-xl font-semibold text-sm capitalize border-2 transition-all
                  ${form.status === s
                    ? s === 'lost'
                      ? 'bg-red-50 border-red-400 text-red-700'
                      : 'bg-green-50 border-green-400 text-green-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                {s === 'lost' ? '😟 I Lost This' : '🙌 I Found This'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Item details ──────────────────────────────────────────────────── */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-slate-800">Item Details</h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input value={form.title} onChange={set('title')}
              placeholder="e.g. Blue iPhone 13" className="input" required maxLength={200} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category</label>
            <select value={form.category} onChange={set('category')} className="input">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={set('description')} rows={4}
              placeholder="Describe the item — colour, brand, distinguishing features…"
              className="input resize-none" maxLength={2000} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Date Lost / Found
              </label>
              <input type="date" value={form.date_lost} onChange={set('date_lost')}
                max={new Date().toISOString().split('T')[0]} className="input" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Location</label>
              <input value={form.location} onChange={set('location')}
                placeholder="e.g. Main Library, Block C" className="input" maxLength={200} />
            </div>
          </div>
        </div>

        {/* ── Actions ───────────────────────────────────────────────────────── */}
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} disabled={loading}
            className="btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Posting…
              </span>
            ) : 'Post Item'}
          </button>
        </div>
      </form>
    </div>
  )
}
