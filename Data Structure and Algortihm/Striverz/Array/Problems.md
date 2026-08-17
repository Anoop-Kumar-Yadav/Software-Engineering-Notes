# Problem 1: Find Maximum Element in an Array

## 1. Pattern

- Array Traversal
    
- Running State
    

---

## 2. Problem Statement

Given an integer array `arr` of size `n`, return the **largest element** present in the array.

**Example**

```text
Input:
arr = [4, 8, 2, 10, 6]

Output:
10
```

---

## 3. Recognition Clues

Ask yourself:

- Do I need only **one value** from the array?
    
- Does the order of elements matter?
    
- Do I need to examine every element?
    

If the answers are:

```text
One value      ✓
Ordering       ✗
Visit all      ✓
```

Then think:

```text
Linear Traversal + Running State
```

---

## 4. Thinking Process

| Approach | Idea                                            | Time       | Space   | Why Improve?                                             |
| -------- | ----------------------------------------------- | ---------- | ------- | -------------------------------------------------------- |
| 1        | Compare every element with every other element  | O(n²)      | O(1)    | Repeated comparisons                                     |
| 2        | Sort the array and return the last element      | O(n log n) | Depends | Entire array is sorted although only one value is needed |
| 3        | Keep track of the maximum while traversing once | O(n)       | O(1)    | Optimal                                                  |

---

## 5. Approaches

## Approach 1 — Brute Force

### Idea

Assume every element is the largest and verify it by comparing it with every other element.

### Algorithm (Pseudocode)

```text
Algorithm FindMaximum(arr)

FOR i ← 0 TO arr.length - 1

    isLargest ← TRUE

    FOR j ← 0 TO arr.length - 1

        IF arr[j] > arr[i] THEN
            isLargest ← FALSE
            BREAK
        END IF

    END FOR

    IF isLargest = TRUE THEN
        RETURN arr[i]
    END IF

END FOR

End Algorithm
```

### Java Implementation

```java
public static int findMaximum(int[] arr) {

    for (int i = 0; i < arr.length; i++) {

        boolean isLargest = true;

        for (int j = 0; j < arr.length; j++) {

            if (arr[j] > arr[i]) {
                isLargest = false;
                break;
            }

        }

        if (isLargest) {
            return arr[i];
        }

    }

    return -1;
}
```

---

## Approach 2 — Sorting

### Idea

Sort the array so that the largest element automatically moves to the last position.

### Algorithm (Pseudocode)

```text
Algorithm FindMaximum(arr)

SORT arr in ascending order

RETURN arr[arr.length - 1]

End Algorithm
```

### Java Implementation

```java
import java.util.Arrays;

public static int findMaximum(int[] arr) {

    Arrays.sort(arr);

    return arr[arr.length - 1];
}
```

---

## Approach 3 — Optimal

### Idea

Instead of sorting or repeatedly comparing elements, maintain the **largest element seen so far** while traversing the array.

### Algorithm (Pseudocode)

```text
Algorithm FindMaximum(arr)

max ← arr[0]

FOR i ← 1 TO arr.length - 1

    IF arr[i] > max THEN
        max ← arr[i]
    END IF

END FOR

RETURN max

End Algorithm
```

### Java Implementation

```java
public static int findMaximum(int[] arr) {

    int max = arr[0];

    for (int i = 1; i < arr.length; i++) {

        if (arr[i] > max) {
            max = arr[i];
        }

    }

    return max;
}
```

---

## 6. Complexity Analysis

|Approach|Time|Space|
|---|---|---|
|Brute Force|O(n²)|O(1)|
|Sorting|O(n log n)|Depends on sorting algorithm|
|Optimal|O(n)|O(1)|

---

# Problem 2: Find Second Largest Element in an Array

## 1. Pattern

- Array Traversal
    
- Running State
    
- Multiple Running States
    

---

## 2. Problem Statement

Given an integer array `arr` of size `n`, return the **second largest distinct element** present in the array.

If no second largest element exists, return `-1`.

**Example**

```text
Input:
arr = [12, 35, 1, 10, 34, 1]

Output:
34
```

```text
Input:
arr = [5, 5, 5]

Output:
-1
```

---

## 3. Recognition Clues

Ask yourself:

- Do I need only a few values instead of the entire array?
    
- Do I need ordering?
    
- Can multiple variables be maintained while traversing?
    

If the answers are:

```text
Need top 2 values     ✓
Ordering required      ✗
One traversal possible ✓
```

Then think:

```text
Multiple Running States
```

---

## 4. Thinking Process

|Approach|Idea|Time|Space|Why Improve?|
|---|---|---|---|---|
|1|Compare every element with every other element|O(n²)|O(1)|Too many repeated comparisons|
|2|Sort the array and pick the second distinct largest|O(n log n)|Depends|Entire array is sorted unnecessarily|
|3|Find largest in first traversal, second largest in second traversal|O(2n) ≈ O(n)|O(1)|Two traversals can be merged|
|4|Maintain largest and second largest simultaneously|O(n)|O(1)|Optimal|

---

## 5. Approaches

## Approach 1 — Brute Force

### Idea

Assume every element is the second largest.

Verify it by checking how many **distinct** elements are larger.

### Algorithm (Pseudocode)

```text
Algorithm FindSecondLargest(arr)

FOR each element arr[i]

    largerCount ← 0

    FOR each element arr[j]

        IF arr[j] > arr[i] THEN
            largerCount ← largerCount + 1
        END IF

    END FOR

    IF largerCount = 1 THEN
        RETURN arr[i]
    END IF

END FOR

RETURN -1

End Algorithm
```

### Java Implementation

```java
public static int findSecondLargest(int[] arr) {

    for (int i = 0; i < arr.length; i++) {

        int largerCount = 0;

        for (int j = 0; j < arr.length; j++) {

            if (arr[j] > arr[i]) {
                largerCount++;
            }

        }

        if (largerCount == 1) {
            return arr[i];
        }

    }

    return -1;
}
```

> **Note:** This conceptual brute-force approach does not correctly handle duplicate values. Handling duplicates would require tracking **distinct** larger elements. The purpose here is to illustrate the brute-force thinking process.

---

## Approach 2 — Sorting

### Idea

Sort the array.

Traverse from the end until a value different from the largest is found.

### Algorithm (Pseudocode)

```text
Algorithm FindSecondLargest(arr)

SORT arr

largest ← last element

FOR i ← arr.length - 2 DOWNTO 0

    IF arr[i] ≠ largest THEN
        RETURN arr[i]
    END IF

END FOR

RETURN -1

End Algorithm
```

### Java Implementation

```java
import java.util.Arrays;

public static int findSecondLargest(int[] arr) {

    Arrays.sort(arr);

    int largest = arr[arr.length - 1];

    for (int i = arr.length - 2; i >= 0; i--) {

        if (arr[i] != largest) {
            return arr[i];
        }

    }

    return -1;
}
```

---

## Approach 3 — Two Traversals

### Idea

First find the largest element.

During the second traversal, find the largest element smaller than it.

### Algorithm (Pseudocode)

```text
Algorithm FindSecondLargest(arr)

largest ← FindMaximum(arr)

secondLargest ← -∞

FOR each element

    IF element ≠ largest AND element > secondLargest THEN
        secondLargest ← element
    END IF

END FOR

IF secondLargest = -∞ THEN
    RETURN -1
END IF

RETURN secondLargest

End Algorithm
```

### Java Implementation

```java
public static int findSecondLargest(int[] arr) {

    int largest = arr[0];

    for (int num : arr) {

        if (num > largest) {
            largest = num;
        }

    }

    int secondLargest = Integer.MIN_VALUE;

    for (int num : arr) {

        if (num != largest && num > secondLargest) {
            secondLargest = num;
        }

    }

    return secondLargest == Integer.MIN_VALUE ? -1 : secondLargest;
}
```

---

## Approach 4 — Optimal

### Idea

Maintain both the largest and second largest while traversing the array only once.

### Algorithm (Pseudocode)

```text
Algorithm FindSecondLargest(arr)

largest ← -∞
secondLargest ← -∞

FOR each element

    IF element > largest THEN

        secondLargest ← largest
        largest ← element

    ELSE IF element > secondLargest
            AND element ≠ largest THEN

        secondLargest ← element

    END IF

END FOR

IF secondLargest = -∞ THEN
    RETURN -1
END IF

RETURN secondLargest

End Algorithm
```

### Java Implementation

```java
public static int findSecondLargest(int[] arr) {

    int largest = Integer.MIN_VALUE;
    int secondLargest = Integer.MIN_VALUE;

    for (int num : arr) {

        if (num > largest) {

            secondLargest = largest;
            largest = num;

        } else if (num > secondLargest && num != largest) {

            secondLargest = num;

        }

    }

    return secondLargest == Integer.MIN_VALUE ? -1 : secondLargest;
}
```

---

## 6. Complexity Analysis

|Approach|Time|Space|
|---|---|---|
|Brute Force|O(n²)|O(1)|
|Sorting|O(n log n)|Depends on sorting|
|Two Traversals|O(2n) ≈ O(n)|O(1)|
|One Traversal|O(n)|O(1)|

---

## 7. Key Learnings

- One traversal can maintain multiple running states.
    
- Sorting is not always the best intermediate solution.
    
- Multiple linear traversals can often be merged into one.
    
- Always handle duplicate values explicitly when the problem asks for **distinct** elements.
    

---

## 8. Interview Takeaway

```text
Need top K elements?

        │
        ▼

Can sorting solve it?
        │
        ▼

Yes

        │
        ▼

Can I avoid sorting?

        │
        ▼

Maintain K running variables

        │
        ▼

One Traversal
```


# Problem 3: Check if an Array is Sorted

## 1. Pattern

- Array Traversal
    
- Adjacent Comparison
    
- Early Termination
    

---

## 2. Problem Statement

Given an integer array `arr`, determine whether the array is sorted in **non-decreasing order**.

Return `true` if the array is sorted; otherwise return `false`.

**Example**

```text
Input:
arr = [1, 2, 2, 4, 5]

Output:
true
```

```text
Input:
arr = [1, 5, 3, 8]

Output:
false
```

---

## 3. Recognition Clues

Ask yourself:

- Am I finding a value?
    
- Or am I verifying a condition?
    
- Does every pair need to be checked?
    
- Can I stop as soon as the condition fails?
    

If the answers are

```text
Need verification      ✓
Need all pairs         ✗
Need neighbours only   ✓
Can stop early         ✓
```

Think

```text
Adjacent Comparison
+
Early Termination
```

---

## 4. Thinking Process

|Approach|Idea|Time|Space|Why Improve?|
|---|---|---|---|---|
|1|Compare every element with every element after it|O(n²)|O(1)|Too many unnecessary comparisons|
|2|Sort a copy and compare both arrays|O(n log n)|O(n)|Sorting modifies data and performs unnecessary work|
|3|Compare only adjacent elements|O(n)|O(1)|Optimal|

---

## 5. Approaches

## Approach 1 — Brute Force

### Idea

If the array is sorted, then every element must be less than or equal to every element after it.

### Algorithm (Pseudocode)

```text
Algorithm IsSorted(arr)

FOR i ← 0 TO arr.length - 2

    FOR j ← i + 1 TO arr.length - 1

        IF arr[i] > arr[j] THEN
            RETURN FALSE
        END IF

    END FOR

END FOR

RETURN TRUE

End Algorithm
```

### Java Implementation

```java
public static boolean isSorted(int[] arr) {

    for (int i = 0; i < arr.length - 1; i++) {

        for (int j = i + 1; j < arr.length; j++) {

            if (arr[i] > arr[j]) {
                return false;
            }

        }

    }

    return true;
}
```

---

## Approach 2 — Sorting

### Idea

Create a copy of the array.

Sort the copy.

If both arrays are identical, then the original array was already sorted.

### Algorithm (Pseudocode)

```text
Algorithm IsSorted(arr)

copy ← Copy of arr

SORT copy

FOR i ← 0 TO arr.length - 1

    IF arr[i] ≠ copy[i] THEN
        RETURN FALSE
    END IF

END FOR

RETURN TRUE

End Algorithm
```

### Java Implementation

```java
import java.util.Arrays;

public static boolean isSorted(int[] arr) {

    int[] copy = arr.clone();

    Arrays.sort(copy);

    return Arrays.equals(arr, copy);
}
```

---

## Approach 3 — Optimal

### Idea

A sorted array has one simple property:

Every element must be less than or equal to the next element.

There is no need to compare every pair.

### Algorithm (Pseudocode)

```text
Algorithm IsSorted(arr)

FOR i ← 0 TO arr.length - 2

    IF arr[i] > arr[i + 1] THEN
        RETURN FALSE
    END IF

END FOR

RETURN TRUE

End Algorithm
```

### Java Implementation

```java
public static boolean isSorted(int[] arr) {

    for (int i = 0; i < arr.length - 1; i++) {

        if (arr[i] > arr[i + 1]) {
            return false;
        }

    }

    return true;
}
```

---

## 6. Complexity Analysis

|Approach|Time|Space|
|---|---|---|
|Brute Force|O(n²)|O(1)|
|Sorting|O(n log n)|O(n)|
|Adjacent Comparison|O(n)|O(1)|

---

## 7. Key Learnings

- Verification problems are different from searching problems.
    
- Compare only what is necessary.
    
- Use **early termination** whenever possible.
    
- Many interview problems can be optimized by identifying the **minimum condition** that must hold.
    

---

## 8. Interview Takeaway

```text
Need to verify something?

        │
        ▼

What is the minimum condition
that proves it?

        │
        ▼

Can I stop immediately
when the condition fails?

        │
        ▼

Think

Verification
+
Early Termination
```

---

## Course Progress

```text
Arrays
│
├── Basic Traversal
│   ├── Find Maximum Element ✅
│   ├── Second Largest Element ✅
│   └── Check if Array is Sorted ✅
│
└── Next
    ├── Reverse an Array ⭐
    ├── Linear Search
    ├── Remove Duplicates from Sorted Array
    ├── Move Zeroes
    └── Left Rotate Array
```

Excellent. Now we move from **verification problems** to the **Two Pointers** pattern. This is one of the most important patterns in arrays and interviews.

We'll start with the simplest problem in this category.

---

# Problem 4: Reverse an Array

## 1. Pattern

- Two Pointers
    
- Swapping
    
- In-place Modification
    

---

## 2. Problem Statement

Given an integer array `arr`, reverse the array **in-place**.

**Example**

```text
Input:
arr = [1, 2, 3, 4, 5]

Output:
[5, 4, 3, 2, 1]
```

---

## 3. Recognition Clues

Ask yourself:

- Do I need to modify the original array?
    
- Are operations happening from both ends?
    
- Can two indices solve the problem?
    
- Is extra space avoidable?
    

If the answers are

```text
Need in-place modification   ✓
Need both ends               ✓
Need swapping                ✓
```

Think

```text
Two Pointers
```

---

## 4. Thinking Process

|Approach|Idea|Time|Space|Why Improve?|
|---|---|---|---|---|
|1|Create another array and copy elements in reverse order|O(n)|O(n)|Uses extra memory|
|2|Swap first-last, second-second-last, and continue|O(n)|O(1)|Optimal|

---

## 5. Approaches

## Approach 1 — Extra Array

### Idea

Create another array.

Copy elements from the end of the original array to the beginning of the new array.

### Algorithm (Pseudocode)

```text
Algorithm ReverseArray(arr)

Create result of size arr.length

j ← 0

FOR i ← arr.length - 1 DOWNTO 0

    result[j] ← arr[i]
    j ← j + 1

END FOR

RETURN result

End Algorithm
```

### Java Implementation

