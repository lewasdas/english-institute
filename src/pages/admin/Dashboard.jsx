import { useState, useEffect } from 'react'
import { Users, Coins, ShoppingBag, TrendingUp, TrendingDown, Loader2 } from 'lucide-react'
import Navbar from '../../components/layout/Navbar.jsx'
import { api } from '../../lib/api.js'
import './Dashboard.css'

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api('get', '/api/admin/stats'),
      api('get', '/api/admin/transactions'),
    ])
      .then(([statsRes, txRes]) => {
        setStats(statsRes.data)
        setTransactions(txRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label: 'Total Alumnos', value: stats?.totalStudents ?? '—', icon: <Users size={24} />, color: 'accent' },
    { label: 'HF en Circulación', value: stats?.totalHF ?? '—', icon: <Coins size={24} />, color: 'gold' },
    { label: 'Canjes Pendientes', value: stats?.pendingRedemptions ?? '—', icon: <ShoppingBag size={24} />, color: 'accent-light' },
  ]

  return (
    <div className="page">
      <Navbar />
      <main className="page-content admin-dashboard">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Panel Admin</h1>
          <p className="dashboard-subtitle">Vista general del instituto</p>
        </div>

        <div className="stats-grid">
          {statCards.map(stat => (
            <div key={stat.label} className={`stat-card stat-card--${stat.color}`}>
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-value">
                {loading ? <Loader2 size={20} className="spin" /> : stat.value}
              </div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="admin-section">
          <h2 className="admin-section-title">Últimas transacciones</h2>
          {loading ? (
            <div className="admin-loader"><Loader2 size={24} className="spin" /> Cargando...</div>
          ) : transactions.length === 0 ? (
            <p className="admin-empty">No hay transacciones aún.</p>
          ) : (
            <div className="admin-tx-list">
              {transactions.slice(0, 20).map((tx, i) => (
                <div key={tx.id ?? i} className="admin-tx-row">
                  <div className="admin-tx-icon">
                    {tx.amount > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  </div>
                  <div className="admin-tx-info">
                    <span className="admin-tx-user">{tx.user_name || tx.email || 'Usuario'}</span>
                    <span className="admin-tx-desc">{tx.description || 'Transacción'}</span>
                  </div>
                  <span className="admin-tx-date">{formatDate(tx.created_at)}</span>
                  <span className={`admin-tx-amount ${tx.amount > 0 ? 'positive' : 'negative'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount} HF
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
