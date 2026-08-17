
We now move from **recursion as computation** to **recursion as state-space exploration**.

In linear recursion, the next state is usually predetermined:

```text
state(n)
   ↓
state(n - 1)
   ↓
state(n - 2)
```

In multiple recursion, one state creates several subproblems:

```text
             state
            /     \
       state A   state B
```

**Backtracking adds one more operation: after exploring a choice, we restore the previous state and try another choice.**

The core structure is:

```text
choose
   ↓
modify state
   ↓
recurse
   ↓
undo modification
   ↓
try next choice
```

That `undo` step is the defining mechanism we need to understand.

---

# 1. Start with the smallest backtracking problem

Suppose we have:

```text
[1, 2]
```

For every element, we have two choices:

```text
include it
exclude it
```

The possible subsets are:

```text
[]
[1]
[2]
[1,2]
```

We can model the recursive state as:

```text
(index, currentSubset)
```

At index `0`, the element is:

```text
1
```

There are two branches:

```text
                 index=0, []
                    /     \
                 include  exclude
                   /         \
              [1]             []
```

Then each branch processes `2`:

```text
                       []
                     /    \
                  [1]      []
                 /   \     /  \
              [1,2] [1]  [2]  []
```

This is a **state-space tree**.

---

# 2. The recursion tree is now representing choices

This is different from Fibonacci.

In Fibonacci:

```text
fib(n)
├── fib(n-1)
└── fib(n-2)
```

The branches represent **subproblems required to calculate a value**.

In backtracking:

```text
subset(state)
├── choose element
└── don't choose element
```

The branches represent **different possible decisions**.

So:

```text
Fibonacci:
    branch = subproblem

Backtracking:
    branch = choice
```

That distinction is fundamental.

---

# 3. The basic backtracking template

A generic backtracking function looks like:

```java
static void backtrack(State state) {
    if (isComplete(state)) {
        process(state);
        return;
    }

    for (Choice choice : choices(state)) {

        makeChoice(state, choice);

        backtrack(state);

        undoChoice(state, choice);
    }
}
```

The important sequence is:

```text
make
  ↓
recurse
  ↓
undo
```

The recursion itself is not the entire algorithm.

The **state mutation + recursive exploration + restoration** is the algorithm.

---

# 4. Why do we need undo?

Consider a mutable list:

```java
List<Integer> current = new ArrayList<>();
```

Suppose we choose `1`:

```text
current = [1]
```

Then recursively explore all possibilities beginning with `[1]`.

Eventually that branch is completely explored.

Now we want to explore the branch where `1` is **not selected**.

We therefore need:

```text
current = []
```

So:

```text
add(1)
    ↓
recursive exploration
    ↓
remove(1)
```

The `remove` operation restores the state that existed before the choice.

That is **backtracking**.

---

# 5. The state transition

Suppose the state is:

```text
currentSubset = []
```

We choose `1`.

```text
before:
[]

choice:
include 1

after:
[1]
```

Then recursion explores:

```text
[1]
```

When that branch is complete:

```text
undo include 1

[1]
 ↓
[]
```

Then we can explore the other branch.

So one recursive level behaves like:

```text
State S
   │
   ├── Choice A
   │      ↓
   │    State S'
   │      ↓
   │    explore completely
   │      ↓
   │    restore S
   │
   └── Choice B
          ↓
        State S''
```

---

# 6. Call stack vs current state

This becomes even more important than in tree recursion.

Consider:

```text
[1, 2, 3]
```

Suppose we choose:

```text
1
```

then:

```text
2
```

then:

```text
3
```

The current recursive path is:

```text
choose 1
   ↓
choose 2
   ↓
choose 3
```

The call stack conceptually contains:

```text
TOP
│
├── backtrack(index=3, current=[1,2,3])
├── backtrack(index=2, current=[1,2])
├── backtrack(index=1, current=[1])
└── backtrack(index=0, current=[])
BOTTOM
```

But after `[1,2,3]` is processed, the algorithm returns from the deepest level.

Then it must undo:

```text
[1,2,3]
    ↓
[1,2]
```

Now it can explore another choice.

The stack and mutable state are therefore separate concepts:

```text
Call stack
    =
active recursion path

Mutable state
    =
current configuration represented by that path
```

---

# 7. A complete example: subsets

Let's implement subset generation.

