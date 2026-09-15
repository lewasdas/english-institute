import { getAuthUser } from './_lib/authMiddleware.js'
import { setCors } from './_lib/cors.js'
import supabase from './_lib/supabase.js'

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })

  const { period = 'month' } = req.query

  try {
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
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
