const express = require('express')
const router = express.Router()
const { authMiddleware } = require('../middlewares/auth.middleware')
const { requireRole } = require('../middlewares/role.middleware')
const walletController = require('../controllers/wallet.controller')

// GET /api/wallet/:studentId
router.get('/:studentId', authMiddleware, walletController.getBalance)

// POST /api/wallet/assign — admin o teacher
router.post('/assign', authMiddleware, requireRole('admin', 'teacher'), walletController.assignCoins)

module.exports = router
