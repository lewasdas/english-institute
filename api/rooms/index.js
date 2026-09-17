import { getAuthUser } from '../_lib/authMiddleware.js'
import { setCors } from '../_lib/cors.js'
import supabase from '../_lib/supabase.js'

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    if (req.method === 'GET') {
      const { action } = req.query
      if (action === 'my-rooms') return await handleMyRooms(req, res)
      return res.status(400).json({ error: 'Unknown action. Use ?action=my-rooms' })
    }

    if (req.method === 'POST') {
      const { action } = req.query
      if (action === 'create') return await handleCreateRoom(req, res)
      if (action === 'join') return await handleJoinRoom(req, res)
      return res.status(400).json({ error: 'Unknown action. Use ?action=create or ?action=join' })
    }

    return res.status(405).end()
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// GET /api/rooms?action=my-rooms
async function handleMyRooms(req, res) {
  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })
  if (user.role !== 'teacher') {
    return res.status(403).json({ error: 'Forbidden: only teachers can access their rooms' })
  }

  const { data: rooms, error: roomsErr } = await supabase
    .from('rooms')
    .select('id, name, game_type, config, coin_reward, is_active, expires_at, created_at, password, room_participants(id, completed)')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })

  if (roomsErr) return res.status(500).json({ error: roomsErr.message })

  const result = (rooms ?? []).map(room => {
    const participants = room.room_participants ?? []
    return {
      id: room.id,
      name: room.name,
      gameType: room.game_type,
      game_type: room.game_type,
      config: room.config,
      coinReward: room.coin_reward,
      coin_reward: room.coin_reward,
      isActive: room.is_active,
      is_active: room.is_active,
      password: room.password,
      expiresAt: room.expires_at,
      createdAt: room.created_at,
      participants_count: participants.length,
      completed_count: participants.filter(p => p.completed).length,
      participantCount: participants.length,
      completedCount: participants.filter(p => p.completed).length
    }
  })

  return res.status(200).json(result)
}

// POST /api/rooms?action=create
async function handleCreateRoom(req, res) {
  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })
  if (!['teacher', 'admin'].includes(user.role)) {
    return res.status(403).json({ error: 'Forbidden: only teachers and admins can create rooms' })
  }

  const { name, gameType, game_type, config, coinReward, coin_reward, password, expiresAt } = req.body
  const resolvedGameType = gameType || game_type
  const resolvedCoinReward = coinReward ?? coin_reward ?? 0

  if (!name || !resolvedGameType || !password) {
    return res.status(400).json({ error: 'name, gameType and password are required' })
  }

  const hashedPassword = Buffer.from(password).toString('base64')

  const { data: room, error: insertErr } = await supabase
    .from('rooms')
    .insert({
      name,
      game_type: resolvedGameType,
      config: config ?? {},
      coin_reward: resolvedCoinReward,
      password: hashedPassword,
      teacher_id: user.id,
      is_active: true,
      expires_at: expiresAt ?? null
    })
    .select()
    .single()

  if (insertErr) return res.status(500).json({ error: insertErr.message })

  return res.status(201).json({ success: true, room })
}

// POST /api/rooms?action=join
async function handleJoinRoom(req, res) {
  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })
  if (user.role !== 'student') {
    return res.status(403).json({ error: 'Forbidden: only students can join rooms' })
  }

  const { password } = req.body
  if (!password) {
    return res.status(400).json({ error: 'password is required' })
  }

  const hashedPassword = Buffer.from(password).toString('base64')

  // Find an active room with this password
  const { data: room, error: roomErr } = await supabase
    .from('rooms')
    .select('id, name, game_type, config, coin_reward, password, is_active')
    .eq('password', hashedPassword)
    .eq('is_active', true)
    .single()

  if (roomErr || !room) return res.status(404).json({ error: 'Room not found or incorrect password' })
  if (!room.is_active) return res.status(400).json({ error: 'Room is not active' })

  const { data: existing } = await supabase
    .from('room_participants')
    .select('id')
    .eq('room_id', room.id)
    .eq('student_id', user.id)
    .single()

  if (existing) {
    // Already joined — return the room info so we can navigate
    return res.status(200).json({
      success: true,
      roomId: room.id,
      room: {
        id: room.id,
        name: room.name,
        gameType: room.game_type,
        config: room.config,
        coinReward: room.coin_reward
      }
    })
  }

  const { error: joinErr } = await supabase.from('room_participants').insert({
    room_id: room.id,
    student_id: user.id,
    joined_at: new Date().toISOString(),
    completed: false
  })

  if (joinErr) return res.status(500).json({ error: joinErr.message })

  return res.status(200).json({
    success: true,
    roomId: room.id,
    room: {
      id: room.id,
      name: room.name,
      gameType: room.game_type,
      config: room.config,
      coinReward: room.coin_reward
    }
  })
}
