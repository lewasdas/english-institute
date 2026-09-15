const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/auth.routes')
const usersRoutes = require('./routes/users.routes')
const walletRoutes = require('./routes/wallet.routes')

const app = express()

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))

app.use(express.json())

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/wallet', walletRoutes)

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
})

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Error interno del servidor' })
})

module.exports = app
