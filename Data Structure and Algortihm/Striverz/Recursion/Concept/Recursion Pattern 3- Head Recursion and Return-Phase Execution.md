
We now move to **head recursion**, but the important concept is actually broader: **how the return phase executes work that was suspended during the call phase**.

You already saw this behavior in the previous topic. Now we will isolate it and understand exactly why it happens.

---

## 1. What is head recursion?

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

The recursive call occurs **before the current invocation's main work**.

The execution structure is:

```text
f(n)
│
├── recursive call
│      ↓
│    f(n-1)
│
└── work after recursive call
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

Only after `f(0)` returns does the pending work begin executing.

---

# 2. The critical idea: execution is suspended

Consider:

```java
static void f(int n) {
    if (n == 0) {
        return;
    }

    f(n - 1);

    System.out.println(n);
}
```

When `f(3)` reaches:

```java
f(2);
```

the function has not finished.

Its state is approximately:

```text
f(3)
├── n = 3
├── recursive call = f(2)
└── pending work = println(3)
```

So the frame remains on the call stack.

Then `f(2)` creates another frame:

```text
TOP
│
├── f(2)
│   n = 2
│   pending = println(2)
│
└── f(3)
    n = 3
    pending = println(3)
BOTTOM
```

Then `f(1)`:

```text
TOP
│
├── f(1)
│   n = 1
│   pending = println(1)
│
├── f(2)
│   n = 2
│   pending = println(2)
│
└── f(3)
    n = 3
    pending = println(3)
BOTTOM
```

Then `f(0)`:

```text
TOP
│
├── f(0)
├── f(1) → pending println(1)
├── f(2) → pending println(2)
└── f(3) → pending println(3)
BOTTOM
```

Now the direction changes.

---

# 3. The return phase

`f(0)` executes:

```java
if (n == 0) {
    return;
}
```

So:

```text
f(0) → return
```

Its frame disappears.

The new top frame is:

```text
f(1)
```

But `f(1)` has pending work:

```text
println(1)
```

Therefore it executes:

```text
println(1)
```

Then returns.

Next:

```text
f(2)
```

resumes:

```text
println(2)
```

Then returns.

Finally:

```text
f(3)
```

resumes:

```text
println(3)
```

Therefore:

```text
1
2
3
```

---

# 4. Why does the order reverse?

The original calls were created in this order:

```text
f(3)
f(2)
f(1)
f(0)
```

But stack removal occurs in the opposite direction:

```text
f(0)
f(1)
f(2)
f(3)
```

This happens because the call stack is **LIFO**:

```text
Last In
First Out
```

So the deepest recursive invocation finishes first.

Then its caller resumes.

Then that caller's caller resumes.

Therefore, whenever work is placed **after** a recursive call, that work naturally executes while the stack is unwinding.

```text
CALL PHASE:

f(3)
 ↓
f(2)
 ↓
f(1)
 ↓
f(0)


RETURN PHASE:

f(0)
 ↑
f(1)
 ↑
f(2)
 ↑
f(3)
```

This is the fundamental reason head recursion can produce reversed output.

---

# 5. Before-call work vs after-call work

Compare these two functions.

### Work before recursion

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
f(3)
→ print 3
→ f(2)
   → print 2
   → f(1)
      → print 1
```

Output:

```text
3
2
1
```

The work happens during **stack growth**.

---

### Work after recursion

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
f(3)
→ f(2)
   → f(1)
      → f(0)

      ← print 1
   ← print 2
← print 3
```

Output:

```text
1
2
3
```

The work happens during **stack unwinding**.

This gives us a rule worth memorizing conceptually:

> **Before the recursive call = descending phase. After the recursive call = ascending/return phase.**

---

# 6. The stack contains the future work

This is a very important mental model.

When we reach:

```java
f(n - 1);
System.out.println(n);
```

the stack is effectively storing a sequence of pending operations.

For `f(3)`:

```text
TOP
│
├── f(1)
│   pending: print 1
│
├── f(2)
│   pending: print 2
│
└── f(3)
    pending: print 3
```

When `f(0)` finishes, the pending operations become executable one by one:

```text
print 1
print 2
print 3
```

So you can think of the recursive call stack as containing:

```text
CURRENT EXECUTION
+
SUSPENDED FUTURE EXECUTION
```

That is a much more accurate mental model than simply saying "recursion calls itself."

---

# 7. Head recursion is not necessarily reverse traversal

The term **head recursion** only tells us that the recursive call happens before the current operation.

For example:

```java
static void f(int n) {
    if (n == 0) {
        return;
    }

    f(n - 1);

    if (n % 2 == 0) {
        System.out.println(n);
    }
}
```

The recursion is still head recursion, but its output isn't simply a complete reversal.

The more general rule is:

```text
recursive call
     ↓
child completely executes
     ↓
current invocation resumes
     ↓
