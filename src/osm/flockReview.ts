// Client helpers for the held-Flock review pipeline (talks to the same-origin Pages
// Functions /flock-submit and /flock-queue). Flock adds are held for admin approval
// instead of being written straight to OSM.
import type { SubmitDraft } from './types';
import { getToken } from './auth';
import { buildNodeTags } from './tags';

export interface FlockSubmission {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  lat: number;
  lon: number;
  submitter?: string;
  source?: string;
  description?: string;
  draft?: SubmitDraft;
  tags?: Record<string, string>;
  reviewedBy?: string;
  reviewedAt?: string;
  osmNodeId?: number;
}

const sourceText = (d: SubmitDraft): string => (d.source.kind === 'none' ? '' : d.source.value);

/** Submit a Flock-tagged add for review — nothing is written to OSM. */
export async function postFlockReview(draft: SubmitDraft, lat: number, lon: number, submitter: string | null): Promise<void> {
  const res = await fetch('/flock-submit', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      lat, lon, draft, tags: buildNodeTags(draft),
      source: sourceText(draft), description: draft.description, submitter: submitter || '',
    }),
  });
  if (!res.ok) throw new Error(`Submission failed (${res.status})`);
}

export async function fetchFlockQueue(): Promise<{ admin: string; items: FlockSubmission[] }> {
  const res = await fetch('/flock-queue', { headers: { authorization: `Bearer ${getToken() || ''}` } });
  if (res.status === 403) throw new Error('forbidden');
  if (!res.ok) throw new Error(`Queue load failed (${res.status})`);
  return res.json();
}

export async function setFlockStatus(id: string, status: 'approved' | 'rejected', osmNodeId?: number): Promise<void> {
  const res = await fetch('/flock-queue', {
    method: 'POST',
    headers: { authorization: `Bearer ${getToken() || ''}`, 'content-type': 'application/json' },
    body: JSON.stringify({ id, status, osmNodeId }),
  });
  if (!res.ok) throw new Error(`Update failed (${res.status})`);
}
