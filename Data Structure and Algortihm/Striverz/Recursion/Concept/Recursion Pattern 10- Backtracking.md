

We now move from **Divide and Conquer** to **Backtracking**.

This is an important transition because the recursive tree now represents something different. In Divide and Conquer, branches represent **subproblems that must be solved**. In Backtracking, branches represent **choices that we are exploring**.

The fundamental execution pattern is:

```text
choose
   ↓
modify state
   ↓
recurse
   ↓
explore
   ↓
undo state
   ↓
choose next option
```

The most important operation here is **undo**.

---

# 1. What exactly is Backtracking?

Suppose we have a set:

```text
[1, 2, 3]
```

and want to generate all subsets.

At every element we have two choices:

```text
include the element
exclude the element
```

For `1`:

```text
                    []
                  /    \
               include  exclude
                 1         -
```

Then for `2`:

```text
                    []
                  /    \
                 [1]    []
                /  \    / \
              [1,2] [1] [2] []
```

And so on.

The recursive tree represents **possible decisions**.

The algorithm explores one branch, returns, changes the state back, and explores another branch.

---

# 2. The core difference from Divide and Conquer

Compare them directly.

### Divide and Conquer

```text
Problem
   ↓
divide
   ↓
subproblem A + subproblem B
   ↓
solve A
solve B
   ↓
combine results
```

### Backtracking

```text
Current state
   ↓
make choice A
   ↓
explore A
   ↓
undo choice A
   ↓
make choice B
   ↓
explore B
   ↓
undo choice B
```

The difference is:

> **Divide and Conquer divides the problem. Backtracking explores the state-space of possible decisions.**

---

# 3. The Backtracking state

The most important thing to understand is the **state carried by each recursive call**.

Consider generating subsets.

We can define:

```text
backtrack(index, currentSubset)
```

So the state is:

```text
index
currentSubset
```

For example:

```text
index = 1
currentSubset = [1]
```

means:

> We have already made decisions for indices before `1`, and the current selected elements are `[1]`.

The recursive function is therefore not simply:

```text
solve(smallerProblem)
```

Instead, it is:

```text
continueExploration(currentState)
```

That distinction is fundamental.

---

# 4. The state-space tree

For:

```text
[1,2,3]
```

the complete decision tree is:

```text
                         []
                    /          \
                 [1]            []
               /    \          /    \
           [1,2]    [1]      [2]      []
           /  \      / \      / \      / \
      [1,2,3][1,2][1,3][1][2,3][2][3][]
```

Every edge represents a decision.

For example:

```text
[] → [1]
```

means:

```text
choose/include 1
```

while:

```text
[] → []
```

means:

```text
exclude 1
```

---

# 5. There is no "combine" phase like Merge Sort

This is an important distinction.

Merge Sort:

```text
left result
     +
right result
     ↓
combine
```

Backtracking:

```text
make choice
     ↓
recurse
     ↓
undo choice
```

The return from recursion does not necessarily produce a value that the parent combines.

Instead, the parent restores its state.

So the recursive lifecycle becomes:

```text
ENTER
  ↓
CHECK STATE
  ↓
MAKE CHOICE
  ↓
MODIFY STATE
  ↓
RECURSE
  ↓
RESTORE STATE
  ↓
NEXT CHOICE
  ↓
RETURN
```

---

# 6. First Backtracking example — Generate subsets

Let's implement:

```java
import java.util.ArrayList;
import java.util.List;

public class Subsets {

    static void backtrack(
            int[] nums,
            int index,
            List<Integer> current,
            List<List<Integer>> result
    ) {
        if (index == nums.length) {
            result.add(new ArrayList<>(current));
            return;
        }

        // Choice 1: include nums[index]
        current.add(nums[index]);

        backtrack(nums, index + 1, current, result);

        current.remove(current.size() - 1);

        // Choice 2: exclude nums[index]
        backtrack(nums, index + 1, current, result);
    }

    static List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();

        backtrack(nums, 0, new ArrayList<>(), result);

        return result;
    }
}
```

The important code is:

```java
current.add(nums[index]);

backtrack(...);

current.remove(current.size() - 1);
```

That is the heart of backtracking.

---

# 7. Why do we remove the element?

Suppose:

```text
current = []
```

We choose `1`:

```text
current = [1]
```

Then recursively explore:

```text
backtrack(1, [1])
```

That branch eventually finishes.

Now we need to explore:

```text
exclude 1
```

The state must become:

```text
current = []
```

