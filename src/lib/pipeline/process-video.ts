import { db } from "@/lib/db";
import { fetchMedia, scrapeVideo, type ScrapedVideo } from "@/lib/providers/apify";
import { generateJson, mediaPart, textPart } from "@/lib/providers/gemini";
import {
  ANALYST_SYSTEM,
  AUDIO_PASS,
  ENTITY_PASS,
  LANGUAGE_PASS,
  PSYCHOLOGY_PASS,
  VISUAL_PASS,
  observerContext,
} from "@/lib/prompts/analysis";
import { checkReadiness, computeScores } from "./scoring";
import type { EntityType } from "@prisma/client";

type VisualResult = {
  hook?: string; pacing?: string; visualComposition?: string; cameraWork?: string;
  sceneEnvironment?: string; subjectPeople?: string; objectProduct?: string;
};
type AudioResult = {
  voiceTone?: string; music?: string; soundDesign?: string; audioTriggers?: string;
};
type LanguageResult = {
  onScreenText?: string; spokenTopic?: string; captionStyle?: string;
  intent?: string; sentiment?: string; emotionalArc?: string; seoKeywords?: string[];
};
type PsychologyResult = {
  brandPsychology?: Record<string, number>;
  predictedTriggers?: Record<string, string>;
};
type EntityResult = { entities?: Array<{ name: string; type: string }> };

const VALID_ENTITY_TYPES = new Set<string>([
  "BRAND", "COMPETITOR", "PRODUCT", "RETAILER", "PLATFORM",
  "INGREDIENT", "TOPIC", "PERSON", "PLACE",
]);

/**
 * Runs the full analysis for one video and persists everything.
 *
 * Deliberately idempotent at the record level: re-running it on an already
 * analyzed video refreshes the analysis and appends a new performance
 * snapshot rather than duplicating the video.
 */
export async function processVideo(videoId: string): Promise<void> {
  const video = await db.video.findUnique({
    where: { id: videoId },
    include: {
      observations: { orderBy: { createdAt: "asc" }, take: 5 },
    },
  });
  if (!video) throw new Error(`Video ${videoId} not found`);

  await db.video.update({
    where: { id: videoId },
    data: { status: "PROCESSING", statusNote: null },
  });

  try {
    const stats = await scrapeVideo(video.url, video.platform);
    const readiness = checkReadiness(stats);

    // The snapshot is appended whether or not it is complete — an incomplete
    // pull is still evidence of what the numbers looked like at this moment.
    await db.performanceSnapshot.create({
      data: {
        videoId,
        playCount: stats.playCount,
        diggCount: stats.diggCount,
        commentCount: stats.commentCount,
        shareCount: stats.shareCount,
        collectCount: stats.collectCount,
        authorFans: stats.authorFans,
        complete: readiness.complete,
      },
    });

    await db.video.update({
      where: { id: videoId },
      data: {
        externalId: stats.externalId ?? video.externalId,
        creatorHandle: stats.creatorHandle ?? video.creatorHandle,
        creatorFollowers: stats.creatorFollowers ?? video.creatorFollowers,
        caption: stats.caption ?? video.caption,
        durationSeconds: stats.durationSeconds ?? video.durationSeconds,
      },
    });

    await runAnalysis(videoId, video.organizationId, stats, video.observations);

    if (readiness.complete) {
      const scores = computeScores(stats);
      await db.videoScore.upsert({
        where: { videoId },
        create: { videoId, ...scores },
        update: { ...scores, computedAt: new Date() },
      });
    }

    await db.video.update({
      where: { id: videoId },
      data: {
        status: readiness.complete ? "ANALYZED" : "AWAITING_DATA",
        statusNote: readiness.complete
          ? null
          : `Waiting on: ${readiness.missing.join(", ")}`,
        analyzedAt: new Date(),
      },
    });
  } catch (error) {
    await db.video.update({
      where: { id: videoId },
      data: {
        status: "FAILED",
        statusNote: error instanceof Error ? error.message.slice(0, 500) : "Unknown error",
      },
    });
    throw error;
  }
}

