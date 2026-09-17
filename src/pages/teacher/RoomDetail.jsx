import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  Check,
  Users,
  BarChart2,
  Home,
} from 'lucide-react'
import TeacherSidebar from '../../components/layout/TeacherSidebar.jsx'
import { api } from '../../lib/api.js'
import './teacher-layout.css'
import './RoomDetail.css'

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

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rd-stat-card">
      <div className="rd-stat-icon" style={{ background: color + '1A', color }}>
        <Icon size={20} />
      </div>
      <div>
        <div className="rd-stat-value">{value}</div>
        <div className="rd-stat-label">{label}</div>
      </div>
    </div>
  )
}

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

  const participants = room?.participants ?? []
  const completed = participants.filter(p => p.completed)
  const avgScore = completed.length > 0
    ? Math.round(completed.reduce((sum, p) => sum + (p.score ?? 0), 0) / completed.length)
    : 0

  const gameMeta = room ? (GAME_META[room.game_type] || { label: room.game_type, color: '#718096' }) : {}

  return (
    <div className="teacher-layout">
      <TeacherSidebar />
      <div className="teacher-main">
        <header className="teacher-header">
          <div className="teacher-header-left">
            {/* Breadcrumb */}
            <nav className="rd-breadcrumb">
              <button className="rd-breadcrumb-item rd-breadcrumb-link" onClick={() => navigate('/teacher/dashboard')}>
                <Home size={14} />
                Inicio
              </button>
              <span className="rd-breadcrumb-sep">/</span>
              <button className="rd-breadcrumb-item rd-breadcrumb-link" onClick={() => navigate('/teacher/dashboard')}>
                Mis Salas
              </button>
              {room && (
                <>
                  <span className="rd-breadcrumb-sep">/</span>
                  <span className="rd-breadcrumb-item rd-breadcrumb-current">{room.name}</span>
                </>
              )}
            </nav>
          </div>
          <button className="rd-back-btn" onClick={() => navigate('/teacher/dashboard')}>
            <ArrowLeft size={16} />
            Volver
          </button>
        </header>

        <main className="teacher-content">
          {loading ? (
            <div className="teacher-loader">
              <Loader2 size={32} className="spin" />
              <p>Cargando sala...</p>
            </div>
          ) : error ? (
            <div className="teacher-error">{error}</div>
          ) : (
            <div className="rd-content">
              {/* Room info card */}
              <div className="rd-info-card">
                <div className="rd-info-header">
                  <div className="rd-info-left">
                    <span
                      className="rd-game-badge"
                      style={{ background: gameMeta.color + '1A', color: gameMeta.color }}
                    >
                      {gameMeta.label}
                    </span>
                    <h1 className="rd-room-name">{room.name}</h1>
                    <span className={`rd-status-badge ${room.is_active ? 'rd-status--active' : 'rd-status--inactive'}`}>
                      {room.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <div className="rd-reward-pill">
                    <span>😊</span>
                    <strong>{room.coin_reward ?? room.coinReward} HF</strong>
                    <small>recompensa</small>
                  </div>
                </div>

                {/* Password display */}
                <div className="rd-password-block">
                  <p className="rd-password-label">Codigo de acceso para alumnos</p>
                  <div className="rd-password-row">
                    <code className="rd-password-code">{room.password}</code>
                    <button className="rd-copy-btn" onClick={handleCopy}>
                      {copied ? <><Check size={15} /> Copiado</> : <><Copy size={15} /> Copiar</>}
                    </button>
                  </div>
                  <p className="rd-password-hint">Compartí este codigo con tus alumnos para que puedan unirse.</p>
                </div>
              </div>

              {/* Stats row */}
              <div className="rd-stats-row">
                <StatCard
                  icon={Users}
                  label="Participantes"
                  value={participants.length}
                  color="#3B82F6"
                />
                <StatCard
                  icon={CheckCircle}
                  label="Completados"
                  value={completed.length}
                  color="#10B981"
                />
                <StatCard
                  icon={BarChart2}
                  label="Score promedio"
                  value={completed.length > 0 ? `${avgScore}%` : '—'}
                  color="#8B5CF6"
                />
              </div>

              {/* Participants table */}
              <div className="rd-participants-card">
                <div className="rd-participants-header">
                  <h2 className="rd-participants-title">Participantes</h2>
                </div>

                {participants.length === 0 ? (
                  <div className="rd-empty">
                    <Users size={32} />
                    <p>Aun no hay participantes en esta sala.</p>
                  </div>
                ) : (
                  <div className="rd-table-wrapper">
                    <table className="rd-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Alumno</th>
                          <th>Score</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {participants.map((p, i) => (
                          <tr key={p.id ?? i}>
                            <td className="rd-td-pos">
                              <span className="rd-pos">#{i + 1}</span>
                            </td>
                            <td className="rd-td-name">
                              <div className="rd-participant-row-inner">
                                <div className="rd-participant-avatar">
                                  {getInitials(p.full_name || p.email)}
                                </div>
                                <span>{p.full_name || p.email || 'Alumno'}</span>
                              </div>
                            </td>
                            <td className="rd-td-score">
                              {p.completed ? (
                                <span className="rd-score-badge">{p.score ?? 0}%</span>
                              ) : (
                                <span className="rd-score-pending">—</span>
                              )}
                            </td>
                            <td className="rd-td-status">
                              {p.completed ? (
                                <span className="rd-status-pill rd-status-pill--done">
                                  <CheckCircle size={13} />
                                  Completado
                                </span>
                              ) : (
                                <span className="rd-status-pill rd-status-pill--pending">
                                  <XCircle size={13} />
                                  Pendiente
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