```java
public static int[] reverseArray(int[] arr) {

    int[] result = new int[arr.length];

    int j = 0;

    for (int i = arr.length - 1; i >= 0; i--) {

        result[j] = arr[i];
        j++;

    }

    return result;
}
```

---

## Approach 2 — Two Pointers (Optimal)

### Idea

Maintain one pointer at the beginning and one at the end.

Swap both elements.

Move the pointers toward each other.

Stop when they meet.

### Algorithm (Pseudocode)

```text
Algorithm ReverseArray(arr)

left ← 0

right ← arr.length - 1

WHILE left < right

    Swap arr[left] and arr[right]

    left ← left + 1

    right ← right - 1

END WHILE

RETURN arr

End Algorithm
```

### Java Implementation

```java
public static void reverseArray(int[] arr) {

    int left = 0;
    int right = arr.length - 1;

    while (left < right) {

        int temp = arr[left];
        arr[left] = arr[right];
        arr[right] = temp;

        left++;
        right--;

    }
}
```

---

## 6. Complexity Analysis

|Approach|Time|Space|
|---|---|---|
|Extra Array|O(n)|O(n)|
|Two Pointers|O(n)|O(1)|

---

## 7. Key Learnings

- Two pointers often eliminate the need for extra memory.
    
- Swapping elements from opposite ends solves reversal efficiently.
    
- In-place algorithms are generally preferred in interviews when allowed.
    
- The loop stops when the pointers meet because all required swaps have been completed.
    

---

## 8. Interview Takeaway

```text
Need to process

Beginning

        +

End

        │
        ▼

Need swapping?

        │
        ▼

Need in-place solution?

        │
        ▼

Think

Two Pointers
```

---

## Pattern Note

This is the **first true Two Pointer problem**.

The exact same pattern appears in:

```text
Two Pointers

│
├── Reverse Array          ✅
├── Reverse String
├── Valid Palindrome
├── Merge Sorted Arrays
├── Remove Duplicates
├── Move Zeroes
├── Container With Most Water
├── Two Sum II
└── Squares of Sorted Array
```


---

Before moving further, I'd slightly adjust the sequence.

Since we're learning **patterns**, after **Reverse Array**, the next best problem is **Linear Search**. It completes the **Basic Traversal** pattern before we move fully into Two Pointers.

The progression becomes:

```text
Basic Traversal
│
├── Find Maximum ✅
├── Second Largest ✅
├── Check Sorted ✅
├── Linear Search ← Next
│
Two Pointers
│
├── Reverse Array ✅
├── Remove Duplicates
├── Move Zeroes
├── Merge Sorted Arrays
└── ...
```

This order is more natural because **Linear Search** introduces the idea of **searching** and **early termination**, which appears frequently in later problems.

---

# Problem 5: Linear Search

## 1. Pattern

- Array Traversal
    
- Searching
    
- Early Termination
    

---

## 2. Problem Statement

Given an integer array `arr` and an integer `target`, return the **index** of the target element if it exists.

If the target is not present, return `-1`.

**Example**

```text
Input:
arr = [10, 25, 7, 18, 30]
target = 18

Output:
3
```

```text
Input:
arr = [10, 25, 7, 18, 30]
target = 100

Output:
-1
```

---

## 3. Recognition Clues

Ask yourself:

- Is the array sorted?
    
- Can I jump to elements?
    
- Do I have to examine every element?
    

If the answers are

```text
Array Sorted?      ✗
Need exact value   ✓
Visit every item   ✓
```

Think

```text
Linear Search
```

---

## 4. Thinking Process

|Approach|Idea|Time|Space|Why Improve?|
|---|---|---|---|---|
|1|Compare the target with every element|O(n)|O(1)|Already optimal for an unsorted array|
|2|Binary Search|O(log n)|O(1)|Not applicable because the array is unsorted|

**Observation**

Unlike previous problems,

there is **no better algorithm** unless additional information (such as the array being sorted) is available.

Sometimes **O(n)** is the optimal solution.

---

## 5. Approaches

## Approach 1 — Linear Search (Optimal)

### Idea

Traverse the array one element at a time.

As soon as the target is found,

return its index.

If traversal completes,

the target does not exist.

### Algorithm (Pseudocode)

```text
Algorithm LinearSearch(arr, target)

FOR i ← 0 TO arr.length - 1

    IF arr[i] = target THEN
        RETURN i
    END IF

END FOR

RETURN -1

End Algorithm
```

### Java Implementation

```java
public static int linearSearch(int[] arr, int target) {

    for (int i = 0; i < arr.length; i++) {

        if (arr[i] == target) {
            return i;
        }

    }

    return -1;
}
```

---

## 6. Complexity Analysis

|Approach|Time|Space|
|---|---|---|
|Linear Search|O(n)|O(1)|

---

## 7. Key Learnings

- Not every problem has multiple optimizations.
    
- An **unsorted array** requires checking elements one by one.
    
- **Early termination** saves unnecessary comparisons.
    
- Always use the information given in the problem before choosing an algorithm.
    

---

## 8. Interview Takeaway

```text
Need to find an element

        │
        ▼

Is array sorted?

   ├── Yes
   │      ▼
   │  Binary Search
   │
   └── No
          ▼
     Linear Search
```

---

## Pattern Note

This is one of the first decision trees you'll start building mentally.

```text
Searching

│
├── Array Sorted?
│      │
│      ├── Yes → Binary Search
│      │
│      └── No → Linear Search
│
├── Need frequent searches?
│      │
│      └── HashMap / HashSet
│
└── Need searching in a range?
       │
       └── Binary Search Variants
```

This kind of **"algorithm selection"** is just as important as implementation. In interviews, choosing the correct algorithm based on the problem's constraints often matters more than writing the code itself.

---

### Next

The next problem will be **Remove Duplicates from Sorted Array**. It introduces a much more important interview pattern: **Fast and Slow Pointers**, which is the foundation for many in-place array manipulation problems.

---

# Problem 6: Remove Duplicates from Sorted Array

## 1. Pattern

- Two Pointers
    
- Fast & Slow Pointer
    
- In-place Modification
    

---

## 2. Problem Statement

Given a **sorted** integer array `arr`, remove the duplicate elements **in-place** such that each unique element appears only once.

Return the number of unique elements.

**Example**

```text
Input:
arr = [1, 1, 2]

Output:
2

Modified Array:
[1, 2, ...]
```

```text
Input:
arr = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]

Output:
5

Modified Array:
[0, 1, 2, 3, 4, ...]
```

---

## 3. Recognition Clues

Ask yourself:

- Is the array sorted?
    
- Do duplicates appear together?
    
- Do I need to modify the same array?
    
- Can one pointer read while another writes?
    

If the answers are

```text
Sorted Array           ✓
Duplicates Adjacent    ✓
In-place Modification  ✓
```

Think

```text
Fast Pointer
+
Slow Pointer
```

---

## 4. Thinking Process

|Approach|Idea|Time|Space|Why Improve?|
|---|---|---|---|---|
|1|Create a new array and copy unique elements|O(n)|O(n)|Uses extra memory|
|2|Use a `LinkedHashSet` to remove duplicates|O(n)|O(n)|Uses additional data structure and ignores sorted property|
|3|Use Fast & Slow Pointers|O(n)|O(1)|Uses sorted property and modifies array in-place|

---

## 5. Approaches

## Approach 1 — Extra Array

### Idea

Traverse the array.

Copy an element only if it is different from the previously copied element.

### Algorithm (Pseudocode)

```text
Algorithm RemoveDuplicates(arr)

Create result array

result[0] ← arr[0]

index ← 1

FOR i ← 1 TO arr.length - 1

    IF arr[i] ≠ arr[i - 1] THEN

        result[index] ← arr[i]

        index ← index + 1

    END IF

END FOR

RETURN result

End Algorithm
```

### Java Implementation

```java
public static int[] removeDuplicates(int[] arr) {

    int[] result = new int[arr.length];

    result[0] = arr[0];

    int index = 1;

    for (int i = 1; i < arr.length; i++) {

        if (arr[i] != arr[i - 1]) {

            result[index] = arr[i];
            index++;

        }

    }

    return Arrays.copyOf(result, index);
}
```

---

## Approach 2 — Using LinkedHashSet

### Idea

Insert every element into a `LinkedHashSet`.

Convert the set back to an array.

### Algorithm (Pseudocode)

```text
Algorithm RemoveDuplicates(arr)

Create LinkedHashSet

FOR each element

    Insert element into set

END FOR

Copy set elements back to array

RETURN size of set

End Algorithm
```

### Java Implementation

```java
public static int removeDuplicates(int[] arr) {

    LinkedHashSet<Integer> set = new LinkedHashSet<>();

    for (int num : arr) {
        set.add(num);
    }

    int index = 0;

    for (int num : set) {
        arr[index++] = num;
    }

    return index;
}
```

---

## Approach 3 — Fast & Slow Pointer (Optimal)

### Idea

Use:

- **Fast Pointer** → scans every element.
    
- **Slow Pointer** → points to the position where the next unique element should be placed.
    

Whenever the fast pointer finds a new unique element,

copy it to the slow pointer position.

---

### Algorithm (Pseudocode)

```text
Algorithm RemoveDuplicates(arr)

IF arr is empty THEN
    RETURN 0
END IF

slow ← 0

FOR fast ← 1 TO arr.length - 1

    IF arr[fast] ≠ arr[slow] THEN

        slow ← slow + 1

        arr[slow] ← arr[fast]

    END IF

END FOR

RETURN slow + 1

End Algorithm
```

### Java Implementation

```java
public static int removeDuplicates(int[] arr) {

    if (arr.length == 0) {
        return 0;
    }

    int slow = 0;

    for (int fast = 1; fast < arr.length; fast++) {

        if (arr[fast] != arr[slow]) {

            slow++;
            arr[slow] = arr[fast];

        }

    }

    return slow + 1;
}
```

---

## 6. Complexity Analysis

|Approach|Time|Space|
|---|---|---|
|Extra Array|O(n)|O(n)|
|LinkedHashSet|O(n)|O(n)|
|Fast & Slow Pointer|O(n)|O(1)|

---

## 7. Key Learnings

- A sorted array groups duplicate elements together.
    
- One pointer can **read** while another **writes**.
    
- In-place modification often leads to constant space solutions.
    
- Always look for properties (like sorting) that simplify the problem.
    

---

## 8. Interview Takeaway

```text
Need to modify array?

        │
        ▼

Need to preserve order?

        │
        ▼

Array is sorted?

        │
        ▼

Yes

        │
        ▼

Think

Fast Pointer
+
Slow Pointer
```

---

## Fast & Slow Pointer Visualization

```text
Initial Array

[1, 1, 2, 2, 3, 4, 4]

 S
 F
```

```text
Duplicate Found

[1, 1, 2, 2, 3, 4, 4]

 S
    F
```

```text
Unique Element Found

[1, 1, 2, 2, 3, 4, 4]

 S     F

Move Slow

[1, 2, 2, 2, 3, 4, 4]

    S  F
```

```text
Final Array

[1, 2, 3, 4, ...]

          S
```

---

## Pattern Expansion

This single pattern appears in many interview questions.

```text
Fast & Slow Pointer

│
├── Remove Duplicates ✅
├── Remove Element
├── Move Zeroes
├── Sort Colors
├── Merge Sorted Array
├── Squares of Sorted Array
├── Compress String
└── Partition Array
```

This is the **first genuinely reusable interview pattern**. Once you recognize "scan with one pointer, write with another," you'll solve an entire family of in-place array problems with the same underlying technique.

Excellent choice. **Array Rotation** is one of the most important array topics because it introduces several key ideas:

- Extra Array
    
- Element Shifting
    
- Circular Indexing (`%`)
    
- Reversal Algorithm (very important)
    
- In-place manipulation
    

We'll cover **Left Rotation** and **Right Rotation** separately because the thinking process is slightly different.

---

# Problem 7: Left Rotate an Array by `k` Positions

## 1. Pattern

- Array Traversal
    
- Circular Array
    
- Reversal
    
- In-place Modification
    

---

## 2. Problem Statement

Given an integer array `arr` of size `n` and an integer `k`, rotate the array **left** by `k` positions.

**Example**

```text
Input:
arr = [1, 2, 3, 4, 5]
k = 2

Output:
[3, 4, 5, 1, 2]
```

---

## 3. Recognition Clues

Ask yourself:

- Need to rotate?
    
- Are elements wrapping around?
    
- Is extra space allowed?
    
- Is in-place rotation required?
    

If the answers are

```text
Need wrapping       ✓
Circular movement   ✓
Need in-place       ✓
```

Think

```text
Circular Array
+
Reversal Algorithm
```

---

## 4. Thinking Process

|Approach|Idea|Time|Space|Why Improve?|
|---|---|---|---|---|
|1|Rotate one position left `k` times|O(n × k)|O(1)|Too many repeated shifts|
|2|Use an extra array|O(n)|O(n)|Extra memory required|
|3|Reversal Algorithm|O(n)|O(1)|Optimal|

---

## 5. Approaches

## Approach 1 — Shift One Position `k` Times

### Idea

Rotate the array left by one position.

Repeat this process `k` times.

### Algorithm (Pseudocode)

```text
Algorithm LeftRotate(arr, k)

REPEAT k times

    first ← arr[0]

    FOR i ← 0 TO n - 2

        arr[i] ← arr[i + 1]

    END FOR

    arr[n - 1] ← first

END REPEAT

End Algorithm
```

### Java Implementation

```java
public static void leftRotate(int[] arr, int k) {

    int n = arr.length;

    k %= n;

    for (int r = 0; r < k; r++) {

        int first = arr[0];

        for (int i = 0; i < n - 1; i++) {
            arr[i] = arr[i + 1];
        }

        arr[n - 1] = first;
    }
}
```

---

## Approach 2 — Extra Array

### Idea

Store rotated elements in another array.

Copy them back.

### Algorithm (Pseudocode)

```text
Algorithm LeftRotate(arr, k)

k ← k mod n

Create temp[n]

FOR i ← 0 TO n - 1

    newIndex ← (i - k + n) mod n

    temp[newIndex] ← arr[i]

END FOR

Copy temp into arr

End Algorithm
```

### Java Implementation

```java
public static void leftRotate(int[] arr, int k) {

    int n = arr.length;

    k %= n;

    int[] temp = new int[n];

    for (int i = 0; i < n; i++) {

        int newIndex = (i - k + n) % n;

        temp[newIndex] = arr[i];
    }

    System.arraycopy(temp, 0, arr, 0, n);
}
```

---

## Approach 3 — Reversal Algorithm (Optimal)

### Idea

Reverse

1. First `k` elements
    
2. Remaining elements
    
3. Entire array
    

Example

```text
1 2 3 4 5 6 7

k = 2
```

Reverse first `k`

```text
2 1 3 4 5 6 7
```

Reverse remaining

```text
2 1 7 6 5 4 3
```

Reverse entire array

```text
3 4 5 6 7 1 2
```

---

### Algorithm (Pseudocode)

```text
Algorithm LeftRotate(arr, k)

k ← k mod n

Reverse(arr, 0, k - 1)

Reverse(arr, k, n - 1)

Reverse(arr, 0, n - 1)

End Algorithm
```

### Java Implementation

```java
public static void leftRotate(int[] arr, int k) {

    int n = arr.length;

    k %= n;

    reverse(arr, 0, k - 1);
    reverse(arr, k, n - 1);
    reverse(arr, 0, n - 1);
}

private static void reverse(int[] arr, int left, int right) {

    while (left < right) {

        int temp = arr[left];
        arr[left] = arr[right];
        arr[right] = temp;

        left++;
        right--;
    }
}
```

---

## 6. Complexity Analysis

|Approach|Time|Space|
|---|---|---|
|Shift `k` Times|O(n × k)|O(1)|
|Extra Array|O(n)|O(n)|
|Reversal Algorithm|O(n)|O(1)|

