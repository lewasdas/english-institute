import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  DoorOpen,
  Users,
  Trophy,
  Plus,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import useAuth from '../../hooks/useAuth.js'
import './TeacherSidebar.css'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Inicio', path: '/teacher/dashboard' },
  { icon: DoorOpen, label: 'Mis Salas', path: '/teacher/dashboard' },
  { icon: Users, label: 'Alumnos', path: '/teacher/dashboard' },
  { icon: Trophy, label: 'Ranking', path: '/leaderboard' },
]

function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function TeacherSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const displayName = user?.full_name || user?.email || 'Profesor'
  const initials = getInitials(user?.full_name || user?.email || 'P')

  const handleNav = (path) => {
    navigate(path)
    setMobileOpen(false)
  }

  const isActive = (path) => location.pathname === path

  const SidebarContent = () => (
    <div className="sidebar-inner">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">😊</span>
          <span className="sidebar-logo-text">HappyFaces</span>
        </div>
        <p className="sidebar-subtitle">Panel Docente</p>
      </div>

      <button
        className="sidebar-create-btn"
        onClick={() => handleNav('/teacher/create-room')}
      >
        <Plus size={16} />
        Nueva Sala
      </button>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
          <button
            key={label}
            className={`sidebar-nav-item ${isActive(path) && label === 'Inicio' ? 'sidebar-nav-item--active' : ''}`}
            onClick={() => handleNav(path)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{displayName}</span>
            <span className="sidebar-user-role">Profesor</span>
          </div>
        </div>
        <button className="sidebar-logout-btn" onClick={logout} title="Cerrar sesión">
          <LogOut size={16} />
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="sidebar-hamburger"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menú"
      >
        <Menu size={22} />
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`teacher-sidebar ${mobileOpen ? 'open' : ''}`}>
        <button
          className="sidebar-close-btn"
          onClick={() => setMobileOpen(false)}
          aria-label="Cerrar menú"
        >
          <X size={20} />
        </button>
        <SidebarContent />
      </aside>
    </>
  )
}
