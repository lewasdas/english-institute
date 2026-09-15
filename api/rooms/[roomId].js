import { getAuthUser } from '../_lib/authMiddleware.js'
import { setCors } from '../_lib/cors.js'
import supabase from '../_lib/supabase.js'

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })

  const { roomId } = req.query
  if (!roomId) return res.status(400).json({ error: 'roomId is required' })

  try {
    const { data: room, error: roomErr } = await supabase
      .from('rooms')
      .select('id, name, game_type, config, coin_reward, is_active, teacher_id, expires_at, created_at')
      .eq('id', roomId)
      .single()

    if (roomErr || !room) return res.status(404).json({ error: 'Room not found' })

    if (user.role === 'student') {
      return res.status(200).json({
        id: room.id,
        name: room.name,
        gameType: room.game_type,
        config: room.config,
        coinReward: room.coin_reward,
        isActive: room.is_active
      })
    }

    // Teacher or admin: include participants
    const { data: participants, error: partErr } = await supabase
      .from('room_participants')
      .select('id, completed, reward_granted, joined_at, student_id, profiles(full_name)')
      .eq('room_id', roomId)

    if (partErr) return res.status(500).json({ error: partErr.message })

    const participantList = (participants ?? []).map(p => ({
      id: p.id,
      studentId: p.student_id,
      fullName: p.profiles?.full_name ?? null,
      completed: p.completed,
      rewardGranted: p.reward_granted,
      joinedAt: p.joined_at
    }))

    return res.status(200).json({
      id: room.id,
      name: room.name,
      gameType: room.game_type,
      config: room.config,
      coinReward: room.coin_reward,
      isActive: room.is_active,
      teacherId: room.teacher_id,
      expiresAt: room.expires_at,
      createdAt: room.created_at,
      participants: participantList
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
