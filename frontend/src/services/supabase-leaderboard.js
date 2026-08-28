// Service classement Supabase — QuranReview
import { supabaseClient } from './supabase-client.js';
import { getAuthenticatedProfile } from './supabase-auth.js';

export async function getLeaderboard() {
    try {
        const { data, error } = await supabaseClient
            .from('leaderboard')
            .select('*')
            .order('total_points', { ascending: false })
            .limit(50);

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

export async function getMyPoints() {
    try {
        const { data: profile, error: profileError } = await getAuthenticatedProfile();
        if (profileError || !profile) return { data: null, error: profileError };

        const { data, error } = await supabaseClient
            .from('points_log')
            .select('delta, reason, created_at')
            .eq('student_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) return { data: null, error };

        const logs = data || [];
        const total = logs.reduce((sum, row) => sum + (row.delta || 0), 0);
        return { data: { total, logs }, error: null };
    } catch (error) {
        return { data: null, error };
    }
}
