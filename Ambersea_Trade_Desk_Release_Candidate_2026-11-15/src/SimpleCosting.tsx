import React,{useState}from'react';
import{Ship,Handshake,Calculator}from'lucide-react';
import{save}from'./service';
import{company}from'./company';
import{money,commissionPreview}from'./domain.mjs';
import{quickTrade}from'./quick-costing.mjs';
const currencies=['USD','EUR','INR','GBP','CNY','KRW','AED'];
export function SimpleCosting({data,run,canWrite}:any){
 const[mode,setMode]=useState('trading');
 const[q,setQ]=useState<any>({name:'',rfq_id:'',currency:'USD',quantity_kg:'',purchase_per_kg:'',selling_per_kg:'',other_costs:'0'});
 const[a,setA]=useState<any>({name:'',rfq_id:'',currency:'USD',commission_method:'Per kg',commission_rate:'',commission_quantity_kg:'',total:'',commission_payer:'',commission_agreement:''});
 const uq=(k:string,v:string)=>setQ((prev:any)=>({...prev,[k]:v}));
 const ua=(k:string,v:string)=>setA((prev:any)=>({...prev,[k]:v}));
 let quick:any=null,quickError='';try{quick=quickTrade(q)}catch(e:any){quickError=e.message}
 const fee=commissionPreview(a);
 const active=mode==='trading';
 const moneyValue=(n:number)=>money(n,active?q.currency:a.currency);
 const saveTrade=()=>run(()=>save('costings',{name:q.name.trim(),rfq_id:q.rfq_id||null,inputs:{...q,mode:'quick_trading',currency_basis:'Single currency'},results:quick}),'Trading estimate saved');
 const saveFee=()=>run(()=>save('costings',{name:a.name.trim(),rfq_id:a.rfq_id||null,inputs:{...a,mode:'agency_commission'},results:{commission_amount:fee,currency:a.currency}}),'Commission estimate saved');
 const linked=(v:string,onChange:(v:string)=>void)=><label>Link to buyer enquiry (optional)<select value={v} onChange={e=>onChange(e.target.value)}><option value="">No linked enquiry</option>{(data.rfqs||[]).map((r:any)=><option key={r.id} value={r.id}>{r.title}</option>)}</select></label>;
 return <section className="panel quick-costing">
  <span className="eyebrow">FAST BUSINESS DECISIONS</span>
  <h3>How will AMBERSEA earn on this deal?</h3>
  <p>Use the simple calculator for an estimate. For international quotations with separate currencies and Incoterms, open <b>Advanced Export Costing</b> below.</p>
  <div className="quick-costing-tabs" role="group" aria-label="Earnings model">
    <button className={active?'active':'secondary'} aria-pressed={active} onClick={()=>setMode('trading')}><Ship size={16}/>Trading profit</button>
    {company.name==='Ambersea'&&<button className={!active?'active':'secondary'} aria-pressed={!active} onClick={()=>setMode('agency')}><Handshake size={16}/>Agency commission</button>}
  </div>
  <div className="quick-costing-grid">
    <div>
      {active?<div className="quick-costing-fields">
        <label>Quantity (kg) *<input type="number" min="0" step="any" inputMode="decimal" placeholder="10000" value={q.quantity_kg} onChange={e=>uq('quantity_kg',e.target.value)}/></label>
        <label>Currency *<select value={q.currency} onChange={e=>uq('currency',e.target.value)}>{currencies.map(c=><option key={c}>{c}</option>)}</select></label>
        <label>Purchase price / kg *<input type="number" min="0" step="any" inputMode="decimal" placeholder="4.00" value={q.purchase_per_kg} onChange={e=>uq('purchase_per_kg',e.target.value)}/></label>
        <label>Selling price / kg *<input type="number" min="0" step="any" inputMode="decimal" placeholder="5.50" value={q.selling_per_kg} onChange={e=>uq('selling_per_kg',e.target.value)}/></label>
        <label className="wide">Other shipment costs (total) *<input type="number" min="0" step="any" inputMode="decimal" value={q.other_costs} onChange={e=>uq('other_costs',e.target.value)}/><small>All freight, packing, banking and other expenses combined. Enter 0 if none.</small></label>
      </div>:<div>
        <div className="quick-costing-method" role="group" aria-label="Commission basis">{['Per kg','Percentage','Fixed'].map(v=><button key={v} className={a.commission_method===v?'active':'secondary'} aria-pressed={a.commission_method===v} onClick={()=>ua('commission_method',v)}>{v}</button>)}</div>
        <div className="quick-costing-fields">
          <label>Currency *<select value={a.currency} onChange={e=>ua('currency',e.target.value)}>{currencies.map(c=><option key={c}>{c}</option>)}</select></label>
          <label>{a.commission_method==='Percentage'?'Commission (%)':a.commission_method==='Fixed'?'Fixed fee':'Commission / kg'} *<input type="number" min="0" step="any" inputMode="decimal" value={a.commission_rate} onChange={e=>ua('commission_rate',e.target.value)}/></label>
          {a.commission_method==='Per kg'&&<label className="wide">Quantity (kg) *<input type="number" min="0" step="any" inputMode="decimal" value={a.commission_quantity_kg} onChange={e=>ua('commission_quantity_kg',e.target.value)}/></label>}
          {a.commission_method==='Percentage'&&<label className="wide">Total deal value *<input type="number" min="0" step="any" inputMode="decimal" value={a.total} onChange={e=>ua('total',e.target.value)}/></label>}
        </div>
        <details className="quick-costing-agreement"><summary>Commission agreement details</summary><label>Who pays the commission?<input value={a.commission_payer} onChange={e=>ua('commission_payer',e.target.value)}/></label><label>Agreed terms<textarea value={a.commission_agreement} onChange={e=>ua('commission_agreement',e.target.value)}/></label></details>
      </div>}
      <p className="muted">{active?'Use the same currency for every amount. This is a planning estimate, not an export quotation.':'The deal value belongs to the buyer and supplier, not to Ambersea. Commission is your estimated revenue before expenses and tax.'}</p>
    </div>
    <div className="quick-costing-result" aria-live="polite">
      <span className="eyebrow">{active?'ESTIMATED TRADING PROFIT':'ESTIMATED COMMISSION'}</span>
      {(active&&quick)||(!active&&fee!==null)?<>
        <div className={'quick-costing-amount '+(active&&quick.gross_profit<0?'is-loss':'')}>{moneyValue(active?quick.gross_profit:fee)}</div>
        {active&&<div className="quick-costing-metrics">
          <div><span>Profit margin</span><strong>{quick.margin_percent===null?'N/A':quick.margin_percent.toFixed(2)+'%'}</strong></div>
          <div><span>Profit per kg</span><strong>{moneyValue(quick.profit_per_kg)}</strong></div>
          <div><span>Break-even price / kg</span><strong>{moneyValue(quick.break_even_per_kg)}</strong></div>
          <div><span>Total cost</span><strong>{moneyValue(quick.total_cost)}</strong></div>
          <div><span>Total sales</span><strong>{moneyValue(quick.revenue)}</strong></div>
        </div>}
        <div className="quick-costing-save">
          <label>Save estimate as<input value={active?q.name:a.name} placeholder="e.g. Frozen squid 10 MT" onChange={e=>active?uq('name',e.target.value):ua('name',e.target.value)}/></label>
          {active?linked(q.rfq_id,v=>uq('rfq_id',v)):linked(a.rfq_id,v=>ua('rfq_id',v))}
          <button disabled={!canWrite||!(active?q.name:a.name).trim()} onClick={active?saveTrade:saveFee}>Save estimate to Supabase</button>
        </div>
      </>:<div className="quick-costing-empty"><Calculator size={30}/><strong>Enter your deal numbers</strong><p>Profit and break-even results appear automatically.</p>{active&&(q.quantity_kg||q.purchase_per_kg||q.selling_per_kg)&&<small>{quickError}</small>}</div>}
    </div>
  </div>
 </section>;
}
