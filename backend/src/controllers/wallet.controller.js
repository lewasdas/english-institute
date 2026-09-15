const walletService = require('../services/wallet.service')

async function getBalance(req, res) {
  const { studentId } = req.params
  const { user } = req

  // Solo el propio alumno, admin o teacher pueden ver el balance
  if (user.role === 'student' && user.id !== studentId) {
    return res.status(403).json({ error: 'No tenés permiso para ver este balance' })
  }

  try {
    const wallet = await walletService.getBalance(studentId)
    return res.json(wallet)
  } catch (err) {
    console.error('getBalance error:', err)
    return res.status(500).json({ error: err.message || 'Error al obtener balance' })
  }
}

async function assignCoins(req, res) {
  const { studentId, amount, reason, origin } = req.body

  if (!studentId || amount === undefined || !reason) {
    return res.status(400).json({ error: 'studentId, amount y reason son requeridos' })
  }

  if (typeof amount !== 'number' || !Number.isInteger(amount)) {
    return res.status(400).json({ error: 'amount debe ser un número entero' })
  }

  try {
    const result = await walletService.assignCoins(
      studentId,
      amount,
      reason,
      req.user.id,
      origin || 'manual'
    )
    return res.status(201).json(result)
  } catch (err) {
    console.error('assignCoins error:', err)
    return res.status(500).json({ error: err.message || 'Error al asignar monedas' })
  }
}

module.exports = { getBalance, assignCoins }
