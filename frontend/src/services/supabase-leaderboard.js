// Service classement Supabase — QuranReview
import { supabaseClient } from './supabase-client.js'

export async function getLeaderboard() {
  try {
    const { data, error } = await supabaseClient
      .from('leaderboard')
      .select('*')
      .order('total_points', { ascending: false })
      .limit(50)

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getMyPoints() {
  try {
    const localUser = JSON.parse(localStorage.getItem('quranreview_user') || 'null')
    if (!localUser?.username) return { data: { total: 0 }, error: null }

    const { data: profile } = await supabaseClient
      .from('profiles').select('id').eq('username', localUser.username).maybeSingle()
    if (!profile) return { data: { total: 0 }, error: null }

    const { data, error } = await supabaseClient
      .from('points_log')
      .select('delta')
      .eq('student_id', profile.id)

    if (error) return { data: null, error }

    const total = (data || []).reduce((sum, row) => sum + (row.delta || 0), 0)
    return { data: { total }, error: null }
  } catch (error) {
    return { data: null, error }
  }
}