---

## 7. Key Learnings

- Avoid repeated shifting.
    
- Rotation is circular movement.
    
- Reversal converts an O(n) space solution into an O(1) space solution.
    
- Normalize rotations using `k = k % n`.
    

---

## 8. Interview Takeaway

```text
Need Rotation

        │
        ▼

Need In-place?

   ├── No
   │
   │  Extra Array
   │
   └── Yes
          │
          ▼

    Reversal Algorithm
```

---
Excellent choice. **Array Rotation** is one of the most important array topics because it introduces several key ideas:

- Extra Array
    
- Element Shifting
    
- Circular Indexing (`%`)
    
- Reversal Algorithm (very important)
    
- In-place manipulation
    

We'll cover **Left Rotation** and **Right Rotation** separately because the thinking process is slightly different.

---

# Problem 7: Left Rotate an Array by `k` Positions

## 1. Pattern

- Array Traversal
    
- Circular Array
    
- Reversal
    
- In-place Modification
    

---

## 2. Problem Statement

Given an integer array `arr` of size `n` and an integer `k`, rotate the array **left** by `k` positions.

**Example**

```text
Input:
arr = [1, 2, 3, 4, 5]
k = 2

Output:
[3, 4, 5, 1, 2]
```

---

## 3. Recognition Clues

Ask yourself:

- Need to rotate?
    
- Are elements wrapping around?
    
- Is extra space allowed?
    
- Is in-place rotation required?
    

If the answers are

```text
Need wrapping       ✓
Circular movement   ✓
Need in-place       ✓
```

Think

```text
Circular Array
+
Reversal Algorithm
```

---

## 4. Thinking Process

|Approach|Idea|Time|Space|Why Improve?|
|---|---|---|---|---|
|1|Rotate one position left `k` times|O(n × k)|O(1)|Too many repeated shifts|
|2|Use an extra array|O(n)|O(n)|Extra memory required|
|3|Reversal Algorithm|O(n)|O(1)|Optimal|

---

## 5. Approaches

## Approach 1 — Shift One Position `k` Times

### Idea

Rotate the array left by one position.

Repeat this process `k` times.

### Algorithm (Pseudocode)

```text
Algorithm LeftRotate(arr, k)

REPEAT k times

    first ← arr[0]

    FOR i ← 0 TO n - 2

        arr[i] ← arr[i + 1]

    END FOR

    arr[n - 1] ← first

END REPEAT

End Algorithm
```

### Java Implementation

```java
public static void leftRotate(int[] arr, int k) {

    int n = arr.length;

    k %= n;

    for (int r = 0; r < k; r++) {

        int first = arr[0];

        for (int i = 0; i < n - 1; i++) {
            arr[i] = arr[i + 1];
        }

        arr[n - 1] = first;
    }
}
```

---

## Approach 2 — Extra Array

### Idea

Store rotated elements in another array.

Copy them back.

### Algorithm (Pseudocode)

```text
Algorithm LeftRotate(arr, k)

k ← k mod n

Create temp[n]

FOR i ← 0 TO n - 1

    newIndex ← (i - k + n) mod n

    temp[newIndex] ← arr[i]

END FOR

Copy temp into arr

End Algorithm
```

### Java Implementation

```java
public static void leftRotate(int[] arr, int k) {

    int n = arr.length;

    k %= n;

    int[] temp = new int[n];

    for (int i = 0; i < n; i++) {

        int newIndex = (i - k + n) % n;

        temp[newIndex] = arr[i];
    }

    System.arraycopy(temp, 0, arr, 0, n);
}
```

---

## Approach 3 — Reversal Algorithm (Optimal)

### Idea

Reverse

1. First `k` elements
    
2. Remaining elements
    
3. Entire array
    

Example

```text
1 2 3 4 5 6 7

k = 2
```

Reverse first `k`

```text
2 1 3 4 5 6 7
```

Reverse remaining

```text
2 1 7 6 5 4 3
```

Reverse entire array

```text
3 4 5 6 7 1 2
```

---

### Algorithm (Pseudocode)

```text
Algorithm LeftRotate(arr, k)

k ← k mod n

Reverse(arr, 0, k - 1)

Reverse(arr, k, n - 1)

Reverse(arr, 0, n - 1)

End Algorithm
```

### Java Implementation

```java
public static void leftRotate(int[] arr, int k) {

    int n = arr.length;

    k %= n;

    reverse(arr, 0, k - 1);
    reverse(arr, k, n - 1);
    reverse(arr, 0, n - 1);
}

private static void reverse(int[] arr, int left, int right) {

    while (left < right) {

        int temp = arr[left];
        arr[left] = arr[right];
        arr[right] = temp;

        left++;
        right--;
    }
}
```

---

## 6. Complexity Analysis

|Approach|Time|Space|
|---|---|---|
|Shift `k` Times|O(n × k)|O(1)|
|Extra Array|O(n)|O(n)|
|Reversal Algorithm|O(n)|O(1)|

---

## 7. Key Learnings

- Avoid repeated shifting.
    
- Rotation is circular movement.
    
- Reversal converts an O(n) space solution into an O(1) space solution.
    
- Normalize rotations using `k = k % n`.
    

---

## 8. Interview Takeaway

```text
Need Rotation

        │
        ▼

Need In-place?

   ├── No
   │
   │  Extra Array
   │
   └── Yes
          │
          ▼

    Reversal Algorithm
```

---

Excellent choice. This is one of the **classic Two Pointer** interview problems. It teaches a reusable pattern:

> **Read from every position, but write only when necessary.**

This exact idea is reused in **Remove Duplicates**, **Remove Element**, **Sort Colors**, **Partition Array**, and many other problems.

---

# Problem 8: Move Zeros to End

## 1. Pattern

- Two Pointers
    
- Fast & Slow Pointer
    
- In-place Modification
    
- Stable Rearrangement
    

---

## 2. Problem Statement

Given an integer array `arr`, move all `0`s to the **end** while maintaining the **relative order** of the non-zero elements.

The operation must be performed **in-place**.

**Example**

```text
Input:
arr = [0, 1, 0, 3, 12]

Output:
[1, 3, 12, 0, 0]
```

```text
Input:
arr = [1, 2, 3]

Output:
[1, 2, 3]
```

---

## 3. Recognition Clues

Ask yourself:

- Need to rearrange elements?
    
- Must preserve order?
    
- Need an in-place solution?
    
- Can one pointer read while another writes?
    

If the answers are

```text
Need rearrangement      ✓
Maintain order          ✓
In-place modification   ✓
```

Think

```text
Fast Pointer
+
Slow Pointer
```

---

## 4. Thinking Process

|Approach|Idea|Time|Space|Why Improve?|
|---|---|---|---|---|
|1|Create a new array, copy non-zero elements, then fill remaining positions with zeros|O(n)|O(n)|Uses extra memory|
|2|Shift every zero to the end individually|O(n²)|O(1)|Too many element shifts|
|3|Fast & Slow Pointer (swap)|O(n)|O(1)|In-place and optimal|

---

## 5. Approaches

## Approach 1 — Extra Array

### Idea

Copy every non-zero element into a new array.

Fill the remaining positions with zeros.

### Algorithm (Pseudocode)

```text
Algorithm MoveZeros(arr)

Create temp array of size n

index ← 0

FOR each element

    IF element ≠ 0 THEN

        temp[index] ← element

        index ← index + 1

    END IF

END FOR

WHILE index < n

    temp[index] ← 0

    index ← index + 1

END WHILE

Copy temp into arr

End Algorithm
```

### Java Implementation

```java
public static void moveZeros(int[] arr) {

    int[] temp = new int[arr.length];

    int index = 0;

    for (int num : arr) {

        if (num != 0) {
            temp[index++] = num;
        }

    }

    System.arraycopy(temp, 0, arr, 0, arr.length);
}
```

---

## Approach 2 — Shift Every Zero

### Idea

Whenever a zero is found,

shift every remaining element one position left.

Place zero at the end.

Repeat until all zeros reach the end.

### Algorithm (Pseudocode)

```text
Algorithm MoveZeros(arr)

FOR each position

    IF current element is zero THEN

        Shift every remaining element left

        Put zero at the last position

    END IF

END FOR

End Algorithm
```

### Java Implementation

```java
public static void moveZeros(int[] arr) {

    int n = arr.length;

    for (int i = 0; i < n; i++) {

        if (arr[i] == 0) {

            for (int j = i; j < n - 1; j++) {
                arr[j] = arr[j + 1];
            }

            arr[n - 1] = 0;

            i--;
            n--;
        }
    }
}
```

---

## Approach 3 — Fast & Slow Pointer (Optimal)

### Idea

- **Fast Pointer** scans every element.
    
- **Slow Pointer** points to where the next non-zero element should be placed.
    

Whenever a non-zero element is found,

swap it with the slow pointer.

Advance the slow pointer.

---

### Algorithm (Pseudocode)

```text
Algorithm MoveZeros(arr)

slow ← 0

FOR fast ← 0 TO n - 1

    IF arr[fast] ≠ 0 THEN

        Swap arr[slow] and arr[fast]

        slow ← slow + 1

    END IF

END FOR

End Algorithm
```

### Java Implementation

```java
public static void moveZeros(int[] arr) {

    int slow = 0;

    for (int fast = 0; fast < arr.length; fast++) {

        if (arr[fast] != 0) {

            int temp = arr[slow];
            arr[slow] = arr[fast];
            arr[fast] = temp;

            slow++;
        }

    }
}
```

---

## 6. Complexity Analysis

|Approach|Time|Space|
|---|---|---|
|Extra Array|O(n)|O(n)|
|Shift Every Zero|O(n²)|O(1)|
|Fast & Slow Pointer|O(n)|O(1)|

---

## 7. Key Learnings

- Preserve the relative order of non-zero elements.
    
- Fast pointer reads every element.
    
- Slow pointer tracks the next valid insertion position.
    
- Swapping avoids extra memory while maintaining stability.
    
- Fast & Slow Pointer is a common interview pattern for in-place array modifications.
    

---

## 8. Interview Takeaway

```text
Need to move selected elements?

        │
        ▼

Need to preserve order?

        │
        ▼

Need in-place solution?

        │
        ▼

Think

Fast Pointer
+
Slow Pointer
```

---

## Pattern Visualization

Initial

```text
Index : 0 1 2 3 4
Array : 0 1 0 3 12
        S
        F
```

---

Skip Zero

```text
Index : 0 1 2 3 4
Array : 0 1 0 3 12
        S
          F
```

---

Swap

```text
Index : 0 1 2 3 4
Array : 1 0 0 3 12
          S
            F
```

---

Next Swap

```text
Index : 0 1 2 3 4
Array : 1 3 0 0 12
            S
                F
```

---

Final Swap

```text
Index : 0 1 2 3 4
Array : 1 3 12 0 0
               S
```

---

## Relationship with Previous Problems

```text
Fast & Slow Pointer

│
├── Remove Duplicates from Sorted Array ✅
│      ↓
│      Read unique values
│      Write unique values
│
├── Move Zeros to End ✅
│      ↓
│      Read non-zero values
│      Write non-zero values
│
├── Remove Element
├── Sort Colors
├── Partition Array
└── Merge Sorted Array
```

### Pattern Insight

Compare the two problems you've learned:

|Problem|Fast Pointer Reads|Slow Pointer Writes|
|---|---|---|
|Remove Duplicates|Unique elements|Next unique position|
|Move Zeros|Non-zero elements|Next non-zero position|

Notice that **the algorithm skeleton is almost identical**. The only difference is the **condition** used by the fast pointer. Recognizing these reusable templates is one of the fastest ways to improve at interview problem solving.

---

# Problem 9: Union of Two Sorted Arrays

## 1. Pattern

- Two Pointers
    
- Merge Process
    
- Sorted Arrays
    

---

## 2. Problem Statement

Given two **sorted** arrays `arr1` and `arr2`, return their **union**.

The union should contain **all distinct elements** from both arrays in sorted order.

**Example**

```text
Input:
arr1 = [1, 2, 2, 3, 4]
arr2 = [2, 3, 5]

Output:
[1, 2, 3, 4, 5]
```

---

## 3. Recognition Clues

Ask yourself:

- Are both arrays sorted?
    
- Do I need to combine both arrays?
    
- Can both arrays be traversed simultaneously?
    
- Do duplicates need to be removed?
    

If the answers are

```text
Both arrays sorted     ✓
Need merging           ✓
Need unique elements   ✓
```

Think

```text
Two Pointers
+
Merge Process
```

---

## 4. Thinking Process

|Approach|Idea|Time|Space|Why Improve?|
|---|---|---|---|---|
|1|Insert all elements into a `Set`|O((n+m) log(n+m))*|O(n+m)|Doesn't utilize sorted property|
|2|Concatenate arrays, sort them, remove duplicates|O((n+m) log(n+m))|O(n+m)|Sorting is unnecessary because arrays are already sorted|
|3|Traverse both arrays simultaneously using Two Pointers|O(n+m)|O(n+m)**|Optimal|

> *Using `TreeSet`. With `HashSet`, average insertion is O(1), but the final order is not guaranteed without additional processing.  
> **The output array/list itself is not counted as extra space in most interview discussions.

---

## 5. Approaches

## Approach 1 — Using Set

### Idea

Insert every element from both arrays into a set.

Return all unique elements.

### Algorithm (Pseudocode)

```text
Algorithm Union(arr1, arr2)

Create empty Set

FOR each element in arr1

    Insert element into Set

END FOR

FOR each element in arr2

    Insert element into Set

END FOR

RETURN Set

End Algorithm
```

### Java Implementation

```java
public static List<Integer> union(int[] arr1, int[] arr2) {

    Set<Integer> set = new TreeSet<>();

    for (int num : arr1) {
        set.add(num);
    }

    for (int num : arr2) {
        set.add(num);
    }

    return new ArrayList<>(set);
}
```

---

## Approach 2 — Sort After Combining

### Idea

Combine both arrays.

Sort them.

Traverse once to remove duplicates.

### Algorithm (Pseudocode)

```text
Algorithm Union(arr1, arr2)

Combine both arrays

SORT combined array

Add first element to result

FOR remaining elements

    IF current element ≠ previous element

        Add current element

    END IF

END FOR

RETURN result

End Algorithm
```

### Java Implementation

```java
public static List<Integer> union(int[] arr1, int[] arr2) {

    int[] merged = new int[arr1.length + arr2.length];

    System.arraycopy(arr1, 0, merged, 0, arr1.length);
    System.arraycopy(arr2, 0, merged, arr1.length, arr2.length);

    Arrays.sort(merged);

    List<Integer> result = new ArrayList<>();

    result.add(merged[0]);

    for (int i = 1; i < merged.length; i++) {

        if (merged[i] != merged[i - 1]) {
            result.add(merged[i]);
        }

    }

    return result;
}
```

---

## Approach 3 — Two Pointers (Optimal)

### Idea

Maintain one pointer for each array.

Always process the smaller element first.

Skip duplicates while adding elements to the result.

### Algorithm (Pseudocode)

```text
Algorithm Union(arr1, arr2)

i ← 0
j ← 0

Create empty result

WHILE i < length(arr1) AND j < length(arr2)

    IF arr1[i] < arr2[j]

        Add arr1[i] if not already added
        i ← i + 1

    ELSE IF arr1[i] > arr2[j]

        Add arr2[j] if not already added
        j ← j + 1

    ELSE

        Add arr1[i] if not already added

        i ← i + 1
        j ← j + 1

    END IF

END WHILE

Add remaining elements of arr1

Add remaining elements of arr2

RETURN result

End Algorithm
```

### Java Implementation

