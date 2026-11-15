/** Business reminders sourced from persisted Supabase records (not mock notifications). */
export function businessDate(date=new Date(),timeZone='Asia/Kolkata') {
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
  const pick=t=>parts.find(p=>p.type===t)?.value;
  return `${pick('year')}-${pick('month')}-${pick('day')}`;
}
export function daysFromBusinessDate(iso,today=businessDate()) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(iso||'')))return null;
  const parsed=Date.parse(`${iso}T00:00:00Z`);
  const current=Date.parse(`${today}T00:00:00Z`);
  if(!Number.isFinite(parsed)||!Number.isFinite(current))return null;
  if(new Date(parsed).toISOString().slice(0,10)!==iso||new Date(current).toISOString().slice(0,10)!==today)return null;
  return Math.round((parsed-current)/86400000);
}
export function buildReminders(data={},userId,at=new Date()) {
  const today=businessDate(at), alerts=[];
  const add=(category,row,date,title,context)=>{
    const days=daysFromBusinessDate(date,today);
    if(days==null||days>3)return;
    alerts.push({id:`${category}:${row.id}:${date}`,category,recordId:row.id,date,days,title,context,
      urgency:days<0?'overdue':days===0?'today':'upcoming',
      page:category==='Task'?'tasks':category==='Quote'?'quotes':category==='Order'?'orders':category==='Shipment'?'orders':'sourcing'});
  };
  for(const t of data.tasks||[]) {
    if(t.status!=='Open'||(t.owner_id&&userId&&t.owner_id!==userId))continue;
    add('Task',t,t.due_on,t.title||'Follow-up','Follow-up / task');
  }
  for(const q of data.quotes||[]) {
    if(['Accepted','Rejected'].includes(q.status))continue;
    if(['Draft','Approved','Sent'].includes(q.status))add('Quote',q,q.valid_until,`Quote ${q.number||''} expires`,'Quotation validity');
  }
  for(const o of data.orders||[]) {
    if(['Cancelled','Delivered','Completed'].includes(o.status))continue;
    if(o.expected_delivery)add('Order',o,o.expected_delivery,`Order ${o.po_reference||''} delivery`,'Expected delivery');
  }
  for(const s of data.shipments||[]) {
    if(['Delivered','Cancelled','Completed'].includes(s.status))continue;
    if(s.eta)add('Shipment',s,s.eta,`Shipment ${s.container_number||s.bl_reference||''} ETA`,'Shipment ETA');
  }
  for(const o of data.supplier_offers||[]) {
    if(o.availability_status==='Unavailable')continue;
    if(o.valid_until)add('Supplier offer',o,o.valid_until,'Supplier offer expires','Confirm availability and price');
  }
  const rank={overdue:0,today:1,upcoming:2};
  return alerts.sort((a,b)=>rank[a.urgency]-rank[b.urgency]||a.date.localeCompare(b.date)||a.title.localeCompare(b.title));
}
