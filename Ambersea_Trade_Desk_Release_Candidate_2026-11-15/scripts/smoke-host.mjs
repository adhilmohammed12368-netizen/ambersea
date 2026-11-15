/**
 * Non-authenticated availability check for a newly deployed Vercel site.
 * DOES NOT test Supabase login, RLS, saves, document upload or buyer workflows.
 * Usage: node scripts/smoke-host.mjs https://YOUR-APP.vercel.app
 */
const raw=process.argv[2];
if(!raw) {console.error('Usage: node scripts/smoke-host.mjs https://YOUR-APP.vercel.app');process.exit(2)}
let origin;
try{origin=new URL(raw);if(origin.protocol!=='https:')throw Error('HTTPS required')}catch{console.error('Enter a valid HTTPS deployment URL');process.exit(2)}
const site=await fetch(origin,{redirect:'follow',signal:AbortSignal.timeout(20000)});
const html=await site.text();
console.log(`Site: HTTP ${site.status}`);
if(!site.ok||/403|access denied|you don.t have access to this site/i.test(html)){
 console.error('Hosting is not accessible. Verify sharing, deployment, and domain access.');process.exit(1);
}
if(!/<div[^>]+id=["']root["']/i.test(html)){
 console.error('Not a recognizable Ambersea Trade Desk Vite application.');process.exit(1);
}
const urls=[...html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css)(?:\?[^"']*)?)["']/g)].map(x=>x[1]);
if(!urls.length){console.error('No generated JS/CSS asset links found. Confirm Vercel built the Vite dist output.');process.exit(1)}
for(const path of urls){
 const target=new URL(path,site.url);
 const r=await fetch(target,{redirect:'follow',signal:AbortSignal.timeout(20000)});
 const ct=r.headers.get('content-type')||'';
 console.log(`${r.status} ${target.pathname} (${ct})`);
 if(!r.ok||ct.includes('text/html')){console.error('Missing/rewritten frontend asset.');process.exit(1)}
}
console.log('PASS: public app shell and linked assets respond. Sign-in and write workflows remain untested.');
