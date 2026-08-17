
We now reach the first recursion pattern where the **shape of the recursive computation changes fundamentally**.

Until now, one invocation produced at most one recursive child:

```text
f(n)
 |
f(n-1)
 |
f(n-2)
 |
...
```

Now an invocation can produce **two or more recursive calls**:

```text
                    f(n)
                  /      \
              f(n-1)     f(n-2)
              /   \       /   \
           ...    ...   ...   ...
```

This creates a **recursion tree**.

The most important distinction for this topic is:

> **The recursion tree represents the complete dependency structure of the computation, while the call stack represents only the currently active path through that tree.**

That distinction is fundamental.

---

# 1. The simplest multiple-recursion example

Consider Fibonacci:

```java
static int fib(int n) {
    if (n <= 1) {
        return n;
    }

    return fib(n - 1) + fib(n - 2);
}
```

For:

```text
fib(5)
```

the function needs two independent results:

```text
fib(5)
    ↓
fib(4) + fib(3)
```

Therefore the recursive structure becomes:

```text
                    fib(5)
                   /      \
              fib(4)      fib(3)
              /   \        /   \
         fib(3) fib(2) fib(2) fib(1)
         /   \
      fib(2) fib(1)
      /   \
   fib(1) fib(0)
```

This is no longer a chain.

It is a **tree of recursive subproblems**.

---

# 2. Why does the second recursive call wait?

Look carefully at:

```java
return fib(n - 1) + fib(n - 2);
```

The CPU cannot calculate:

```text
fib(n - 1) + fib(n - 2)
```

until both values are available.

Suppose we execute:

```text
fib(5)
```

The first call is:

```text
fib(4)
```

The second call:

```text
fib(3)
```

cannot execute until the runtime finishes evaluating `fib(4)`.

So conceptually:

```text
fib(5)
│
├── evaluate fib(4)
│      │
│      └── completely resolve fib(4)
│
└── evaluate fib(3)
       │
       └── resolve fib(3)
```

The parent frame therefore maintains state representing:

```text
fib(5)
├── firstResult = ?
├── secondResult = ?
└── pending operation = firstResult + secondResult
```

---

# 3. The call stack is NOT the recursion tree

This distinction deserves special attention.

The recursion tree for `fib(5)` contains many nodes:

```text
                    fib(5)
                   /      \
              fib(4)      fib(3)
              /   \        /   \
         fib(3) fib(2) fib(2) fib(1)
         /   \
      fib(2) fib(1)
      /   \
   fib(1) fib(0)
```

But the call stack at one particular moment contains only one path.

When evaluating the leftmost branch:

```text
fib(5)
 → fib(4)
   → fib(3)
     → fib(2)
       → fib(1)
```

the active stack is:

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

The other branches are **not active yet**.

They exist in the recursion tree as future computation, but they are not currently occupying stack frames.

Therefore:

```text
Recursion tree
    = all recursive invocations that will occur

Call stack
    = currently active invocation path
```

This distinction becomes extremely important when analyzing space complexity.

---

# 4. Execute `fib(5)` precisely

Let's follow the actual computation.

Start:

```text
fib(5)
```

Its state is conceptually:

```text
Frame fib(5)

n = 5

first child:
    fib(4) → not resolved

second child:
    fib(3) → not started

pending:
    firstResult + secondResult
```

The runtime begins evaluating:

```text
fib(4)
```

Now:

```text
fib(5)
└── waiting for fib(4)

    fib(4)
```

`fib(4)` needs:

```text
fib(3)
+
fib(2)
```

So:

```text
fib(5)
└── fib(4)
    └── fib(3)
```

Then `fib(3)` needs:

```text
fib(2)
+
fib(1)
```

So:

```text
fib(5)
└── fib(4)
    └── fib(3)
        └── fib(2)
```

Then:

```text
fib(2)
```

needs:

```text
fib(1)
+
fib(0)
```

So:

```text
fib(5)
└── fib(4)
    └── fib(3)
        └── fib(2)
            └── fib(1)
```

`fib(1)` reaches the base case.

```text
fib(1) → 1
```

Now `fib(2)` has:

```text
firstResult = 1
```

It still needs:

```text
fib(0)
```

So:

