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
    return res.status(403).json({ error: 'Forbidden: only students can complete games' })
  }

  const { roomId, score } = req.body
  if (!roomId) return res.status(400).json({ error: 'roomId is required' })

  try {
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
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
