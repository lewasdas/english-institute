import { getAuthUser } from './_lib/authMiddleware.js'
import { setCors } from './_lib/cors.js'
import supabase from './_lib/supabase.js'

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  const slug = req.query.slug || []
  const path = slug.join('/')
  const method = req.method

  try {
    // AUTH
    if (path === 'auth/profile' && method === 'GET') return await handleAuthProfile(req, res)

    // USERS
    if (path === 'users' && method === 'GET') return await handleGetUsers(req, res)

    // WALLET
    if (path === 'wallet/assign' && method === 'POST') return await handleAssignCoins(req, res)
    if (slug[0] === 'wallet' && slug.length === 2 && method === 'GET') return await handleGetWallet(req, res, slug[1])

    // ROOMS
    if (path === 'rooms/create' && method === 'POST') return await handleCreateRoom(req, res)
    if (path === 'rooms/join' && method === 'POST') return await handleJoinRoom(req, res)
    if (path === 'rooms/my-rooms' && method === 'GET') return await handleMyRooms(req, res)
    if (slug[0] === 'rooms' && slug.length === 2 && method === 'GET') return await handleGetRoom(req, res, slug[1])

    // GAMES
    if (path === 'games/complete' && method === 'POST') return await handleGameComplete(req, res)

    // STORE
    if (path === 'store/items' && method === 'GET') return await handleStoreItems(req, res)
    if (path === 'store/purchase' && method === 'POST') return await handleStorePurchase(req, res)

    // LEADERBOARD
    if (path === 'leaderboard' && method === 'GET') return await handleLeaderboard(req, res)

    // ADMIN
    if (path === 'admin/stats' && method === 'GET') return await handleAdminStats(req, res)
    if (path === 'admin/users' && method === 'GET') return await handleAdminGetUsers(req, res)
    if (path === 'admin/users' && method === 'POST') return await handleAdminCreateUser(req, res)
    if (path === 'admin/items' && method === 'GET') return await handleAdminGetItems(req, res)
    if (path === 'admin/items' && method === 'POST') return await handleAdminCreateItem(req, res)
    if (path === 'admin/items' && method === 'PUT') return await handleAdminUpdateItem(req, res)

    return res.status(404).json({ error: 'Route not found' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// ─── AUTH ────────────────────────────────────────────────────────────────────

async function handleAuthProfile(req, res) {
  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })

  let balance = null
  if (user.role === 'student') {
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('student_id', user.id)
      .single()
    balance = wallet?.balance ?? 0
  }

  return res.status(200).json({ ...user, balance })
}

// ─── USERS ───────────────────────────────────────────────────────────────────

async function handleGetUsers(req, res) {
  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })
  if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })

  const { data: profiles, error: dbError } = await supabase
    .from('profiles')
    .select('id, full_name, role, created_at, wallets(balance)')
    .order('full_name')

  if (dbError) return res.status(500).json({ error: dbError.message })

  const users = profiles.map(p => ({
    ...p,
    balance: p.wallets?.[0]?.balance ?? null
  }))

  return res.status(200).json(users)
}

// ─── WALLET ──────────────────────────────────────────────────────────────────

async function handleGetWallet(req, res, studentId) {
  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })

  if (user.role === 'student' && user.id !== studentId) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance, id')
    .eq('student_id', studentId)
    .single()

  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, amount, reason, origin, created_at')
    .eq('wallet_id', wallet?.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return res.status(200).json({ balance: wallet?.balance ?? 0, transactions: transactions ?? [] })
}

async function handleAssignCoins(req, res) {
  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })
  if (!['admin', 'teacher'].includes(user.role)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { studentId, amount, reason } = req.body
  if (!studentId || amount === undefined || !reason) {
    return res.status(400).json({ error: 'studentId, amount and reason are required' })
  }

  const { data: wallet, error: walletErr } = await supabase
    .from('wallets')
    .select('id, balance')
    .eq('student_id', studentId)
    .single()

  if (walletErr || !wallet) return res.status(404).json({ error: 'Wallet not found' })

  const newBalance = wallet.balance + amount
  if (newBalance < 0) return res.status(400).json({ error: 'Insufficient balance' })

  const { error: txErr } = await supabase.from('transactions').insert({
    wallet_id: wallet.id,
    amount,
    reason,
    origin: user.role,
    created_by: user.id
  })
  if (txErr) return res.status(500).json({ error: txErr.message })

  const { error: updateErr } = await supabase
    .from('wallets')
    .update({ balance: newBalance })
    .eq('id', wallet.id)

  if (updateErr) return res.status(500).json({ error: updateErr.message })

  return res.status(200).json({ success: true, newBalance })
}

