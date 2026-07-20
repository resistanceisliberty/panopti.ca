// Runtime killswitch client: fetch the submission flag at load + poll, so a KV flip
// disables the tool within seconds without a redeploy. Fails open (enabled) on any error.

const FLAG_URL = import.meta.env.VITE_SUBMIT_FLAG_URL ?? '/submit-flag';
const POLL_MS = 30_000;

export async function fetchSubmitFlag(): Promise<boolean> {
  try {
    const res = await fetch(FLAG_URL, { cache: 'no-store' });
    if (!res.ok) return true;
    const json = await res.json();
    return json.enabled !== false; // enabled unless explicitly false
  } catch {
    return true;
  }
}

// Poll the flag; calls onChange with each result. Refetches on tab focus. Returns cleanup.
export function startSubmitFlagPolling(onChange: (enabled: boolean) => void): () => void {
  let stopped = false;
  const tick = async () => {
    const enabled = await fetchSubmitFlag();
    if (!stopped) onChange(enabled);
  };
  void tick();
  const id = setInterval(() => void tick(), POLL_MS);
  const onVisible = () => { if (document.visibilityState === 'visible') void tick(); };
  document.addEventListener('visibilitychange', onVisible);
  return () => {
    stopped = true;
    clearInterval(id);
    document.removeEventListener('visibilitychange', onVisible);
  };
}