async function runAnalysis(
  videoId: string,
  organizationId: string,
  stats: ScrapedVideo,
  observations: Array<{
    reaction: string | null;
    firstImpression: string | null;
    whyItWorked: string | null;
  }>,
): Promise<void> {
  const context = observations.length ? observerContext(observations[0]) : "";

  // Multimodal where possible; caption-only analysis where the media file
  // could not be fetched, which still yields usable language-level signal.
  const media = stats.mediaUrl
    ? mediaPart(await fetchMedia(stats.mediaUrl), "video/mp4")
    : null;

  const withMedia = (prompt: string) =>
    media
      ? [media, textPart(prompt + context)]
      : [textPart(`${prompt}${context}\n\nOnly the caption is available: ${stats.caption ?? "(none)"}`)];

  // Run the passes concurrently — they are independent, and serialising them
  // would make a single video take four round trips instead of one.
  const [visual, audio, language, psychology, entities] = await Promise.all([
    generateJson<VisualResult>(withMedia(VISUAL_PASS), { systemInstruction: ANALYST_SYSTEM }),
    generateJson<AudioResult>(withMedia(AUDIO_PASS), { systemInstruction: ANALYST_SYSTEM }),
    generateJson<LanguageResult>(withMedia(LANGUAGE_PASS), { systemInstruction: ANALYST_SYSTEM }),
    generateJson<PsychologyResult>(withMedia(PSYCHOLOGY_PASS), { systemInstruction: ANALYST_SYSTEM }),
    generateJson<EntityResult>(withMedia(ENTITY_PASS), { systemInstruction: ANALYST_SYSTEM }),
  ]);

  const data = {
    hook: visual.hook ?? null,
    pacing: visual.pacing ?? null,
    visualComposition: visual.visualComposition ?? null,
    cameraWork: visual.cameraWork ?? null,
    sceneEnvironment: visual.sceneEnvironment ?? null,
    subjectPeople: visual.subjectPeople ?? null,
    objectProduct: visual.objectProduct ?? null,
    voiceTone: audio.voiceTone ?? null,
    music: audio.music ?? null,
    soundDesign: audio.soundDesign ?? null,
    audioTriggers: audio.audioTriggers ?? null,
    onScreenText: language.onScreenText ?? null,
    spokenTopic: language.spokenTopic ?? null,
    captionStyle: language.captionStyle ?? null,
    intent: language.intent ?? null,
    sentiment: language.sentiment ?? null,
    emotionalArc: language.emotionalArc ?? null,
    seoKeywords: language.seoKeywords ?? [],
    brandPsychology: psychology.brandPsychology ?? undefined,
    predictedTriggers: psychology.predictedTriggers ?? undefined,
    raw: { visual, audio, language, psychology, entities },
  };

  await db.videoAnalysis.upsert({
    where: { videoId },
    create: { videoId, ...data },
    update: data,
  });

  await linkEntities(videoId, organizationId, entities.entities ?? []);
}

/**
 * Entities are shared across the organization, so the same brand mentioned in
 * 200 videos is one row with 200 links — that is what makes "which competitors
 * show up alongside our best work" a cheap question to answer.
 */
async function linkEntities(
  videoId: string,
  organizationId: string,
  found: Array<{ name: string; type: string }>,
): Promise<void> {
  for (const item of found) {
    const name = item.name?.trim();
    if (!name) continue;

    const type = (VALID_ENTITY_TYPES.has(item.type) ? item.type : "TOPIC") as EntityType;

    const entity = await db.entity.upsert({
      where: { organizationId_name: { organizationId, name } },
      create: { organizationId, name, type },
      update: {},
    });

    await db.videoEntity.upsert({
      where: { videoId_entityId: { videoId, entityId: entity.id } },
      create: { videoId, entityId: entity.id, mentions: 1 },
      update: { mentions: { increment: 1 } },
    });
  }
}
