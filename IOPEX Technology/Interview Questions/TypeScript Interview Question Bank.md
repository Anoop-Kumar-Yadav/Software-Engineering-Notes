
## Question Bank Structure

|Priority|Area|Questions|
|---|---|--:|
|🔴 Must Know|TypeScript Fundamentals|20|
|🔴 Must Know|Types & Type System|25|
|🔴 Must Know|Functions & Objects|20|
|🔴 Must Know|Interfaces & Type Aliases|15|
|🔴 Must Know|Union, Intersection & Narrowing|15|
|🔴 Must Know|Generics|15|
|🟠 Important|Classes & OOP|15|
|🟠 Important|Utility Types|15|
|🟠 Important|Modules & Configuration|15|
|🔴 Must Know|TypeScript + JavaScript/Node.js|15|
|🟠 Important|Advanced TypeScript|15|
|🔴 Must Know|Coding / Practical Problems|15|
|🔴 Must Know|Tricky / Output Questions|10|
||**Total**|**210**|

---

# Part 1 — TypeScript Fundamentals

1. What is TypeScript?
    
2. Why was TypeScript created?
    
3. What are the advantages of TypeScript over JavaScript?
    
4. Is TypeScript a programming language or a superset of JavaScript?
    
5. Is TypeScript compiled or interpreted?
    
6. How does TypeScript code execute?
    
7. What happens when TypeScript is compiled?
    
8. Does TypeScript run directly in the browser?
    
9. What is the TypeScript compiler?
    
10. What is `tsc`?
    
11. What is static typing?
    
12. Static typing vs dynamic typing?
    
13. TypeScript vs JavaScript?
    
14. Can TypeScript code contain JavaScript code?
    
15. Can every JavaScript program be used as TypeScript?
    
16. What is type inference?
    
17. What is explicit type annotation?
    
18. What is type safety?
    
19. What are the limitations of TypeScript?
    
20. Does TypeScript provide type safety at runtime?
    

---

# Part 2 — TypeScript Types

### Primitive Types

21. What are the primitive types in TypeScript?
    
22. How do you declare a string variable?
    
23. How do you declare a number variable?
    
24. How do you declare a boolean variable?
    
25. What is the difference between `null` and `undefined`?
    
26. What is the `void` type?
    
27. What is the `never` type?
    
28. What is the `unknown` type?
    
29. What is the `any` type?
    
30. What is the difference between `any` and `unknown`?
    

### Special Types

31. What is `unknown` and when should you use it?
    
32. What is `never` used for?
    
33. What is the difference between `void` and `never`?
    
34. What does `object` mean in TypeScript?
    
35. What is the difference between `Object`, `object`, and `{}`?
    
36. What is a tuple?
    
37. How is a tuple different from an array?
    
38. What is an enum?
    
39. What are numeric enums?
    
40. What are string enums?
    

### Arrays and Tuples

41. How do you define an array type?
    
42. What is the difference between `string[]` and `Array<string>`?
    
43. How do you define a tuple?
    
44. Can tuples contain different types?
    
45. Can tuples have optional elements?
    
46. What are readonly arrays?
    
47. What is a readonly tuple?
    
48. When should you use a tuple instead of an array?
    

---

# Part 3 — Functions

49. How do you type a function in TypeScript?
    
50. How do you specify parameter types?
    
51. How do you specify a return type?
    
52. What happens if you don't specify a function's return type?
    
53. What are optional parameters?
    
54. How do you define default parameters?
    
55. What are rest parameters?
    
56. How do you type rest parameters?
    
57. What are function types?
    
58. How do you define a callback type?
    
59. What is a function signature?
    
60. What is a call signature?
    
61. What is a construct signature?
    
62. How do you type an arrow function?
    
63. How do you type an asynchronous function?
    
64. What type does an `async` function return?
    
65. How do you type a Promise?
    
66. What is function overload?
    
67. How does function overloading work in TypeScript?
    
68. What is the difference between overload signatures and implementation signatures?
    

---

# Part 4 — Interfaces & Type Aliases

69. What is an interface?
    
70. How do you define an interface?
    
71. What is a type alias?
    
72. Interface vs type alias?
    
73. When should you use an interface?
    
74. When should you use a type alias?
    
75. Can an interface extend another interface?
    
76. Can a type alias be extended?
    
77. What is interface inheritance?
    
78. What is declaration merging?
    
79. Can interfaces define optional properties?
    
80. What does `readonly` mean inside an interface?
    
81. How do you define a method inside an interface?
    
