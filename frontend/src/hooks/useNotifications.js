// src/hooks/useNotifications.js
import { useEffect } from 'react'
import { useSocket } from '../context/SocketContext'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

/**
 * On mount, loads persisted notifications from the server
 * into the SocketContext (which also holds real-time ones).
 */
export function useNotifications() {
  const { user }              = useAuth()
  const { setNotifications }  = useSocket()

  useEffect(() => {
    if (!user) return
    api.get('/items/notifications')
      .then(r => setNotifications(r.data))
      .catch(console.error)
  }, [user?.id])
}
