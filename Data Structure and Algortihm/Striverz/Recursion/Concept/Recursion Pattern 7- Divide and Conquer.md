
We now move to **Divide and Conquer**, which uses the branching structure we already learned but gives those branches a very specific meaning.

The central structure is:

```text
                Problem
                   │
              divide
             /      \
        Subproblem  Subproblem
           │            │
        solve         solve
           │            │
           └─────┬──────┘
                 │
              combine
                 │
              Result
```

The three operations are:

```text
Divide → Conquer → Combine
```

This pattern is fundamental to **merge sort, quicksort, binary-search variants, closest-pair algorithms, and many recursive algorithms used in algorithmic systems**.

---

## 1. What makes Divide and Conquer different?

Consider Fibonacci:

```text
fib(5)
├── fib(4)
└── fib(3)
```

The recursive calls represent two values that are required to calculate the parent.

But Fibonacci has **overlapping subproblems**:

```text
fib(3)
```

can appear in multiple branches.

Divide and Conquer generally attempts to divide the original problem into **smaller, independently solvable subproblems**.

For example:

```text
sort([8,3,5,1,7,2,6,4])
```

can become:

```text
                    [8,3,5,1,7,2,6,4]
                         /       \
                    [8,3,5,1] [7,2,6,4]
                       /  \       /  \
                    [8,3] [5,1] [7,2] [6,4]
```

Each subproblem is a smaller sorting problem.

---

# 2. The three phases

Every Divide-and-Conquer algorithm should be mentally decomposed into three phases.

### Phase 1 — Divide

Take the current problem and produce smaller problems.

```text
P
↓
P1 + P2
```

### Phase 2 — Conquer

Recursively solve each smaller problem.

```text
solve(P1)
solve(P2)
```

### Phase 3 — Combine

Use the results of the smaller problems to construct the result for the parent.

```text
result(P1) + result(P2)
        ↓
    result(P)
```

The important point is that **combine happens during the return/unwinding phase**.

---

# 3. Merge Sort

Merge sort is the cleanest example.

Suppose:

```text
[8, 3, 5, 1, 7, 2, 6, 4]
```

We first divide:

```text
                    [8,3,5,1,7,2,6,4]
                              │
                    ┌─────────┴─────────┐
                    ↓                   ↓
                [8,3,5,1]          [7,2,6,4]
```

Then divide again:

```text
              [8,3,5,1]          [7,2,6,4]
               /     \             /     \
            [8,3]   [5,1]       [7,2]   [6,4]
```

Again:

```text
          [8,3] [5,1] [7,2] [6,4]
           / \   / \   / \   / \
          [8][3][5][1][7][2][6][4]
```

Now we have reached the base case.

---

# 4. What is the base case?

For merge sort:

```text
array of size 0 or 1
```

is already sorted.

Therefore:

```java
if (left >= right) {
    return;
}
```

The recursion stops when there is nothing meaningful left to divide.

So the recursive state can be represented as:

```text
(left, right)
```

For example:

```text
sort(0, 7)
```

means:

```text
sort the portion from index 0 through index 7
```

---

# 5. The recursive state

This is extremely important.

When we call:

```java
mergeSort(array, left, right);
```

the function's state is:

```text
array
left
right
```

The important problem-definition state is:

```text
[left ... right]
```

For:

```text
[8,3,5,1,7,2,6,4]
```

the initial state is:

```text
left  = 0
right = 7
```

After dividing:

```text
left = 0
right = 3
```

and:

```text
left = 4
right = 7
```

So:

```text
sort(0,7)
├── sort(0,3)
└── sort(4,7)
```

---

# 6. The recursion tree

The complete recursion tree is:

```text
                         sort(0,7)
                       /           \
                  sort(0,3)      sort(4,7)
                  /     \         /      \
             sort(0,1) sort(2,3) sort(4,5) sort(6,7)
               / \       / \       / \       / \
              [8] [3]   [5] [1]   [7] [2]   [6] [4]
```

Notice something important.

Unlike Fibonacci, **the recursion tree is closely related to the input decomposition**.

Each element eventually belongs to exactly one leaf.

There is no repeated:

```text
sort(2,3)
```

somewhere else.

---

# 7. The call stack during division

Suppose execution starts:

```text
sort(0,7)
```

The first recursive call is:

```text
sort(0,3)
```

Then:

```text
sort(0,1)
```

Then:

```text
sort(0,0)
```

The stack becomes:

```text
TOP
│
├── sort(0,0)
├── sort(0,1)
├── sort(0,3)
└── sort(0,7)
BOTTOM
```

`sort(0,0)` reaches the base case and returns.

Then the parent continues.

This is the same stack behavior we learned earlier:

> **The recursion tree contains the entire computation; the call stack contains only the currently active path.**

---

# 8. The parent frame preserves its state

Consider:

```text
sort(0,3)
```

It divides into:

```text
sort(0,1)
sort(2,3)
```

When the first call is executing:

```text
sort(0,1)
```

the parent frame:

```text
sort(0,3)
```

is suspended.

Conceptually it maintains:

```text
left  = 0
right = 3
mid   = 1

leftResult  = unresolved
rightResult = unresolved

pending:
    combine left half + right half
```

After:

```text
sort(0,1)
```

returns:

```text
leftResult = sorted [3,8]
```

The parent then executes:

```text
sort(2,3)
```

After that returns:

```text
rightResult = sorted [1,5]
```

Now the parent can combine:

```text
[3,8]
[1,5]
```

into:

```text
[1,3,5,8]
```

This is exactly the parent-state mechanism we saw in multiple recursion.

---

# 9. The critical difference: combination

For Fibonacci:

```text
fib(4)
```

returns:

```text
fib(3) + fib(2)
```

The combination is a simple arithmetic operation.

For merge sort:

```text
sort(left)
sort(right)
```

return two sorted sequences.

The parent must perform:

```text
merge(leftSorted, rightSorted)
```

Therefore the recursive function does not simply calculate a scalar.

It transforms:

```text
unsorted subarray
```

into:

```text
sorted subarray
```

This gives us a powerful recursive contract:

> **`mergeSort(left, right)` guarantees that after it returns, the range `[left, right]` is sorted.**

That contract is the foundation of understanding merge sort.

---

# 10. The combine phase in detail

Suppose:

```text
left = [3,8]
right = [1,5]
```

We need:

```text
[1,3,5,8]
```

Maintain two pointers:

```text
i → left
j → right
```

Initially:

```text
left:  [3,8]
         ↑
         i

right: [1,5]
        ↑
        j
```

Compare:

```text
3 vs 1
```

Take `1`.

```text
result = [1]
```

Then:

```text
3 vs 5
```

Take `3`.

```text
result = [1,3]
```

Then:

```text
8 vs 5
```

Take `5`.

```text
result = [1,3,5]
```

Finally:

```text
8
```

remains:

```text
result = [1,3,5,8]
```

This entire merge happens **after both recursive children return**.

---

# 11. Full Merge Sort implementation

```java
import java.util.Arrays;

public class MergeSort {

    static void mergeSort(int[] arr, int left, int right) {
        if (left >= right) {
            return;
        }

        int mid = left + (right - left) / 2;

        mergeSort(arr, left, mid);
        mergeSort(arr, mid + 1, right);

        merge(arr, left, mid, right);
    }

    static void merge(int[] arr, int left, int mid, int right) {
        int[] temp = new int[right - left + 1];

        int i = left;
        int j = mid + 1;
        int k = 0;

        while (i <= mid && j <= right) {
            if (arr[i] <= arr[j]) {
                temp[k++] = arr[i++];
            } else {
                temp[k++] = arr[j++];
            }
        }

        while (i <= mid) {
            temp[k++] = arr[i++];
        }

        while (j <= right) {
            temp[k++] = arr[j++];
        }

        for (int x = 0; x < temp.length; x++) {
            arr[left + x] = temp[x];
        }
    }

    public static void main(String[] args) {
        int[] arr = {8, 3, 5, 1, 7, 2, 6, 4};

        mergeSort(arr, 0, arr.length - 1);

        System.out.println(Arrays.toString(arr));
    }
}
```

The important recursive structure is only:

```text
mergeSort(left, mid)
mergeSort(mid + 1, right)
merge(...)
```

Everything else implements the divide/combine mechanics.

---

# 12. Execution phases of `mergeSort(0,7)`

The function:

```java
mergeSort(arr, 0, 7);
```

initially has:

```text
state:
left = 0
right = 7
mid = 3
```

It executes:

```text
mergeSort(0,3)
```

and waits.

After that returns:

```text
left half sorted
```

Then:

```text
mergeSort(4,7)
```

executes.

After that:

```text
right half sorted
```

Finally:

```text
merge(0,3,7)
```

executes.

So the state lifecycle is:

```text
ENTER
  ↓
CALCULATE MID
  ↓
SOLVE LEFT
  ↓
SOLVE RIGHT
  ↓
COMBINE
  ↓
RETURN
```

This pattern repeats at every internal node of the recursion tree.

---

# 13. Recursion tree with work

For eight elements:

```text
                              n = 8
                           /         \
                         n=4        n=4
                        /  \        /  \
                      n=2  n=2    n=2  n=2
                      /\    /\    /\    /\
                     1 1   1 1   1 1   1 1
```

At each level, the total number of elements processed by merging is approximately:

```text
n
```

because all elements participate in the merge operations at that level.

Therefore:

```text
Level 0: n
Level 1: n
Level 2: n
...
```

How many levels?

Each division approximately halves the problem:

```text
n
n/2
n/4
n/8
...
1
```

We need `k` divisions such that:

```text
n / 2^k = 1
```

Therefore:

```text
2^k = n
```

and:

```text
k = log₂(n)
```

So:

```text
number of levels = O(log n)
```

Each level performs:

```text
O(n)
```

work.

Therefore:

```text
Time = O(n log n)
```

---

# 14. Recurrence relation

We can express the same reasoning mathematically.

Merge sort:

```text
T(n) = 2T(n/2) + O(n)
```

Why?

```text
2T(n/2)
```

because there are two recursive calls.

And:

```text
O(n)
```

because merging takes linear time.

Therefore:

```text
T(n) = O(n log n)
```

This is one of the most important recurrence relations in DSA.

---

# 15. Compare the major recursion patterns

|Algorithm|Recursive structure|Recurrence|Time|
|---|---|---|--:|
|Fibonacci|2 overlapping subproblems|`T(n-1)+T(n-2)`|Exponential|
|Binary search|1 half-sized subproblem|`T(n/2)+O(1)`|`O(log n)`|
|Merge sort|2 independent half-sized subproblems|`2T(n/2)+O(n)`|`O(n log n)`|
|Binary tree traversal|2 child subtrees|`T(left)+T(right)+O(1)`|`O(n)`|

The number of recursive calls alone tells us almost nothing.

You must ask:

```text
How much does each recursive call reduce the problem?
How many calls are made?
How much work happens outside recursion?
Are subproblems overlapping?
```

---

# 16. Divide and Conquer recursion tree

The recurrence:

```text
T(n) = 2T(n/2) + n
```

can be visualized:

```text
                         n
                    /         \
                  n/2         n/2
                 /  \         /  \
               n/4  n/4     n/4  n/4
              / \    / \    / \    / \
             ...
```

But each node also performs local work.

At the root:

```text
work = n
```

At the next level:

```text
n/2 + n/2 = n
```

Next:

```text
n/4 + n/4 + n/4 + n/4 = n
```

Therefore:

```text
Level 0 → n
Level 1 → n
Level 2 → n
Level 3 → n
...
```

There are:

```text
log₂ n
```

levels.

Thus:

```text
n × log n
=
O(n log n)
```

This is the **recursion-tree method** for analyzing recurrences.

---

# 17. Binary Search

Now consider another Divide-and-Conquer-like structure.

Given:

```text
[1,3,5,7,9,11,13,15]
```

we inspect the middle:

```text
             [1,3,5,7,9,11,13,15]
                         ↑
                         7
```

If searching for `13`, we know:

```text
13 > 7
```

Therefore the entire left half can be discarded.

The next problem is:

```text
[9,11,13,15]
```

Then:

```text
       [9,11,13,15]
             ↑
            11
```

Again:

```text
13 > 11
```

Next:

```text
[13,15]
```

Then:

```text
13
```

The recursive state is:

```text
(left, right)
```

and each call keeps only:

```text
n / 2
```

of the previous search space.

---

# 18. Binary Search recurrence

Only one recursive call is made:

```text
T(n) = T(n/2) + O(1)
```

Therefore:

```text
T(n) = O(log n)
```

Compare this with merge sort:

```text
Merge Sort:
T(n) = 2T(n/2) + O(n)

Binary Search:
T(n) = T(n/2) + O(1)
```

The difference is:

```text
Merge Sort
    solves both halves

Binary Search
    discards one half
```

This is a major Divide-and-Conquer distinction.

---

# 19. Divide and Conquer is about reducing problem size

The key question is not:

> How many recursive calls are there?

Instead:

> **How does the size of the problem change at each recursive level?**

Examples:

```text
Binary Search:
n → n/2 → n/4 → n/8
```

```text
Merge Sort:
n → n/2 + n/2
  → n/4 × 4
  → ...
```

```text
Fibonacci:
n → n-1 and n-2
```

These produce completely different complexity behaviors.

---

# 20. Quicksort

Quicksort introduces a different divide strategy.

Instead of splitting exactly in half, select a pivot.

Example:

```text
[8,3,5,1,7,2,6,4]
```

Suppose pivot is:

```text
4
```

Partition:

```text
values < 4     pivot     values > 4

[3,1,2]          4        [8,5,7,6]
```

Then recursively sort:

```text
sort([3,1,2])
sort([8,5,7,6])
```

The structure is:

```text
                    [8,3,5,1,7,2,6,4]
                              |
                         pivot = 4
                         /         \
                    < 4             > 4
                   [3,1,2]       [8,5,7,6]
```

Then repeat.

---

# 21. Why Quicksort complexity depends on partition quality

Suppose the pivot splits approximately evenly:

```text
n
├── n/2
└── n/2
```

Then:

```text
T(n) = 2T(n/2) + O(n)
```

giving:

```text
O(n log n)
```

But suppose the pivot is always the smallest element:

```text
n
├── 0
└── n-1
```

Then:

```text
T(n) = T(n-1) + O(n)
```

which becomes:

```text
O(n²)
```

So the recursion tree can change dramatically depending on the partition.

Balanced:

```text
                    n
                 /     \
               n/2     n/2
              /  \     / \
```

Unbalanced:

```text
                    n
                     \
                     n-1
                       \
                       n-2
                         \
                         ...
```

This is why recursion-tree shape matters directly to complexity.

---

# 22. Balanced vs unbalanced recursion

This gives us another useful classification.

### Balanced recursion

Problem shrinks substantially at every level:

```text
n
↓
n/2
↓
n/4
↓
n/8
```

Typical depth:

```text
O(log n)
```

### Degenerate recursion

Problem decreases only slightly:

```text
n
↓
n-1
↓
n-2
↓
n-3
```

Typical depth:

```text
O(n)
```

This distinction will matter enormously when we study **Binary Search Trees** and **Quicksort**.

---

# 23. Divide and Conquer state model

A good generic representation is:

```text
State = problem boundary
```

For array algorithms:

```text
(left, right)
```

The recursive transition is:

```text
State
  ↓
divide
  ↓
State A + State B
```

Then:

```text
State A
  ↓
result A

State B
  ↓
result B
```

Then:

```text
result A + result B
        ↓
    result State
```

So:

```text
                 State
                   │
                divide
              /         \
          State A       State B
             │             │
          recurse       recurse
             │             │
         Result A       Result B
              \           /
               \         /
                combine
                   │
                Result
```

---

# 24. The parent frame's complete state

Suppose:

```text
solve(left, right)
```

splits into:

```text
solve(left, mid)
solve(mid+1, right)
```

The parent frame must preserve:

```text
left
right
mid
```

and execution position.

Conceptually:

```text
Frame:
    left = 0
    right = 7
    mid = 3

    left child:
        unresolved

    right child:
        unresolved

    next operation:
        combine
```

After first child:

```text
Frame:
    left = 0
    right = 7
    mid = 3

    left child:
        resolved

    right child:
        unresolved

    next operation:
        call right child
```

After second:

```text
Frame:
    left = 0
    right = 7
    mid = 3

    left child:
        resolved

    right child:
        resolved

    next operation:
        combine
```

Then:

```text
combine
↓
return
```

This is the same **frame-state-machine model** we have been building throughout recursion.

---

# 25. The major recursion patterns now

We can now organize the patterns we've learned:

```text
                         RECURSION
                            │
          ┌─────────────────┴─────────────────┐
          │                                   │
       LINEAR                              BRANCHING
          │                                   │
     ┌────┴────┐                    ┌─────────┴─────────┐
     │         │                    │                   │
    Tail     Return              Multiple          Divide &
   Recursion Recursion           Recursion         Conquer
                                                   │
                                              ┌────┴────┐
                                              │         │
                                           Merge      Quick
                                            Sort      Sort
```

And separately:

```text
Branching recursion
       │
       └── Backtracking
             │
        choice → recurse
             ↓
           undo
```

The distinction is now:

```text
Multiple recursion
    =
multiple recursive subproblems

Divide & Conquer
    =
multiple smaller subproblems
    + independent solving
    + combination

Backtracking
    =
multiple choices
    + state mutation
    + DFS exploration
    + state restoration
    + optional pruning
```