82. Can interfaces describe function types?
    
83. Can interfaces describe arrays?
    
84. Can a class implement multiple interfaces?
    

---

# Part 5 — Union, Intersection & Type Narrowing

85. What is a union type?
    
86. How do you define a union type?
    
87. What is an intersection type?
    
88. Union vs intersection?
    
89. What is type narrowing?
    
90. Why is type narrowing important?
    
91. How does `typeof` narrowing work?
    
92. How does `instanceof` narrowing work?
    
93. How does the `in` operator help with narrowing?
    
94. What is a type predicate?
    
95. What is a user-defined type guard?
    
96. What is discriminated union?
    
97. How do discriminated unions work?
    
98. What is exhaustive checking?
    
99. How can `never` help with exhaustive checking?
    

---

# Part 6 — Type Assertions

100. What is a type assertion?
    
101. What is the difference between type assertion and type casting?
    
102. How does `as` work?
    
103. What is angle-bracket syntax for type assertions?
    
104. Why can't angle-bracket assertions be used inside JSX?
    
105. When should you use type assertions?
    
106. Why can excessive type assertions be dangerous?
    
107. What is non-null assertion?
    
108. What does the `!` operator mean in TypeScript?
    
109. When should you avoid non-null assertions?
    

---

# Part 7 — Generics

This is a **high-value interview topic**.

110. What are generics?
    
111. Why do we need generics?
    
112. What problem do generics solve?
    
113. How do you create a generic function?
    
114. How do you create a generic interface?
    
115. How do you create a generic type?
    
116. What is a generic constraint?
    
117. What does `extends` mean in a generic constraint?
    
118. How do you restrict a generic to a particular structure?
    
119. What are multiple generic parameters?
    
120. What are generic default types?
    
121. How do generics preserve type information?
    
122. Generics vs `any`?
    
123. Generics vs union types?
    
124. Can classes use generics?
    

---

# Part 8 — Classes & OOP

125. How do you define a class in TypeScript?
    
126. What are access modifiers?
    
127. What is `public`?
    
128. What is `private`?
    
129. What is `protected`?
    
130. What is the difference between TypeScript `private` and JavaScript `#private`?
    
131. What is `readonly` in a class?
    
132. What is a constructor?
    
133. What are parameter properties?
    
134. What is inheritance?
    
135. What is method overriding?
    
136. What does `abstract` mean?
    
137. What is an abstract class?
    
138. Abstract class vs interface?
    
139. Can a class implement multiple interfaces?
    

---

# Part 9 — Utility Types

These are frequently useful in **real backend TypeScript code**.

140. What are utility types?
    
141. What does `Partial<T>` do?
    
142. What does `Required<T>` do?
    
143. What does `Readonly<T>` do?
    
144. What does `Pick<T, K>` do?
    
145. What does `Omit<T, K>` do?
    
146. What does `Record<K, T>` do?
    
147. What does `Exclude<T, U>` do?
    
148. What does `Extract<T, U>` do?
    
149. What does `NonNullable<T>` do?
    
150. What does `ReturnType<T>` do?
    
151. What does `Parameters<T>` do?
    
152. What does `Awaited<T>` do?
    
153. What does `InstanceType<T>` do?
    
154. How would you create your own utility type?
    

---

# Part 10 — Modules & TypeScript Configuration

155. What is a module in TypeScript?
    
156. What is the difference between named and default exports?
    
157. How does TypeScript handle imports?
    
158. What is `tsconfig.json`?
    
159. Why is `tsconfig.json` important?
    
160. What does `target` mean?
    
161. What does `module` mean?
    
162. What does `strict` mean?
    
163. What is `strictNullChecks`?
    
164. What is `noImplicitAny`?
    
165. What is `esModuleInterop`?
    
166. What is `moduleResolution`?
    
167. What are `include` and `exclude`?
    
168. What is `rootDir`?
    
169. What is `outDir`?
    

---

# Part 11 — TypeScript + JavaScript + Node.js

This should receive **extra attention for your backend interviews**.

170. Does TypeScript exist at runtime?
    
171. Are TypeScript types available after compilation?
    
172. What is type erasure?
    
173. Can TypeScript prevent runtime errors?
    
174. Why do we still need runtime validation?
    
175. TypeScript types vs Zod schemas?
    
176. How do you type an Express request?
    
177. How do you type an Express response?
    
178. How do you type middleware?
    
179. How do you type environment variables?
    
180. How do you type `process.env`?
    
181. How do you type a MongoDB document?
    