```java
import java.util.ArrayList;
import java.util.List;

public class Subsets {

    static void generate(
            int[] nums,
            int index,
            List<Integer> current
    ) {
        if (index == nums.length) {
            System.out.println(current);
            return;
        }

        // Choice 1: include nums[index]
        current.add(nums[index]);
        generate(nums, index + 1, current);
        current.remove(current.size() - 1);

        // Choice 2: exclude nums[index]
        generate(nums, index + 1, current);
    }

    public static void main(String[] args) {
        int[] nums = {1, 2, 3};

        generate(nums, 0, new ArrayList<>());
    }
}
```

The crucial lines are:

```java
current.add(nums[index]);

generate(nums, index + 1, current);

current.remove(current.size() - 1);
```

That is the backtracking operation.

---

# 8. Trace the first branch

Initial state:

```text
index = 0
current = []
```

Current element:

```text
1
```

Choose include:

```text
current.add(1)
```

State becomes:

```text
index = 1
current = [1]
```

Then choose include `2`:

```text
index = 2
current = [1,2]
```

Then include `3`:

```text
index = 3
current = [1,2,3]
```

Base case:

```text
[1,2,3]
```

is produced.

Now return.

---

# 9. The first backtrack

After processing:

```text
[1,2,3]
```

we execute:

```java
current.remove(current.size() - 1);
```

State becomes:

```text
[1,2]
```

We have therefore moved from:

```text
[1,2,3]
```

back to:

```text
[1,2]
```

Now the recursive level for `3` can explore its other choice:

```text
exclude 3
```

The state remains:

```text
[1,2]
```

So:

```text
[1,2,3]
    ↓ undo
[1,2]
    ↓ exclude 3
[1,2]
```

That produces subset:

```text
[1,2]
```

---

# 10. Continue backing up

After finishing all choices involving `3`, the algorithm returns to the level handling `2`.

Current state:

```text
[1,2]
```

Undo `2`:

```text
[1,2]
   ↓
[1]
```

Now the algorithm explores the branch where `2` is excluded.

That gives:

```text
[1]
```

Then it eventually returns to the level handling `1`.

Undo `1`:

```text
[1]
 ↓
[]
```

Now the algorithm can explore the entire branch where `1` is excluded.

This is the key pattern:

```text
choose 1
    choose 2
        choose 3
        undo 3
    undo 2
    choose alternate 2-state
undo 1
choose alternate 1-state
```

---

# 11. The complete state-space tree

For `[1,2,3]`, visualize the states:

```text
                              []
                         /          \
                     include 1    exclude 1
                       [1]            []
                     /    \         /    \
                  +2      -2      +2      -2
                  [1,2]   [1]     [2]      []
                 /   \    /  \    /  \     / \
               +3   -3  +3  -3  +3  -3   +3 -3
              [123][12][13][1][23][2][3] []
```

Every root-to-leaf path represents one complete sequence of choices.

Therefore:

```text
number of leaves = 2³ = 8
```

which matches the number of subsets of three elements.

---

# 12. Backtracking is depth-first search over states

This is a very useful interpretation.

The state-space tree is:

```text
                     []
                   /    \
                 [1]     []
                /  \     / \
             [1,2] [1] [2] []
```

The algorithm explores it using **depth-first search**.

That means:

```text
go as deep as possible
    ↓
reach complete state
    ↓
return
    ↓
undo previous decision
    ↓
try sibling branch
```

So backtracking is fundamentally:

> **DFS over a dynamically generated state-space tree, with explicit state restoration when returning from a branch.**

---

# 13. Why recursion is so suitable for backtracking

Each recursive invocation naturally represents one decision level.

For subset generation:

```text
index = 0
    → decide about element 0

index = 1
    → decide about element 1

index = 2
    → decide about element 2

index = 3
    → all decisions complete
```

Therefore:

```text
recursion depth
=
number of decisions currently made
```

This gives us a very powerful visualization:

```text
depth 0 → no decisions
depth 1 → decision for element 0
depth 2 → decisions for elements 0,1
depth 3 → decisions for elements 0,1,2
```

---

# 14. The state has two components

For our subset problem:

```text
State = (index, currentSubset)
```

But there is a relationship between them.

If:

```text
index = 2
currentSubset = [1]
```

then:

```text
elements 0 and 1
    ↓
some decisions already made

elements 2 onward
    ↓
decisions still remaining
```

