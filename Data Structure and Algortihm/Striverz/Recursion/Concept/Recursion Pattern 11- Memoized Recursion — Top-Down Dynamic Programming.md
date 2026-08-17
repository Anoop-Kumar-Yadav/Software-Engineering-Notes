
We now move from **backtracking** to **memoized recursion**.

This is a major conceptual transition. In backtracking, different branches usually represent different states or different decision paths. In dynamic programming, we discover that **different recursive paths can reach the exact same state**, causing the same computation to be performed repeatedly.

The central transformation is:

```text
Naive recursion
      ↓
Repeated states
      ↓
Recognize identical state
      ↓
Store result for that state
      ↓
Reuse cached result
```

The key idea is not "use a cache." The deeper idea is:

> **A recursive subproblem is identified by its state. If the same state is reached again, its answer is already known.**

---

# 1. Start with Fibonacci

Consider:

```java
int fib(int n) {
    if (n <= 1) {
        return n;
    }

    return fib(n - 1) + fib(n - 2);
}
```

Mathematically:

[  
F(n)=F(n-1)+F(n-2)  
]

with:

[  
F(0)=0,\qquad F(1)=1  
]

At first glance, this looks simple.

But the recursion tree contains a serious problem.

---

# 2. Visualize the recursion tree

For:

[  
F(5)  
]

we get:

```text
                         F(5)
                       /      \
                    F(4)      F(3)
                   /   \      /   \
                F(3)   F(2) F(2)  F(1)
               /  \    /  \
             F(2) F(1) F(1) F(0)
             / \
           F(1) F(0)
```

Now look carefully.

`F(3)` appears multiple times.

`F(2)` appears even more times.

The recursion tree is not producing unique subproblems.

It is repeatedly solving the **same mathematical state**.

---

# 3. What is a state?

For Fibonacci:

```text
F(n)
```

the entire state is simply:

```text
n
```

So:

```text
F(3)
```

is the same state regardless of how we reached it.

For example:

```text
F(5)
  ↓
F(4)
  ↓
F(3)
```

and:

```text
F(5)
  ↓
F(3)
```

both eventually ask:

```text
F(3)
```

The execution path is different.

But the **state is identical**.

Therefore its result must be identical.

---

# 4. The critical distinction: path vs state

This is one of the most important concepts in Dynamic Programming.

Consider:

```text
Path A:
F(5) → F(4) → F(3)

Path B:
F(5) → F(3)
```

The paths differ.

But:

```text
State A = 3
State B = 3
```

Therefore:

[  
F(3)  
]

has exactly one mathematical answer.

So we can compute it once:

```text
memo[3] = result
```

and every later request for `F(3)` simply retrieves that result.

---

# 5. Memoization

Memoization means:

> **Store the result associated with a recursive state so that future calls with the same state do not recompute it.**

Conceptually:

```text
if state already cached:
    return cached result

compute result

cache result

return result
```

For Fibonacci:

```java
int fib(int n, int[] memo) {
    if (n <= 1) {
        return n;
    }

    if (memo[n] != -1) {
        return memo[n];
    }

    memo[n] = fib(n - 1, memo) + fib(n - 2, memo);

    return memo[n];
}
```

The recursion is still present.

The difference is that the recursion now has **persistent knowledge of previously solved states**.

---

# 6. Execution with memoization

Let's trace:

```text
fib(5)
```

Initially:

```text
memo:
index:  0  1  2  3  4  5
value: -1 -1 -1 -1 -1 -1
```

We enter:

```text
fib(5)
```

Not cached.

So:

```text
fib(4)
fib(3)
```

are required.

Eventually we calculate:

```text
fib(2)
```

which calculates:

```text
fib(1)
fib(0)
```

Then:

```text
memo[2] = 1
```

Now `fib(2)` is permanently known.

Continue.

Eventually:

```text
memo[3] = 2
memo[4] = 3
memo[5] = 5
```

The important thing is what happens when a state repeats.

---

# 7. The repeated state disappears

Suppose we already calculated:

```text
memo[3] = 2
```

Later:

```text
fib(3)
```

is called again.

Without memoization:

```text
fib(3)
 ├── fib(2)
 │    ├── fib(1)
 │    └── fib(0)
 └── fib(1)
```

With memoization:

```text
fib(3)
   ↓
memo[3] exists
   ↓
return 2
```

The entire subtree is eliminated.

This is the essential effect of memoization.

---

# 8. Recursion tree becomes a state graph

This is a deeper way to visualize Dynamic Programming.

Naive recursion gives us a **tree**:

