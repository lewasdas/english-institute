import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, TrendingUp, TrendingDown, Loader2 } from 'lucide-react'
import Navbar from '../../components/layout/Navbar.jsx'
import useAuth from '../../hooks/useAuth.js'
import { api } from '../../lib/api.js'
import './History.css'

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function History() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.id) return
    api('get', `/api/wallet?studentId=${user.id}`)
      .then(({ data }) => setData(data))
      .catch(() => setError('No se pudo cargar el historial.'))
      .finally(() => setLoading(false))
  }, [user?.id])

  return (
    <div className="page">
      <Navbar />
      <main className="page-content history-content">
        <button className="back-btn" onClick={() => navigate('/student/dashboard')}>
          <ArrowLeft size={18} />
          Volver
        </button>

        <h1 className="history-title">Mi Historial</h1>

        {loading ? (
          <div className="history-loader">
            <Loader2 size={32} className="spin" />
            <p>Cargando...</p>
          </div>
        ) : error ? (
          <div className="history-error">{error}</div>
        ) : (
          <>
            <div className="history-balance-card">
              <span>Saldo actual</span>
              <strong>{data?.balance ?? 0} HappyFaces 😊</strong>
            </div>

            <div className="history-list">
              {(!data?.transactions || data.transactions.length === 0) ? (
                <p className="history-empty">Aún no tenés transacciones. ¡Jugá para ganar HappyFaces!</p>
              ) : (
                data.transactions.map((tx, i) => (
                  <div key={tx.id ?? i} className="history-item">
                    <div className="history-item-icon">
                      {tx.amount > 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                    </div>
                    <div className="history-item-info">
                      <span className="history-item-desc">{tx.description || 'Transacción'}</span>
                      <span className="history-item-date">{formatDate(tx.created_at)}</span>
                    </div>
                    <div className={`history-item-amount ${tx.amount > 0 ? 'positive' : 'negative'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount} HF
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
