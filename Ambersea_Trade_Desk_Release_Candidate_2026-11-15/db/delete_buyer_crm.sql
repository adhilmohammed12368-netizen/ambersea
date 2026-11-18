-- Additive migration. Creates a transactional deletion operation; does not delete any data on deployment.
-- The database, not the browser, decides whether records are safe to delete.
create or replace function private.delete_buyer_crm(p_buyer uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  removed_research bigint := 0;
  removed_contacts bigint := 0;
  removed_communications bigint := 0;
  removed_tasks bigint := 0;
  removed_buyer bigint := 0;
begin
  -- Do not rely on stale profile roles alone; verify active and confirmed auth membership.
  if (select auth.uid()) is null or not exists (
    select 1 from public.profiles p
    join auth.users u on u.id = p.id
    join public.memberships m on m.email = lower(u.email)
    where p.id = (select auth.uid())
      and p.active and p.role = 'admin' and m.active and m.role = p.role
      and u.email_confirmed_at is not null
  ) then raise exception 'Administrator authorization required' using errcode='42501'; end if;

  -- Lock parent and reject missing/deleted records before touching children.
  perform 1 from public.buyers where id = p_buyer for update;
  if not found then raise exception 'Buyer not found' using errcode='P0002'; end if;

  -- Never erase commercial or supporting shipping records from a CRM deletion.
  if exists(select 1 from public.rfqs where buyer_id=p_buyer)
    or exists(select 1 from public.quotes where buyer_id=p_buyer)
    or exists(select 1 from public.orders where buyer_id=p_buyer)
    or exists(select 1 from public.documents where buyer_id=p_buyer)
  then raise exception 'Buyer has commercial or document records. Archive instead.'
    using errcode='23503'; end if;

  -- The entire operation is atomic; a constraint or permission failure rolls it back.
  delete from public.communications where buyer_id=p_buyer;
  get diagnostics removed_communications = row_count;
  delete from public.contacts where buyer_id=p_buyer;
  get diagnostics removed_contacts = row_count;
  delete from public.research_sources where buyer_id=p_buyer;
  get diagnostics removed_research = row_count;
  delete from public.tasks where buyer_id=p_buyer;
  get diagnostics removed_tasks = row_count;
  delete from public.buyers where id=p_buyer;
  get diagnostics removed_buyer = row_count;
  if removed_buyer <> 1 then raise exception 'Buyer delete was not completed'; end if;

  return jsonb_build_object(
    'buyer',removed_buyer,'communications',removed_communications,
    'contacts',removed_contacts,'research_sources',removed_research,'tasks',removed_tasks
  );
end $$;

revoke all on function private.delete_buyer_crm(uuid) from public, anon;
grant execute on function private.delete_buyer_crm(uuid) to authenticated;

create or replace function public.delete_buyer_crm(p_buyer uuid) returns jsonb
language sql security invoker set search_path='' as
$$ select private.delete_buyer_crm(p_buyer) $$;

revoke all on function public.delete_buyer_crm(uuid) from public, anon;
grant execute on function public.delete_buyer_crm(uuid) to authenticated;
