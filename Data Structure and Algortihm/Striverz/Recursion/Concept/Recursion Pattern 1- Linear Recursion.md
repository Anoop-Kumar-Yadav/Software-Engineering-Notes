
---

## 1. The pattern

The structural form is:

```text
f(n)
 │
 └── f(n - 1)
      │
      └── f(n - 2)
           │
           └── ...
```

There is exactly **one recursive call per invocation**.

A minimal example:

```java
static void print(int n) {
    if (n == 0) {
        return;
    }

    System.out.println(n);
    print(n - 1);
}
```

Suppose:

```text
print(3)
```

The recursive relationship is:

```text
print(3)
    ↓
print(2)
    ↓
print(1)
    ↓
print(0)
```

This looks simple, but the important part is understanding **what each invocation is doing while the next invocation exists**.

---

# 2. One function call is one execution state

Start with:

```java
print(3);
```

The runtime creates an execution frame for `print(3)`.

Conceptually:

```text
┌─────────────────────────┐
│ Frame: print(3)         │
├─────────────────────────┤
│ parameter n = 3         │
│ current execution point │
│ return information      │
└─────────────────────────┘
```

Then execution reaches:

```java
print(n - 1);
```

which becomes:

```java
print(2);
```

The existing `print(3)` invocation does **not** get replaced.

It is suspended.

A new frame is created:

```text
TOP
│
├── Frame: print(2)
│   n = 2
│
└── Frame: print(3)
    n = 3
BOTTOM
```

The top frame is currently executing.

The lower frame is waiting.

---

# 3. Why does `print(3)` need to remain alive?

Consider the code:

```java
static void print(int n) {
    if (n == 0) {
        return;
    }

    System.out.println(n);
    print(n - 1);
}
```

When `print(3)` reaches:

```java
print(2);
```

the current invocation hasn't technically completed yet.

It needs to know:

> "After `print(2)` finishes, where should execution return?"

The runtime therefore maintains enough information to resume the suspended invocation.

Conceptually:

```text
print(3)
│
├── n = 3
├── already executed: println(3)
├── next operation: call print(2)
└── resume after print(2) returns
```

This is the essential property of the call stack.

---

# 4. Building the entire stack

Let's execute:

```java
print(3);
```

### Step 1 — `print(3)`

```text
Stack

TOP
│
├── print(3)
│   n = 3
│   state: executing
│
└── caller
```

It prints:

```text
3
```

Then reaches:

```java
print(2);
```

---

### Step 2 — `print(2)`

Now:

```text
TOP
│
├── print(2)
│   n = 2
│   state: executing
│
├── print(3)
│   n = 3
│   state: suspended
│
└── caller
```

`print(3)` remains underneath.

`print(2)` prints:

```text
2
```

Then calls `print(1)`.

---

### Step 3 — `print(1)`

```text
TOP
│
├── print(1)
│   n = 1
│   state: executing
│
├── print(2)
│   n = 2
│   state: suspended
│
├── print(3)
│   n = 3
│   state: suspended
│
└── caller
```

It prints:

```text
1
```

Then calls:

```java
print(0);
```

---

### Step 4 — `print(0)`

```text
TOP
│
├── print(0)
│   n = 0
│
├── print(1)
│   n = 1
│
├── print(2)
│   n = 2
│
├── print(3)
│   n = 3
│
└── caller
```

Now:

```java
if (n == 0) {
    return;
}
```

is true.

Therefore `print(0)` does not create another invocation.

It returns.

---

# 5. The return phase

This is where recursion becomes much more interesting.

The stack was:

```text
TOP
│
├── print(0)
├── print(1)
├── print(2)
├── print(3)
└── caller
```

`print(0)` returns.

Its frame is removed:

```text
TOP
│
├── print(1)
├── print(2)
├── print(3)
└── caller
```

Now `print(1)` resumes.

There is no more code after:

```java
print(n - 1);
```

so `print(1)` reaches the end of the function and returns.

Its frame disappears:

```text
TOP
│
├── print(2)
├── print(3)
└── caller
```

Then:

```text
print(2) returns
```

and:

```text
TOP
│
├── print(3)
└── caller
```

Finally:

```text
print(3) returns
```

and the stack returns to the original caller.

---

# 6. Complete execution visualization

The complete execution is therefore:

```text
                 CALL PHASE
─────────────────────────────────────

print(3)
   │
   │ creates
   ▼
print(2)
   │
   │ creates
   ▼
print(1)
   │
   │ creates
   ▼
print(0)
   │
   │ base case
   ▼
 return


                 RETURN PHASE
─────────────────────────────────────

print(0) returns
   ↑
print(1) resumes → returns
   ↑
print(2) resumes → returns
   ↑
print(3) resumes → returns
```

The stack depth behaves like:

```text
depth 1    print(3)
depth 2    print(2)
depth 3    print(1)
depth 4    print(0)
depth 3    print(1)
depth 2    print(2)
depth 1    print(3)
depth 0    caller
```