So the state represents both:

```text
completed decisions
+
remaining decisions
```

This is the general structure of backtracking state.

---

# 15. Choice → state transition

At every recursion level, define:

```text
Current state
      ↓
Available choices
      ↓
Next state
```

For subset generation:

```text
State:
(index, current)

Choices:
include nums[index]
exclude nums[index]
```

Choice 1:

```text
(index, current)
        ↓ include
(index + 1, current + element)
```

Choice 2:

```text
(index, current)
        ↓ exclude
(index + 1, current)
```

Therefore:

```text
                     (index,current)
                       /          \
                  include        exclude
                     /              \
        (index+1,current+x)   (index+1,current)
```

This is the formal state transition.

---

# 16. The undo operation

For the include branch:

```text
current.add(x);
generate(...);
current.remove(...);
```

Notice that the recursive call receives the **same mutable list**.

That means the child sees:

```text
current = [1,2]
```

Then after returning, the parent restores:

```text
current = [1]
```

This is why the remove operation is mandatory.

Without:

```java
current.remove(current.size() - 1);
```

the state would leak between branches.

---

# 17. What happens without undo?

Suppose we write:

```java
current.add(nums[index]);
generate(nums, index + 1, current);

// no remove
```

Then:

```text
include 1
→ [1]

include 2
→ [1,2]

include 3
→ [1,2,3]
```

After returning from `[1,2,3]`, the list remains:

```text
[1,2,3]
```

Now when the algorithm tries to explore another branch, it starts with an invalid state.

The branches are no longer independent.

So:

```text
Without undo:
branch state contaminates sibling branches
```

With undo:

```text
Branch A
   ↓
modify
   ↓
explore
   ↓
restore original state
   ↓
Branch B
```

This restoration guarantees branch isolation.

---

# 18. Backtracking invariant

A very important invariant is:

> **Immediately before exploring a choice, the state must represent exactly the decisions made along the current path and nothing from previously completed sibling paths.**

Suppose the current path is:

```text
1 → 2
```

then:

```text
current = [1,2]
```

After returning from this branch, it must be restored to:

```text
current = [1]
```

before exploring the sibling branch.

Therefore the invariant is:

```text
current state
=
choices on current recursion path
```

This is one of the most important things to verify when debugging backtracking.

---

# 19. Backtracking vs normal tree recursion

Compare them.

### Tree traversal

```java
traverse(node.left);
traverse(node.right);
```

The input tree already contains the states.

```text
state comes from input structure
```

### Backtracking

```java
makeChoice();
backtrack();
undoChoice();
```

The algorithm **constructs the states dynamically**.

```text
state comes from choices
```

Therefore:

```text
Tree recursion:
    traverse existing structure

Backtracking:
    generate and explore possible structures
```

---

# 20. Backtracking vs Fibonacci

Both create recursion trees, but their semantics are different.

|Property|Fibonacci|Backtracking|
|---|---|---|
|Branch meaning|Required subproblem|Choice|
|State mutation|Usually none|Usually explicit|
|Undo operation|No|Yes|
|Goal|Compute value|Explore valid states|
|Leaves|Base cases|Candidate solutions|
|Search pruning|Usually none|Common|
|Typical output|One result|Many/one valid solutions|

This distinction will prevent a lot of confusion later.

---

# 21. Backtracking with a constraint

Now consider a slightly more interesting problem.

Suppose we want all binary strings of length `3` that contain no consecutive `1`s.

At every position:

```text
choose 0
or
choose 1
```

But choosing `1` is allowed only if the previous value wasn't `1`.

State:

```text
(index, currentString)
```

Additional information:

```text
lastBit
```

So:

```text
State =
(index, currentString, lastBit)
```

At each step:

```text
if choose 0:
    always valid

if choose 1:
    valid only if lastBit != 1
```

The recursion tree is therefore **pruned**.

---

# 22. Pruning

Without constraints:

```text
                    state
                  /       \
               choice0   choice1
               /   \      /   \
             ...   ...  ...   ...
```

With constraints:

```text
                    state
                  /       \
             valid 0     invalid 1
               |
             continue
```

The invalid branch is never explored.

This is called **pruning**.

Formally:

```text
if (!isValid(choice, state)) {
    skip choice;
}
```

So a generic backtracking algorithm becomes:

```java
static void backtrack(State state) {

    if (isComplete(state)) {
        process(state);
        return;
    }

    for (Choice choice : choices(state)) {

        if (!isValid(state, choice)) {
            continue;
        }

        makeChoice(state, choice);

        backtrack(state);

        undoChoice(state, choice);
    }
}
```

Now the pattern is:

```text
choose
  ↓
validate
  ↓
modify
  ↓
recurse
  ↓
undo
```

---

# 23. Backtracking state lifecycle

Every recursion level follows a precise lifecycle:

```text
┌──────────────────────────────┐
│ Current state                │
└──────────────┬───────────────┘
               ↓
        enumerate choices
               ↓
        validate choice
               ↓
        make choice
               ↓
        recursive call
               ↓
        child completes
               ↓
        undo choice
               ↓
        next choice
```

The `undo` happens **after the entire child subtree has been explored**.

That is important.

You don't undo immediately after making the choice.

You undo only after:

```text
choice
   ↓
entire subtree
   ↓
return
```

---

# 24. Backtracking call stack

Suppose we are generating permutations of:

```text
[1,2,3]
```

and current path is:

```text
[1,3]
```

The recursion might look conceptually like:

```text
backtrack([1,3])
    ↓
choose 2
    ↓
backtrack([1,3,2])
    ↓
solution
```

The stack is:

```text
TOP
│
├── backtrack([1,3,2])
├── backtrack([1,3])
├── backtrack([1])
└── backtrack([])
BOTTOM
```

When the deepest call returns:

```text
[1,3,2]
```

we undo `2`:

```text
[1,3]
```

Then try another available choice.

The stack controls **where we are in the decision process**, while the state records **what decisions have been made**.

---

# 25. Backtracking and permutations

For permutations, the state is different.

Given:

```text
[1,2,3]
```

we want:

```text
[1,2,3]
[1,3,2]
[2,1,3]
[2,3,1]
[3,1,2]
[3,2,1]
```

At each level:

```text
choose one unused element
```

State:

```text
(currentPermutation, used[])
```

For example:

```text
current = [1]
used = [true,false,false]
```

Then choices are:

```text
2
3
```

If we choose `2`:

```text
current = [1,2]
used = [true,true,false]
```

Then only `3` remains.

After the branch:

```text
current = [1]
used = [true,false,false]
```

The state has been restored.

---

# 26. A useful formal definition

Backtracking can be expressed as:

```text
Backtracking =
DFS
+
mutable state
+
choice generation
+
state restoration
+
optional pruning
```

The recursion provides the depth-first structure.

The state represents the current partial solution.

The choices generate child states.

Undo restores the parent state.

Pruning removes impossible branches.

---

# 27. Complexity of subset generation

For `n` elements:

Each element has two choices:

```text
include
exclude
```

Therefore the number of leaves is:

```text
2ⁿ
```

The number of nodes in the complete binary decision tree is:

```text
1 + 2 + 4 + ... + 2ⁿ
= 2ⁿ⁺¹ - 1
```

Therefore the number of recursive states is:

```text
O(2ⁿ)
```

If each complete subset is copied and output, the output itself can require additional work.

There are:

```text
2ⁿ
```

subsets, and each subset can contain up to `n` elements.

So generating all subsets explicitly can require:

```text
O(n · 2ⁿ)
```

time for output/copying.

The recursion stack itself is only:

```text
O(n)
```

because the maximum decision depth is `n`.

Again:

```text
Tree size = O(2ⁿ)
Stack depth = O(n)
```

---

# 28. The four questions for every backtracking problem

When you see a backtracking problem, do not start by writing code.

First identify:

### 1. What is the state?

Example:

```text
(index, currentSubset)
```

### 2. What are the choices?

Example:

```text
include
exclude
```

### 3. What makes a state complete?

Example:

```text
index == nums.length
```

### 4. What state must be undone?

Example:

```text
current.remove(last)
```

If you can answer these four questions, the implementation usually becomes straightforward.

---

# 29. The deepest mental model

You should now visualize backtracking as **a state machine being traversed depth-first**.

```text
                         STATE
                           │
                  ┌────────┴────────┐
                  │                 │
               Choice A          Choice B
                  │                 │
             modify state       modify state
                  │                 │
               recurse            recurse
                  │                 │
            entire subtree    entire subtree
               explored          explored
                  │                 │
                undo             undo
                  │                 │
                  └────────┬────────┘
                           │
                      parent state
```

