

We now move from **Top-Down DP / Memoized Recursion** to **Bottom-Up DP / Tabulation**.

The important thing is not to memorize that "DP can use a loop." We need to understand **why the recursion can be removed**, how the dependency graph determines the iteration order, what the DP table actually represents, and how the call stack from the recursive version is replaced by explicitly stored states.

The fundamental transformation is:

```text
Top-Down:

solve(finalState)
      ↓
solve(smallerState)
      ↓
solve(smallerState)
      ↓
memoized results


Bottom-Up:

base states
    ↓
compute dependent states
    ↓
compute larger states
    ↓
final state
```

---

# 1. Start from the Fibonacci recursion

We already have:

[  
F(n)=F(n-1)+F(n-2)  
]

The recursive version:

```java
int fib(int n) {
    if (n <= 1) {
        return n;
    }

    return fib(n - 1) + fib(n - 2);
}
```

The dependency of `F(n)` is:

```text
F(n)
 │
 ├── F(n-1)
 └── F(n-2)
```

Therefore, before calculating:

```text
F(5)
```

we must know:

```text
F(4)
F(3)
```

And before calculating `F(4)`:

```text
F(3)
F(2)
```

So the dependency direction is:

```text
F(0), F(1)
      ↓
F(2)
      ↓
F(3)
      ↓
F(4)
      ↓
F(5)
```

This tells us the correct iteration order.

---

# 2. The recursive call stack disappears

Top-Down execution:

```text
fib(5)
  ↓
fib(4)
  ↓
fib(3)
  ↓
fib(2)
  ↓
fib(1)
```

There is an active call stack:

```text
TOP
│
├── fib(1)
├── fib(2)
├── fib(3)
├── fib(4)
└── fib(5)
BOTTOM
```

Bottom-Up does not create those calls.

Instead:

```text
dp[0] = 0
dp[1] = 1

dp[2] = dp[1] + dp[0]
dp[3] = dp[2] + dp[1]
dp[4] = dp[3] + dp[2]
dp[5] = dp[4] + dp[3]
```

The table itself replaces the recursive computation history.

---

# 3. What does `dp[i]` mean?

This is the most important question in tabulation.

For Fibonacci:

> `dp[i]` means the Fibonacci value for state `i`.

Therefore:

```text
dp[0] = F(0)
dp[1] = F(1)
dp[2] = F(2)
dp[3] = F(3)
...
```

The table is:

```text
index:  0  1  2  3  4  5
value:  0  1  1  2  3  5
```

The table is not merely "an array used for optimization."

It is a **materialized representation of DP states**.

---

# 4. Bottom-Up Fibonacci

```java
public static int fib(int n) {
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

The execution is:

```text
dp[0] = 0
dp[1] = 1

i = 2
dp[2] = dp[1] + dp[0]
      = 1 + 0
      = 1

i = 3
dp[3] = dp[2] + dp[1]
      = 1 + 1
      = 2

i = 4
dp[4] = dp[3] + dp[2]
      = 2 + 1
      = 3

i = 5
dp[5] = dp[4] + dp[3]
      = 3 + 2
      = 5
```

Final:

```text
dp[5] = 5
```

---

# 5. The DP table is a state graph materialized in memory

Recall our previous concept.

The recursive DP problem can be represented as:

```text
F(0) ← F(2) ← F(4)
F(1) ← F(2) ← F(4)
F(1) ← F(3) ← F(5)
F(2) ← F(3) ← F(5)
```

A more useful dependency representation is:

```text
             F(5)
            /    \
          F(4)   F(3)
         /   \   /   \
       F(3) F(2) F(2) F(1)
       / \
     F(2) F(1)
```

Memoization says:

```text
"Whenever I need a state, check whether I already computed it."
```

Tabulation says:

```text
"I know the dependency order, so I'll compute every required state once in that order."
```

That is the fundamental difference.

---

# 6. Top-Down vs Bottom-Up execution

|Property|Top-Down Memoization|Bottom-Up Tabulation|
|---|---|---|
|Starting point|Final state|Base states|
|Mechanism|Recursion|Iteration|
|Call stack|Required|Not required|
|State storage|Memo|DP table|
|Evaluation order|Determined by recursion|Explicitly chosen|
|Unreachable states|Can remain uncomputed|Often computed unless optimized|
|Stack overflow risk|Possible|None from recursion|
|State dependencies|Discovered dynamically|Must determine order explicitly|

The important relationship is:

```text
Top-Down:
"Ask for what I need."

