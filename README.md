# FutureSelf AI

**One Decision. Multiple Futures.**

FutureSelf AI turns a decision into three plausible paths. Inspect the assumptions behind each path, compare the trade-offs, then work backward from a preferred future into a practical plan. All scenario costs and efforts are planning estimates.

[Open the live site](https://futureself-ai.freshchick16.chatgpt.site)

## Run locally

Use Node.js 22 or newer. From the extracted project folder:

```sh
npm ci
npm run dev
```

Open [the local app](http://localhost:3000). You can run the demo with no API key and no external requests once the local server and assets are available.

## Try the student demo

1. Select **Try the demo** on the home page, or open [the demo workspace](http://localhost:3000/explore?demo=1). You start as a second-year computer science student with six months and 12 hours per week.
2. Open an AI/ML, DSA, or entrepreneurship milestone to inspect actions, dependencies, and assumptions. Pan, zoom, or reset the timeline.
3. Open the What-If controls and reduce weekly time to **5 hours**. Available capacity goes from **312 to 130 hours**. Inspect milestone rescheduling and the new recommendations.
4. Compare the three paths and choose one for a **30-day roadmap**. Check off a task, then record real progress and updated constraints in **Reality Check**.
5. Return through **History** to reopen your saved decision. What-If versions you explicitly save are separate records.

## Enable live AI

Copy `.env.example` to `.env.local`. Set `OPENAI_API_KEY` to an API project key with model access and restart the server. `OPENAI_MODEL` defaults to `gpt-6-luna` and can be set to a compatible model that supports Structured Outputs. Keep the key server-side.

Studio generation, qualitative What-If reevaluation, and FutureSelf conversations call the OpenAI Responses API when configured. User-entered context is sent with live requests. Model output is validated by Zod before rendering. Missing keys and upstream failures use labeled offline templates or retain the previous scenario analysis. The timeline, capacity calculations, comparison, roadmap, Reality Check, and browser persistence work without OpenAI. See the [OpenAI Structured Outputs guide](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses).

## Project layout

| Area | Location |
| --- | --- |
| Pages and API handlers | `app/` |
| Branching timeline, conversation, navigation | `components/` |
| Schemas, OpenAI, offline scenarios, scheduling, storage | `lib/` |
| API integration, simulation and browser tests | `tests/` |

The app uses Next.js App Router, strict TypeScript, Tailwind CSS, Geist, Lucide, React Flow, Recharts, and Zod. Data lives in local storage and is scoped to the browser and origin.

## Verification

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

On Windows with Microsoft Edge installed, you can set `FUTURESELF_E2E_CHANNEL=msedge` for the browser test. Set `FUTURESELF_E2E_BASE_URL` to target an already-running demo build. API integration tests use controlled provider responses and do not require a key.

## Deploy to Vercel

Import the project from a Git repository, choose the **Next.js** preset, and set **Root Directory** to the directory containing `package.json` if the app is nested. Use Node.js 22 or newer. Vercel can use the default Next.js install and build settings. [Build configuration](https://vercel.com/docs/builds/configure-a-build)

For live AI, add `OPENAI_API_KEY` to the appropriate Vercel environments and optionally override `OPENAI_MODEL`. Deploy or redeploy after making changes. [Environment variable setup](https://vercel.com/docs/environment-variables/managing-environment-variables)

## MVP boundaries

Saved data is browser-local. Cloud accounts and cross-device sync through Supabase are outside this MVP. If browser storage is unavailable, edits survive only for the current app session. The offline demo runs with the local server available and uses scenario templates. A public deployment with a paid key should add authentication and per-user quotas.
