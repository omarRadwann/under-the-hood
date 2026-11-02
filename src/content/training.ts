import { problemSolving } from "./problem-solving";

export interface Exercise {
  id: string;
  title: string;
  domain: "JavaScript" | "Async" | "React contracts" | "Caching" | "Problem solving";
  difficulty: "Precision" | "Concurrency" | "Systems";
  brief: string;
  contract: string;
  prediction: string;
  hint: string;
  reasoning: string;
  starter: string;
  solution: string;
  lessons: string[];
  checks: { name: string; body: string }[];
}
export const exercises: Exercise[] = [
  {
    id: "presence-before-coercion",
    title: "Preserve zero at the parsing boundary",
    domain: "JavaScript",
    difficulty: "Precision",
    brief:
      "A pagination parser silently replaces a valid zero and accepts malformed input. Repair the boundary before the value enters application state.",
    contract:
      "readCount(input, fallback): null/undefined use fallback; digit-only strings become safe non-negative integers; every other supplied value throws RangeError. Empty/blank strings are invalid.",
    prediction:
      "Which inputs does Number(input) || fallback conflate? Write down zero, absence, blank input, and an unsafe integer before running.",
    hint: "Decide presence and lexical validity before converting. Numeric conversion alone is not a domain validator.",
    reasoning:
      "Truthiness cannot distinguish a valid zero from absence. A lexical check specifies accepted syntax; a safe-integer check protects the numeric representation. Validate fallback at its own configuration boundary.",
    starter: "function readCount(input, fallback) {\n  return Number(input) || fallback;\n}",
    solution:
      "function readCount(input, fallback) {\n  if (input === null || input === undefined) return fallback;\n  if (typeof input !== 'string' || !/^\\d+$/.test(input)) throw new RangeError('Expected digits');\n  const value = Number(input);\n  if (!Number.isSafeInteger(value)) throw new RangeError('Unsafe count');\n  return value;\n}",
    lessons: ["coercion-algorithms", "numbers-and-bigint", "typescript-boundaries"],
    checks: [
      {
        name: "Zero is a present value",
        body: "assert(readCount('0', 10) === 0, 'Expected 0, not fallback');",
      },
      {
        name: "Only absence uses fallback",
        body: "assert(readCount(null, 10) === 10 && readCount(undefined, 10) === 10 && readCount('12', 10) === 12);",
      },
      {
        name: "Malformed input is rejected",
        body: "for (const input of ['', ' ', '-1', '1e2', '2.5', false]) { let rejected = false; try { readCount(input, 10); } catch (e) { rejected = e instanceof RangeError; } assert(rejected, 'Must reject ' + JSON.stringify(input)); }",
      },
      {
        name: "Unsafe integer is rejected",
        body: "let rejected = false; try { readCount('9007199254740993', 10); } catch (e) { rejected = e instanceof RangeError; } assert(rejected);",
      },
    ],
  },
  {
    id: "collection-identity",
    title: "Group by identity without prototype traps",
    domain: "JavaScript",
    difficulty: "Precision",
    brief:
      "A grouping helper coerces keys into object properties. Repair it for arbitrary keys and caller-owned values.",
    contract:
      "group(items, keyOf) returns a Map, preserves key identity and insertion order, and keeps original item references without mutating input.",
    prediction: "What happens when the two keys are distinct objects, or the key is '__proto__'?",
    hint: "Choose a collection whose equality contract matches the domain. Property names are not arbitrary identity keys.",
    reasoning:
      "Map preserves object identity and SameValueZero key semantics. The groups own their arrays while the input items retain identity. Choosing a collection is part of API correctness.",
    starter:
      "function group(items, keyOf) {\n  const result = {};\n  for (const item of items) (result[keyOf(item)] ??= []).push(item);\n  return result;\n}",
    solution:
      "function group(items, keyOf) {\n  const result = new Map();\n  for (const item of items) {\n    const key = keyOf(item);\n    if (!result.has(key)) result.set(key, []);\n    result.get(key).push(item);\n  }\n  return result;\n}",
    lessons: ["keyed-collections", "objects-and-enumeration", "language-security-boundaries"],
    checks: [
      {
        name: "Distinct object keys stay distinct",
        body: "const a = {}, b = {}; const result = group([{ key: a }, { key: b }], x => x.key); assert(result instanceof Map && result.size === 2);",
      },
      {
        name: "Prototype-shaped keys are ordinary keys",
        body: "const result = group(['__proto__', 'constructor'], x => x); assert(result.get('__proto__')[0] === '__proto__' && result.size === 2);",
      },
      {
        name: "References and group order survive",
        body: "const a = { k: 'x' }, b = { k: 'y' }, c = { k: 'x' }; const input = [a,b,c]; const result = group(input, x => x.k); assert(result.get('x')[0] === a && result.get('x')[1] === c && [...result.keys()].join() === 'x,y' && input.length === 3);",
      },
    ],
  },
  {
    id: "iterator-ownership",
    title: "Close an early-terminated producer",
    domain: "JavaScript",
    difficulty: "Precision",
    brief:
      "A lazy take helper reads too far and abandons its producer. Preserve demand and cleanup.",
    contract:
      "take(iterable, limit) is a lazy generator. A non-negative integer limit bounds consumption exactly. Zero never advances the source; invalid limits throw on iteration; early exit closes the underlying iterator when supported.",
    prediction:
      "Will checking the limit after calling next consume one extra item? What cleanup should happen when the consumer breaks?",
    hint: "A for-of loop inside a generator can carry iterator-close semantics through return/finally.",
    reasoning:
      "Demand and ownership are distinct: producing the requested values is insufficient if another value is consumed or the source's finally never executes. A zero limit must return before source advancement.",
    starter:
      "function* take(iterable, limit) {\n  const iterator = iterable[Symbol.iterator]();\n  for (let i = 0; i <= limit; i++) {\n    const item = iterator.next();\n    if (item.done) return;\n    if (i < limit) yield item.value;\n  }\n}",
    solution:
      "function* take(iterable, limit) {\n  if (!Number.isInteger(limit) || limit < 0) throw new RangeError('Invalid limit');\n  if (limit === 0) return;\n  let count = 0;\n  for (const value of iterable) {\n    yield value;\n    if (++count === limit) return;\n  }\n}",
    lessons: ["iterators-and-generators", "resource-ownership"],
    checks: [
      {
        name: "Exact demand and producer cleanup",
        body: "let produced = 0, closed = false; function* source() { try { for(let i=0;i<10;i++){produced++;yield i;} } finally { closed=true; } } assert([...take(source(), 3)].join() === '0,1,2'); assert(produced === 3 && closed, 'Read too far or did not close');",
      },
      {
        name: "Zero consumes nothing",
        body: "let count = 0; function* source(){ count++; yield 1; } assert([...take(source(), 0)].length === 0 && count === 0);",
      },
      {
        name: "Consumer break releases the producer",
        body: "let closed = false; function* source(){ try { yield 1; yield 2; } finally { closed=true; } } for(const value of take(source(), 5)) break; assert(closed);",
      },
      {
        name: "Invalid demand is rejected",
        body: "let rejected = false; try { [...take([1], -1)]; } catch(e){rejected=e instanceof RangeError;} assert(rejected);",
      },
    ],
  },
  {
    id: "bounded-admission",
    title: "Bound initiation, not observation",
    domain: "Async",
    difficulty: "Concurrency",
    brief:
      "A job runner eagerly starts everything. Keep at most limit tasks active and preserve input-order outcomes.",
    contract:
      "runPool(taskFunctions, limit) validates a positive integer limit and returns allSettled-style outcomes in input order. One rejection does not prevent other queued tasks from running.",
    prediction:
      "Where exactly does initiation occur? What should be true of the peak active count and the result positions?",
    hint: "Workers reserve an index synchronously, then invoke that task. Already-started promises cannot be made unstarted.",
    reasoning:
      "A small number of workers places the admission boundary around invocation. Storing outcomes by the reserved index separates completion order from result order. Failure collection and cancellation remain separate policies.",
    starter:
      "async function runPool(tasks, limit) {\n  return Promise.allSettled(tasks.map(task => task()));\n}",
    solution:
      "async function runPool(tasks, limit) {\n  if (!Number.isInteger(limit) || limit < 1) throw new RangeError('Invalid limit');\n  let cursor = 0;\n  const results = new Array(tasks.length);\n  async function worker() {\n    while (cursor < tasks.length) {\n      const index = cursor++;\n      try { results[index] = { status: 'fulfilled', value: await tasks[index]() }; }\n      catch (reason) { results[index] = { status: 'rejected', reason }; }\n    }\n  }\n  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));\n  return results;\n}",
    lessons: ["concurrency-limits-and-fairness", "promise-combinators-and-timeouts"],
    checks: [
      {
        name: "Peak active work respects the limit",
        body: "let active = 0, peak = 0; const tasks = Array.from({length:6},(_,i)=>async()=>{active++; peak=Math.max(peak,active); await new Promise(r=>setTimeout(r,1)); active--; return i;}); const result=await runPool(tasks,2); assert(peak===2 && result.length===6, 'Peak active count: '+peak);",
      },
      {
        name: "Input order survives reversed completions",
        body: "const result=await runPool([()=>new Promise(r=>setTimeout(()=>r('first'),4)),()=>Promise.resolve('second')],2); assert(result[0].value==='first' && result[1].value==='second');",
      },
      {
        name: "Rejection does not strand queued work",
        body: "const reason=new Error('expected'); const result=await runPool([()=>Promise.reject(reason),()=>7],1); assert(result[0].status==='rejected' && result[0].reason===reason && result[1].value===7);",
      },
      {
        name: "Empty input and invalid limit have explicit outcomes",
        body: "assert((await runPool([],1)).length===0); for(const limit of [0,-1,1.5,Infinity]){let rejected=false;try{await runPool([],limit);}catch(e){rejected=e instanceof RangeError;}assert(rejected);}",
      },
    ],
  },
  {
    id: "latest-owner",
    title: "Reject obsolete asynchronous commits",
    domain: "Async",
    difficulty: "Concurrency",
    brief:
      "A search coordinator accepts old responses after a new operation starts. Add single-use result authority.",
    contract:
      "createLatest() exposes begin(), commit(ticket,value), cancel(), getSnapshot(). Only the newest active ticket may commit once. Cancel invalidates active work. Snapshot is initially undefined.",
    prediction:
      "What happens when operation A resolves after B? Does an AbortController alone prove A cannot commit?",
    hint: "A monotonically increasing operation identity can guard the commit even when external work ignores cancellation.",
    reasoning:
      "Abort requests cooperative shutdown. Commit authority must still be checked after awaits. Consuming the active ticket prevents duplicate results, and cancellation invalidates that authority without pretending to undo an already committed remote effect.",
    starter:
      "function createLatest() {\n  let value;\n  return { begin: () => 1, commit: (ticket, next) => { value = next; return true; }, cancel() {}, getSnapshot: () => value };\n}",
    solution:
      "function createLatest() {\n  let sequence=0, active=0, value;\n  return {\n    begin() { active=++sequence; return active; },\n    commit(ticket,next) { if(!active || ticket!==active) return false; active=0; value=next; return true; },\n    cancel() { active=0; },\n    getSnapshot() { return value; }\n  };\n}",
    lessons: ["cancellation-and-races", "state-machines", "actions-and-optimistic-state"],
    checks: [
      {
        name: "An old response cannot overwrite the current owner",
        body: "const state=createLatest();const a=state.begin(),b=state.begin();assert(!state.commit(a,'old'));assert(state.commit(b,'new') && state.getSnapshot()==='new');",
      },
      {
        name: "Cancellation revokes commit authority",
        body: "const state=createLatest(),id=state.begin();state.cancel();assert(!state.commit(id,1) && state.getSnapshot()===undefined);",
      },
      {
        name: "Tickets are single use",
        body: "const state=createLatest(),id=state.begin();assert(state.commit(id,1));assert(!state.commit(id,2) && state.getSnapshot()===1);",
      },
      {
        name: "A later operation can proceed after cancellation",
        body: "const state=createLatest(),a=state.begin();state.cancel();const b=state.begin();assert(a!==b && state.commit(b,3));",
      },
    ],
  },
  {
    id: "observer-reentrancy",
    title: "Make observer delivery deterministic",
    domain: "JavaScript",
    difficulty: "Concurrency",
    brief:
      "Listeners subscribe and unsubscribe during notification. Implement a declared snapshot-delivery contract.",
    contract:
      "createEmitter() provides subscribe(fn) and emit(value). Subscription identity is the function; current delivery uses a snapshot. Added listeners wait until the next emission; removals affect future emissions. Unsubscribe is idempotent. Listener exceptions propagate.",
    prediction:
      "If A removes B and adds C while emitting, which listeners belong to the current snapshot?",
    hint: "Copying registration membership for delivery is different from copying payload values.",
    reasoning:
      "Snapshot membership preserves one emission's contract under reentrancy. A Set deduplicates the same callback and an idempotent disposer makes ownership cleanup predictable. Other delivery policies are possible, but must be stated and tested.",
    starter:
      "function createEmitter() {\n  const listeners=new Set();\n  return { subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);}, emit(value){for(const fn of listeners) fn(value);} };\n}",
    solution:
      "function createEmitter() {\n  const listeners=new Set();\n  return { subscribe(fn){listeners.add(fn);return()=>{listeners.delete(fn);};}, emit(value){for(const fn of [...listeners]) fn(value);} };\n}",
    lessons: ["reentrancy-and-observers", "observer-and-events"],
    checks: [
      {
        name: "Current delivery survives removal and excludes new subscriptions",
        body: "const emitter=createEmitter(),seen=[];let offB;const c=()=>seen.push('C');emitter.subscribe(()=>{seen.push('A');offB();emitter.subscribe(c);});offB=emitter.subscribe(()=>seen.push('B'));emitter.emit(1);assert(seen.join()==='A,B', 'Observed '+seen);emitter.emit(2);assert(seen.join()==='A,B,A,C');",
      },
      {
        name: "Disposal is idempotent and callbacks are deduplicated",
        body: "const emitter=createEmitter();let calls=0;const fn=()=>calls++;const off=emitter.subscribe(fn);emitter.subscribe(fn);emitter.emit(1);off();off();emitter.emit(2);assert(calls===1);",
      },
      {
        name: "Payload identity is preserved",
        body: "const emitter=createEmitter(),value={};let seen;emitter.subscribe(x=>seen=x);emitter.emit(value);assert(seen===value);",
      },
    ],
  },
  {
    id: "immutable-identity",
    title: "Preserve unchanged React identities",
    domain: "React contracts",
    difficulty: "Precision",
    brief:
      "An entity updater mutates input and recreates unrelated records. Repair its identity contract.",
    contract:
      "updateRecord(records,id,patch) returns the original array for missing IDs or a patch whose own string-keyed fields are all Object.is-equal. Otherwise it copies only the changed record and array, preserving every unrelated record. Inputs are plain immutable records.",
    prediction:
      "Which references should change for one edited record? Which should remain identical for a no-op?",
    hint: "Find the record, detect a semantic no-op under the declared shallow contract, and copy only along the changed path.",
    reasoning:
      "Immutable updates communicate change through identity. Deep cloning everything obscures that signal and costs work; mutating an existing record can hide it. This exercise's shallow equality contract does not claim to compare arbitrary nested graphs.",
    starter:
      "function updateRecord(records,id,patch) {\n  return records.map(record => record.id===id ? Object.assign(record,patch) : {...record});\n}",
    solution:
      "function updateRecord(records,id,patch) {\n  const index=records.findIndex(record=>record.id===id);\n  if(index<0 || Object.keys(patch).every(key=>Object.is(records[index][key],patch[key]))) return records;\n  return records.map((record,i)=>i===index ? {...record,...patch} : record);\n}",
    lessons: [
      "property-ownership-and-immutability",
      "memoization-and-context",
      "identity-and-keys",
    ],
    checks: [
      {
        name: "Only the changed path gets new identity",
        body: "const a={id:'a',n:1},b={id:'b',n:2},input=[a,b];const result=updateRecord(input,'a',{n:3});assert(result!==input && result[0]!==a && result[1]===b && a.n===1 && result[0].n===3);",
      },
      {
        name: "No-op preserves the array",
        body: "const input=[{id:'a',n:NaN}];assert(updateRecord(input,'a',{n:NaN})===input);",
      },
      {
        name: "Missing ID preserves the array",
        body: "const input=[{id:'a'}];assert(updateRecord(input,'missing',{n:1})===input);",
      },
      {
        name: "Frozen input remains usable",
        body: "const input=Object.freeze([Object.freeze({id:'a',n:1})]);assert(updateRecord(input,'a',{n:2})[0].n===2);",
      },
    ],
  },
  {
    id: "snapshot-protocol",
    title: "Implement an external-store snapshot contract",
    domain: "React contracts",
    difficulty: "Concurrency",
    brief:
      "A store returns a fresh object every time and notifies before publishing its update. Repair the boundary React relies on.",
    contract:
      "createStore(initial) provides getSnapshot(), set(next), subscribe(fn). Reads are identity-stable until Object.is detects a new value. Publish before notifying; no-op sets do not notify. Each returned snapshot has a value property.",
    prediction:
      "What will a subscriber read during notification? What does a new snapshot identity on every read claim?",
    hint: "Cache the snapshot itself; do not reconstruct it in getSnapshot.",
    reasoning:
      "Stable identity represents an unchanged version. Publication before notification lets every read see the committed store value. This is a protocol exercise; useSyncExternalStore integration and SSR request isolation still require React/server checks.",
    starter:
      "function createStore(initial) {\n  let value=initial;const listeners=new Set();\n  return {getSnapshot:()=>({value}),set(next){for(const fn of listeners)fn();value=next;},subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);}};\n}",
    solution:
      "function createStore(initial) {\n  let snapshot={value:initial};const listeners=new Set();\n  return {getSnapshot:()=>snapshot,set(next){if(Object.is(snapshot.value,next))return;snapshot={value:next};for(const fn of [...listeners])fn();},subscribe(fn){listeners.add(fn);return()=>{listeners.delete(fn);};}};\n}",
    lessons: ["external-stores", "render-and-commit", "request-isolation-and-cache-authority"],
    checks: [
      {
        name: "Unchanged reads have stable identity",
        body: "const store=createStore(1);assert(store.getSnapshot()===store.getSnapshot());",
      },
      {
        name: "Subscribers read the published version",
        body: "const store=createStore(1);let seen;store.subscribe(()=>seen=store.getSnapshot().value);store.set(2);assert(seen===2 && store.getSnapshot().value===2);",
      },
      {
        name: "Object.is no-op does not notify",
        body: "const store=createStore(NaN);let calls=0;store.subscribe(()=>calls++);store.set(NaN);assert(calls===0);",
      },
      {
        name: "Disposal prevents later notifications",
        body: "const store=createStore(1);let calls=0;const off=store.subscribe(()=>calls++);off();off();store.set(2);assert(calls===0);",
      },
    ],
  },
  {
    id: "representation-key",
    title: "Prevent personalized cache-key collisions",
    domain: "Caching",
    difficulty: "Systems",
    brief:
      "A product cache shares representations across callers and uses an ambiguous delimiter. Make the identity explicit.",
    contract:
      "cacheKey(tenant,user,locale,product) deterministically encodes all four validated string dimensions without delimiter ambiguity. This key is representation identity, not an authorization decision.",
    prediction:
      "Can two tuples collide under string concatenation? Which personalized dimension is currently omitted?",
    hint: "Encode a versioned tuple, not a delimiter convention whose values can contain the delimiter.",
    reasoning:
      "Including representation dimensions prevents accidental reuse across audiences. Authorization must still occur at the authoritative read/mutation boundary, with a revocation policy; a cache key alone is not permission.",
    starter: "function cacheKey(tenant,user,locale,product) {\n  return tenant + ':' + product;\n}",
    solution:
      "function cacheKey(tenant,user,locale,product) {\n  return JSON.stringify(['v1',tenant,user,locale,product]);\n}",
    lessons: ["nextjs-caching", "http-caching", "multi-tenant-security"],
    checks: [
      {
        name: "User and locale affect representation identity",
        body: "const key=cacheKey('t','u','en','p');assert(key!==cacheKey('t','v','en','p') && key!==cacheKey('t','u','ar','p'));",
      },
      {
        name: "Tenant and product affect identity",
        body: "const key=cacheKey('t','u','en','p');assert(key!==cacheKey('v','u','en','p') && key!==cacheKey('t','u','en','q'));",
      },
      {
        name: "Delimiter-shaped values do not collide",
        body: "assert(cacheKey('a:b','c','en','p')!==cacheKey('a','b:c','en','p'));",
      },
      {
        name: "Identical tuples are deterministic strings",
        body: "const a=cacheKey('t','u','en','p');assert(typeof a==='string' && a===cacheKey('t','u','en','p'));",
      },
    ],
  },
  {
    id: "stale-refill-fence",
    title: "Fence a stale cache refill",
    domain: "Caching",
    difficulty: "Systems",
    brief:
      "An old origin read can refill the cache after invalidation. Add per-key generation authority and explicit freshness.",
    contract:
      "createCache(now) exposes start(key), fill(ticket,value,ttl), invalidate(key), read(key). Invalidation rejects older tickets for that key. TTL zero is not stored; freshness requires now < expiresAt. read returns {hit:false} or {hit:true,value}, including undefined values.",
    prediction:
      "Why does deleting an entry fail to stop an already-started origin read from restoring stale data?",
    hint: "Deletion removes a value; a generation token revokes permission to publish an old value.",
    reasoning:
      "A generation compares a read's authority at fill time. It does not automatically provide distributed atomicity: multiple instances need a shared fencing/conditional-write contract. TTL controls freshness under a logical clock, independently from invalidation.",
    starter:
      "function createCache(now) {\n  const values=new Map();\n  return {start:key=>({key}),fill(ticket,value,ttl){values.set(ticket.key,{value,expiresAt:now()+ttl});return true;},invalidate:key=>values.delete(key),read(key){const entry=values.get(key);return entry ? {hit:true,value:entry.value} : {hit:false};}};\n}",
    solution:
      "function createCache(now) {\n  const values=new Map(),generations=new Map();\n  return {\n    start(key){return {key,generation:generations.get(key)??0};},\n    fill(ticket,value,ttl){if((generations.get(ticket.key)??0)!==ticket.generation || ttl<=0)return false;values.set(ticket.key,{value,expiresAt:now()+ttl});return true;},\n    invalidate(key){generations.set(key,(generations.get(key)??0)+1);values.delete(key);},\n    read(key){const entry=values.get(key);return entry && now()<entry.expiresAt ? {hit:true,value:entry.value} : {hit:false};}\n  };\n}",
    lessons: ["cache-invalidation", "consistency-models", "nextjs-caching"],
    checks: [
      {
        name: "Invalidation rejects the old fill",
        body: "const cache=createCache(()=>0),old=cache.start('p');cache.invalidate('p');assert(!cache.fill(old,'stale',10) && !cache.read('p').hit);",
      },
      {
        name: "The new generation can publish",
        body: "const cache=createCache(()=>0);cache.invalidate('p');assert(cache.fill(cache.start('p'),'fresh',10) && cache.read('p').value==='fresh');",
      },
      {
        name: "Exact expiry and zero TTL are misses",
        body: "let time=0;const cache=createCache(()=>time);cache.fill(cache.start('p'),1,10);time=10;assert(!cache.read('p').hit);assert(!cache.fill(cache.start('q'),2,0) && !cache.read('q').hit);",
      },
      {
        name: "Undefined values and independent keys remain valid",
        body: "const cache=createCache(()=>0),ticket=cache.start('b');cache.invalidate('a');assert(cache.fill(ticket,undefined,10));const result=cache.read('b');assert(result.hit && result.value===undefined);",
      },
    ],
  },
  {
    id: "binary-framing",
    title: "Parse bytes across transport boundaries",
    domain: "JavaScript",
    difficulty: "Systems",
    brief:
      "A decoder assumes every chunk is one complete frame and aliases its output. Repair framing and ownership.",
    contract:
      "parseFrame(bytes) reads a two-byte unsigned big-endian payload length, at most 1024. Return null for incomplete header/payload, throw RangeError for an oversized declared payload, otherwise return {payload,rest}. Payload is copied; rest is the unconsumed byte view.",
    prediction:
      "What if a header or payload is split across chunks? Who owns the backing bytes after parsing?",
    hint: "Check declared limits before waiting for all data. Respect the input view's byteOffset and byteLength.",
    reasoning:
      "Transport chunks are not message boundaries. A DataView makes byte order explicit, and range checks distinguish incomplete input from invalid input. Copying the payload avoids retaining or observing mutable transport storage; retaining the remainder is a separate ownership choice.",
    starter:
      "function parseFrame(bytes) {\n  const length=bytes[1];\n  return {payload:bytes.subarray(2,2+length),rest:bytes.subarray(2+length)};\n}",
    solution:
      "function parseFrame(bytes) {\n  if(bytes.byteLength<2)return null;\n  const length=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint16(0,false);\n  if(length>1024)throw new RangeError('Frame too large');\n  if(bytes.byteLength<2+length)return null;\n  return {payload:bytes.slice(2,2+length),rest:bytes.subarray(2+length)};\n}",
    lessons: ["binary-memory", "binary-protocols-and-encoding", "streams-and-backpressure"],
    checks: [
      {
        name: "Incomplete data waits for more input",
        body: "assert(parseFrame(new Uint8Array([0]))===null && parseFrame(new Uint8Array([0,2,65]))===null);",
      },
      {
        name: "Big-endian length and remainder are respected",
        body: "const input=new Uint8Array(260);input[0]=1;input[1]=0;input[2]=65;input[258]=9;const result=parseFrame(input);assert(result.payload.length===256 && result.payload[0]===65 && result.rest.length===2 && result.rest[0]===9);",
      },
      {
        name: "Payload owns a copy, even for an offset view",
        body: "const bytes=new Uint8Array([9,0,1,65,8]);const result=parseFrame(bytes.subarray(1,4));bytes[3]=66;assert(result.payload[0]===65 && result.rest.length===0);",
      },
      {
        name: "Oversized declaration is rejected early",
        body: "let rejected=false;try{parseFrame(new Uint8Array([4,1]));}catch(e){rejected=e instanceof RangeError;}assert(rejected);",
      },
    ],
  },
  {
    id: "cleanup-outcome",
    title: "Preserve outcomes across asynchronous cleanup",
    domain: "Async",
    difficulty: "Precision",
    brief:
      "A resource wrapper returns from finally and loses the operation result. Implement completion semantics precisely.",
    contract:
      "withCleanup(work,cleanup) awaits work and always awaits cleanup. Successful cleanup preserves work's value or rejection identity. A cleanup failure replaces that outcome.",
    prediction:
      "Which completion wins when finally returns? What changes when cleanup rejects instead?",
    hint: "A finally block without return preserves the prior completion unless it throws or its awaited operation rejects.",
    reasoning:
      "Cleanup is part of the lifetime contract. Awaiting both boundaries prevents release from racing the operation and makes cleanup failure explicit. A production API may choose error aggregation instead, but that would be a different declared contract.",
    starter:
      "async function withCleanup(work,cleanup) {\n  try { return await work(); }\n  finally { return await cleanup(); }\n}",
    solution:
      "async function withCleanup(work,cleanup) {\n  try { return await work(); }\n  finally { await cleanup(); }\n}",
    lessons: ["errors-and-completion", "resource-ownership", "promise-construction-and-rejections"],
    checks: [
      {
        name: "Fulfilled work keeps its value",
        body: "assert(await withCleanup(()=>7,()=>undefined)===7);",
      },
      {
        name: "Work rejection identity is preserved",
        body: "const reason={kind:'work'};let seen;try{await withCleanup(()=>Promise.reject(reason),()=>{});}catch(e){seen=e;}assert(seen===reason);",
      },
      {
        name: "Cleanup failure replaces the previous outcome",
        body: "const reason={kind:'cleanup'};let seen;try{await withCleanup(()=>7,()=>Promise.reject(reason));}catch(e){seen=e;}assert(seen===reason);",
      },
      {
        name: "Cleanup is awaited after work",
        body: "const seen=[];await withCleanup(async()=>{seen.push('work');return 7;},async()=>{await Promise.resolve();seen.push('cleanup');});assert(seen.join()==='work,cleanup');",
      },
    ],
  },
  ...problemSolving,
];

