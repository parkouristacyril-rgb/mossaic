# Mosaic

Creative intelligence for short-form video. Analyses TikTok and Instagram
videos across dozens of creative dimensions, mines repeating mechanisms across
the whole corpus, and turns those into shoot-ready concepts.

## Running it

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL, GEMINI_API_KEY, APIFY_TOKEN, JOB_SECRET
npx prisma db push          # create the tables
npm run db:seed             # create one organization + member
npm run dev
```

Then open http://localhost:3000.

Before anything else, run `npm run typecheck` — it is the fastest way to catch
a problem after a schema change, because Prisma's generated types flow through
the whole app.

## How the pieces fit

```
share sheet / form / bulk import
        │
        ▼
POST /api/observations ──► dedup on (org, platform, externalId)
        │                     new video? → queue
        ▼
lib/pipeline/process-video.ts
        │  scrape stats (Apify) → append PerformanceSnapshot
        │  readiness check → complete stats or AWAITING_DATA
        │  4 Gemini passes in parallel → VideoAnalysis
        │  entity extraction → Entity + VideoEntity
        │  scoring → VideoScore
        ▼
POST /api/jobs/pattern-engine  (scheduled, per organization)
        │  reads ANALYZED videos only
        │  mines mechanisms, requires ≥3 distinct videos each
        │  computes lift from stored scores, not from the model
        ▼
Pattern + PatternEvidence ──► /api/ideas grounds generation in them
```

### Decisions worth knowing

**Deduplication is the spine.** A video is unique per
`(organizationId, platform, externalId)`. Two people sharing the same clip
produce two observations against one video, not two analyses — analysis is the
expensive part and that clip only needs analysing once.

**Incomplete stats park a video rather than fail it.** A fresh upload often
returns partial numbers. Those videos get `AWAITING_DATA` and are excluded from
pattern mining until a re-run fills the gaps, so half-loaded data never shapes
the library. Note the readiness check tests for *presence*, not non-zero — a
genuine zero view count is complete data.

**Patterns need evidence.** A mechanism is only written when at least three
distinct videos show it, and the model's proposed video ids are filtered
against the real corpus first so invented ids cannot manufacture a pattern.

**Lift is computed, not generated.** The engagement lift on a pattern comes
from aggregating stored scores. The model proposes mechanisms; arithmetic
decides whether they are worth anything.

**Every performance pull is appended.** Snapshots are never overwritten, which
is what makes "this pattern is fading" answerable at all.

## Background jobs

Both endpoints require `Authorization: Bearer $JOB_SECRET`.

```bash
# Mine patterns for one organization — run on a schedule (nightly is plenty)
curl -X POST "$HOST/api/jobs/pattern-engine?organizationId=ORG_ID" \
  -H "Authorization: Bearer $JOB_SECRET"

# Re-analyse a single video, e.g. one parked in AWAITING_DATA
curl -X POST "$HOST/api/jobs/process-video" \
  -H "Authorization: Bearer $JOB_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"videoId":"..."}'
```

## Share targets

**Android / PWA** — `public/manifest.json` declares a `share_target` pointing
at `POST /api/share`, which extracts the link and redirects to a pre-filled
form.

**iOS Shortcut** — set the Shortcut's final action to "Open URL" with
`https://YOUR_HOST/api/share?text=[Shortcut Input]`. Same handler, GET branch.

## What is deliberately not built yet

- **Auth.** `src/lib/org.ts` returns the first organization and
  `/api/session` reports it to the client. Every query is already scoped by
  `organizationId`, so adding real sessions means changing those two files.
- **A real queue.** `src/lib/pipeline/queue.ts` runs analysis in the background
  of the same process. That holds to a few hundred videos a day; past that,
  replace the function body with a queue push — callers do not change.
- **Rate limiting and plan enforcement.** The pricing tiers exist as a product
  decision but nothing counts usage against them yet.
