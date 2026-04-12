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
    const { data: authData, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !authData?.user) return { data: null, error: authError }

    const { data, error } = await supabaseClient
      .from('points_log')
      .select('delta')
      .eq('student_id', authData.user.id)

    if (error) return { data: null, error }

    const total = (data || []).reduce((sum, row) => sum + (row.delta || 0), 0)
    return { data: { total }, error: null }
  } catch (error) {
    return { data: null, error }
  }
}
