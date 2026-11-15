-- AMBERSEA ONLY. Apply once to existing Ambersea Supabase project after review.
-- Authorizes live roles against the ACTIVE membership allowlist, not just a previously created profile.
-- A deactivated membership immediately loses DB/Storage access on the next request.
-- A membership role change is reflected in the existing profile at the next claim_membership call.
-- Existing profile.active=false remains suspended, even if the allowlist permits access.
-- IMPORTANT: verify an active admin membership and confirmed Auth user BEFORE applying.
begin;
create or replace function private.role() returns text
language sql stable security definer set search_path='' as $$
 select p.role from public.profiles p
 join auth.users u on u.id=p.id
 join public.memberships m on m.email=lower(u.email) and m.active and m.role=p.role
 where p.id=(select auth.uid()) and p.active and u.email_confirmed_at is not null
$$;
create or replace function private.claim() returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 insert into public.profiles(id,email,display_name,role)
 select u.id,lower(u.email),split_part(u.email,'@',1),m.role
 from auth.users u join public.memberships m on m.email=lower(u.email) and m.active
 where u.id=auth.uid() and u.email_confirmed_at is not null
 on conflict(id) do update set email=excluded.email,role=excluded.role;
end
$$;
revoke all on function private.role(), private.claim() from public, anon;
grant execute on function private.role(), private.claim() to authenticated;
commit;
-- Post-deployment verification: sign in as admin, disable a TEST membership and verify
-- both public.buyers SELECT and private Storage downloads are denied; then restore.
