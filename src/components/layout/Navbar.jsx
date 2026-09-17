import { LogOut, Coins } from 'lucide-react'
import useAuth from '../../hooks/useAuth.js'
import './Navbar.css'

export default function Navbar() {
  const { user, role, balance, logout } = useAuth()

  const displayName = user?.full_name || user?.email || 'Usuario'

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img src="/logo.png" alt="Logo" className="navbar-logo-img" />
        <span className="navbar-logo">HappyFaces</span>
      </div>

      <div className="navbar-right">
        <span className="navbar-username">{displayName}</span>

        {role === 'student' && (
          <div className="navbar-balance" title="Tus HappyFaces">
            <Coins size={18} className="balance-icon" />
            <span className="balance-amount">{balance}</span>
          </div>
        )}

        <button
          className="btn btn-ghost navbar-logout"
          onClick={logout}
          title="Cerrar sesión"
        >
          <LogOut size={16} />
          <span>Salir</span>
        </button>
      </div>
    </nav>
  )
}