```text
fib(2)
├── fib(1) → 1
└── fib(0)
```

`fib(0)` returns:

```text
0
```

Now:

```text
fib(2)
= 1 + 0
= 1
```

So the value propagates upward.

---

# 5. Return propagation through the tree

We now have:

```text
fib(2) → 1
```

Therefore:

```text
fib(3)
```

has:

```text
fib(2) → 1
fib(1) → 1
```

So:

```text
fib(3)
= 1 + 1
= 2
```

Then:

```text
fib(4)
```

still needs its second child:

```text
fib(2)
```

That produces:

```text
fib(2) → 1
```

Therefore:

```text
fib(4)
= fib(3) + fib(2)
= 2 + 1
= 3
```

Now finally:

```text
fib(5)
```

has:

```text
fib(4) → 3
```

It then evaluates:

```text
fib(3) → 2
```

Therefore:

```text
fib(5)
= 3 + 2
= 5
```

---

# 6. The parent's state changes between child calls

This is one of the most important internal details.

Suppose we are evaluating:

```text
fib(4)
```

Its conceptual state starts as:

```text
fib(4)

firstResult  = ?
secondResult = ?

pending:
    firstResult + secondResult
```

After `fib(3)` returns:

```text
fib(4)

firstResult  = 2
secondResult = ?

pending:
    2 + secondResult
```

Now the runtime evaluates:

```text
fib(2)
```

After it returns:

```text
fib(4)

firstResult  = 2
secondResult = 1

pending:
    2 + 1
```

Then:

```text
return 3
```

So the parent frame progressively moves through states:

```text
UNKNOWN
   ↓
PARTIALLY RESOLVED
   ↓
FULLY RESOLVED
   ↓
RETURN
```

This is the state-machine view of multiple recursion.

---

# 7. Why Fibonacci is expensive

Notice something in the tree:

```text
fib(5)
├── fib(4)
│   ├── fib(3)
│   └── fib(2)
└── fib(3)
    ├── fib(2)
    └── fib(1)
```

`fib(3)` appears twice.

And:

```text
fib(2)
```

appears multiple times.

For larger values, the duplication becomes massive.

For example:

```text
fib(6)
```

contains repeated subproblems:

```text
fib(4)
fib(3)
fib(2)
```

multiple times.

The recursion does not remember that it already solved them.

So the same state gets recomputed.

---

# 8. Recursion tree vs unique subproblems

This leads to an important distinction.

For Fibonacci:

```text
fib(10)
```

there are many **recursive invocations**.

But the possible states are only:

```text
fib(10)
fib(9)
fib(8)
...
fib(1)
fib(0)
```

So:

```text
Number of unique states = O(n)
```

while:

```text
Number of recursive invocations = exponential
```

This observation is the foundation of **Dynamic Programming**.

We will eventually transform:

```text
repeated recursive computation
```

into:

```text
compute each state once
+
reuse its result
```

But first we need to understand the recursion tree completely.

---

# 9. Recurrence relation

For Fibonacci:

```text
T(n) = T(n - 1) + T(n - 2) + O(1)
```

The number of calls grows exponentially.

More precisely, the time complexity is:

```text
O(φⁿ)
```

where:

```text
φ ≈ 1.618
```

It is commonly simplified in interview discussions as:

```text
O(2ⁿ)
```

because each invocation branches into approximately two recursive calls.

The exact mathematical bound is tighter than `O(2ⁿ)`, but `O(2ⁿ)` is a useful coarse upper bound.

---

# 10. Why the space is not O(2ⁿ)

This is where the recursion tree / stack distinction becomes critical.

The recursion tree has exponentially many nodes:

```text
O(2ⁿ)
```

But the call stack only follows one active path at a time.

For Fibonacci:

```text
fib(n)
 ↓
fib(n-1)
 ↓
fib(n-2)
 ↓
...
```

Maximum depth is approximately:

```text
n
```

Therefore:

```text
Stack space = O(n)
```

So:

```text
Time  = O(2ⁿ)   approximately
Space = O(n)
```

Do not calculate recursive space by counting every node in the recursion tree.

For normal depth-first recursive execution:

> **Auxiliary stack space is determined primarily by maximum simultaneous depth, not total number of recursive calls.**

---

# 11. Multiple recursion with three branches