```text
                    F(5)
                  /      \
                F(4)     F(3)
               /   \     /   \
             F(3) F(2) F(2) F(1)
```

But notice that identical states are actually the same logical node.

If we merge identical states:

```text
                    F(5)
                   /    \
                 F(4)   F(3)
                /   \     |
              F(3)  F(2)  |
                \    /    /
                 \  /    /
                  F(2)
```

The structure is better understood as a **directed acyclic graph of states**.

The recursion tree contains duplicated nodes.

The DP state graph contains unique states.

---

# 9. Tree vs DAG

This distinction is extremely important.

### Naive recursion

```text
             root
           /      \
         A          B
        / \        / \
       C   D      D   E
```

`D` is calculated twice.

### Memoized recursion

```text
             root
           /      \
         A          B
          \        /
             D
```

There is only one logical state `D`.

Both branches reference the same stored result.

So:

> **Memoization converts repeated computation in the recursion tree into shared computation over a state DAG.**

---

# 10. Why Fibonacci becomes O(n)

Naive Fibonacci:

[  
T(n)=T(n-1)+T(n-2)+O(1)  
]

This creates exponential growth.

With memoization, the possible states are:

```text
0,1,2,3,...,n
```

There are only:

[  
n+1  
]

unique states.

Each state is computed once.

Each state performs constant additional work.

Therefore:

[  
\boxed{O(n)}  
]

Time.

The memo array requires:

[  
\boxed{O(n)}  
]

space.

The recursion stack also reaches:

[  
O(n)  
]

depth.

So total auxiliary space is commonly:

[  
O(n)  
]

---

# 11. The fundamental DP equation

For memoized recursion:

[  
\boxed{\text{Total complexity} \approx \text{number of unique states} \times \text{work per state}}  
]

This is one of the most useful formulas in Dynamic Programming.

For Fibonacci:

```text
unique states = n
work/state    = O(1)
```

Therefore:

[  
O(n)  
]

---

# 12. State identification

The hardest part of DP is often not writing the memo array.

It is identifying:

> **What information completely determines the future computation?**

For Fibonacci:

```text
state = n
```

For a more complex problem, it may be:

```text
state = (index, remaining)
```

or:

```text
state = (row, column)
```

or:

```text
state = (index, capacity)
```

or:

```text
state = (index, previousChoice)
```

The memoization key must contain **everything necessary to determine the answer from that point onward**.

---

# 13. Example: Climbing Stairs

Suppose:

> You can climb either 1 or 2 stairs. How many different ways are there to reach stair `n`?

Define:

```text
ways(n)
```

At stair `n`, the final move must have come from either:

```text
n - 1
```

or:

```text
n - 2
```

Therefore:

[  
ways(n)=ways(n-1)+ways(n-2)  
]

This is structurally Fibonacci.

The state is:

```text
n
```

Again, memoization reduces the repeated state computation.

---

# 14. The general Top-Down DP template

A generic memoized recursion looks like:

```java
int solve(State state, Map<State, Integer> memo) {

    if (baseCase(state)) {
        return baseValue;
    }

    if (memo.containsKey(state)) {
        return memo.get(state);
    }

    int answer = combine(
        solve(nextState1, memo),
        solve(nextState2, memo)
    );

    memo.put(state, answer);

    return answer;
}
```

The sequence is:

```text
ENTER STATE
    ↓
BASE CASE?
    ↓ no
CACHE HIT?
    ↓ no
SOLVE CHILD STATES
    ↓
COMBINE
    ↓
STORE RESULT
    ↓
RETURN
```

Compare that with ordinary recursion:

```text
ENTER
 ↓
BASE CASE?
 ↓
SOLVE CHILDREN
 ↓
COMBINE
 ↓
RETURN
```

Memoization adds:

```text
CACHE LOOKUP
```

and:

```text
CACHE STORE
```

---

# 15. Cache lookup must happen before recursion

This ordering matters.

Correct:

```java
if (memo[state] != UNKNOWN) {
    return memo[state];
}

memo[state] = compute(...);
```

If we recursively compute first and check afterward, we have already performed the expensive work.

The entire purpose is:

```text
state
 ↓
already solved?
 ↓ yes
return immediately
```

---

# 16. What exactly gets stored?

This is another important distinction.

We don't generally store:

```text
"this state was visited"
```

We store:

```text
state → answer
```

For example:

```text
memo[5] = 5
```

means:

> The answer to state `5` is `5`.

For a two-dimensional DP:

```text
memo[index][capacity] = bestValue
```

means:

> The answer for this exact `(index, capacity)` state has already been computed.

Memoization is therefore a **state → result mapping**.

---

# 17. Memoization vs visited array

