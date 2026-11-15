import{test}from'node:test';import assert from'node:assert/strict';import{quickTrade}from'../src/quick-costing.mjs';
const x={quantity_kg:'10000',purchase_per_kg:'4',selling_per_kg:'5.5',other_costs:'5000',currency:'USD'};
test('quick profit and margin',()=>{const r=quickTrade(x);assert.equal(r.gross_profit,10000);assert.equal(r.break_even_per_kg,4.5);assert.equal(r.revenue,55000);assert.ok(Math.abs(r.margin_percent-18.181818)<.0001)});
test('loss is not hidden',()=>{const r=quickTrade({...x,selling_per_kg:'3'});assert.equal(r.gross_profit,-15000);assert.equal(r.margin_percent,-50)});
test('reject missing, negative, zero quantity and invalid currency',()=>{for(const y of[{quantity_kg:''},{quantity_kg:'0'},{purchase_per_kg:'-2'},{other_costs:''},{currency:'XYZ'}])assert.throws(()=>quickTrade({...x,...y}))});
test('zero costs and zero turnover remain valid with undefined margin',()=>{const r=quickTrade({...x,other_costs:'0',selling_per_kg:'0'});assert.equal(r.gross_profit,-40000);assert.equal(r.margin_percent,null)});
