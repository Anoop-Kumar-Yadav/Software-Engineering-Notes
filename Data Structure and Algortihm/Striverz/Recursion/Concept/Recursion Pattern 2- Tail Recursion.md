
Tail recursion is the next natural step because we already understand that a recursive frame can remain suspended with **pending work**.

The defining question is:

> **What happens when the recursive call is the final operation of the current function?**

That is tail recursion.

---

## 1. Definition

A recursive function is **tail-recursive** when the recursive call is the final computation performed by that invocation.

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

Look at the execution order:

```text
print(n)
    ↓
print current value
    ↓
call print(n - 1)
    ↓
function has nothing left to do
```

After:

```java
print(n - 1);
```

there is no operation that depends on the recursive call's completion.

Compare that with:

```java
static void print(int n) {
    if (n == 0) {
        return;
    }

    print(n - 1);
    System.out.println(n);
}
```

Here the parent invocation still has work to perform after the recursive call.

Therefore this is **not tail recursion**.

---

# 2. The critical difference: pending work

Let's compare the two.

### Non-tail recursion

```java
static void f(int n) {
    if (n == 0) {
        return;
    }

    f(n - 1);

    System.out.println(n);
}
```

When `f(3)` calls `f(2)`, its frame contains:

```text
f(3)
├── n = 3
└── pending:
      println(3)
```

So `f(3)` must remain active.

---

### Tail recursion

```java
static void f(int n) {
    if (n == 0) {
        return;
    }

    System.out.println(n);
    f(n - 1);
}
```

When `f(3)` calls `f(2)`:

```text
f(3)
├── n = 3
└── no pending computation
```

The only thing `f(3)` needs to do is wait for `f(2)` to finish so that the function invocation can return.

This distinction is fundamental:

```text
Non-tail:
    recursive call
         ↓
    parent still has work

Tail:
    recursive call
         ↓
    parent has no work
```

---

# 3. Execute tail recursion step-by-step

Consider:

```java
static void f(int n) {
    if (n == 0) {
        return;
    }

    System.out.println(n);
    f(n - 1);
}
```

Call:

```text
f(3)
```

### First invocation

```text
┌──────────────────────┐
│ f(3)                 │
├──────────────────────┤
│ n = 3                │
│ println(3) completed │
│ next = f(2)          │
│ pending work = none  │
└──────────────────────┘
```

It calls `f(2)`.

---

### Second invocation

```text
┌──────────────────────┐
│ f(2)                 │
├──────────────────────┤
│ n = 2                │
│ println(2) completed │
│ next = f(1)          │
│ pending work = none  │
└──────────────────────┘
```

The stack:

```text
TOP
│
├── f(2)
│   n = 2
│   pending = none
│
└── f(3)
    n = 3
    pending = none
BOTTOM
```

---

### Third invocation

```text
TOP
│
├── f(1)
│   n = 1
│   pending = none
│
├── f(2)
│   n = 2
│   pending = none
│
└── f(3)
    n = 3
    pending = none
BOTTOM
```

Then `f(1)` calls `f(0)`.

---

### Base case

```text
TOP
│
├── f(0)
│   n = 0
│
├── f(1)
├── f(2)
└── f(3)
BOTTOM
```

`f(0)` returns.

Then:

```text
f(1) returns
f(2) returns
f(3) returns
```

No frame has any meaningful computation to perform during the return phase.

---

# 4. So why does the stack still grow?

This is an important point.

You might think:

> "If there is no pending work, why can't the previous frame disappear?"

Conceptually, it **could**, if the language/runtime implemented tail-call optimization.

But **Java does not perform general tail-call elimination**.

Therefore Java still creates a new stack frame for each recursive invocation.

For:

```text
f(5)
```

the stack can still reach:

```text
f(5)
f(4)
f(3)
f(2)
f(1)
f(0)
```

Therefore in Java:

```text
Space = O(n)
```

even though the recursion is tail-recursive.

---

# 5. Tail-call optimization

Some languages/runtimes can recognize:

```text
current function
      ↓
tail call
      ↓
same continuation
```

and reuse the current stack frame instead of creating another one.

Conceptually:

```text
Without optimization:

f(5)
 ↓
f(4)
 ↓
f(3)
 ↓
f(2)
 ↓
f(1)
 ↓
f(0)
```

Stack depth:

```text
O(n)
```

With tail-call elimination:

```text
f(5)
 ↓
reuse frame
 ↓
f(4)
 ↓
reuse frame
 ↓
f(3)
 ↓
reuse frame
...
```

The stack could remain approximately:

```text
O(1)
```

But this is a **runtime/language implementation property**, not a property that automatically follows from writing tail-recursive code.

For our Java learning:

> **Tail recursion does not give us O(1) stack space.**

---

# 6. Tail recursion with an accumulator

Tail recursion becomes particularly useful when a computation can be moved into an explicit parameter.

Consider factorial.

The straightforward recursive version is:

```java
static int factorial(int n) {
    if (n == 0) {
        return 1;
    }

    return n * factorial(n - 1);
}
```

