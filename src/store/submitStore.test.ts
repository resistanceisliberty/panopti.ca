import { it, expect, beforeEach } from 'vitest';
import { useSubmitStore } from './submitStore';

beforeEach(() => useSubmitStore.getState().cancel());

it('startAdd sets add mode with an empty ALPR draft and no point', () => {
  useSubmitStore.getState().startAdd();
  const s = useSubmitStore.getState();
  expect(s.mode).toBe('add');
  expect(s.point).toBeNull();
  expect(s.draft.deviceType).toBe('alpr');
  expect(s.draft.description).toBe('');
});

it('cancel resets to idle and clears point/editNode', () => {
  const st = useSubmitStore.getState();
  st.startAdd();
  st.setPoint({ lat: 1, lon: 2 });
  st.cancel();
  const s = useSubmitStore.getState();
  expect(s.mode).toBe('idle');
  expect(s.point).toBeNull();
  expect(s.editNode).toBeNull();
});

it('patchDraft merges partial fields', () => {
  const st = useSubmitStore.getState();
  st.startAdd();
  st.patchDraft({ operator: 'City of Toronto' });
  expect(useSubmitStore.getState().draft.operator).toBe('City of Toronto');
});
