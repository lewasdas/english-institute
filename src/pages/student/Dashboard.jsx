import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DoorOpen, ShoppingBag, ClipboardList } from 'lucide-react'
import Navbar from '../../components/layout/Navbar.jsx'
import useAuth from '../../hooks/useAuth.js'
import { api } from '../../lib/api.js'
import './Dashboard.css'

export default function StudentDashboard() {
  const { user, balance } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user?.id) {
      api('get', `/api/wallet/${user.id}`).catch(() => {})
    }
  }, [user?.id])

  return (
    <div className="page">
      <Navbar />
      <main className="page-content student-dashboard">
        <div className="balance-hero">
          <div className="balance-label">Tu saldo actual</div>
          <div className="balance-value">{balance} HappyFaces 😊</div>
          <div className="balance-subtitle">Seguí jugando para ganar más</div>
        </div>

        <div className="student-actions">
          <button
            className="action-btn action-btn--primary"
            onClick={() => navigate('/student/join-room')}
          >
            <DoorOpen size={22} />
            Unirse a Sala
          </button>

          <button
            className="action-btn action-btn--secondary"
            onClick={() => navigate('/student/store')}
          >
            <ShoppingBag size={22} />
            Tienda
          </button>

          <button
            className="action-btn action-btn--ghost"
            onClick={() => navigate('/student/history')}
          >
            <ClipboardList size={22} />
            Mi Historial
          </button>
        </div>
      </main>
    </div>
  )
}
