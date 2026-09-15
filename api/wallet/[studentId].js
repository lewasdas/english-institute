import { getAuthUser } from '../_lib/authMiddleware.js'
import { setCors } from '../_lib/cors.js'
import supabase from '../_lib/supabase.js'

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })

  const { studentId } = req.query
  if (user.role === 'student' && user.id !== studentId) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance')
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