Bottom-Up:
"Build everything I need before asking for it."
```

---

# 7. Dependency order is the heart of tabulation

Suppose:

[  
dp[i]=dp[i-1]+dp[i-2]  
]

Then:

```text
dp[i]
```

depends on:

```text
dp[i-1]
dp[i-2]
```

Therefore the iteration must satisfy:

```text
i-1 < i
i-2 < i
```

So:

```text
0 → 1 → 2 → 3 → 4 → ...
```

is valid.

But this would be invalid:

```text
5 → 4 → 3 → 2 → 1 → 0
```

because when calculating `dp[5]`, the required states haven't been established in the table yet.

So:

> **Bottom-Up DP is fundamentally an exercise in finding a valid evaluation order for the state dependencies.**

---

# 8. This is essentially topological ordering

A DP state graph is usually a **DAG — Directed Acyclic Graph**.

For Fibonacci:

```text
F(0) ──→ F(2) ──→ F(4)
F(1) ──→ F(2) ──→ F(4)

F(1) ──→ F(3) ──→ F(5)
F(2) ──→ F(3) ──→ F(5)
F(3) ──→ F(5)
F(4) ──→ F(5)
```

A bottom-up solution chooses an order where:

```text
dependency
    ↓
dependent state
```

So:

```text
F(0), F(1)
      ↓
F(2)
      ↓
F(3)
      ↓
F(4)
      ↓
F(5)
```

This is closely related to **topological ordering of a DAG**.

You do not need to explicitly run a topological-sort algorithm for normal 1D DP, because the state indices already give us the order.

---

# 9. The general tabulation procedure

When converting a recursive DP solution into bottom-up DP, follow this sequence.

## Step 1 — Define the state

Suppose:

```text
solve(i)
```

means:

> Answer for the problem beginning at index `i`.

Then:

```text
dp[i]
```

represents the same thing.

---

## Step 2 — Identify base cases

If recursion says:

```java
if (i == n) {
    return 0;
}
```

then:

```text
dp[n] = 0
```

becomes the corresponding table initialization.

---

## Step 3 — Identify dependencies

If:

```text
solve(i)
```

uses:

```text
solve(i + 1)
solve(i + 2)
```

then:

```text
dp[i]
```

depends on:

```text
dp[i + 1]
dp[i + 2]
```

---

## Step 4 — Reverse the dependency direction

If `i` depends on larger indices:

```text
dp[i]
 ↓
