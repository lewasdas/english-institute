import { getAuthUser } from '../_lib/authMiddleware.js'
import { setCors } from '../_lib/cors.js'
import supabase from '../_lib/supabase.js'

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })
  if (user.role !== 'student') {
    return res.status(403).json({ error: 'Forbidden: only students can join rooms' })
  }

  const { roomId, password } = req.body
  if (!roomId || !password) {
    return res.status(400).json({ error: 'roomId and password are required' })
  }

  try {
    const { data: room, error: roomErr } = await supabase
      .from('rooms')
      .select('id, name, game_type, config, coin_reward, password, is_active')
      .eq('id', roomId)
      .single()

    if (roomErr || !room) return res.status(404).json({ error: 'Room not found' })
    if (!room.is_active) return res.status(400).json({ error: 'Room is not active' })

    const hashedPassword = Buffer.from(password).toString('base64')
    if (room.password !== hashedPassword) {
      return res.status(401).json({ error: 'Incorrect password' })
    }

    const { data: existing } = await supabase
      .from('room_participants')
      .select('id')
      .eq('room_id', roomId)
      .eq('student_id', user.id)
      .single()

    if (existing) {
      return res.status(409).json({ error: 'Student already joined this room' })
    }

    const { error: joinErr } = await supabase.from('room_participants').insert({
      room_id: roomId,
      student_id: user.id,
      joined_at: new Date().toISOString(),
      completed: false
    })

    if (joinErr) return res.status(500).json({ error: joinErr.message })

    return res.status(200).json({
      success: true,
      room: {
        id: room.id,
        name: room.name,
        gameType: room.game_type,
        config: room.config,
        coinReward: room.coin_reward
      }
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
