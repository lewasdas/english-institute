import { getAuthUser } from '../_lib/authMiddleware.js'
import { setCors } from '../_lib/cors.js'
import supabase from '../_lib/supabase.js'

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })

  try {
    const { data: items, error: itemsErr } = await supabase
      .from('store_items')
      .select('id, name, description, coin_price, stock, image_url, is_available')
      .eq('is_available', true)
      .or('stock.gt.0,stock.eq.-1')
      .order('coin_price', { ascending: true })

    if (itemsErr) return res.status(500).json({ error: itemsErr.message })

    return res.status(200).json({ items: items ?? [] })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
