import test from 'node:test';
import assert from 'node:assert/strict';
import {checkConnectionConfig} from '../src/config.mjs';
const good = 'sb_publishable_abcdefghijklmnopqrstuvwxyz0123456789';
test('correct Ambersea URL and publishable key accepted',()=>{
  assert.equal(checkConnectionConfig('https://xgjoanqeepaxfstutlfx.supabase.co',good),null);
});
test('rejects missing/placeholder keys with actionable error',()=>{
  assert.match(checkConnectionConfig('https://xgjoanqeepaxfstutlfx.supabase.co','sb_publishable_REPLACE_WITH_KEY'),/Set VITE_/);
});
test('rejects a Delsea database URL to prevent cross-company access',()=>{
  assert.match(checkConnectionConfig('https://qlmfrphvsvodyrznbifi.supabase.co',good),/different Supabase project/);
});
test('rejects non-https, invalid and privileged keys',()=>{
  assert.match(checkConnectionConfig('http://xgjoanqeepaxfstutlfx.supabase.co',good),/HTTPS/);
  assert.match(checkConnectionConfig('https://xgjoanqeepaxfstutlfx.supabase.co','sb_secret_do_not_expose_1234567890123456'),/publishable key/);
  assert.match(checkConnectionConfig('not-a-url',good),/valid URL/);
});