Multiple recursion is not limited to two calls.

Consider:

```java
static int f(int n) {
    if (n <= 0) {
        return 1;
    }

    return f(n - 1)
         + f(n - 2)
         + f(n - 3);
}
```

Now each node can produce three children:

```text
                    f(n)
              /       |       \
          f(n-1)    f(n-2)    f(n-3)
```

The recurrence becomes:

```text
T(n)
=
T(n-1)
+
T(n-2)
+
T(n-3)
+
O(1)
```

The important property is not specifically "two calls."

It is:

> **One invocation creates multiple recursive subproblems.**

---

# 12. A more useful generic structure

Multiple recursion generally looks like:

```java
static Result solve(State state) {

    if (baseCondition(state)) {
        return baseResult;
    }

    Result result1 = solve(subproblem1(state));

    Result result2 = solve(subproblem2(state));

    return combine(result1, result2);
}
```

The state flow is:

```text
                    Current State
                         │
              ┌──────────┴──────────┐
              ↓                     ↓
        Subproblem A          Subproblem B
              │                     │
              ↓                     ↓
           Result A              Result B
              │                     │
              └──────────┬──────────┘
                         ↓
                    Combination
                         │
                         ↓
                  Current Result
```

This structure appears in:

- Fibonacci
    
- merge sort
    
- tree algorithms
    
- divide-and-conquer
    
- recursive search
    
- many backtracking algorithms
    

But these algorithms can have **very different meanings**, even though their recursion shape looks similar.

---

# 13. Multiple recursion vs divide-and-conquer

Do not equate the two.

Multiple recursion means:

```text
one invocation
→ multiple recursive calls
```

Divide-and-conquer adds another property:

```text
one problem
→ multiple smaller subproblems
→ solve them independently
→ combine results
```

For example, merge sort:

```text
sort(array)
      │
      ├── sort(left)
      │
      └── sort(right)
               │
               ↓
             merge
```

This is multiple recursion **and** divide-and-conquer.

Fibonacci:

```text
fib(n)
├── fib(n-1)
└── fib(n-2)
```

is multiple recursion, but it is not an efficient divide-and-conquer algorithm because the subproblems overlap heavily.

---

# 14. Independent vs overlapping subproblems

This is a major distinction.

### Fibonacci

```text
fib(5)
├── fib(4)
│   └── fib(3)
└── fib(3)
```

The same state:

```text
fib(3)
```

appears in multiple branches.

Therefore:

```text
OVERLAPPING SUBPROBLEMS
```

---

### Merge sort

Suppose:

```text
[1, 2, 3, 4, 5, 6, 7, 8]
```

is split:

```text
[1,2,3,4]       [5,6,7,8]
```

then:

```text
[1,2] [3,4]     [5,6] [7,8]
```

Each subarray is different.

The same subproblem isn't repeatedly computed.

Therefore:

```text
NON-OVERLAPPING SUBPROBLEMS
```

This difference explains why naive Fibonacci recursion is inefficient while merge sort is efficient.

---

# 15. A recursion tree is a computation dependency graph

For Fibonacci:

```text
fib(5)
```

the tree says:

```text
fib(5) depends on:
    fib(4)
    fib(3)

fib(4) depends on:
    fib(3)
    fib(2)

...
```

Therefore the tree represents **dependency relationships**.

Each node contains:

```text
State
+
subproblem states
+
pending combination
```

For:

```text
fib(5)
```

the root state is:

```text
n = 5
```

Its children are:

```text
n = 4
n = 3
```

Its result is:

```text
result(5)
=
result(4)
+
result(3)
```

This state/dependency perspective becomes extremely useful when we later convert recursive algorithms into dynamic programming.

---

# 16. The call stack while traversing the tree

Let's isolate one moment.

Suppose we are evaluating:

```text
fib(5)
 → fib(4)
   → fib(3)
     → fib(2)
       → fib(1)
```

The active stack is:

```text
TOP
│
├── fib(1)
│
├── fib(2)
│
├── fib(3)
│
├── fib(4)
│
└── fib(5)
BOTTOM
```

Now `fib(1)` returns.

The stack becomes:

```text
TOP
│
├── fib(2)
│
├── fib(3)
│
├── fib(4)
│
└── fib(5)
BOTTOM
```

