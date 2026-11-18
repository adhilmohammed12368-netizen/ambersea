import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';

const base='http://127.0.0.1:4173';
const project='xgjoanqeepaxfstutlfx';
const userId='40000000-0000-0000-0000-000000000001';
const user={id:userId,email:'adhil@ambersea.in',email_confirmed_at:'2026-11-15T00:00:00Z',role:'authenticated',app_metadata:{provider:'email',providers:['email']},user_metadata:{},aud:'authenticated',created_at:'2026-11-15T00:00:00Z'};
const session={access_token:'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI0MDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDEiLCJleHAiOjQxMDI0NDQ4MDB9.signature',token_type:'bearer',expires_in:3600,expires_at:4102444800,refresh_token:'mock-refresh-token',user};
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:980},acceptDownloads:true});
let appErrors=[],requestErrors=[];
page.on('pageerror',err=>appErrors.push(String(err)));
page.on('console',msg=>{if(msg.type()==='error')requestErrors.push(msg.text())});
await page.addInitScript(({project,session})=>{
 localStorage.setItem('sb-'+project+'-auth-token',JSON.stringify(session));
},{project,session});
await page.route('https://'+project+'.supabase.co/**',async route=>{
 const req=route.request(),url=new URL(req.url());
 const reply=async (body,status=200)=>route.fulfill({status,contentType:'application/json',headers:{'access-control-allow-origin':'*','access-control-expose-headers':'Content-Range, X-Total-Count','content-range':'0-0/1'},body:JSON.stringify(body)});
 if(url.pathname==='/auth/v1/user')return reply(user);
 if(url.pathname.includes('/auth/v1/token'))return reply(session);
 if(url.pathname.includes('/rest/v1/rpc/claim_membership'))return reply(null);
 if(url.pathname.startsWith('/rest/v1/')){
  const table=url.pathname.split('/')[3];
  if(table==='profiles')return reply([{id:userId,email:'adhil@ambersea.in',role:'admin',active:true,display_name:'Test administrator'}]);
  if(table==='memberships')return reply([{email:'adhil@ambersea.in',role:'admin',active:true}]);
  if(table==='settings')return reply([{id:true,company:'Ambersea',require_approval:true}]);
  return reply([]);
 }
 return reply({});
});
await mkdir('/tmp/ambersea-ui',{recursive:true});
try{
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'Buyer CRM',exact:true}).waitFor({timeout:30000});
 const navigation=[
  ['Overview','Your business, in focus.'],['Buyer CRM','Buyer CRM'],['Sales pipeline','Sales pipeline'],
  ['Research','Research'],['Outreach','Outreach'],['Requirements','Requirements'],
  ['Quotations','Quotations'],['Orders & payments','Orders & payments'],
  ['Tasks & reminders','Tasks & reminders'],['Inventory & quality','Inventory & quality'],
  ['Supplier CRM','Supplier CRM'],['Sourcing desk','Sourcing desk'],
  ['Costing & profit','Costing & profit'],['Documents','Documents'],
  ['Reports & export','Reports & export'],['Import data','Import data'],['Settings & team','Settings & team']
 ];
 for(let i=0;i<navigation.length;i++){
  const [label,heading]=navigation[i];
  await page.getByRole('button',{name:label,exact:true}).click();
  await page.locator('.page-heading h1').getByText(heading,{exact:true}).waitFor({timeout:10000});
  await page.screenshot({path:'/tmp/ambersea-ui/'+String(i+1).padStart(2,'0')+'-'+label.replace(/[^a-z0-9]+/gi,'-')+'.png'});
  console.log('PASS UI TAB',i+1,label);
 }
 await page.getByRole('button',{name:'Documents',exact:true}).click();
 await page.getByText('Documents workspace',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Outreach',exact:true}).click();
 await page.getByText('Communicate with international buyers',{exact:true}).waitFor();
 assert.deepEqual(appErrors,[],'Client-side exceptions found: '+appErrors.join('; '));
 console.log('UI SMOKE PASSED: 17/17 navigation tabs, Documents and Outreach render');
 if(requestErrors.length)console.log('Browser console warnings/errors (inspect):',requestErrors.slice(0,12));
}catch(e){
 await page.screenshot({path:'/tmp/ambersea-ui/FAILURE.png'}).catch(()=>{});
 console.error('UI SMOKE FAILED',e);
 console.error('Browser exceptions',appErrors);
 process.exitCode=1;
}finally{await browser.close();}
