import { create } from 'zustand';
import type { OsmNode, OsmTags, SubmitDraft } from '../osm/types';

export function emptyDraft(deviceType: SubmitDraft['deviceType'] = 'alpr'): SubmitDraft {
  return {
    deviceType,
    manufacturer: { kind: 'none' },
    operator: '', operatorWikidata: '',
    directions: [], cameraMount: '',
    source: { kind: 'none' }, description: '', extraTags: {},
  };
}

interface SubmitState {
  mode: 'idle' | 'add' | 'edit';
  user: string | null;
  draft: SubmitDraft;
  point: { lat: number; lon: number } | null;
  editNode: OsmNode | null;
  busy: boolean;
  error: string | null;
  setUser: (u: string | null) => void;
  startAdd: () => void;
  startEdit: (node: OsmNode, draft: SubmitDraft) => void;
  cancel: () => void;
  setPoint: (p: { lat: number; lon: number } | null) => void;
  patchDraft: (patch: Partial<SubmitDraft>) => void;
  setExtraTags: (tags: OsmTags) => void;
  setBusy: (b: boolean) => void;
  setError: (e: string | null) => void;
}

export const useSubmitStore = create<SubmitState>((set) => ({
  mode: 'idle',
  user: null,
  draft: emptyDraft(),
  point: null,
  editNode: null,
  busy: false,
  error: null,
  setUser: (user) => set({ user }),
  startAdd: () => set({ mode: 'add', draft: emptyDraft(), point: null, editNode: null, error: null }),
  startEdit: (editNode, draft) => set({ mode: 'edit', editNode, draft, point: { lat: editNode.lat, lon: editNode.lon }, error: null }),
  cancel: () => set({ mode: 'idle', point: null, editNode: null, error: null, busy: false }),
  setPoint: (point) => set({ point }),
  patchDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
  setExtraTags: (extraTags) => set((s) => ({ draft: { ...s.draft, extraTags } })),
  setBusy: (busy) => set({ busy }),
  setError: (error) => set({ error }),
}));