// ─── ROOMS ───────────────────────────────────────────────────────────────────

async function handleCreateRoom(req, res) {
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
}

async function handleJoinRoom(req, res) {
  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })
  if (user.role !== 'student') {
    return res.status(403).json({ error: 'Forbidden: only students can join rooms' })
  }

  const { roomId, password } = req.body
  if (!roomId || !password) {
    return res.status(400).json({ error: 'roomId and password are required' })
  }

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
}

async function handleGetRoom(req, res, roomId) {
  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })

  if (!roomId) return res.status(400).json({ error: 'roomId is required' })

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
}

async function handleMyRooms(req, res) {
  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })
  if (user.role !== 'teacher') {
    return res.status(403).json({ error: 'Forbidden: only teachers can access their rooms' })
  }

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
}

// ─── GAMES ───────────────────────────────────────────────────────────────────

async function handleGameComplete(req, res) {
  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })
  if (user.role !== 'student') {
    return res.status(403).json({ error: 'Forbidden: only students can complete games' })
  }

  const { roomId, score } = req.body
  if (!roomId) return res.status(400).json({ error: 'roomId is required' })

  // Verify the student is a participant of this room
  const { data: participant, error: partErr } = await supabase
    .from('room_participants')
    .select('id, completed, reward_granted')
    .eq('room_id', roomId)
    .eq('student_id', user.id)
    .single()

  if (partErr || !participant) {
    return res.status(404).json({ error: 'Participant record not found for this room' })
  }

  if (participant.reward_granted) {
    return res.status(409).json({ error: 'Reward already granted for this room' })
  }

  // Get room to know coin_reward
  const { data: room, error: roomErr } = await supabase
    .from('rooms')
    .select('id, name, coin_reward')
    .eq('id', roomId)
    .single()

  if (roomErr || !room) return res.status(404).json({ error: 'Room not found' })

  // Get wallet
  const { data: wallet, error: walletErr } = await supabase
    .from('wallets')
    .select('id, balance')
    .eq('student_id', user.id)
    .single()

  if (walletErr || !wallet) return res.status(404).json({ error: 'Wallet not found' })

  // Insert transaction
  const { error: txErr } = await supabase.from('transactions').insert({
    wallet_id: wallet.id,
    amount: room.coin_reward,
    reason: `Completó juego: ${room.name}`,
    origin: 'game',
    created_by: user.id
  })

  if (txErr) return res.status(500).json({ error: txErr.message })

  // Update balance
  const newBalance = wallet.balance + room.coin_reward
  const { error: balanceErr } = await supabase
    .from('wallets')
    .update({ balance: newBalance })
    .eq('id', wallet.id)

  if (balanceErr) return res.status(500).json({ error: balanceErr.message })

  // Mark participant as completed and reward granted
  const { error: updatePartErr } = await supabase
    .from('room_participants')
    .update({
      completed: true,
      reward_granted: true,
      score: score ?? null
    })
    .eq('id', participant.id)

  if (updatePartErr) return res.status(500).json({ error: updatePartErr.message })

  return res.status(200).json({
    success: true,
    coinsEarned: room.coin_reward,
    newBalance
  })
}

// ─── STORE ───────────────────────────────────────────────────────────────────

async function handleStoreItems(req, res) {
  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })

  const { data: items, error: itemsErr } = await supabase
    .from('store_items')
    .select('id, name, description, coin_price, stock, image_url, is_available')
    .eq('is_available', true)
    .or('stock.gt.0,stock.eq.-1')
    .order('coin_price', { ascending: true })

  if (itemsErr) return res.status(500).json({ error: itemsErr.message })

  return res.status(200).json({ items: items ?? [] })
}