```java
public static List<Integer> union(int[] arr1, int[] arr2) {

    List<Integer> result = new ArrayList<>();

    int i = 0;
    int j = 0;

    while (i < arr1.length && j < arr2.length) {

        if (arr1[i] < arr2[j]) {

            if (result.isEmpty() || result.get(result.size() - 1) != arr1[i]) {
                result.add(arr1[i]);
            }

            i++;

        } else if (arr1[i] > arr2[j]) {

            if (result.isEmpty() || result.get(result.size() - 1) != arr2[j]) {
                result.add(arr2[j]);
            }

            j++;

        } else {

            if (result.isEmpty() || result.get(result.size() - 1) != arr1[i]) {
                result.add(arr1[i]);
            }

            i++;
            j++;

        }
    }

    while (i < arr1.length) {

        if (result.isEmpty() || result.get(result.size() - 1) != arr1[i]) {
            result.add(arr1[i]);
        }

        i++;
    }

    while (j < arr2.length) {

        if (result.isEmpty() || result.get(result.size() - 1) != arr2[j]) {
            result.add(arr2[j]);
        }

        j++;
    }

    return result;
}
```

---

## 6. Complexity Analysis

|Approach|Time|Space|
|---|---|---|
|Set|O((n+m) log(n+m))*|O(n+m)|
|Combine + Sort|O((n+m) log(n+m))|O(n+m)|
|Two Pointers|O(n+m)|O(n+m)**|

> *For `TreeSet`.  
> **Excluding the required output list.

---

## 7. Key Learnings

- Always use the **sorted property** when it is provided.
    
- Two pointers allow simultaneous traversal without sorting again.
    
- Merge-like problems are often solved in linear time.
    
- Handle duplicates while inserting into the result instead of removing them later.
    

---

## 8. Interview Takeaway

```text
Need to process
two arrays?

        │
        ▼

Are both arrays sorted?

        │
        ▼

Yes

        │
        ▼

Think

Two Pointers
+
Merge
```

---

## Pattern Visualization

```text
arr1 : 1 2 2 3 4
        ↑
        i

arr2 : 2 3 5
        ↑
        j

Result

1 2 3 4 5
```

Both pointers always move **forward**.

At every step:

- Smaller element → add and move that pointer.
    
- Equal elements → add once and move both pointers.
    

---

## Pattern Expansion

```text
Two Sorted Arrays

│
├── Union ✅
├── Intersection
├── Merge Two Sorted Arrays
├── Median of Two Sorted Arrays
├── Difference of Two Arrays
└── Merge Intervals (conceptually similar)
```

### Pattern Insight

The important realization is **not** "use two pointers." It is:

> **Whenever multiple inputs are already sorted, try processing them together instead of combining and sorting again.**

This mindset leads naturally to linear-time merge algorithms and is one of the most valuable interview patterns for array problems.

---

# Problem 10: Intersection of Two Sorted Arrays

## 1. Pattern

- Two Pointers
    
- Merge Process
    
- Sorted Arrays
    

---

## 2. Problem Statement

Given two **sorted** arrays `arr1` and `arr2`, return their **intersection**.

The intersection should contain only the **common distinct elements** present in both arrays.

**Example**

```text
Input:
arr1 = [1, 2, 2, 3, 4]
arr2 = [2, 2, 3, 5]

Output:
[2, 3]
```

```text
Input:
arr1 = [1, 2, 3]
arr2 = [4, 5, 6]

Output:
[]
```

---

## 3. Recognition Clues

Ask yourself:

- Are both arrays sorted?
    
- Need common elements only?
    
- Can both arrays be traversed simultaneously?
    
- Can I eliminate unnecessary comparisons?
    

If the answers are

```text
Both arrays sorted      ✓
Need common elements    ✓
Need simultaneous scan  ✓
```

Think

```text
Two Pointers
+
Merge Process
```

---

## 4. Thinking Process

|Approach|Idea|Time|Space|Why Improve?|
|---|---|---|---|---|
|1|Compare every element of one array with every element of the other|O(n × m)|O(1)|Too many repeated comparisons|
|2|Store one array in a HashSet and search elements of the other|O(n + m)|O(n)|Doesn't utilize the sorted property|
|3|Traverse both arrays together using Two Pointers|O(n + m)|O(m)*|Optimal|

> *Output space is not counted as auxiliary space.

---

## 5. Approaches

## Approach 1 — Brute Force

### Idea

Compare every element of the first array with every element of the second array.

Whenever both elements are equal, add it to the answer (avoiding duplicates).

### Algorithm (Pseudocode)

```text
Algorithm Intersection(arr1, arr2)

Create empty result

FOR each element in arr1

    FOR each element in arr2

        IF both elements are equal THEN

            Add element if not already present

        END IF

    END FOR

END FOR

RETURN result

End Algorithm
```

### Java Implementation

```java
public static List<Integer> intersection(int[] arr1, int[] arr2) {

    List<Integer> result = new ArrayList<>();

    for (int i = 0; i < arr1.length; i++) {

        for (int j = 0; j < arr2.length; j++) {

            if (arr1[i] == arr2[j]) {

                if (result.isEmpty() ||
                    result.get(result.size() - 1) != arr1[i]) {

                    result.add(arr1[i]);
                }

                break;
            }
        }
    }

    return result;
}
```

---

## Approach 2 — HashSet

### Idea

Store all elements of the first array in a `HashSet`.

Traverse the second array.

If an element exists in the set, it belongs to the intersection.

### Algorithm (Pseudocode)

```text
Algorithm Intersection(arr1, arr2)

Create HashSet

Insert all elements of arr1

Create empty result

FOR each element in arr2

    IF element exists in HashSet THEN

        Add element if not already present

    END IF

END FOR

RETURN result

End Algorithm
```

### Java Implementation

```java
public static List<Integer> intersection(int[] arr1, int[] arr2) {

    Set<Integer> set = new HashSet<>();

    for (int num : arr1) {
        set.add(num);
    }

    List<Integer> result = new ArrayList<>();

    for (int num : arr2) {

        if (set.contains(num)) {

            if (result.isEmpty() ||
                result.get(result.size() - 1) != num) {

                result.add(num);
            }

        }

    }

    return result;
}
```

---

## Approach 3 — Two Pointers (Optimal)

### Idea

Maintain one pointer in each array.

- If both elements are equal, add the element and move both pointers.
    
- If the first element is smaller, move the first pointer.
    
- If the second element is smaller, move the second pointer.
    

Since both arrays are sorted, moving the smaller element's pointer can never skip a possible match.

### Algorithm (Pseudocode)

```text
Algorithm Intersection(arr1, arr2)

i ← 0

j ← 0

Create empty result

WHILE i < length(arr1) AND j < length(arr2)

    IF arr1[i] = arr2[j] THEN

        Add arr1[i] if not already added

        i ← i + 1

        j ← j + 1

    ELSE IF arr1[i] < arr2[j] THEN

        i ← i + 1

    ELSE

        j ← j + 1

    END IF

END WHILE

RETURN result

End Algorithm
```

### Java Implementation

```java
public static List<Integer> intersection(int[] arr1, int[] arr2) {

    List<Integer> result = new ArrayList<>();

    int i = 0;
    int j = 0;

    while (i < arr1.length && j < arr2.length) {

        if (arr1[i] == arr2[j]) {

            if (result.isEmpty() ||
                result.get(result.size() - 1) != arr1[i]) {

                result.add(arr1[i]);
            }

            i++;
            j++;

        } else if (arr1[i] < arr2[j]) {

            i++;

        } else {

            j++;

        }

    }

    return result;
}
```

---

## 6. Complexity Analysis

|Approach|Time|Space|
|---|---|---|
|Brute Force|O(n × m)|O(1)|
|HashSet|O(n + m)|O(n)|
|Two Pointers|O(n + m)|O(m)*|

> *Ignoring the output list.

---

## 7. Key Learnings

- Sorting allows simultaneous traversal of both arrays.
    
- Always move the pointer pointing to the **smaller** element.
    
- Equal elements indicate a common value, so both pointers move.
    
- Avoid adding duplicate values to the result.
    

---

## 8. Interview Takeaway

```text
Need common elements?

        │
        ▼

Are both arrays sorted?

        │
        ▼

Yes

        │
        ▼

Traverse together

        │
        ▼

Equal?
   │
   ├── Yes → Add → Move Both
   │
   ├── No
   │
   ├── Smaller in arr1 → Move i
   │
   └── Smaller in arr2 → Move j
```

---

## Pattern Visualization

```text
arr1 : 1 2 2 3 4
        ↑
        i

arr2 : 2 2 3 5
        ↑
        j
```

### Step 1

```text
1 < 2

Move i
```

### Step 2

```text
2 == 2

Add 2

Move both
```

### Step 3

```text
2 == 2

Already added

Move both
```

### Step 4

```text
3 == 3

Add 3

Move both
```

### Final Result

```text
[2, 3]
```

---

## Comparison: Union vs Intersection

|Operation|Equal Elements|Smaller Element|Result|
|---|---|---|---|
|**Union**|Add once, move both|Add smaller element, move its pointer|All distinct elements|
|**Intersection**|Add once, move both|Ignore smaller element, move its pointer|Only common elements|

---

## Pattern Expansion

```text
Two Sorted Arrays

│
├── Union ✅
├── Intersection ✅
├── Merge Two Sorted Arrays
├── Difference of Two Arrays
├── Symmetric Difference
├── Median of Two Sorted Arrays
└── Merge Intervals (conceptually similar)
```

### Pattern Insight

Notice the core algorithm barely changes from **Union** to **Intersection**. The **pointer movement rules remain the same**:

- If values are equal → **move both pointers**.
    
- Otherwise → **move the pointer pointing to the smaller value**.
    

The only thing that changes is **what you do when processing the current elements**:

- **Union:** add every distinct element encountered.
    
- **Intersection:** add only when the elements are equal.
    

This reusable merge skeleton is one of the most important patterns for problems involving multiple sorted arrays.



# Problem 11: Find the Missing Number in an Array

## 1. Pattern

- Array Traversal
    
- Hashing
    
- Mathematical Observation
    
- Bit Manipulation (XOR)
    

---

## 2. Problem Statement

Given an array `arr` containing **n distinct numbers** from the range **0 to n**, find the **only missing number**.

**Example**

```text
Input:
arr = [3, 0, 1]

Output:
2
```

```text
Input:
arr = [0, 1]

Output:
2
```

```text
Input:
arr = [9,6,4,2,3,5,7,0,1]

Output:
8
```

---

## 3. Recognition Clues

Ask yourself:

- Are numbers from a fixed range?
    
- Is exactly one number missing?
    
- Can mathematics help?
    
- Can hashing help?
    
- Can XOR eliminate duplicates?
    

If the answers are

```text
Known Range          ✓
One Missing Number   ✓
Distinct Elements    ✓
```

Think

```text
Hashing
↓

Mathematics

↓

XOR
```

---

## 4. Thinking Process

|Approach|Idea|Time|Space|Why Improve?|
|---|---|---|---|---|
|1|For every number from `0` to `n`, search the entire array|O(n²)|O(1)|Repeated searching|
|2|Sort the array and compare index with value|O(n log n)|O(1)*|Sorting is unnecessary|
|3|Use a boolean/hash array to mark visited numbers|O(n)|O(n)|Extra memory required|
|4|Use the Sum Formula|O(n)|O(1)|Simpler and constant space|
|5|Use XOR|O(n)|O(1)|Avoids overflow and uses bit manipulation|

> *Ignoring the sorting algorithm's recursion stack.

---

## 5. Approaches

---

## Approach 1 — Brute Force

### Idea

Check every number from `0` to `n`.

For each number, search the entire array.

If a number is not found, it is the missing number.

### Algorithm (Pseudocode)

```text
Algorithm FindMissingNumber(arr)

n ← length(arr)

FOR number ← 0 TO n

    found ← FALSE

    FOR each element in arr

        IF element = number THEN

            found ← TRUE
            BREAK

        END IF

    END FOR

    IF found = FALSE THEN
        RETURN number
    END IF

END FOR

End Algorithm
```

### Java Implementation

```java
public static int findMissingNumber(int[] arr) {

    int n = arr.length;

    for (int number = 0; number <= n; number++) {

        boolean found = false;

        for (int value : arr) {

            if (value == number) {
                found = true;
                break;
            }

        }

        if (!found) {
            return number;
        }

    }

    return -1;
}
```

---

## Approach 2 — Sorting

### Idea

Sort the array.

If the array is complete,

```text
Index : 0 1 2 3

Value : 0 1 2 3
```

The first index where

```text
index ≠ value
```

is the missing number.

### Algorithm (Pseudocode)

```text
Algorithm FindMissingNumber(arr)

SORT arr

FOR i ← 0 TO length(arr)-1

    IF arr[i] ≠ i THEN
        RETURN i
    END IF

END FOR

RETURN length(arr)

End Algorithm
```

### Java Implementation

```java
import java.util.Arrays;

public static int findMissingNumber(int[] arr) {

    Arrays.sort(arr);

    for (int i = 0; i < arr.length; i++) {

        if (arr[i] != i) {
            return i;
        }

    }

    return arr.length;
}
```

---

## Approach 3 — Hashing

### Idea

Create a boolean array.

Mark every visited number.

The unmarked index is the missing number.

### Algorithm (Pseudocode)

```text
Algorithm FindMissingNumber(arr)

Create visited[0...n]

FOR each element

    visited[element] ← TRUE

END FOR

FOR i ← 0 TO n

    IF visited[i] = FALSE THEN
        RETURN i
    END IF

END FOR

End Algorithm
```

### Java Implementation

```java
public static int findMissingNumber(int[] arr) {

    boolean[] visited = new boolean[arr.length + 1];

    for (int num : arr) {
        visited[num] = true;
    }

    for (int i = 0; i < visited.length; i++) {

        if (!visited[i]) {
            return i;
        }

    }

    return -1;
}
```

---

## Approach 4 — Mathematical Formula

### Idea

The expected sum of numbers from `0` to `n` is known.

Subtract the actual sum.

The difference is the missing number.

### Algorithm (Pseudocode)

```text
Algorithm FindMissingNumber(arr)

n ← length(arr)

expectedSum ← n × (n + 1) / 2

actualSum ← 0

FOR each element

    actualSum ← actualSum + element

END FOR

RETURN expectedSum - actualSum

End Algorithm
```

### Java Implementation

```java
public static int findMissingNumber(int[] arr) {

    int n = arr.length;

    int expectedSum = n * (n + 1) / 2;

    int actualSum = 0;

    for (int num : arr) {
        actualSum += num;
    }

    return expectedSum - actualSum;
}
```

---

## Approach 5 — XOR (Optimal)

### Idea

XOR all numbers from `0` to `n`.

XOR all elements of the array.

Equal numbers cancel each other.

The remaining value is the missing number.

### Algorithm (Pseudocode)

```text
Algorithm FindMissingNumber(arr)

xor ← 0

FOR i ← 0 TO length(arr)

    xor ← xor XOR i

END FOR

FOR each element

    xor ← xor XOR element

END FOR

RETURN xor

End Algorithm
```

### Java Implementation

```java
public static int findMissingNumber(int[] arr) {

    int xor = 0;

    for (int i = 0; i <= arr.length; i++) {
        xor ^= i;
    }

    for (int num : arr) {
        xor ^= num;
    }

    return xor;
}
```

---

## 6. Complexity Analysis

|Approach|Time|Space|
|---|---|---|
|Brute Force|O(n²)|O(1)|
|Sorting|O(n log n)|O(1)*|
|Hashing|O(n)|O(n)|
|Sum Formula|O(n)|O(1)|
|XOR|O(n)|O(1)|

> *Ignoring recursion stack used by the sorting algorithm.

**Why?**

- **Brute Force:** Each number from `0` to `n` is searched through the entire array.
    
