import React,{useEffect,useMemo,useState} from 'react';
import {Bell,BellRing,Check,CheckCheck,ExternalLink} from 'lucide-react';
import {buildReminders,businessDate} from './reminders.mjs';
import type {Reminder} from './reminders.mjs';

const get=(key:string):string[]=>{try{return JSON.parse(localStorage.getItem(key)||'[]')}catch{return[]}};
const put=(key:string,value:string[])=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{/* Storage might be disabled. */}};
export function NotificationCenter({data,userId,onNavigate}: {data:Record<string,any[]>;userId:string;onNavigate:(page:string,recordId:string,table:string)=>void}){
  const[open,setOpen]=useState(false),[tick,setTick]=useState(0);
  const[read,setRead]=useState<string[]>(()=>get(`trade-desk-read-${userId}`));
  const[enabled,setEnabled]=useState(()=>{try{return localStorage.getItem(`trade-desk-alerts-${userId}`)==='true'}catch{return false}});
  const[permission,setPermission]=useState(typeof Notification==='undefined'?'unsupported':Notification.permission);
  const reminders=useMemo(()=>buildReminders(data,userId,new Date()),[data,userId,tick]);
  const unread=reminders.filter(r=>!read.includes(r.id));
  useEffect(()=>{const id=window.setInterval(()=>setTick(t=>t+1),60000);return()=>window.clearInterval(id)},[]);
  useEffect(()=>{setRead(get(`trade-desk-read-${userId}`))},[userId]);
  useEffect(()=>{
    if(!enabled||permission!=='granted'||!reminders.length)return;
    const key=`trade-desk-delivered-${userId}-${businessDate()}`;
    const shown=get(key);
    const due=reminders.filter(r=>r.days<=0&&!shown.includes(r.id)&&!read.includes(r.id));
    if(!due.length)return;
    try{
      const note=new Notification('AMBERSEA Trade Desk reminder',{body:`${due.length} follow-up${due.length===1?'':'s'} or deadline${due.length===1?'':'s'} need attention. Open the Trade Desk to review.`,tag:'ambersea-due-reminders'});
      note.onclick=()=>{window.focus();setOpen(true);note.close()};
      put(key,[...shown,...due.map(r=>r.id)]);
    }catch{/* Browser may forbid OS notifications, in-app alerts still work. */}
  },[enabled,permission,reminders,userId,read]);
  const acknowledge=(id:string)=>setRead(old=>{const next=[...new Set([...old,id])];put(`trade-desk-read-${userId}`,next);return next});
  const markAll=()=>setRead(old=>{const next=[...new Set([...old,...reminders.map(r=>r.id)])];put(`trade-desk-read-${userId}`,next);return next});
  const activate=async()=>{
    if(typeof Notification==='undefined'){setPermission('unsupported');return}
    const status=await Notification.requestPermission();setPermission(status);
    if(status==='granted'){setEnabled(true);try{localStorage.setItem(`trade-desk-alerts-${userId}`,'true')}catch{}}
  };
  return <div className="notification-area">
    <button type="button" className="icon notification-button" aria-label={`Notifications, ${unread.length} unread`} aria-expanded={open} onClick={()=>setOpen(v=>!v)} title="Reminders and deadlines">
      {unread.length?<BellRing size={19}/>:<Bell size={19}/>}{unread.length>0&&<span className="notification-counter">{unread.length>99?'99+':unread.length}</span>}
    </button>
    {open&&<div className="notification-popover" role="region" aria-label="Notifications">
      <div className="notification-heading"><div><strong>Reminders & deadlines</strong><small>{unread.length} unread · Asia/Kolkata dates</small></div><button className="small secondary" disabled={!unread.length} onClick={markAll}><CheckCheck size={14}/> Mark read</button></div>
      <div className="notification-feed">{reminders.length===0?<p className="notification-empty">No due tasks or approaching deadlines. Add a task or quotation to start receiving reminders.</p>:reminders.slice(0,60).map(r=><div key={r.id} className={'notification-item '+(!read.includes(r.id)?'is-unread':'')}>
        <span className={'notification-state '+r.urgency}>{r.days<0?`${Math.abs(r.days)}d overdue`:r.days===0?'Today':`In ${r.days}d`}</span>
        <div><strong>{r.title}</strong><small>{r.context} · {r.date}</small></div>
        <button title="Open record" aria-label={'Open '+r.title} className="small secondary" onClick={()=>{acknowledge(r.id);onNavigate(r.page,r.recordId,r.category==='Task'?'tasks':r.category==='Quote'?'quotes':r.category==='Supplier offer'?'supplier_offers':r.category==='Order'?'orders':'shipments');setOpen(false)}}><ExternalLink size={14}/></button>
        {!read.includes(r.id)&&<button title="Mark read" aria-label={'Mark '+r.title+' read'} className="small secondary" onClick={()=>acknowledge(r.id)}><Check size={14}/></button>}
      </div>)}</div>
      <div className="notification-footer">
        {permission==='unsupported'?<small>OS notifications not supported by this browser.</small>:permission==='granted'&&enabled?<small>Browser alerts on while the app is open. Email/WhatsApp alerts are not connected.</small>:<button className="small secondary" onClick={activate}>Enable browser alerts</button>}
        <small>Mark-read status is saved only in this browser; source records are stored in Supabase.</small>
      </div>
    </div>}
  </div>
}