dp[i+1]
dp[i+2]
```

then we must calculate from:

```text
n → n-1 → n-2 → ...
```

rather than:

```text
0 → 1 → 2 → ...
```

---

# 10. Example: Climbing Stairs

Recall:

[  
ways(n)=ways(n-1)+ways(n-2)  
]

Base:

[  
ways(0)=1  
]

and:

[  
ways(1)=1  
]

Tabulation:

```java
public static int climbStairs(int n) {
    int[] dp = new int[n + 1];

    dp[0] = 1;

    if (n >= 1) {
        dp[1] = 1;
    }

    for (int i = 2; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
    }

    return dp[n];
}
```

The table for `n = 5`:

```text
i:       0   1   2   3   4   5
dp[i]:   1   1   2   3   5   8
```

Interpretation:

```text
dp[3] = number of ways to reach stair 3
```

Not:

```text
"some intermediate number"
```

Every cell has a precise semantic meaning.

---

# 11. A common mistake: wrong `dp` meaning

Suppose the problem asks:

> Minimum cost to reach the top.

You must not randomly define:

```text
dp[i] = cost paid at i
```

unless that is actually the required state.

Instead define something like:

> `dp[i]` = minimum cost required to reach the top from state `i`.

Then derive the recurrence from that definition.

This gives:

```text
dp[i]
=
cost[i] + min(
    dp[i + 1],
    dp[i + 2]
)
```

The recurrence follows the state definition.

Not the other way around.

---

# 12. Example: Minimum Cost Climbing Stairs

Consider:

```text
cost = [10, 15, 20]
```

Suppose:

```text
dp[i]
```

means:

> Minimum cost to reach the top starting from stair `i`.

Then:

```text
dp[3] = 0
```

because position `3` is the top.

For `i = 2`:

```text
dp[2] = 20 + min(dp[3], dp[4])
```

Depending on the exact problem formulation, the boundary must be defined carefully.

This illustrates an important DP principle:

> **The base state is not necessarily an input index. It represents the point where no further decisions are required.**

---

# 13. Two-dimensional DP

Now move beyond one-dimensional state.

Suppose we have:

```text
solve(row, col)
```

Then:

```text
dp[row][col]
```

stores the answer for that state.

A classic example is grid paths.

You start at:

```text
(0,0)
```

and can move:

```text
right
down
```

The number of paths to `(row, col)` is:

# [  
dp[row][col]

dp[row-1][col]  
+  
dp[row][col-1]  
]

because the final move must have come from either:

```text
(row - 1, col)
```

or:

```text
(row, col - 1)
```

---

# 14. Visualizing the grid DP table

For a `3 × 4` grid:

```text
        col
       0  1  2  3
row 0  1  1  1  1
row 1  1  2  3  4
row 2  1  3  6 10
```

Each cell means:

```text
dp[row][col]
=
number of ways to reach this cell
```

For example:

```text
dp[2][2] = 6
```

because:

```text
dp[2][2]
   ↑
dp[1][2] = 3

dp[2][2]
   ←
dp[2][1] = 3

3 + 3 = 6
```

---

# 15. Grid execution order

The dependency is:

```text
dp[row][col]
    ↓
dp[row-1][col]
dp[row][col-1]
```

Therefore we need:

```text
previous row
+
previous column
```

before calculating the current cell.

So we process:

```text
row = 0 → n
    col = 0 → m
```

Visual execution:

```text
→ → → →
→ → → →
→ → → →
```

The first row and first column are base states.

Then every remaining cell can be computed.

---

# 16. Grid implementation

```java
public static int uniquePaths(int rows, int cols) {
    int[][] dp = new int[rows][cols];

    for (int col = 0; col < cols; col++) {
        dp[0][col] = 1;
    }

    for (int row = 0; row < rows; row++) {
        dp[row][0] = 1;
    }

    for (int row = 1; row < rows; row++) {
        for (int col = 1; col < cols; col++) {
            dp[row][col] =
                    dp[row - 1][col] +
                    dp[row][col - 1];
        }
    }

    return dp[rows - 1][cols - 1];
}
```

The recurrence:

```text
dp[row][col]
=
dp[row-1][col]
+
dp[row][col-1]
```

directly corresponds to the two possible previous states.

---

# 17. Why no recursion is necessary

The recursive formulation would be:

```text
solve(row, col)
    ↓
solve(row - 1, col)
solve(row, col - 1)
```

But once we know the dependency order, recursion adds no algorithmic value.

We can explicitly evaluate:

```text
(0,0)
(0,1)
(0,2)
...
(1,0)
(1,1)
...
```

Therefore:

```text
recursive control flow
```

can be replaced by:

```text
explicit iteration order
```

The DP table stores the results that recursion would otherwise retrieve.

---

# 18. The call stack has been replaced by the table

Top-Down:

```text
Call Stack
────────────────
solve(0,0)
solve(0,1)
solve(0,2)
...
```

Bottom-Up:

```text
DP Table
────────────────
dp[0][0]
dp[0][1]
dp[0][2]
...
```

The important difference:

```text
Top-Down:
stack determines what is currently being evaluated.

