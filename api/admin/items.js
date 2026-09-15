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

  // GET - list all store items
  if (req.method === 'GET') {
    try {
      const { data: items, error: itemsErr } = await supabase
        .from('store_items')
        .select('id, name, description, coin_price, stock, image_url, is_available, created_at')
        .order('created_at', { ascending: false })

      if (itemsErr) return res.status(500).json({ error: itemsErr.message })

      return res.status(200).json({ items: items ?? [] })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  // POST - create new item
  if (req.method === 'POST') {
    const { name, description, coin_price, stock, image_url } = req.body
    if (!name || coin_price === undefined) {
      return res.status(400).json({ error: 'name and coin_price are required' })
    }

    try {
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
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  // PUT - update item by id (query param)
  if (req.method === 'PUT') {
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

    try {
      const { data: item, error: updateErr } = await supabase
        .from('store_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (updateErr) return res.status(500).json({ error: updateErr.message })

      return res.status(200).json({ success: true, item })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