current work executes
```

The exact output depends on what the current work is.

---

# 8. Head recursion with return values

Now make the pending operation depend on the recursive result:

```java
static int sum(int n) {
    if (n == 0) {
        return 0;
    }

    int result = sum(n - 1);

    return n + result;
}
```

Call:

```text
sum(3)
```

At `sum(3)`:

```text
sum(3)
├── n = 3
├── calls sum(2)
└── pending:
      result = returned_value_from_sum(2)
      return 3 + result
```

Then:

```text
sum(2)
├── n = 2
├── calls sum(1)
└── pending:
      result = returned_value_from_sum(1)
      return 2 + result
```

Then:

```text
sum(1)
├── n = 1
├── calls sum(0)
└── pending:
      result = returned_value_from_sum(0)
      return 1 + result
```

Finally:

```text
sum(0)
→ return 0
```

Now the return phase becomes:

```text
sum(1)
→ result = 0
→ 1 + 0
→ 1

sum(2)
→ result = 1
→ 2 + 1
→ 3

sum(3)
→ result = 3
→ 3 + 3
→ 6
```

This is the transition from **head recursion** into **return-value recursion**.

---

# 9. What exactly is stored in the frame?

For:

```java
static int sum(int n) {
    if (n == 0) {
        return 0;
    }

    int result = sum(n - 1);

    return n + result;
}
```

When `sum(3)` calls `sum(2)`, conceptually:

```text
Frame: sum(3)

n = 3
result = not available yet

pending:
    call sum(2)

after child returns:
    result = child return value

then:
    return 3 + result
```

The parent frame therefore represents a **partially completed computation**.

That is the important difference from a simple `void` traversal.

---

# 10. Recursive dependency chain

You can visualize the computation as:

```text
sum(3)
  depends on
sum(2)
  depends on
sum(1)
  depends on
sum(0)
```

The dependency direction is:

```text
3 → 2 → 1 → 0
```

But the result becomes available in the opposite direction:

```text
0 → 1 → 2 → 3
```

Therefore:

```text
CALL:
3 → 2 → 1 → 0

RETURN:
0 → 1 → 2 → 3
```

This pattern appears everywhere in recursive algorithms.

---

# 11. Head recursion and arrays

Consider:

```java
static void printArray(int[] arr, int index) {
    if (index == arr.length) {
        return;
    }

    printArray(arr, index + 1);

    System.out.println(arr[index]);
}
```

For:

```text
[10, 20, 30, 40]
```

the call chain is:

```text
printArray(0)
    ↓
printArray(1)
    ↓
printArray(2)
    ↓
printArray(3)
    ↓
printArray(4)
```

At `index == 4`, the base case returns.

Then:

```text
index = 3 → print 40
index = 2 → print 30
index = 1 → print 20
index = 0 → print 10
```

Output:

```text
40
30
20
10
```

The array wasn't physically reversed.

The **execution order** was reversed because the operation was positioned after the recursive call.

---

# 12. A powerful visualization technique

Whenever you see:

```java
f(index + 1);
process(index);
```

draw two columns:

```text
CALL PHASE             RETURN PHASE

index 0                process(3)
   ↓
index 1                process(2)
   ↓
index 2                process(1)
   ↓
index 3                process(0)
   ↓
base
```

More precisely:

```text
CALL PHASE
──────────

frame(0)
    pending process(0)

frame(1)
    pending process(1)

frame(2)
    pending process(2)

frame(3)
    pending process(3)

base


RETURN PHASE
────────────

frame(3) → process(3)
frame(2) → process(2)
frame(1) → process(1)
frame(0) → process(0)
```

This visualization will later become almost identical to **postorder tree traversal**.

---

# 13. Connection to tree traversal

Suppose a binary tree node has:

```text
left
right
```

A postorder traversal is:

```java
void postorder(Node node) {
    if (node == null) {
        return;
    }

    postorder(node.left);
    postorder(node.right);

    process(node);
}
```

Notice the structure:

```text
recursive calls
      ↓
recursive calls
      ↓
process current node
```

That is essentially head/post-recursive execution applied to a **branching structure**.

For a linked chain:

```text
A → B → C
```

you have:

```text
f(A)
 ↓
f(B)
 ↓
f(C)
 ↓
process(C)
process(B)
process(A)
```

For a tree, the same return-phase principle operates over branches.

This is why understanding recursion at the call-stack level is much more useful than memorizing traversal names.

---

# 14. Head recursion complexity

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

the recurrence is:

```text
T(n) = T(n - 1) + O(1)
```

Therefore:

```text
Time = O(n)
```

The maximum stack depth is:

```text
f(n)
f(n-1)
...
f(0)
```

so:

```text
Space = O(n)
```

Moving the operation before or after the recursive call **does not change the asymptotic complexity**.

It changes **when the operation executes**.

---

# 15. The three positions of work

We can now classify simple linear recursion based on where the operation occurs.

### Pre-recursive work

```java
process(n);
f(n - 1);
```

Execution:

```text
3
2
1
```

Work happens during descent.

### Post-recursive work

```java
f(n - 1);
process(n);
```

Execution:

```text
1
2
3
```

Work happens during unwinding.

### Both

```java
process(n);

