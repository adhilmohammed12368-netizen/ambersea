import{businessDate}from'./reminders.mjs';
export const stages=['New','Contacted','Replied','Qualified','Quotation','Negotiation','Sample','Order','Repeat Buyer','Not Interested','On Hold','Lost','Do Not Contact'];
export const costFields={EXW:['procurement','processing','packing','cold_storage'],FOB:['procurement','processing','packing','cold_storage','inland','documentation','port_handling'],CFR:['procurement','processing','packing','cold_storage','inland','documentation','port_handling','freight'],CIF:['procurement','processing','packing','cold_storage','inland','documentation','port_handling','freight','insurance']};
export function cost(x){const required=[...(costFields[x.incoterm]||[]),'banking','other','contingency'];if(!costFields[x.incoterm]||!x.fx_date||!x.fx_source||!x.cost_currency||!x.sell_currency)throw Error('Enter currencies, FX source/date and an Incoterm.');for(const k of [...required,'quantity_kg','fx','margin'])if(x[k]===''||x[k]==null||!Number.isFinite(Number(x[k]))||Number(x[k])<0)throw Error('Enter '+k.replaceAll('_',' ')+' (enter 0 explicitly if none).');if(+x.quantity_kg<=0||+x.fx<=0||+x.margin>=100)throw Error('Quantity and FX must be positive; margin must be below 100%.');const total=required.reduce((a,k)=>a+Number(x[k]),0)/Number(x.fx),revenue=total/(1-Number(x.margin)/100),profit=revenue-total;return{total_cost:total,cost_per_kg:total/+x.quantity_kg,selling_price:revenue/+x.quantity_kg,revenue,gross_profit:profit,margin_percent:revenue?profit/revenue*100:0,markup_percent:total?profit/total*100:0};}
export function commission(x){
  const method=x.commission_method;
  const rate=Number(x.commission_rate);
  if(x.commission_rate===''||x.commission_rate==null||!Number.isFinite(rate)||rate<0)
    throw Error('Enter a non-negative agreed commission rate.');
  if(method==='Fixed')return rate;
  if(method==='Per kg'){
    const qty=Number(x.commission_quantity_kg);
    if(x.commission_quantity_kg===''||x.commission_quantity_kg==null||!Number.isFinite(qty)||qty<=0)
      throw Error('Enter the agreed commission quantity in kg.');
    return rate*qty;
  }
  if(method==='Percentage'){
    const deal=Number(x.total);
    if(rate>100||x.total===''||x.total==null||!Number.isFinite(deal)||deal<0)
      throw Error('Enter a valid percentage (0–100) and transaction total.');
    return rate*deal/100;
  }
  throw Error('Choose a valid commission method.');
}
export function commissionPreview(x){try{return commission(x)}catch{return null}}

export function match(req,offer,rfq){let matched=0,checks=0;const risks=[];for(const k of['product_id','species','form','grade','packing']){checks++;if(!req[k]||!offer[k])risks.push('Missing '+k.replace('_id',''));else if(String(req[k]).toLowerCase()===String(offer[k]).toLowerCase())matched++;else risks.push('Different '+k.replace('_id',''));}if(+offer.quantity_kg<+req.quantity_kg)risks.push('Insufficient quantity');if(offer.availability_status!=='Verified'||!offer.verified_on)risks.push('Availability unverified');if(offer.valid_until&&offer.valid_until<businessDate())risks.push('Offer expired');if(rfq.certifications&&(!offer.certifications||!offer.certifications.toLowerCase().includes(rfq.certifications.toLowerCase())))risks.push('Certificates need review');if(offer.currency!==rfq.currency||offer.incoterm!==rfq.incoterm)risks.push('Different currency or Incoterm; prices not directly comparable');return{score:Math.round(matched/checks*100),risks};}
export const safeURL=v=>{try{const u=new URL(v);return ['https:','http:'].includes(u.protocol)?u.href:null}catch{return null}};
export const csvCell=v=>{const str=String(v??'');const dangerous=/^[\u0000-\u0020]*[=+\-@]/.test(str)||/^[\t\r\n]/.test(str);return '"'+(dangerous?"'":'')+str.replaceAll('"','""')+'"'};
export const earnings=o=>o.commercial_model==='Agency'?commission(o):Number(o.total||0);
export function money(n,c='USD'){return new Intl.NumberFormat('en',{style:'currency',currency:c,maximumFractionDigits:2}).format(Number(n||0))}

export const offersForRequirement=(offers,rfqId,productId)=>offers.filter(o=>o.rfq_id===rfqId&&o.product_id===productId);
export const canReserveStock=role=>['admin','sales','procurement'].includes(role);