Therefore:

```java
current.remove(current.size() - 1);
```

restores the parent's state.

Without this operation, the next branch would incorrectly inherit the previous branch's decision.

---

# 8. Visualizing state mutation

Start:

```text
current = []
```

Choose `1`:

```text
current = [1]
```

Recurse.

Inside that branch, choose `2`:

```text
current = [1,2]
```

Recurse.

Then choose `3`:

```text
current = [1,2,3]
```

Base case reached.

Now return.

We must undo `3`:

```text
current = [1,2]
```

Return again.

Undo `2`:

```text
current = [1]
```

Now explore the other choice for `2`.

Eventually:

```text
current = [1,3]
```

Then that branch finishes.

Undo `3`:

```text
current = [1]
```

Then eventually return to the root.

Undo `1`:

```text
current = []
```

Now the root can explore the branch where `1` is excluded.

This is the exact state flow.

---

# 9. Call stack + mutable state

This is where Backtracking becomes more interesting than ordinary recursion.

Consider:

```text
backtrack(index, current)
```

The call stack might look like:

```text
TOP
│
├── backtrack(2, [1,2])
├── backtrack(1, [1])
├── backtrack(0, [])
└── ...
BOTTOM
```

But `current` is often the **same mutable ArrayList object** being modified and restored.

So conceptually:

```text
root
current → []
   │
   ├── add 1
   │
   ↓
current → [1]
   │
   ├── add 2
   │
   ↓
current → [1,2]
```

After returning:

```text
remove 2
```

the same object becomes:

```text
current → [1]
```

Then another branch can reuse it.

This is why backtracking implementations frequently use:

```text
one mutable state object
+
modify
+
recursive call
+
undo
```

rather than creating a completely new state for every branch.

---

# 10. The critical invariant

Backtracking algorithms depend heavily on an invariant.

For subset generation:

> **Before entering a recursive call, `current` contains exactly the decisions selected along the current path.**

And:

> **After returning from that recursive call, `current` must be restored to exactly the state it had before the call.**

This gives us:

```text
Before choice:
    S

After choice:
    S'

After recursion:
    S

```

Formally:

```text
S
 ↓
makeChoice
 ↓
S'
 ↓
recurse(S')
 ↓
undoChoice
 ↓
S
```

That restoration property is what makes branch isolation possible.

---

# 11. The Backtracking template

Most backtracking algorithms can be mentally reduced to:

```java
void backtrack(State state) {

    if (isComplete(state)) {
        record(state);
        return;
    }

    for (Choice choice : choices(state)) {

        apply(choice, state);

        backtrack(state);

        undo(choice, state);
    }
}
```

The structure is:

```text
             current state
                  │
             complete?
              /      \
            yes       no
            │          │
          record       choices
                       │
                 ┌─────┼─────┐
                 ↓     ↓     ↓
               choice choice choice
                 │     │     │
               apply apply apply
                 │     │     │
               recurse...
                 │     │     │
                undo  undo  undo
```

This template is extremely important.

---

# 12. Backtracking is DFS over a state-space tree

The decision tree can be considered a graph.

For subsets:

```text
                       []
                    /      \
                  [1]       []
                 /   \     /   \
             [1,2] [1]   [2]   []
```

Backtracking performs a **depth-first traversal** of this state-space tree.

It does not generate all nodes simultaneously.

Execution follows:

```text
[]
 ↓
[1]
 ↓
[1,2]
 ↓
[1,2,3]
```

Then:

```text
backtrack
```

and explores:

```text
[1,2]
 ↓
[1,2 without 3]
```

and so on.

So:

> **Backtracking is fundamentally recursive DFS over possible states, with state restoration when DFS returns from a branch.**

---

# 13. Choice → Constraint → Recursion → Undo

Backtracking becomes much more powerful when we introduce constraints.

Suppose we're placing queens on a chessboard.

For every row:

```text
choose a column
```

But not every column is valid.

We check:

```text
Is this column occupied?
Is the main diagonal occupied?
Is the anti-diagonal occupied?
```

If invalid:

```text
skip branch
```

If valid:

```text
place queen
recurse
remove queen
```

The pattern becomes:

```text
for each choice:

    if invalid:
        continue

    make choice

    recurse

    undo choice
```

The `if invalid` step is called **pruning**.

---

# 14. Backtracking with pruning

Without pruning:

```text
                    choices
                  /    |    \
                 /     |     \
             branch  branch  branch
              /|\      /|\      /|\
             ...
```

