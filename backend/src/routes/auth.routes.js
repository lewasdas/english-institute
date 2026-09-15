const express = require('express')
const router = express.Router()
const { authMiddleware } = require('../middlewares/auth.middleware')
const { supabase } = require('../config/supabase')

// GET /api/auth/profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, role, avatar_url, created_at')
      .eq('id', req.user.id)
      .single()

    if (profileError) throw profileError

    let balance = 0

    if (profile.role === 'student') {
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('student_id', req.user.id)
        .single()

      if (!walletError && wallet) {
        balance = wallet.balance
      }
    }

    return res.json({
      id: profile.id,
      full_name: profile.full_name,
      role: profile.role,
      avatar_url: profile.avatar_url,
      balance,
    })
  } catch (err) {
    console.error('Error fetching profile:', err)
    return res.status(500).json({ error: 'Error al obtener el perfil' })
  }
})

module.exports = router
