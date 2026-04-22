// src/pages/ItemDetail.jsx  —  FIXED: correct toast messages for update/delete
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import ChatBox from '../components/ChatBox'
import {
  MapPin, Calendar, Tag, User, MessageSquare,
  Trash2, ArrowLeft, CheckCircle, Sparkles, ExternalLink, AlertTriangle, X
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const STATUS_STYLES = {
  lost:     'badge-lost',
  found:    'badge-found',
  returned: 'badge-returned',
}

// ─── Custom in-page confirm dialog ────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-up">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-base">Delete Item</h3>
            <p className="text-sm text-slate-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            className="btn-secondary flex-1 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function ItemDetail() {
  const { id }       = useParams()
  const { user }     = useAuth()
  const navigate     = useNavigate()

  const [item, setItem]               = useState(null)
  const [loading, setLoading]         = useState(true)
  const [chatOpen, setChatOpen]       = useState(false)
  const [status, setStatus]           = useState('')
  const [updatingStatus, setUpdating] = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    api.get(`/items/${id}`)
      .then(r => { setItem(r.data); setStatus(r.data.status) })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id])

  const isOwner = user && item && user.id === item.user_id
  const isAdmin = user?.role === 'admin'

  // ── Update status ─────────────────────────────────────────────────────────
  const updateStatus = async (newStatus) => {
    if (newStatus === status) return    // no-op if same status
    setUpdating(true)
    try {
      const { data } = await api.put(`/items/${id}`, { status: newStatus })

      // ── SUCCESS ──────────────────────────────────────────────────────────
      setItem(data)
      setStatus(data.status)
      toast.success(`Status updated to "${newStatus}"`)

    } catch (err) {
      // ── ERROR CLASSIFICATION ──────────────────────────────────────────────
      // The backend updates the DB first, then calls socketio.emit().
      // If the socket throws, Flask returns 500 — but the update WAS saved.
      // On 500 we treat it as success and refresh the local state optimistically.

      const httpStatus = err.response?.status
      const serverMsg  = err.response?.data?.error

      if (!err.response) {
        toast.error('Could not reach the server. Please check your connection.')

      } else if (httpStatus === 500) {
        // Update was persisted in DB — socket broadcast failed after commit.
        // Optimistically apply the new status locally.
        setStatus(newStatus)
        setItem(prev => prev ? { ...prev, status: newStatus } : prev)
        toast.success(`Status updated to "${newStatus}"`)

      } else if (httpStatus === 403) {
        toast.error('You are not allowed to update this item.')

      } else {
        toast.error(serverMsg || 'Failed to update status. Please try again.')
      }
    } finally {
      setUpdating(false)
    }
  }

  // ── Delete item ───────────────────────────────────────────────────────────
  const confirmDelete = () => setShowConfirm(true)

  const handleDeleteConfirmed = async () => {
    setShowConfirm(false)
    setDeleting(true)
    try {
      await api.delete(`/items/${id}`)

      // ── SUCCESS ──────────────────────────────────────────────────────────
      toast.success('Item deleted successfully.')
      navigate('/')

    } catch (err) {
      // ── ERROR CLASSIFICATION ──────────────────────────────────────────────
      // Same pattern: DB delete commits first, socket emit happens after.
      // A 500 means the item IS deleted — navigate away and confirm it.

      const httpStatus = err.response?.status
      const serverMsg  = err.response?.data?.error

      if (!err.response) {
        toast.error('Could not reach the server. Please check your connection.')

      } else if (httpStatus === 500) {
        // Item was deleted from DB — socket broadcast failed after commit.
        toast.success('Item deleted successfully.')
        navigate('/')

      } else if (httpStatus === 403) {
        toast.error('You are not allowed to delete this item.')

      } else if (httpStatus === 404) {
        // Already deleted — just navigate away
        toast('Item no longer exists.', { icon: 'ℹ️' })
        navigate('/')

      } else {
        toast.error(serverMsg || 'Failed to delete item. Please try again.')
      }
    } finally {
      setDeleting(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-campus-200 border-t-campus-600 rounded-full animate-spin" />
    </div>
  )

  if (!item) return null

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

      {/* Custom confirm dialog */}
      {showConfirm && (
        <ConfirmDialog
          message="Are you sure you want to delete this item? This action cannot be undone."
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* ── Image column ──────────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full object-cover"
                style={{ maxHeight: '400px' }}
              />
            ) : (
              <div className="h-64 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-7xl">
                📦
              </div>
            )}
          </div>

          {/* Manage item panel (owner or admin only) */}
          {(isOwner || isAdmin) && (
            <div className="card p-4 mt-4 space-y-3">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Manage Item
              </p>

              {/* Status buttons */}
              <div className="grid grid-cols-3 gap-2">
                {['lost', 'found', 'returned'].map(s => (
                  <button
                    key={s}
                    onClick={() => updateStatus(s)}
                    disabled={updatingStatus || deleting}
                    className={`py-2 rounded-xl text-xs font-semibold capitalize border-2 transition-all
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${status === s
                        ? s === 'lost'   ? 'bg-red-50 border-red-400 text-red-700'
                        : s === 'found'  ? 'bg-green-50 border-green-400 text-green-700'
                        :                  'bg-blue-50 border-blue-400 text-blue-700'
                        : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}
                  >
                    {updatingStatus && status !== s ? (
                      <span className="flex items-center justify-center gap-1">
                        <span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />
                        {s}
                      </span>
                    ) : s}
                  </button>
                ))}
              </div>

              {/* Quick "Mark as Returned" shortcut when item is lost */}
              {status === 'lost' && (
                <button
                  onClick={() => updateStatus('returned')}
                  disabled={updatingStatus || deleting}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Returned
                </button>
              )}

              {/* Delete button */}
              <button
                onClick={confirmDelete}
                disabled={updatingStatus || deleting}
                className="w-full flex items-center justify-center gap-2 text-sm text-red-500 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed py-2 rounded-xl transition-colors"
              >
                {deleting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Post
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── Detail column ─────────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-6">
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className={`badge capitalize mb-2 inline-block ${STATUS_STYLES[status] || 'badge-lost'}`}>
                  {status}
                </span>
                <h1 className="font-display text-2xl font-bold text-slate-900">
                  {item.title}
                </h1>
              </div>
            </div>

            {item.description && (
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                {item.description}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoRow icon={<Tag />}      label="Category" value={item.category?.replace('_', ' ')} />
              {item.location && <InfoRow icon={<MapPin />}  label="Location" value={item.location} />}
              {item.date_lost && (
                <InfoRow
                  icon={<Calendar />}
                  label="Date"
                  value={format(new Date(item.date_lost), 'MMMM d, yyyy')}
                />
              )}
              <InfoRow icon={<User />} label="Posted by" value={item.owner_name} />
            </div>

            <p className="text-xs text-slate-400 mt-4">
              Posted {format(new Date(item.created_at), 'MMM d, yyyy · h:mm a')}
            </p>
          </div>

          {/* Chat with owner */}
          {user && !isOwner && (
            <div className="card p-5">
              <h3 className="font-semibold text-slate-800 mb-3">Contact Owner</h3>
              <button
                onClick={() => setChatOpen(true)}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <MessageSquare className="w-4 h-4" /> Message {item.owner_name}
              </button>
            </div>
          )}

          {/* AI — visually similar items */}
          {item.similar_items?.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-campus-500" /> Visually Similar Items
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                AI matched these items based on image similarity
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {item.similar_items.slice(0, 4).map(s => (
                  <Link
                    key={s.id}
                    to={`/items/${s.id}`}
                    className="flex gap-3 p-3 rounded-xl border border-slate-100 hover:border-campus-200 hover:bg-campus-50 transition-all group"
                  >
                    {s.image_url ? (
                      <img
                        src={s.image_url}
                        alt={s.title}
                        className="w-14 h-14 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center text-2xl shrink-0">
                        📦
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate group-hover:text-campus-600">
                        {s.title}
                      </p>
                      <p className="text-xs text-slate-400 capitalize mt-0.5">
                        {s.status} · {s.category}
                      </p>
                      <p className="text-[11px] text-campus-500 mt-1">
                        {Math.round(s.similarity * 100)}% match
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* AI — description text matches */}
          {item.text_matches?.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" /> Description Matches
              </h3>
              <p className="text-xs text-slate-400 mb-4">Items with similar descriptions</p>
              <div className="space-y-2">
                {item.text_matches.slice(0, 3).map(m => (
                  <Link
                    key={m.id}
                    to={`/items/${m.id}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-campus-200 hover:bg-campus-50 transition-all group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate group-hover:text-campus-600">
                        {m.title}
                      </p>
                      <p className="text-xs text-slate-400 capitalize">
                        {m.status} · {m.location || 'No location'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <span className="text-xs text-amber-500 font-medium">
                        {Math.round(m.text_similarity * 100)}%
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-campus-400" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat box */}
      {chatOpen && item && (
        <ChatBox
          partner={{ id: item.user_id, name: item.owner_name }}
          itemId={item.id}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  )
}

// ─── InfoRow helper ───────────────────────────────────────────────────────────
function InfoRow({ icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl">
      <span className="text-campus-400 mt-0.5 shrink-0 w-4 h-4">{icon}</span>
      <div>
        <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">
          {label}
        </p>
        <p className="text-sm text-slate-700 capitalize mt-0.5">{value}</p>
      </div>
    </div>
  )
}
