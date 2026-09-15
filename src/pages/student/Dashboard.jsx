import { useNavigate } from 'react-router-dom'
import { Coins, DoorOpen, ShoppingBag, ClipboardList } from 'lucide-react'
import Navbar from '../../components/layout/Navbar.jsx'
import useAuth from '../../hooks/useAuth.js'
import './Dashboard.css'

export default function StudentDashboard() {
  const { balance } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="page">
      <Navbar />
      <main className="page-content student-dashboard">
        <div className="balance-hero">
          <div className="balance-coin-icon">
            <Coins size={40} />
          </div>
          <div className="balance-label">Tus HappyFaces</div>
          <div className="balance-value">{balance}</div>
        </div>

        <div className="student-actions">
          <button
            className="btn btn-primary action-btn"
            onClick={() => navigate('/student/room')}
          >
            <DoorOpen size={20} />
            Unirse a Sala
          </button>

          <button
            className="btn btn-gold action-btn"
            onClick={() => navigate('/student/store')}
          >
            <ShoppingBag size={20} />
            Ver Tienda
          </button>

          <button
            className="btn btn-ghost action-btn"
            onClick={() => navigate('/student/history')}
          >
            <ClipboardList size={20} />
            Mi Historial
          </button>
        </div>
      </main>
    </div>
  )
}
