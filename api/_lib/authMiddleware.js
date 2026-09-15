import supabase from './supabase.js'

export async function getAuthUser(req) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, error: 'No token provided' }
  }
  const token = authHeader.split(' ')[1]
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return { user: null, error: 'Invalid token' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile) return { user: null, error: 'Profile not found' }
  return { user: { ...profile, email: user.email }, error: null }
}