Do not confuse these.

A `visited` structure answers:

```text
Have I seen this node?
```

A memo structure answers:

```text
What is the already-computed answer for this state?
```

For graph traversal:

```text
visited[A] = true
```

For DP:

```text
memo[A] = 42
```

The second contains the actual computed result.

---

# 18. A more interesting example: Minimum Cost Climbing Stairs

Suppose:

```text
cost = [10, 15, 20]
```

You can move either one or two steps.

Define:

```text
minCost(i)
```

as:

> Minimum cost required to reach the top starting from position `i`.

The state is:

```text
i
```

From `i`, we can move:

```text
i + 1
```

or:

```text
i + 2
```

Therefore:

# [  
minCost(i)

cost[i]  
+  
\min(minCost(i+1),minCost(i+2))  
]

Now the same `i` may be reached from multiple recursive paths.

So:

```text
memo[i]
```

stores the minimum cost from that state.

---

# 19. DP state is a compressed description of the future

This is a very important conceptual statement.

Suppose you reach:

```text
state = (index = 5, remaining = 10)
```

If everything that happened before this point no longer matters to the future decision, then the entire history can be discarded.

You only need:

```text
index = 5
remaining = 10
```

Therefore:

```text
memo[5][10]
```

can represent the entire future computation.

This is why good DP solutions focus heavily on **state definition**.

---

# 20. History vs state

Imagine two paths:

```text
Path A:
choices → 2 → 5 → 7
```

and:

```text
Path B:
choices → 3 → 4 → 7
```

Suppose both eventually reach:

```text
index = 7
remaining = 10
```

If the future decisions depend only on:

```text
index
remaining
```

then both paths are equivalent from this point onward.

Therefore:

```text
solve(7, 10)
```

needs to be calculated only once.

This is the foundation of **overlapping subproblems**.

---

# 21. Overlapping subproblems

A problem has overlapping subproblems when:

> **The recursive decomposition repeatedly produces the same state.**

For Fibonacci:

```text
F(5)
 ├── F(4)
 │    └── F(3)
 │
 └── F(3)
```

`F(3)` is repeated.

For a 2D DP problem:

```text
solve(i, j)
```

might be reached through:

```text
solve(i-1, j)
solve(i, j-1)
```

and both may eventually request:

```text
solve(i-1, j-1)
```

The state repeats.

Memoization exploits exactly this repetition.

---

# 22. Recursion + overlapping states

You can think of the progression like this:

```text
Ordinary recursion

          A
        /   \
       B     C
      / \   / \
     D   E D   F
```

Repeated:

```text
D
```

causes duplicate computation.

Memoization:

```text
          A
        /   \
       B     C
        \   /
          D
```

with:

```text
memo[D] = result
```

Now:

```text
B → D
```

computes it.

Later:

```text
C → D
```

simply retrieves it.

---

# 23. Backtracking vs Memoization

This distinction is essential because both use recursion.

|Property|Backtracking|Memoized DP|
|---|---|---|
|Recursive call represents|Decision/state exploration|Subproblem computation|
|Main objective|Enumerate/search solutions|Compute optimal/count/existence result|
|State mutation|Common|Usually less central|
|Undo required|Usually yes|Usually no|
|Repeated state|May exist but often paths matter|Central concept|
|Cache|Usually unnecessary|Core optimization|
|Search pruning|Very important|Sometimes used|
|Typical complexity|Often exponential|Number of states × transition cost|

The mental distinction is:

```text
Backtracking:
"Which possibilities should I explore?"

DP:
"Have I already solved this state?"
```

---

# 24. Backtracking can also have memoization

These are not mutually exclusive.

Consider a search problem where:

```text
state = (position, remaining)
```

Two different paths may reach exactly the same state.

Instead of exploring it twice:

```text
state A
   ↓
solve
```

and later:

```text
state A
   ↓
solve again
```

we can cache the result.

Then we have:

```text
Backtracking/search
        +
memoization
        ↓
cached state-space search
```

This pattern appears in advanced problems such as:

- Word Break
    
- some grid path problems
    
- game-state search
    
- partition problems
    
- subset-style optimization problems
    

---

# 25. Memoization changes the shape of execution

Without memoization:

```text
                  A
              /       \
             B         C
           /   \     /   \
          D     E   D     F
         / \       ...
```

The same state creates another recursive subtree.

With memoization:

```text
                  A
              /       \
             B         C
              \       /
                 D
```

Once `D` completes:

```text
memo[D] = result
```

the second request becomes:

```text
D
↓
cache hit
↓
return result
```

So the recursive tree is **logically compressed**.

---

# 26. Cache population follows return order

