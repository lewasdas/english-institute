import { getAuthUser } from '../_lib/authMiddleware.js'
import { setCors } from '../_lib/cors.js'
import supabase from '../_lib/supabase.js'

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    if (req.method === 'GET') return await handleStoreItems(req, res)
    if (req.method === 'POST') return await handleStorePurchase(req, res)
    return res.status(405).end()
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// GET /api/store
async function handleStoreItems(req, res) {
  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })

  const { data: items, error: itemsErr } = await supabase
    .from('store_items')
    .select('id, name, description, coin_price, stock, image_url, is_available')
    .eq('is_available', true)
    .or('stock.gt.0,stock.eq.-1')
    .order('coin_price', { ascending: true })

  if (itemsErr) return res.status(500).json({ error: itemsErr.message })

  // Map coin_price → price for frontend compatibility
  const mapped = (items ?? []).map(item => ({ ...item, price: item.coin_price }))

  return res.status(200).json(mapped)
}

// POST /api/store  body: { itemId, quantity }
async function handleStorePurchase(req, res) {
  const { user, error } = await getAuthUser(req)
  if (error) return res.status(401).json({ error })
  if (user.role !== 'student') {
    return res.status(403).json({ error: 'Forbidden: only students can purchase items' })
  }

  const { itemId, quantity = 1 } = req.body
  if (!itemId) return res.status(400).json({ error: 'itemId is required' })
  if (quantity < 1) return res.status(400).json({ error: 'quantity must be at least 1' })

  // Verify item exists and is available
  const { data: item, error: itemErr } = await supabase
    .from('store_items')
    .select('id, name, coin_price, stock, is_available')
    .eq('id', itemId)
    .single()

  if (itemErr || !item) return res.status(404).json({ error: 'Item not found' })
  if (!item.is_available) return res.status(400).json({ error: 'Item is not available' })
  if (item.stock !== -1 && item.stock < quantity) {
    return res.status(400).json({ error: 'Insufficient stock' })
  }

  const totalCost = item.coin_price * quantity

  // Get wallet
  const { data: wallet, error: walletErr } = await supabase
    .from('wallets')
    .select('id, balance')
    .eq('student_id', user.id)
    .single()

  if (walletErr || !wallet) return res.status(404).json({ error: 'Wallet not found' })
  if (wallet.balance < totalCost) {
    return res.status(400).json({ error: 'Insufficient balance' })
  }

  // Insert transaction (negative amount = debit)
  const { error: txErr } = await supabase.from('transactions').insert({
    wallet_id: wallet.id,
    amount: -totalCost,
    reason: `Compra en tienda: ${item.name} x${quantity}`,
    origin: 'store',
    created_by: user.id
  })

  if (txErr) return res.status(500).json({ error: txErr.message })

  // Update balance
  const newBalance = wallet.balance - totalCost
  const { error: balanceErr } = await supabase
    .from('wallets')
    .update({ balance: newBalance })
    .eq('id', wallet.id)

  if (balanceErr) return res.status(500).json({ error: balanceErr.message })

  // Insert purchase record
  const { error: purchaseErr } = await supabase.from('store_purchases').insert({
    item_id: itemId,
    student_id: user.id,
    quantity,
    total_cost: totalCost
  })

  if (purchaseErr) return res.status(500).json({ error: purchaseErr.message })

  // Decrement stock if not unlimited
  if (item.stock !== -1) {
    const { error: stockErr } = await supabase
      .from('store_items')
      .update({ stock: item.stock - quantity })
      .eq('id', itemId)

    if (stockErr) return res.status(500).json({ error: stockErr.message })
  }

  return res.status(200).json({ success: true, newBalance })
}
