import{test}from'node:test';import assert from'node:assert/strict';import{cost,commission,match,safeURL,csvCell}from'../src/domain.mjs';
const x={incoterm:'EXW',cost_currency:'INR',sell_currency:'USD',quantity_kg:1000,fx:80,fx_date:'2026-11-14',fx_source:'Manual test',margin:20,procurement:80000,processing:0,packing:0,cold_storage:0,banking:0,other:0,contingency:0};
test('margin is distinguished from markup and FX direction is explicit',()=>{const r=cost(x);assert.equal(r.revenue,1250);assert.equal(r.selling_price,1.25);assert.equal(r.gross_profit,250);assert.equal(r.margin_percent,20);assert.equal(r.markup_percent,25)});
test('unknown freight, insurance or FX is rejected',()=>{assert.throws(()=>cost({...x,incoterm:'CIF'}));assert.throws(()=>cost({...x,fx:''}));assert.throws(()=>cost({...x,margin:100}));assert.throws(()=>cost({...x,fx_source:''}))});
test('fees cover per-kg, percentage and fixed arrangements',()=>{assert.equal(commission({commission_method:'Per kg',commission_rate:.1,commission_quantity_kg:25000}),2500);assert.equal(commission({commission_method:'Percentage',commission_rate:2,total:50000}),1000);assert.equal(commission({commission_method:'Fixed',commission_rate:500}),500)});
test('supplier match reports missing availability and price basis',()=>{const r=match({product_id:'octopus',quantity_kg:100},{product_id:'octopus',quantity_kg:20,currency:'EUR',incoterm:'FOB'},{currency:'USD',incoterm:'CFR'});assert.ok(r.risks.includes('Insufficient quantity'));assert.ok(r.risks.includes('Availability unverified'));assert.ok(r.risks.some(x=>x.includes('currency')))});
test('export formula injection and dangerous links are blocked',()=>{assert.equal(safeURL('javascript:alert(1)'),null);assert.equal(safeURL('https://example.com'),'https://example.com/');assert.equal(csvCell('=1+1'),'"\'=1+1"')});

test('spreadsheet exports neutralize formulas preceded by whitespace',()=>{
  assert.equal(csvCell('   =HYPERLINK("https://bad.invalid")'),'"\'   =HYPERLINK(""https://bad.invalid"")"');
  assert.equal(csvCell('\n+SUM(1,2)'),'"\'\n+SUM(1,2)"');
  assert.equal(csvCell('Safe text'),'"Safe text"');
});
