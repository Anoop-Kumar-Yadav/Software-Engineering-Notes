

## Part 1 — OOP Fundamentals

1. What is Object-Oriented Programming?
    
2. Why do we use OOP?
    
3. What are the main principles of OOP?
    
4. What is a class?
    
5. What is an object?
    
6. What is the difference between a class and an object?
    
7. What is the difference between an object and a variable?
    
8. What is the state of an object?
    
9. What is the behavior of an object?
    
10. What is the identity of an object?
    
11. What are the four pillars of OOP?
    
12. What are the advantages of OOP?
    
13. What are the disadvantages of OOP?
    
14. OOP vs procedural programming?
    
15. When should you use OOP?
    
16. Can a program be written without OOP?
    
17. What is message passing between objects?
    
18. What is object interaction?
    
19. What is object instantiation?
    
20. What is the lifecycle of an object?
    

---

# Part 2 — Encapsulation

21. What is encapsulation?
    
22. Why is encapsulation important?
    
23. How is encapsulation achieved?
    
24. What is data hiding?
    
25. Encapsulation vs data hiding?
    
26. Why should fields often be private?
    
27. What are getters and setters?
    
28. What are the advantages of getters and setters?
    
29. Can encapsulation exist without getters and setters?
    
30. Give a real-world example of encapsulation.
    
31. How does Java implement encapsulation?
    
32. How does TypeScript implement encapsulation?
    
33. How does Python implement encapsulation?
    
34. How does JavaScript implement encapsulation?
    

### Common Follow-up

> **Why not make all variables public?**

You should be able to explain that exposing internal state directly makes it harder to enforce **validation, invariants, and controlled modification**.

---

# Part 3 — Abstraction

35. What is abstraction?
    
36. Why do we need abstraction?
    
37. Abstraction vs encapsulation?
    
38. How can abstraction be achieved?
    
39. What is an abstract class?
    
40. What is an abstract method?
    
41. What is an interface?
    
42. Abstract class vs interface?
    
43. Can an abstract class have concrete methods?
    
44. Can an abstract class have a constructor?
    
45. Can we create an object of an abstract class?
    
46. Can an interface contain implementation?
    
47. Give a real-world example of abstraction.
    
48. How is abstraction implemented in Java?
    
49. How is abstraction implemented in TypeScript?
    

---

# Part 4 — Inheritance

50. What is inheritance?
    
51. Why is inheritance used?
    
52. What are the types of inheritance?
    
53. What is single inheritance?
    
54. What is multilevel inheritance?
    
55. What is hierarchical inheritance?
    
56. What is multiple inheritance?
    
57. What is hybrid inheritance?
    
58. What is the difference between inheritance and composition?
    
59. What is an IS-A relationship?
    
60. What is a HAS-A relationship?
    
61. What is the parent/base/superclass?
    
62. What is the child/derived/subclass?
    
63. What are the advantages of inheritance?
    
64. What are the disadvantages of inheritance?
    
65. What is method overriding?
    
66. Can private members be inherited?
    
67. What is the `super` keyword?
    
68. What happens when a child class overrides a parent method?
    
69. What is constructor inheritance?
    
70. Why can excessive inheritance become a design problem?
    

---

# Part 5 — Polymorphism

71. What is polymorphism?
    
72. What does polymorphism literally mean?
    
73. What are the types of polymorphism?
    
74. What is compile-time polymorphism?
    
75. What is runtime polymorphism?
    
76. What is method overloading?
    
77. What is method overriding?
    
78. Overloading vs overriding?
    
79. Can constructors be overloaded?
    
80. Can methods be overloaded?
    
81. What is dynamic method dispatch?
    
82. What is late binding?
    
83. What is early binding?
    
84. What is static binding?
    
85. Give a real-world example of polymorphism.
    
86. How does Java implement runtime polymorphism?
    
87. Does JavaScript support traditional method overloading?
    
88. How can polymorphism be achieved in TypeScript?
    

---

# Part 6 — Constructors & Destructors

89. What is a constructor?
    
90. Why do we need constructors?
    
91. When is a constructor called?
    
92. What is a default constructor?
    
93. What is a parameterized constructor?
    
94. Can constructors be overloaded?
    
95. Can a constructor return a value?
    
96. What is constructor chaining?
    
97. What is the role of `super()`?
    
98. What is a destructor?
    
99. Why does Java not have traditional destructors?
    
100. How is object cleanup handled in garbage-collected languages?
    

---

# Part 7 — Access Modifiers

101. What are access modifiers?
    
102. What is `public`?
    
103. What is `private`?
    
104. What is `protected`?
    
105. Public vs private vs protected?
    
106. Why do we use private members?
    
107. Can a subclass access private members of its parent?
    
108. Can a subclass access protected members?
    
109. What is package/default access in Java?
    
110. How do access modifiers support encapsulation?
    

---

# Part 8 — Relationships Between Objects

111. What is association?
    
112. What is aggregation?
    
113. What is composition?
    
114. Association vs aggregation?
    
115. Aggregation vs composition?
    
116. What is a HAS-A relationship?
    
117. What is an IS-A relationship?
    
118. Give an example of composition.
    
119. Give an example of aggregation.
    
120. Why is composition often preferred over inheritance?
    
