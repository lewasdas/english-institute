import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, ToggleLeft, ToggleRight, Loader2, DoorOpen } from 'lucide-react'
import Navbar from '../../components/layout/Navbar.jsx'
import { api } from '../../lib/api.js'
import './Dashboard.css'

const GAME_LABELS = {
  multiple_choice: 'Multiple Choice',
  hangman: 'Ahorcado',
  fill_blanks: 'Completar',
  vocab_match: 'Vocab Match',
  sentence_order: 'Ordenar',
  translation: 'Traducción',
}

export default function TeacherDashboard() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [togglingId, setTogglingId] = useState(null)

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
      setRooms(prev => prev.map(r => r.id === room.id ? { ...r, is_active: data.is_active } : r))
    } catch {
      alert('Error al cambiar el estado de la sala.')
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="page">
      <Navbar />
      <main className="page-content teacher-dashboard">
        <div className="teacher-dash-header">
          <div>
            <h1 className="teacher-dash-title">Panel Profesor</h1>
            <p className="teacher-dash-subtitle">Gestioná tus salas de juego</p>
          </div>
          <button
            className="create-room-btn"
            onClick={() => navigate('/teacher/create-room')}
          >
            <Plus size={20} />
            Crear Sala
          </button>
        </div>

        {loading ? (
          <div className="teacher-loader">
            <Loader2 size={28} className="spin" />
            <p>Cargando salas...</p>
          </div>
        ) : error ? (
          <div className="teacher-error">{error}</div>
        ) : rooms.length === 0 ? (
          <div className="teacher-empty">
            <DoorOpen size={48} />
            <p>No tenés salas creadas. ¡Creá una para empezar!</p>
            <button className="create-room-btn" onClick={() => navigate('/teacher/create-room')}>
              <Plus size={18} /> Crear primera sala
            </button>
          </div>
        ) : (
          <div className="rooms-list">
            {rooms.map(room => (
              <div key={room.id} className={`room-card ${!room.is_active ? 'room-card--inactive' : ''}`}>
                <div className="room-card-top">
                  <div className="room-card-info">
                    <div className="room-card-name-row">
                      <h3 className="room-card-name">{room.name}</h3>
                      <span className={`room-status-badge ${room.is_active ? 'active' : 'inactive'}`}>
                        {room.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    <div className="room-card-meta">
                      <span className="room-meta-tag">{GAME_LABELS[room.game_type] || room.game_type}</span>
                      <span className="room-meta-tag room-meta-tag--gold">{room.coin_reward} HF 😊</span>
                    </div>
                  </div>
                </div>

                <div className="room-card-password">
                  <span className="room-pwd-label">Contraseña</span>
                  <code className="room-pwd-value">{room.password}</code>
                </div>

                <div className="room-card-stats">
                  <div className="room-stat">
                    <strong>{room.participants_count ?? 0}</strong>
                    <span>Participantes</span>
                  </div>
                  <div className="room-stat">
                    <strong>{room.completed_count ?? 0}</strong>
                    <span>Completaron</span>
                  </div>
                </div>

                <div className="room-card-actions">
                  <button
                    className="room-action-btn room-action-btn--view"
                    onClick={() => navigate(`/teacher/room/${room.id}`)}
                  >
                    <Eye size={16} />
                    Ver detalle
                  </button>
                  <button
                    className="room-action-btn room-action-btn--toggle"
                    onClick={() => handleToggle(room)}
                    disabled={togglingId === room.id}
                  >
                    {togglingId === room.id ? (
                      <Loader2 size={16} className="spin" />
                    ) : room.is_active ? (
                      <><ToggleRight size={16} /> Desactivar</>
                    ) : (
                      <><ToggleLeft size={16} /> Activar</>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