Bottom-Up:
loop order determines what is currently being evaluated.
```

---

# 19. Space optimization

Now comes another major DP concept.

Suppose:

```text
dp[i] = dp[i-1] + dp[i-2]
```

Do we really need:

```text
dp[0...n]
```

to calculate `dp[n]`?

No.

To calculate the next state, we only need:

```text
previous 2 states
```

So:

```java
public static int fib(int n) {
    if (n <= 1) {
        return n;
    }

    int prev2 = 0;
    int prev1 = 1;

    for (int i = 2; i <= n; i++) {
        int current = prev1 + prev2;

        prev2 = prev1;
        prev1 = current;
    }

    return prev1;
}
```

Space becomes:

[  
O(1)  
]

instead of:

[  
O(n)  
]

---

# 20. Why space optimization works

Original table:

```text
dp[0] dp[1] dp[2] dp[3] dp[4] dp[5]
  ↑     ↑
             used for next state
```

To calculate `dp[i]`, only:

```text
dp[i-1]
dp[i-2]
```

are needed.

Once `dp[i]` is calculated, older values are never needed again.

So we maintain:

```text
prev2 = dp[i-2]
prev1 = dp[i-1]
current = dp[i]
```

State evolution:

```text
Initial:

prev2 = F(0)
prev1 = F(1)

After i=2:

prev2 = F(1)
prev1 = F(2)

After i=3:

prev2 = F(2)
prev1 = F(3)

After i=4:

prev2 = F(3)
prev1 = F(4)
```

We are effectively sliding a two-state window over the DP sequence.

---

# 21. Two-dimensional space optimization

Suppose:

```text
dp[row][col]
```

depends only on:

```text
dp[row-1][col]
dp[row][col-1]
```

Then we may not need the entire 2D table.

We can potentially maintain only:

```text
previous row
current row
```

or even one row with careful update ordering.

For example:

```text
previous row
[1, 1, 1, 1]

current row
[1, 2, 3, 4]
```

After completing the current row, it becomes the previous row for the next iteration.

This reduces:

[  
O(rows \times cols)  
]

space to:

[  
O(cols)  
]

when the recurrence permits it.

---

# 22. But do not optimize space immediately

There is an important engineering principle here.

First write:

```text
correct recurrence
+
full DP table
```

Then optimize.

Why?

Because the full table gives you:

```text
clear state representation
easy debugging
easy state visualization
easy recurrence verification
```

Only after correctness should you ask:

> Which previous states are actually required?

This is especially important while learning DP.

---

# 23. Bottom-Up DP and dependency direction

Consider two recurrences.

### Case A

```text
dp[i] depends on dp[i-1]
```

Process:

```text
0 → 1 → 2 → 3
```

### Case B

```text
dp[i] depends on dp[i+1]
```

Process:

```text
n → n-1 → n-2 → 0
```

For example:

[  
dp[i]=1+\min(dp[i+1],dp[i+2])  
]

requires:

```text
i+1
i+2
```

Therefore we must calculate from right to left.

This is why blindly writing:

```java
for (int i = 0; i < n; i++)
```

is dangerous.

The **recurrence determines the loop direction**.

---

# 24. The general conversion rule

Suppose your recursive function is:

```text
solve(state)
```

and it calls:

```text
solve(nextState)
```

Then ask:

> What states must already exist before `state` can be computed?

Those states determine the bottom-up order.

For example:

```text
solve(i)
 ↓
solve(i+1)
solve(i+2)
```

means:

```text
dp[i]
depends on
dp[i+1], dp[i+2]
```

Therefore:

```text
i = n
n-1
n-2
...
0
```

---

# 25. Example: House Robber

Now let's use a more realistic DP problem.

Given:

```text
nums = [2, 7, 9, 3, 1]
```

You cannot rob adjacent houses.

Define:

```text
dp[i]
```

as:

> Maximum money that can be obtained from the first `i` houses.

For house `i`, there are two possibilities:

```text
don't rob current house
```

or:

```text
rob current house
```

If we rob it, the previous house cannot be robbed.

Therefore:

# [  
dp[i]

\max(  
dp[i-1],  
dp[i-2]+nums[i]  
)  
]

The state transition is:

```text
              dp[i]
             /     \
        skip i     rob i
          ↓          ↓
       dp[i-1]   dp[i-2] + nums[i]
