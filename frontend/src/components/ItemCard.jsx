// src/components/ItemCard.jsx
import { Link } from 'react-router-dom'
import { MapPin, Calendar, Tag } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_STYLES = {
  lost:     'badge-lost',
  found:    'badge-found',
  returned: 'badge-returned',
}

const CATEGORY_EMOJI = {
  phone: '📱', wallet: '👛', bag: '🎒', id_card: '🪪',
  keys: '🔑', book: '📚', laptop: '💻', other: '📦',
}

export default function ItemCard({ item }) {
  const emoji = CATEGORY_EMOJI[item.category] || '📦'

  return (
    <Link to={`/items/${item.id}`} className="group block">
      <article className="card overflow-hidden h-full flex flex-col hover:-translate-y-1 transition-all duration-200">
        {/* Image */}
        <div className="relative h-44 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-5xl select-none">
              {emoji}
            </div>
          )}

          {/* Status badge */}
          <span className={`badge absolute top-3 left-3 shadow-sm capitalize ${STATUS_STYLES[item.status] || 'badge-lost'}`}>
            {item.status}
          </span>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col flex-1 gap-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2 group-hover:text-campus-600 transition-colors">
              {item.title}
            </h3>
            <span className="text-lg shrink-0">{emoji}</span>
          </div>

          {item.description && (
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}

          <div className="mt-auto pt-2 space-y-1 border-t border-slate-50">
            {item.location && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin className="w-3 h-3 shrink-0 text-campus-400" />
                <span className="truncate">{item.location}</span>
              </div>
            )}
            {item.date_lost && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar className="w-3 h-3 shrink-0 text-campus-400" />
                <span>{format(new Date(item.date_lost), 'MMM d, yyyy')}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Tag className="w-3 h-3 shrink-0 text-campus-400" />
              <span className="capitalize">{item.category || 'other'}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-1">By {item.owner_name}</p>
        </div>
      </article>
    </Link>
  )
}
