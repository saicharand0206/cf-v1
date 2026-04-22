// src/context/SocketContext.jsx
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { user }             = useAuth()
  const socketRef            = useRef(null)
  const [notifications, setNotifications] = useState([])
  const [newItems, setNewItems]           = useState([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    // Connect with auth token
    socketRef.current = io('/', { auth: { token }, transports: ['websocket', 'polling'] })

    const socket = socketRef.current

    socket.on('connect', () => console.log('Socket connected'))
    socket.on('disconnect', () => console.log('Socket disconnected'))

    socket.on('notification', (data) => {
      setNotifications(prev => [{ id: Date.now(), message: data.message, read: false, created_at: new Date().toISOString() }, ...prev])
      toast(data.message, { icon: '🔔', duration: 4000 })
    })

    socket.on('new_item', (item) => {
      setNewItems(prev => [item, ...prev])
    })

    return () => { socket.disconnect() }
  }, [user])

  const markRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const clearNew = () => setNewItems([])

  return (
    <SocketContext.Provider value={{ socket: socketRef, notifications, setNotifications, markRead, newItems, clearNew }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
