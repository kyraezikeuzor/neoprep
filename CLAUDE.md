# CLAUDE.md

SAT prep platform. Next.js 14 App Router + Supabase + Stripe, with an admin
console that generates questions through the Anthropic API.

```bash
npm run dev
npm run build
npx tsc --noEmit   # the real check — keep this clean
```

## Naming

The product goes by four names and they are not interchangeable:

| Where | Name |
|---|---|
| `package.json`, `README.md` | ManyPrep |
| User-facing metadata, page titles | **Tutormigo** |
| `lib/generation/*` prompts, generated `source` field | ArcPrep |
| Tailwind tokens, CSS component classes | `arc-*` |

Use **Tutormigo** for anything a student or visitor reads. Leave `arc-*` alone
in styles and leave `ArcPrep` alone in the generation prompts — the `source`
tag on generated rows is load-bearing (it keeps AI-written questions separable
from College Board-sourced ones). Don't "unify" these without being asked.

## Architecture

### Routing

- `app/(dashboard)/*` — the authed student/admin app, wrapped by
  `DashboardShell` + `Sidebar` in `app/(dashboard)/layout.tsx`.
- `app/admin/*`, `app/pricing`, `app/login`, `app/join/[code]` — outside that
  group, so no dashboard chrome.
- `app/api/*` — Stripe webhook/checkout/portal, live-session attendance, and
  the SSE question-generation endpoint.

`middleware.ts` does two things: it forwards stray `?code=` params to
`/auth/callback` (Supabase falls back to the Site URL and would otherwise drop
the PKCE exchange), and it redirects signed-in users off `/` and `/login`.

### Server actions are the API layer

There is no REST layer for app data. `app/actions/index.ts` and
`app/actions/bootcamp/index.ts` are `"use server"` **barrels**; the modules
they import (`stats.ts`, `progress.ts`, `question-bank.ts`, `bootcamp/student.ts`,
`bootcamp/admin.ts`, …) are plain modules with no `"use server"` directive.

Each barrel export is a hand-written passthrough:

```ts
export async function getRandomQuestion(
  ...args: Parameters<typeof questionBank.getRandomQuestion>
) {
  return questionBank.getRandomQuestion(...args);
}
```

When you add an action: implement it in the topic module, then add the
passthrough **and** re-export its types from the barrel. Components import from
`@/app/actions`, never from the implementation module directly.

### Supabase clients — three of them, and the choice matters

| Factory | Use |
|---|---|
| `lib/supabase/server.ts` | Cookie-bound, RLS-enforced. Default for user data. |
| `lib/supabase/client.ts` | Browser components. |
| `lib/supabase/admin.ts` | Service role. **Bypasses RLS.** |

A lot of reads deliberately use the service role. This is not an oversight —
`profiles` RLS calls an `is_admin()` function that `authenticated` users often
can't `EXECUTE`, so even "read my own role" fails against the user client. Same
for `students`/`bootcamps` membership reads and assignment-linked `attempts`
writes. See the comments in `app/actions/bootcamp/auth.ts` and
`app/actions/submissions.ts`.

**Consequence:** authorization lives in application code, not the database.
Any admin-only action must call `requireAdmin()` from
`@/app/actions/bootcamp` before touching the service-role client. When you
reach for `createAdminClient()`, say in a comment why the user client won't do.

## Data model

The core tables — `questions`, `attempts`, `profiles`, `students`, `bootcamps`,
`assignments`, `problems`, `sessions`, `skills`, `patterns`, `feedback` —
predate `supabase/migrations/` and **exist only in the live database.** The
migrations directory covers `bookmarks`, `explainers`, `vocabulary`,
`subscriptions`, `live_session_attendance`, and later alters. Don't assume the
migrations describe the schema; check the live DB or the select strings in
`app/actions/`.

`attempts` is the center of gravity. XP, streaks, mastery, the mistakes feed,
the free-tier meter, and adaptive question selection all derive from it. A row
is one submit — there is no update-in-place, and re-attempting a question adds
another row.

## Domain rules