This is the first important recursion lifecycle:

```text
GROW STACK
    ↓
REACH BASE CASE
    ↓
SHRINK STACK
```

---

# 7. Now introduce work after recursion

The previous example had no meaningful work after the recursive call.

Consider:

```java
static void print(int n) {
    if (n == 0) {
        return;
    }

    print(n - 1);

    System.out.println(n);
}
```

Now the execution behavior changes.

For:

```text
print(3)
```

the call phase is still:

```text
print(3)
 ↓
print(2)
 ↓
print(1)
 ↓
print(0)
```

But after `print(0)` returns, each parent has **pending work**.

This is crucial.

---

# 8. Pending work inside a stack frame

When `print(3)` executes:

```java
print(n - 1);

System.out.println(n);
```

after calling `print(2)`, it cannot execute:

```java
System.out.println(3);
```

yet.

It must wait.

So conceptually its state becomes:

```text
print(3)
├── n = 3
├── recursive call print(2)
├── recursive call completed? NO
└── pending operation:
      System.out.println(3)
```

Similarly:

```text
print(2)
├── n = 2
└── pending:
      System.out.println(2)
```

and:

```text
print(1)
├── n = 1
└── pending:
      System.out.println(1)
```

Therefore, immediately before the base case:

```text
TOP
│
├── print(0)
│
├── print(1)
│   pending → print 1
│
├── print(2)
│   pending → print 2
│
├── print(3)
│   pending → print 3
│
└── caller
```

Now `print(0)` returns.

---

# 9. Returning activates the pending work

After `print(0)` returns:

```text
print(1)
```

becomes the active frame.

Its recursive call has completed.

Therefore it can execute its pending statement:

```java
System.out.println(1);
```

Then it returns.

Next:

```text
print(2)
```

resumes and executes:

```java
System.out.println(2);
```

Then:

```text
print(3)
```

resumes and executes:

```java
System.out.println(3);
```

Output:

```text
1
2
3
```

This gives us an extremely important rule:

> **A recursive call divides a function's execution into the part before the call and the part after the call.**

For this example:

```text
print(3)

BEFORE recursive call
    nothing

RECURSIVE CALL
    print(2)

AFTER recursive call
    print(3)
```

The "after" section is effectively **pending work stored in the suspended execution state**.

---

# 10. Head recursion vs tail recursion

This naturally gives us two important forms.

### Tail-style recursion

The recursive call is effectively the final operation:

```java
static void f(int n) {
    if (n == 0) {
        return;
    }

    System.out.println(n);
    f(n - 1);
}
```

Execution:

```text
3
2
1
```

There is no meaningful recursive work after the call.

### Head-style recursion

The recursive call occurs before the main work:

```java
static void f(int n) {
    if (n == 0) {
        return;
    }

    f(n - 1);
    System.out.println(n);
}
```

Execution:

```text
1
2
3
```

The difference is not the recursive depth.

Both have:

```text
O(n)
```

stack depth.

The difference is **where the work occurs relative to the recursive call**.

---

# 11. The real pattern behind linear recursion

The most general form is:

```text
f(state)
│
├── perform some work
│
├── transform state
│
├── call f(newState)
│
└── optionally perform pending work
```

The important part is:

```text
state → newState
```

For our example:

```text
3 → 2 → 1 → 0
```

The recursion is therefore a **state-transition chain**.

```text
S₀
 ↓
S₁
 ↓
S₂
 ↓
S₃
 ↓
BASE
```

There is no branching.

That's why we call it **linear recursion**.

---

# 12. Time complexity from the execution

Suppose:

```java
static void f(int n) {
    if (n == 0) {
        return;
    }

    // O(1) work

    f(n - 1);

    // O(1) work
}
```

The recurrence is:

```text
T(n) = T(n - 1) + O(1)
```

Expand it:

```text
T(n)
= T(n - 1) + 1

= T(n - 2) + 1 + 1

= T(n - 3) + 1 + 1 + 1

...

= T(0) + n
```

Therefore:

```text
T(n) = O(n)
```

We are not memorizing this.

We derived it from the fact that:

```text
one invocation
    →
one additional invocation
    →
n levels
```

---

# 13. Space complexity

This is where call-stack understanding matters.

At maximum depth:

```text
f(n)
f(n-1)
f(n-2)
...
f(0)
```

There are approximately `n + 1` simultaneously active frames.

Therefore:

```text
Space = O(n)
```

The recursion tree is:

```text
f(n)
 |
f(n-1)
 |
f(n-2)
 |
...
 |
f(0)
```

and the maximum active path is also `O(n)`.

So:

```text
Time  → O(n)
Space → O(n)
```

---

# 14. What you should mentally see

Whenever you see:

```java
f(n - 1);
```

inside a function, don't immediately think:

> "This function repeats."

Instead visualize:

```text
Current frame
     │
     ├── current state
     ├── work already completed
     ├── recursive call
     └── pending work
              │
              ▼
        New stack frame
              │
              ├── new state
              ├── ...
              └── ...
```

