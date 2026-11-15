/** Validate public frontend configuration before displaying sign-in. */
export function checkConnectionConfig(url, key, expectedRef = 'xgjoanqeepaxfstutlfx') {
  const rawUrl = String(url || '').trim();
  const rawKey = String(key || '').trim();
  if (!rawUrl || !rawKey || /REPLACE_|YOUR_|PLACEHOLDER/i.test(rawKey))
    return 'Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in Vercel, then redeploy.';
  let parsed;
  try { parsed = new URL(rawUrl); }
  catch { return 'VITE_SUPABASE_URL is not a valid URL.'; }
  if (parsed.protocol !== 'https:' || !/^[a-z0-9-]+\.supabase\.co$/.test(parsed.hostname))
    return 'VITE_SUPABASE_URL must use an HTTPS Supabase project address.';
  if (parsed.hostname !== `${expectedRef}.supabase.co`)
    return 'The configured database belongs to a different Supabase project. Check the AMBERSEA project ID before proceeding.';
  if (!rawKey.startsWith('sb_publishable_') || rawKey.length < 25)
    return 'Use the active Supabase publishable key. Never use a secret or service-role key in a website.';
  return null;
}
