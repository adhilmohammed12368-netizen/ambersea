create function private.import_stock_lot(payload jsonb,qty numeric) returns uuid language plpgsql security definer set search_path='' as $$declare lot uuid;begin
 perform private.require_roles(array['admin','procurement']);
 if qty is null or qty<=0 then raise exception 'Positive opening stock required';end if;
 insert into public.inventory(product_id,lot_number,species,grade,form,quality_grade,glaze_percent,weight_basis,packing,iwp,zig_zag,carton_net_kg,location,production_date,notes) values((payload->>'product_id')::uuid,payload->>'lot_number',payload->>'species',payload->>'grade',payload->>'form',payload->>'quality_grade',nullif(payload->>'glaze_percent','')::numeric,payload->>'weight_basis',payload->>'packing',payload->>'iwp',coalesce((payload->>'zig_zag')::boolean,false),(payload->>'carton_net_kg')::numeric,payload->>'location',nullif(payload->>'production_date','')::date,payload->>'notes') returning id into lot;
 perform private.move_stock(lot,qty,'Reviewed opening stock import');return lot;end$$;
create function public.import_stock_lot(payload jsonb,qty numeric) returns uuid language sql set search_path='' as $$select private.import_stock_lot(payload,qty)$$;
revoke all on function private.import_stock_lot(jsonb,numeric),public.import_stock_lot(jsonb,numeric) from public,anon;grant execute on function private.import_stock_lot(jsonb,numeric),public.import_stock_lot(jsonb,numeric) to authenticated;
-- Procurement can retain import logs without gaining buyer write permissions.
drop policy role_insert on public.import_batches;
create policy role_insert on public.import_batches for insert to authenticated with check((select private.role()) in('admin','procurement'));
