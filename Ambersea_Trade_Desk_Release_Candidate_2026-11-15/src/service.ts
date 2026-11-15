import{createClient}from'@supabase/supabase-js';
import{checkConnectionConfig}from'./config.mjs';
const url=import.meta.env.VITE_SUPABASE_URL;
const publicKey=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const configurationError=checkConnectionConfig(url,publicKey,import.meta.env.VITE_EXPECTED_PROJECT_REF||'xgjoanqeepaxfstutlfx');
export const db=createClient(configurationError?'https://invalid.supabase.co':url,configurationError?'sb_publishable_missing_configuration':publicKey);
export async function rows(table:string){let all:any[]=[];for(let offset=0;;offset+=1000){const {data,error}=await db.from(table).select('*').order(table==='settings'?'company':table==='memberships'?'email':table==='profiles'?'email':'created_at',{ascending:false}).range(offset,offset+999);if(error)throw error;all.push(...data);if(data.length<1000)break;if(offset>=99000)throw Error('Record export limit exceeded; use database backup.');}return all}
export async function save(table:string,values:any,original?:any){let q:any=original?db.from(table).update(values).eq(table==='memberships'?'email':'id',original[table==='memberships'?'email':'id']):db.from(table).insert(values);const{data,error}=await q.select();if(error)throw error;if(!data?.length)throw Error('No record saved. Check your role and access.');return data[0]}
export async function rpc(name:string,args:any){const{data,error}=await db.rpc(name,args);if(error)throw error;return data}
export function download(name:string,content:any,type='application/json'){const u=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
