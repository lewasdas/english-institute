import { getAuthUser } from '../_lib/authMiddleware.js'
import { setCors } from '../_lib/cors.js'
import supabase from '../_lib/supabase.js'

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const { resource } = req.query

    if (req.method === 'GET') {
      if (resource === 'stats') return await handleAdminStats(req, res)
      if (resource === 'users') return await handleAdminGetUsers(req, res)
      if (resource === 'items') return await handleAdminGetItems(req, res)
      return res.status(400).json({ error: 'Unknown resource. Use ?resource=stats|users|items' })
    }

    if (req.method === 'POST') {
      if (resource === 'users') return await handleAdminCreateUser(req, res)
      if (resource === 'items') return await handleAdminCreateItem(req, res)
      return res.status(400).json({ error: 'Unknown resource. Use ?resource=users|items' })
    }

    if (req.method === 'PUT') {
      if (resource === 'items') return await handleAdminUpdateItem(req, res)
      return res.status(400).json({ error: 'Unknown resource. Use ?resource=items' })
    }

    return res.status(405).end()
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// GET /api/admin?resource=stats
async function handleAdminStats(req, res) {
  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })
  if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })

  const [
    { count: totalStudents },
    { data: wallets },
    { count: pendingPurchases },
    { data: recentTx }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('wallets').select('balance'),
    supabase.from('store_purchases').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase
      .from('transactions')
      .select('id, amount, reason, origin, created_at, wallets(student_id, profiles(full_name))')
      .order('created_at', { ascending: false })
      .limit(10)
  ])

  const totalCirculation = wallets?.reduce((sum, w) => sum + (w.balance || 0), 0) ?? 0

  return res.status(200).json({
    totalStudents: totalStudents ?? 0,
    totalHF: totalCirculation,
    totalCirculation,
    pendingRedemptions: pendingPurchases ?? 0,
    pendingPurchases: pendingPurchases ?? 0,
    recentTransactions: recentTx ?? []
  })
}

// GET /api/admin?resource=users
async function handleAdminGetUsers(req, res) {
  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })
  if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden: admin only' })

  const { data: profiles, error: profilesErr } = await supabase
    .from('profiles')
    .select('id, full_name, role, created_at')
    .order('created_at', { ascending: false })

  if (profilesErr) return res.status(500).json({ error: profilesErr.message })

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

  return res.status(200).json(result)
}

// POST /api/admin?resource=users  body: { full_name, email, password, role }
async function handleAdminCreateUser(req, res) {
  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })
  if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden: admin only' })

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
    .insert({ id: newUser.id, full_name, role })
    .select()
    .single()

  if (profileErr) return res.status(500).json({ error: profileErr.message })

  return res.status(201).json({ success: true, user: { ...profile, email: newUser.email } })
}

// GET /api/admin?resource=items
async function handleAdminGetItems(req, res) {
  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })
  if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden: admin only' })

  const { data: items, error: itemsErr } = await supabase
    .from('store_items')
    .select('id, name, description, coin_price, stock, image_url, is_available, created_at')
    .order('created_at', { ascending: false })

  if (itemsErr) return res.status(500).json({ error: itemsErr.message })

  return res.status(200).json({ items: items ?? [] })
}

// POST /api/admin?resource=items  body: { name, description, coin_price, stock, image_url }
async function handleAdminCreateItem(req, res) {
  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })
  if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden: admin only' })

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

// PUT /api/admin?resource=items&id=xxx  body: { ...fields }
async function handleAdminUpdateItem(req, res) {
  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })
  if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden: admin only' })

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
