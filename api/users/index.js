import { getAuthUser } from '../_lib/authMiddleware.js'
import { setCors } from '../_lib/cors.js'
import supabase from '../_lib/supabase.js'

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

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
