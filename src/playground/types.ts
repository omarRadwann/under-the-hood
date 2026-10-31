export type PlaygroundMode = "event-loop" | "react" | "cache";
export interface TraceSnapshot {
  frames: { id: number; name: string; status: "running" | "suspended" }[];
  timers: { id: number; label: string; delay: number }[];
  microtasks: string[];
  reactions: string[];
  cache: { key: string; value: string; expiresAt: number; fresh: boolean }[];
  clock: number;
  origin: { key: string; value: string; version: number }[];
}
export interface RuntimeEvent {
  sequence: number;
  kind: string;
  label: string;
  line: number | null;
  time: number;
  detail?: string;
  snapshot?: TraceSnapshot;
}
export interface RuntimePacket {
  channel: "uth-playground";
  runId: string;
  type: "event" | "done" | "error" | "ready";
  event?: RuntimeEvent;
  message?: string;
}
export interface PlaygroundPreset {
  id: string;
  mode: PlaygroundMode;
  name: string;
  description: string;
  concept: string;
  source: string;
}
export const MAX_SOURCE_LENGTH = 40000;
export const MAX_EVENTS = 1200;
export const MAX_RUN_MS = 3500;
