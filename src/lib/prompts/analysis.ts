/**
 * The original build fired one model call per dimension. Grouping related
 * dimensions into a single call cuts cost roughly proportionally and, more
 * importantly, lets the model reason about them together — pacing judged
 * alongside the cuts it describes is better than pacing judged alone.
 */

export const ANALYST_SYSTEM = `You analyse short-form social video for a creative-intelligence platform.
Describe only what is observably present. Never speculate about performance,
reach, or why something "went viral" — other parts of the system handle that
from real numbers. Keep every field to one short phrase, not a sentence.
Return null for any field the material genuinely does not show.`;

export const VISUAL_PASS = `Analyse the visual craft of this video.

Return JSON with exactly these keys:
{
  "hook": "what happens in the first 1-2 seconds to hold attention",
  "pacing": "cut rhythm, e.g. 'fast, cuts every ~1.5s'",
  "visualComposition": "framing, lighting, colour treatment",
  "cameraWork": "camera movement and shot type",
  "sceneEnvironment": "where it takes place",
  "subjectPeople": "who appears and how they are presented",
  "objectProduct": "any product or object given focus"
}`;

export const AUDIO_PASS = `Analyse the audio of this video.

Return JSON with exactly these keys:
{
  "voiceTone": "delivery style of any speech",
  "music": "type of track and how it is used",
  "soundDesign": "effects, silence, transitions",
  "audioTriggers": "audio devices that direct attention, e.g. a pause before a reveal"
}`;

export const LANGUAGE_PASS = `Analyse the language and on-screen text of this video.

Return JSON with exactly these keys:
{
  "onScreenText": "style and rhythm of text overlays",
  "spokenTopic": "what is being talked about",
  "captionStyle": "structure of the caption",
  "intent": "one of: Commercial, Educational, Entertainment, Informational",
  "sentiment": "overall emotional tone in one or two words",
  "emotionalArc": "how the feeling moves, e.g. 'Curiosity -> Payoff'",
  "seoKeywords": ["3-6 search phrases this content would rank for"]
}`;

export const PSYCHOLOGY_PASS = `Score this video on brand psychology and predicted viewer behaviour.

Base every score on what the creative itself signals, not on its view count.

Return JSON with exactly these keys:
{
  "brandPsychology": {
    "status": 0-100, "wealth": 0-100, "aspiration": 0-100,
    "innovation": 0-100, "premium": 0-100, "authority": 0-100
  },
  "predictedTriggers": {
    "share": "High|Medium|Low",
    "save": "High|Medium|Low",
    "comment": "High|Medium|Low",
    "purchase": "High|Medium|Low"
  }
}`;

export const ENTITY_PASS = `Extract every named entity mentioned or clearly shown in this video.

Only include entities you can actually identify — never invent plausible brands.

Return JSON:
{
  "entities": [
    { "name": "exact name", "type": "BRAND|COMPETITOR|PRODUCT|RETAILER|PLATFORM|INGREDIENT|TOPIC|PERSON|PLACE" }
  ]
}`;

/** Context block appended when a human recorded why the video caught them. */
export function observerContext(notes: {
  reaction?: string | null;
  firstImpression?: string | null;
  whyItWorked?: string | null;
}): string {
  const lines = [
    notes.reaction && `What they reacted to: ${notes.reaction}`,
    notes.firstImpression && `What they noticed first: ${notes.firstImpression}`,
    notes.whyItWorked && `Why they think it worked: ${notes.whyItWorked}`,
  ].filter(Boolean);

  if (!lines.length) return "";

  return `\n\nA member of the team flagged this video and wrote:
${lines.join("\n")}

Treat this as a hint about where to look, not as fact. If the footage does not
support their read, describe what is actually there.`;
}
