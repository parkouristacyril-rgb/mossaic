import { db } from "@/lib/db";
import { generateJson, textPart } from "@/lib/providers/gemini";

const IDEA_SYSTEM = `You write shoot-ready short-form video concepts.

Every concept must be built on one of the supplied patterns — mechanisms this
specific brand has already proven. Do not invent creative advice that is not
traceable to a pattern in the list. If the patterns do not suit the brief, say
so by returning fewer ideas rather than padding with generic suggestions.`;

export type IdeaBrief = {
  organizationId: string;
  campaign: string;
  goal: string;
  audience?: string;
  product?: string;
  constraints?: string;
  count?: number;
};

type GeneratedIdea = {
  title: string;
  concept: string;
  hook?: string;
  lengthEstimate?: string;
  predictedLift?: string;
  rationale?: string;
  basedOnPatterns?: string[];
};

export class NoPatternsError extends Error {
  constructor() {
    super(
      "No confirmed patterns yet — analyse more videos before generating ideas.",
    );
    this.name = "NoPatternsError";
  }
}

export async function generateIdeas(brief: IdeaBrief) {
  // Confirmed first, but emerging patterns are allowed in so a young
  // workspace is not locked out of the feature entirely.
  const patterns = await db.pattern.findMany({
    where: { organizationId: brief.organizationId, status: { not: "FADING" } },
    orderBy: [{ status: "asc" }, { confidence: "desc" }],
    take: 12,
  });

  if (!patterns.length) throw new NoPatternsError();

  const count = Math.min(Math.max(brief.count ?? 10, 1), 30);

  const result = await generateJson<{ ideas?: GeneratedIdea[] }>(
    [
      textPart(`Proven patterns for this brand:
${JSON.stringify(
  patterns.map((p) => ({
    name: p.name,
    description: p.description,
    confidence: p.confidence,
    lift: p.performanceLift,
    actions: p.recommendedActions,
  })),
  null,
  1,
)}

Brief:
- Campaign: ${brief.campaign}
- Goal to increase: ${brief.goal}
- Audience: ${brief.audience || "not specified"}
- Product context: ${brief.product || "not specified"}
- Avoid: ${brief.constraints || "nothing specified"}

Write up to ${count} concepts. Return JSON:
{
  "ideas": [
    {
      "title": "concept name in quotes",
      "concept": "2-3 sentences describing the shoot",
      "hook": "what happens in the first second",
      "lengthEstimate": "e.g. ~15s",
      "predictedLift": "e.g. +18%",
      "rationale": "which pattern this leans on and why it fits the brief",
      "basedOnPatterns": ["exact pattern names used"]
    }
  ]
}`),
    ],
    { systemInstruction: IDEA_SYSTEM, temperature: 0.8, maxOutputTokens: 8192 },
  );

  const known = new Set(patterns.map((p) => p.name));

  const batch = await db.ideaBatch.create({
    data: {
      organizationId: brief.organizationId,
      campaign: brief.campaign,
      goal: brief.goal,
      audience: brief.audience,
      product: brief.product,
      constraints: brief.constraints,
      requested: count,
      ideas: {
        create: (result.ideas ?? [])
          .filter((idea) => idea.title && idea.concept)
          .map((idea) => ({
            title: idea.title,
            concept: idea.concept,
            hook: idea.hook,
            lengthEstimate: idea.lengthEstimate,
            predictedLift: idea.predictedLift,
            rationale: idea.rationale,
            // Drop invented pattern names so the audit trail stays honest.
            basedOnPatterns: (idea.basedOnPatterns ?? []).filter((n) => known.has(n)),
          })),
      },
    },
    include: { ideas: true },
  });

  return batch;
}
