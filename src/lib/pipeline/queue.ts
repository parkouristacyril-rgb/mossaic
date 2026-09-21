import { processVideo } from "./process-video";

/**
 * Analysis takes tens of seconds and costs money, so it must never run inside
 * the request that submitted the observation — the phone would sit spinning on
 * a share sheet.
 *
 * This is deliberately a thin seam. Today it fires the work off in the
 * background of the same process, which is fine up to a few hundred videos a
 * day. When that stops being enough, swap the body for a real queue push
 * (QStash, BullMQ, SQS) and nothing that calls it has to change.
 */
export async function enqueueVideoProcessing(videoId: string): Promise<void> {
  void processVideo(videoId).catch((error) => {
    // processVideo already recorded FAILED status on the row; this is only so
    // the reason reaches the server logs too.
    console.error(`[pipeline] video ${videoId} failed:`, error);
  });
}
