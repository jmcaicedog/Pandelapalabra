export async function withTimeout<T>(promise: Promise<T>, milliseconds = 15000): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Tiempo de espera agotado; no se pudo confirmar la operación.')), milliseconds);
  });
  try { return await Promise.race([promise, timeout]); }
  finally { clearTimeout(timer!); }
}

export async function withAbortTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  milliseconds: number,
  externalSignal?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (externalSignal?.aborted) abort();
  else externalSignal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, milliseconds);
  try { return await operation(controller.signal); }
  finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener('abort', abort);
  }
}