This is **not tail-recursive**.

Why?

Because after:

```java
factorial(n - 1)
```

returns, the parent still needs to perform:

```text
n × returned_value
```

So:

```text
factorial(5)
pending: 5 × ?
```

---

# 7. Convert factorial into tail recursion

We can move the accumulated computation into a parameter:

```java
static int factorial(int n, int accumulator) {
    if (n == 0) {
        return accumulator;
    }

    return factorial(n - 1, accumulator * n);
}
```

Call:

```java
factorial(5, 1)
```

Now the state evolves:

```text
factorial(5, 1)
        ↓
factorial(4, 5)
        ↓
factorial(3, 20)
        ↓
factorial(2, 60)
        ↓
factorial(1, 120)
        ↓
factorial(0, 120)
        ↓
return 120
```

Notice what changed.

In the original version:

```text
factorial(5)
    waits for factorial(4)
        waits for factorial(3)
            ...
```

Each frame has pending multiplication.

In the accumulator version:

```text
factorial(5, 1)
```

already computes the next state:

```text
accumulator * n
```

before making the recursive call.

Therefore:

```text
factorial(5, 1)
    ↓
factorial(4, 5)
```

The previous frame has no remaining computation.

---

# 8. Understand the accumulator precisely

The accumulator is not some special recursion feature.

It is simply **explicit state passed between recursive invocations**.

For factorial:

```text
n = remaining work
accumulator = result accumulated so far
```

Initial state:

```text
n = 5
accumulator = 1
```

Transition:

```text
(n, acc)
    ↓
(n - 1, acc × n)
```

Therefore:

```text
(5, 1)
 ↓
(4, 5)
 ↓
(3, 20)
 ↓
(2, 60)
 ↓
(1, 120)
 ↓
(0, 120)
```

At the base case:

```text
n = 0
```

all required computation has already been performed.

So:

```text
return accumulator
```

---

# 9. Tail recursion is really about continuation

There is a deeper way to understand this.

Suppose:

```java
return n * factorial(n - 1);
```

The current invocation has a continuation:

```text
"After factorial(n - 1) returns,
multiply its result by n."
```

So:

```text
factorial(5)
    continuation:
        multiply returned value by 5
```

Tail recursion removes that continuation.

Instead:

```java
return factorial(n - 1, accumulator * n);
```

The multiplication has already happened.

The next invocation receives the complete state.

Therefore:

```text
Current frame
    ↓
compute next state
    ↓
tail-call next invocation
    ↓
nothing remains
```

This is the technical reason tail recursion matters.

---

# 10. Tail recursion and iteration

Look at:

```java
static int factorial(int n, int acc) {
    if (n == 0) {
        return acc;
    }

    return factorial(n - 1, acc * n);
}
```

The state transition is:

```text
(n, acc)
    ↓
(n - 1, acc × n)
```

That is almost exactly what an iterative loop does.

Equivalent iterative form:

```java
static int factorial(int n) {
    int acc = 1;

    while (n > 0) {
        acc = acc * n;
        n--;
    }

    return acc;
}
```

The conceptual state is identical:

```text
Iteration:

n, acc
 ↓
new n, new acc
 ↓
new n, new acc
 ↓
...

Tail recursion:

n, acc
 ↓
recursive call with new n, new acc
 ↓
recursive call with new n, new acc
 ↓
...
```

So one useful mental model is:

> **Tail recursion represents an iterative state transition using function calls instead of an explicit loop.**

---

# 11. Tail recursion does not mean "no stack"

This distinction is worth making explicit.

There are three separate concepts:

```text
Tail-recursive algorithm
        ≠
Tail-call optimization
        ≠
O(1) recursion space
```

They are related, but not identical.

|Concept|Meaning|
|---|---|
|Tail recursion|Recursive call is the final computation|
|Tail-call optimization|Runtime/compiler reuses the current frame|
|O(1) stack|Maximum active stack frames remain constant|

A language may support tail recursion without automatically optimizing it.

Java is the important case for us:

```text
Tail recursion: YES
General tail-call elimination: NO
Therefore recursive stack: O(n)
```

---

# 12. Recognizing tail recursion

When you encounter recursive code, inspect the statement containing the recursive call.

### Tail recursive

```java
return f(nextState);
```

or:

```java
f(nextState);
return;
```

provided there is no computation dependent on `f(nextState)`.

### Not tail recursive

```java
return x + f(nextState);
```

because the parent needs the result.

Also:

```java
f(nextState);
x++;
```

is not tail recursive because work remains afterward.

And:

```java
f(nextState);
return x;
```

is technically not a tail call in the strict sense because the recursive call is not the final returned computation.

The test is:

> **Once the recursive call returns, does the current invocation need to perform anything?**

If yes → not tail recursion.

If no → tail recursion.

---

# 13. Trace a tail-recursive function

Consider:

```java
static void f(int n) {
    if (n == 0) {
        return;
    }

    System.out.println(n);
    f(n - 1);
}
```