**Access** (`lib/access-policy.ts`, `lib/question-access.server.ts`) — Free tier
is 100 **unique** questions, counted as distinct `attempts.question_id`, so
re-answering something already seen is always free. Admins get Pro implicitly.
Enforced in `getRandomQuestion`, `getQuestionById`, and `submitAttempt`, plus a
DB trigger. Any new path that serves an unattempted question must check
`getQuestionAccessForUser` / `getCurrentQuestionAccess` too.

**XP** (`lib/xp.ts`) — 1 point per attempt, plus 5/10/15 when correct by tier
1/2/3. Twenty hardcoded level thresholds in `LEVEL_START_XP`.

**Mastery** (`lib/mastery.ts`) — tier-weighted evidence (1/2/3 points), scored
against a floor of `MASTERY_TARGET_POINTS` (20) so a student who got one
question right reads as "Building," not 100%. Uses only the **latest** attempt
per question. The formula is versioned (`MASTERY_FORMULA_VERSION`) — bump it if
you change the math.

**Adaptive assignments** (`app/actions/bootcamp/adaptive.ts`) — returns an
existing unfinished set if there is one, rather than piling up new work.
Otherwise it weights candidates by wrong-answer frequency (skill ×3, domain ×2,
then tier) and aims for a half-math/half-reading split. Only `verified = true`,
`cb = false` questions are eligible.

**Question generation** (`lib/generation/server.ts`) — calls the Anthropic API
with plain `fetch`, no SDK. The model is resolved at runtime from `/v1/models`,
preferring the newest `claude-opus-*`; don't hardcode a model id. The system
prompt embeds `SKILL.md` only — `MATH.md` / `READING.md` are reference material
for humans, and the `referenceFile` field in the result is reporting metadata,
not a file that gets read. Per-skill guidance comes from the DB
(`skills.generation_context` and the selected `patterns` row).

`PROMPT_DIR` reads from `lib/generation/` via `process.cwd()`. If generation
ever fails in production with ENOENT while working locally, it's Next.js file
tracing not bundling the `.md` files — fix with `outputFileTracingIncludes` in
`next.config.mjs`, not by inlining the prompt.

**Billing** — Stripe checkout/portal/webhook under `app/api/`. The webhook
upserts `subscriptions` on `stripe_checkout_session_id` (one-time "Until SAT"
plans) or `stripe_subscription_id` (recurring). `lib/pricing.ts` holds the
plan catalog and the until-SAT weekly quote; read the comments at the bottom
before touching prices — the quarterly tier is deliberately not marketed as a
discount.

## UI conventions

- **Typography is centralized.** Use the semantic styles in `lib/typography.ts`
  (`typography.pageTitle`, `typography.cardValue`, `textColor.muted`, …) instead
  of assembling font/size/weight/gray by hand. The `marketing*` styles are
  deliberately separate from the in-app ones so a public-site redesign can't
  leak into the student platform.
- **Component classes** live in the `@layer components` block of
  `app/globals.css`: `arc-card`, `arc-btn-primary`, `arc-btn-secondary`,
  `arc-card-label`.
- **Page skeleton** — dashboard pages render
  `<DashboardPageShell><PageHeader title=… />…</DashboardPageShell>`, and export
  a `metadata` with a `· Tutormigo` suffix.
- **Icons are inline SVG components**, defined in the file that uses them.
  There is no icon library and adding one would be a large diff — match the
  existing pattern.
- **Math renders through MathJax**, configured in `app/layout.tsx` with
  `\(...\)` delimiters rather than `$...$`, because question stems contain
  literal dollar amounts. Wrap question text in `.question-prose` /
  `MathText` so the sizing rules apply.

## Gotchas

- Supabase query builders with many chained `.eq`/`.in`/`.not` calls trigger
  TS "type instantiation excessively deep." The existing workaround is a
  `let query: any` with an eslint-disable — follow it rather than fighting it.
- `lib/questions.ts:normalizeChoices` handles `choices` arriving as a JSON
  object, a JSON string, *or* a single-quoted Python-ish dict from the OCR
  pipeline. Always go through `normalizeQuestion`.
- `lib/devPreview.ts` fakes an enrolled-student view in development when
  there's no session. It's `NODE_ENV`-gated; don't extend it into anything
  that could ship.
- `getRandomQuestion` pulls a batch of 50 and picks client-side rather than
  `ORDER BY random()`. Fine at current bank size; revisit if it grows.
