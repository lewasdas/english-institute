const { supabase } = require('../config/supabase')

async function getBalance(studentId) {
  const { data, error } = await supabase
    .from('wallets')
    .select('id, student_id, balance')
    .eq('student_id', studentId)
    .single()

  if (error) throw new Error(`Wallet no encontrado para el alumno: ${error.message}`)

  return data
}

async function assignCoins(studentId, amount, reason, createdBy, origin) {
  // Obtener wallet actual
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('id, balance')
    .eq('student_id', studentId)
    .single()

  if (walletError || !wallet) {
    throw new Error('Wallet no encontrado para este alumno')
  }

  const newBalance = wallet.balance + amount

  if (newBalance < 0) {
    throw new Error(`Saldo insuficiente. Balance actual: ${wallet.balance}, intento de descuento: ${Math.abs(amount)}`)
  }

  // Insertar transacción
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .insert({
      wallet_id: wallet.id,
      amount,
      reason,
      origin,
      created_by: createdBy || null,
    })
    .select()
    .single()

  if (txError) throw new Error(`Error al crear transacción: ${txError.message}`)

  // Actualizar balance en wallet
  const { data: updatedWallet, error: updateError } = await supabase
    .from('wallets')
    .update({ balance: newBalance })
    .eq('id', wallet.id)
    .select()
    .single()

  if (updateError) throw new Error(`Error al actualizar balance: ${updateError.message}`)

  return {
    transaction,
    wallet: updatedWallet,
  }
}

module.exports = { getBalance, assignCoins }
