import test from 'node:test';
import assert from 'node:assert/strict';
import {businessDate,daysFromBusinessDate,buildReminders} from '../src/reminders.mjs';
test('India date stays correct just after midnight IST',()=>{
  assert.equal(businessDate(new Date('2026-11-14T19:00:00Z')),'2026-11-15');
  assert.equal(businessDate(new Date('2026-11-15T20:00:00Z')),'2026-11-16');
});
test('days remaining and overdue deadlines',()=>{
  assert.equal(daysFromBusinessDate('2026-11-15','2026-11-15'),0);
  assert.equal(daysFromBusinessDate('2026-11-14','2026-11-15'),-1);
  assert.equal(daysFromBusinessDate('2026-11-19','2026-11-15'),4);
  assert.equal(daysFromBusinessDate('bad','2026-11-15'),null);
});
test('reminders are generated from task, quote, supplier, order and shipment records',()=>{
 const data={tasks:[{id:'t1',title:'Follow up buyer',due_on:'2026-11-14',status:'Open',owner_id:'me'},{id:'t2',title:'Another owner',due_on:'2026-11-15',status:'Open',owner_id:'other'},{id:'t3',title:'Done',due_on:'2026-11-15',status:'Completed'}],quotes:[{id:'q1',number:'Q-9',status:'Sent',valid_until:'2026-11-15'}],orders:[{id:'o1',po_reference:'PO-1',expected_delivery:'2026-11-16',status:'Confirmed'}],shipments:[{id:'s1',eta:'2026-11-17',status:'Booked'}],supplier_offers:[{id:'a1',valid_until:'2026-11-18',availability_status:'Verified'}]};
 const found=buildReminders(data,'me',new Date('2026-11-15T06:00:00Z'));
 assert.equal(found.length,5);
 assert.deepEqual(found.map(a=>a.category),['Task','Quote','Order','Shipment','Supplier offer']);
 assert.equal(found[0].urgency,'overdue');
});
test('closed and distant reminders do not trigger',()=>{
 const d={quotes:[{id:'1',status:'Accepted',valid_until:'2026-11-15'}],tasks:[{id:'t',due_on:'2026-12-01',status:'Open'}]};
 assert.equal(buildReminders(d,'me',new Date('2026-11-15T10:00:00Z')).length,0);
});

import {offersForRequirement,canReserveStock} from '../src/domain.mjs';
test('supplier comparison never mixes another buyer RFQ even for the same product',()=>{
 const offers=[{id:'right',rfq_id:'r1',product_id:'squid'},{id:'wrong',rfq_id:'r2',product_id:'squid'},{id:'general',rfq_id:null,product_id:'squid'},{id:'other',rfq_id:'r1',product_id:'shrimp'}];
 assert.deepEqual(offersForRequirement(offers,'r1','squid').map(o=>o.id),['right']);
});
test('stock reservation action includes procurement without granting management access',()=>{
 assert.equal(canReserveStock('procurement'),true);
 assert.equal(canReserveStock('sales'),true);
 assert.equal(canReserveStock('admin'),true);
 assert.equal(canReserveStock('management'),false);
});

test('impossible calendar dates never create reminders',()=>{
  assert.equal(daysFromBusinessDate('2026-02-30','2026-02-01'),null);
  assert.equal(daysFromBusinessDate('2026-12-32','2026-12-01'),null);
});
