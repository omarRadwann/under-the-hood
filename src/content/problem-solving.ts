import type { Exercise } from "./training";

export const problemSolving: Exercise[] = [
  {
    id: "interview-pair-sum",
    title: "Find a pair without reusing an element",
    domain: "Problem solving",
    difficulty: "Precision",
    brief:
      "Return two indexes whose values sum to a target. Explain a simple solution before improving it.",
    contract:
      "pairSum(nums, target) accepts a dense array of integers between -1,000,000 and 1,000,000. Return [i,j] with i<j, choosing the smallest possible j and then i; return null if absent. Do not mutate input. At most 100,000 items.",
    prediction:
      "Why must a lookup happen before inserting the current element? What changes for [3,3] and target 6?",
    hint: "Store the first index of each earlier value. The current index closes a candidate pair.",
    reasoning:
      "A left-to-right scan fixes the earliest closing index. Checking the complement before insertion prevents self-use; preserving the first index makes ties deterministic. Expected O(n) time with typical Map lookup and O(n) extra space; compare with O(n²) pair enumeration. Tests establish selected cases, not asymptotic complexity.",
    starter:
      "function pairSum(nums, target) {\n  for (let i=0;i<nums.length-1;i++) {\n    if (nums[i]+nums[i+1]===target) return [i,i+1];\n  }\n  return null;\n}",
    solution:
      "function pairSum(nums, target) {\n  const seen = new Map();\n  for (let j=0;j<nums.length;j++) {\n    const other = target-nums[j];\n    if (seen.has(other)) return [seen.get(other), j];\n    if (!seen.has(nums[j])) seen.set(nums[j], j);\n  }\n  return null;\n}",
    lessons: ["keyed-collections", "complexity-and-virtualization"],
    checks: [
      {
        name: "Non-adjacent and negative values",
        body: "assert(JSON.stringify(pairSum([-3,4,3,90],0))==='[0,2]');",
      },
      {
        name: "Duplicates require two indexes",
        body: "assert(JSON.stringify(pairSum([3,3],6))==='[0,1]' && pairSum([3],6)===null);",
      },
      {
        name: "Deterministic first closing pair",
        body: "assert(JSON.stringify(pairSum([1,1,4,4],5))==='[0,2]');",
      },
      {
        name: "Absence and input ownership",
        body: "const a=Object.freeze([1,2,3]);assert(pairSum(a,20)===null && pairSum([],0)===null && a.join()==='1,2,3');",
      },
    ],
  },
  {
    id: "interview-merge-windows",
    title: "Coalesce availability windows",
    domain: "Problem solving",
    difficulty: "Precision",
    brief:
      "Normalize an unordered list of availability windows without changing the caller's data.",
    contract:
      "mergeWindows(windows) accepts [start,end] minute pairs with integer 0<=start<end<=1440. Return sorted, newly allocated windows coalescing overlapping OR touching ranges. Empty input returns []. This availability union is not a booking-conflict rule.",
    prediction:
      "Should [0,10] and [10,20] combine? State the endpoint policy before coding. What about a window entirely inside another?",
    hint: "Copy each pair, sort by start, then maintain the final merged window as an invariant.",
    reasoning:
      "After sorting, an incoming start beyond the current end begins a new group; otherwise expand the end using max. Copying both the array and its pairs protects ownership. With an O(n log n) sorting implementation, sorting dominates the O(n) scan; ECMAScript does not mandate sort complexity. Output/copy storage is O(n). Clarify half-open booking conflicts separately from coalescing adjacent availability.",
    starter: "function mergeWindows(windows) { return windows.slice(); }",
    solution:
      "function mergeWindows(windows) {\n  const sorted=windows.map(([start,end])=>[start,end]).sort((a,b)=>a[0]-b[0] || a[1]-b[1]);\n  const result=[];\n  for (const [start,end] of sorted) {\n    const last=result[result.length-1];\n    if (!last || start>last[1]) result.push([start,end]);\n    else last[1]=Math.max(last[1],end);\n  }\n  return result;\n}",
    lessons: ["array-transformations", "complexity-and-virtualization"],
    checks: [
      {
        name: "Unsorted overlaps",
        body: "assert(JSON.stringify(mergeWindows([[20,30],[0,10],[5,25]]))==='[[0,30]]');",
      },
      {
        name: "Touching and nested windows",
        body: "assert(JSON.stringify(mergeWindows([[0,10],[10,20],[2,3]]))==='[[0,20]]');",
      },
      {
        name: "Separate windows and empty input",
        body: "assert(JSON.stringify(mergeWindows([[30,40],[0,5]]))==='[[0,5],[30,40]]' && mergeWindows([]).length===0);",
      },
      {
        name: "No array or pair mutation/alias",
        body: "const p=Object.freeze([5,10]);const a=Object.freeze([p,Object.freeze([0,6])]);const out=mergeWindows(a);assert(out!==a && out[0]!==p && p[0]===5 && JSON.stringify(out)==='[[0,10]]');",
      },
    ],
  },
  {
    id: "interview-unique-window",
    title: "Find the longest unique text window",
    domain: "Problem solving",
    difficulty: "Precision",
    brief: "Move from repeated substring scans to a sliding window with a precise text unit.",
    contract:
      "longestUnique(text) returns the maximum number of Unicode code points in a contiguous substring with no repeated code point. Empty input returns 0. This counts code points, not grapheme clusters; input contains at most 20,000 code points.",
    prediction:
      "Why can moving the left boundary backwards break the invariant? Does an emoji always have string.length 1?",
    hint: "Iterate code points and maintain a separate increasing index. A previous occurrence matters only if it is inside the current window.",
    reasoning:
      "Keep the left boundary at max(left,lastSeen+1). Every point enters once; expected O(n) time and O(min(n, alphabet)) additional space with typical Map operations. for-of uses code points, so its index must not be mixed with UTF-16 offsets. Grapheme segmentation would be a different contract.",
    starter: "function longestUnique(text) { return text.length; }",
    solution:
      "function longestUnique(text) {\n  const seen=new Map();\n  let left=0,index=0,best=0;\n  for (const point of text) {\n    if (seen.has(point)) left=Math.max(left,seen.get(point)+1);\n    seen.set(point,index);\n    best=Math.max(best,index-left+1);\n    index++;\n  }\n  return best;\n}",
    lessons: ["strings-and-unicode", "keyed-collections"],
    checks: [
      {
        name: "Repeated and empty input",
        body: "assert(longestUnique('abcabcbb')===3 && longestUnique('bbbbb')===1 && longestUnique('')===0);",
      },
      {
        name: "Left boundary never retreats",
        body: "assert(longestUnique('abba')===2 && longestUnique('tmmzuxt')===5);",
      },
      {
        name: "Code points rather than UTF-16 units",
        body: "assert(longestUnique('😀a😀b')===3 && longestUnique('😀')===1);",
      },
      {
        name: "Combining marks follow the stated unit",
        body: "assert(longestUnique('e\u0301e')===2 && longestUnique(' a b ')===3);",
      },
    ],
  },
  {
    id: "interview-tree-preorder",
    title: "Traverse a nested navigation tree",
    domain: "Problem solving",
    difficulty: "Systems",
    brief:
      "Flatten a navigation forest in preorder while preserving sibling order and avoiding recursive call depth.",
    contract:
      "preorder(roots) returns node IDs in root-first depth-first order. Each node is {id:string,children?:Node[]}. The input is a finite acyclic forest, with unique IDs, at most 10,000 nodes, and no shared nodes. Do not mutate input. Explain how untrusted graphs would change the contract.",
    prediction: "Why does pushing children left-to-right onto a stack reverse the displayed order?",
    hint: "Push roots and children in reverse order so the next pop visits the leftmost item.",
    reasoning:
      "An explicit stack avoids depending on the JavaScript call-stack limit. Every node is pushed and popped once: O(n) time, up to O(n) pending stack storage plus output. This is a forest traversal, not a cycle detector; arbitrary graphs require visited/visiting policy and a definition for shared nodes.",
    starter: "function preorder(roots) { return roots.map(node=>node.id); }",
    solution:
      "function preorder(roots) {\n  const stack=[...roots].reverse(),result=[];\n  while (stack.length) {\n    const node=stack.pop();\n    result.push(node.id);\n    const children=node.children ?? [];\n    for(let i=children.length-1;i>=0;i--) stack.push(children[i]);\n  }\n  return result;\n}",
    lessons: ["execution-context", "complexity-and-virtualization"],
    checks: [
      {
        name: "Preorder and sibling order",
        body: "assert(preorder([{id:'a',children:[{id:'b',children:[{id:'c'}]},{id:'d'}]},{id:'e'}]).join()==='a,b,c,d,e');",
      },
      {
        name: "Empty and leaf nodes",
        body: "assert(preorder([]).length===0 && preorder([{id:'x',children:[]}]).join()==='x');",
      },
      {
        name: "Frozen input remains intact",
        body: "const leaf=Object.freeze({id:'b'});const a=Object.freeze([Object.freeze({id:'a',children:Object.freeze([leaf])})]);assert(preorder(a).join()==='a,b' && a[0].children[0]===leaf);",
      },
      {
        name: "Longer chain preserves every node",
        body: "let node={id:'199'};for(let i=198;i>=0;i--) node={id:String(i),children:[node]};const out=preorder([node]);assert(out.length===200 && out[0]==='0' && out[199]==='199');",
      },
    ],
  },
  {
    id: "interview-lower-bound",
    title: "Find an insertion boundary with binary search",
    domain: "Problem solving",
    difficulty: "Precision",
    brief:
      "Implement a reusable boundary search, not a search that succeeds only on an exact match.",
    contract:
      "lowerBound(sorted,target) returns the first index with value>=target, or sorted.length if none. Input is a nondecreasing dense integer array. Duplicates are allowed. Do not mutate input. Explain the [lo,hi) search invariant and O(log n) comparison count.",
    prediction:
      "For [1,2,2,4], where should 2, 3, and 5 be inserted? Which half must remain after equality?",
    hint: "Equality keeps the left candidate half. Start hi at length so empty input needs no special sentinel.",
    reasoning:
      "Maintain that indexes before lo are too small, and indexes at/after hi satisfy the boundary where they exist. Shrinking a half-open interval terminates at the first valid insertion point. O(log n) time and O(1) auxiliary space. Use arithmetic midpoint rather than bitwise conversion that truncates indexes to 32 bits.",
    starter: "function lowerBound(sorted,target) { return sorted.indexOf(target); }",
    solution:
      "function lowerBound(sorted,target) {\n  let lo=0,hi=sorted.length;\n  while(lo<hi) {\n    const mid=lo+Math.floor((hi-lo)/2);\n    if(sorted[mid]<target) lo=mid+1;\n    else hi=mid;\n  }\n  return lo;\n}",
    lessons: ["control-flow-and-loops", "complexity-and-virtualization"],
    checks: [
      {
        name: "First duplicate",
        body: "assert(lowerBound([1,2,2,4],2)===1 && lowerBound([2,2,2],2)===0);",
      },
      { name: "Insertion between values", body: "assert(lowerBound([1,2,2,4],3)===3);" },
      {
        name: "Empty and endpoint insertion",
        body: "assert(lowerBound([],1)===0 && lowerBound([1,2],0)===0 && lowerBound([1,2],3)===2);",
      },
      {
        name: "Frozen negative values",
        body: "const a=Object.freeze([-10,-3,0,4]);assert(lowerBound(a,-5)===1 && a.join()==='-10,-3,0,4');",
      },
    ],
  },
  {
    id: "interview-lru-cache",
    title: "Build a bounded LRU cache",
    domain: "Problem solving",
    difficulty: "Systems",
    brief: "Design a small cache API whose capacity, identity, and recency rules are observable.",
    contract:
      "createLRU(capacity) requires a positive integer capacity. Return {get,set,has,keys}. get of a present key and every set promote it to most recent; has does not. Evict the least recent on overflow. keys returns least-to-most recent keys. Undefined values are allowed; has distinguishes absence. Preserve Map key identity.",
    prediction:
      "Does reading a missing key change recency? Does replacing a value temporarily count as a new entry?",
    hint: "Map insertion order can represent recency when promoting by delete then set. Use has before interpreting an undefined result.",
    reasoning:
      "The capacity invariant holds after every set. Deleting an existing key before reinsertion promotes it without growing the cache. Typical Map operations make get/set/has expected O(1); keys costs O(k), and memory is O(capacity). This is process-local LRU, with no TTL, persistence, byte budget, or distributed coordination.",
    starter:
      "function createLRU(capacity) {\n  const map=new Map();\n  return {get:key=>map.get(key),set:(key,value)=>{map.set(key,value);},has:key=>map.has(key),keys:()=>[...map.keys()]};\n}",
    solution:
      "function createLRU(capacity) {\n  if(!Number.isInteger(capacity) || capacity<1) throw new RangeError('Invalid capacity');\n  const map=new Map();\n  return {\n    get(key) {\n      if(!map.has(key)) return undefined;\n      const value=map.get(key);map.delete(key);map.set(key,value);return value;\n    },\n    set(key,value) {\n      map.delete(key);map.set(key,value);\n      if(map.size>capacity) map.delete(map.keys().next().value);\n    },\n    has:key=>map.has(key),\n    keys:()=>[...map.keys()],\n  };\n}",
    lessons: ["keyed-collections", "cache-invalidation", "state-ownership"],
    checks: [
      {
        name: "Read promotes and overflow evicts",
        body: "const c=createLRU(2);c.set('a',1);c.set('b',2);c.get('a');c.set('c',3);assert(!c.has('b') && c.keys().join()==='a,c');",
      },
      {
        name: "Replacement and has semantics",
        body: "const c=createLRU(2);c.set('a',1);c.set('b',2);c.has('a');assert(c.keys().join()==='a,b');c.set('a',3);assert(c.keys().join()==='b,a' && c.get('a')===3);",
      },
      {
        name: "Undefined and object identity",
        body: "const c=createLRU(2),a={},b={};c.set(a,undefined);assert(c.has(a) && !c.has(b) && c.get(a)===undefined);c.set(b,0);assert(c.get(b)===0 && c.keys().length===2);",
      },
      {
        name: "Invalid and unit capacities",
        body: "for(const n of [0,-1,1.5,NaN]){let rejected=false;try{createLRU(n);}catch(e){rejected=e instanceof RangeError;}assert(rejected);}const c=createLRU(1);c.set('a',1);c.set('b',2);assert(!c.has('a') && c.get('b')===2);",
      },
    ],
  },
  {
    id: "interview-balanced-brackets",
    title: "Validate nested bracket pairs",
    domain: "Problem solving",
    difficulty: "Precision",
    brief: "Use a stack invariant and early failure before attempting a larger parser.",
    contract:
      "balanced(text) accepts a string containing only ()[]{} and returns whether all pairs are properly nested and closed. Empty input is valid. This is not a JavaScript parser; quotes, comments, and escapes are outside its input domain.",
    prediction:
      "Why does equal opening/closing count fail for ([)]? What must be true immediately before processing a closer?",
    hint: "The most recent unmatched opening bracket is the only one the next closer may consume.",
    reasoning:
      "A stack preserves nesting order. Reject a mismatched or unmatched closer immediately and require an empty stack at completion. O(n) time and O(n) worst-case stack memory. A lexical layer would be required before applying this to program text containing strings or comments.",
    starter: "function balanced(text) { return text.length%2===0; }",
    solution:
      "function balanced(text) {\n  const stack=[],matching={')':'(',']':'[','}':'{'};\n  for(const char of text) {\n    if(char==='(' || char==='[' || char==='{') stack.push(char);\n    else if(stack.pop()!==matching[char]) return false;\n  }\n  return stack.length===0;\n}",
    lessons: ["control-flow-and-loops", "arrays-and-sparse-data"],
    checks: [
      {
        name: "Nested and sequential pairs",
        body: "assert(balanced('{[()]}') && balanced('()[]{}'));",
      },
      { name: "Crossing is not nesting", body: "assert(!balanced('([)]') && !balanced('(]'));" },
      {
        name: "Unmatched endpoints",
        body: "assert(!balanced(')(') && !balanced('((') && !balanced(']'));",
      },
      { name: "Empty and single pair", body: "assert(balanced('') && balanced('[]'));" },
    ],
  },
  {
    id: "interview-dependency-order",
    title: "Order dependencies and detect a cycle",
    domain: "Problem solving",
    difficulty: "Systems",
    brief:
      "Produce an execution order for dependent tasks, then explain what a cycle means operationally.",
    contract:
      "dependencyOrder(nodes,edges) takes unique string node IDs and [prerequisite,dependent] pairs. Return any order satisfying every edge, or null for a cycle. Unknown edge endpoints throw RangeError. Duplicate edges are treated as one dependency. Do not mutate inputs. At most 1,000 nodes and 5,000 edges.",
    prediction:
      "Why does processing zero-indegree nodes prove a dependency is satisfied? Can a disconnected component hide a cycle?",
    hint: "Track indegrees and a queue with a head index. Compare processed node count with the whole graph.",
    reasoning:
      "Kahn's algorithm removes available nodes and their outgoing constraints. If fewer than V nodes are processed, some cyclic constraints remain, including in disconnected components. With ordinary Map/Set operations, expected O(V+E) time and O(V+E) storage. A queue head avoids repeated array shifting. A valid order need not be unique.",
    starter: "function dependencyOrder(nodes,edges) { return [...nodes]; }",
    solution:
      "function dependencyOrder(nodes,edges) {\n  const next=new Map(nodes.map(id=>[id,new Set()]));\n  const degree=new Map(nodes.map(id=>[id,0]));\n  for(const [before,after] of edges) {\n    if(!next.has(before) || !next.has(after)) throw new RangeError('Unknown node');\n    if(!next.get(before).has(after)) {next.get(before).add(after);degree.set(after,degree.get(after)+1);}\n  }\n  const queue=nodes.filter(id=>degree.get(id)===0),result=[];\n  let head=0;\n  while(head<queue.length) {\n    const id=queue[head++];result.push(id);\n    for(const child of next.get(id)) {\n      degree.set(child,degree.get(child)-1);\n      if(degree.get(child)===0) queue.push(child);\n    }\n  }\n  return result.length===nodes.length ? result : null;\n}",
    lessons: ["modules-and-bundlers", "modular-monolith", "keyed-collections"],
    checks: [
      {
        name: "Every dependency precedes its consumer",
        body: "const nodes=['ui','db','api','independent'];const edges=[['db','api'],['api','ui']];const out=dependencyOrder(nodes,edges);assert(out && new Set(out).size===4 && edges.every(([a,b])=>out.indexOf(a)<out.indexOf(b)));",
      },
      {
        name: "Cycles including disconnected cycles",
        body: "assert(dependencyOrder(['a','b','x'],[['a','b'],['b','a']])===null && dependencyOrder(['a'],[['a','a']])===null);",
      },
      {
        name: "Empty, duplicate edges, and immutable inputs",
        body: "assert(dependencyOrder([],[]).length===0);const n=Object.freeze(['b','a']);const e=Object.freeze([Object.freeze(['a','b']),Object.freeze(['a','b'])]);assert(dependencyOrder(n,e).join()==='a,b' && n.join()==='b,a');",
      },
      {
        name: "Unknown endpoints are rejected",
        body: "let rejected=false;try{dependencyOrder(['a'],[['a','missing']]);}catch(e){rejected=e instanceof RangeError;}assert(rejected);",
      },
    ],
  },
];