For:

```text
f(3)
```

the call tree is:

```text
f(3)
 |
f(2)
 |
f(1)
 |
f(0)
```

But the frame state is:

```text
f(3)
├── n = 3
└── pending computation = none

f(2)
├── n = 2
└── pending computation = none

f(1)
├── n = 1
└── pending computation = none

f(0)
├── n = 0
└── base case
```

This is the core visualization you should retain.

---

# 14. Complexity

For:

```java
static void f(int n) {
    if (n == 0) {
        return;
    }

    f(n - 1);
}
```

we have:

```text
T(n) = T(n - 1) + O(1)
```

Therefore:

```text
Time = O(n)
```

In Java:

```text
Maximum stack depth = O(n)
Space = O(n)
```

If a runtime performs proper tail-call optimization:

```text
Space = O(1)
```

But again, that is dependent on the runtime.

---

# 15. The mental model

For **linear tail recursion**, visualize:

```text
                STATE TRANSITION

        (n, state)
             │
             │ compute next state
             ▼
        (n-1, state')
             │
             ▼
        (n-2, state'')
             │
             ▼
            ...
             │
             ▼
          BASE CASE
```

Each frame has:

```text
current state
     +
next recursive state
     +
no pending computation
```

Whereas non-tail recursion has:

```text
current state
     +
recursive call
     +
pending computation
```

That difference will become extremely important when we reach **return-value recursion, tree recursion, and divide-and-conquer**.

---

# Practice Problems — Tail Recursion

## Level 1 — Recognition

### 1. Identify the pattern

Determine whether each function is tail-recursive.

```java
static int f(int n) {
    if (n == 0) return 0;

    return n + f(n - 1);
}
```

```java
static void g(int n) {
    if (n == 0) return;

    System.out.println(n);
    g(n - 1);
}
```

For each one, explain **what the parent frame must do after the recursive call returns**.

---

### 2. Predict the output

```java
static void f(int n) {
    if (n == 0) {
        return;
    }

    System.out.println(n);
    f(n - 1);
}
```

What is printed for:

```text
f(4)
```

Then determine the maximum stack depth.

---

## Level 2 — State tracing

### 3. Trace the accumulator

Trace:

```java
static int factorial(int n, int acc) {
    if (n == 0) {
        return acc;
    }

    return factorial(n - 1, acc * n);
}
```

For:

```text
factorial(4, 1)
```

Create the complete state sequence:

```text
(n, acc)
↓
(n, acc)
↓
...
```

Then explain why no frame has multiplication pending.

---

### 4. Convert to tail recursion

Convert:

```java
static int sum(int n) {
    if (n == 0) {
        return 0;
    }

    return n + sum(n - 1);
}
```

into a tail-recursive version using an accumulator.

---

## Level 3 — Implementation

### 5. Tail-recursive countdown

Implement:

```text
countDown(n)
```

using tail recursion.

Then explain:

- current state
    
- next state
    
- base case
    
- why the recursive call is the final operation
    

---

### 6. Tail-recursive array sum

Implement a function that computes the sum of an array using:

```text
index
accumulator
```

For example:

```text
[2, 4, 6, 8]
```

should produce:

```text
20
```

Your recursive state should look conceptually like:

```text
(index, sum)
```

---

## Level 4 — Conversion

### 7. Convert this recursion

```java
static int power(int x, int n) {
    if (n == 0) {
        return 1;
    }

    return x * power(x, n - 1);
}
```

Convert it into a tail-recursive implementation using an accumulator.

Trace:

```text
power(2, 4)
```

---

## Level 5 — Hard

### 8. Tail-recursive GCD

Implement Euclid's algorithm using tail recursion:

```text
gcd(a, b)
```

using the state transition:

```text
(a, b)
→
(b, a % b)
```

Trace:

```text
gcd(48, 18)
```

until the base case.

---

### 9. Hard — Tail-recursive reverse

Implement a recursive function that reverses a string using an accumulator.

For:

```text
"abcd"
```

the recursive state should progressively represent:

```text
remaining input
+
result accumulated so far
```

Trace every state transition.

---

### 10. Challenge — Identify whether conversion is possible

Consider:

```java
static int f(int n) {
    if (n <= 1) {
        return n;
    }

    int x = f(n - 1);
    int y = f(n - 2);

    return x + y;
}
```

Determine:

1. Is this tail-recursive?
    
2. How many recursive calls does each non-base invocation create?
    
3. What does the recursion tree look like?
    
4. Why can't this be converted into _simple_ linear tail recursion merely by adding an accumulator?
    

This last problem is important because it forces you to distinguish **tail recursion** from **multiple recursion**.

---

## What comes next

After tail recursion, we'll move to **head recursion and return-phase recursion** in much greater depth. That topic will connect directly to the question:

> **Why does code after a recursive call execute in reverse order?**

From there we'll build into **return-value recursion**, where the suspended frame doesn't merely wait—it carries a computation that depends on the returned value.