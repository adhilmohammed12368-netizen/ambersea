alter table public.orders add constraint agency_terms check(commercial_model<>'Agency' or(nullif(trim(commission_payer),'') is not null and nullif(trim(commission_agreement),'') is not null and(commission_method<>'Per kg' or(commission_quantity_kg is not null and commission_quantity_kg>0)) and(commission_method<>'Percentage' or commission_rate<=100)));
alter table public.documents add column quote_id uuid references public.quotes;
create index documents_quote_id_idx on public.documents(quote_id);
create function private.specification_guard() returns trigger language plpgsql set search_path='' as $$declare method text;begin
 select catch_method into method from public.products where id=new.product_id;
 if method in('Hook','Net') and new.catch_method is not null and lower(new.catch_method)<>lower(method) then raise exception 'Catch method must match the product catalog';end if;return new;end$$;
create trigger rfq_method before insert or update on public.rfq_items for each row execute function private.specification_guard();
revoke all on function private.specification_guard() from public,anon;