---

# Problems — Divide and Conquer

## Level 1 — Recursion tree

### 1. Binary Search

For:

```text
[2,4,6,8,10,12,14,16,18]
```

search for:

```text
14
```

Draw the sequence of recursive states.

For every call write:

```text
left
right
mid
search direction
```

---

### 2. Balanced splitting

For:

```text
T(n) = 2T(n/2) + n
```

draw the first four levels of the recursion tree.

Then calculate the total work at each level.

You should observe:

```text
n
n
n
n
...
```

---

## Level 2 — Merge Sort

### 3. Full state trace

For:

```text
[8,3,5,1]
```

trace:

```text
mergeSort(0,3)
```

through every recursive call.

Draw:

```text
                    sort(0,3)
                    /       \
               sort(0,1)   sort(2,3)
                /   \       /   \
              [8]  [3]    [5]  [1]
```

Then show the entire **unwinding phase**.

---

### 4. Merge operation

Given:

```text
left  = [2,5,8]
right = [1,3,7]
```

trace the values of:

```text
i
j
result
```

after every comparison.

---

## Level 3 — Complexity

### 5. Recurrence analysis

Determine the complexity of:

```text
T(n) = 2T(n/2) + O(n)
```

Then determine:

```text
T(n) = 2T(n/2) + O(1)
```

Then:

```text
T(n) = T(n/2) + O(n)
```

Do not memorize formulas. Draw the recursion tree and calculate the work per level.

---

### 6. Quicksort tree

For:

```text
[5,2,8,1,7,3,6,4]
```

assume the first element is always the pivot.

Trace the partition recursively.

Determine whether the resulting recursion tree is balanced or unbalanced.

---

# Level 4 — Implementation

### 7. Recursive merge sort

Implement merge sort from scratch.

Your implementation must explicitly contain:

```text
base case
mid calculation
left recursion
right recursion
merge
```

Then annotate mentally what each stack frame is preserving.

---

### 8. Recursive binary search

Implement:

```java
static int binarySearch(
    int[] arr,
    int left,
    int right,
    int target
)
```

For each invocation identify the exact problem represented by:

```text
(left, right)
```

---

# Level 5 — Hard

### 9. Maximum element using Divide and Conquer

Given:

```text
[8,3,9,2,7,1,6,5]
```

recursively divide the array into two halves, find the maximum in each half, then combine:

```text
max(left)
max(right)

max(maxLeft, maxRight)
```

Derive its recurrence and complexity.

---

### 10. Count inversions

Given:

```text
[2,4,1,3,5]
```

an inversion is a pair:

```text
i < j
```

such that:

```text
arr[i] > arr[j]
```

The brute-force solution is `O(n²)`.

Your challenge is to discover how **merge sort's divide-and-conquer structure can count inversions during the merge phase in `O(n log n)`**.

Do not implement immediately. First identify:

```text
What does each recursive subproblem return?
What information must the parent receive?
Where are cross-half inversions detected?
```

---

# The most important mental model from this topic

When you encounter a recursive Divide-and-Conquer algorithm, visualize **two separate processes**:

### Downward phase — decomposition

```text
Problem
   ↓
divide
   ↓
smaller problem
   ↓
divide
   ↓
smaller problem
   ↓
base case
```

### Upward phase — reconstruction

```text
base result
   ↓
child result
   ↓
combine
   ↓
larger result
   ↓
combine
   ↓
final result
```

So the complete flow is:

```text
                         PROBLEM
                            │
                         DIVIDE
                      ┌─────┴─────┐
                      ↓           ↓
                  SUBPROBLEM  SUBPROBLEM
                      │           │
                   DIVIDE       DIVIDE
                      │           │
                    ...         ...
                      │           │
                   BASE        BASE
                      │           │
                   RESULT      RESULT
                      │           │
                      └─────┬─────┘
                            ↓
                         COMBINE
                            ↓
                       SUBRESULT
                            ↓
                         COMBINE
                            ↓
                         RESULT
```

**The downward direction creates the problem structure; the upward direction constructs the answer.**

That is the core recursion pattern behind Divide and Conquer. The next step after this is to go deeper into **recurrence analysis and recursion trees**, because that is where we formally derive `O(log n)`, `O(n log n)`, `O(n²)`, and the behavior of balanced versus unbalanced recursive algorithms before moving into the next DSA structures.