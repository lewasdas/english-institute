import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, Trophy, ArrowLeft } from 'lucide-react'
import Navbar from '../../components/layout/Navbar.jsx'
import { api } from '../../lib/api.js'
import MultipleChoice from '../../games/MultipleChoice.jsx'
import Hangman from '../../games/Hangman.jsx'
import FillBlanks from '../../games/FillBlanks.jsx'
import VocabMatch from '../../games/VocabMatch.jsx'
import SentenceOrder from '../../games/SentenceOrder.jsx'
import Translation from '../../games/Translation.jsx'
import './GameRoom.css'

const GAME_LABELS = {
  multiple_choice: 'Multiple Choice',
  hangman: 'Ahorcado',
  fill_blanks: 'Completar oraciones',
  vocab_match: 'Emparejar vocabulario',
  sentence_order: 'Ordenar oración',
  translation: 'Traducción',
}

export default function GameRoom() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [gameFinished, setGameFinished] = useState(false)
  const [earnedHF, setEarnedHF] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api('get', `/api/rooms/${roomId}`)
      .then(({ data }) => setRoom(data))
      .catch(() => setError('No se pudo cargar la sala.'))
      .finally(() => setLoading(false))
  }, [roomId])

  const handleComplete = async (score) => {
    setSubmitting(true)
    try {
      const { data } = await api('post', '/api/games/complete', { roomId, score })
      setEarnedHF(data.coinsEarned ?? room?.coinReward ?? 0)
    } catch {
      setEarnedHF(room?.coinReward ?? 0)
    } finally {
      setSubmitting(false)
      setGameFinished(true)
    }
  }

  const renderGame = () => {
    if (!room) return null
    const props = { config: room.config, onComplete: handleComplete }
    switch (room.gameType) {
      case 'multiple_choice': return <MultipleChoice {...props} />
      case 'hangman': return <Hangman {...props} />
      case 'fill_blanks': return <FillBlanks {...props} />
      case 'vocab_match': return <VocabMatch {...props} />
      case 'sentence_order': return <SentenceOrder {...props} />
      case 'translation': return <Translation {...props} />
      default: return <p style={{ color: 'var(--color-text-muted)' }}>Tipo de juego desconocido.</p>
    }
  }

  return (
    <div className="page">
      <Navbar />
      <main className="page-content game-room-content">
        {loading ? (
          <div className="game-room-loader">
            <Loader2 size={36} className="spin" />
            <p>Cargando sala...</p>
          </div>
        ) : error ? (
          <div className="game-room-error-screen">
            <p>{error}</p>
            <button onClick={() => navigate('/student/dashboard')}>Volver al inicio</button>
          </div>
        ) : gameFinished ? (
          <div className="game-finish-screen">
            <div className="confetti-wrapper">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className={`confetti-piece confetti-piece--${(i % 6) + 1}`} style={{ '--delay': `${Math.random() * 2}s`, '--x': `${Math.random() * 100}%` }} />
              ))}
            </div>
            <Trophy size={64} className="trophy-icon" />
            <h2 className="finish-title">¡Felicitaciones!</h2>
            <p className="finish-subtitle">Completaste el juego</p>
            <div className="finish-reward">
              +{earnedHF} HappyFaces 😊
            </div>
            <button className="finish-btn" onClick={() => navigate('/student/dashboard')}>
              Volver al inicio
            </button>
          </div>
        ) : (
          <>
            <div className="game-room-header">
              <button className="back-btn" onClick={() => navigate('/student/dashboard')}>
                <ArrowLeft size={16} />
                Salir
              </button>
              <div className="game-room-info">
                <h1 className="game-room-name">{room?.name}</h1>
                <span className="game-room-type">{GAME_LABELS[room?.gameType] || room?.gameType}</span>
              </div>
              <div className="game-room-reward">
                <span>Recompensa</span>
                <strong>{room?.coinReward} HF 😊</strong>
              </div>
            </div>
            <div className="game-room-game">
              {submitting ? (
                <div className="game-room-loader">
                  <Loader2 size={32} className="spin" />
                  <p>Guardando resultado...</p>
                </div>
              ) : renderGame()}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