182. How do you type an API response?
    
183. How do you create reusable API response types?
    
184. How do you type asynchronous service functions?
    

---

# Part 12 — Advanced TypeScript

185. What are mapped types?
    
186. How do mapped types work?
    
187. What are conditional types?
    
188. What is the `infer` keyword?
    
189. What are template literal types?
    
190. What are recursive types?
    
191. What are index signatures?
    
192. What are indexed access types?
    
193. What is `keyof`?
    
194. What is `typeof` in a type position?
    
195. What is `ReturnType` internally based on?
    
196. What is structural typing?
    
197. Structural typing vs nominal typing?
    
198. What is excess property checking?
    
199. What is covariance and contravariance?
    
200. What is variance in TypeScript?
    

---

# Part 13 — Practical TypeScript Coding

201. Create a type-safe function that returns the first element of an array.
    
202. Write a generic function to reverse an array.
    
203. Create a generic API response type.
    
204. Create a type for a user containing optional properties.
    
205. Create a type for an authentication response.
    
206. Create a type-safe dictionary using `Record`.
    
207. Create a function that accepts only specific string values.
    
208. Create a type guard for two different object shapes.
    
209. Create a discriminated union for API success/error responses.
    
210. Create a reusable generic pagination type.
    
211. Create a utility type that makes selected properties optional.
    
212. Create a utility type that removes selected properties.
    
213. Type a function that accepts different parameter types using overloads.
    
214. Type an asynchronous function returning a user.
    
215. Create a strongly typed configuration object.
    

---

# Part 14 — Tricky TypeScript Questions

216. What is the difference between `any`, `unknown`, and `never`?
    
217. Why is `unknown` safer than `any`?
    
218. Why does TypeScript allow assigning a more specific object to a broader type?
    
219. Why can TypeScript sometimes allow extra properties and sometimes reject them?
    
220. What happens to interfaces after compilation?
    
221. What happens to type aliases after compilation?
    
222. Can you check a TypeScript interface using `instanceof` at runtime?
    
223. Why can't you use `typeof User` to check whether an object satisfies an interface?
    
224. Why doesn't TypeScript guarantee that data received from an API matches an interface?
    
225. What happens when `strictNullChecks` is disabled?
    

---

# Priority for Your Backend Interview

For **your Node.js/backend profile**, I would rank the topics like this:

### Tier 1 — Master

You should be able to explain these without hesitation:

- Type inference
    
- `any` vs `unknown` vs `never`
    
- Interfaces vs type aliases
    
- Union/intersection types
    
- Type narrowing
    
- Type guards
    
- Generics
    
- Function typing
    
- Optional properties
    
- `readonly`
    
- Type assertions
    
- `keyof`
    
- Utility types
    
- `Partial`, `Pick`, `Omit`, `Record`
    
- Classes and access modifiers
    
- `tsconfig`
    
- `strict` mode
    
- TypeScript vs JavaScript
    
- Type erasure
    
- Runtime validation vs compile-time types
    

### Tier 2 — Strongly Recommended

- Mapped types
    
- Conditional types
    
- `infer`
    
- Template literal types
    
- Function overloads
    
- Discriminated unions
    
- Structural typing
    
- Declaration merging
    
- `ReturnType`
    
- `Parameters`
    
- `Awaited`
    

### Tier 3 — Don't Overinvest Initially

- Extremely complex recursive types
    
- Compiler API
    
- Custom transformers
    
- Deep type-level programming
    
- Rare variance edge cases
    

Those are useful for advanced TypeScript engineering, but **unlikely to provide the best return during a fresher placement interview**.

## The Best Sequence for You

Since you're already working with Node.js and TypeScript, I'd study it in this order:

```text
1. JavaScript fundamentals
        ↓
2. TypeScript fundamentals
        ↓
3. Types + interfaces + type aliases
        ↓
4. Union/intersection + narrowing
        ↓
5. Generics
        ↓
6. Utility types
        ↓
7. Classes + OOP
        ↓
8. tsconfig + modules
        ↓
9. TypeScript + Node.js
        ↓
10. Advanced types
        ↓
11. Coding questions
        ↓
12. Tricky/output questions
        ↓
13. Mock interview
```

**One important distinction:** don't learn TypeScript as a completely separate language from JavaScript. In an interview, a strong answer often connects the two: _JavaScript provides the runtime behavior, while TypeScript adds static type checking during development and compilation._

For your placement preparation, I would therefore treat **JavaScript → TypeScript → Node.js** as one connected interview track rather than three isolated subjects.