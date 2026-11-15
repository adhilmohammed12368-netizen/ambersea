import React from 'react';

export function Setup({error}: {error:string}) {
  return <main className="setup-page">
    <section className="setup-card" role="alert">
      <div className="eyebrow">AMBERSEA TRADE DESK</div>
      <h1>Connection setup required</h1>
      <p>{error}</p>
      <ol>
        <li>Open Vercel → your Trade Desk project → Settings → Environment Variables.</li>
        <li>Set <code>VITE_SUPABASE_URL</code> to the Ambersea Supabase Project URL.</li>
        <li>Set <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> to its <strong>publishable</strong> key.</li>
        <li>Deploy again. A Vite frontend cannot receive changed environment variables without rebuilding.</li>
      </ol>
      <p className="muted">Never enter a database password, service-role key, or sb_secret key here. No records have been changed.</p>
    </section>
  </main>;
}
