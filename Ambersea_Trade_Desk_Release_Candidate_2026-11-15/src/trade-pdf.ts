import{jsPDF}from'jspdf';import autoTable from'jspdf-autotable';import{company}from'./company';import{commission}from'./domain.mjs';import{draftDetails,safeDraftFilename}from'./trade-documents.mjs';
type Input={kind:'proforma'|'packing'|'commission',quote?:any,order?:any,buyer?:any,lines:any[],shipment?:any,details?:{carton_count?:string,gross_weight_kg?:string,shipping_marks?:string,seal_number?:string}};
const v=(x:any)=>x==null||String(x).trim()===''?'TO CONFIRM':String(x);
const n=(x:any)=>Number(x).toLocaleString('en-US',{maximumFractionDigits:3});
const amount=(x:any,c:string)=>c+' '+Number(x).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
/** Draft documents, never official invoices or certificates. */
export async function makeTradeDraft({kind,quote,order,buyer,lines,shipment,details={}}:Input){
 const meta=draftDetails({kind,quote,order,lines});
 const p=new jsPDF({unit:'mm',format:'a4'});
 const f=await import('./pdf-font');p.addFileToVFS('Trade.ttf',f.font);p.addFont('Trade.ttf','Trade','normal');p.addFileToVFS('Trade-Bold.ttf',f.bold);p.addFont('Trade-Bold.ttf','Trade','bold');
 const title=kind==='proforma'?'DRAFT PROFORMA INVOICE':kind==='packing'?'DRAFT PACKING LIST':'DRAFT AGENCY COMMISSION STATEMENT';
 p.setFillColor(14,37,55);p.rect(0,0,210,41,'F');p.setFont('Trade','bold');p.setTextColor(255);p.setFontSize(19);p.text(company.name.toUpperCase(),16,18);p.setFontSize(8);p.text(company.tagline,16,28);p.text('INTERNAL REVIEW - NOT ISSUED',194,17,{align:'right'});p.setTextColor(32,54,66);p.setFontSize(15);p.text(title,16,55);p.setFont('Trade','normal');p.setFontSize(9);
 const left=['Reference: '+v(meta.ref),'Buyer: '+v(buyer?.name||quote?.buyer_snapshot?.name),'Country: '+v(buyer?.country||quote?.buyer_snapshot?.country),'Prepared by: '+company.fullName];
 const right=kind==='proforma'?['Incoterm: '+v(quote?.incoterm),'Destination: '+v(quote?.destination),'Currency: '+v(quote?.currency),'Valid until: '+v(quote?.valid_until)]:kind==='packing'?['Buyer PO: '+v(order?.po_reference),'Container: '+v(shipment?.container_number),'Origin: '+v(shipment?.port_origin),'Destination: '+v(shipment?.port_destination)]:['Commission payer: '+v(order?.commission_payer),'Method: '+v(order?.commission_method),'Currency: '+v(order?.currency),'Order: '+v(order?.po_reference)];
 const print=(strings:string[],x:number)=>{let y=65;strings.forEach(z=>{const w=p.splitTextToSize(z,85);p.text(w,x,y);y+=Math.max(1,w.length)*5+2})};print(left,16);print(right,108);
 const style={font:'Trade',fontSize:8,cellPadding:3}as const,headStyle={fillColor:[22,72,87] as [number,number,number]};
 const common={startY:104,styles:style,headStyles:headStyle,margin:{left:16,right:16,bottom:30},rowPageBreak:'avoid' as const};
 if(kind==='proforma'){
  autoTable(p,{...common,head:[['Product / specification','Quantity kg','Price / kg','Total']],body:lines.map(l=>[[l.description,l.packing,l.container_group].filter(Boolean).join('\n'),n(l.quantity_kg),amount(l.unit_price,quote.currency),amount(Number(l.quantity_kg)*Number(l.unit_price),quote.currency)]),foot:[['Total','','',amount(lines.reduce((s,l)=>s+Number(l.quantity_kg)*Number(l.unit_price),0),quote.currency)]],footStyles:headStyle});
  let y=(p as any).lastAutoTable.finalY+10;if(y>245){p.addPage();y=24}
  for(const sentence of ['Payment terms: '+v(quote.payment_terms),'Shipment window: '+v(quote.shipment_window),'Seller legal, tax and bank details: TO BE CONFIRMED BEFORE ISSUE']){const w=p.splitTextToSize(sentence,175);if(y+w.length*5>268){p.addPage();y=24}p.text(w,16,y);y+=w.length*5+5}
 }else if(kind==='packing'){
  autoTable(p,{...common,head:[['Product / specification','Packing','Net kg']],body:lines.map(l=>[v(l.description),v(l.packing),n(l.quantity_kg)]),foot:[['Total net weight','',n(lines.reduce((s,l)=>s+Number(l.quantity_kg),0))]],footStyles:headStyle});
  let y=(p as any).lastAutoTable.finalY+10;if(y>230){p.addPage();y=24}
  for(const item of ['Cartons: '+v(details.carton_count),'Gross kg: '+v(details.gross_weight_kg),'Shipping marks: '+v(details.shipping_marks),'Seal no: '+v(details.seal_number),'B/L reference: '+v(shipment?.bl_reference)]){const w=p.splitTextToSize(item,175);if(y+w.length*5>267){p.addPage();y=24}p.text(w,16,y);y+=w.length*5+5}
 }else{
  const fee=commission(order);
  autoTable(p,{...common,head:[['Agreed commission basis','Details']],body:[['Method',v(order.commission_method)],['Rate / fixed fee',v(order.commission_rate)],['Commission quantity kg',v(order.commission_quantity_kg)],['Payer',v(order.commission_payer)],['Expected fee BEFORE expenses / taxes',amount(fee,order.currency)],['Reference transaction value - NOT Ambersea revenue',amount(order.total,order.currency)]]});
  let y=(p as any).lastAutoTable.finalY+10;if(y>250){p.addPage();y=24}for(const w of p.splitTextToSize('Agreement notes: '+v(order.commission_agreement),175)){if(y>267){p.addPage();y=24}p.text(w,16,y);y+=5}
 }
 const count=p.getNumberOfPages();for(let page=1;page<=count;page++){p.setPage(page);p.setFillColor(248,246,242);p.rect(0,276,210,21,'F');p.setFont('Trade','bold');p.setTextColor(135,53,40);p.setFontSize(7.2);p.text('DRAFT - VERIFY SPECIFICATIONS, WEIGHTS, TAX AND LEGAL DETAILS BEFORE ISSUE',16,284);p.setTextColor(76);p.setFont('Trade','normal');p.text(company.website+' | '+page+'/'+count,16,291)}
 return{blob:p.output('blob'),filename:safeDraftFilename(kind,meta.ref),type:kind==='proforma'?'Proforma Invoice':kind==='packing'?'Packing List':'Commission Statement',links:{buyer_id:meta.buyer_id,order_id:meta.order_id,quote_id:meta.quote_id,inventory_id:null}}
}