The critical invariant is:

```text
After returning from a child,
the state must be exactly what it was
before that child choice was made.
```

That is the essence of backtracking.

---

# Practice Problems — Backtracking

## Level 1 — State tracing

### 1. Binary choices

For:

```text
[1,2]
```

generate every subset using:

```text
include
exclude
```

Draw the complete recursion tree.

For every node, write:

```text
index
current subset
```

---

### 2. Trace the undo

Given:

```text
current = [1,2]
```

you choose `3`.

Show the state sequence:

```text
before choice
after choice
after recursive exploration
after undo
```

Explain why the final state must equal the original state.

---

## Level 2 — Implementation

### 3. Generate subsets

Implement:

```java
static void subsets(int[] nums)
```

using backtracking.

For:

```text
[1,2,3]
```

produce all `8` subsets.

Do not use bit manipulation.

---

### 4. Generate binary strings

Generate every binary string of length `n`.

For:

```text
n = 3
```

the results should contain:

```text
000
001
010
011
100
101
110
111
```

Define the recursive state and choices explicitly.

---

## Level 3 — Mutation and restoration

### 5. Generate permutations

For:

```text
[1,2,3]
```

generate all six permutations using:

```text
current
used[]
```

Trace the state transitions for the branch:

```text
1 → 3 → 2
```

Then show exactly where:

```text
used[2] = false
```

and the last element is removed.

---

## Level 4 — Constraints

### 6. No consecutive ones

Generate all binary strings of length `4` that do not contain:

```text
11
```

For every recursion level, identify:

```text
state
available choices
invalid choices
pruned branches
```

---

### 7. Combination sum

Given:

```text
[2,3,6,7]
target = 7
```

find combinations whose sum is `7`.

Start by defining:

```text
state
choices
base case
validity condition
undo operation
```

Do not optimize it yet.

---

# Level 5 — Hard

### 8. N-Queens state tree

For the `4 × 4` N-Queens problem, define the recursive state as:

```text
row
board
```

At each row:

```text
choose a column
```

A choice is valid only if:

```text
same column is free
left diagonal is free
right diagonal is free
```

Draw the first several levels of the state-space tree and identify where pruning occurs.

---

### 9. Maze traversal

Given a grid:

```text
S . .
# # .
. . E
```

define a recursive state:

```text
(row, col)
```

with choices:

```text
up
down
left
right
```

Explain why a visited structure is required.

Then explain what must happen when a path turns out to be invalid.

---

### 10. Challenge — Backtracking invariant

Consider:

```java
static void generate(
        int[] nums,
        int index,
        List<Integer> current
) {
    if (index == nums.length) {
        System.out.println(current);
        return;
    }

    current.add(nums[index]);

    generate(nums, index + 1, current);

    current.remove(current.size() - 1);

    generate(nums, index + 1, current);
}
```

For `nums = [1,2,3]`, answer:

1. What does `current` represent at every recursion level?
    
2. Why is `remove()` placed exactly between the two recursive calls?
    
3. What would happen if `remove()` were moved after the second recursive call?
    
4. What invariant must be true before `generate(index, current)` begins?
    
5. What invariant must be true when that invocation returns?
    

That last question is particularly important. It forces you to understand **backtracking as a state-preserving recursive abstraction**, rather than merely memorizing the `add → recurse → remove` pattern.

---

# Recursion Patterns Completed So Far

```text
                    RECURSION
                       │
          ┌────────────┴────────────┐
          │                         │
       LINEAR                    BRANCHING
          │                         │
     ┌────┴────┐              ┌─────┴─────┐
     │         │              │           │
   Tail     Return         Tree       Backtracking
   │        Value          Recursion       │
   │          │               │            │
no pending  child result   multiple      choices
work        → parent        calls         ↓
                         dependency      recurse
                                        ↓
                                       undo
```

The next important pattern is **Divide and Conquer**.

It will build directly on what we just learned, but there is a critical difference:

```text
Backtracking:
    explore many possible choices

Divide & Conquer:
    split one problem into smaller subproblems,
    solve them, then combine their results
```

That leads directly into **merge sort, quicksort, binary search, recurrence trees, and `O(n log n)` complexity**.