With pruning:

```text
                    choices
                  /    |    \
                 /     X     \
                /            \
            valid           valid
             /                \
           ...                ...
```

An entire subtree can be eliminated without exploring it.

This is one of the major reasons backtracking can solve problems whose naive search space is enormous.

---

# 15. N-Queens state

For N-Queens, suppose:

```text
N = 4
```

A useful recursive state is:

```text
row
board
```

Meaning:

```text
row = next row where we need to place a queen
```

For example:

```text
row = 2
```

means:

```text
rows 0 and 1 have already been processed.
Now choose a column for row 2.
```

The board represents the decisions made so far.

---

# 16. N-Queens recursion

The conceptual algorithm:

```text
solve(row):

    if row == n:
        solution found
        return

    for col = 0 ... n-1:

        if position(row, col) is invalid:
            continue

        place queen

        solve(row + 1)

        remove queen
```

The state transition:

```text
(row, board)
       │
       ├── choose column 0
       │
       ├── choose column 1
       │
       ├── choose column 2
       │
       └── choose column 3
```

But invalid choices are pruned.

---

# 17. Why the recursion depth is `N`

At each recursive call:

```text
row → row + 1
```

Therefore:

```text
0
1
2
3
...
N
```

Maximum recursion depth:

```text
O(N)
```

However, the number of possible states can be enormous.

This is another important distinction:

```text
recursion depth
≠
number of states explored
```

Backtracking algorithms often have relatively small stack depth but exponential search trees.

---

# 18. Permutations

Now consider:

```text
[1,2,3]
```

We want:

```text
[1,2,3]
[1,3,2]
[2,1,3]
[2,3,1]
[3,1,2]
[3,2,1]
```

The decision at each level is:

> Which unused element should occupy the current position?

State:

```text
current
used[]
```

At depth `0`:

```text
[]
```

Choices:

```text
1
2
3
```

Suppose we choose `1`:

```text
[1]
```

Remaining:

```text
2,3
```

Choose `2`:

```text
[1,2]
```

Remaining:

```text
3
```

Choose `3`:

```text
[1,2,3]
```

Base case.

Then undo:

```text
[1,2]
```

Undo:

```text
[1]
```

Choose `3` instead:

```text
[1,3]
```

Then:

```text
[1,3,2]
```

This is backtracking.

---

# 19. Permutation implementation

```java
import java.util.ArrayList;
import java.util.List;

public class Permutations {

    static void backtrack(
            int[] nums,
            boolean[] used,
            List<Integer> current,
            List<List<Integer>> result
    ) {
        if (current.size() == nums.length) {
            result.add(new ArrayList<>(current));
            return;
        }

        for (int i = 0; i < nums.length; i++) {

            if (used[i]) {
                continue;
            }

            used[i] = true;
            current.add(nums[i]);

            backtrack(nums, used, current, result);

            current.remove(current.size() - 1);
            used[i] = false;
        }
    }

    static List<List<Integer>> permutations(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();

        backtrack(
                nums,
                new boolean[nums.length],
                new ArrayList<>(),
                result
        );

        return result;
    }
}
```

The critical restoration is:

```java
current.remove(current.size() - 1);
used[i] = false;
```

Both pieces of state must be restored.

---

# 20. Multiple state variables must be restored

Suppose the state is:

```text
current
used
remaining
board
```

If a recursive choice modifies:

```text
current
used
```

then both must be restored.

A common bug is:

```text
modify state A
modify state B
recurse
undo A
```

while forgetting:

```text
undo B
```

Then the next branch inherits corrupted state.

The invariant becomes broken.

Correct:

```text
modify A
modify B

recurse

undo B
undo A
```

The order is usually the reverse of modification.

This follows a **last-modified, first-restored** discipline.

---

# 21. Backtracking state as a transaction

Technically, you can think about one recursive branch as:

```text
current state
      ↓
apply decision
      ↓
temporary state
      ↓
execute entire subtree
      ↓
rollback
      ↓
original state
```

The rollback is not optional.

The branch must leave the state exactly as it found it.

This is why backtracking is sometimes described as:

```text
DFS + state mutation + rollback
```

That is a more precise description than simply calling it "recursion."

---

# 22. Backtracking vs brute force

This distinction is important.

Suppose there are `2^n` subsets.

A brute-force approach might generate every possible combination independently.

Backtracking instead constructs the state incrementally:

```text
[]
 ↓
[1]
 ↓
[1,2]
 ↓
[1,2,3]
```

