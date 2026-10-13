# Tamil Pooja Suite

Household expense, chit/loan and cycle tracker built with React, Vite and Supabase.

## Running locally

```bash
npm install
cp env.local .env.local   # Supabase URL and anon key
npm run dev
```

## Data assistant chat

The chat button in the bottom-right corner opens an assistant that answers questions about your data
("How much did we spend on groceries last month?", "How much is left on our chits?"). It runs in
`api/chat.js` (a Vercel serverless function) and `server/chat.js`, which let Claude call read-only tools that
query Supabase. Nothing in the chat can add, change or delete data.

It needs an Anthropic API key, kept on the server only:

- **Locally:** add `ANTHROPIC_API_KEY=sk-ant-...` to `.env.local` (git-ignored). `npm run dev` serves `/api/chat` too.
- **On Vercel:** Project → Settings → Environment Variables → add `ANTHROPIC_API_KEY`, then redeploy.
  The function reads Supabase from `SUPABASE_URL`/`SUPABASE_ANON_KEY`, falling back to the existing `VITE_` variables.

Never put the Anthropic key in a `VITE_` variable or commit it: `VITE_` values are shipped to the browser.
