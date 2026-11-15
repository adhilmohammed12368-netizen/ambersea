/** One-currency quick trading scenario. Do not silently mix foreign currencies. */
export function quickTrade(input){
  if(!['USD','EUR','INR','GBP','CNY','KRW','AED'].includes(input.currency))throw Error('Choose a single currency.');
  const keys=['quantity_kg','purchase_per_kg','selling_per_kg','other_costs'];
  const n={};
  for(const k of keys){const v=input[k];if(v===''||v==null||!Number.isFinite(Number(v))||Number(v)<0)throw Error('Enter a valid '+k.replaceAll('_',' ')+'. Enter 0 for costs that do not apply.');n[k]=Number(v)}
  const qty=n.quantity_kg;if(qty<=0)throw Error('Enter quantity above 0 kg.');
  const purchase_total=qty*n.purchase_per_kg;
  const total_cost=purchase_total+n.other_costs;
  const revenue=qty*n.selling_per_kg;
  const gross_profit=revenue-total_cost;
  if(![purchase_total,total_cost,revenue,gross_profit].every(Number.isFinite))throw Error('Amounts are too large.');
  return {purchase_total,total_cost,revenue,gross_profit,profit_per_kg:gross_profit/qty,break_even_per_kg:total_cost/qty,margin_percent:revenue>0?gross_profit/revenue*100:null,markup_percent:total_cost>0?gross_profit/total_cost*100:null};
}
