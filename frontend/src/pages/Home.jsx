// src/pages/Home.jsx
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'
import { useAuth } from '../context/AuthContext'
import ItemCard from '../components/ItemCard'
import api from '../api/axios'
import {
  Search, SlidersHorizontal, X, ChevronLeft, ChevronRight,
  AlertCircle, Sparkles, PlusCircle
} from 'lucide-react'

const CATEGORIES = ['all', 'phone', 'wallet', 'bag', 'id_card', 'keys', 'book', 'laptop', 'other']
const STATUSES   = ['all', 'lost', 'found', 'returned']

export default function Home() {
  const { user }                     = useAuth()
  const { newItems, clearNew }       = useSocket()
  const [searchParams, setSearchParams] = useSearchParams()

  const [items, setItems]       = useState([])
  const [total, setTotal]       = useState(0)
  const [pages, setPages]       = useState(1)
  const [loading, setLoading]   = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [showBanner, setShowBanner]   = useState(false)

  const [filters, setFilters] = useState({
    q:         searchParams.get('q') || '',
    category:  searchParams.get('category') || 'all',
    status:    searchParams.get('status') || 'all',
    location:  searchParams.get('location') || '',
    date_from: searchParams.get('date_from') || '',
    date_to:   searchParams.get('date_to') || '',
    page:      parseInt(searchParams.get('page') || '1'),
  })

  const fetchItems = useCallback(async (f = filters) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (f.q)        params.set('q', f.q)
      if (f.category && f.category !== 'all') params.set('category', f.category)
      if (f.status   && f.status   !== 'all') params.set('status', f.status)
      if (f.location)  params.set('location', f.location)
      if (f.date_from) params.set('date_from', f.date_from)
      if (f.date_to)   params.set('date_to', f.date_to)
      params.set('page', f.page)
      params.set('per_page', 12)

      const { data } = await api.get(`/items/?${params}`)
      setItems(data.items)
      setTotal(data.total)
      setPages(data.pages)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Show banner when new real-time items arrive
  useEffect(() => {
    if (newItems.length > 0) setShowBanner(true)
  }, [newItems])

  useEffect(() => { fetchItems(filters) }, [filters.page])

  const applyFilters = (e) => {
    e.preventDefault()
    const updated = { ...filters, page: 1 }
    setFilters(updated)
    fetchItems(updated)
  }

  const clearFilters = () => {
    const reset = { q: '', category: 'all', status: 'all', location: '', date_from: '', date_to: '', page: 1 }
    setFilters(reset)
    fetchItems(reset)
  }

  const hasActiveFilters = filters.q || filters.category !== 'all' || filters.status !== 'all' ||
                            filters.location || filters.date_from || filters.date_to

  const loadNewItems = () => {
    clearNew()
    setShowBanner(false)
    fetchItems({ ...filters, page: 1 })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Hero Banner */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-campus-700 to-campus-500 text-white p-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10">
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">
            Campus Lost & Found
          </h1>
          <p className="text-campus-100 text-base max-w-lg">
            Help reunite lost items with their owners. Post what you've lost or found on campus.
          </p>
          {!user && (
            <div className="flex gap-3 mt-5">
              <Link to="/register" className="bg-white text-campus-700 hover:bg-campus-50 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors">
                Get Started
              </Link>
              <Link to="/login" className="border border-white/40 text-white hover:bg-white/10 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors">
                Sign In
              </Link>
            </div>
          )}
          {user && (
            <Link to="/post"
              className="inline-flex items-center gap-2 mt-5 bg-white text-campus-700 hover:bg-campus-50 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors">
              <PlusCircle className="w-4 h-4" /> Post an Item
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-6 text-center">
          <div>
            <p className="text-2xl font-bold font-display">{total}</p>
            <p className="text-xs text-campus-200 mt-0.5">Items Listed</p>
          </div>
        </div>
      </div>

      {/* Real-time new items banner */}
      {showBanner && (
        <div className="mb-4 flex items-center justify-between bg-campus-50 border border-campus-200 rounded-xl px-4 py-3 text-campus-700 animate-fade-up">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            {newItems.length} new item{newItems.length > 1 ? 's' : ''} just posted!
          </div>
          <div className="flex gap-2">
            <button onClick={loadNewItems} className="text-xs font-semibold text-campus-600 hover:text-campus-800 underline">
              Refresh
            </button>
            <button onClick={() => setShowBanner(false)} className="text-campus-400 hover:text-campus-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Search + Filter row */}
      <form onSubmit={applyFilters} className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={filters.q}
            onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
            placeholder="Search by keyword..."
            className="input pl-9"
          />
        </div>
        <button type="submit" className="btn-primary shrink-0">Search</button>
        <button type="button" onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary shrink-0 flex items-center gap-2 ${showFilters ? 'border-campus-300 bg-campus-50 text-campus-700' : ''}`}>
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:block">Filters</span>
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-campus-500" />}
        </button>
        {hasActiveFilters && (
          <button type="button" onClick={clearFilters} className="btn-secondary shrink-0 text-red-500 hover:border-red-200 hover:bg-red-50">
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Filter panel */}
      {showFilters && (
        <div className="card p-5 mb-6 animate-fade-up grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Category</label>
            <select value={filters.category}
              onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
              className="input text-sm">
              {CATEGORIES.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
            <select value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
              className="input text-sm">
              {STATUSES.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Location</label>
            <input
              value={filters.location}
              onChange={e => setFilters(f => ({ ...f, location: e.target.value }))}
              placeholder="e.g. Library, Block A"
              className="input text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Date Range</label>
            <div className="flex gap-2">
              <input type="date" value={filters.date_from}
                onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))}
                className="input text-sm flex-1" />
              <input type="date" value={filters.date_to}
                onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))}
                className="input text-sm flex-1" />
            </div>
          </div>
          <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
            <button type="submit" onClick={applyFilters} className="btn-primary text-sm">Apply Filters</button>
          </div>
        </div>
      )}

      {/* Category quick-filter pills */}
      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIES.map(c => (
          <button key={c}
            onClick={() => { const f = { ...filters, category: c, page: 1 }; setFilters(f); fetchItems(f) }}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all capitalize
              ${filters.category === c
                ? 'bg-campus-600 text-white border-campus-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-campus-300 hover:bg-campus-50'}`}>
            {c === 'all' ? '🌐 All' : c === 'id_card' ? '🪪 ID Card' : c === 'phone' ? '📱 Phone' :
             c === 'wallet' ? '👛 Wallet' : c === 'bag' ? '🎒 Bag' : c === 'keys' ? '🔑 Keys' :
             c === 'book' ? '📚 Book' : c === 'laptop' ? '💻 Laptop' : `📦 ${c}`}
          </button>
        ))}
      </div>

      {/* Results info */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          {loading ? 'Loading...' : `${total} item${total !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card overflow-hidden animate-pulse">
              <div className="h-44 bg-slate-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-600 mb-1">No items found</h3>
          <p className="text-sm text-slate-400">Try adjusting your search or filters</p>
          {user && (
            <Link to="/post" className="inline-flex items-center gap-2 mt-4 btn-primary text-sm">
              <PlusCircle className="w-4 h-4" /> Post an Item
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map(item => <ItemCard key={item.id} item={item} />)}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button
            onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
            disabled={filters.page === 1}
            className="btn-secondary p-2 disabled:opacity-40">
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button key={p}
              onClick={() => setFilters(f => ({ ...f, page: p }))}
              className={`w-9 h-9 rounded-xl text-sm font-medium transition-all
                ${p === filters.page ? 'bg-campus-600 text-white shadow-sm' : 'btn-secondary'}`}>
              {p}
            </button>
          ))}
          <button
            onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
            disabled={filters.page === pages}
            className="btn-secondary p-2 disabled:opacity-40">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
