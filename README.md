# ManyPrep

Minimal question-bank app: magic-link login, one question at a time, submit an
attempt, see correct/incorrect, toggle the explanation.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment variables** — copy `.env.local.example` to `.env.local` and
   fill in your Supabase project URL + anon key (Supabase dashboard →
   Settings → API).

3. **Database setup** — run `supabase_app_setup.sql` in the Supabase SQL
   editor. This turns on Row Level Security policies for `questions` and
   `attempts` (without these, every query from the app silently returns
   nothing / gets blocked — RLS defaults to deny-all), and adds a
   `question_type` column the app uses to tell multiple-choice questions
   apart from free-response ones.

4. **Auth redirect URL** — in the Supabase dashboard, go to
   Authentication → URL Configuration, and add your app's URL to
   **Redirect URLs**:
   - Local dev: `http://localhost:3000/auth/callback`
   - Production: `https://your-vercel-domain.com/auth/callback`

   Without this, the magic link will redirect somewhere Supabase refuses
   to send the session to, and login will silently fail.

5. **Run locally**
   ```bash
   npm run dev
   ```

## Deploying to Vercel

```bash
npx vercel
```
Add the same two environment variables (`NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the Vercel project settings, then add the
production URL to Supabase's redirect URLs (step 4 above).

## How it works

- **Login** (`/login`) — enter an email, get a magic link, land on
  `/question-bank` once clicked.
- **Question Bank** — pulls one random question from `questions` (any row
  with a non-null `correct_answer` and `stem`). Multiple-choice questions
  render as selectable options; questions with no `choices` render a text
  input (grid-in / free response).
- **Submitting** — records one row in `attempts` with the selected answer,
  whether it was correct, and `time_spent_sec` (a simple client-side
  stopwatch that starts when the question loads and stops on submit).
  Correct choice highlights green, your wrong pick (if any) highlights red.
- **Explanation** — a toggle after submitting reveals `rationale`, rendered
  through MathJax so any `$...$` LaTeX from the OCR pipeline displays
  properly.
- **Next question** — fetches a new random question and resets the timer.
  Nothing here yet ties questions to a specific assignment/student —
  that's the "assigned questions" piece you mentioned doing later.

## Known simplifications, worth knowing about

- **Random question selection** pulls a small batch and picks one client-side
  rather than a true `ORDER BY random()` — fine at current question-bank
  size, worth revisiting if the bank grows into the tens of thousands.
- **Grading** does a case-insensitive string match, with numeric-equality
  fallback for grid-ins (so `"4"` matches `"4.0"`). It won't catch things
  like accepting `"1/2"` and `"0.5"` as equivalent — flag it if that's a
  real need and I'll tighten the grader.
- **No retry/change-answer flow** — once submitted, that question is locked
  for that view. Matches "each attempt is a submit" from your spec, but
  means there's currently no way to re-attempt the *same* question from
  this screen (only "Next question," which pulls a different one).
# manyprep
