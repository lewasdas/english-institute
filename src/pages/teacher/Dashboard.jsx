import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Eye,
  Loader2,
  Search,
  Users,
  CheckCircle,
  Star,
  Lock,
} from 'lucide-react'
import TeacherSidebar from '../../components/layout/TeacherSidebar.jsx'
import { api } from '../../lib/api.js'
import useAuth from '../../hooks/useAuth.js'
import './teacher-layout.css'
import './Dashboard.css'

const GAME_META = {
  multiple_choice: { label: 'Quiz', color: '#8B5CF6' },
  hangman: { label: 'Ahorcado', color: '#EF4444' },
  fill_blanks: { label: 'Completar', color: '#F59E0B' },
  vocab_match: { label: 'Vocab', color: '#10B981' },
  sentence_order: { label: 'Ordenar', color: '#3B82F6' },
  translation: { label: 'Traduccion', color: '#EC4899' },
}

function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function RoomCard({ room, onToggle, togglingId, onView }) {
  const meta = GAME_META[room.game_type] || { label: room.game_type, color: '#718096' }
  const isToggling = togglingId === room.id

  return (
    <div className={`room-card ${!room.is_active ? 'room-card--inactive' : ''}`}>
      <div className="room-card-header">
        <span
          className="room-card-badge"
          style={{ background: meta.color + '1A', color: meta.color }}
        >
          {meta.label}
        </span>
        <h3 className="room-card-name">{room.name}</h3>
      </div>

      <div className="room-card-password">
        <Lock size={14} className="room-pwd-icon" />
        <code className="room-pwd-value">{room.password}</code>
      </div>

      <div className="room-card-stats">
        <div className="room-stat">
          <Users size={14} />
          <span>{room.participants_count ?? 0}</span>
          <small>Participantes</small>
        </div>
        <div className="room-stat">
          <CheckCircle size={14} />
          <span>{room.completed_count ?? 0}</span>
          <small>Completados</small>
        </div>
        <div className="room-stat">
          <Star size={14} />
          <span>{room.coin_reward ?? 0}</span>
          <small>HF</small>
        </div>
      </div>

      <div className="room-card-footer">
        <label className="toggle-switch" title={room.is_active ? 'Desactivar' : 'Activar'}>
          <input
            type="checkbox"
            checked={!!room.is_active}
            onChange={() => onToggle(room)}
            disabled={isToggling}
          />
          <span className="toggle-track">
            <span className="toggle-thumb" />
          </span>
          <span className="toggle-label">{room.is_active ? 'Activa' : 'Inactiva'}</span>
        </label>
        <button
          className="room-view-btn"
          onClick={() => onView(room.id)}
          disabled={isToggling}
        >
          <Eye size={14} />
          Ver detalle
        </button>
      </div>
    </div>
  )
}

function EmptyState({ onCreateRoom, onTutorial }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">🎮</div>
      <h2 className="empty-state-title">No tenes salas activas</h2>
      <p className="empty-state-subtitle">
        Crea tu primera sala y empieza a jugar con tus alumnos
      </p>
      <div className="empty-state-actions">
        <button className="empty-btn empty-btn--primary" onClick={onCreateRoom}>
          <Plus size={16} />
          Crear primera sala
        </button>
        <button className="empty-btn empty-btn--outline" onClick={onTutorial}>
          Ver tutorial
        </button>
      </div>
    </div>
  )
}

export default function TeacherDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [togglingId, setTogglingId] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('Todas')
  const [toast, setToast] = useState('')

  const displayName = user?.full_name || user?.email || 'Profesor'
  const initials = getInitials(user?.full_name || user?.email || 'P')

  useEffect(() => {
    api('get', '/api/rooms?action=my-rooms')
      .then(({ data }) => setRooms(data))
      .catch(() => setError('No se pudieron cargar las salas.'))
      .finally(() => setLoading(false))
  }, [])

  const handleToggle = async (room) => {
    setTogglingId(room.id)
    try {
      const { data } = await api('put', `/api/rooms/${room.id}/toggle`)
      setRooms(prev =>
        prev.map(r => r.id === room.id ? { ...r, is_active: data.is_active } : r)
      )
    } catch {
      alert('Error al cambiar el estado de la sala.')
    } finally {
      setTogglingId(null)
    }
  }

  const showTutorialToast = () => {
    setToast('Proxximamente...')
    setTimeout(() => setToast(''), 3000)
  }

  const filteredRooms = rooms.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase())
    const matchesFilter =
      filter === 'Todas' ||
      (filter === 'Activas' && r.is_active) ||
      (filter === 'Inactivas' && !r.is_active)
    return matchesSearch && matchesFilter
  })

  return (
    <div className="teacher-layout">
      <TeacherSidebar />

      <div className="teacher-main">
        <header className="teacher-header">
          <div className="teacher-header-left">
            <h1 className="teacher-header-title">Mis Salas</h1>
            <p className="teacher-header-subtitle">Gestion de salas de juego</p>
          </div>
          <div className="teacher-header-right">
            <div className="search-bar">
              <Search size={16} className="search-icon" />
              <input
                className="search-input"
                placeholder="Buscar sala..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="filter-select"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            >
              <option>Todas</option>
              <option>Activas</option>
              <option>Inactivas</option>
            </select>
            <div className="header-avatar" title={displayName}>{initials}</div>
          </div>
        </header>

        <main className="teacher-content">
          {loading ? (
            <div className="teacher-loader">
              <Loader2 size={32} className="spin" />
              <p>Cargando salas...</p>
            </div>
          ) : error ? (
            <div className="teacher-error">{error}</div>
          ) : filteredRooms.length === 0 && rooms.length === 0 ? (
            <EmptyState
              onCreateRoom={() => navigate('/teacher/create-room')}
              onTutorial={showTutorialToast}
            />
          ) : (
            <>
              {filteredRooms.length === 0 ? (
                <div className="teacher-no-results">
                  No hay salas que coincidan con la busqueda.
                </div>
              ) : (
                <div className="rooms-grid">
                  {filteredRooms.map(room => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      onToggle={handleToggle}
                      togglingId={togglingId}
                      onView={id => navigate(`/teacher/room/${id}`)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {toast && <div className="toast-notification">{toast}</div>}
    </div>
  )
}
