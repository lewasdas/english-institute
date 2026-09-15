import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, ArrowLeft, Loader2 } from 'lucide-react'
import Navbar from '../../components/layout/Navbar.jsx'
import { api } from '../../lib/api.js'
import './JoinRoom.css'

export default function JoinRoom() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password.trim()) return
    setError('')
    setLoading(true)
    try {
      const { data } = await api('post', '/api/rooms/join', { password: password.trim() })
      navigate(`/student/room/${data.roomId}`)
    } catch (err) {
      const msg = err.response?.data?.error || 'Contraseña incorrecta o sala no encontrada.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <Navbar />
      <main className="page-content join-room-content">
        <button className="back-btn" onClick={() => navigate('/student/dashboard')}>
          <ArrowLeft size={18} />
          Volver
        </button>

        <div className="join-room-card">
          <div className="join-room-icon">
            <KeyRound size={36} />
          </div>
          <h1 className="join-room-title">Unirse a Sala</h1>
          <p className="join-room-subtitle">
            Ingresá la contraseña que te dio tu profe
          </p>

          <form onSubmit={handleSubmit} className="join-room-form">
            <input
              type="text"
              className="join-room-input"
              placeholder="Contraseña de la sala..."
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
              autoComplete="off"
              spellCheck="false"
            />

            {error && (
              <div className="join-room-error">{error}</div>
            )}

            <button
              type="submit"
              className="join-room-submit"
              disabled={loading || !password.trim()}
            >
              {loading ? (
                <><Loader2 size={20} className="spin" /> Buscando sala...</>
              ) : (
                'Unirse 🚀'
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