- **Sorting:** Sorting dominates the running time with `O(n log n)`.
    
- **Hashing:** One traversal marks visited numbers, another finds the missing one.
    
- **Sum Formula:** One traversal computes the actual sum; expected sum is calculated in constant time.
    
- **XOR:** One pass computes the XOR of the range, another pass computes the XOR of the array. Both traversals are linear.
    

---

## 7. Key Learnings

- Always inspect the constraints before selecting an algorithm.
    
- A known numeric range often suggests **hashing**, **mathematics**, or **bit manipulation**.
    
- Mathematical formulas provide elegant constant-space solutions but may overflow for very large values.
    
- XOR is a common interview technique for problems involving pairs, missing numbers, and unique elements.
    

---

## 8. Interview Takeaway

```text
Known Range

        │
        ▼

One Missing Number?

        │
        ▼

Can Mathematics solve it?

        │
        ▼

Yes

        │
        ├── Sum Formula
        │
        └── XOR

        │
        ▼

O(n)
O(1)
```

---

## Pattern Expansion

```text
Known Range Problems

│
├── Find Missing Number ✅
├── Find Duplicate Number
├── Find Missing & Repeating Number
├── First Missing Positive
├── Single Number (XOR)
├── Missing Number II
└── Find All Disappeared Numbers
```

### Pattern Insight

This problem is valuable because it demonstrates that **the optimal algorithm doesn't always come from traversal techniques**. Sometimes the best solution comes from recognizing a mathematical property or a bitwise property hidden in the problem statement. Learning to identify these hidden observations is an important step toward solving medium and hard interview problems efficiently.

---

# Problem 12: Maximum Consecutive Ones

## 1. Pattern

- Array Traversal
    
- Running Count
    
- Running Maximum
    

---

## 2. Problem Statement

Given a binary array `arr` containing only `0`s and `1`s, return the length of the **longest consecutive sequence of `1`s**.

**Example**

```text
Input:
arr = [1, 1, 0, 1, 1, 1]

Output:
3
```

```text
Input:
arr = [1, 0, 1, 1, 0, 1]

Output:
2
```

---

## 3. Recognition Clues

Ask yourself:

- Need the longest continuous sequence?
    
- Is only one traversal sufficient?
    
- Do I need to count consecutive elements?
    
- Should the count reset on a condition?
    

If the answers are

```text
Need longest streak     ✓
Need counting           ✓
Reset on condition      ✓
```

Think

```text
Running Count
+
Running Maximum
```

---

## 4. Thinking Process

|Approach|Idea|Time|Space|Why Improve?|
|---|---|---|---|---|
|1|Start from every `1` and count consecutive ones|O(n²)|O(1)|Repeated counting of the same sequence|
|2|Traverse once while maintaining the current streak|O(n)|O(1)|Optimal|

---

## 5. Approaches

## Approach 1 — Brute Force

### Idea

Whenever a `1` is found,

start counting consecutive `1`s from that position.

Update the maximum streak.

Repeat for every index.

### Algorithm (Pseudocode)

```text
Algorithm MaximumConsecutiveOnes(arr)

maxCount ← 0

FOR i ← 0 TO n - 1

    IF arr[i] = 1 THEN

        count ← 0

        FOR j ← i TO n - 1

            IF arr[j] = 1 THEN
                count ← count + 1
            ELSE
                BREAK
            END IF

        END FOR

        maxCount ← MAX(maxCount, count)

    END IF

END FOR

RETURN maxCount

End Algorithm
```

### Java Implementation

```java
public static int maximumConsecutiveOnes(int[] arr) {

    int maxCount = 0;

    for (int i = 0; i < arr.length; i++) {

        if (arr[i] == 1) {

            int count = 0;

            for (int j = i; j < arr.length; j++) {

                if (arr[j] == 1) {
                    count++;
                } else {
                    break;
                }

            }

            maxCount = Math.max(maxCount, count);
        }
    }

    return maxCount;
}
```

---

## Approach 2 — Running Count (Optimal)

### Idea

Maintain two variables:

- `currentCount` → Current streak of consecutive `1`s.
    
- `maxCount` → Longest streak found so far.
    

Whenever a `1` is found,

increase the current streak.

Whenever a `0` is found,

reset the streak.

### Algorithm (Pseudocode)

```text
Algorithm MaximumConsecutiveOnes(arr)

currentCount ← 0

maxCount ← 0

FOR each element in arr

    IF element = 1 THEN

        currentCount ← currentCount + 1

        maxCount ← MAX(maxCount, currentCount)

    ELSE

        currentCount ← 0

    END IF

END FOR

RETURN maxCount

End Algorithm
```

### Java Implementation

```java
public static int maximumConsecutiveOnes(int[] arr) {

    int currentCount = 0;
    int maxCount = 0;

    for (int num : arr) {

        if (num == 1) {

            currentCount++;
            maxCount = Math.max(maxCount, currentCount);

        } else {

            currentCount = 0;

        }

    }

    return maxCount;
}
```

---

## 6. Complexity Analysis

|Approach|Time|Space|
|---|---|---|
|Brute Force|O(n²)|O(1)|
|Running Count|O(n)|O(1)|

**Why?**

- **Brute Force:** For every `1`, another traversal counts the consecutive ones, causing many elements to be revisited.
    
- **Running Count:** The array is traversed only once. Each element updates the current streak or resets it, so every element is processed exactly once.
    

---

## 7. Key Learnings

- Running values are not always numbers like **maximum** or **minimum**; they can also represent a **current state** such as a streak or count.
    
- Resetting a running variable on a specific condition is a common interview pattern.
    
- This problem is the foundation for many Sliding Window problems.
    

---

## 8. Interview Takeaway

```text
Need longest consecutive sequence?

        │
        ▼

Can the answer be built
while traversing?

        │
        ▼

Maintain

Current Count

+

Maximum Count

        │
        ▼

Reset when sequence breaks
```

---

## Pattern Visualization

```text
Array

1 1 0 1 1 1 0 1

Current Count

1 2 0 1 2 3 0 1

Maximum Count

1 2 2 2 2 3 3 3
```

Notice the difference:

- **`currentCount`** changes continuously and resets whenever a `0` is encountered.
    
- **`maxCount`** only changes when a longer streak is discovered.
    

---

## Pattern Expansion

```text
Running Count Pattern

│
├── Maximum Consecutive Ones ✅
├── Longest Subarray of 1s
├── Longest Increasing Contiguous Subarray
├── Longest Alternating Subarray
├── Max Consecutive Characters
└── Sliding Window Problems
```

### Pattern Insight

This problem introduces the **Running Count** pattern, where you continuously maintain the state of the **current sequence** while also tracking the **best sequence seen so far**. This exact idea is extended in sliding window problems, where instead of simply resetting the count, you dynamically expand and shrink a window based on problem constraints.


---

# Problem 13: Single Number

## 1. Pattern

- Array Traversal
    
- Hashing
    
- Bit Manipulation (XOR)
    

---

## 2. Problem Statement

Given a **non-empty** integer array where **every element appears exactly twice except one element**, return the element that appears only once.

**Example**

```text
Input:
arr = [2, 2, 1]

Output:
1
```

```text
Input:
arr = [4, 1, 2, 1, 2]

Output:
4
```

```text
Input:
arr = [1]

Output:
1
```

---

## 3. Recognition Clues

Ask yourself:

- Does every element occur exactly twice?
    
- Is there only one unique element?
    
- Can duplicate values cancel each other?
    
- Is extra space avoidable?
    

If the answers are

```text
Pairs of duplicates     ✓
One unique element      ✓
Constant space needed   ✓
```

Think

```text
XOR
```

---

## 4. Thinking Process

|Approach|Idea|Time|Space|Why Improve?|
|---|---|---|---|---|
|1|Count frequency using nested loops|O(n²)|O(1)|Repeated counting|
|2|Store frequencies in a HashMap|O(n)|O(n)|Extra memory required|
|3|XOR all elements|O(n)|O(1)|Optimal|

---

## 5. Approaches

## Approach 1 — Brute Force

### Idea

For every element,

count how many times it appears.

The element with frequency `1` is the answer.

### Algorithm (Pseudocode)

```text
Algorithm SingleNumber(arr)

FOR i ← 0 TO n - 1

    count ← 0

    FOR j ← 0 TO n - 1

        IF arr[i] = arr[j] THEN
            count ← count + 1
        END IF

    END FOR

    IF count = 1 THEN
        RETURN arr[i]
    END IF

END FOR

End Algorithm
```

### Java Implementation

```java
public static int singleNumber(int[] arr) {

    for (int i = 0; i < arr.length; i++) {

        int count = 0;

        for (int j = 0; j < arr.length; j++) {

            if (arr[i] == arr[j]) {
                count++;
            }

        }

        if (count == 1) {
            return arr[i];
        }

    }

    return -1;
}
```

---

## Approach 2 — HashMap

### Idea

Store the frequency of every element.

Traverse the map.

Return the key whose frequency is `1`.

### Algorithm (Pseudocode)

```text
Algorithm SingleNumber(arr)

Create empty HashMap

FOR each element

    Increase its frequency

END FOR

FOR each entry in HashMap

    IF frequency = 1 THEN
        RETURN key
    END IF

END FOR

End Algorithm
```

### Java Implementation

```java
import java.util.HashMap;
import java.util.Map;

public static int singleNumber(int[] arr) {

    Map<Integer, Integer> frequency = new HashMap<>();

    for (int num : arr) {
        frequency.put(num, frequency.getOrDefault(num, 0) + 1);
    }

    for (Map.Entry<Integer, Integer> entry : frequency.entrySet()) {

        if (entry.getValue() == 1) {
            return entry.getKey();
        }

    }

    return -1;
}
```

---

## Approach 3 — XOR (Optimal)

### Idea

XOR all the elements.

Since every duplicate appears exactly twice,

they cancel each other.

Only the unique element remains.

### XOR Properties

```text
a ^ a = 0

a ^ 0 = a

XOR is Commutative

a ^ b = b ^ a

XOR is Associative

(a ^ b) ^ c = a ^ (b ^ c)
```

Example

```text
2 ^ 2 ^ 1

↓

0 ^ 1

↓

1
```

---

### Algorithm (Pseudocode)

```text
Algorithm SingleNumber(arr)

result ← 0

FOR each element

    result ← result XOR element

END FOR

RETURN result

End Algorithm
```

### Java Implementation

```java
public static int singleNumber(int[] arr) {

    int result = 0;

    for (int num : arr) {
        result ^= num;
    }

    return result;
}
```

---

## 6. Complexity Analysis

|Approach|Time|Space|
|---|---|---|
|Brute Force|O(n²)|O(1)|
|HashMap|O(n)|O(n)|
|XOR|O(n)|O(1)|

**Why?**

- **Brute Force:** Every element is compared with every other element to determine its frequency.
    
- **HashMap:** One traversal builds the frequency map, and another traversal finds the element with frequency `1`.
    
- **XOR:** The array is traversed once, and every XOR operation takes constant time.
    

---

## 7. Key Learnings

- Look for mathematical or bitwise properties before using extra memory.
    
- XOR naturally removes pairs of identical values.
    
- Bit manipulation often produces elegant constant-space solutions.
    
- Always check whether the problem guarantees **exactly two occurrences** for duplicate elements, since the XOR approach relies on this constraint.
    

---

## 8. Interview Takeaway

```text
Every duplicate appears twice?

        │
        ▼

Exactly one unique element?

        │
        ▼

Need O(1) space?

        │
        ▼

Think

XOR

        │
        ▼

Duplicate ^ Duplicate = 0

Unique survives
```

---

## XOR Visualization

```text
Array

4 1 2 1 2

Step 1

0 ^ 4 = 4

Step 2

4 ^ 1 = 5

Step 3

5 ^ 2 = 7

Step 4

7 ^ 1 = 6

Step 5

6 ^ 2 = 4

Answer

4
```

Or, using the cancellation property:

```text
4 ^ 1 ^ 2 ^ 1 ^ 2

↓

4 ^ (1 ^ 1) ^ (2 ^ 2)

↓

4 ^ 0 ^ 0

↓

4
```

---

## Pattern Expansion

```text
Bit Manipulation

│
├── Single Number ✅
├── Missing Number (XOR)
├── Single Number II
├── Single Number III
├── Find Missing & Repeating Number
├── XOR of Given Range
└── Maximum XOR of Two Numbers
```

### Pattern Insight

This problem introduces one of the most useful interview observations:

> **When elements appear in pairs, ask whether an operation exists that makes each pair cancel itself.**

For XOR:

```text
x ^ x = 0
```

This cancellation property transforms what looks like a **frequency-counting problem** into a simple **bit manipulation** problem with **O(n)** time and **O(1)** space. Understanding _why_ the duplicates disappear is much more valuable than memorizing the XOR solution.

---

# Problem 14: Longest Subarray with Sum = K (Positive Numbers Only)

## 1. Pattern

- Sliding Window
    
- Two Pointers
    
- Running Sum
    

---

## 2. Problem Statement

Given an array of **positive integers** and an integer `k`, find the **length of the longest subarray** whose sum is exactly `k`.

**Example**

```text
Input:
arr = [1, 2, 3, 1, 1, 1, 1]
k = 6

Output:
4

Explanation:
Subarray = [3, 1, 1, 1]
Length = 4
```

---

## 3. Recognition Clues

Ask yourself:

- Need a contiguous subarray?
    
- Need the longest or shortest window?
    
- Are all elements positive?
    
- Can the window grow and shrink?
    

If the answers are

```text
Contiguous Subarray      ✓
Positive Numbers         ✓
Need Longest Length      ✓
```

Think

```text
Sliding Window
```

---

## 4. Thinking Process

|Approach|Idea|Time|Space|Why Improve?|
|---|---|---|---|---|
|1|Generate every possible subarray|O(n²)|O(1)|Too many repeated sum calculations|
|2|Generate every subarray while maintaining a running sum|O(n²)|O(1)|Sum calculation improves, but every subarray is still checked|
|3|Sliding Window|O(n)|O(1)|Uses the positive-number property to avoid unnecessary work|

---

## 5. Approaches

## Approach 1 — Brute Force

### Idea

Generate every possible subarray.

For each subarray, calculate its sum.

If the sum equals `k`, update the maximum length.

### Algorithm (Pseudocode)

```text
Algorithm LongestSubarray(arr, k)

maxLength ← 0

FOR start ← 0 TO n - 1

    FOR end ← start TO n - 1

        sum ← 0

        FOR i ← start TO end

            sum ← sum + arr[i]

        END FOR

        IF sum = k THEN

            maxLength ← MAX(maxLength, end - start + 1)

        END IF

    END FOR

END FOR

RETURN maxLength

End Algorithm
```

### Java Implementation

```java
public static int longestSubarray(int[] arr, int k) {

    int maxLength = 0;

    // Runs n times
    for (int start = 0; start < arr.length; start++) {

        // Runs approximately n times
        for (int end = start; end < arr.length; end++) {

            int sum = 0;

            // Calculates subarray sum every time
            // Overall complexity becomes O(n³)
            for (int i = start; i <= end; i++) {
                sum += arr[i];
            }

            if (sum == k) {
                maxLength = Math.max(maxLength, end - start + 1);
            }

        }

    }

    return maxLength;
}
```

### Problems with this Approach

- Recalculates the same sums repeatedly.
    
- Extremely inefficient for large arrays.
    
- Time complexity becomes **O(n³)**.
    

**Need a way to reuse the previously calculated sum.**

↓

Move to **Approach 2**

---

## Approach 2 — Running Sum

### Idea

Instead of recalculating the sum,

extend the current subarray by adding only the new element.

### Algorithm (Pseudocode)

