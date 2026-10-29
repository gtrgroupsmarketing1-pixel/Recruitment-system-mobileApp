# Recruitment OS — Mobile (Expo)

Field intake app for recruiters. Talks to the Next.js backend via Bearer JWT.

## Setup

```bash
npm install
# Point at your Vercel deployment
export EXPO_PUBLIC_API_URL=https://YOUR-DEPLOYMENT.vercel.app
npx expo start
```

## Backend routes (main repo)

- `POST /api/mobile-auth` — email/password → JWT
- `POST /api/mobile/intake/parse` — text → structured draft (heuristic; LLM-ready)
- `POST /api/mobile/intake/save` — confirmed REQUISITION or CANDIDATE

## Login

Use staff credentials, e.g. `admin@demo.local` (tenant slug `demo`).

## Flow

1. Paste WhatsApp / job text  
2. Parse → review form  
3. Confirm & save → creates client (if needed) + requisition or candidate in Neon via existing services  