And remember that the recursive calls form a **logical dependency chain**:

```text
f(3)
depends on
f(2)
depends on
f(1)
depends on
f(0)
```

The base case resolves the deepest dependency first.

Then results/control propagate upward.

---

# 15. First pattern summary

Linear recursion has:

```text
Number of recursive calls per invocation: 1

Recursion shape:
    chain

State transition:
    n → smaller n

Call phase:
    stack grows

Base case:
    stops further expansion

Return phase:
    stack shrinks

Typical depth:
    O(n)

Typical time:
    O(n)
```

The **most important concept from this pattern** is not `O(n)`. It is this:

> **A recursive invocation is an independent execution state. When it calls another invocation, the current state is suspended. When the child returns, the parent resumes from the point immediately after the recursive call, using whatever pending state it had retained.**

That mechanism is the foundation for every more complex recursion pattern.

---

Understood. From now on, **every recursion topic will end with a problem set**, ordered from easy → hard, and the problems will test the exact concept we just learned rather than unrelated DSA patterns.

For the **Linear Recursion** topic we just completed:

## Practice Problems — Linear Recursion

### Level 1 — Trace the execution

**1. Predict the output**

```java
static void f(int n) {
    if (n == 0) {
        return;
    }

    System.out.println(n);
    f(n - 1);
}
```

What is the output for `f(5)`?

Then draw the call stack at the moment `f(0)` is executing.

---

**2. Predict the output**

```java
static void f(int n) {
    if (n == 0) {
        return;
    }

    f(n - 1);
    System.out.println(n);
}
```

What is the output for `f(5)`?

Explain why the output order differs from Problem 1.

---

### Level 2 — Understand the stack

**3. Stack-state tracing**

For:

```java
static void f(int n) {
    if (n == 0) {
        return;
    }

    f(n - 1);
    System.out.println(n);
}
```

Trace `f(3)`.

At the deepest point, explicitly represent:

```text
TOP
f(?)
f(?)
f(?)
f(?)
BOTTOM
```

For every frame, identify its `n` value and its **pending operation**.

---

**4. Return-value tracing**

Trace this manually:

```java
static int sum(int n) {
    if (n == 0) {
        return 0;
    }

    return n + sum(n - 1);
}
```

For `sum(4)`, show:

```text
sum(0) → ?
sum(1) → ?
sum(2) → ?
sum(3) → ?
sum(4) → ?
```

Then identify what each suspended frame is waiting for.

---

### Level 3 — Implement linear recursion

**5. Recursive countdown**

Implement:

```text
countDown(n)
```

that prints:

```text
n n-1 n-2 ... 1
```

using recursion only.

Then implement the same behavior with the recursive call placed before the print and explain the resulting difference.

---

**6. Recursive sum**

Implement:

```text
sum(1, n)
```

that returns:

```text
1 + 2 + 3 + ... + n
```

using linear recursion.

Do **not** use loops.

---

**7. Recursive power**

Implement:

```text
power(x, n)
```

that computes:

```text
xⁿ
```

using linear recursion.

For example:

```text
power(2, 5) → 32
```

You should be able to draw the call chain and return chain.

---

### Level 4 — State reasoning

**8. Reverse a number**

Implement a recursive function that reverses the digits of an integer.

Example:

```text
12345 → 54321
```

The important challenge is not the recursion itself; determine **what state must move between recursive calls**.

---

**9. Recursive digit sum**

Implement:

```text
digitSum(12345)
```

such that:

```text
1 + 2 + 3 + 4 + 5 = 15
```

You must explain the state transition:

```text
12345
  ↓
1234
  ↓
123
  ↓
12
  ↓
1
  ↓
0
```

and the return propagation.

---

### Level 5 — Harder reasoning

**10. Recursive string processing**

Implement:

```text
isPalindrome("racecar")
```

using recursion.

You should identify:

```text
current state
↓
smaller state
↓
base case
↓
return condition
```

---

**11. Recursive array traversal**

Implement a recursive function that finds the maximum element of:

```text
[4, 9, 2, 17, 6, 3]
```

without using a loop.

Your explanation must distinguish between:

```text
array state
current index
recursive subproblem
returned maximum
```

---

**12. Hard — Recursive linear search**

Implement:

```text
search(arr, index, target)
```

that returns the index of `target`, or `-1` if it doesn't exist.

For:

```text
arr = [7, 3, 9, 2, 8]
target = 2
```

trace every invocation and show exactly how the final result propagates back.

---

### The progression

These problems deliberately progress through:

```text
Tracing
   ↓
Call-stack visualization
   ↓
Pending state
   ↓
Return values
   ↓
State transformation
   ↓
Recursive implementation
   ↓
Recursive problem decomposition
```

**We will use this same Easy → Hard problem progression for every future recursion pattern.**

Next: **Tail Recursion**, where we'll examine precisely what changes in the stack frame when there is no pending computation after the recursive call.