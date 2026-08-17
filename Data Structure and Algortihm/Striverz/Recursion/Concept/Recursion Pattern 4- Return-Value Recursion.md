
Now we move from simply understanding **when code executes** to understanding **how a recursive result travels back through the call stack**.

This pattern is fundamental because many important recursive algorithms have the form:

```text
solve(current state)
    ↓
solve(smaller state)
    ↓
receive result
    ↓
combine current state with result
    ↓
return
```

The key concept is:

> **A recursive call can act as a value-producing subproblem. The parent frame suspends until that value is available, then uses it to complete its own computation.**

---

## 1. Start with the simplest example

Consider:

```java
static int sum(int n) {
    if (n == 0) {
        return 0;
    }

    return n + sum(n - 1);
}
```

Call:

```text
sum(4)
```

Mathematically:

```text
sum(4)
= 4 + sum(3)

sum(3)
= 3 + sum(2)

sum(2)
= 2 + sum(1)

sum(1)
= 1 + sum(0)

sum(0)
= 0
```

But this mathematical representation does **not yet show the runtime behavior**.

Let's see what actually happens.

---

# 2. `sum(4)` creates the first frame

Execution begins:

```text
sum(4)
```

Frame:

```text
┌──────────────────────────────┐
│ Frame: sum(4)                │
├──────────────────────────────┤
│ n = 4                        │
│ recursive result = unknown   │
│ pending computation:         │
│     4 + recursive_result     │
└──────────────────────────────┘
```

The important point is that:

```java
return 4 + sum(3);
```

cannot return yet.

Why?

Because `sum(3)` hasn't produced a value.

So the frame is suspended.

---

# 3. `sum(3)` creates another frame

The stack becomes:

```text
TOP
│
├── sum(3)
│   n = 3
│   pending: 3 + result_of_sum(2)
│
└── sum(4)
    n = 4
    pending: 4 + result_of_sum(3)
BOTTOM
```

Again, `sum(3)` cannot finish because it needs `sum(2)`.

---

# 4. Continue until the base case

Eventually:

```text
TOP
│
├── sum(0)
│   n = 0
│   returns 0
│
├── sum(1)
│   pending: 1 + result
│
├── sum(2)
│   pending: 2 + result
│
├── sum(3)
│   pending: 3 + result
│
└── sum(4)
    pending: 4 + result
BOTTOM
```

This is the **maximum stack depth**.

The recursive expansion stops because:

```java
if (n == 0) {
    return 0;
}
```

The base case provides the first actual value.

That value is:

```text
0
```

---

# 5. Now the important part: return propagation

`sum(0)` returns:

```text
0
```

Now `sum(1)` becomes active.

Its frame was waiting for:

```text
result_of_sum(0)
```

Now that value exists:

```text
result = 0
```

So:

```text
sum(1)
= 1 + 0
= 1
```

It returns:

```text
1
```

---

Then `sum(2)` resumes.

Its pending computation was:

```text
2 + result_of_sum(1)
```

The child returned:

```text
1
```

Therefore:

```text
sum(2)
= 2 + 1
= 3
```

Returns:

```text
3
```

---

Then:

```text
sum(3)
= 3 + 3
= 6
```

Then:

```text
sum(4)
= 4 + 6
= 10
```

Complete return chain:

```text
sum(0) → 0
    ↑
sum(1) → 1
    ↑
sum(2) → 3
    ↑
sum(3) → 6
    ↑
sum(4) → 10
```

---

# 6. The most important visualization

For return-value recursion, visualize **two separate phases**.

### Phase 1 — Dependency creation

```text
sum(4)
   ↓ needs
sum(3)
   ↓ needs
sum(2)
   ↓ needs
sum(1)
   ↓ needs
sum(0)
```

Each parent is waiting for its child.

### Phase 2 — Value propagation

```text
sum(0) → 0
   ↓
sum(1) → 1
   ↓
sum(2) → 3
   ↓
sum(3) → 6
   ↓
sum(4) → 10
```