```text
Algorithm LongestSubarray(arr, k)

maxLength ← 0

FOR start ← 0 TO n - 1

    sum ← 0

    FOR end ← start TO n - 1

        sum ← sum + arr[end]

        IF sum = k THEN

            maxLength ← MAX(maxLength, end - start + 1)

        END IF

    END FOR

END FOR

RETURN maxLength

End Algorithm
```

### Java Implementation

```java
public static int longestSubarray(int[] arr, int k) {

    int maxLength = 0;

    // Runs n times
    for (int start = 0; start < arr.length; start++) {

        int sum = 0;

        // Runs n times overall for each start
        // Total complexity = O(n²)
        for (int end = start; end < arr.length; end++) {

            sum += arr[end];

            if (sum == k) {
                maxLength = Math.max(maxLength, end - start + 1);
            }

        }

    }

    return maxLength;
}
```

### Problems with this Approach

- Every possible subarray is still generated.
    
- Even after the sum exceeds `k`, unnecessary work continues.
    

Since **all numbers are positive**, once the sum becomes greater than `k`, it can only increase further by extending the window.

**Need an approach that shrinks the window instead of restarting it.**

↓

Move to **Approach 3**

---

## Approach 3 — Sliding Window (Optimal)

### Idea

Maintain a window using two pointers.

- Expand the window by moving the right pointer.
    
- If the sum becomes greater than `k`, shrink the window from the left.
    
- Whenever the sum equals `k`, update the maximum length.
    

Since all numbers are positive, removing elements always decreases the sum and adding elements always increases it.

### Algorithm (Pseudocode)

```text
Algorithm LongestSubarray(arr, k)

left ← 0

sum ← 0

maxLength ← 0

FOR right ← 0 TO n - 1

    sum ← sum + arr[right]

    WHILE sum > k

        sum ← sum - arr[left]

        left ← left + 1

    END WHILE

    IF sum = k THEN

        maxLength ← MAX(maxLength, right - left + 1)

    END IF

END FOR

RETURN maxLength

End Algorithm
```

### Java Implementation

```java
public static int longestSubarray(int[] arr, int k) {

    int left = 0;
    int sum = 0;
    int maxLength = 0;

    // Right pointer visits each element exactly once → O(n)
    for (int right = 0; right < arr.length; right++) {

        sum += arr[right];

        // Left pointer also moves only forward.
        // Across the entire algorithm it moves at most n times.
        // Total complexity remains O(n).
        while (sum > k) {

            sum -= arr[left];
            left++;

        }

        if (sum == k) {
            maxLength = Math.max(maxLength, right - left + 1);
        }

    }

    return maxLength;
}
```

### Problems with this Approach

- Works **only** because every element is positive.
    
- If negative numbers are allowed, removing an element from the left does not always decrease the sum, so the sliding window property breaks.
    

For arrays containing both positive and negative numbers, we need a different technique: **Prefix Sum + HashMap**.

---

## 6. Complexity Analysis

|Approach|Time|Space|
|---|---|---|
|Brute Force (Recalculate Sum)|O(n³)|O(1)|
|Running Sum|O(n²)|O(1)|
|Sliding Window|O(n)|O(1)|

**Why?**

- **Brute Force:** Three nested traversals—generate every subarray and recompute its sum.
    
- **Running Sum:** Sum is reused, eliminating the third loop, but every subarray is still examined.
    
- **Sliding Window:** Both pointers move only forward. Each element enters the window once and leaves the window at most once, resulting in linear time.
    

---

## 7. Key Learnings

- Sliding Window applies when working with **contiguous subarrays**.
    
- The positive-number property is what makes shrinking the window safe.
    
- Reusing the previous window's sum eliminates repeated calculations.
    
- Two pointers moving only forward often indicate an `O(n)` solution.
    

---

## 8. Interview Takeaway

```text
Need contiguous subarray?

        │
        ▼

Need longest/shortest window?

        │
        ▼

All elements positive?

        │
        ├── Yes
        │      ▼
        │  Sliding Window
        │
        └── No
               ▼
        Prefix Sum + HashMap
```

---

## Pattern Visualization

```text
Array

1 2 3 1 1 1 1

L
R

Sum = 1

↓

Expand Right

1 2 3

L     R

Sum = 6 ✓

↓

Expand Again

1 2 3 1

Sum = 7

↓

Shrink Left

2 3 1

  L   R

Sum = 6 ✓
```

---

## Pattern Expansion

```text
Sliding Window

│
├── Longest Subarray with Sum K (Positive) ✅
├── Maximum Sum Subarray of Size K
├── Minimum Size Subarray Sum
├── Longest Repeating Character Replacement
├── Longest Substring Without Repeating Characters
├── Fruits Into Baskets
├── Max Consecutive Ones III
└── Minimum Window Substring
```

### Pattern Insight

The defining feature of a sliding window is **not** the presence of two pointers—it is the ability to **reuse the work done for the previous window**. Instead of rebuilding every subarray from scratch, the algorithm updates the current window by adding one element when it expands and removing one element when it shrinks. This reuse of state is what reduces the complexity from `O(n²)` to `O(n)`.

---

# Problem 15: Two Sum

## 1. Pattern

- Array Traversal
    
- Hashing
    
- Two Pointers (Sorted Arrays)
    

---

## 2. Problem Statement

Given an integer array `arr` and an integer `target`, return the **indices** of the two numbers such that

```text
arr[i] + arr[j] = target
```

Assume that exactly one valid answer exists and the same element cannot be used twice.

**Example**

```text
Input:
arr = [2, 7, 11, 15]
target = 9

Output:
[0, 1]
```

```text
Input:
arr = [3, 2, 4]
target = 6

Output:
[1, 2]
```

---

## 3. Recognition Clues

Ask yourself:

- Need to find a pair?
    
- Is the array sorted?
    
- Can previous elements help?
    
- Can extra memory reduce the time complexity?
    

If the answers are

```text
Need pair               ✓
Need target sum         ✓
Array unsorted          ✓
```

Think

```text
HashMap
```

If the array is already sorted

```text
Two Pointers
```

---

## 4. Thinking Process

|Approach|Idea|Time|Space|Why Improve?|
|---|---|---|---|---|
|1|Check every possible pair|O(n²)|O(1)|Too many repeated comparisons|
|2|Sort then use Two Pointers|O(n log n)|O(n)*|Loses original indices|
|3|HashMap|O(n) Average|O(n)|Optimal for unsorted arrays|

> *Sorting while preserving original indices requires storing index-value pairs.

---

## 5. Approaches

## Approach 1 — Brute Force

### Idea

Generate every possible pair.

If their sum equals the target,

return the indices.

### Algorithm (Pseudocode)

```text
Algorithm TwoSum(arr, target)

FOR i ← 0 TO n - 2

    FOR j ← i + 1 TO n - 1

        IF arr[i] + arr[j] = target THEN

            RETURN (i, j)

        END IF

    END FOR

END FOR

End Algorithm
```

### Java Implementation

```java
public static int[] twoSum(int[] arr, int target) {

    // Outer loop → O(n)
    for (int i = 0; i < arr.length - 1; i++) {

        // Inner loop executes for every i
        // Overall → O(n²)
        for (int j = i + 1; j < arr.length; j++) {

            if (arr[i] + arr[j] == target) {
                return new int[]{i, j};
            }

        }

    }

    return new int[]{-1, -1};
}
```

### Problems with this Approach

- Every element is paired with many others.
    
- Large number of unnecessary comparisons.
    
- Time complexity becomes **O(n²)**.
    

**Need a way to find the required partner in constant time.**

↓

Move to **Approach 2**

---

## Approach 2 — Sorting + Two Pointers

### Idea

Sort the array.

Use one pointer from the beginning and another from the end.

- If sum is too small → move left pointer.
    
- If sum is too large → move right pointer.
    

### Algorithm (Pseudocode)

```text
Algorithm TwoSum(arr, target)

Sort the array

left ← 0

right ← n - 1

WHILE left < right

    sum ← arr[left] + arr[right]

    IF sum = target THEN
        RETURN TRUE
    END IF

    IF sum < target THEN
        left ← left + 1
    ELSE
        right ← right - 1
    END IF

END WHILE

RETURN FALSE

End Algorithm
```

### Java Implementation

```java
Arrays.sort(arr);
// Arrays.sort() → O(n log n)

int left = 0;
int right = arr.length - 1;

// Both pointers together move at most n times → O(n)
while (left < right) {

    int sum = arr[left] + arr[right];

    if (sum == target) {
        return new int[]{left, right};
    }

    if (sum < target) {
        left++;
    } else {
        right--;
    }

}

return new int[]{-1, -1};
```

### Problems with this Approach

- Sorting changes the original order of the array.
    
- Original indices are lost.
    
- Extra data structures are needed to preserve indices.
    

**Need a solution that keeps the original indices without sorting.**

↓

Move to **Approach 3**

---

## Approach 3 — HashMap (Optimal)

### Idea

While traversing the array,

for every element,

calculate the required complement.

```text
complement = target - currentElement
```

If the complement has already been seen,

the answer is found.

Otherwise,

store the current element and its index.

### Algorithm (Pseudocode)

```text
Algorithm TwoSum(arr, target)

Create empty HashMap

FOR i ← 0 TO n - 1

    complement ← target - arr[i]

    IF complement exists in HashMap THEN

        RETURN (HashMap[complement], i)

    END IF

    Store (arr[i], i) in HashMap

END FOR

End Algorithm
```

### Java Implementation

```java
public static int[] twoSum(int[] arr, int target) {

    Map<Integer, Integer> map = new HashMap<>();

    // Runs n times → O(n)
    for (int i = 0; i < arr.length; i++) {

        int complement = target - arr[i];

        // containsKey() → Average O(1), Worst O(n)
        if (map.containsKey(complement)) {

            // get() → Average O(1), Worst O(n)
            return new int[]{map.get(complement), i};

        }

        // put() → Average O(1), Worst O(n)
        map.put(arr[i], i);

    }

    return new int[]{-1, -1};
}
```

### How this improves the previous approach

- No sorting is required.
    
- Original indices remain unchanged.
    
- Partner lookup becomes constant time on average.
    

### Problems with this Approach

- Requires additional memory.
    
- Performance depends on the efficiency of hashing.
    

---

## 6. Complexity Analysis

|Approach|Time|Space|
|---|---|---|
|Brute Force|O(n²)|O(1)|
|Sorting + Two Pointers|O(n log n)|O(n)*|
|HashMap|O(n) Average|O(n)|

> *When original indices must be preserved, an auxiliary array of `(value, index)` pairs is required.

**Why?**

- **Brute Force:** Every element is paired with every other element.
    
- **Sorting + Two Pointers:** Sorting dominates the complexity; the pointer traversal is linear.
    
- **HashMap:** One traversal of the array with average constant-time hash operations.
    

### Complexity Notes

|Data Structure|Insert|Search|Delete|Overall|
|---|---|---|---|---|
|`HashMap` (Average)|O(1)|O(1)|O(1)|O(n)|
|`HashMap` (Worst)|O(n)|O(n)|O(n)|O(n²)|
|`LinkedHashMap`|O(1) Avg|O(1) Avg|O(1) Avg|O(n)|
|`TreeMap`|O(log n)|O(log n)|O(log n)|O(n log n)|

---

## 7. Key Learnings

- Hashing is useful when you need to quickly determine whether a previously seen value exists.
    
- Store **value → index**, not **index → value**.
    
- Calculate the complement instead of checking every possible pair.
    
- Two Pointers become preferable when the array is already sorted.
    

---

## 8. Interview Takeaway

```text
Need two elements?

        │
        ▼

Array sorted?

   ├── Yes
   │
   │  Two Pointers
   │
   └── No
        │
        ▼

Need original indices?

        │
        ├── Yes
        │      ▼
        │   HashMap
        │
        └── No
               ▼
        Sort + Two Pointers
```

---

## Pattern Visualization

Suppose

```text
Array

2 7 11 15

Target = 9
```

### Step 1

```text
Current = 2

Complement = 7

HashMap

{}
```

Store

```text
2 → 0
```

---

### Step 2

```text
Current = 7

Complement = 2
```

HashMap

```text
2 → 0
```

Found!

```text
Answer

(0, 1)
```

---

## Pattern Expansion

```text
Hashing Pattern

│
├── Two Sum ✅
├── Longest Subarray with Sum K
├── Contains Duplicate
├── Group Anagrams
├── Top K Frequent Elements
├── Subarray Sum Equals K
├── Longest Consecutive Sequence
└── Four Sum
```

### Pattern Insight

The key observation is to stop thinking:

> "Which two numbers add up to the target?"

and instead think:

> "For the current number, **what number do I need** to reach the target?"

That small shift transforms a nested-loop search into a single-pass lookup algorithm. This **complement lookup** technique is one of the most reusable patterns in hashing problems.

---

# Problem 16: Sort an Array of 0's, 1's and 2's

## 1. Pattern

- Array Traversal
    
- Counting
    
- Three Pointers (Dutch National Flag)
    

---

## 2. Problem Statement

Given an array containing only `0`, `1` and `2`, sort the array in ascending order **in-place**.

**Example**

```text
Input:
arr = [2, 0, 2, 1, 1, 0]

Output:
[0, 0, 1, 1, 2, 2]
```

```text
Input:
arr = [2, 0, 1]

Output:
[0, 1, 2]
```

---

## 3. Recognition Clues

Ask yourself:

- Only three distinct values?
    
- Need in-place sorting?
    
- Is general sorting unnecessary?
    
- Can the array be partitioned?
    

If the answers are

```text
Only 0,1,2           ✓
Limited values        ✓
Need in-place         ✓
```

Think

```text
Dutch National Flag
```

---

## 4. Thinking Process

|Approach|Idea|Time|Space|Why Improve?|
|---|---|---|---|---|
|1|Sort using library function|O(n log n)|O(1)*|Doesn't utilize the limited values|
|2|Count frequencies of 0,1,2 and overwrite the array|O(n)|O(1)|Requires two traversals|
|3|Dutch National Flag Algorithm|O(n)|O(1)|Single traversal|

> *Ignoring the recursion stack used internally by the sorting algorithm.

---

## 5. Approaches

## Approach 1 — Library Sorting

### Idea

Use Java's built-in sorting algorithm.

### Algorithm (Pseudocode)

```text
Algorithm Sort012(arr)

SORT arr

RETURN arr

End Algorithm
```

### Java Implementation

```java
public static void sort012(int[] arr) {

    // Arrays.sort() for primitive int[]
    // Time → O(n log n)
    // Space → O(log n) recursion stack (implementation dependent)
    Arrays.sort(arr);
}
```

### Problems with this Approach

- Treats the array as a general sorting problem.
    
- Does not utilize the fact that only three distinct values exist.
    
- More work than necessary.
    

**Need an approach that uses the limited value range.**

↓

Move to **Approach 2**

---

## Approach 2 — Counting

### Idea

Count the number of `0`s, `1`s and `2`s.

Overwrite the array using these counts.

### Algorithm (Pseudocode)

```text
Algorithm Sort012(arr)

count0 ← 0
count1 ← 0
count2 ← 0

FOR each element

    Increase corresponding counter

END FOR

Fill array with count0 zeros

Fill array with count1 ones

Fill array with count2 twos

End Algorithm
```

### Java Implementation

```java
public static void sort012(int[] arr) {

    int count0 = 0;
    int count1 = 0;
    int count2 = 0;

    // Runs n times → O(n)
    for (int num : arr) {

        if (num == 0)
            count0++;
        else if (num == 1)
            count1++;
        else
            count2++;
    }

    int index = 0;

    // Total assignments = n
    // Overall → O(n)

    while (count0-- > 0)
        arr[index++] = 0;

    while (count1-- > 0)
        arr[index++] = 1;

    while (count2-- > 0)
        arr[index++] = 2;
}
```

