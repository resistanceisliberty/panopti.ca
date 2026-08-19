// Client helpers for anonymous node reports (same-origin Pages Functions /node-report and
// /node-report-queue). Anyone — logged in or not — can report a problematic node; the admin
// reviews them in /admin/reports. Kept separate from the killswitch "flag" (osm/flag.ts).
import { getToken } from './auth';

export type ReportReason = 'nonexistent' | 'location' | 'type' | 'brand' | 'duplicate' | 'other';

export interface NodeReport {
  id: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  osmType: 'node' | 'way';
  osmId: number;
  lat: number;
  lon: number;
  reason: ReportReason;
  note?: string;
  brand?: string;
  operator?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface NodeReportInput {
  osmType: 'node' | 'way';
  osmId: number;
  lat: number;
  lon: number;
  reason: ReportReason;
  note?: string;
  brand?: string;
  operator?: string;
}

export async function postNodeReport(input: NodeReportInput): Promise<void> {
  const res = await fetch('/node-report', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Report failed (${res.status})`);
}

export async function fetchReportQueue(): Promise<{ admin: string; items: NodeReport[] }> {
  const res = await fetch('/node-report-queue', { headers: { authorization: `Bearer ${getToken() || ''}` } });
  if (res.status === 403) throw new Error('forbidden');
  if (!res.ok) throw new Error(`Queue load failed (${res.status})`);
  return res.json();
}

export async function setReportStatus(id: string, status: 'resolved' | 'dismissed'): Promise<void> {
  const res = await fetch('/node-report-queue', {
    method: 'POST',
    headers: { authorization: `Bearer ${getToken() || ''}`, 'content-type': 'application/json' },
    body: JSON.stringify({ id, status }),
  });
  if (!res.ok) throw new Error(`Update failed (${res.status})`);
}