121. What is dependency between classes?
    

### Very Important Interview Question

> **Inheritance vs Composition — which is better?**

The expected answer is not simply "composition is better." You should explain that **composition is often preferred when the relationship represents reusable behavior or collaboration rather than a genuine subtype relationship**.

---

# Part 9 — Static, Final & Related Concepts

122. What is a static variable?
    
123. What is a static method?
    
124. What is a static class?
    
125. Static method vs instance method?
    
126. Can a static method access instance variables?
    
127. What is the `final` keyword?
    
128. What is a final variable?
    
129. What is a final method?
    
130. What is a final class?
    
131. Can a final class be inherited?
    
132. What is an immutable object?
    
133. Mutable vs immutable objects?
    
134. Why is immutability useful?
    

---

# Part 10 — Important Design Concepts

135. What is coupling?
    
136. What is cohesion?
    
137. High coupling vs low coupling?
    
138. High cohesion vs low cohesion?
    
139. Why should software have low coupling?
    
140. Why should software have high cohesion?
    
141. What is the SOLID principle?
    
142. What is the Single Responsibility Principle?
    
143. What is the Open/Closed Principle?
    
144. What is the Liskov Substitution Principle?
    
145. What is the Interface Segregation Principle?
    
146. What is the Dependency Inversion Principle?
    
147. What is dependency injection?
    
148. Why is dependency injection useful?
    
149. What is tight coupling?
    
150. What is loose coupling?
    

For a fresher interview, **SOLID basics are worth knowing**, but don't spend excessive time memorizing formal definitions. Be able to explain each principle with a small example.

---

# Part 11 — Scenario-Based Questions

These are often more valuable than direct definitions.

151. Design a `Vehicle` class hierarchy. How would you model `Car`, `Bike`, and `Truck`?
    
152. When would you choose inheritance over composition?
    
153. How would you design a payment system supporting multiple payment methods?
    
154. How would you design a notification system supporting email, SMS, and push notifications?
    
155. How would you design a logging system?
    
156. How would you prevent users from directly modifying sensitive object state?
    
157. How would you design a database connection class?
    
158. How would you make a class immutable?
    
159. How would you replace a large `if-else` chain using polymorphism?
    
160. How would you design a system where different objects implement the same operation differently?
    

---

# Part 12 — Tricky OOP Questions

161. Can you achieve polymorphism without inheritance?
    
162. Can you achieve abstraction without an abstract class?
    
163. Can an object exist without a class?
    
164. Is every class an object?
    
165. Is every object an instance of a class?
    
166. Can a class inherit from itself?
    
167. Can a class have multiple parents?
    
168. Can a constructor be inherited?
    
169. Can a private method be overridden?
    
170. Can a static method be overridden?
    
171. Can an abstract class have non-abstract methods?
    
172. Can an interface be instantiated?
    
173. Why is multiple inheritance problematic in some languages?
    
174. What is the diamond problem?
    
175. What is method hiding?
    
176. What is dynamic dispatch?
    
177. What is the difference between compile-time and runtime binding?
    
178. Can polymorphism increase complexity?
    
179. Can inheritance break encapsulation?
    
180. Why can deep inheritance hierarchies become difficult to maintain?
    

---

# The 20 Questions I'd Prioritize for Your Placement

If you have limited time, master these first:

1. What is OOP?
    
2. What are the four pillars of OOP?
    
3. Class vs object
    
4. Encapsulation
    
5. Abstraction
    
6. Encapsulation vs abstraction
    
7. Inheritance
    
8. Types of inheritance
    
9. Polymorphism
    
10. Compile-time vs runtime polymorphism
    
11. Overloading vs overriding
    
12. Constructor
    
13. Access modifiers
    
14. Interface vs abstract class
    
15. IS-A vs HAS-A
    
16. Association vs aggregation vs composition
    
17. Inheritance vs composition
    
18. Coupling vs cohesion
    
19. SOLID principles
    
20. Explain OOP using a real-world/project example
    

## One Important Point for Your Interviews

Since you're preparing **JavaScript, TypeScript, Node.js, C, and Python**, don't memorize OOP as if it behaves identically in every language.

The **concepts are language-independent**, but the implementation differs:

|Concept|Java|C++|Python|JavaScript / TypeScript|
|---|---|---|---|---|
|Class|Yes|Yes|Yes|Yes|
|Encapsulation|Strong|Strong|Convention-based|Classes/closures/private fields|
|Inheritance|Class-based|Class-based|Class-based|Prototype-based underneath|
|Polymorphism|Strong|Strong|Duck typing|Dynamic/prototype-based|
|Interfaces|Yes|Abstract classes/patterns|Protocols/ABCs|TypeScript interfaces|
|Abstract class|Yes|Yes|ABC|TypeScript|
|Method overloading|Yes|Yes|Not traditional|Not traditional|
|Garbage collection|Yes|No|Yes|Yes|

For **your interviews**, the most important conceptual connection is:

**OOP concept → Java implementation → JavaScript/TypeScript implementation → real backend example.**

For example, if asked _"What is polymorphism?"_, you should be able to explain the concept first and then say how you would use it in a Node.js backend, such as having different payment providers implement the same `processPayment()` contract. That demonstrates considerably more understanding than a textbook definition.