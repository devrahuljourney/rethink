import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseAdmin: SupabaseClient | undefined;

// Server-only client for admin APIs and Storage management; never expose this key to the app.
// Created lazily so a missing key only breaks admin features, not the whole server.
export default function getSupabaseAdmin(): SupabaseClient {
    if (supabaseAdmin) return supabaseAdmin;

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if(!supabaseUrl || !serviceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY env is missing (Supabase dashboard > Project Settings > API Keys > secret key).')
    }

    supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
    return supabaseAdmin;
}
