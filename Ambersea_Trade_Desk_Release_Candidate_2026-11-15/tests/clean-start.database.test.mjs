import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';

const db=new PGlite();
await db.exec(`create role anon; create role authenticated; create schema auth;
create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;`);
for(const file of ['schema.sql','workflows.sql','company.sql','import_stock.sql','commercial_controls.sql','delete_buyer_crm.sql'])
  await db.exec(await readFile(new URL('../db/'+file,import.meta.url),'utf8'));
const ids={admin:'40000000-0000-0000-0000-000000000001',sales:'40000000-0000-0000-0000-000000000002',outsider:'40000000-0000-0000-0000-000000000003'};
for(const [role,id] of Object.entries(ids)){
 await db.query('insert into auth.users values($1,$2,now())',[id,role+'@test.invalid']);
 if(role!=='outsider'){
  await db.query('insert into memberships(email,role)values($1,$2)',[role+'@test.invalid',role]);
  await db.query('insert into profiles(id,email,display_name,role,active) values($1,$2,$3,$3,true)',[id,role+'@test.invalid',role]);
 }
}
async function as(role,query,params=[]){
 await db.exec(`reset role;set request.jwt.claim.sub='${ids[role]}';set role authenticated`);
 return db.query(query,params);
}
test('a new workspace has no inherited buyers, suppliers, orders, tasks or documents',async()=>{
 for(const table of ['buyers','contacts','research_sources','communications','rfqs','quotes','orders','payments','shipments','inventory','documents','costings','suppliers','tasks']){
  const x=await as('admin',`select count(*)::int n from public.${table}`);
  assert.equal(x.rows[0].n,0,table+' was not clean');
 }
 const products=await as('admin','select count(*)::int n from products');
 assert.equal(products.rows[0].n,11);
});
test('admin can atomically delete a buyer and linked CRM records',async()=>{
 const b=(await as('admin',"insert into buyers(name,country)values('Pacific Demo','South Korea') returning id")).rows[0].id;
 await as('admin',"insert into research_sources(buyer_id,title) values($1,'Test source')",[b]);
 await as('admin',"insert into communications(buyer_id,body,direction)values($1,'test draft','Draft')",[b]);
 await as('admin',"insert into contacts(buyer_id,name)values($1,'Test person')",[b]);
 await as('admin',"insert into tasks(buyer_id,title,due_on)values($1,'Demo follow-up',current_date)",[b]);
 await assert.rejects(as('sales','select delete_buyer_crm($1)',[b]),/administrator|permission/i);
 assert.equal((await as('admin','select count(*)::int n from research_sources where buyer_id=$1',[b])).rows[0].n,1);
 const result=(await as('admin','select delete_buyer_crm($1) x',[b])).rows[0].x;
 assert.equal(result.buyer,1);
 assert.equal(result.research_sources,1);
 assert.equal(result.communications,1);
 assert.equal(result.contacts,1);
 assert.equal(result.tasks,1);
 for(const table of ['buyers','contacts','research_sources','communications','tasks']){
  assert.equal((await as('admin',`select count(*)::int n from ${table} where ${table==='buyers'?'id':'buyer_id'}=$1`,[b])).rows[0].n,0);
 }
});
test('commercial requirements block deletion and roll back every linked CRM change',async()=>{
 const b=(await as('admin',"insert into buyers(name,country)values('Buyer with quotation','Italy') returning id")).rows[0].id;
 await as('admin',"insert into research_sources(buyer_id,title)values($1,'Evidence retained')",[b]);
 await as('admin',"insert into rfqs(buyer_id,title)values($1,'Octopus enquiry')",[b]);
 await assert.rejects(as('admin','select delete_buyer_crm($1)',[b]),/commercial|document/i);
 assert.equal((await as('admin','select count(*)::int n from buyers where id=$1',[b])).rows[0].n,1);
 assert.equal((await as('admin','select count(*)::int n from research_sources where buyer_id=$1',[b])).rows[0].n,1);
});
test('inactive membership cannot invoke deletion even if profile still says admin',async()=>{
 const b=(await as('admin',"insert into buyers(name,country)values('Membership test','Japan') returning id")).rows[0].id;
 await as('admin',"update memberships set active=false where email='admin@test.invalid'");
 await assert.rejects(as('admin','select delete_buyer_crm($1)',[b]),/administrator|permission/i);
 await db.exec("reset role;update memberships set active=true where email='admin@test.invalid'");
 assert.equal((await as('admin','select count(*)::int n from buyers where id=$1',[b])).rows[0].n,1);
});
after(async()=>await db.close());
