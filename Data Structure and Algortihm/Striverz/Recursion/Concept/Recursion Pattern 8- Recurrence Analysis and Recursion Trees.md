

Now we go one level deeper into the **mathematical behavior of recursion**.

Until now, we used recursion trees mainly to visualize execution. Now we will use them to **derive time complexity from the recursive structure itself**.

The key idea is:

> A recursive algorithm is defined not only by its code, but by how the **problem size changes across recursive calls** and how much **non-recursive work** each call performs.

---

## 1. What is a recurrence?

A recurrence describes the running time of a recursive algorithm in terms of the running time of smaller instances.

For example, binary search:

```text
T(n) = T(n/2) + O(1)
```

This means:

```text
T(n)
 │
 ├── recursive work on n/2
 │
 └── constant local work
```

Merge sort:

```text
T(n) = 2T(n/2) + O(n)
```

This means:

```text
T(n)
 │
 ├── T(n/2)
 ├── T(n/2)
 └── O(n) local work
```

The recurrence is essentially a **mathematical description of the recursion tree**.

---

# 2. The three things you must extract

Whenever you see recursive code, identify exactly three things:

### A. Number of recursive calls

```text
T(n) = 2T(...)
```

means two recursive calls.

### B. Size of each recursive problem

```text
T(n/2)
```

means each child receives half the problem.

### C. Work outside recursion

```text
+ O(n)
```

means the current invocation performs linear work besides recursive calls.

Therefore:

```text
T(n) = number of recursive calls
       × cost of each smaller problem
       + local work
```

---

# 3. Binary Search

Consider:

```java
static int binarySearch(
        int[] arr,
        int left,
        int right,
        int target
) {
    if (left > right) {
        return -1;
    }

    int mid = left + (right - left) / 2;

    if (arr[mid] == target) {
        return mid;
    }

    if (target < arr[mid]) {
        return binarySearch(arr, left, mid - 1, target);
    }

    return binarySearch(arr, mid + 1, right, target);
}
```

There is exactly **one recursive call**.

The search space becomes approximately half:

```text
n
↓
n/2
↓
n/4
↓
n/8
↓
...
↓
1
```

The recurrence is:

```text
T(n) = T(n/2) + O(1)
```

---

# 4. Deriving Binary Search

After one level:

```text
n/2
```

After two:

```text
n/4
```

After three:

```text
n/8
```

After `k` levels:

```text
n / 2^k
```

The recursion stops when:

```text
n / 2^k = 1
```

Therefore:

```text
n = 2^k
```

Taking logarithm:

```text
k = log₂ n
```

Therefore:

```text
T(n) = O(log n)
```

The important point is not that binary search is "fast."

The reason is:

> **Each recursive call removes approximately half of the remaining search space.**

---

# 5. Recursion tree for Binary Search

There is only one child per node:

```text
n
│
n/2
│
n/4
│
n/8
│
n/16
│
...
│
1
```

This is technically a recursion tree, but structurally it is just a chain.

Therefore:

```text
number of levels = log n
```

and each level does:

```text
O(1)
```

work.

Hence:

```text
O(log n)
```

---

# 6. Merge Sort

Now compare this:

```text
T(n) = 2T(n/2) + O(n)
```

The recursion tree is:

```text
                         n
                    /         \
                  n/2         n/2
                /    \       /    \
              n/4    n/4   n/4    n/4
             /  \    / \   / \    / \
            ...
```

Unlike binary search, there are multiple nodes at each level.

But something interesting happens.

At level `0`:

```text
n
```

At level `1`:

```text
n/2 + n/2 = n
```

At level `2`:

```text
n/4 + n/4 + n/4 + n/4 = n
```

At every level:

```text
total work = n
```

---

# 7. Why every level costs `n`

At depth `k`:

Number of nodes:

```text
2^k
```

Size of each problem:

```text
n / 2^k
```

Therefore total problem size:

```text
2^k × n/2^k
```

The `2^k` cancels:

```text
n
```

So every level contributes:

```text
O(n)
```

---

# 8. Number of levels

The problem size progresses:

```text
n
n/2
n/4
n/8
...
1
```

Again:

```text
n / 2^k = 1
```

therefore:

```text
k = log₂ n
```

So:

```text
total work
=
work per level × number of levels
```

```text
= n × log n
```

Therefore:

```text
T(n) = O(n log n)
```

---

# 9. The general recursion-tree calculation

For a recurrence like:

```text
T(n) = aT(n/b) + f(n)
```