export const reviewDomains = [
  {
    track: "javascript",
    invariant: "Explain value, identity, evaluation, and ownership before choosing an abstraction.",
    evidence:
      "Predict an unfamiliar edge case, implement the contract, and explain which facts come from the language versus the host.",
    failure:
      "A proxy/accessor reenters policy code, or an iterator is abandoned before resource cleanup.",
  },
  {
    track: "async",
    invariant: "Bound admission, waiting work, lifetimes, and result authority.",
    evidence:
      "Draw a task/microtask trace, reverse two completions, and prove obsolete work cannot commit.",
    failure: "A canceled request ignores abort and completes after its owner changes.",
  },
  {
    track: "react",
    invariant: "Pure candidate work and committed UI have different lifetimes.",
    evidence:
      "Use Profiler commits, effect cleanup, stable identity, and external-store snapshots to support the explanation.",
    failure:
      "A transition is superseded while an optimistic operation and a subscription remain pending.",
  },
  {
    track: "nextjs",
    invariant:
      "Request identity, module graphs, cached output, and deployment lifetimes are separate boundaries.",
    evidence:
      "Inspect HTML/RSC, overlap two users, warm each cache layer, and test direct entry plus existing router state.",
    failure:
      "Two server instances and an old browser tab disagree after a deployment or permission revocation.",
  },
  {
    track: "network",
    invariant: "Choose browser and transport mechanisms by their guarantees, not by API names.",
    evidence:
      "Produce a waterfall, a layout trace, an offline recovery check, and a cache-key/status contract.",
    failure:
      "A slow client, partial frame, storage upgrade, or layout feedback loop violates an assumed boundary.",
  },
  {
    track: "security",
    invariant: "Validate and authorize the current operation at its authority boundary.",
    evidence:
      "Write actor/resource/operation cases, tenant-denial tests, abuse inputs, and a secret/data-flow review.",
    failure:
      "Cached permission claims remain after revocation or an attacker controls a resource identifier.",
  },
  {
    track: "data",
    invariant:
      "A local success is not proof of global consistency, atomicity, or exactly-once delivery.",
    evidence:
      "Reproduce a lost update, stale refill, duplicated event, and uncertain commit; state the chosen consistency budget.",
    failure: "A retry duplicates a side effect or an old read republishes data after invalidation.",
  },
  {
    track: "engineering",
    invariant: "A claim needs evidence at the boundary where it can fail.",
    evidence:
      "Combine type negatives, behavioral tests, browser accessibility checks, profiles, and field cohorts.",
    failure:
      "A passing unit suite conceals a real-layout, authorization, serialization, or slow-device regression.",
  },
  {
    track: "architecture",
    invariant: "Boundaries pay for actual independent change, ownership, and recovery.",
    evidence:
      "Write an ADR with constraints, alternatives, a migration seam, and an executable dependency rule.",
    failure:
      "An allegedly independent module depends on another team's private state or synchronized release.",
  },
  {
    track: "patterns",
    invariant:
      "A reusable interface preserves behavioral obligations, including failure and lifetime.",
    evidence:
      "Run shared contract tests and demonstrate when a simpler composition would be preferable.",
    failure:
      "Matching types conceal weaker consistency, unsupported capabilities, or reentrant delivery semantics.",
  },
] as const;
