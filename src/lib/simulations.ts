export interface LoopFrame {
  line: number;
  stack: string[];
  web: string[];
  micro: string[];
  tasks: string[];
  output: string[];
  title: string;
  detail: string;
}
export const loopCode = [
  "console.log('A');",
  "setTimeout(() => console.log('B'), 0);",
  "Promise.resolve().then(() => {",
  "  console.log('C');",
  "  queueMicrotask(() => console.log('D'));",
  "});",
  "console.log('E');",
];
export const loopFrames: LoopFrame[] = [
  {
    line: -1,
    stack: [],
    web: [],
    micro: [],
    tasks: [],
    output: [],
    title: "Ready to trace",
    detail:
      "A deterministic browser trace. Follow the current script, microtask checkpoint, and eligible timer callback. Rendering timing is intentionally not simulated.",
  },
  {
    line: 0,
    stack: ["global()", "log('A')"],
    web: [],
    micro: [],
    tasks: [],
    output: ["A"],
    title: "Synchronous work runs first",
    detail: "The current script owns the stack. console.log runs immediately and prints A.",
  },
  {
    line: 1,
    stack: ["global()"],
    web: ["timer: B · 0ms minimum"],
    micro: [],
    tasks: [],
    output: ["A"],
    title: "Register the timer",
    detail:
      "setTimeout asks the host to schedule a callback. Zero is a minimum delay; it does not interrupt this script.",
  },
  {
    line: 2,
    stack: ["global()"],
    web: [],
    micro: ["promise reaction: C"],
    tasks: ["timer callback: B"],
    output: ["A"],
    title: "Enqueue the promise reaction",
    detail:
      "The fulfilled promise's then handler enters the microtask queue. We show the timer becoming eligible while the script continues.",
  },
  {
    line: 6,
    stack: ["global()", "log('E')"],
    web: [],
    micro: ["promise reaction: C"],
    tasks: ["timer callback: B"],
    output: ["A", "E"],
    title: "Finish synchronous logging",
    detail:
      "The script prints E before any queued callback runs. Synchronous JavaScript runs to completion.",
  },
  {
    line: -1,
    stack: [],
    web: [],
    micro: ["promise reaction: C"],
    tasks: ["timer callback: B"],
    output: ["A", "E"],
    title: "The stack is empty",
    detail:
      "The current task finishes. The host performs a microtask checkpoint before selecting another task.",
  },
  {
    line: 3,
    stack: ["then callback", "log('C')"],
    web: [],
    micro: [],
    tasks: ["timer callback: B"],
    output: ["A", "E", "C"],
    title: "Run the promise reaction",
    detail:
      "The promise handler runs and prints C. The timer is eligible, but the microtask checkpoint is not finished.",
  },
  {
    line: 4,
    stack: ["then callback"],
    web: [],
    micro: ["queueMicrotask: D"],
    tasks: ["timer callback: B"],
    output: ["A", "E", "C"],
    title: "A microtask adds a microtask",
    detail:
      "queueMicrotask appends D. New microtasks are drained during the same checkpoint, not after the timer.",
  },
  {
    line: 4,
    stack: ["microtask", "log('D')"],
    web: [],
    micro: [],
    tasks: ["timer callback: B"],
    output: ["A", "E", "C", "D"],
    title: "Drain the checkpoint",
    detail:
      "D prints before B. An endless chain here could starve the browser of input and rendering opportunities.",
  },
  {
    line: 1,
    stack: ["timer callback", "log('B')"],
    web: [],
    micro: [],
    tasks: [],
    output: ["A", "E", "C", "D", "B"],
    title: "Run the eligible timer task",
    detail:
      "With the checkpoint drained, the timer callback can run. The final order is A → E → C → D → B.",
  },
  {
    line: -1,
    stack: [],
    web: [],
    micro: [],
    tasks: [],
    output: ["A", "E", "C", "D", "B"],
    title: "Trace complete",
    detail:
      "The ordering follows this snippet's task and microtask dependencies. Actual paint opportunities and timer duration are browser decisions.",
  },
];

