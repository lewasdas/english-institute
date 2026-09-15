import { getAuthUser } from '../_lib/authMiddleware.js'
import { setCors } from '../_lib/cors.js'
import supabase from '../_lib/supabase.js'

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

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
