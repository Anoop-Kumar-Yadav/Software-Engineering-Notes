
## 1. What exactly is recursion?

Recursion occurs when a function's execution causes another invocation of the **same function** before the current invocation has completed.

Consider:

```java
void f(int n) {
    if (n == 0) {
        return;
    }

    f(n - 1);
}
```

The important point is that `f(3)` does **not** become `f(2)`.

There are three separate function invocations:

```text
f(3)
f(2)
f(1)
```

Each invocation has its **own execution state**.

Conceptually:

```text
┌─────────────────────┐
│ f(3)                │
│ n = 3               │
│ waiting for f(2)    │
└─────────────────────┘
          ↓
┌─────────────────────┐
│ f(2)                │
│ n = 2               │
│ waiting for f(1)    │
└─────────────────────┘
          ↓
┌─────────────────────┐
│ f(1)                │
│ n = 1               │
│ waiting for f(0)    │
└─────────────────────┘
          ↓
┌─────────────────────┐
│ f(0)                │
│ n = 0               │
│ returns             │
└─────────────────────┘
```

This is the first mental model we need:

> **Every recursive call creates a new function execution state.**

---

# 2. What state does a recursive call maintain?

For understanding recursion, mentally associate every invocation with a **stack frame**.

A simplified frame contains:

```text
Function invocation
├── parameters
├── local variables
├── current execution position
├── pending computation
└── eventual return value
```

For:

```java
int factorial(int n) {
    if (n == 0) {
        return 1;
    }

    return n * factorial(n - 1);
}
```

When `factorial(3)` calls `factorial(2)`, the `factorial(3)` frame is still alive.

Its state is approximately:

```text
factorial(3)
├── n = 3
├── execution reached: return n * factorial(n - 1)
├── factorial(2) has been called
└── waiting for factorial(2)'s result
```

So the stack becomes:

```text
TOP
│
├── factorial(2)
│   └── waiting for factorial(1)
│
├── factorial(3)
│   └── waiting for factorial(2)
│
└── caller
BOTTOM
```

The **top frame executes**.

The lower frames are suspended.

This is the foundation of recursive execution.

---

# 3. The two phases of recursion

Almost every recursive algorithm becomes easier once you separate it into two phases:

```text
CALL PHASE
    ↓
recursive calls keep going deeper
    ↓
BASE CASE
    ↓
RETURN PHASE
    ↓
previous calls resume
```

For factorial:

```text
factorial(3)
    ↓
factorial(2)
    ↓
factorial(1)
    ↓
factorial(0)
    ↓
────────────
return phase
────────────
    ↑
factorial(1)
    ↑
factorial(2)
    ↑
factorial(3)
```

This distinction is extremely important.

During the **call phase**, the stack grows.

During the **return phase**, the stack shrinks.

---

# 4. Base case

Every well-formed recursion must have a condition that stops further recursive calls.

```java
if (n == 0) {
    return 1;
}
```

This is the **base case**.

Without it:

```text
f(5)
 ↓
f(4)
 ↓
f(3)
 ↓
...
 ↓
f(-∞)
```

The program keeps creating stack frames until the runtime cannot allocate another one.

So conceptually:

```text
Recursive function
       │
       ├── Base case
       │      └── stop creating calls
       │
       └── Recursive case
              └── create another invocation
```

But there is another requirement:

> The recursive call must make **progress toward the base case**.

For example:

```java
f(n - 1)
```

moves `n` toward `0`.

Whereas:

```java
f(n)
```

does not.

---

# 5. First recursion pattern: Linear recursion

The simplest pattern is:

```text
one invocation
      ↓
one recursive invocation
      ↓
one recursive invocation
      ↓
...
```

Example:

```java
void f(int n) {
    if (n == 0) {
        return;
    }

    System.out.println(n);

    f(n - 1);
}
```

For `f(3)`:

```text
f(3)
 │
 └── f(2)
      │
      └── f(1)
           │
           └── f(0)
```

This forms a **chain**, not a branching tree.

### State transition

```text
n = 3
 ↓
n = 2
 ↓
n = 1
 ↓
n = 0
```

### Complexity

There are `n + 1` calls.

Therefore:

```text
Time  = O(n)
Space = O(n)
```

The space comes from the **simultaneously active stack frames**.

That distinction matters:

```text
Number of calls ≠ simultaneously active calls
```

For this particular recursion they happen to both be `O(n)`.

---

# 6. Work before vs after recursion

This is one of the most important recursion patterns.

Consider:

```java
void f(int n) {
    if (n == 0) {
        return;
    }

    System.out.println(n);

    f(n - 1);
}
```

The work occurs **before** the recursive call.

For `f(3)`:

```text
CALL PHASE

f(3) → print 3
f(2) → print 2
f(1) → print 1
f(0)
```

Output:

```text
3
2
1
```

Now move the print:

```java
void f(int n) {
    if (n == 0) {
        return;
    }

    f(n - 1);

    System.out.println(n);
}
```

Now:

```text
CALL PHASE

f(3)
 ↓
f(2)
 ↓
f(1)
 ↓
f(0)

RETURN PHASE

f(1) → print 1
f(2) → print 2
f(3) → print 3
```

Output:

```text
1
2
3
```

This gives us a fundamental rule:

> **Code before the recursive call executes while descending. Code after the recursive call executes while returning.**

This becomes extremely important in trees, DFS, backtracking, and divide-and-conquer.

---

# 7. Recursion pattern: Return-value recursion

Now recursion doesn't merely perform an action; each invocation produces a value for its caller.

```java
int sum(int n) {
    if (n == 0) {
        return 0;
    }

    return n + sum(n - 1);
}
```

For `sum(3)`:

```text
sum(3)
│
│  n = 3
│  waiting for: 3 + ?
│
└── sum(2)
    │
    │  n = 2
    │  waiting for: 2 + ?
    │
    └── sum(1)
        │
        │  n = 1
        │  waiting for: 1 + ?
        │
        └── sum(0)
            │
            └── return 0
```

Now return propagation:

```text
sum(0)
→ 0

sum(1)
→ 1 + 0
→ 1

sum(2)
→ 2 + 1
→ 3

sum(3)
→ 3 + 3
→ 6
```

Notice the important state in each frame:

```text
sum(3)
pending: 3 + result_of(sum(2))

sum(2)
pending: 2 + result_of(sum(1))

sum(1)
pending: 1 + result_of(sum(0))
```

The recursive call acts like a computation whose result is **not available yet**.

---

# 8. Recursion pattern: Multiple recursive calls

Now we reach the first major branching pattern.

```java
void f(int n) {
    if (n == 0) {
        return;
    }

    f(n - 1);
    f(n - 1);
}
```

For `f(2)`:

```text
                 f(2)
                /    \
             f(1)    f(1)
             / \      / \
          f(0) f(0) f(0) f(0)
```

Now recursion is no longer a chain.

It is a **recursion tree**.

Each invocation can create multiple child invocations.

For a function producing two recursive calls:

```text
one call
   ↓
2 calls
   ↓
4 calls
   ↓
8 calls
   ↓
...
```

The number of calls grows exponentially.

For depth `n`:

```text
T(n) = 2T(n - 1) + O(1)
```

which gives:

```text
T(n) = O(2ⁿ)
```

This recurrence is much more important than simply memorizing `O(2ⁿ)`.

---

# 9. The crucial difference: recursion tree vs call stack

This distinction causes a lot of confusion.

Suppose:

```java
void f(int n) {
    if (n == 0) return;

    f(n - 1);
    f(n - 1);
}
```

The **recursion tree** is:

```text
              f(3)
             /    \
          f(2)    f(2)
          / \      / \
       f(1) f(1) f(1) f(1)
```

But the **call stack never contains the entire tree**.

Execution proceeds depth-first.

Conceptually:

```text
f(3)
 ↓
f(2)
 ↓
f(1)
 ↓
f(0)
 ↓
return
 ↑
f(1) resumes
 ↓
f(0)
 ↓
return
 ↑
f(2) resumes
 ↓
...
```

At one particular moment, the stack might be:

```text
TOP
│
├── f(0)
├── f(1)
├── f(2)
└── f(3)
BOTTOM
```

After `f(0)` returns:

```text
TOP
│
├── f(1)
├── f(2)
└── f(3)
BOTTOM
```

So:

> **The recursion tree represents all possible recursive invocations. The call stack represents only the currently active execution path.**

This distinction will become critical when deriving recursion-space complexity.

---

# 10. The recursion patterns we will learn

We will build these progressively:

|Pattern|Structure|
|---|---|
|**Linear recursion**|`f(n) → f(n-1)`|
|**Tail recursion**|recursive call is the final operation|
|**Head recursion**|recursive call happens before the main work|
|**Return-value recursion**|caller waits for recursive result|
|**Multiple recursion**|`f(n) → f(...) + f(...)`|
|**Divide-and-conquer**|divide problem → recursively solve parts → combine|
|**Tree recursion**|recursive branching naturally forms a tree|
|**Backtracking recursion**|choose → recurse → undo state|
|**Recursive traversal**|recursively visit tree/graph structure|
|**Memoized recursion**|recursion + cached subproblem results|
|**Mutual recursion**|function A calls B, B calls A|

But we will **not jump between them**. Each pattern will be derived from the execution model we just established.

## The mental model to retain

Whenever you see recursion, immediately ask:

```text
1. What is the current invocation's state?
2. What is the base case?
3. What changes toward the base case?
4. Does this invocation create one call or multiple calls?
5. What work happens before the recursive call?
6. What work happens after it?
7. What value/state is returned?
8. What does the caller do with that returned value?
9. What does the current call stack look like?
10. What does the complete recursion tree look like?
```

If you can answer those ten questions, recursion stops being mysterious.

**Next, we should take one simple recursive function and trace its call stack frame-by-frame, including exactly what each frame stores and how the instruction resumes after the child call returns.** That is the foundation for understanding every recursion pattern that follows.