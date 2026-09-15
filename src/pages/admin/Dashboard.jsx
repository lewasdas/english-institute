import { Users, Coins, ShoppingBag } from 'lucide-react'
import Navbar from '../../components/layout/Navbar.jsx'
import './Dashboard.css'

const PLACEHOLDER_STATS = [
  {
    label: 'Total Alumnos',
    value: '—',
    icon: <Users size={24} />,
    color: 'accent',
  },
  {
    label: 'HappyFaces en Circulación',
    value: '—',
    icon: <Coins size={24} />,
    color: 'gold',
  },
  {
    label: 'Canjes Pendientes',
    value: '—',
    icon: <ShoppingBag size={24} />,
    color: 'accent-light',
  },
]

export default function AdminDashboard() {
  return (
    <div className="page">
      <Navbar />
      <main className="page-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Panel Admin</h1>
          <p className="dashboard-subtitle">Vista general del instituto</p>
        </div>

        <div className="stats-grid">
          {PLACEHOLDER_STATS.map((stat) => (
            <div key={stat.label} className={`stat-card stat-card--${stat.color}`}>
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
