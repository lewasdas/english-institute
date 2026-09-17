import { getAuthUser } from '../_lib/authMiddleware.js'
import { setCors } from '../_lib/cors.js'
import supabase from '../_lib/supabase.js'

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).end()

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