and then rolls back:

```text
[1,2]
[1]
[]
```

This allows:

- shared state,
    
- early constraint checks,
    
- pruning,
    
- no need to construct unnecessary branches.
    

So backtracking is still often exponential, but it gives us **control over the search space**.

---

# 23. Backtracking complexity

For subsets:

Each element has two choices:

```text
include
exclude
```

Therefore:

[  
2^n  
]

possible subsets.

The recursion tree approximately has:

```text
1
2
4
8
...
2^n
```

nodes at the levels.

Therefore time is at least:

[  
O(2^n)  
]

And if we actually copy every subset into the result, each subset can contain up to `n` elements.

Therefore output construction can require:

[  
O(n2^n)  
]

time.

This is an important complexity distinction:

```text
number of solutions = 2^n

size of all solutions = n × 2^n
```

---

# 24. Permutation complexity

For `n` distinct elements, there are:

[  
n!  
]

permutations.

The recursion tree roughly behaves as:

```text
level 0 → 1
level 1 → n
level 2 → n(n-1)
level 3 → n(n-1)(n-2)
...
level n → n!
```

Therefore:

```text
number of complete solutions = n!
```

If every permutation is copied:

[  
O(n\cdot n!)  
]

time is commonly required just to materialize the output.

The recursion depth is only:

[  
O(n)  
]

Again:

```text
depth = O(n)

number of explored states = exponential/factorial
```

---

# 25. Backtracking recursion tree vs Divide-and-Conquer tree

This distinction should now be very clear.

### Merge Sort

```text
                   problem
                 /         \
              half         half
               ↓            ↓
             solve        solve
               \            /
                \          /
                  combine
```

The children are **subproblems**.

### Subsets

```text
                    state
                  /       \
              include    exclude
                ↓           ↓
             state        state
              / \          / \
             ...          ...
```

The children are **choices**.

Therefore:

```text
Divide & Conquer:
    branch = independent subproblem

Backtracking:
    branch = possible decision
```

That distinction will help you recognize patterns in interviews.

---

# 26. Backtracking tree has a path meaning

In Divide and Conquer:

```text
root → child
```

usually means:

```text
problem range became smaller
```

In Backtracking:

```text
root → child
```

means:

```text
one additional decision has been made
```

For example:

```text
[]
 ↓ choose 2
[2]
 ↓ choose 3
[2,3]
 ↓ choose 1
[2,3,1]
```

The path itself represents a **partial solution**.

This is one of the strongest ways to visualize backtracking.

---

# 27. Partial solution

At any point in the recursion:

```text
current
```

is a **partial solution**.

For permutations:

```text
[2,3]
```

means:

```text
positions 0 and 1 are fixed.
```

For N-Queens:

```text
row = 3
```

means:

```text
rows 0,1,2 have been assigned.
```

For combination sum:

```text
current = [2,2]
remaining = 3
```

means:

```text
we have selected 2 + 2
and still need to construct sum 3.
```

The exact state representation changes by problem, but the principle remains:

> **Each recursive call represents one partial solution plus the information required to continue constructing it.**

---

# 28. Pruning

Now we introduce the most powerful part.

Suppose we are solving:

```text
Combination Sum
target = 7
```

Current:

```text
[2,2]
```

Current sum:

```text
4
```

If the next candidate causes:

```text
sum > 7
```

there is no reason to recurse.

Instead:

```text
if (sum > target) {
    return;
}
```

This cuts the entire subtree.

Without pruning:

```text
                    state
              /       |       \
            ...      ...      ...
          huge     huge     huge
```

With pruning:

```text
                    state
              /       |       \
             valid   INVALID   valid
                       X
```

The invalid branch disappears.

---

# 29. Three conditions in backtracking

A mature backtracking implementation usually contains three logical checks.

### 1. Completion

```text
Have we constructed a complete solution?
```

If yes:

```text
record answer
return
```

### 2. Validity

```text
Can this state possibly lead to a solution?
```

If no:

```text
return
```

This is pruning.

### 3. Choice exploration

```text
For every possible valid choice:
    make choice
    recurse
    undo choice
```

So:

```text
if complete:
    record

if invalid:
    return

for each choice:
    choose
    recurse
    undo
```

---

# 30. The complete backtracking state machine

You should now visualize every backtracking call as:

