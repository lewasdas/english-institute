import { getAuthUser } from '../_lib/authMiddleware.js'
import { setCors } from '../_lib/cors.js'
import supabase from '../_lib/supabase.js'

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: admin only' })
  }

  // GET - list all users with wallet balance
  if (req.method === 'GET') {
    try {
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
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  // POST - create new user
  if (req.method === 'POST') {
    const { full_name, email, password, role } = req.body
    if (!full_name || !email || !password || !role) {
      return res.status(400).json({ error: 'full_name, email, password and role are required' })
    }

    const validRoles = ['student', 'teacher', 'admin']
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `role must be one of: ${validRoles.join(', ')}` })
    }

    try {
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
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
