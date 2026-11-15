/** Existing database-compatible classification: a [Category] filename prefix. */
export const DOCUMENT_TYPES=Object.freeze(['Purchase Order','Proforma Invoice','Commercial Invoice','Packing List','Bill of Lading','Certificate of Origin','Health Certificate','Catch Certificate','Insurance Certificate','Quality Report','Product Specification','Lab Report','Supplier Offer','Sales Contract','Agency Agreement','Commission Statement','Other']);
const known=new Set(DOCUMENT_TYPES);
export function nameWithType(type,filename){if(!known.has(type))throw Error('Choose a category.');if(typeof filename!=='string'||!filename.trim())throw Error('Filename required.');return '['+type+'] '+filename.trim().replace(/[\r\n\t]/g,' ').slice(0,180)}
export function inspectDocumentName(name){const raw=String(name||''),m=/^\[([^\]]+)\]\s+(.+)$/.exec(raw);return m&&known.has(m[1])?{type:m[1],filename:m[2],categorized:true}:{type:'Other',filename:raw,categorized:false}}
export function orderDocuments(docs,order){if(!order?.id)return[];return(docs||[]).filter(d=>d.order_id===order.id||(order.quote_id&&d.quote_id===order.quote_id))}
export function orderChecklist(order,docs,quote){if(!order?.id)return[];const agency=order.commercial_model==='Agency';
 const core=agency?[['Purchase Order','Record written buyer instruction.'],['Agency Agreement','Record actual commission agreement.'],['Commission Statement','Record fee basis.'],['Commercial Invoice','Obtain seller-issued invoice.'],['Packing List','Obtain supplier packing list.'],['Bill of Lading','Obtain carrier document.']]:[['Purchase Order','Record accepted order.'],['Proforma Invoice','Review draft before issue.'],['Commercial Invoice','Requires authorized issuer.'],['Packing List','Verify cartons and weights.'],['Bill of Lading','Obtain carrier document.']];
 const extra=[['Certificate of Origin','Check destination rules and official issuer.'],['Health Certificate','Check competent-authority requirements.'],['Catch Certificate','Check species and market rules.'],['Quality Report','Keep actual inspection evidence.']];
 if(quote?.incoterm==='CIF')extra.push(['Insurance Certificate','Review CIF insurance documentation.']);
 const seen=new Set((docs||[]).map(d=>inspectDocumentName(d.name).type));
 return [...core.map(([type,note])=>({type,note,required:'Workflow',onFile:seen.has(type)})),...extra.map(([type,note])=>({type,note,required:'Review applicability',onFile:seen.has(type)}))]}
export function normalizedLinks(input,data){const buyers=data.buyers||[],orders=data.orders||[],quotes=data.quotes||[],lots=data.inventory||[];
 const order=input.order_id?orders.find(o=>o.id===input.order_id):null,quote=input.quote_id?quotes.find(q=>q.id===input.quote_id):null;
 if(input.order_id&&!order)throw Error('Order not found.');if(input.quote_id&&!quote)throw Error('Quotation not found.');if(input.inventory_id&&!lots.some(l=>l.id===input.inventory_id))throw Error('Stock lot not found.');if(input.buyer_id&&!buyers.some(b=>b.id===input.buyer_id))throw Error('Buyer not found.');
 if(order&&quote&&order.quote_id!==quote.id)throw Error('This quotation does not belong to the order.');
 if(order&&input.buyer_id&&order.buyer_id!==input.buyer_id)throw Error('Buyer and order do not match.');
 if(quote&&input.buyer_id&&quote.buyer_id!==input.buyer_id)throw Error('Buyer and quotation do not match.');
 if(order&&quote&&order.buyer_id!==quote.buyer_id)throw Error('Buyer mismatch across order and quotation.');
 return {buyer_id:order?.buyer_id||quote?.buyer_id||input.buyer_id||null,order_id:order?.id||null,quote_id:quote?.id||order?.quote_id||null,inventory_id:input.inventory_id||null}
}
export function draftDetails({kind,quote,order,lines}){if(kind==='proforma'){if(!quote?.id)throw Error('Select a quotation.');if(!lines?.length||!lines.every(l=>Number(l.quantity_kg)>0&&Number(l.unit_price)>=0&&Number.isFinite(Number(l.unit_price))))throw Error('Quotation needs valid product lines.');return {kind,ref:quote.number||quote.id,buyer_id:quote.buyer_id,quote_id:quote.id,order_id:order?.id||null}}
 if(kind==='packing'){if(!order?.id)throw Error('Select an order.');if(!lines?.length||!lines.every(l=>Number(l.quantity_kg)>0))throw Error('Order needs valid product lines.');return {kind,ref:order.po_reference||order.id,buyer_id:order.buyer_id,quote_id:order.quote_id||null,order_id:order.id}}
 if(kind==='commission'){if(!order?.id||order.commercial_model!=='Agency')throw Error('Select an agency order.');if(!order.commission_method||order.commission_rate==null||!order.commission_payer)throw Error('Record agreed commission rate, method and payer first.');return {kind,ref:order.po_reference||order.id,buyer_id:order.buyer_id,quote_id:order.quote_id||null,order_id:order.id}}
 throw Error('Unknown draft type.')}
export function safeDraftFilename(kind,ref){const types={proforma:'Proforma_Invoice',packing:'Packing_List',commission:'Commission_Statement'},t=types[kind];if(!t)throw Error('Unknown draft type.');return 'DRAFT_'+t+'_'+String(ref||'unreferenced').replace(/[^a-z0-9_-]/gi,'_').slice(0,70)+'.pdf'}
