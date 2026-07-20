import OpenAI from 'openai';

let client: OpenAI | undefined;

/** Lazily creates the server-only client so pure validation tests need no key. */
export function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required before starting generation.');
  }

  // Keep retry ownership in modelRetry.ts. Three minutes leaves room for a
  // documented high-quality image request while keeping a bounded stage before
  // our retry policy records a failure.
  client ??= new OpenAI({ apiKey, maxRetries: 0, timeout: 180_000 });
  return client;
}
