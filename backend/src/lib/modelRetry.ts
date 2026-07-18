const retryDelayMs = 2_000;

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Retries one transient model call once without surfacing model details to clients. */
export async function withModelRetry<T>(label: string, call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (firstError) {
    console.warn(`[model] ${label} failed; retrying once: ${message(firstError)}`);
    await new Promise<void>((resolve) => setTimeout(resolve, retryDelayMs));
    return call();
  }
}

export function errorMessage(error: unknown): string {
  return message(error);
}
