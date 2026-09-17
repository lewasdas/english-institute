import { getAuthUser } from './_lib/authMiddleware.js'
import { setCors } from './_lib/cors.js'
import supabase from './_lib/supabase.js'

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    if (req.method === 'GET') return await handleGetWallet(req, res)
    if (req.method === 'POST') return await handleAssignCoins(req, res)
    return res.status(405).end()
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// GET /api/wallet?studentId=xxx
async function handleGetWallet(req, res) {
  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })

  const { studentId } = req.query
  if (!studentId) return res.status(400).json({ error: 'studentId query param is required' })

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

// POST /api/wallet  body: { action: 'assign', studentId, amount, reason }
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
