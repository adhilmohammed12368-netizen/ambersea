import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
import {commission,earnings} from '../src/domain.mjs';

const db=new PGlite();
await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`);
for(const file of ['schema.sql','workflows.sql','company.sql','import_stock.sql','commercial_controls.sql'])
  await db.exec(await readFile(new URL('../db/'+file,import.meta.url),'utf8'));
const ids={admin:'30000000-0000-0000-0000-000000000001',sales:'30000000-0000-0000-0000-000000000002',procurement:'30000000-0000-0000-0000-000000000003',outsider:'30000000-0000-0000-0000-000000000004'};
for(const [role,id] of Object.entries(ids)){
  await db.query('insert into auth.users values($1,$2,now())',[id,role+'@test.invalid']);
  if(role!=='outsider'){await db.query('insert into memberships(email,role) values($1,$2)',[role+'@test.invalid',role]);await db.query('insert into profiles values($1,$2,$3,$3,true)',[id,role+'@test.invalid',role]);}
}
async function as(role,sql,params=[]){await db.exec(`reset role;set request.jwt.claim.sub='${ids[role]}';set role authenticated`);return db.query(sql,params)}

test('Ambersea catalog includes all products, unlike Delsea scope',async()=>{
  const names=(await as('admin','select name from products order by name')).rows.map(x=>x.name);
  assert.ok(names.includes('Shrimp'));
  assert.ok(names.includes('Hook-caught ribbonfish'));
  assert.ok(names.includes('Net-caught ribbonfish'));
  assert.equal(names.length,11);
  await as('admin',"insert into products(name) values('Red snapper')");
  assert.equal((await as('admin',"select count(*)::int n from products where name='Red snapper'")).rows[0].n,1);
});
test('unauthorized visitor cannot read the Ambersea buyer list',async()=>{
  await as('admin',"insert into buyers(name,country)values('Ambersea test buyer','IN')");
  assert.equal((await as('outsider','select * from buyers')).rows.length,0);
});
test('Agency revenue is only the commission, not the buyer purchase total',async()=>{
  const buyer=(await as('admin',"select id from buyers where name='Ambersea test buyer'")).rows[0].id;
  // Manual orders require admin approval and order.total is database-controlled.
  const args=[buyer, 'PO-AGENCY-TEST','Buyer acceptance #123','Agency','Per kg',0.1,25500,'Exporter','Written commission agreement'];
  const order=(await as('admin',"insert into orders(buyer_id,po_reference,acceptance_reference,commercial_model,commission_method,commission_rate,commission_quantity_kg,commission_payer,commission_agreement)values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *",args)).rows[0];
  assert.equal(commission(order),2550);
  assert.equal(earnings(order),2550);
  await assert.rejects(as('admin',"insert into orders(buyer_id,po_reference,acceptance_reference,commercial_model,commission_method,commission_rate,commission_quantity_kg)values($1,'PO-NO-AGREEMENT','test','Agency','Per kg',0.10,25500)",[buyer]));
});
test('Only procurement/admin can create supplier offers; sales can create enquiries',async()=>{
  const buyer=(await as('admin',"select id from buyers where name='Ambersea test buyer'")).rows[0].id;
  const prod=(await as('admin',"select id from products where name='Shrimp'")).rows[0].id;
  const rfq=(await as('sales',"insert into rfqs(buyer_id,title)values($1,'Shrimp enquiry')returning id",[buyer])).rows[0].id;
  const supplier=(await as('procurement',"insert into suppliers(name)values('Supplier test')returning id")).rows[0].id;
  const sql="insert into supplier_offers(supplier_id,rfq_id,product_id,quantity_kg,unit_price)values($1,$2,$3,5000,4.75)";
  await assert.rejects(as('sales',sql,[supplier,rfq,prod]));
  await as('procurement',sql,[supplier,rfq,prod]);
  assert.equal((await as('procurement','select count(*)::int n from supplier_offers where rfq_id=$1',[rfq])).rows[0].n,1);
});

after(async()=>{await db.close()});

// Identity and authorization checks must be enforceable by PostgreSQL, not merely hidden in UI.
test('revoking the active allowlist entry denies an existing signed-in user',async()=>{
  assert.ok((await as('sales','select * from products')).rows.length>0);
  await as('admin',"update memberships set active=false where email='sales@test.invalid'");
  assert.equal((await as('sales','select * from products')).rows.length,0);
  await as('admin',"update memberships set active=true where email='sales@test.invalid'");
  assert.ok((await as('sales','select * from products')).rows.length>0);
});

test('changing an allowlist role forces membership re-claim, never privilege escalation',async()=>{
  await as('admin',"update memberships set role='procurement' where email='sales@test.invalid'");
  assert.equal((await as('sales','select * from products')).rows.length,0);
  await as('sales','select claim_membership()');
  const updated=(await as('sales','select role from profiles where id=$1',[ids.sales])).rows[0].role;
  assert.equal(updated,'procurement');
  await as('admin',"update memberships set role='sales' where email='sales@test.invalid'");
  await as('sales','select claim_membership()');
  assert.equal((await as('sales','select role from profiles where id=$1',[ids.sales])).rows[0].role,'sales');
});
