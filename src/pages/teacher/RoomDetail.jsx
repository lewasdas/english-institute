import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, Loader2, Copy, Check } from 'lucide-react'
import Navbar from '../../components/layout/Navbar.jsx'
import { api } from '../../lib/api.js'
import './RoomDetail.css'

export default function RoomDetail() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api('get', `/api/rooms/${roomId}`)
      .then(({ data }) => setRoom(data))
      .catch(() => setError('No se pudo cargar la sala.'))
      .finally(() => setLoading(false))
  }, [roomId])

  const handleCopy = () => {
    navigator.clipboard.writeText(room.password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="page">
      <Navbar />
      <main className="page-content room-detail-content">
        <button className="back-btn" onClick={() => navigate('/teacher/dashboard')}>
          <ArrowLeft size={18} />
          Volver al panel
        </button>

        {loading ? (
          <div className="rd-loader">
            <Loader2 size={32} className="spin" />
            <p>Cargando sala...</p>
          </div>
        ) : error ? (
          <div className="rd-error">{error}</div>
        ) : (
          <>
            <div className="rd-header">
              <div>
                <h1 className="rd-title">{room.name}</h1>
                <span className={`rd-status ${room.is_active ? 'active' : 'inactive'}`}>
                  {room.is_active ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              <div className="rd-reward">
                <span>Recompensa</span>
                <strong>{room.coin_reward ?? room.coinReward} HF 😊</strong>
              </div>
            </div>

            <div className="rd-password-card">
              <p className="rd-password-label">Contraseña para compartir</p>
              <div className="rd-password-display">
                <span className="rd-password-value">{room.password}</span>
                <button className="rd-copy-btn" onClick={handleCopy}>
                  {copied ? <><Check size={16} /> Copiado</> : <><Copy size={16} /> Copiar</>}
                </button>
              </div>
              <p className="rd-password-hint">Compartí esta contraseña con tus alumnos para que puedan unirse.</p>
            </div>

            <div className="rd-participants-section">
              <div className="rd-participants-header">
                <h2 className="rd-participants-title">Participantes</h2>
                <div className="rd-participants-stats">
                  <span>{room.participants?.length ?? 0} total</span>
                  <span className="rd-stat-completed">
                    {room.participants?.filter(p => p.completed).length ?? 0} completaron
                  </span>
                </div>
              </div>

              {!room.participants || room.participants.length === 0 ? (
                <div className="rd-empty">Aún no hay participantes en esta sala.</div>
              ) : (
                <div className="rd-participants-list">
                  {room.participants.map((p, i) => (
                    <div key={p.id ?? i} className="rd-participant-row">
                      <div className="rd-participant-pos">#{i + 1}</div>
                      <div className="rd-participant-name">{p.full_name || p.email || 'Alumno'}</div>
                      <div className="rd-participant-score">
                        {p.completed ? (
                          <span className="rd-score-value">{p.score ?? 0}%</span>
                        ) : (
                          <span className="rd-score-pending">—</span>
                        )}
                      </div>
                      <div className="rd-participant-status">
                        {p.completed ? (
                          <CheckCircle size={20} className="rd-icon-completed" />
                        ) : (
                          <XCircle size={20} className="rd-icon-pending" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
