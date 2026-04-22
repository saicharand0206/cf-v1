// src/hooks/useItems.js
import { useState, useCallback } from 'react'
import api from '../api/axios'

/**
 * Reusable hook for fetching items with filters.
 * Usage:
 *   const { items, total, pages, loading, fetchItems } = useItems()
 */
export function useItems(defaultPerPage = 12) {
  const [items, setItems]   = useState([])
  const [total, setTotal]   = useState(0)
  const [pages, setPages]   = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)

  const fetchItems = useCallback(async (filters = {}) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filters.q)        params.set('q', filters.q)
      if (filters.category && filters.category !== 'all') params.set('category', filters.category)
      if (filters.status   && filters.status   !== 'all') params.set('status', filters.status)
      if (filters.location)  params.set('location', filters.location)
      if (filters.date_from) params.set('date_from', filters.date_from)
      if (filters.date_to)   params.set('date_to', filters.date_to)
      params.set('page', filters.page || 1)
      params.set('per_page', filters.per_page || defaultPerPage)

      const { data } = await api.get(`/items/?${params}`)
      setItems(data.items)
      setTotal(data.total)
      setPages(data.pages)
      return data
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load items')
      return null
    } finally {
      setLoading(false)
    }
  }, [defaultPerPage])

  return { items, setItems, total, pages, loading, error, fetchItems }
}