### How this improves the previous approach

- Reduces the time complexity from **O(n log n)** to **O(n)**.
    
- Uses only constant extra space.
    
- Exploits the fact that there are only three distinct values.
    

### Problems with this Approach

- Requires two traversals.
    
- Overwrites every element, even if the array is already nearly sorted.
    

**Need a solution that sorts during a single traversal.**

↓

Move to **Approach 3**

---

## Approach 3 — Dutch National Flag Algorithm (Optimal)

### Idea

Maintain three regions:

```text
0 ... low-1        → 0s

low ... mid-1      → 1s

mid ... high       → Unknown

high+1 ... n-1     → 2s
```

Process the unknown region.

- If `0` → swap with `low`, increment both `low` and `mid`.
    
- If `1` → just increment `mid`.
    
- If `2` → swap with `high`, decrement `high`.
    

---

### Algorithm (Pseudocode)

```text
Algorithm Sort012(arr)

low ← 0

mid ← 0

high ← n - 1

WHILE mid ≤ high

    IF arr[mid] = 0 THEN

        Swap arr[low] and arr[mid]

        low ← low + 1

        mid ← mid + 1

    ELSE IF arr[mid] = 1 THEN

        mid ← mid + 1

    ELSE

        Swap arr[mid] and arr[high]

        high ← high - 1

    END IF

END WHILE

End Algorithm
```

### Java Implementation

```java
public static void sort012(int[] arr) {

    int low = 0;
    int mid = 0;
    int high = arr.length - 1;

    // Each element is processed at most once
    // Overall complexity → O(n)
    while (mid <= high) {

        if (arr[mid] == 0) {

            swap(arr, low, mid);

            low++;
            mid++;

        } else if (arr[mid] == 1) {

            mid++;

        } else {

            swap(arr, mid, high);

            high--;

        }

    }
}

private static void swap(int[] arr, int i, int j) {

    int temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
}
```

### How this improves the previous approach

- Completes sorting in a single traversal.
    
- Does not require counting frequencies.
    
- Rearranges elements while scanning the array.
    

### Limitation

- Works because there are only **three distinct categories**.
    
- Cannot be directly applied to arrays with arbitrary values.
    

---

## 6. Complexity Analysis

|Approach|Time|Space|
|---|---|---|
|Library Sort|O(n log n)|O(log n)*|
|Counting|O(n)|O(1)|
|Dutch National Flag|O(n)|O(1)|

> *Implementation-dependent recursion stack for primitive array sorting.

**Why?**

- **Library Sort:** Sorting dominates the running time.
    
- **Counting:** One traversal counts frequencies and another overwrites the array.
    
- **Dutch National Flag:** Each element is examined at most once. The three pointers only move forward (`high` moves backward), resulting in a single linear traversal.
    

---

## 7. Key Learnings

- Do not use a general sorting algorithm when the input has special constraints.
    
- Partitioning is often more efficient than sorting.
    
- The Dutch National Flag algorithm is a specialized three-pointer technique.
    
- Carefully update pointers after swaps:
    
    - After swapping with `low`, increment both `low` and `mid`.
        
    - After swapping with `high`, **do not increment `mid`**, because the swapped element has not been processed yet.
        

---

## 8. Interview Takeaway

```text
Need to sort?

        │
        ▼

Only few distinct values?

        │
        ▼

Exactly three categories?

        │
        ▼

Think

Dutch National Flag

↓

Three Pointers
```

---

## Pattern Visualization

Initial

```text
Array

2 0 2 1 1 0

L M       H
```

After processing

```text
0 0 1 1 2 2

    L
      M
    H
```

Regions throughout the algorithm

```text
|------|------|-----------|------|
   0s      1s     Unknown      2s
 0..L-1  L..M-1    M..H     H+1..n-1
```

---

## Pattern Expansion

```text
Three Pointer Pattern

│
├── Sort 0's,1's & 2's ✅
├── Dutch National Flag
├── Three-way Partitioning
├── Wiggle Sort (variants)
├── QuickSort Partition
└── Rainbow Sort
```

### Pattern Insight

The Dutch National Flag algorithm demonstrates an important optimization strategy:

> **Instead of sorting values by repeatedly comparing them, classify each element into its correct partition as soon as it is encountered.**

This idea of **partitioning** is reused in algorithms such as **QuickSort**, **three-way partitioning**, and several advanced in-place array rearrangement problems.

# Problem 17: Majority Element

## 1. Pattern

- Array Traversal
    
- Hashing
    
- Voting Algorithm (Boyer-Moore)
    

---

## 2. Problem Statement

Given an integer array `arr` of size `n`, find the **majority element**.

A majority element is an element that appears **more than** `⌊n/2⌋` times.

It is guaranteed that the majority element always exists.

**Example**

```text
Input:
arr = [3, 2, 3]

Output:
3
```

```text
Input:
arr = [2, 2, 1, 1, 1, 2, 2]

Output:
2
```

---

## 3. Recognition Clues

Ask yourself:

- Need the element with maximum frequency?
    
- Does one element appear more than half the time?
    
- Is constant space expected?
    
- Can different elements cancel each other?
    

If the answers are

```text
Majority element        ✓
Frequency based         ✓
Guaranteed to exist     ✓
```

Think

```text
Boyer-Moore Voting Algorithm
```

---

## 4. Thinking Process

|Approach|Idea|Time|Space|Why Improve?|
|---|---|---|---|---|
|1|Count frequency of every element using nested loops|O(n²)|O(1)|Repeated counting|
|2|Count frequencies using HashMap|O(n) Average|O(n)|Uses extra memory|
|3|Sort the array|O(n log n)|O(1)*|Sorting is unnecessary|
|4|Boyer-Moore Voting Algorithm|O(n)|O(1)|Optimal|

> *Ignoring the sorting algorithm's recursion stack.

---

## 5. Approaches

## Approach 1 — Brute Force

### Idea

For every element,

count its frequency by traversing the entire array.

If frequency becomes greater than `n / 2`,

return that element.

### Algorithm (Pseudocode)

```text
Algorithm MajorityElement(arr)

n ← length(arr)

FOR i ← 0 TO n - 1

    count ← 0

    FOR j ← 0 TO n - 1

        IF arr[i] = arr[j]

            count ← count + 1

        END IF

    END FOR

    IF count > n / 2

        RETURN arr[i]

    END IF

END FOR

End Algorithm
```

### Java Implementation

```java
public static int majorityElement(int[] arr) {

    int n = arr.length;

    // Runs n times
    for (int i = 0; i < n; i++) {

        int count = 0;

        // Runs n times for every i
        // Overall complexity → O(n²)
        for (int j = 0; j < n; j++) {

            if (arr[i] == arr[j]) {
                count++;
            }

        }

        if (count > n / 2) {
            return arr[i];
        }

    }

    return -1;
}
```

### Problems with this Approach

- Repeatedly counts the frequency of the same elements.
    
- Too many unnecessary comparisons.
    
- Time complexity becomes **O(n²)**.
    

**Need a way to store frequencies after counting them once.**

↓

Move to **Approach 2**

---

## Approach 2 — HashMap

### Idea

Store the frequency of every element.

The first element whose frequency becomes greater than `n / 2` is the majority element.

### Algorithm (Pseudocode)

```text
Algorithm MajorityElement(arr)

Create empty HashMap

FOR each element

    Increase its frequency

END FOR

FOR each entry

    IF frequency > n / 2

        RETURN key

    END IF

END FOR

End Algorithm
```

### Java Implementation

```java
public static int majorityElement(int[] arr) {

    Map<Integer, Integer> map = new HashMap<>();

    // Runs n times
    for (int num : arr) {

        // getOrDefault() → Average O(1), Worst O(n)
        // put() → Average O(1), Worst O(n)
        map.put(num, map.getOrDefault(num, 0) + 1);

    }

    // Traverses all unique elements → O(n)
    for (Map.Entry<Integer, Integer> entry : map.entrySet()) {

        if (entry.getValue() > arr.length / 2) {
            return entry.getKey();
        }

    }

    return -1;
}
```

### How this improves the previous approach

- Each element's frequency is computed only once.
    
- Reduces time complexity from **O(n²)** to **O(n)** on average.
    

### Problems with this Approach

- Requires additional memory proportional to the number of unique elements.
    
- Hashing introduces memory and lookup overhead.
    
- Cannot satisfy problems requiring constant extra space.
    

**Need a solution that avoids storing frequencies.**

↓

Move to **Approach 3**

---

## Approach 3 — Sorting

### Idea

Sort the array.

Since the majority element appears more than half the time,

it must occupy the middle position.

### Algorithm (Pseudocode)

```text
Algorithm MajorityElement(arr)

SORT arr

RETURN arr[n / 2]

End Algorithm
```

### Java Implementation

```java
public static int majorityElement(int[] arr) {

    // Arrays.sort()
    // Time → O(n log n)
    // Space → O(log n) (implementation dependent)
    Arrays.sort(arr);

    return arr[arr.length / 2];
}
```

### How this improves the previous approach

- Eliminates the HashMap.
    
- Uses only constant extra memory (excluding sorting stack).
    

### Problems with this Approach

- Sorting dominates the running time.
    
- Rearranges the original array.
    
- There is still a linear-time solution.
    

**Need an algorithm that avoids both hashing and sorting.**

↓

Move to **Approach 4**

---

## Approach 4 — Boyer-Moore Voting Algorithm (Optimal)

### Idea

Maintain

- **candidate** → Possible majority element.
    
- **count** → Vote balance.
    

Rules:

- If `count == 0`, choose the current element as the candidate.
    
- If the current element equals the candidate, increase the count.
    
- Otherwise, decrease the count.
    

Since the majority element appears more than half the time,

all other elements cancel out, leaving the majority element as the final candidate.

### Algorithm (Pseudocode)

```text
Algorithm MajorityElement(arr)

candidate ← 0

count ← 0

FOR each element

    IF count = 0

        candidate ← element

    END IF

    IF element = candidate

        count ← count + 1

    ELSE

        count ← count - 1

    END IF

END FOR

RETURN candidate

End Algorithm
```

### Java Implementation

```java
public static int majorityElement(int[] arr) {

    int candidate = 0;
    int count = 0;

    // Runs n times → O(n)
    for (int num : arr) {

        if (count == 0) {
            candidate = num;
        }

        if (num == candidate) {
            count++;
        } else {
            count--;
        }

    }

    return candidate;
}
```

### How this improves the previous approach

- Eliminates sorting completely.
    
- Requires only two variables.
    
- Achieves **O(n)** time and **O(1)** extra space.
    

### Limitation

- This version works only because the problem guarantees that a majority element exists.
    
- If the guarantee is removed, a second traversal is required to verify that the candidate actually appears more than `n / 2` times.
    

---

## 6. Complexity Analysis

|Approach|Time|Space|
|---|---|---|
|Brute Force|O(n²)|O(1)|
|HashMap|O(n) Average|O(n)|
|Sorting|O(n log n)|O(log n)*|
|Boyer-Moore Voting|O(n)|O(1)|

> *Ignoring implementation-specific recursion stack details.

**Why?**

- **Brute Force:** Every element's frequency is recomputed by scanning the entire array.
    
- **HashMap:** One traversal builds the frequency map and another checks the frequencies.
    
- **Sorting:** Sorting dominates the running time; returning the middle element is constant time.
    
- **Boyer-Moore Voting:** The array is traversed exactly once while maintaining only a candidate and a counter.
    

### Complexity Notes

|Data Structure|Insert|Search|Delete|Overall|
|---|---|---|---|---|
|`HashMap` (Average)|O(1)|O(1)|O(1)|O(n)|
|`HashMap` (Worst)|O(n)|O(n)|O(n)|O(n²)|
|`LinkedHashMap`|O(1) Avg|O(1) Avg|O(1) Avg|O(n)|
|`TreeMap`|O(log n)|O(log n)|O(log n)|O(n log n)|

---

## 7. Key Learnings

- Always inspect the problem guarantees before choosing an algorithm.
    
- A guaranteed majority element allows the use of Boyer-Moore Voting.
    
- Boyer-Moore is based on **pairwise cancellation**, not frequency counting.
    
- If the majority element is **not guaranteed**, verify the candidate with a second traversal.
    

---

## 8. Interview Takeaway

```text
Need majority element?

        │
        ▼

Guaranteed to exist?

        │
        ├── Yes
        │      ▼
        │  Boyer-Moore Voting
        │
        └── No
               ▼

Find Candidate

↓

Verify Frequency
```

---

## Pattern Visualization

Example:

```text
Array

2 2 1 1 1 2 2
```

|Element|Candidate|Count|
|---|---|--:|
|2|2|1|
|2|2|2|
|1|2|1|
|1|2|0|
|1|1|1|
|2|1|0|
|2|2|1|

Final Answer

```text
Candidate = 2
```

---

## Pattern Expansion

```text
Voting / Cancellation Pattern

│
├── Majority Element (> n/2) ✅
├── Majority Element II (> n/3)
├── Boyer-Moore Variants
├── Heavy Hitters
└── Generalized Voting Algorithms
```

### Pattern Insight

The Boyer-Moore Voting Algorithm is based on the idea of **pairwise cancellation**:

```text
Majority Element

vs

Non-Majority Element

↓

Both cancel each other
```

Since the majority element appears **more than half** the time, it can never be completely canceled. After all possible cancellations, the only element that can remain as the final candidate is the majority element. This observation allows the problem to be solved in **linear time** using **constant extra space**.


# Problem 18: Maximum Subarray Sum (Kadane's Algorithm)

## 1. Pattern

- Array Traversal
    
- Running Sum
    