This is another important internal detail.

Consider:

```text
fib(5)
```

The function does not know:

```text
memo[5]
```

when it enters.

It first needs:

```text
fib(4)
fib(3)
```

Eventually the deepest states finish first.

So cache population happens approximately:

```text
memo[2]
memo[3]
memo[4]
memo[5]
```

during unwinding.

This is because:

```text
child result
      ↓
parent computes result
      ↓
parent stores result
```

The cache therefore grows as recursive calls return.

---

# 27. Call stack + memo table

This is the mental visualization you should use.

Suppose we are computing:

```text
solve(5)
```

The call stack might currently be:

```text
TOP
│
├── solve(2)
├── solve(3)
├── solve(4)
└── solve(5)
BOTTOM
```

At the same time, the memo table might contain:

```text
state    result
  0        0
  1        1
  2        1
```

When `solve(3)` returns:

```text
memo[3] = 2
```

Then the stack continues unwinding.

So there are **two different pieces of runtime state**:

```text
CALL STACK
    ↓
which recursive computations are currently active

MEMO TABLE
    ↓
which states have already been completely solved
```

This distinction is extremely important.

---

# 28. A state can be active but not cached

Suppose:

```text
solve(5)
  ↓
solve(4)
    ↓
solve(3)
```

At the moment `solve(3)` is executing:

```text
memo[3]
```

may still be unknown.

Why?

Because its computation has not finished.

Only after:

```text
solve(2)
solve(1)
```

return can:

```text
memo[3]
```

be assigned.

Therefore:

```text
active state ≠ completed state
```

The memo table generally stores **completed results**.

---

# 29. The DP recurrence still matters

Memoization does not magically derive the answer.

We still need the recurrence.

For Fibonacci:

[  
F(n)=F(n-1)+F(n-2)  
]

For minimum cost:

[  
dp(i)=cost[i]+\min(dp(i+1),dp(i+2))  
]

For maximum value:

[  
dp(i)=\max(option_1,option_2)  
]

The memo table only prevents repeated evaluation of the recurrence.

So the process is:

```text
Define state
    ↓
Define transitions
    ↓
Define base cases
    ↓
Write recursive recurrence
    ↓
Detect repeated states
    ↓
Memoize
```

---

# 30. Top-Down DP

Memoized recursion is called **Top-Down Dynamic Programming**.

Why "top-down"?

Because we start with the final problem:

```text
solve(n)
```

and recursively descend:

```text
solve(n)
 ↓
solve(n-1)
 ↓
solve(n-2)
 ↓
...
```

while caching the results.

The direction is:

```text
final problem
     ↓
required subproblems
     ↓
smaller states
```

---

# 31. Bottom-Up DP

There is another form.

Instead of recursion:

```text
solve(n)
 ↓
solve(n-1)
 ↓
solve(n-2)
```

we explicitly compute states in dependency order:

```text
dp[0]
dp[1]
dp[2]
dp[3]
...
dp[n]
```

For Fibonacci:

```java
int fib(int n) {
    if (n <= 1) {
        return n;
    }

    int[] dp = new int[n + 1];

    dp[0] = 0;
    dp[1] = 1;

    for (int i = 2; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
    }

    return dp[n];
}
```

This is **Bottom-Up DP**.

We will study it separately. For now, understand the relationship:

```text
Top-Down:
recursion + memoization

Bottom-Up:
iterative state evaluation
```

---

# 32. The deepest conceptual connection

We have now seen three different recursion trees.

### Ordinary recursion

```text
                    state
                  /       \
                state     state
               /   \     /   \
             repeated states
```

No memory of previous computation.

---

### Backtracking

```text
                    state
                  /       \
             choice A    choice B
                ↓           ↓
             state        state
                ↓           ↓
             explore      explore
                ↓           ↓
              undo        undo
```

The tree represents **possible decisions**.

---

### Memoized recursion

```text
                    state
                  /       \
                state     state
                  \       /
                   SAME STATE
                      ↓
                  memoized
```

The tree contains duplicate states, but memoization merges their computation.

---

# 33. Three questions to ask when you see recursion

When you encounter a recursive DSA problem, ask these questions in order.

### Question 1 — What does one recursive call represent?

Is it:

```text
a smaller problem?
```

or:

```text
a decision?
```

or:

```text
a state in a search space?
```

---

### Question 2 — Does the state mutate?

If yes, you may be looking at:

```text
backtracking
```

especially if you see:

```text
make choice
recurse
undo
```

---

### Question 3 — Can the same state occur through different paths?

If yes, ask:

```text
Can I cache the answer for this state?
```

