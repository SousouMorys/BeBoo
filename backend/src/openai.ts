import OpenAI from 'openai';

let client: OpenAI | undefined;

/** Lazily creates the server-only client so pure validation tests need no key. */
export function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required before starting generation.');
  }

  // Keep retry ownership in modelRetry.ts. The SDK defaults can otherwise keep a
  // child-facing progress screen in one stage for many minutes before our retry
  // policy gets a chance to record a failure.
  client ??= new OpenAI({ apiKey, maxRetries: 0, timeout: 90_000 });
  return client;
}
