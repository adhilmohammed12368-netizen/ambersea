create function private.create_quote(payload jsonb, lines jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare q uuid; b public.buyers; prev public.quotes; item jsonb; num text; rev int:=1; total_value numeric;begin
 perform private.require_roles(array['admin','sales']);
 select * into b from public.buyers where id=(payload->>'buyer_id')::uuid;
 if b.id is null or b.opt_out or b.stage='Do Not Contact' then raise exception 'Buyer unavailable or suppressed';end if;
 if jsonb_typeof(lines)<>'array' or jsonb_array_length(lines)<1 or jsonb_array_length(lines)>100 then raise exception 'Provide 1–100 quote lines';end if;
 select sum((x->>'quantity_kg')::numeric*(x->>'unit_price')::numeric) into total_value from jsonb_array_elements(lines) x;
 if nullif(payload->>'previous_quote_id','') is not null then
 select * into prev from public.quotes where id=(payload->>'previous_quote_id')::uuid for update;
 if prev.id is null or prev.buyer_id<>b.id or prev.status='Accepted' then raise exception 'Invalid revision';end if;
 rev=prev.revision+1;num=regexp_replace(prev.number,'-R[0-9]+$','')||'-R'||rev;
 else num=(select case company when 'Delsea' then 'DEL' else 'AMB' end from public.settings)||'-'||to_char(now(),'YYYY')||'-'||lpad(nextval('public.quote_number')::text,5,'0')||'-R1';end if;
 insert into public.quotes(number,revision,previous_quote_id,buyer_id,rfq_id,buyer_snapshot,currency,incoterm,destination,payment_terms,shipment_window,valid_until,notes,total,estimated_cost,probability,expected_close)
 values(num,rev,prev.id,b.id,nullif(payload->>'rfq_id','')::uuid,to_jsonb(b),payload->>'currency',payload->>'incoterm',payload->>'destination',payload->>'payment_terms',payload->>'shipment_window',(payload->>'valid_until')::date,payload->>'notes',total_value,nullif(payload->>'estimated_cost','')::numeric,coalesce(nullif(payload->>'probability','')::numeric,0),nullif(payload->>'expected_close','')::date) returning id into q;
 for item in select * from jsonb_array_elements(lines) loop insert into public.quote_items(quote_id,product_id,description,quantity_kg,unit_price,packing,container_group) values(q,(item->>'product_id')::uuid,item->>'description',(item->>'quantity_kg')::numeric,(item->>'unit_price')::numeric,item->>'packing',item->>'container_group');end loop;
 return q;end$$;
create function public.create_quote(payload jsonb,lines jsonb) returns uuid language sql set search_path='' as $$select private.create_quote(payload,lines)$$;
create function private.quote_status(qid uuid,new_status text,evidence text) returns void language plpgsql security definer set search_path='' as $$declare q public.quotes;begin
 perform private.require_roles(array['admin','sales']);select * into q from public.quotes where id=qid for update;
 if q.id is null then raise exception 'Quote missing';end if;
 if exists(select 1 from public.buyers where id=q.buyer_id and(opt_out or stage='Do Not Contact')) then raise exception 'Buyer suppressed';end if;
 if new_status='Approved' then perform private.require_roles(array['admin']);if q.status<>'Draft' then raise exception 'Only drafts can be approved';end if;
 elsif new_status='Sent' then
 if q.status not in('Draft','Approved') or ((select require_approval from public.settings) and q.status<>'Approved') then raise exception 'Approval required or invalid transition';end if;
 if q.valid_until<current_date or nullif(trim(evidence),'') is null then raise exception 'Valid offer and actual-send evidence required';end if;
 elsif new_status='Accepted' then
 if q.status<>'Sent' or nullif(trim(evidence),'') is null then raise exception 'Sent offer and acceptance evidence required';end if;
 elsif new_status='Rejected' then if q.status not in('Sent','Approved','Draft') then raise exception 'Invalid transition';end if;
 else raise exception 'Unsupported status';end if;
 update public.quotes set status=new_status,approved_by=case when new_status='Approved' then auth.uid() else approved_by end,sent_evidence=case when new_status='Sent' then evidence else sent_evidence end,acceptance_reference=case when new_status='Accepted' then evidence else acceptance_reference end where id=qid;
end$$;
create function public.quote_status(qid uuid,new_status text,evidence text) returns void language sql set search_path='' as $$select private.quote_status(qid,new_status,evidence)$$;
create function private.order_from_quote(qid uuid,po text) returns uuid language plpgsql security definer set search_path='' as $$declare q public.quotes;o uuid;begin
 perform private.require_roles(array['admin','sales']);select * into q from public.quotes where id=qid for update;
 if q.status is distinct from 'Accepted' then raise exception 'Buyer acceptance required';end if;
 if (select require_approval from public.settings) and q.approved_by is null then raise exception 'Commercial approval required';end if;
 insert into public.orders(buyer_id,quote_id,po_reference,acceptance_reference,currency,total,payment_terms) values(q.buyer_id,q.id,po,q.acceptance_reference,q.currency,q.total,q.payment_terms) returning id into o;
 insert into public.order_items(order_id,product_id,description,quantity_kg,unit_price,packing) select o,product_id,description,quantity_kg,unit_price,packing from public.quote_items where quote_id=q.id;return o;end$$;
create function public.order_from_quote(qid uuid,po text) returns uuid language sql set search_path='' as $$select private.order_from_quote(qid,po)$$;
create function private.move_stock(lot uuid,qty numeric,reason_text text) returns void language plpgsql security definer set search_path='' as $$declare s public.inventory;reserved numeric;begin
 perform private.require_roles(array['admin','procurement']);select * into s from public.inventory where id=lot for update;
 select coalesce(sum(quantity_kg),0) into reserved from public.reservations where inventory_id=lot and status='Active';
 if s.id is null or qty is null or qty=0 or nullif(trim(reason_text),'') is null or s.on_hand_kg+qty<reserved then raise exception 'Invalid movement or insufficient unreserved stock';end if;
 update public.inventory set on_hand_kg=on_hand_kg+qty where id=lot;
 insert into public.stock_movements(inventory_id,quantity_kg,reason,actor) values(lot,qty,reason_text,auth.uid());end$$;
create function public.move_stock(lot uuid,qty numeric,reason_text text) returns void language sql set search_path='' as $$select private.move_stock(lot,qty,reason_text)$$;
create function private.reserve_stock(lot uuid,oid uuid,qty numeric) returns uuid language plpgsql security definer set search_path='' as $$declare s public.inventory;r uuid;reserved numeric;demand numeric;allocated numeric;begin
 perform private.require_roles(array['admin','sales','procurement']);perform 1 from public.orders where id=oid and status not in('Cancelled','Completed') for update;if not found then raise exception 'Active order required';end if;
 select * into s from public.inventory where id=lot for update;
 select coalesce(sum(quantity_kg),0) into reserved from public.reservations where inventory_id=lot and status='Active';
 select coalesce(sum(quantity_kg),0) into demand from public.order_items where order_id=oid and product_id=s.product_id;
 select coalesce(sum(r.quantity_kg),0) into allocated from public.reservations r join public.inventory i on i.id=r.inventory_id where r.order_id=oid and i.product_id=s.product_id and r.status in('Active','Dispatched');
 if qty is null or qty<=0 or s.quality_status is distinct from 'Released' or qty>s.on_hand_kg-reserved or qty>demand-allocated then raise exception 'Insufficient released stock or order demand';end if;
 insert into public.reservations(inventory_id,order_id,quantity_kg) values(lot,oid,qty) returning id into r;return r;end$$;
create function public.reserve_stock(lot uuid,oid uuid,qty numeric) returns uuid language sql set search_path='' as $$select private.reserve_stock(lot,oid,qty)$$;
create function private.finish_reservation(rid uuid,dispatch boolean) returns void language plpgsql security definer set search_path='' as $$declare r public.reservations;s public.inventory;begin
 perform private.require_roles(array['admin','procurement']);select * into r from public.reservations where id=rid for update;
 if r.status is distinct from 'Active' then raise exception 'Active reservation required';end if;
 select * into s from public.inventory where id=r.inventory_id for update;
 if dispatch then
 if s.quality_status<>'Released' then raise exception 'Quality release required';end if;
 update public.inventory set on_hand_kg=on_hand_kg-r.quantity_kg where id=s.id;
 insert into public.stock_movements(inventory_id,quantity_kg,reason,order_id,actor) values(s.id,-r.quantity_kg,'Reservation dispatched',r.order_id,auth.uid());end if;
 update public.reservations set status=case when dispatch then 'Dispatched' else 'Released' end where id=rid;
 end$$;
create function public.finish_reservation(rid uuid,dispatch boolean) returns void language sql set search_path='' as $$select private.finish_reservation(rid,dispatch)$$;
create function private.complete_task(tid uuid) returns void language plpgsql security definer set search_path='' as $$declare t public.tasks;begin
 perform private.require_roles(array['admin','sales','procurement']);select * into t from public.tasks where id=tid for update;
 if t.id is null or t.status='Completed' then raise exception 'Open task required';end if;
 update public.tasks set status='Completed',completed_at=now() where id=tid;
 if t.recurring_days>0 then insert into public.tasks(buyer_id,title,due_on,priority,owner_id,recurring_days,notes) values(t.buyer_id,t.title,greatest(t.due_on,current_date)+t.recurring_days,t.priority,t.owner_id,t.recurring_days,t.notes);end if;end$$;
create function public.complete_task(tid uuid) returns void language sql set search_path='' as $$select private.complete_task(tid)$$;
-- Protect integrity of allocations and server totals during ordinary edits.
create function private.line_guard() returns trigger language plpgsql security definer set search_path='' as $$declare oid uuid;begin
 oid=coalesce(new.order_id,old.order_id);perform 1 from public.orders where id=oid for update;
 if exists(select 1 from public.reservations where order_id=oid and status in('Active','Dispatched')) then raise exception 'Release allocations before editing order lines';end if;return coalesce(new,old);end$$;
create trigger order_line_guard before insert or update or delete on public.order_items for each row execute function private.line_guard();
create function private.order_total() returns trigger language plpgsql security definer set search_path='' as $$begin
 update public.orders set total=(select coalesce(sum(quantity_kg*unit_price),0) from public.order_items where order_id=coalesce(new.order_id,old.order_id)) where id=coalesce(new.order_id,old.order_id);return coalesce(new,old);end$$;
create trigger order_total after insert or update or delete on public.order_items for each row execute function private.order_total();
revoke insert,update on public.orders from authenticated;
grant insert(buyer_id,po_reference,acceptance_reference,status,currency,actual_cost,payment_terms,expected_delivery,commercial_model,commission_method,commission_rate,commission_quantity_kg,commission_payer,commission_agreement) on public.orders to authenticated;
grant update(status,actual_cost,payment_terms,expected_delivery,commission_method,commission_rate,commission_quantity_kg,commission_payer,commission_agreement) on public.orders to authenticated;
-- Approved quote conversion is required for commitments when configured.
create function private.order_guard() returns trigger language plpgsql set search_path='' as $$begin
 if tg_op='INSERT' and new.quote_id is null and(select require_approval from public.settings) and private.role()<>'admin' then raise exception 'Administrator approval required for manual orders';end if;return new;end$$;
create trigger order_guard before insert on public.orders for each row execute function private.order_guard();
DO $$declare f record;begin
 for f in select p.oid::regprocedure sig,n.nspname,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in('public','private') and p.proname in('create_quote','quote_status','order_from_quote','move_stock','reserve_stock','finish_reservation','complete_task') loop
 execute format('revoke all on function %s from public, anon',f.sig);execute format('grant execute on function %s to authenticated',f.sig);end loop;
end$$;
revoke all on function private.line_guard(),private.order_total(),private.order_guard() from public,anon;
create function private.inventory_identity() returns trigger language plpgsql set search_path='' as $$begin
 if new.product_id<>old.product_id and exists(select 1 from public.stock_movements where inventory_id=old.id) then raise exception 'Product cannot change after stock movement';end if;return new;end$$;
create trigger inventory_identity before update on public.inventory for each row execute function private.inventory_identity();
revoke all on function private.inventory_identity() from public,anon;
revoke update on public.order_items from authenticated;grant update(product_id,description,quantity_kg,unit_price,packing) on public.order_items to authenticated;
revoke update on public.tasks from authenticated;grant update(buyer_id,title,due_on,priority,owner_id,recurring_days,notes) on public.tasks to authenticated;
