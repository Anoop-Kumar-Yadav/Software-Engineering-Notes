![[Screenshot from 2026-08-12 09-02-05.png]]

```java
class Solution {

	static void subSequence(List<Integer> list, int[] arr, int idx) {

		if (idx >= arr.length) {
			System.out.println(list);
			return;
		}

		list.add(arr[idx]);
		subSequence(list, arr, idx + 1);

		list.remove(list.size() - 1);
		subSequence(list, arr, idx + 1);

		return;

	}
}
```