at depth `k`:

```text
number of nodes = a^k
```

and each node handles:

```text
n / b^k
```

Therefore the total recursive-subproblem size at that level is:

```text
a^k × n/b^k
```

which can be written as:

```text
n(a/b)^k
```

Then separately calculate the local work:

```text
a^k × f(n/b^k)
```

This gives us a systematic way to analyze the tree.

---

# 10. Three important cases

Consider:

```text
T(n) = aT(n/b) + f(n)
```

The behavior depends heavily on the relationship between:

```text
f(n)
```

and:

```text
n^(log_b a)
```

This is the foundation of the **Master Theorem**.

Define:

```text
p = log_b a
```

Then compare:

```text
f(n)
```

with:

```text
n^p
```

---

# 11. Case 1 — Recursive work dominates

Suppose:

```text
T(n) = 2T(n/2) + O(1)
```

Here:

```text
a = 2
b = 2
```

Therefore:

```text
log₂2 = 1
```

So:

```text
n^(log₂2) = n
```

But local work is:

```text
O(1)
```

The recursion itself dominates.

Result:

```text
O(n)
```

This is an interesting structure because although each individual call does constant work, the total number of calls is linear.

The recursion tree:

```text
                n
             /     \
           n/2     n/2
          /  \     /  \
        n/4 n/4  n/4 n/4
        ...
```

At the bottom there are approximately:

```text
n
```

leaves.

---

# 12. Case 2 — Both contribute equally

Merge sort:

```text
T(n) = 2T(n/2) + O(n)
```

Again:

```text
n^(log₂2) = n
```

and local work is:

```text
O(n)
```

They are the same asymptotic magnitude.

Therefore:

```text
T(n) = O(n log n)
```

The recursion tree has:

```text
log n
```

levels.

Each level costs:

```text
n
```

Therefore:

```text
n × log n
```

---

# 13. Case 3 — Local work dominates

Consider:

```text
T(n) = 2T(n/2) + O(n²)
```

The recursive structure still contains:

```text
2T(n/2)
```

but every node performs quadratic local work.

At the root:

```text
n²
```

At the next level:

```text
2 × (n/2)²
```

which equals:

```text
n²/2
```

At the next:

```text
4 × (n/4)²
```

which equals:

```text
n²/4
```

So the levels are:

```text
n²
n²/2
n²/4
n²/8
...
```

This is a geometric series:

```text
n²(1 + 1/2 + 1/4 + ...)
```

which is:

```text
O(n²)
```

Therefore:

```text
T(n) = O(n²)
```

The root dominates the total work.

---

# 14. Why recursion-tree shape matters

Consider two recurrences.

### Balanced

```text
T(n) = 2T(n/2) + n
```

Tree:

```text
                    n
                  /   \
                n/2   n/2
               / \     / \
              ...
```

Depth:

```text
log n
```

Result:

```text
O(n log n)
```

### Degenerate

```text
T(n) = T(n-1) + n
```

Tree:

```text
n
│
n-1
│
n-2
│
n-3
│
...
```

Depth:

```text
n
```

Total work:

```text
n + (n-1) + (n-2) + ... + 1
```

which is:

```text
O(n²)
```

So **the shape of the recursion tree directly determines complexity**.

---

# 15. `T(n) = T(n - 1) + O(1)`

This is one of the simplest recurrences.

Example:

```java
static void print(int n) {
    if (n == 0) {
        return;
    }

    System.out.println(n);

    print(n - 1);
}
```

Execution:

```text
n
↓
n-1
↓
n-2
↓
...
↓
1
↓
0
```

There are `n` calls.

Each performs constant work.

Therefore:

```text
T(n) = O(n)
```

The recursion depth is also:

```text
O(n)
```

---

# 16. `T(n) = T(n - 1) + O(n)`

Now suppose each call performs linear work.

```text
T(n)
=
T(n-1)
+
n
```

Expanding:

```text
T(n)
=
T(n-2)
+
(n-1)
+
n
```

Again:

```text
T(n)
=
T(n-3)
+
(n-2)
+
(n-1)
+
n
```

Eventually:

```text
T(n)
=
1 + 2 + 3 + ... + n
```

And:

```text
1 + 2 + ... + n
=
n(n+1)/2
```

Therefore:

```text
T(n) = O(n²)
```

This expansion technique is called **recursion unfolding**.

---

# 17. Recursion unfolding

Suppose:

```text
T(n) = T(n-1) + 1
```

Expand:

```text
T(n)
= T(n-2) + 1 + 1
= T(n-3) + 1 + 1 + 1
```

After `k` expansions:

```text
T(n) = T(n-k) + k
```

At the base case:

```text
n-k = 0
```

therefore:

```text
k = n
```

So:

```text
T(n) = T(0) + n
```

Therefore:

```text
O(n)
```

This is one of the most useful techniques for simple recursive algorithms.

---

# 18. Fibonacci

Now let's analyze:

```text
T(n) = T(n-1) + T(n-2) + O(1)
```

The tree is:

```text
                         n
                      /     \
                   n-1       n-2
                  /  \       / \
               n-2   n-3   n-3  n-4
               ...
```

There are many overlapping calls.

For example:

```text
T(n-2)
```

can occur through multiple branches.

The naive recursive Fibonacci therefore has exponential complexity.

More precisely:

```text
T(n) = Θ(φ^n)
```

where:

```text
φ ≈ 1.618
```

It is commonly simplified in interview discussions as:

```text
O(2^n)
```

The important concept is not the exact constant in the exponent.

The important point is:

> **The recursion tree grows exponentially because each call generates multiple calls whose problem sizes decrease only slightly.**

---

# 19. Why memoization changes everything

Naive Fibonacci:

```text
fib(5)
├── fib(4)
│   ├── fib(3)
│   └── fib(2)
└── fib(3)
    ├── fib(2)
    └── fib(1)
```

Notice:

```text
fib(3)
```

appears more than once.

And:

```text
fib(2)
```

appears even more frequently.

Memoization stores the result:

```text
fib(3) = 2
```

so subsequent requests reuse it.

The recursion tree is effectively transformed into a **DAG of unique states**.

Instead of exponential repeated computation:

```text
many repeated nodes
```

we compute each state once:

```text
fib(0)
fib(1)
fib(2)
...
fib(n)
```

giving:

```text
O(n)
```

time.

This distinction between a **tree of calls** and a **graph of unique states** will become extremely important when we later study Dynamic Programming.

---

# 20. Recursion tree vs call stack

These two are frequently confused.

Suppose:

```text
f(n)
├── f(n/2)
└── f(n/2)
```

The recursion tree contains:

```text
both branches
```

But the call stack contains only the branch currently executing.

During:

```text
f(n)
   ↓
f(n/2)
   ↓
f(n/4)
```

the stack is:

```text
TOP
│
f(n/4)
f(n/2)
f(n)
BOTTOM
```

The other `f(n/2)` branch does **not** simultaneously exist on the call stack.

It exists conceptually in the recursion tree and will be executed later.

Therefore:

```text
Recursion tree
=
entire computation

Call stack
=
current active execution path
```

---

# 21. Time complexity vs space complexity

This distinction is crucial.

Consider merge sort.

Time:

```text
O(n log n)
```

because the entire recursion tree is executed.

But recursion stack depth:

```text
O(log n)
```

because the tree is balanced.

There is also temporary array memory used during merging.

Depending on implementation:

```text
Auxiliary space = O(n)
```

So:

```text
Time  = O(n log n)
Stack = O(log n)
Extra arrays = O(n)
```

Never automatically say:

```text
recursive algorithm → O(n) space
```

You must distinguish:

```text
maximum simultaneous stack depth
```

from:

```text
total number of recursive calls
```

---

# 22. A very important example

Consider:

```java
static void f(int n) {
    if (n <= 1) {
        return;
    }

    f(n / 2);
    f(n / 2);
}
```

The number of calls is approximately:

```text
2n - 1
```

so total time is:

```text
O(n)
```

But the maximum stack depth is:

```text
O(log n)
```

because execution follows one branch at a time:

```text
n
↓
n/2
↓
n/4
↓
...
↓
1
```

This is one of the most important distinctions in recursive complexity analysis.

---

# 23. General method for analyzing recursion

When given recursive code, follow this exact process.

## Step 1 — Identify the problem size

Ask:

```text
What does n represent?
```

It could be:

```text
array length
tree height
string length
index
remaining capacity
graph vertices
```

---

## Step 2 — Count recursive calls

Determine:

```text
1 call?
2 calls?
variable number?
```

---

## Step 3 — Determine child problem sizes

Examples:

```text
n - 1
n / 2
n / 3
n/2 and n/2
```

---

## Step 4 — Determine local work

Ignore recursive calls temporarily.

Ask:

```text
What does this invocation itself do?
```

Examples:

```text
constant comparisons → O(1)

loop through n elements → O(n)

nested loops → O(n²)

merge operation → O(n)
```

