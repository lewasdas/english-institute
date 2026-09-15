import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/auth/Login.jsx'
import AdminDashboard from './pages/admin/Dashboard.jsx'
import AdminUsers from './pages/admin/Users.jsx'
import TeacherDashboard from './pages/teacher/Dashboard.jsx'
import CreateRoom from './pages/teacher/CreateRoom.jsx'
import RoomDetail from './pages/teacher/RoomDetail.jsx'
import StudentDashboard from './pages/student/Dashboard.jsx'
import JoinRoom from './pages/student/JoinRoom.jsx'
import GameRoom from './pages/student/GameRoom.jsx'
import History from './pages/student/History.jsx'
import Store from './pages/student/Store.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import NotFound from './pages/NotFound.jsx'
import ProtectedRoute from './components/layout/ProtectedRoute.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      {/* Admin */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminUsers />
          </ProtectedRoute>
        }
      />

      {/* Teacher */}
      <Route
        path="/teacher/dashboard"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/create-room"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <CreateRoom />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/room/:roomId"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <RoomDetail />
          </ProtectedRoute>
        }
      />

      {/* Student */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/join-room"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <JoinRoom />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/room/:roomId"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <GameRoom />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/history"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <History />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/store"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Store />
          </ProtectedRoute>
        }
      />

      {/* Shared */}
      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
            <Leaderboard />
          </ProtectedRoute>
        }
      />

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}

export default App
