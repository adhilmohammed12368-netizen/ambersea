import test from 'node:test';
import assert from 'node:assert/strict';
import {executeAndRefresh,describeError} from '../src/reliability.mjs';
import {validateTradeDocument} from '../src/uploads.mjs';

test('a committed write is acknowledged even if refresh fails', async()=>{
  const trace=[];
  const done=await executeAndRefresh(async()=>trace.push('saved'),async()=>{trace.push('refresh');throw Error('network interrupted')});
  assert.deepEqual(trace,['saved','refresh']);
  assert.equal(done.actionCompleted,true);
  assert.equal(done.refreshed,false);
  assert.match(describeError(done.refreshError),/network interrupted/);
});
test('failed writes are not falsely marked saved or reloaded',async()=>{
  let reloaded=false;
  await assert.rejects(executeAndRefresh(async()=>{throw Error('permission denied')},async()=>{reloaded=true}),/permission denied/);
  assert.equal(reloaded,false);
});
test('manual refresh reloads once without mutation',async()=>{
  let reads=0;
  const done=await executeAndRefresh(()=>{throw Error('should not run')},async()=>{reads++},{refreshOnly:true});
  assert.equal(done.actionCompleted,false);
  assert.equal(reads,1);
});
test('document types accepted across browsers and normalized for storage',()=>{
  const file=(name,type)=>({name,type,size:1024});
  assert.equal(validateTradeDocument(file('order.csv','application/vnd.ms-excel')).contentType,'text/csv');
  assert.equal(validateTradeDocument(file('quote.xlsx','application/zip')).extension,'xlsx');
  assert.equal(validateTradeDocument(file('proof.jpg','image/jpeg')).contentType,'image/jpeg');
  assert.equal(validateTradeDocument(file('invoice.pdf','')).contentType,'application/pdf');
});
test('dangerous/empty/oversized/mismatched documents rejected',()=>{
  for(const file of [
    {name:'bad.exe',size:100,type:'application/octet-stream'},
    {name:'image.png',size:0,type:'image/png'},
    {name:'image.png',size:10485761,type:'image/png'},
    {name:'order.pdf',size:200,type:'image/png'},
    {name:'../order.pdf',size:200,type:'application/pdf'},
  ]) assert.throws(()=>validateTradeDocument(file));
});
test('error descriptions cap excessive backend strings',()=>{
  assert.equal(describeError({message:'x'.repeat(1000)}).length,300);
});

import {commission,commissionPreview} from '../src/domain.mjs';
test('commission prevents invalid quantities and excessive percentage rates',()=>{
  assert.throws(()=>commission({commission_method:'Per kg',commission_rate:0.1,commission_quantity_kg:''}),/quantity/);
  assert.throws(()=>commission({commission_method:'Percentage',commission_rate:120,total:2000}),/percentage/);
  assert.throws(()=>commission({commission_method:'Unknown',commission_rate:1,total:2000}),/method/);
  assert.equal(commission({commission_method:'Per kg',commission_rate:0.10,commission_quantity_kg:25500}),2550);
  assert.equal(commissionPreview({commission_method:'Per kg',commission_rate:0.1,commission_quantity_kg:''}),null);
});
