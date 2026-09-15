import { getAuthUser } from '../_lib/authMiddleware.js'
import { setCors } from '../_lib/cors.js'
import supabase from '../_lib/supabase.js'

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })
  if (user.role !== 'teacher') {
    return res.status(403).json({ error: 'Forbidden: only teachers can access their rooms' })
  }

  try {
    const { data: rooms, error: roomsErr } = await supabase
      .from('rooms')
      .select('id, name, game_type, config, coin_reward, is_active, expires_at, created_at, room_participants(id, completed)')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false })

    if (roomsErr) return res.status(500).json({ error: roomsErr.message })

    const result = (rooms ?? []).map(room => {
      const participants = room.room_participants ?? []
      return {
        id: room.id,
        name: room.name,
        gameType: room.game_type,
        config: room.config,
        coinReward: room.coin_reward,
        isActive: room.is_active,
        expiresAt: room.expires_at,
        createdAt: room.created_at,
        participantCount: participants.length,
        completedCount: participants.filter(p => p.completed).length
      }
    })

    return res.status(200).json({ rooms: result })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