f(n - 1);

process(n);
```

For `n = 3`:

```text
pre(3)
pre(2)
pre(1)

post(1)
post(2)
post(3)
```

This creates two distinct execution phases around the recursive call.

---

# 16. The deeper concept: continuation

When the function executes:

```java
f(n - 1);
process(n);
```

the current frame effectively carries this continuation:

```text
"Once f(n - 1) finishes,
execute process(n)."
```

For `n = 3`:

```text
f(3)
continuation:
    process(3)
```

Then:

```text
f(2)
continuation:
    process(2)
```

Then:

```text
f(1)
continuation:
    process(1)
```

So the stack becomes:

```text
TOP

f(1) → continuation: process(1)
f(2) → continuation: process(2)
f(3) → continuation: process(3)

BOTTOM
```

When the deepest call returns, the runtime follows those continuations in reverse stack order.

This is one of the most useful ways to mentally model recursion.

---

# 17. Pattern summary

We now have three closely related forms:

```text
                 Linear recursion
                       │
          ┌────────────┴────────────┐
          │                         │
   work before call          work after call
          │                         │
     descending                  unwinding
          │                         │
      3 2 1                       1 2 3
```

And for return-value recursion:

```text
current frame
     │
     ├── recursive subproblem
     │
     └── pending computation using returned result
```

The most important rule is:

> **The recursive call does not erase the current execution. It suspends it. Anything after that call remains pending until the child invocation returns.**

---

# Practice Problems — Head Recursion & Return Phase

## Level 1 — Trace

### 1. Predict the output

```java
static void f(int n) {
    if (n == 0) {
        return;
    }

    f(n - 1);
    System.out.println(n);
}
```

Determine the output for:

```text
f(5)
```

Then explain the exact return order.

---

### 2. Predict the output

```java
static void f(int n) {
    if (n == 0) {
        return;
    }

    System.out.println(n);
    f(n - 1);
    System.out.println(n);
}
```

Determine the output for:

```text
f(3)
```

Separate the output into:

```text
CALL PHASE
RETURN PHASE
```

---

## Level 2 — Stack visualization

### 3. Stack state

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

Trace `f(4)`.

At the deepest point, write every active frame and its pending operation.

---

### 4. Array traversal

Given:

```text
[10, 20, 30, 40, 50]
```

trace:

```java
static void print(int[] arr, int index) {
    if (index == arr.length) {
        return;
    }

    print(arr, index + 1);
    System.out.println(arr[index]);
}
```

Determine the output and explain why the array itself was never modified.

---

## Level 3 — Return values

### 5. Trace the return values

```java
static int sum(int n) {
    if (n == 0) {
        return 0;
    }

    return n + sum(n - 1);
}
```

Trace:

```text
sum(5)
```

Show:

```text
CALL:
sum(5)
sum(4)
...
sum(0)

RETURN:
sum(0) → ?
sum(1) → ?
...
sum(5) → ?
```

---

### 6. Recursive multiplication

Implement:

```text
multiply(a, b)
```

using recursion only, where:

```text
multiply(4, 5) = 20
```

Do not use `*`.

The recursive solution should conceptually represent:

```text
a × b
=
a + a × (b - 1)
```

---

## Level 4 — Application

### 7. Reverse a string

Implement:

```text
reverse("abcd") → "dcba"
```

using head recursion.

Do not use a loop.

Trace the call stack and identify where each character is processed.

---

### 8. Palindrome checking

Implement:

```text
isPalindrome("racecar")
```

using recursion.

Your state should track the relevant positions:

```text
left
right
```

Explain exactly what happens when the recursive call returns.

---

## Level 5 — Hard

### 9. Recursive array processing

Given:

```text
[4, 7, 2, 9, 1]
```

write a recursive function that prints:

```text
1
9
2
7
4
```

without modifying the array.

You must use the **return phase** to produce the reverse traversal.

---

### 10. Hard — Understand the pending computation

Trace:

```java
static int f(int n) {
    if (n <= 1) {
        return 1;
    }

    int x = f(n - 1);

    return n * x;
}
```

For `f(4)`, explicitly show the state of each frame immediately before `f(1)` is executed.

For every frame, identify:

```text
n
x
pending computation
```

Pay particular attention to the fact that `x` does **not yet have a value** while the child invocation is running.

---

## What we have built so far

```text
Pattern 1
Linear recursion
    ↓
one recursive child

Pattern 2
Tail recursion
    ↓
recursive call has no pending computation

Pattern 3
Head / return-phase recursion
    ↓
recursive call creates pending work
    ↓
work executes during stack unwinding
```

**Next pattern: Return-Value Recursion.**

There we will go deeper into the case where the recursive call is not merely delaying execution, but is producing a value that the parent frame must use to complete its own computation. This is the foundation for recursive mathematical functions, divide-and-conquer, tree algorithms, and eventually dynamic programming.