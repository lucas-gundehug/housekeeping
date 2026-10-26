import { createClient } from "@supabase/supabase-js";

// personal-dashboard's own Supabase project, accessed directly (no proxy:
// there's no runtime-mutable password mixed into a session-signing key here
// that would make a static secret impractical). Uses the same service-role
// key as personal-dashboard's own SUPABASE_SERVICE_ROLE_KEY.
const url = process.env.PERSONAL_DASHBOARD_SUPABASE_URL;
const key = process.env.PERSONAL_DASHBOARD_SUPABASE_SERVICE_ROLE_KEY;

export const personalDashboardSupabase =
  url && key
    ? createClient(url, key, { auth: { persistSession: false } })
    : null;