`fib(2)` then evaluates its second child:

```text
fib(0)
```

So:

```text
TOP
│
├── fib(0)
├── fib(2)
├── fib(3)
├── fib(4)
└── fib(5)
BOTTOM
```

Notice what happened.

The stack did **not** simultaneously contain:

```text
fib(1)
fib(0)
```

because they are evaluated sequentially.

This is why total tree size and maximum stack depth are different complexity measurements.

---

# 17. Multiple recursion and execution order

Consider:

```java
static void f(int n) {
    if (n <= 0) {
        return;
    }

    f(n - 1);
    f(n - 2);

    System.out.println(n);
}
```

For each node:

```text
first child
    ↓
return
    ↓
second child
    ↓
return
    ↓
process current node
```

So the parent frame can be visualized as:

```text
f(n)

state:
    firstResult = unresolved
    secondResult = unresolved

execute:
    f(n-1)

after first returns:
    firstResult = resolved

execute:
    f(n-2)

after second returns:
    secondResult = resolved

execute:
    process(n)

return
```

This is essentially a **postorder-style execution over a recursion tree**.

---

# 18. Multiple recursion and state transitions

For a linear recursive function:

```text
State(n)
   ↓
State(n-1)
```

There is one transition.

For multiple recursion:

```text
State(n)
      │
      ├── State A
      │
      └── State B
```

There are multiple transitions from one state.

Therefore, the recursive algorithm can be viewed as exploring a state-space tree:

```text
                State S
              /         \
          State A       State B
          /    \        /    \
        ...    ...    ...    ...
```

This viewpoint becomes especially important for **backtracking**, where each branch represents a different choice.

---

# 19. Multiple recursion is not automatically exponential

This is another important point.

Suppose:

```java
static void traverse(Node node) {
    if (node == null) {
        return;
    }

    traverse(node.left);
    traverse(node.right);
}
```

This has two recursive calls, but if it traverses a binary tree containing `n` nodes:

```text
Time = O(n)
```

Why?

Because each tree node is visited once.

The fact that there are two recursive calls does **not automatically mean O(2ⁿ)**.

Complexity depends on:

```text
number of recursive subproblems
+
size of each subproblem
+
whether subproblems overlap
+
amount of work per invocation
```

For Fibonacci, overlapping recursive states cause exponential recomputation.

For a binary tree traversal, each actual node is processed once.

---

# 20. Compare Fibonacci and tree traversal

|Property|Fibonacci|Binary Tree Traversal|
|---|---|---|
|Recursive calls|2|2|
|Structure|Recursive computation tree|Input tree|
|Overlapping states|Yes|Usually no|
|Repeated work|Heavy|No, each node once|
|Time|Exponential naive|O(n)|
|Stack depth|O(n)|O(h)|
|Main issue|Duplicate subproblems|Traversal|

This comparison is extremely important because **identical-looking recursion syntax can represent completely different computational behavior**.

---

# 21. The three levels you should now visualize

When reading recursive code, inspect three separate structures.

### Level 1 — Call stack

What is currently executing?

```text
f(5)
 ↓
f(4)
 ↓
f(3)
```

### Level 2 — Recursion tree

What recursive calls will eventually be generated?

```text
             f(5)
            /    \
          f(4)   f(3)
         /   \   /   \
       ...
```

### Level 3 — State dependency

What does each invocation need?

```text
result(5)
   ↓
result(4) + result(3)
```

A strong recursion analysis keeps these three views separate.

---

# 22. The pattern hierarchy so far

We can now refine our recursion taxonomy:

```text
RECURSION
│
├── Linear recursion
│   │
│   ├── Tail recursion
│   │
│   └── Return-phase recursion
│
└── Multiple recursion
    │
    ├── Tree recursion
    │
    ├── Divide-and-conquer
    │
    └── Branching search
```

The last category will eventually lead us into **backtracking**.

But there is one more major concept we need before that:

> **How recursion represents choices and explores multiple possible states.**

That is where recursion stops being merely a way to calculate a value and becomes a mechanism for **systematic state-space exploration**.

---

# Practice Problems — Multiple / Tree Recursion

## Level 1 — Understand branching

### 1. Count recursive children

