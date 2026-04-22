// src/components/ChatBox.jsx
import { useState, useEffect, useRef } from 'react'
import { Send, X, MessageSquare } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import api from '../api/axios'
import { format } from 'date-fns'

export default function ChatBox({ partner, itemId, onClose }) {
  const { user }          = useAuth()
  const { socket }        = useSocket()
  const [messages, setMessages] = useState([])
  const [text, setText]         = useState('')
  const [loading, setLoading]   = useState(true)
  const endRef                  = useRef(null)

  // Load history
  useEffect(() => {
    if (!partner?.id) return
    setLoading(true)
    api.get(`/chat/history/${partner.id}`)
      .then(r => setMessages(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [partner?.id])

  // Join chat room and listen for new messages
  useEffect(() => {
    if (!socket?.current || !partner?.id) return
    const token = localStorage.getItem('token')
    socket.current.emit('join_chat', { token, partner_id: partner.id })

    const handleMsg = (msg) => {
      const relevant =
        (msg.sender_id === user.id && msg.receiver_id === partner.id) ||
        (msg.sender_id === partner.id && msg.receiver_id === user.id)
      if (relevant) {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.find(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      }
    }

    socket.current.on('new_message', handleMsg)

    return () => {
      socket.current.off('new_message', handleMsg)
      socket.current.emit('leave_chat', { token, partner_id: partner.id })
    }
  }, [socket, partner?.id, user?.id])

  // Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    const content = text.trim()
    if (!content || !socket?.current) return
    const token = localStorage.getItem('token')
    socket.current.emit('send_message', {
      token,
      receiver_id: partner.id,
      content,
      item_id: itemId || null,
    })
    setText('')
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 sm:w-96 z-50 animate-slide-in">
      <div className="card shadow-2xl border border-slate-200 flex flex-col overflow-hidden" style={{ height: '480px' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-campus-600 text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold">
              {partner.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-sm">{partner.name}</p>
              {itemId && <p className="text-[11px] text-campus-200">Re: item #{itemId}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-campus-200 border-t-campus-500 rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
              <MessageSquare className="w-8 h-8 opacity-40" />
              <p className="text-sm">No messages yet. Say hello!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === user.id
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm
                    ${isMe
                      ? 'bg-campus-600 text-white rounded-tr-sm'
                      : 'bg-white text-slate-800 shadow-sm rounded-tl-sm border border-slate-100'}`}>
                    <p className="leading-relaxed">{msg.content}</p>
                    <p className={`text-[10px] mt-0.5 ${isMe ? 'text-campus-200' : 'text-slate-400'}`}>
                      {format(new Date(msg.created_at), 'HH:mm')}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-slate-100 bg-white">
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type a message..."
              rows={1}
              className="input resize-none text-sm flex-1 max-h-24"
              style={{ minHeight: '40px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!text.trim()}
              className="btn-primary p-2.5 !px-3 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
