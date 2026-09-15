import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import Navbar from '../components/layout/Navbar.jsx'
import { api } from '../lib/api.js'
import './Leaderboard.css'

const PERIODS = [
  { key: 'month', label: 'Este mes' },
  { key: 'week', label: 'Esta semana' },
  { key: 'all', label: 'Todo el tiempo' },
]

const MEDALS = ['🥇', '🥈', '🥉']

export default function Leaderboard() {
  const [period, setPeriod] = useState('month')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    api('get', `/api/leaderboard?period=${period}`)
      .then(({ data }) => setData(data))
      .catch(() => setError('No se pudo cargar el ranking.'))
      .finally(() => setLoading(false))
  }, [period])

  return (
    <div className="page">
      <Navbar />
      <main className="page-content leaderboard-content">
        <div className="lb-header">
          <h1 className="lb-title">Ranking 🏆</h1>
          <p className="lb-subtitle">Los mejores jugadores del instituto</p>
        </div>

        <div className="lb-tabs">
          {PERIODS.map(p => (
            <button
              key={p.key}
              className={`lb-tab ${period === p.key ? 'active' : ''}`}
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="lb-loader">
            <Loader2 size={28} className="spin" />
            <p>Cargando ranking...</p>
          </div>
        ) : error ? (
          <div className="lb-error">{error}</div>
        ) : data.length === 0 ? (
          <div className="lb-empty">No hay datos para este período aún.</div>
        ) : (
          <>
            {/* Top 3 podium */}
            {data.length >= 3 && (
              <div className="lb-podium">
                {[data[1], data[0], data[2]].map((entry, visualIdx) => {
                  const realPos = visualIdx === 0 ? 1 : visualIdx === 1 ? 0 : 2
                  return (
                    <div key={entry.user_id} className={`lb-podium-slot lb-podium-slot--${realPos + 1}`}>
                      <div className="lb-podium-medal">{MEDALS[realPos]}</div>
                      <div className="lb-podium-avatar">
                        {(entry.full_name || 'U')[0].toUpperCase()}
                      </div>
                      <div className="lb-podium-name">{entry.full_name || 'Alumno'}</div>
                      <div className="lb-podium-hf">{entry.total_hf} HF 😊</div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Full table */}
            <div className="lb-table">
              {data.map((entry, i) => (
                <div key={entry.user_id} className={`lb-row ${i < 3 ? 'lb-row--top' : ''}`}>
                  <div className="lb-pos">
                    {i < 3 ? MEDALS[i] : <span className="lb-pos-num">{i + 1}</span>}
                  </div>
                  <div className="lb-row-avatar">
                    {(entry.full_name || 'U')[0].toUpperCase()}
                  </div>
                  <div className="lb-row-name">{entry.full_name || 'Alumno'}</div>
                  <div className="lb-row-hf">{entry.total_hf} HF</div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
