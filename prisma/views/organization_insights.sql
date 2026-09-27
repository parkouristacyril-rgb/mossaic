-- Per-organization insights rollup.
--
-- One row per organization holding the headline metrics the Insights dashboard
-- renders. Each source table is aggregated in its own LATERAL subquery so the
-- joins never fan out (aggregating several one-to-many tables in a single
-- flat join would multiply the row counts and skew the averages).
--
-- Counts are cast to int and averages to float so Prisma's $queryRaw returns
-- plain JS numbers rather than BigInt / Decimal. An organization with no related
-- rows still yields a row here (all zeros; averages null), because each LATERAL
-- aggregate returns exactly one row.
--
-- Managed outside `prisma db push` (Prisma does not create view bodies). Recreate
-- with `npm run db:view` after changing it or provisioning a fresh database.

CREATE OR REPLACE VIEW "OrganizationInsights" AS
SELECT
  o.id                       AS "organizationId",
  o.name                     AS "organizationName",
  o."createdAt"              AS "organizationCreatedAt",

  vids."videoCount",
  vids."analyzedVideoCount",
  vids."processingVideoCount",

  obs."observationCount",
  obs."observationsLast7d",
  obs."observationsLast30d",
  obs."lastObservationAt",

  pats."patternCount",
  pats."confirmedPatternCount",
  pats."emergingPatternCount",
  pats."fadingPatternCount",
  pats."avgConfidence",
  pats."avgPerformanceLift",

  ents."entityCount",

  ideas."ideaBatchCount",
  ideas."ideaCount",

  mem."memberCount"
FROM "Organization" o
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::int                                                   AS "videoCount",
    COUNT(*) FILTER (WHERE v.status = 'ANALYZED')::int              AS "analyzedVideoCount",
    COUNT(*) FILTER (WHERE v.status IN ('PENDING', 'PROCESSING'))::int AS "processingVideoCount"
  FROM "Video" v
  WHERE v."organizationId" = o.id
) vids ON true
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::int                                                        AS "observationCount",
    COUNT(*) FILTER (WHERE ob."createdAt" >= now() - interval '7 days')::int  AS "observationsLast7d",
    COUNT(*) FILTER (WHERE ob."createdAt" >= now() - interval '30 days')::int AS "observationsLast30d",
    MAX(ob."createdAt")                                                  AS "lastObservationAt"
  FROM "Observation" ob
  WHERE ob."organizationId" = o.id
) obs ON true
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::int                                          AS "patternCount",
    COUNT(*) FILTER (WHERE p.status = 'CONFIRMED')::int     AS "confirmedPatternCount",
    COUNT(*) FILTER (WHERE p.status = 'EMERGING')::int      AS "emergingPatternCount",
    COUNT(*) FILTER (WHERE p.status = 'FADING')::int        AS "fadingPatternCount",
    AVG(p.confidence)::float                                AS "avgConfidence",
    AVG(p."performanceLift")::float                         AS "avgPerformanceLift"
  FROM "Pattern" p
  WHERE p."organizationId" = o.id
) pats ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*)::int AS "entityCount"
  FROM "Entity" e
  WHERE e."organizationId" = o.id
) ents ON true
LEFT JOIN LATERAL (
  SELECT
    COUNT(DISTINCT ib.id)::int AS "ideaBatchCount",
    COUNT(vi.id)::int          AS "ideaCount"
  FROM "IdeaBatch" ib
  LEFT JOIN "VideoIdea" vi ON vi."batchId" = ib.id
  WHERE ib."organizationId" = o.id
) ideas ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*)::int AS "memberCount"
  FROM "Member" m
  WHERE m."organizationId" = o.id
) mem ON true;