The call direction and result direction are therefore opposite:

```text
CALL:
4 → 3 → 2 → 1 → 0

RETURN:
0 → 1 → 2 → 3 → 4
```

This is the core mechanism.

---

# 7. What exactly does a frame remember?

This is where I want you to stop thinking of a stack frame as merely:

```text
function + parameters
```

For recursive execution, conceptually think:

```text
Frame
├── local variables
├── parameters
├── current execution position
├── return location
└── pending computation
```

For:

```java
static int sum(int n) {
    if (n == 0) {
        return 0;
    }

    return n + sum(n - 1);
}
```

the `sum(4)` frame has something conceptually equivalent to:

```text
n = 4

I called:
    sum(3)

I cannot finish until:
    sum(3) returns

When it returns:
    compute 4 + returned_value

Then:
    return that result to my caller
```

This is the **execution state** that makes recursion work.

---

# 8. A local variable makes this even clearer

Rewrite the function:

```java
static int sum(int n) {
    if (n == 0) {
        return 0;
    }

    int childResult = sum(n - 1);

    int result = n + childResult;

    return result;
}
```

Now the state is easier to visualize.

For `sum(3)` before `sum(2)` returns:

```text
Frame: sum(3)

n = 3

childResult = ?
result = not calculated

waiting for:
    sum(2)
```

After `sum(2)` returns `3`:

```text
Frame: sum(3)

n = 3

childResult = 3

result = 3 + 3
        = 6

return 6
```

The recursive invocation therefore changes the state of its parent by supplying a value.

---

# 9. Base case is the source of the first value

This is extremely important.

Consider:

```java
static int sum(int n) {
    if (n == 0) {
        return 0;
    }

    return n + sum(n - 1);
}
```

Where does the first result come from?

Not from `sum(4)`.

Not from `sum(3)`.

Not from `sum(2)`.

The first known result is created by:

```text
sum(0) → 0
```

Then that result propagates upward.

So you can visualize the base case as the point where the recursive dependency chain gets its first resolved value:

```text
UNKNOWN
   ↓
UNKNOWN
   ↓
UNKNOWN
   ↓
UNKNOWN
   ↓
KNOWN: 0
   ↓
KNOWN: 1
   ↓
KNOWN: 3
   ↓
KNOWN: 6
   ↓
KNOWN: 10
```

---

# 10. Another example: factorial

Consider:

```java
static int factorial(int n) {
    if (n == 0) {
        return 1;
    }

    return n * factorial(n - 1);
}
```

Call:

```text
factorial(4)
```

Call phase:

```text
factorial(4)
    ↓
factorial(3)
    ↓
factorial(2)
    ↓
factorial(1)
    ↓
factorial(0)
```

Base:

```text
factorial(0) → 1
```

Return phase:

```text
factorial(1)
= 1 × 1
= 1

factorial(2)
= 2 × 1
= 2

factorial(3)
= 3 × 2
= 6

factorial(4)
= 4 × 6
= 24
```

So:

```text
factorial(0) → 1
       ↓
factorial(1) → 1
       ↓
factorial(2) → 2
       ↓
factorial(3) → 6
       ↓
factorial(4) → 24
```

---

# 11. Return-value recursion as a recurrence

This structure:

```java
return n + sum(n - 1);
```

corresponds directly to:

```text
T(n) = T(n - 1) + O(1)
```

But be careful.

There are **two different things** here:

```text
Recursive result:
    sum(n) = n + sum(n-1)

Runtime complexity:
    T(n) = T(n-1) + O(1)
```

The first describes **what value the function computes**.

The second describes **how much computational work it performs**.

Do not confuse them.

---

# 12. Return recursion can calculate different things

The same structure can compute:

### Sum

```java
return n + sum(n - 1);
```

### Product

```java
return n * product(n - 1);
```

### Maximum

```java
return Math.max(arr[index], max(arr, index + 1));
```

### Count

```java
return 1 + count(arr, index + 1);
```

The general structure is:

```text
current state
      ↓
recursive subproblem
      ↓
child result
      ↓
combine(current state, child result)
      ↓
return
```

This is the **return-value recursion pattern**.

---

# 13. A general template

For a linear recursive problem:

```java
static ReturnType solve(State state) {

    if (baseCondition(state)) {
        return baseResult;
    }

    ReturnType childResult =
        solve(smallerState(state));

    return combine(state, childResult);
}
```

The important components are:

```text
1. State
2. Base case
3. Smaller subproblem
4. Child result
5. Combination rule
```

For sum:

```text
State:
    n

Base:
    n == 0 → 0

Smaller problem:
    n - 1

Child result:
    sum(n - 1)

Combination:
    n + childResult
```

---

# 14. Why this is different from tail recursion

Compare:

### Return-value recursion

```java
return n + sum(n - 1);
```

The parent needs the result.

Therefore:

```text
parent
   ↓
child
   ↓
child result
   ↓
parent computes
```

### Tail recursion

```java
return sum(n - 1, accumulator + n);
```

The computation has already been performed before the child call.

Therefore:

```text
parent
   ↓
new state
   ↓
child
```

There is no computation waiting for the child's result.

This is the fundamental difference:

```text
Return-value recursion:

child produces value
       ↓
parent consumes value


Tail recursion:

parent produces next state
       ↓
child continues with state
```

---

# 15. Return recursion and stack frames

For:

```java
sum(4)
```

the stack at maximum depth is:

```text
TOP
│
├── sum(0)
│   return value = 0
│
├── sum(1)
│   waiting for sum(0)
│   pending: 1 + childResult
│
├── sum(2)
│   waiting for sum(1)
│   pending: 2 + childResult
│
├── sum(3)
│   waiting for sum(2)
│   pending: 3 + childResult
│
└── sum(4)
    waiting for sum(3)
    pending: 4 + childResult
BOTTOM
```

After `sum(0)` returns:

```text
TOP
│
├── sum(1)
│   childResult = 0
│   computes 1
│
├── sum(2)
│   waiting
│
├── sum(3)
│   waiting
│
└── sum(4)
    waiting
```

After `sum(1)` returns:

```text
TOP
│
├── sum(2)
│   childResult = 1
│   computes 3
│
├── sum(3)
│   waiting
│
└── sum(4)
    waiting
```

And so on.

This is exactly what **return-value propagation** means.

---

# 16. The recursion tree is still just a chain

For:

```text
sum(n)
```

there is only one recursive call.

So the recursion tree is technically:

```text
sum(4)
  |
sum(3)
  |
sum(2)
  |
sum(1)
  |
sum(0)
```

It is a tree structurally, but with only one child per node.

That means:

```text
Time  = O(n)
Space = O(n)
```

The interesting complexity changes when an invocation starts producing **multiple recursive calls**.

That is the next major transition.

---

# 17. The critical limitation of linear return recursion

Consider:

```java
static int fibonacci(int n) {
    if (n <= 1) {
        return n;
    }

    return fibonacci(n - 1) + fibonacci(n - 2);
}
```

Now the parent does not depend on one child.

It depends on **two children**:

```text
fibonacci(n)
       │
       ├── fibonacci(n - 1)
       │
       └── fibonacci(n - 2)
```

This fundamentally changes the recursion structure.

Instead of:

```text
chain
```

we now get:

```text
tree
```

For `fibonacci(4)`:

```text
                 fib(4)
                /      \
             fib(3)    fib(2)
             /   \      /   \
          fib(2) fib(1) fib(1) fib(0)
          /   \
       fib(1) fib(0)
```

Now we have entered a completely different recursion pattern:

# **Multiple / Tree Recursion**

That is where recursion becomes significantly more interesting.

---

# Practice Problems — Return-Value Recursion

## Level 1 — Trace

### 1. Sum

Trace:

```java
static int sum(int n) {
    if (n == 0) {
        return 0;
    }

    return n + sum(n - 1);
}
```

For:

```text
sum(4)
```

Write every call and every returned value.

