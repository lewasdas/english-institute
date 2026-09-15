import axios from 'axios'
import { supabase } from './supabase'

export async function api(method, url, data = null) {
  const { data: { session } } = await supabase.auth.getSession()
  const config = {
    headers: { Authorization: `Bearer ${session?.access_token}` }
  }
  if (method === 'get') return axios.get(url, config)
  if (method === 'post') return axios.post(url, data, config)
  if (method === 'put') return axios.put(url, data, config)
  if (method === 'delete') return axios.delete(url, config)
}