If yes, you are moving toward:

```text
Dynamic Programming
```

---

# 34. The complete progression

You should now see the progression of recursion patterns:

```text
                    RECURSION
                        │
          ┌─────────────┼──────────────┐
          ↓             ↓              ↓
   Linear recursion  Divide &      Backtracking
                     Conquer            │
          │             │               │
          │             │          state exploration
          │             │               │
          │             │          repeated states?
          │             │               │
          │             │              YES
          │             │               ↓
          │             │          Memoization
          │             │               │
          └─────────────┴───────────────┘
                        ↓
                 Dynamic Programming
```

This is not just a collection of algorithms.

It is a progression in how we reason about **recursive state**.

---

# 35. Problems — Memoized Recursion

## Level 1 — Recognize repeated states

### Problem 1 — Fibonacci

For:

[  
F(6)  
]

draw the complete naive recursion tree.

Then mark every duplicated state.

Determine:

```text
number of unique states
number of repeated computations
```

---

### Problem 2 — Climbing Stairs

Given:

```text
n = 5
```

with allowed moves:

```text
+1
+2
```

Define:

```text
ways(n)
```

Determine:

```text
state
base case
transition
memo key
```

Then calculate the complexity with and without memoization.

---

## Level 2 — State identification

### Problem 3 — Minimum Cost

Given:

```text
cost = [10, 15, 20, 5]
```

You may move one or two positions.

Define:

```text
minCost(i)
```

Determine exactly what `i` represents.

Then write the recurrence and memoized solution.

---

### Problem 4 — Grid Paths

Given an `m × n` grid, start at:

```text
(0,0)
```

and move only:

```text
right
down
```

Define:

```text
ways(row, col)
```

Determine:

```text
state
base case
transitions
memo dimensions
```

Then explain why different paths can reach the same state.

---

## Level 3 — Two-dimensional state

### Problem 5 — 0/1 Knapsack

Given:

```text
weights[]
values[]
capacity
```

Define the recursive state.

A strong candidate is:

```text
solve(index, remainingCapacity)
```

Now determine:

```text
What does index mean?

What does remainingCapacity mean?

What are the choices?

What are the base cases?

Why can the same state be reached through different paths?
```

Do not implement yet. First construct the state graph.

---

### Problem 6 — Coin Change

Given:

```text
coins = [1,2,5]
amount = 11
```

Find the minimum number of coins.

Define:

```text
solve(amount)
```

Then determine whether `amount` alone is sufficient as the state.

After that, consider the variation where each coin can be used only once and determine why the state must change.

This is specifically testing whether you understand **state design**, rather than memorizing a DP template.

---

# Level 4 — Advanced

### Problem 7 — Longest Common Subsequence

Given:

```text
A = "abcde"
B = "ace"
```

Define:

```text
solve(i, j)
```

where `i` and `j` represent positions in the two strings.

Determine:

```text
What is the state?

What happens when A[i] == B[j]?

What happens when they differ?

What are the base cases?

How many unique states exist?
```

---

### Problem 8 — Word Break

Given:

```text
s = "leetcode"

dictionary = ["leet", "code"]
```

Define a recursive state that answers:

> Can the suffix beginning at position `i` be segmented?

Then determine why:

```text
solve(i)
```

is sufficient for this version.

---

# Level 5 — Deep reasoning

### Problem 9 — House Robber

Given:

```text
nums = [2,7,9,3,1]
```

You cannot rob adjacent houses.

Define:

```text
solve(i)
```

Determine:

```text
state meaning
choices
recurrence
base case
memo
```

Then trace:

```text
solve(0)
```

and identify every repeated state in the naive recursion.

---

### Problem 10 — Partition / Search State

Consider a problem where you process an array from left to right and at every position choose whether to include the element.

Suppose the final answer depends on:

```text
index
remainingSum
```

Explain why two completely different decision histories can safely share:

```text
memo[index][remainingSum]
```

_only if_ the future computation is independent of the previous history once those two values are fixed.

This is the key test for whether a proposed DP state is actually valid.

---

# The rule to carry forward

When analyzing recursive code, do not immediately ask:

> "Where is the memo array?"

Ask:

> **"What completely describes the state of this computation?"**

Then ask:

```text
Can two different recursive paths produce this exact same state?
```

If yes:

```text
same state
    ↓
same future computation
    ↓
same answer
    ↓
cache it
```

That is the conceptual bridge from **recursion → overlapping subproblems → memoization → Dynamic Programming**.

The next topic is **Bottom-Up Dynamic Programming (Tabulation)**, where we remove the recursive call stack entirely and explicitly construct the state table in dependency order.