async function handleStorePurchase(req, res) {
  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })
  if (user.role !== 'student') {
    return res.status(403).json({ error: 'Forbidden: only students can purchase items' })
  }

  const { itemId, quantity = 1 } = req.body
  if (!itemId) return res.status(400).json({ error: 'itemId is required' })
  if (quantity < 1) return res.status(400).json({ error: 'quantity must be at least 1' })

  // Verify item exists and is available
  const { data: item, error: itemErr } = await supabase
    .from('store_items')
    .select('id, name, coin_price, stock, is_available')
    .eq('id', itemId)
    .single()

  if (itemErr || !item) return res.status(404).json({ error: 'Item not found' })
  if (!item.is_available) return res.status(400).json({ error: 'Item is not available' })
  if (item.stock !== -1 && item.stock < quantity) {
    return res.status(400).json({ error: 'Insufficient stock' })
  }

  const totalCost = item.coin_price * quantity

  // Get wallet
  const { data: wallet, error: walletErr } = await supabase
    .from('wallets')
    .select('id, balance')
    .eq('student_id', user.id)
    .single()

  if (walletErr || !wallet) return res.status(404).json({ error: 'Wallet not found' })
  if (wallet.balance < totalCost) {
    return res.status(400).json({ error: 'Insufficient balance' })
  }

  // Insert transaction (negative amount = debit)
  const { error: txErr } = await supabase.from('transactions').insert({
    wallet_id: wallet.id,
    amount: -totalCost,
    reason: `Compra en tienda: ${item.name} x${quantity}`,
    origin: 'store',
    created_by: user.id
  })

  if (txErr) return res.status(500).json({ error: txErr.message })

  // Update balance
  const newBalance = wallet.balance - totalCost
  const { error: balanceErr } = await supabase
    .from('wallets')
    .update({ balance: newBalance })
    .eq('id', wallet.id)

  if (balanceErr) return res.status(500).json({ error: balanceErr.message })

  // Insert purchase record
  const { error: purchaseErr } = await supabase.from('store_purchases').insert({
    item_id: itemId,
    student_id: user.id,
    quantity,
    total_cost: totalCost
  })

  if (purchaseErr) return res.status(500).json({ error: purchaseErr.message })

  // Decrement stock if not unlimited
  if (item.stock !== -1) {
    const { error: stockErr } = await supabase
      .from('store_items')
      .update({ stock: item.stock - quantity })
      .eq('id', itemId)

    if (stockErr) return res.status(500).json({ error: stockErr.message })
  }

  return res.status(200).json({ success: true, newBalance })
}

// ─── LEADERBOARD ─────────────────────────────────────────────────────────────

async function handleLeaderboard(req, res) {
  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })

  const { period = 'month' } = req.query

  let dateFilter = null

  if (period === 'month') {
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    dateFilter = firstOfMonth
  } else if (period === 'week') {
    const now = new Date()
    const day = now.getDay() // 0 = Sunday
    const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Monday
    const firstOfWeek = new Date(now.setDate(diff))
    firstOfWeek.setHours(0, 0, 0, 0)
    dateFilter = firstOfWeek.toISOString()
  }
  // period === 'all' => no date filter

  // Build transactions query: only positive amounts (earnings)
  let txQuery = supabase
    .from('transactions')
    .select('wallet_id, amount')
    .gt('amount', 0)

  if (dateFilter) {
    txQuery = txQuery.gte('created_at', dateFilter)
  }

  const { data: transactions, error: txErr } = await txQuery
  if (txErr) return res.status(500).json({ error: txErr.message })

  // Aggregate earned per wallet
  const earningsByWallet = {}
  for (const tx of transactions ?? []) {
    earningsByWallet[tx.wallet_id] = (earningsByWallet[tx.wallet_id] ?? 0) + tx.amount
  }

  if (Object.keys(earningsByWallet).length === 0) {
    return res.status(200).json({ leaderboard: [] })
  }

  // Get wallets to resolve student_id and current balance
  const walletIds = Object.keys(earningsByWallet)
  const { data: wallets, error: walletsErr } = await supabase
    .from('wallets')
    .select('id, student_id, balance')
    .in('id', walletIds)

  if (walletsErr) return res.status(500).json({ error: walletsErr.message })

  // Get profiles for those students
  const studentIds = (wallets ?? []).map(w => w.student_id)
  const { data: profiles, error: profilesErr } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', studentIds)

  if (profilesErr) return res.status(500).json({ error: profilesErr.message })

  const profileMap = {}
  for (const p of profiles ?? []) profileMap[p.id] = p.full_name

  const walletMap = {}
  for (const w of wallets ?? []) walletMap[w.id] = w

  // Build leaderboard array
  const entries = walletIds.map(walletId => {
    const wallet = walletMap[walletId]
    return {
      full_name: profileMap[wallet?.student_id] ?? 'Unknown',
      totalEarned: earningsByWallet[walletId],
      currentBalance: wallet?.balance ?? 0
    }
  })

  // Sort by totalEarned desc, take top 20
  entries.sort((a, b) => b.totalEarned - a.totalEarned)
  const top20 = entries.slice(0, 20).map((entry, index) => ({
    rank: index + 1,
    ...entry
  }))

  return res.status(200).json({ leaderboard: top20 })
}