```text
                  ENTER STATE
                       │
                       ↓
                Is solution complete?
                  /            \
                YES             NO
                 │               │
              record        Is state invalid?
                 │             /       \
               return        YES       NO
                              │         │
                            return    generate choices
                                          │
                                ┌─────────┼─────────┐
                                ↓         ↓         ↓
                              choice    choice    choice
                                │         │         │
                              apply     apply     apply
                                │         │         │
                              recurse   recurse   recurse
                                │         │         │
                              undo      undo      undo
                                │         │         │
                                └─────────┴─────────┘
                                          │
                                        RETURN
```

That is the core architecture of Backtracking.

---

# 31. Problems — Backtracking

We will progress from simple state exploration to constraint-based search.

## Level 1 — Basic state tree

### 1. Generate all subsets

Given:

```text
[1,2,3]
```

Draw the complete recursion tree.

For every node write:

```text
index
current
choice made
```

You should produce exactly:

[  
2^3=8  
]

subsets.

---

### 2. Generate binary strings

Generate every binary string of length `3`.

The choices at every level are:

```text
0
1
```

Your recursion tree should contain:

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

Identify:

```text
state
choice
base case
```

---

## Level 2 — State restoration

### 3. Trace the mutable state

Consider:

```text
current = []
```

and the operations:

```text
add(1)
recurse
remove(1)

add(2)
recurse
remove(2)
```

Draw the exact value of `current` after every operation.

The objective is to understand **why undo is required**, not merely memorize the code.

---

### 4. Generate permutations

For:

```text
[1,2,3]
```

draw the recursion tree.

At each node record:

```text
current
used[]
```

For example:

```text
current = [1,3]

used = [true,false,true]
```

Then determine exactly what gets restored when that branch returns.

---

# Level 3 — Constraint pruning

### 5. Combination Sum

Given:

```text
candidates = [2,3,6,7]
target = 7
```

Find all combinations whose sum is `7`.

Your recursion state should contain enough information to answer:

```text
current combination
current sum
next candidate index
```

Identify exactly where pruning happens.

---

### 6. Generate parentheses

For:

```text
n = 3
```

generate:

```text
((()))
(()())
(())()
()(())
()()()
```

The recursive state should contain:

```text
openCount
closeCount
currentString
```

The important constraint is:

```text
closeCount <= openCount
```

At what point does this condition prune a branch?

---

# Level 4 — Hard

### 7. N-Queens

Solve:

```text
N = 4
```

Your state should represent:

```text
current row
queen positions
```

For every attempted position determine:

```text
same column?
same main diagonal?
same anti-diagonal?
```

Draw the recursion tree **including pruned branches**.

---

### 8. Sudoku

Design the recursive state for a Sudoku solver.

You need to determine:

```text
What is the current state?

What is a choice?

What makes a choice invalid?

What is the base case?

What state must be restored?
```

Do not start with code. First construct the state machine.

---

# Level 5 — Expert

### 9. Word Search

Given a grid and a target word, determine whether the word exists by moving:

```text
up
down
left
right
```

State should contain something equivalent to:

```text
row
column
wordIndex
visited state
```

The difficult part is identifying exactly what must be restored after returning from a recursive branch.

---

### 10. N-Queens optimization

The basic N-Queens implementation checks every previously placed queen.

Design a version using:

```text
columns
main diagonals
anti-diagonals
```

as auxiliary state.

The goal is to reduce validity checking from scanning previous rows to approximately `O(1)` per candidate.

This is an important example of how **state design affects backtracking performance**.

---

# The Backtracking Pattern to Remember

Do not memorize "backtracking = recursion."

Instead memorize the execution protocol:

```text
                 CURRENT STATE
                       │
                       ↓
                 CHOOSE OPTION
                       │
                       ↓
                 MODIFY STATE
                       │
                       ↓
                   RECURSE
                       │
                       ↓
                  EXPLORE TREE
                       │
                       ↓
                  RESTORE STATE
                       │
                       ↓
               TRY NEXT OPTION
```

And the invariant:

```text
Before recursive call:
    state = state after making current choice

After recursive call:
    state = exactly the state before making that choice
```

That invariant is the heart of correct backtracking.

The next recursion pattern to learn is **Memoized Recursion / Top-Down Dynamic Programming**. It is especially important because it explains a major transformation:

```text
naive recursion
      ↓
repeated recursive states
      ↓
detect overlapping states
      ↓
cache state → result
      ↓
each state computed once
```

That will connect the recursion trees we have studied with **Dynamic Programming**, and we will distinguish very carefully between **state-space tree, overlapping subproblems, memoization, and DP state**.