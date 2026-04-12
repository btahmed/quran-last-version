// Module classement — QuranReview
// supabaseClient est exposé globalement par supabase-client.js
const supabaseClient = window.supabaseClient

/**
 * Récupère le classement général depuis la vue SQL 'leaderboard',
 * limité aux 50 premiers, trié par total_points décroissant.
 */
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

/**
 * Calcule le total de points de l'utilisateur connecté
 * en sommant les delta dans points_log.
 * @returns {{ data: { total: number }|null, error }}
 */
export async function getMyPoints() {
  try {
    const { data: authData, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !authData?.user) return { data: null, error: authError }
    const user = authData.user

    const { data, error } = await supabaseClient
      .from('points_log')
      .select('delta')
      .eq('student_id', user.id)

    if (error) return { data: null, error }

    const total = data.reduce((sum, row) => sum + (row.delta || 0), 0)
    return { data: { total }, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Récupère l'historique des points de l'utilisateur connecté,
 * trié par date décroissante.
 */
export async function getMyPointsHistory() {
  try {
    const { data: authData, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !authData?.user) return { data: null, error: authError }
    const user = authData.user

    const { data, error } = await supabaseClient
      .from('points_log')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}
