import React,{useEffect,useMemo,useState}from'react';
import{MessageCircle,Mail,Copy,ExternalLink,MessageSquare,CheckCircle2,AlertTriangle,CalendarPlus,ClipboardList}from'lucide-react';
import{company}from'./company';import{save}from'./service';
import{OUTREACH_CHANNELS,channelAction,outreachAllowed,outreachTemplate,communicationPayload}from'./communication-links.mjs';
type Props={data:any,buyers:any[],run:(fn:()=>Promise<any>,message?:string)=>Promise<void>,canWrite:boolean,edit:(table:string,row?:any,preset?:any)=>void};
const icons:any={WhatsApp:MessageCircle,WeChat:MessageSquare,Email:Mail,LinkedIn:ExternalLink};
const preferredLang=(b:any)=>b?.country==='China'?'Chinese':b?.country==='Italy'?'Italian':'As written';
export function CommunicationsHub({data,buyers,run,canWrite,edit}:Props){
 const[buyerId,setBuyerId]=useState(''),[contactId,setContactId]=useState(''),[channel,setChannel]=useState('Email'),[subject,setSubject]=useState(''),[body,setBody]=useState(''),[reviewed,setReviewed]=useState(false),[evidence,setEvidence]=useState(''),[language,setLanguage]=useState('As written'),[hint,setHint]=useState(''),[showHistory,setShowHistory]=useState(true);
 const buyer=buyers.find((b:any)=>b.id===buyerId),contacts=(data.contacts||[]).filter((c:any)=>c.buyer_id===buyerId),contact=contacts.find((c:any)=>c.id===contactId),recipient=contact||buyer;
 const blocked=!outreachAllowed(buyer);
 const action=channelAction({channel,recipient,subject,body,reviewed,blocked});
 const log=(data.communications||[]).filter((c:any)=>c.buyer_id===buyerId).sort((a:any,b:any)=>String(b.happened_at||b.created_at).localeCompare(String(a.happened_at||a.created_at)));
 const drafts=log.filter((c:any)=>c.direction==='Draft'),history=log.filter((c:any)=>c.direction!=='Draft');
 const activeName=contact?.name||buyer?.name||'your buyer';
 useEffect(()=>{setContactId('');setBody('');setSubject('');setReviewed(false);setHint('');setEvidence('');setLanguage(preferredLang(buyer))},[buyerId]);
 useEffect(()=>{setReviewed(false);setHint('')},[contactId,channel]);
 const compose=()=>{const t=outreachTemplate(buyer,contact,company.fullName,company.website);setSubject(t.subject);setBody(t.body);setReviewed(false)};
 const saveDraft=()=>run(()=>save('communications',communicationPayload({buyerId,channel,direction:'Draft',subject,body,language,evidence:contact?.name?'Recipient contact: '+contact.name:''})),'Message draft saved (not sent)');
 const logSent=()=>run(()=>save('communications',communicationPayload({buyerId,channel,direction:'Outbound',subject,body,language,evidence:'Manual confirmation: '+evidence.trim()+(contact?.name?' · Contact: '+contact.name:'')})),'Outgoing message recorded (manual confirmation)');
 const logReply=()=>edit('communications',undefined,{buyer_id:buyerId,channel,direction:'Inbound',subject:'',body:'',language,evidence:contact?.name?'Reply from '+contact.name:''});
 async function copyMessage(){await navigator.clipboard.writeText(body);setHint('Message copied. Paste and send it in '+channel+'. Nothing was sent automatically.')}
 async function copyWeChat(){if(action.ready&&action.wechatId){await navigator.clipboard.writeText(action.wechatId);setHint('WeChat ID copied. Open WeChat, find the person, then paste your message. Nothing was sent automatically.')}}
 const channelSummary=(name:string)=>channelAction({channel:name,recipient,subject,body:'test',reviewed:true,blocked:false});
 const Icon=icons[channel]||Mail;
 return <div className="communications-desk">
 <section className="panel communications-intro"><span className="eyebrow">AMBERSEA / BUYER COMMUNICATIONS</span><h2>Communicate with international buyers</h2><p>Choose a company, choose the correct purchasing contact, prepare a message and open the buyer's preferred platform. Save drafts and follow-ups in your Trade Desk.</p><div className="comm-notice"><AlertTriangle size={17}/>WhatsApp, WeChat and email are not automatically synced. Opening a chat or email composer is not proof that a message was sent.</div></section>
 <div className="comm-layout">
 <section className="panel comm-buyer">
 <h3>1. Choose the buyer and contact</h3>
 <label>Buyer company<select value={buyerId} onChange={e=>setBuyerId(e.target.value)}><option value="">Select buyer...</option>{buyers.map((b:any)=><option key={b.id} value={b.id}>{b.name} · {b.country}</option>)}</select></label>
 {buyer&&<>
 <div className="comm-profile"><strong>{buyer.name}</strong><span>{buyer.country} · {buyer.product_interests||'Seafood buyer'}</span><div><span className="badge">{buyer.verification_status||'Unverified'}</span>{buyer.opt_out&&<span className="badge rejected">Do Not Contact</span>}</div></div>
 <label>Person to contact<select value={contactId} onChange={e=>setContactId(e.target.value)}><option value="">General company contact</option>{contacts.map((c:any)=><option key={c.id} value={c.id}>{c.name} · {c.role||'Contact'}</option>)}</select></label>
 {contacts.length===0&&<p className="muted">No individual buyer contact recorded. Add the procurement manager or purchasing contact when known.</p>}
 <button className="secondary small" disabled={!canWrite} onClick={()=>edit('contacts',undefined,{buyer_id:buyerId})}>+ Add buyer contact</button>
 <div className="comm-channels">{OUTREACH_CHANNELS.map((c:string)=>{const Ch=icons[c];const st=channelSummary(c);return <div key={c} className="comm-channel"><Ch size={18}/><b>{c}</b><span>{st.ready?'Contact recorded':'Not ready'}</span></div>})}</div>
 <dl className="comm-contact"><dt>Email</dt><dd>{recipient?.email||'Not recorded'}</dd><dt>WhatsApp</dt><dd>{recipient?.whatsapp||'Not verified'}</dd><dt>WeChat</dt><dd>{recipient?.wechat||'Not recorded'}</dd><dt>Next action</dt><dd>{buyer.next_action||'No action recorded'}</dd></dl>
 {blocked&&<p className="error">This buyer is marked Do Not Contact or opted out. Sending controls are disabled.</p>}
 </>}
 </section>
 <section className="panel comm-compose">
 <div className="section-head"><h3>2. Prepare a message</h3><button className="secondary small" disabled={!buyer||blocked} onClick={compose}>Use seafood template</button></div>
 <div className="comm-tabs">{OUTREACH_CHANNELS.map((c:string)=>{const Ch=icons[c];return <button key={c} className={channel===c?'active':'secondary'} aria-pressed={channel===c} onClick={()=>setChannel(c)}><Ch size={16}/>{c}</button>})}</div>
 <label>Recipient: <strong>{activeName}</strong></label>
 <label>Subject (email)<input value={subject} onChange={e=>{setSubject(e.target.value);setReviewed(false)}} placeholder="Seafood sourcing enquiry"/></label>
 <label>Message<textarea rows={11} value={body} onChange={e=>{setBody(e.target.value);setReviewed(false)}} placeholder="Introduce the seafood product, grade, packing and destination required."/></label>
 <label>Language<select value={language} onChange={e=>setLanguage(e.target.value)}>{['As written','English','Chinese','Italian','French','Korean','Vietnamese','Arabic','Spanish','Japanese'].map(v=><option key={v}>{v}</option>)}</select></label>
 <label className="check"><input type="checkbox" checked={reviewed} onChange={e=>setReviewed(e.target.checked)} disabled={!buyer||blocked}/>I checked the recipient, message and buyer's contact preferences.</label>
 {!action.ready&&buyer&&!blocked&&<p className="muted">{action.reason}</p>}
 <div className="comm-actions">
 <button disabled={!canWrite||!buyer||!body.trim()} onClick={saveDraft}><ClipboardList size={16}/>Save draft</button>
 {action.ready&&action.href?<a className="button" href={action.href} target="_blank" rel="noopener noreferrer" onClick={()=>setHint('Opened '+channel+'. Verify the message in that app and log only after it was actually sent.')}><Icon size={16}/>{action.label}</a>:<button disabled><Icon size={16}/>Open {channel}</button>}
 {channel==='WeChat'&&action.ready&&<button className="secondary" onClick={copyWeChat}><Copy size={16}/>Copy WeChat ID</button>}
 <button className="secondary" disabled={!reviewed||blocked||!body.trim()} onClick={()=>copyMessage().catch(()=>setHint('Copy failed. Select and copy the message manually.'))}><Copy size={16}/>Copy message</button>
 </div>
 {hint&&<p className="comm-hint" role="status">{hint}</p>}
 <details className="comm-manual"><summary>3. Record confirmed sending or buyer response</summary>
 <p className="muted">Use this after you personally send the message in WhatsApp, WeChat or your email app. The system does not detect delivery, read receipts or replies automatically.</p>
 <label>How did you confirm sending?<input placeholder="e.g. Sent in WeChat at 16:30, screenshot saved" value={evidence} onChange={e=>setEvidence(e.target.value)}/></label>
 <div className="comm-actions"><button disabled={!canWrite||!buyer||blocked||!reviewed||!body.trim()||!evidence.trim()} onClick={logSent}><CheckCircle2 size={16}/>Log confirmed send</button><button className="secondary" disabled={!canWrite||!buyer} onClick={logReply}>Record buyer reply</button><button className="secondary" disabled={!canWrite||!buyer} onClick={()=>edit('tasks',undefined,{buyer_id:buyerId,title:'Follow up with '+buyer.name})}><CalendarPlus size={16}/>Schedule follow-up</button></div>
 </details>
 </section></div>
 <section className="panel"><div className="section-head"><h3>Saved messages and communication history</h3><button className="secondary small" onClick={()=>setShowHistory(v=>!v)}>{showHistory?'Hide':'Show'}</button></div>
 {showHistory&&(buyer?<><div className="comm-history">{drafts.length>0&&<h4>Saved drafts · {drafts.length}</h4>}{drafts.map((d:any)=><button key={d.id} className="comm-draft" onClick={()=>{setChannel(OUTREACH_CHANNELS.includes(d.channel)?d.channel:'Email');setSubject(d.subject||'');setBody(d.body);setReviewed(false)}}><b>{d.channel} · {d.subject||'Draft'}</b><span>{d.body.slice(0,130)}</span></button>)}<h4>Recorded communication · {history.length}</h4>{history.length?history.map((h:any)=><details key={h.id}><summary>{h.direction} · {h.channel} · {new Date(h.happened_at||h.created_at).toLocaleDateString('en-IN')}</summary><p>{h.body}</p><small>{h.evidence||'No verification note'}</small></details>):<p className="muted">No actual message exchanges recorded. Drafts are not treated as sent communications.</p>}</div></>:<p className="muted">Select a buyer to view their communication record.</p>)}
 </section></div>;
}