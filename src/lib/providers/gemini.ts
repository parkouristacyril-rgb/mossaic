import { env } from "@/lib/env";

const BASE = "https://generativelanguage.googleapis.com/v1beta";

export class GeminiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "GeminiError";
  }
}

type GeneratePart = { text: string } | { inlineData: { mimeType: string; data: string } };

type GenerateOptions = {
  /** Keeps analysis reproducible; creative generation overrides this upward. */
  temperature?: number;
  maxOutputTokens?: number;
  systemInstruction?: string;
};

/**
 * Every analysis call asks for JSON. Without responseMimeType the model
 * happily returns one long prose paragraph, which then has to be parsed by
 * hand — the failure mode that made the original Make.com build brittle.
 */
export async function generateJson<T>(
  parts: GeneratePart[],
  options: GenerateOptions = {},
): Promise<T> {
  const body = {
    contents: [{ role: "user", parts }],
    ...(options.systemInstruction
      ? { systemInstruction: { parts: [{ text: options.systemInstruction }] } }
      : {}),
    generationConfig: {
      responseMimeType: "application/json",
      temperature: options.temperature ?? 0.2,
      maxOutputTokens: options.maxOutputTokens ?? 4096,
    },
  };

  const text = await callWithRetry(body);

  try {
    return JSON.parse(text) as T;
  } catch {
    // JSON mode very occasionally wraps output in a fence despite the mime type.
    const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    try {
      return JSON.parse(cleaned) as T;
    } catch {
      throw new GeminiError(`Model did not return valid JSON: ${text.slice(0, 300)}`);
    }
  }
}

async function callWithRetry(body: unknown, attempt = 1): Promise<string> {
  const url = `${BASE}/models/${env.geminiModel}:generateContent?key=${env.geminiApiKey}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (cause) {
    if (attempt < 3) return retry(body, attempt);
    throw new GeminiError(`Network error calling Gemini: ${String(cause)}`);
  }

  // 429 and 5xx are transient; 4xx means the request itself is wrong.
  if (res.status === 429 || res.status >= 500) {
    if (attempt < 3) return retry(body, attempt);
    throw new GeminiError(await res.text(), res.status);
  }
  if (!res.ok) {
    throw new GeminiError(await res.text(), res.status);
  }

  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
  if (!text) throw new GeminiError("Gemini returned an empty response");
  return text;
}

function retry(body: unknown, attempt: number): Promise<string> {
  const backoffMs = 500 * 2 ** (attempt - 1);
  return new Promise((resolve) =>
    setTimeout(() => resolve(callWithRetry(body, attempt + 1)), backoffMs),
  );
}

/** Wraps a fetched media file for multimodal analysis. */
export function mediaPart(buffer: ArrayBuffer, mimeType: string): GeneratePart {
  return {
    inlineData: { mimeType, data: Buffer.from(buffer).toString("base64") },
  };
}

export function textPart(text: string): GeneratePart {
  return { text };
}
