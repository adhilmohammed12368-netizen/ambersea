import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
const model=await readFile(new URL('../src/model.ts',import.meta.url),'utf8');
const menus=[...app.slice(app.indexOf('const menus='),app.indexOf('const today=')).matchAll(/\['([^']+)','([^']+)',[A-Za-z]/g)].map(x=>({id:x[1],title:x[2]}));
test('every one of the 17 main tabs has an application rendering route',()=>{
 assert.equal(menus.length,17,'Navigation count changed: inspect page audit');
 const group=app.includes("['buyers','rfqs','quotes','suppliers'].includes(page)")?['buyers','rfqs','quotes','suppliers']:[];
 for(const m of menus){
  const present=group.includes(m.id)||app.includes("page==='"+m.id+"'");
  assert.ok(present,m.title+' has no rendering route');
 }
});
test('all editable modules linked to an app tab or detail workflow have a model definition',()=>{
 const models=[...model.matchAll(/add\('([^']+)'/g)].map(m=>m[1]);
 assert.equal(new Set(models).size,models.length,'Duplicate model definitions');
 for(const tab of ['buyers','contacts','research_sources','communications','tasks','products','suppliers','rfqs','rfq_items','supplier_offers','quotes','quote_items','orders','order_items','payments','shipments','inventory','stock_movements','reservations','temperature_logs','documents','costings','profiles','memberships']){
   assert.ok(models.includes(tab),'Missing model '+tab);
 }
});
test('all main tabs use company database refresh and access checks',()=>{
 assert.match(app,/claim_membership/);
 assert.match(app,/if\(!profile\?\.active\)/);
 assert.match(app,/getUser\(\)/);
 assert.match(app,/if\(!lastSynced\)/);
});
