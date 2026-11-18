/** Archive buyers without deleting linked records or changing the sales stage. */
const ARCHIVE_FIELD='_trade_desk_archived_at';
export const BUYER_CHILDREN=Object.freeze([
 {table:'research_sources',label:'Research sources'},
 {table:'contacts',label:'Contacts'},
 {table:'communications',label:'Communication history'},
 {table:'tasks',label:'Tasks and follow-ups'},
 {table:'rfqs',label:'Buyer requirements'},
 {table:'quotes',label:'Quotations'},
 {table:'orders',label:'Orders'},
 {table:'documents',label:'Documents'}
]);
export function isArchivedBuyer(buyer){return typeof buyer?.source_data?.[ARCHIVE_FIELD]==='string'&&buyer.source_data[ARCHIVE_FIELD].length>0}
export function archiveBuyerData(existing,iso){
 const src=existing&&typeof existing==='object'&&!Array.isArray(existing)?existing:{};
 if(typeof iso!=='string'||!Number.isFinite(Date.parse(iso)))throw Error('Valid archive date required.');
 return {...src,[ARCHIVE_FIELD]:iso};
}
export function restoreBuyerData(existing){
 const src=existing&&typeof existing==='object'&&!Array.isArray(existing)?{...existing}:{};
 delete src[ARCHIVE_FIELD];return src;
}
export function buyerReferences(data,id){
 if(!id)return[];
 return BUYER_CHILDREN.map(({table,label})=>({table,label,count:(data?.[table]||[]).filter(r=>r.buyer_id===id).length})).filter(x=>x.count>0);
}
export function buyerDeleteAllowed(data,id){return buyerReferences(data,id).length===0}
export function readableDeleteError(error){
 if(error?.code==='23503'||/foreign key constraint/i.test(error?.message||'')){
 const table=BUYER_CHILDREN.find(x=>String(error?.message||'').includes('"'+x.table+'"')||String(error?.message||'').includes(x.table+'_buyer_id_fkey'));
 return table?'Cannot delete: this buyer still has linked '+table.label.toLowerCase()+'. Archive the buyer to preserve business history.':'Cannot delete this record because related business records still reference it. Review those records or archive the buyer.';
 }
 return error?.message||'Deletion failed. No records were removed.';
}