```

---

# 26. House Robber table

For:

```text
[2,7,9,3,1]
```

we can represent:

```text
houses:  0   1   2   3   4
money:   2   7   9   3   1
```

DP:

```text
dp[0] = 0
dp[1] = 2
```

Then:

```text
dp[2] = max(dp[1], dp[0] + 7)
      = max(2, 7)
      = 7

dp[3] = max(dp[2], dp[1] + 9)
      = max(7, 11)
      = 11

dp[4] = max(dp[3], dp[2] + 3)
      = max(11, 10)
      = 11

dp[5] = max(dp[4], dp[3] + 1)
      = max(11, 12)
      = 12
```

Result:

```text
12
```

The state table is:

```text
i:    0   1   2   3   4   5
dp:   0   2   7  11  11  12
```

Notice that `i` represents **number of processed houses**, not the array index directly.

This is a subtle but important state-definition decision.

---

# 27. State semantics must remain consistent

If you define:

```text
dp[i] = answer for first i elements
```

then:

```text
dp[0]
```

means:

```text
answer for zero elements
```

and:

```text
dp[1]
```

means:

```text
answer for first element
```

The original array index is therefore:

```text
i - 1
```

This is why:

```text
dp[i-2] + nums[i-1]
```

may appear in the implementation.

Many DP bugs come from mixing:

```text
state index
```

with:

```text
input array index
```

---

# 28. DP table is not always the answer array

The table is an internal representation of states.

For example:

```text
dp[i] = maximum value using first i items
```

The final answer may be:

```text
dp[n]
```

But in another problem:

```text
dp[i][j]
```

may represent:

```text
minimum cost to transform prefix A[0..i)
into prefix B[0..j)
```

The important thing is the **semantic contract of each cell**.

Never start with:

```text
"Let's make a dp array."
```

Start with:

```text
"What does one state mean?"
```

Then derive the table.

---

# 29. The four components of tabulation

A well-designed bottom-up DP solution has four components.

```text
1. State definition
       ↓
2. Base states
       ↓
3. Transition
       ↓
4. Evaluation order
```

For example:

### State

```text
dp[i] = maximum money using first i houses
```

### Base states

```text
dp[0] = 0
dp[1] = nums[0]
```

### Transition

```text
dp[i] = max(
    dp[i-1],
    dp[i-2] + nums[i-1]
)
```

### Order

```text
i = 2 → n
```

That is the complete DP design.

---

# 30. Top-Down and Bottom-Up are mathematically equivalent

Suppose we have:

```text
solve(i)
```

and:

```text
dp[i]
```

The two approaches compute the same recurrence.

Top-Down:

```text
solve(i)
    ↓
solve(i+1)
solve(i+2)
    ↓
memo[i]
```

Bottom-Up:

```text
dp[i+2]
dp[i+1]
    ↓
dp[i]
```

The difference is **evaluation strategy**, not the mathematical state model.

This is extremely important.

You should be able to derive both from the same recurrence.

---

# 31. What bottom-up removes

Bottom-up DP removes:

```text
recursive function calls
call stack
recursive branching
```

But it does **not** remove:

```text
states
transitions
base cases
dependencies
```

Those remain.

So DP is not fundamentally about recursion.

It is about:

> **Representing a finite set of overlapping subproblems and computing each required state once.**

Recursion + memoization is one implementation strategy.

Iteration + table is another.

---

# 32. A deeper visualization

Think of the DP state graph:

```text
        S0
       /  \
     S1    S2
      \    / \
       S3    S4
         \  /
          S5
```

Top-Down:

```text
Start at S5
   ↓
discover S3
   ↓
discover S1/S2
   ↓
compute upward
```

Bottom-Up:

```text
Start with S0
   ↓
compute S1/S2
   ↓
compute S3/S4
   ↓
