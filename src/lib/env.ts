/**
 * Fail loudly at boot rather than three steps into a paid pipeline run.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

export const env = {
  get databaseUrl() {
    return required("DATABASE_URL");
  },
  get geminiApiKey() {
    return required("GEMINI_API_KEY");
  },
  get geminiModel() {
    return optional("GEMINI_MODEL", "gemini-2.0-flash");
  },
  get apifyToken() {
    return required("APIFY_TOKEN");
  },
  get apifyTiktokActor() {
    return optional("APIFY_TIKTOK_ACTOR", "clockworks~tiktok-scraper");
  },
  get apifyInstagramActor() {
    return optional("APIFY_INSTAGRAM_ACTOR", "apify~instagram-reel-scraper");
  },
  get jobSecret() {
    return required("JOB_SECRET");
  },
};