export interface CacheState {
  now: number;
  source: number;
  cached: number | null;
  writtenAt: number;
  requests: number;
  hits: number;
  log: string[];
}
export const initialCache: CacheState = {
  now: 0,
  source: 1,
  cached: null,
  writtenAt: 0,
  requests: 0,
  hits: 0,
  log: ["Cache is empty. Read the resource to populate it."],
};
export type CacheAction = "read" | "write" | "invalidate" | "tick" | "reset";
export function cacheTransition(state: CacheState, action: CacheAction, ttl: number): CacheState {
  const log = (message: string) => [message, ...state.log].slice(0, 6);
  if (action === "reset") return initialCache;
  if (action === "tick")
    return { ...state, now: state.now + 5, log: log("Advanced the simulated clock by 5 seconds.") };
  if (action === "write")
    return {
      ...state,
      source: state.source + 1,
      log: log(`Origin changed to v${state.source + 1}. Cache was not invalidated.`),
    };
  if (action === "invalidate")
    return {
      ...state,
      cached: null,
      log: log("Invalidated this cache entry. Next read goes to origin."),
    };
  const fresh = state.cached !== null && state.now - state.writtenAt < ttl;
  return {
    ...state,
    requests: state.requests + 1,
    hits: state.hits + (fresh ? 1 : 0),
    cached: fresh ? state.cached : state.source,
    writtenAt: fresh ? state.writtenAt : state.now,
    log: log(
      fresh
        ? `HIT: served v${state.cached}. ${state.cached === state.source ? "Matches origin." : "Origin has a newer version."}`
        : `MISS: loaded origin v${state.source}; TTL starts at t=${state.now}s.`,
    ),
  };
}

export const lifecycle = [
  {
    title: "Trigger",
    body: "Mount or a state update schedules work. The current event handler still sees its render snapshot.",
  },
  {
    title: "Render",
    body: "React calls components and computes a candidate tree. Work must be pure and can be restarted or discarded.",
  },
  {
    title: "Reconcile",
    body: "Reconciliation is part of render work: match type, position, and keys while computing the candidate. These inspection cards separate concerns, not two globally sequential passes.",
  },
  {
    title: "Commit",
    body: "Commit the selected work. Relevant old layout effects clean up during commit mutation work; host changes and ref work have their own ordering. A render need not produce DOM mutations.",
  },
  {
    title: "Layout effects",
    body: "Run relevant new layout-effect setups and measurements after DOM mutations, before browser paint. Their old cleanups belong to commit mutation work. Synchronous work here blocks painting.",
  },
  {
    title: "Passive effects",
    body: "Synchronize external systems, cleaning up the previous changed effect first. Exact paint-relative timing is not guaranteed.",
  },
];

export interface UploadMachine {
  status: "idle" | "uploading" | "success" | "failed" | "cancelled";
  activeId: number | null;
  nextId: number;
  log: string[];
}
export type UploadEvent =
  | { type: "start" }
  | { type: "cancel" }
  | { type: "success" | "fail"; id: number }
  | { type: "reset" };
export const initialUpload: UploadMachine = {
  status: "idle",
  activeId: null,
  nextId: 1,
  log: ["Idle. Start an operation to create its identity."],
};
export function uploadTransition(state: UploadMachine, event: UploadEvent): UploadMachine {
  const log = (value: string) => [value, ...state.log].slice(0, 7);
  if (event.type === "reset") return initialUpload;
  if (event.type === "start") {
    if (state.status === "uploading")
      return { ...state, log: log("Rejected START: an operation is already active.") };
    return {
      ...state,
      status: "uploading",
      activeId: state.nextId,
      nextId: state.nextId + 1,
      log: log(`START #${state.nextId}: entered uploading.`),
    };
  }
  if (event.type === "cancel") {
    if (state.status !== "uploading")
      return { ...state, log: log("Ignored CANCEL: no active upload.") };
    return {
      ...state,
      status: "cancelled",
      activeId: null,
      log: log(`CANCEL #${state.activeId}: intent ended; remote work may continue.`),
    };
  }
  if (state.status !== "uploading" || state.activeId !== event.id)
    return {
      ...state,
      log: log(`Ignored ${event.type.toUpperCase()} #${event.id}: not the active operation.`),
    };
  return {
    ...state,
    status: event.type === "success" ? "success" : "failed",
    activeId: null,
    log: log(`${event.type.toUpperCase()} #${event.id}: accepted current completion.`),
  };
}