compute S5
```

Same graph.

Different traversal direction.

---

# 33. Problems — Bottom-Up DP

Now solve these **without immediately coding**. First construct the state table and dependency direction.

## Level 1 — Basic

### 1. Fibonacci

For:

```text
n = 10
```

construct:

```text
dp[0...10]
```

Then reduce the implementation to `O(1)` space.

---

### 2. Climbing Stairs

For:

```text
n = 6
```

construct the complete table.

Write:

```text
dp[i] = ?
```

Then identify exactly which previous cells are necessary.

---

## Level 2 — One-dimensional DP

### 3. House Robber

Given:

```text
[2, 7, 9, 3, 1]
```

Construct the DP table manually.

For every `i`, record:

```text
skip current
rob current
chosen value
```

Then derive the `O(1)` space version.

---

### 4. Min Cost Climbing Stairs

Given:

```text
[10, 15, 20]
```

Define the state first.

Then determine whether your iteration should move:

```text
left → right
```

or:

```text
right → left
```

and explain why.

---

# Level 3 — Two-dimensional DP

### 5. Unique Paths

For a:

```text
3 × 4
```

grid, construct the entire table.

Then explain why:

```text
dp[row][col]
```

depends only on:

```text
dp[row-1][col]
dp[row][col-1]
```

---

### 6. Minimum Path Sum

Given:

```text
1  3  1
1  5  1
4  2  1
```

Find the minimum cost from top-left to bottom-right.

Define:

```text
dp[row][col]
```

and manually construct the table.

---

# Level 4 — Core interview DP

### 7. 0/1 Knapsack

Given:

```text
weights = [1, 3, 4, 5]
values  = [1, 4, 5, 7]
capacity = 7
```

Construct:

```text
dp[index][capacity]
```

Do not start coding.

First determine:

```text
What does every cell mean?
What are the base states?
What are the two choices?
What is the transition?
What is the iteration order?
```

This problem is especially important because it introduces **choice-based 2D DP**.

---

### 8. Longest Common Subsequence

Given:

```text
A = "abcde"
B = "ace"
```

Construct:

```text
dp[i][j]
```

where each cell represents the LCS length for the relevant prefixes.

Determine the recurrence for:

```text
A[i-1] == B[j-1]
```

and:

```text
A[i-1] != B[j-1]
```

Then determine the table traversal order.

---

# Level 5 — Advanced state reasoning

### 9. Coin Change

Given:

```text
coins = [1, 2, 5]
amount = 11
```

Find the minimum number of coins.

Construct:

```text
dp[0...11]
```

and determine why:

```text
dp[amount]
```

can be computed from smaller amounts.

Then derive the complexity:

[  
O(amount \times numberOfCoins)  
]

---

### 10. Longest Increasing Subsequence

Given:

```text
[10, 9, 2, 5, 3, 7, 101, 18]
```

Start with the classical:

```text
dp[i]
```

state.

Define exactly:

> What does `dp[i]` mean?

Then derive the transition from every previous index `j` where:

```text
j < i
nums[j] < nums[i]
```

This is an important example because the dependency is **not simply `i-1` or `i-2`**.

---

# The DP progression so far

You should now mentally connect all three stages:

```text
                    RECURSIVE PROBLEM
                           │
                           ↓
                 identify recursive state
                           │
                           ↓
                 repeated states?
                    /            \
                  NO              YES
                  │                │
           ordinary recursion     DP
                                   │
                    ┌──────────────┴──────────────┐
                    ↓                             ↓
              Top-Down                       Bottom-Up
             Memoization                    Tabulation
                    │                             │
              recursive calls              explicit loops
                    │                             │
                memo[state]                 dp[state]
                    │                             │
                    └──────────────┬──────────────┘
                                   ↓
                           SAME STATE MODEL
```

And the deeper model is:

```text
                   DP STATE GRAPH
                         │
             ┌───────────┴───────────┐
             ↓                       ↓
       Top-Down traversal      Bottom-Up traversal
             ↓                       ↓
       discover states          order states
       as required             by dependency
             ↓                       ↓
       cache results            fill table
```

The next important topic is **DP state-space optimization and recurrence construction**: how to systematically go from a problem statement to **state → base case → transition → iteration order → complexity**, including **0/1 Knapsack, Unbounded Knapsack, LCS/LIS, and interval-style DP**. This is where DP stops being a collection of patterns and becomes a systematic problem-solving method.