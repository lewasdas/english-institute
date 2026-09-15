import { getAuthUser } from '../_lib/authMiddleware.js'
import { setCors } from '../_lib/cors.js'
import supabase from '../_lib/supabase.js'

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })
  if (!['teacher', 'admin'].includes(user.role)) {
    return res.status(403).json({ error: 'Forbidden: only teachers and admins can create rooms' })
  }

  const { name, gameType, config, coinReward, password, expiresAt } = req.body
  if (!name || !gameType || !password) {
    return res.status(400).json({ error: 'name, gameType and password are required' })
  }

  const hashedPassword = Buffer.from(password).toString('base64')

  try {
    const { data: room, error: insertErr } = await supabase
      .from('rooms')
      .insert({
        name,
        game_type: gameType,
        config: config ?? {},
        coin_reward: coinReward ?? 0,
        password: hashedPassword,
        teacher_id: user.id,
        is_active: true,
        expires_at: expiresAt ?? null
      })
      .select()
      .single()

    if (insertErr) return res.status(500).json({ error: insertErr.message })

    return res.status(201).json({ success: true, room })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