---

## Step 5 — Construct recurrence

For example:

```text
2 recursive calls of n/2
+
linear merge
```

becomes:

```text
T(n) = 2T(n/2) + O(n)
```

---

## Step 6 — Visualize the recursion tree

Write:

```text
root
children
grandchildren
...
```

Then calculate work per level.

---

## Step 7 — Determine depth

Ask:

```text
How many times can n be reduced
before reaching the base case?
```

This often gives:

```text
n → n/2 → n/4
```

which means:

```text
O(log n)
```

or:

```text
n → n-1 → n-2
```

which means:

```text
O(n)
```

---

# 24. The three most important recursion reductions

You should immediately recognize these:

### Reduction by 1

```text
n → n-1 → n-2 → ...
```

Usually:

```text
depth = O(n)
```

### Reduction by a constant factor

```text
n → n/2 → n/4 → n/8
```

Usually:

```text
depth = O(log n)
```

### Multiple branches

```text
n
├── n/2
└── n/2
```

Now depth alone isn't enough.

You must calculate:

```text
number of nodes per level
×
work per node
```

This is why:

```text
2T(n/2)
```

is very different from:

```text
T(n/2)
```

---

# 25. The recursion-analysis mental model

Whenever you read:

```text
T(n) = aT(n/b) + f(n)
```

visualize:

```text
                       n
                  /    |    \
                n/b   ...   n/b
               /              \
            n/b²              n/b²
             ...
```

Then ask:

```text
1. How many nodes exist at level k?

   a^k

2. What size is each node?

   n / b^k

3. How much local work does each node perform?

   f(n / b^k)

4. How many levels exist?

   approximately log_b(n)

5. Which level contributes the most total work?
```

That is the foundation of recursion-tree analysis.

---

# Problems — Recurrence Analysis

## Easy

### 1.

Determine the complexity:

```text
T(n) = T(n - 1) + 1
```

Use expansion.

### 2.

Determine:

```text
T(n) = T(n/2) + 1
```

Draw the recursion chain.

### 3.

Determine:

```text
T(n) = 2T(n/2) + 1
```

Calculate the number of nodes at the final level.

---

## Medium

### 4.

Analyze:

```text
T(n) = 2T(n/2) + n
```

Calculate the work at:

```text
level 0
level 1
level 2
level 3
```

Then derive the final complexity.

### 5.

Analyze:

```text
T(n) = 2T(n/2) + n²
```

Determine which level dominates.

### 6.

Analyze:

```text
T(n) = 3T(n/2) + n
```

Do not immediately use the Master Theorem. Draw the first levels and determine the growth.

---

## Hard

### 7.

Analyze:

```text
T(n) = T(n-1) + T(n-2) + 1
```

Explain why the tree grows exponentially.

### 8.

Analyze:

```text
T(n) = 2T(n/2) + n log n
```

Determine the total contribution across all levels.

### 9.

Analyze:

```text
T(n) = 4T(n/2) + n
```

Determine whether the root or leaves dominate.

### 10.

Analyze:

```text
T(n) = 2T(n/2) + n²
```

and compare its recursion tree with:

```text
T(n) = 2T(n/2) + n
```

Explain precisely why one is `O(n²)` and the other is `O(n log n)`.

---

# Recursion Pattern Map

We have now built a much stronger model:

```text
                         RECURSION
                            │
          ┌─────────────────┴─────────────────┐
          │                                   │
        LINEAR                             BRANCHING
          │                                   │
     ┌────┴────┐                    ┌─────────┴─────────┐
     │         │                    │                   │
   Tail     Return              Tree Recursion     Backtracking
                                      │                   │
                                      │                choices
                                      │                   ↓
                                      │                 undo
                                      │
                                      ↓
                                Divide & Conquer
                                      │
                            ┌─────────┼─────────┐
                            │         │         │
                       Binary      Merge      Quick
                       Search      Sort       Sort
                            │         │         │
                         divide    divide    partition
                         one       two       variable
                         half      halves    halves
```

The next important step is **Master Theorem**, where we turn the recursion-tree intuition into a systematic mathematical method for solving recurrences such as:

```text
T(n) = 2T(n/2) + n
T(n) = 4T(n/2) + n
T(n) = 8T(n/2) + n²
T(n) = 3T(n/2) + n
```

After that, we should move into **binary recursion patterns in actual DSA problems**, where the recursion tree represents different algorithmic choices rather than merely subproblem decomposition.