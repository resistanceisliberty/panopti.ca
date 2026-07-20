export type OsmTags = Record<string, string>;

export interface OsmNode {
  id: number;
  version: number;
  lat: number;
  lon: number;
  tags: OsmTags;
}

export type ManufacturerChoice =
  | { kind: 'none' }
  | { kind: 'known'; manufacturer: string; wikidata?: string }
  | { kind: 'custom'; manufacturer: string; wikidata?: string };

export type SourceChoice =
  | { kind: 'none' }
  | { kind: 'preset'; value: string }
  | { kind: 'url'; value: string }
  | { kind: 'other'; value: string };

export interface SubmitDraft {
  deviceType: 'alpr' | 'cctv';
  manufacturer: ManufacturerChoice;
  operator: string;
  operatorWikidata: string;
  directions: string[];
  cameraMount: string;
  source: SourceChoice;
  description: string;
  extraTags: OsmTags;
}
