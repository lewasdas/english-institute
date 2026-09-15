import { DoorOpen, Users } from 'lucide-react'
import Navbar from '../../components/layout/Navbar.jsx'
import '../admin/Dashboard.css'

const PLACEHOLDER_STATS = [
  {
    label: 'Mis Salas Activas',
    value: '—',
    icon: <DoorOpen size={24} />,
    color: 'accent',
  },
  {
    label: 'Alumnos en Juego Hoy',
    value: '—',
    icon: <Users size={24} />,
    color: 'gold',
  },
]

export default function TeacherDashboard() {
  return (
    <div className="page">
      <Navbar />
      <main className="page-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Panel Profesor</h1>
          <p className="dashboard-subtitle">Gestioná tus salas y actividades</p>
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