// ─── ADMIN ───────────────────────────────────────────────────────────────────

async function handleAdminStats(req, res) {
  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })
  if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })

  const [{ count: totalStudents }, { data: wallets }, { count: pendingPurchases }, { data: recentTx }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('wallets').select('balance'),
    supabase.from('store_purchases').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('transactions').select('id, amount, reason, origin, created_at, wallets(student_id, profiles(full_name))').order('created_at', { ascending: false }).limit(10)
  ])

  const totalCirculation = wallets?.reduce((sum, w) => sum + (w.balance || 0), 0) ?? 0

  return res.status(200).json({
    totalStudents: totalStudents ?? 0,
    totalCirculation,
    pendingPurchases: pendingPurchases ?? 0,
    recentTransactions: recentTx ?? []
  })
}

async function handleAdminGetUsers(req, res) {
  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: admin only' })
  }

  const { data: profiles, error: profilesErr } = await supabase
    .from('profiles')
    .select('id, full_name, role, created_at')
    .order('created_at', { ascending: false })

  if (profilesErr) return res.status(500).json({ error: profilesErr.message })

  // Get wallets for students
  const studentIds = (profiles ?? [])
    .filter(p => p.role === 'student')
    .map(p => p.id)

  let walletMap = {}
  if (studentIds.length > 0) {
    const { data: wallets } = await supabase
      .from('wallets')
      .select('student_id, balance')
      .in('student_id', studentIds)

    for (const w of wallets ?? []) walletMap[w.student_id] = w.balance
  }

  const result = (profiles ?? []).map(p => ({
    ...p,
    balance: p.role === 'student' ? (walletMap[p.id] ?? 0) : null
  }))

  return res.status(200).json({ users: result })
}

async function handleAdminCreateUser(req, res) {
  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: admin only' })
  }

  const { full_name, email, password, role } = req.body
  if (!full_name || !email || !password || !role) {
    return res.status(400).json({ error: 'full_name, email, password and role are required' })
  }

  const validRoles = ['student', 'teacher', 'admin']
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: `role must be one of: ${validRoles.join(', ')}` })
  }

  const { data: authData, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (createErr) return res.status(500).json({ error: createErr.message })

  const newUser = authData.user

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .insert({
      id: newUser.id,
      full_name,
      role
    })
    .select()
    .single()

  if (profileErr) return res.status(500).json({ error: profileErr.message })

  return res.status(201).json({ success: true, user: { ...profile, email: newUser.email } })
}

async function handleAdminGetItems(req, res) {
  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: admin only' })
  }

  const { data: items, error: itemsErr } = await supabase
    .from('store_items')
    .select('id, name, description, coin_price, stock, image_url, is_available, created_at')
    .order('created_at', { ascending: false })

  if (itemsErr) return res.status(500).json({ error: itemsErr.message })

  return res.status(200).json({ items: items ?? [] })
}

async function handleAdminCreateItem(req, res) {
  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: admin only' })
  }

  const { name, description, coin_price, stock, image_url } = req.body
  if (!name || coin_price === undefined) {
    return res.status(400).json({ error: 'name and coin_price are required' })
  }

  const { data: item, error: insertErr } = await supabase
    .from('store_items')
    .insert({
      name,
      description: description ?? null,
      coin_price,
      stock: stock ?? -1,
      image_url: image_url ?? null,
      is_available: true
    })
    .select()
    .single()

  if (insertErr) return res.status(500).json({ error: insertErr.message })

  return res.status(201).json({ success: true, item })
}

async function handleAdminUpdateItem(req, res) {
  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: admin only' })
  }

  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'id query param is required' })

  const { name, description, coin_price, stock, image_url, is_available } = req.body

  const updates = {}
  if (name !== undefined) updates.name = name
  if (description !== undefined) updates.description = description
  if (coin_price !== undefined) updates.coin_price = coin_price
  if (stock !== undefined) updates.stock = stock
  if (image_url !== undefined) updates.image_url = image_url
  if (is_available !== undefined) updates.is_available = is_available

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No fields to update' })
  }

  const { data: item, error: updateErr } = await supabase
    .from('store_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (updateErr) return res.status(500).json({ error: updateErr.message })

  return res.status(200).json({ success: true, item })
}
