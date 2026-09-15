const express = require('express')
const router = express.Router()
const { authMiddleware } = require('../middlewares/auth.middleware')
const { requireRole } = require('../middlewares/role.middleware')
const { supabase } = require('../config/supabase')

// GET /api/users — solo admin
router.get('/', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        role,
        avatar_url,
        created_at,
        wallets (balance)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    const users = profiles.map((p) => ({
      id: p.id,
      full_name: p.full_name,
      role: p.role,
      avatar_url: p.avatar_url,
      created_at: p.created_at,
      balance: p.wallets?.[0]?.balance ?? null,
    }))

    return res.json(users)
  } catch (err) {
    console.error('Error listing users:', err)
    return res.status(500).json({ error: 'Error al listar usuarios' })
  }
})

module.exports = router