- Dynamic Programming (Kadane's Algorithm)
    

---

## 2. Problem Statement

Given an integer array `arr`, find the **maximum possible sum** of a contiguous subarray.

**Example**

```text
Input:
arr = [-2,1,-3,4,-1,2,1,-5,4]

Output:
6

Explanation:
Subarray = [4,-1,2,1]
```

```text
Input:
arr = [1]

Output:
1
```

```text
Input:
arr = [5,4,-1,7,8]

Output:
23
```

---

## 3. Recognition Clues

Ask yourself:

- Need a contiguous subarray?
    
- Need maximum/minimum sum?
    
- Can previous computation be reused?
    
- Does a negative running sum help future subarrays?
    

If the answers are

```text
Contiguous Subarray      ✓
Maximum Sum              ✓
Reuse Previous Sum       ✓
```

Think

```text
Kadane's Algorithm
```

---

## 4. Thinking Process

|Approach|Idea|Time|Space|Why Improve?|
|---|---|---|---|---|
|1|Generate every subarray and compute its sum|O(n³)|O(1)|Recomputes sums repeatedly|
|2|Generate every subarray using Running Sum|O(n²)|O(1)|Still checks every possible subarray|
|3|Kadane's Algorithm|O(n)|O(1)|Eliminates unnecessary subarrays|

---

## 5. Approaches

## Approach 1 — Brute Force

### Idea

Generate every possible subarray.

For each subarray,

calculate its sum.

Update the maximum sum.

### Algorithm (Pseudocode)

```text
Algorithm MaximumSubarray(arr)

maxSum ← -∞

FOR start ← 0 TO n-1

    FOR end ← start TO n-1

        sum ← 0

        FOR i ← start TO end

            sum ← sum + arr[i]

        END FOR

        maxSum ← MAX(maxSum, sum)

    END FOR

END FOR

RETURN maxSum

End Algorithm
```

### Java Implementation

```java
public static int maximumSubarray(int[] arr) {

    int maxSum = Integer.MIN_VALUE;

    // Runs n times
    for (int start = 0; start < arr.length; start++) {

        // Runs approximately n times
        for (int end = start; end < arr.length; end++) {

            int sum = 0;

            // Recomputes every subarray sum
            // Overall complexity → O(n³)
            for (int i = start; i <= end; i++) {
                sum += arr[i];
            }

            maxSum = Math.max(maxSum, sum);
        }
    }

    return maxSum;
}
```

### Problems with this Approach

- Recalculates the same sums repeatedly.
    
- Three nested traversals.
    
- Too inefficient for large arrays.
    

**Need a way to reuse the previously computed sum.**

↓

Move to **Approach 2**

---

## Approach 2 — Running Sum

### Idea

Fix the starting index.

Instead of recalculating the sum,

keep extending the subarray by adding one element.

### Algorithm (Pseudocode)

```text
Algorithm MaximumSubarray(arr)

maxSum ← -∞

FOR start ← 0 TO n-1

    sum ← 0

    FOR end ← start TO n-1

        sum ← sum + arr[end]

        maxSum ← MAX(maxSum, sum)

    END FOR

END FOR

RETURN maxSum

End Algorithm
```

### Java Implementation

```java
public static int maximumSubarray(int[] arr) {

    int maxSum = Integer.MIN_VALUE;

    // Runs n times
    for (int start = 0; start < arr.length; start++) {

        int sum = 0;

        // Overall complexity → O(n²)
        for (int end = start; end < arr.length; end++) {

            sum += arr[end];

            maxSum = Math.max(maxSum, sum);

        }
    }

    return maxSum;
}
```

### How this improves the previous approach

- Eliminates repeated sum calculations.
    
- Reduces the complexity from **O(n³)** to **O(n²)**.
    

### Problems with this Approach

- Still generates every possible subarray.
    
- Many subarrays are unnecessary because a negative running sum can never improve a future answer.
    

**Need an approach that discards useless subarrays immediately.**

↓

Move to **Approach 3**

---

## Approach 3 — Kadane's Algorithm (Optimal)

### Idea

Maintain

- `currentSum` → Maximum sum ending at the current index.
    
- `maxSum` → Maximum subarray sum found so far.
    

If `currentSum` becomes negative,

discard it and start a new subarray.

### Algorithm (Pseudocode)

```text
Algorithm MaximumSubarray(arr)

currentSum ← 0

maxSum ← -∞

FOR each element

    currentSum ← currentSum + element

    maxSum ← MAX(maxSum, currentSum)

    IF currentSum < 0

        currentSum ← 0

    END IF

END FOR

RETURN maxSum

End Algorithm
```

### Java Implementation

```java
public static int maximumSubarray(int[] arr) {

    int currentSum = 0;
    int maxSum = Integer.MIN_VALUE;

    // Runs exactly n times → O(n)
    for (int num : arr) {

        currentSum += num;

        maxSum = Math.max(maxSum, currentSum);

        if (currentSum < 0) {
            currentSum = 0;
        }

    }

    return maxSum;
}
```

### How this improves the previous approach

- Eliminates the need to generate every subarray.
    
- Discards subarrays that can never contribute to a better answer.
    
- Achieves linear time with constant extra space.
    

### Limitation

- The above implementation assumes at least one element exists.
    
- If the problem also asks for the **actual subarray**, additional variables are required to track the start and end indices.
    

---

## 6. Complexity Analysis

|Approach|Time|Space|
|---|---|---|
|Brute Force|O(n³)|O(1)|
|Running Sum|O(n²)|O(1)|
|Kadane's Algorithm|O(n)|O(1)|

**Why?**

- **Brute Force:** Generates every subarray and recomputes its sum.
    
- **Running Sum:** Reuses the running sum but still examines every possible subarray.
    
- **Kadane's Algorithm:** Traverses the array once while maintaining only two variables.
    

---

## 7. Key Learnings

- Not every subarray is worth considering.
    
- A negative running sum can never increase the sum of a future subarray.
    
- Kadane's Algorithm is an example of dynamic programming where each decision depends only on the previous state.
    
- The algorithm maintains the best subarray ending at the current position.
    

---

## 8. Interview Takeaway

```text
Need maximum contiguous sum?

        │
        ▼

Can previous sum help?

        │
        ▼

If current sum becomes negative

        │
        ▼

Discard it

↓

Start new subarray

↓

Kadane's Algorithm
```

---

## Pattern Visualization

Example

```text
Array

-2   1  -3   4  -1   2   1  -5   4
```

|Element|Current Sum|Maximum Sum|
|---|--:|--:|
|-2|-2 → 0|-2|
|1|1|1|
|-3|-2 → 0|1|
|4|4|4|
|-1|3|4|
|2|5|5|
|1|6|6|
|-5|1|6|
|4|5|6|

Final Answer

```text
Maximum Sum = 6

Subarray

[4, -1, 2, 1]
```

---

## Pattern Expansion

```text
Running State / Kadane Pattern

│
├── Maximum Subarray Sum ✅
├── Maximum Product Subarray
├── Maximum Circular Subarray
├── Best Time to Buy & Sell Stock
├── Maximum Sum Rectangle
└── Dynamic Programming on Arrays
```

### Pattern Insight

Kadane's Algorithm is built on a simple observation:

> **If the running sum becomes negative, keeping it can only reduce the sum of any future subarray.**

Instead of exploring every possible subarray, the algorithm decides at each element whether to:

- **Extend** the current subarray, or
    
- **Start a new subarray** from the current element.
    

This local decision leads to the global optimum in a single traversal, making Kadane's Algorithm one of the most elegant examples of **dynamic programming with state compression**.


# Problem 19: Rearrange Array Elements by Sign

We need to handle **both variants** because the algorithm changes when the number of positive and negative elements is equal versus unequal.

---

## **Part** A — Equal Number of Positive and Negative Elements

## 1. Pattern

- Two Pointers
    
- Array Partitioning
    
- Extra Array
    
- Stable Rearrangement
    

---

## 2. Problem Statement

Given an array containing positive and negative integers, where the number of positive and negative elements is **equal**, rearrange the array so that:

- Positive and negative elements appear alternately.
    
- The relative order of positive elements is preserved.
    
- The relative order of negative elements is preserved.
    
- The first element is positive.
    

**Example**

```text
Input:
arr = [3, 1, -2, -5, 2, -4]

Output:
[3, -2, 1, -5, 2, -4]
```

---

## 3. Recognition Clues

```text
Positive count = Negative count
        +
Need alternating arrangement
        +
Relative order matters
        ↓
Extra Array
```

---

## 4. Thinking Process

|Approach|Idea|Time|Space|Why Improve?|
|---|---|--:|--:|---|
|1|Find the next positive and negative repeatedly|O(n²)|O(1)|Repeated searching|
|2|Store positives and negatives separately|O(n)|O(n)|Extra storage|
|3|Place positives at even indices and negatives at odd indices|O(n)|O(n)|Direct placement; optimal under these constraints|

---

## 5. Approaches

## Approach 1 — Repeated Searching

### Idea

Maintain the next position where a positive or negative element is needed.

Search forward for the required sign and place it.

### Problem with this Approach

Repeatedly searching for the next suitable element can cause **O(n²)** time.

**Need to separate the elements while traversing once.**

↓

Move to **Approach 2**

---

## Approach 2 — Separate Positive and Negative Elements

### Idea

Create two lists:

```text
positive → [3, 1, 2]

negative → [-2, -5, -4]
```

Then alternate between them.

### Algorithm (Pseudocode)

```text
Algorithm RearrangeBySign(arr)

Create positive list
Create negative list

FOR each element in arr

    IF element > 0
        Add element to positive list
    ELSE
        Add element to negative list

FOR i ← 0 TO positive.size - 1

    result[2 × i] ← positive[i]
    result[2 × i + 1] ← negative[i]

RETURN result
```

### Java Implementation

```java
public static int[] rearrangeBySign(int[] arr) {

    List<Integer> positive = new ArrayList<>();
    List<Integer> negative = new ArrayList<>();

    // O(n) traversal
    for (int num : arr) {

        if (num > 0) {
            positive.add(num); // ArrayList.add() → O(1) amortized
        } else {
            negative.add(num); // ArrayList.add() → O(1) amortized
        }
    }

    int[] result = new int[arr.length];

    // Total iterations = n / 2 → O(n)
    for (int i = 0; i < positive.size(); i++) {

        result[2 * i] = positive.get(i);       // ArrayList.get() → O(1)
        result[2 * i + 1] = negative.get(i);   // ArrayList.get() → O(1)
    }

    return result;
}
```

### How this improves the previous approach

- Eliminates repeated searching.
    
- Each element is processed once.
    
- Reduces time complexity from **O(n²)** to **O(n)**.
    

### Problem with this Approach

It requires **O(n) extra space** for the positive and negative collections plus the result.

For this problem, that is generally acceptable because preserving relative order while rearranging makes a simple in-place solution difficult.

---

## Approach 3 — Direct Placement

### Idea

Since the counts are equal and the first element must be positive:

```text
positive → even indices
negative → odd indices
```

Maintain:

```text
positiveIndex = 0
negativeIndex = 1
```

Traverse the original array once and directly place each element.

### Algorithm (Pseudocode)

```text
Algorithm RearrangeBySign(arr)

Create result array

positiveIndex ← 0
negativeIndex ← 1

FOR each element in arr

    IF element > 0

        result[positiveIndex] ← element
        positiveIndex ← positiveIndex + 2

    ELSE

        result[negativeIndex] ← element
        negativeIndex ← negativeIndex + 2

    END IF

END FOR

RETURN result

End Algorithm
```

### Java Implementation

```java
public static int[] rearrangeBySign(int[] arr) {

    int[] result = new int[arr.length];

    int positiveIndex = 0;
    int negativeIndex = 1;

    // Each element is processed exactly once → O(n)
    for (int num : arr) {

        if (num > 0) {

            result[positiveIndex] = num;
            positiveIndex += 2;

        } else {

            result[negativeIndex] = num;
            negativeIndex += 2;
        }
    }

    return result;
}
```

### How this improves the previous approach

- No separate positive and negative lists.
    
- Directly places each element into its final category.
    
- Still maintains relative order.
    
- Uses only the result array as extra space.
    

### Limitation

This approach depends on the **equal-count condition**. If positive and negative counts are unequal, one of the two index sequences will run out of valid positions.

---

## 6. Complexity Analysis

|Approach|Time|Space|
|---|--:|--:|
|Repeated Searching|O(n²)|O(1)|
|Separate Lists|O(n)|O(n)|
|Direct Placement|O(n)|O(n)|

**Why?**

- **Repeated Searching:** Elements may be scanned repeatedly while looking for the next required sign.
    
- **Separate Lists:** The array is traversed once, then the two lists are merged into the result.
    
- **Direct Placement:** Every element is processed exactly once and placed directly at its required index.
    

---

# Part B — Unequal Number of Positive and Negative Elements

Now the problem changes.

Suppose:

```text
arr = [3, 1, -2, -5, 2, 4, 6]
```

There are:

```text
Positive = 5
Negative = 2
```

We can no longer maintain perfect alternation for the entire array.

The usual requirement becomes:

- Alternate positive and negative elements **as long as both types are available**.
    
- Append the remaining elements afterward.
    
- Preserve relative order.
    

---

## 1. Pattern

- Two Pointers / Index Tracking
    
- Stable Rearrangement
    
- Extra Array
    

---

## 2. Problem Statement

Rearrange the array so that positive and negative elements appear alternately for as long as possible.

After one type is exhausted, append the remaining elements.

**Example**

```text
Input:
arr = [3, 1, -2, -5, 2, 4, 6]

Output:
[3, -2, 1, -5, 2, 4, 6]
```

The alternating portion is:

```text
3, -2, 1, -5, 2
```

Remaining positives:

```text
4, 6
```

---

## 3. Thinking Process

|Approach|Idea|Time|Space|Why Improve?|
|---|---|--:|--:|---|
|1|Repeatedly search for opposite signs|O(n²)|O(1)|Repeated scanning|
|2|Store positives and negatives separately|O(n)|O(n)|Extra collections|
|3|Store directly in alternating positions, then append remaining elements|O(n)|O(n)|Linear and simple|

---

## 4. Approach — Separate by Sign + Alternate

### Algorithm (Pseudocode)

```text
Algorithm RearrangeBySign(arr)

Create positive list
Create negative list

FOR each element in arr

    IF element > 0
        Add to positive list
    ELSE
        Add to negative list

posIndex ← 0
negIndex ← 0
resultIndex ← 0

WHILE posIndex < positive.size
       AND negIndex < negative.size

    result[resultIndex] ← positive[posIndex]
    resultIndex ← resultIndex + 1
    posIndex ← posIndex + 1

    result[resultIndex] ← negative[negIndex]
    resultIndex ← resultIndex + 1
    negIndex ← negIndex + 1

END WHILE

WHILE posIndex < positive.size

    result[resultIndex] ← positive[posIndex]

    resultIndex ← resultIndex + 1
    posIndex ← posIndex + 1

END WHILE

WHILE negIndex < negative.size

    result[resultIndex] ← negative[negIndex]

    resultIndex ← resultIndex + 1
    negIndex ← negIndex + 1

END WHILE

RETURN result

End Algorithm
```

### Java Implementation

```java
public static int[] rearrangeBySign(int[] arr) {

    List<Integer> positive = new ArrayList<>();
    List<Integer> negative = new ArrayList<>();

    // O(n)
    for (int num : arr) {

        if (num > 0) {
            positive.add(num); // O(1) amortized
        } else {
            negative.add(num); // O(1) amortized
        }
    }

    int[] result = new int[arr.length];

    int posIndex = 0;
    int negIndex = 0;
    int resultIndex = 0;

    // Runs until one type is exhausted → O(n)
    while (posIndex < positive.size()
            && negIndex < negative.size()) {

        result[resultIndex++] = positive.get(posIndex++);
        result[resultIndex++] = negative.get(negIndex++);
    }

    // Append remaining positives → O(n) total across remaining elements
    while (posIndex < positive.size()) {
        result[resultIndex++] = positive.get(posIndex++);
    }

    // Append remaining negatives
    while (negIndex < negative.size()) {
        result[resultIndex++] = negative.get(negIndex++);
    }

    return result;
}
```

### How this improves the previous approach

The equal-count solution assumes every positive has a corresponding negative position. With unequal counts, that assumption breaks.

This version **alternates only while both types remain**, then appends whichever type is left.

### Problem with this Approach

It still requires **O(n) extra space**.

A truly in-place stable rearrangement is considerably more complicated and generally isn't the expected solution for this standard problem.

---

## 5. Complexity Analysis

|Approach|Time|Space|
|---|--:|--:|
|Repeated Searching|O(n²)|O(1)|
|Separate + Alternate|O(n)|O(n)|

**Why?**

- The input is traversed once to separate signs.
    
- Each positive and negative element is then copied exactly once into the result.
    
- Therefore total work is **O(n)**.
    
- The positive/negative collections and result array require **O(n)** additional space.
    

---

## 6. Equal vs Unequal Counts

|Condition|Strategy|
|---|---|
|Equal positive/negative count|Alternate through the entire array|
|Unequal positive/negative count|Alternate until one type ends, then append the remaining elements|
|Relative order required|Use extra space|
|In-place required|Requires a more complex rearrangement strategy|

---

## 7. Interview Takeaway

```text
Rearrange by Sign

        │
        ▼
Are positive and negative counts equal?

   ├── Yes
   │     ↓
   │  Positive → even indices
   │  Negative → odd indices
   │
   └── No
         ↓
      Alternate while both exist
         ↓
      Append remaining elements
```

### Pattern Insight

The important distinction is **not simply equal vs unequal counts**. It is whether the problem requires **perfect alternation** or only **alternation as far as possible**. Once the counts become unequal, the correct strategy is to alternate until one category is exhausted and then append the remaining category while preserving its relative order.






