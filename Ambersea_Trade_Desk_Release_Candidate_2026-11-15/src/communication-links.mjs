/** Safe outbound composers. These never send or claim a message was sent. */
export const OUTREACH_CHANNELS=Object.freeze(['Email','WhatsApp','WeChat','LinkedIn']);
const mailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function normalizeWhatsApp(value){
  const raw=String(value||'').trim();
  if(!/^\+?[\d ()-]+$/.test(raw))return null;
  const digits=raw.replace(/\D/g,'');
  if(!/^[1-9]\d{7,14}$/.test(digits))return null;
  return digits;
}
export function safeLinkedIn(value){
 try{const u=new URL(String(value||''));if(u.protocol!=='https:'||!['linkedin.com','www.linkedin.com','cn.linkedin.com'].includes(u.hostname))return null;return u.toString()}catch{return null}
}
export function channelAction({channel,recipient,subject='',body='',blocked=false,reviewed=false}){
 if(blocked)return{ready:false,reason:'This buyer is marked Do Not Contact or opted out.'};
 if(!reviewed)return{ready:false,reason:'Review the buyer, recipient and message first.'};
 if(!body.trim())return{ready:false,reason:'Write a message before opening a channel.'};
 const record=recipient||{};
 if(channel==='Email'){const email=String(record.email||'').trim();if(!mailPattern.test(email))return{ready:false,reason:'No verified email format recorded for this recipient.'};return{ready:true,mode:'compose',href:'mailto:'+email+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body),label:'Open email composer'}}
 if(channel==='WhatsApp'){const phone=normalizeWhatsApp(record.whatsapp);if(!phone)return{ready:false,reason:'Add the recipient’s verified WhatsApp number, including country code.'};return{ready:true,mode:'compose',href:'https://wa.me/'+phone+'?text='+encodeURIComponent(body),label:'Open WhatsApp chat'}}
 if(channel==='LinkedIn'){const url=safeLinkedIn(record.linkedin);if(!url)return{ready:false,reason:'Add the recipient’s LinkedIn profile URL.'};return{ready:true,mode:'profile',href:url,label:'Open LinkedIn profile'}}
 if(channel==='WeChat'){const id=String(record.wechat||'').trim();if(!id)return{ready:false,reason:'Add a confirmed WeChat ID for this recipient.'};return{ready:true,mode:'copy',wechatId:id,label:'Copy WeChat ID'}}
 return{ready:false,reason:'Unsupported messaging channel.'};
}
export function outreachAllowed(buyer){return !!buyer&&!buyer.opt_out&&buyer.stage!=='Do Not Contact'}
export function outreachTemplate(buyer,recipient,brand='AMBERSEA',website='https://ambersea.in'){
 const p=String(buyer?.product_interests||'frozen seafood').trim()||'frozen seafood';
 return {subject:'Seafood sourcing enquiry',body:'Hello'+(recipient?.name?', '+recipient.name:'')+',\n\nAre you currently sourcing '+p+'? Please share the grades, packing specifications, and destination port you purchase regularly. I would be happy to review your requirements and check suitable Indian supply options.\n\nBest regards,\nAdhil Mohammad\n'+brand+'\n'+website};
}
export function communicationPayload({buyerId,channel,direction,subject,body,language='As written',evidence=''}){
 if(!buyerId||!OUTREACH_CHANNELS.includes(channel)||!['Draft','Outbound','Inbound'].includes(direction)||!String(body||'').trim())throw Error('A buyer, channel, direction and message are required.');
 if(direction==='Outbound'&&!String(evidence||'').trim())throw Error('Confirm a genuine send and record how it was verified.');
 return{buyer_id:buyerId,channel,direction,subject:String(subject||''),body:String(body),language:String(language||'As written'),evidence:String(evidence||'')};
}