---

### 2. Factorial

Trace:

```java
static int factorial(int n) {
    if (n == 0) {
        return 1;
    }

    return n * factorial(n - 1);
}
```

For:

```text
factorial(5)
```

Show both:

```text
CALL PHASE
RETURN PHASE
```

---

## Level 2 — Understand the frame

### 3. Pending computation

For:

```java
static int f(int n) {
    if (n == 0) {
        return 10;
    }

    return n * f(n - 1);
}
```

When `f(4)` has called `f(0)`, describe the pending computation stored conceptually in each frame.

Then calculate the final result.

---

### 4. Change the base case

Modify:

```java
static int sum(int n) {
    if (n == 0) {
        return 0;
    }

    return n + sum(n - 1);
}
```

so that:

```text
sum(0) = 10
```

Then calculate:

```text
sum(3)
```

This tests whether you understand that the **base-case result becomes the initial value propagated upward**.

---

## Level 3 — Implementation

### 5. Recursive array sum

Implement:

```text
sum(arr, index)
```

using return-value recursion.

For:

```text
[4, 8, 2, 7]
```

produce:

```text
21
```

Your recursive structure should conceptually be:

```text
arr[index] + sum(index + 1)
```

---

### 6. Recursive maximum

Implement:

```text
max(arr, index)
```

using return-value recursion.

For:

```text
[5, 2, 17, 4, 9]
```

return:

```text
17
```

You must define what the base case returns and how the parent combines its own value with the child's result.

---

## Level 4 — State decomposition

### 7. Count occurrences

Implement:

```text
count(arr, index, target)
```

using return-value recursion.

Example:

```text
arr = [2, 5, 2, 7, 2]
target = 2
```

Result:

```text
3
```

The parent should combine:

```text
current element contribution
+
child result
```

---

### 8. Recursive string length

Implement:

```text
length(str, index)
```

without using the string's built-in length operation inside the recursive logic.

For:

```text
"hello"
```

return:

```text
5
```

---

## Level 5 — Hard

### 9. Recursive binary search

Implement recursive binary search:

```text
search(arr, left, right, target)
```

Return the target's index or `-1`.

You must identify:

```text
current state
smaller subproblem
base case
recursive result
parent decision
```

Notice that this is still return-value recursion, but the state reduction is no longer simply:

```text
n → n - 1
```

---

### 10. Hard — Recursive exponentiation

Implement:

```text
power(x, n)
```

using return-value recursion.

First implement the straightforward:

```text
xⁿ = x × xⁿ⁻¹
```

version.

Then derive a more efficient recursive formulation using:

```text
n / 2
```

and compare their recursion structures.

Do **not** implement the optimized version until you can explain why its recursion tree is smaller.

---

### 11. Challenge — Fibonacci tree

Trace:

```java
static int fib(int n) {
    if (n <= 1) {
        return n;
    }

    return fib(n - 1) + fib(n - 2);
}
```

for:

```text
fib(5)
```

Draw the complete recursion tree.

Then identify:

1. Number of recursive children per non-base invocation.
    
2. Why this is no longer linear recursion.
    
3. Which subproblems are computed repeatedly.
    
4. Maximum recursion depth.
    
5. Why the recursion tree and call stack are **not the same thing**.
    

That last distinction is critical.

---

## Current recursion model

At this point, the progression is:

```text
1. Linear recursion
       │
       └── one recursive child
               │
2. Tail recursion
       │
       └── no pending computation
               │
3. Head / return-phase recursion
       │
       └── pending work executes during unwinding
               │
4. Return-value recursion
       │
       └── parent consumes child's returned value
               │
               ▼
5. Multiple / Tree recursion
       │
       └── multiple recursive subproblems
```

**Next: Multiple Recursion / Tree Recursion.**

This is the point where we stop thinking about recursion as a simple vertical chain and start visualizing the **recursion tree, execution order, call stack, duplicated subproblems, and state of each branch**. That distinction will be essential before we move into divide-and-conquer and backtracking.