For:

```java
static int f(int n) {
    if (n <= 1) {
        return n;
    }

    return f(n - 1) + f(n - 2);
}
```

Answer:

1. How many recursive calls does each non-base invocation create?
    
2. What are the child states of `f(7)`?
    
3. Is the recursion linear or branching?
    
4. What is the maximum stack depth?
    

---

## Level 2 — Draw the recursion tree

### 2. Fibonacci

Draw the complete recursion tree for:

```text
fib(4)
```

Mark every base case.

Then calculate the result from the leaves upward.

---

### 3. Three-way recursion

For:

```java
static int f(int n) {
    if (n <= 0) {
        return 1;
    }

    return f(n - 1) + f(n - 2) + f(n - 3);
}
```

Draw the tree for:

```text
f(4)
```

Do not calculate the result initially. Focus only on the **shape of the recursion tree**.

---

## Level 3 — Stack vs tree

### 4. Critical visualization problem

For:

```text
fib(5)
```

draw:

1. The complete recursion tree.
    
2. The call stack when the leftmost branch reaches `fib(1)`.
    
3. The call stack after `fib(1)` returns and `fib(2)` begins evaluating `fib(0)`.
    

The objective is to understand why:

```text
recursion tree size ≠ stack space
```

---

## Level 4 — Complexity

### 5. Analyze this function

```java
static void f(int n) {
    if (n <= 1) {
        return;
    }

    f(n - 1);
    f(n - 1);
}
```

Determine:

```text
Time complexity
Space complexity
Recursion tree shape
```

The key question is why the two calls create **identical subproblems**.

---

### 6. Compare

Analyze:

```java
static void f(int n) {
    if (n <= 1) {
        return;
    }

    f(n - 1);
    f(n - 2);
}
```

versus:

```java
static void f(int n) {
    if (n <= 1) {
        return;
    }

    f(n / 2);
    f(n / 2);
}
```

Compare their recursion trees and time complexity.

---

## Level 5 — Application

### 7. Binary tree traversal

Implement recursive preorder traversal:

```text
process(node)
left
right
```

Then implement postorder:

```text
left
right
process(node)
```

For each, explain **which work happens during descent and which work happens during unwinding**.

---

### 8. Recursive subset generation

Given:

```text
[1, 2, 3]
```

consider the recursive choices:

```text
include current element
OR
exclude current element
```

Draw the recursion tree.

Do not implement it yet.

For every tree node, identify:

```text
current index
current selected elements
two possible next states
```

This is the first direct step toward **backtracking**.

---

# Level 6 — Hard

### 9. Fibonacci optimization analysis

For:

```java
static int fib(int n) {
    if (n <= 1) {
        return n;
    }

    return fib(n - 1) + fib(n - 2);
}
```

identify:

```text
1. Number of unique states.
2. Number of recursive invocations.
3. Repeated states.
4. Maximum stack depth.
5. Why memoization can reduce the time complexity.
```

Do not implement memoization yet. First understand **what exactly is being duplicated**.

---

### 10. Architecture-level recursion analysis

Given a recursive algorithm, always answer these five questions:

```text
1. What is the state of one invocation?

2. How many recursive children does it produce?

3. What state does each child represent?

4. What information must the parent preserve while
   its children execute?

5. How are child results combined when control returns?
```

Apply these five questions to:

```text
fib(5)
```

This five-question framework is the foundation for analyzing almost every recursive algorithm you encounter.

---

## The recursion model we've built

```text
                    RECURSION
                        │
          ┌─────────────┴─────────────┐
          │                           │
      Linear                      Multiple
          │                           │
    ┌─────┴─────┐              ┌──────┴──────┐
    │           │              │             │
  Tail       Return        Tree recursion   Branching
 recursion   recursion          │             search
                              │
                         Divide & Conquer
                              │
                              ▼
                         Backtracking
```

The next topic is **Backtracking as a recursion pattern**.

There we will introduce the most important new state:

```text
current state
+
choice
+
recursive exploration
+
undo choice
```

The crucial thing will be understanding **why the recursion tree represents possible states, while the call stack represents the current path through those states**. That distinction is what makes subset generation, permutations, N-Queens, maze solving, and constraint-search problems understandable rather than something you merely memorize.