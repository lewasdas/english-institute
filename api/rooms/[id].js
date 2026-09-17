import { getAuthUser } from '../_lib/authMiddleware.js'
import { setCors } from '../_lib/cors.js'
import supabase from '../_lib/supabase.js'

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).end()

  try {
    return await handleGetRoom(req, res)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// GET /api/rooms/:id
async function handleGetRoom(req, res) {
  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })

  const { id: roomId } = req.query
  if (!roomId) return res.status(400).json({ error: 'roomId is required' })

  const { data: room, error: roomErr } = await supabase
    .from('rooms')
    .select('id, name, game_type, config, coin_reward, is_active, teacher_id, expires_at, created_at, password')
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
    .select('id, completed, reward_granted, joined_at, score, student_id, profiles(full_name)')
    .eq('room_id', roomId)

  if (partErr) return res.status(500).json({ error: partErr.message })

  const participantList = (participants ?? []).map(p => ({
    id: p.id,
    studentId: p.student_id,
    full_name: p.profiles?.full_name ?? null,
    fullName: p.profiles?.full_name ?? null,
    completed: p.completed,
    rewardGranted: p.reward_granted,
    score: p.score,
    joinedAt: p.joined_at
  }))

  return res.status(200).json({
    id: room.id,
    name: room.name,
    gameType: room.game_type,
    game_type: room.game_type,
    config: room.config,
    coinReward: room.coin_reward,
    coin_reward: room.coin_reward,
    isActive: room.is_active,
    is_active: room.is_active,
    teacherId: room.teacher_id,
    expiresAt: room.expires_at,
    createdAt: room.created_at,
    password: room.password,
    participants: participantList
  })
}
