
For your **backend-engineer profile**, DBMS and SQL should be treated as **two connected but different skills**:

- **DBMS:** how databases work — transactions, indexing, normalization, concurrency, storage, ACID, locking.
    
- **SQL:** how you actually retrieve, modify, aggregate, and analyze data.
    

For placements, I would prioritize **SQL query patterns + DBMS fundamentals + practical backend database concepts** over obscure database theory.

## Question Bank Structure

|Priority|Area|Questions|
|---|---|--:|
|🔴 Must Know|DBMS Fundamentals|20|
|🔴 Must Know|Keys & Constraints|15|
|🔴 Must Know|Normalization|15|
|🔴 Must Know|SQL Fundamentals|20|
|🔴 Must Know|Joins|20|
|🔴 Must Know|Aggregation & Subqueries|20|
|🔴 Must Know|SQL Advanced|20|
|🔴 Must Know|Transactions & ACID|20|
|🔴 Must Know|Indexing & Query Performance|20|
|🟠 Important|Concurrency & Isolation|15|
|🟠 Important|Database Design|15|
|🔴 Must Know|Backend Database Questions|15|
|🔴 Must Know|SQL Coding Problems|30|
|🟠 Important|Tricky SQL Questions|15|
||**Total**|**260**|

---

# Part 1 — DBMS Fundamentals

1. What is a database?
    
2. What is a DBMS?
    
3. Why do we need a DBMS?
    
4. DBMS vs file system?
    
5. What are the advantages of a DBMS?
    
6. What are the disadvantages of a DBMS?
    
7. What is an RDBMS?
    
8. DBMS vs RDBMS?
    
9. What is a relational database?
    
10. What is a relation?
    
11. What is a table?
    
12. What is a row/tuple?
    
13. What is a column/attribute?
    
14. What is a schema?
    
15. What is a database instance?
    
16. Schema vs instance?
    
17. What is data independence?
    
18. What is logical data independence?
    
19. What is physical data independence?
    
20. What is a database management system architecture?
    

---

# Part 2 — Keys & Constraints

21. What is a key in DBMS?
    
22. What is a primary key?
    
23. What is a foreign key?
    
24. What is a candidate key?
    
25. What is a super key?
    
26. What is an alternate key?
    
27. What is a composite key?
    
28. Primary key vs unique key?
    
29. Can a table have multiple candidate keys?
    
30. Can a table have multiple primary keys?
    
31. Can a primary key contain `NULL`?
    
32. Can a foreign key contain `NULL`?
    
33. What is referential integrity?
    
34. What is a `UNIQUE` constraint?
    
35. What is a `CHECK` constraint?
    

---

# Part 3 — Normalization

This is a **very common DBMS interview area**.

36. What is normalization?
    
37. Why do we normalize databases?
    
38. What is data redundancy?
    
39. What are update anomalies?
    
40. What is an insertion anomaly?
    
41. What is a deletion anomaly?
    
42. What is a modification/update anomaly?
    
43. What is First Normal Form?
    
44. What is Second Normal Form?
    
45. What is Third Normal Form?
    
46. What is BCNF?
    
47. 2NF vs 3NF?
    
48. 3NF vs BCNF?
    
49. What is functional dependency?
    
50. What is partial dependency?
    

### You should be able to recognize:

```text
Unnormalized
     ↓
1NF
     ↓
2NF
     ↓
3NF
     ↓
BCNF
```

But don't merely memorize the definitions. Be able to take a small table and **identify the dependency causing the violation**.

---

# Part 4 — SQL Fundamentals

51. What is SQL?
    
52. What are the different categories of SQL commands?
    
53. What is DDL?
    
54. What is DML?
    
55. What is DQL?
    
56. What is DCL?
    
57. What is TCL?
    
58. What does `CREATE` do?
    
59. What does `ALTER` do?
    
60. What does `DROP` do?
    
61. What does `TRUNCATE` do?
    
62. What does `INSERT` do?
    
63. What does `UPDATE` do?
    
64. What does `DELETE` do?
    
65. What does `SELECT` do?
    
66. What does `GRANT` do?
    
67. What does `REVOKE` do?
    
68. What does `COMMIT` do?
    
69. What does `ROLLBACK` do?
    
70. What does `SAVEPOINT` do?
    

---

# Part 5 — SQL Filtering & Ordering

71. How do you use `WHERE`?
    
72. What is the difference between `WHERE` and `HAVING`?
    
73. What are comparison operators?
    
74. What are logical operators?
    
75. What does `BETWEEN` do?
    
76. What does `IN` do?
    
77. What does `LIKE` do?
    
78. What are SQL wildcards?
    
79. How do you check for `NULL`?
    
80. Why can't you use `= NULL`?
    
81. What does `ORDER BY` do?
    
82. How do you sort in ascending order?
    
83. How do you sort in descending order?
    
84. Can you sort by multiple columns?
    
85. What does `DISTINCT` do?
    

---

# Part 6 — SQL Joins

**Extremely important for placement coding rounds.**

86. What is a join?
    
87. Why are joins needed?
    
88. What is an inner join?
    
89. What is a left join?
    
90. What is a right join?
    
91. What is a full outer join?
    
92. What is a cross join?
    
93. What is a self join?
    
94. Inner join vs left join?
    
95. Left join vs right join?
    
96. What is a Cartesian product?
    
97. What happens when a join condition is missing?
    
98. How do you join three tables?
    
99. How do you find records that exist in one table but not another?
    
100. How do you find employees who don't have a department?
    

### The mental model

```text
INNER JOIN → matching rows

LEFT JOIN  → everything from left
             + matching right rows

RIGHT JOIN → everything from right
             + matching left rows

FULL JOIN  → everything from both sides
```

---

# Part 7 — Aggregation

101. What is an aggregate function?
    
102. What does `COUNT()` do?
    
103. What does `SUM()` do?
    
104. What does `AVG()` do?
    
105. What does `MIN()` do?
    
106. What does `MAX()` do?
    
107. What is `GROUP BY`?
    
108. Why is `GROUP BY` used?
    
109. What is `HAVING`?
    
110. `WHERE` vs `HAVING`?
    
111. Can `WHERE` contain aggregate functions?
    
112. Can `HAVING` be used without `GROUP BY`?
    
113. How do you count employees per department?
    
114. How do you find departments having more than five employees?
    
115. How do you find the average salary by department?
    

---

# Part 8 — Subqueries

116. What is a subquery?
    
117. Where can subqueries be used?
    
118. What is a scalar subquery?
    
119. What is a correlated subquery?
    
120. Correlated vs non-correlated subquery?
    
121. What does `EXISTS` do?
    
122. `EXISTS` vs `IN`?
    
123. What does `NOT EXISTS` do?
    
124. How do you find employees earning more than the average salary?
    
125. How do you find the second-highest salary?
    
126. How do you find employees with the maximum salary?
    
127. How do you find duplicate records using a subquery?
    
128. Can a subquery return multiple rows?
    
129. Can a subquery return multiple columns?
    
130. Subquery vs join?
    

---

# Part 9 — SQL Advanced

131. What is a CTE?
    
132. What is the `WITH` clause?
    
133. CTE vs subquery?
    
134. What is a recursive CTE?
    
135. What is a window function?
    
136. Why are window functions useful?
    
137. What is `ROW_NUMBER()`?
    
138. What is `RANK()`?
    
139. What is `DENSE_RANK()`?
    
140. `RANK()` vs `DENSE_RANK()`?
    
141. What is `PARTITION BY`?
    
142. `GROUP BY` vs `PARTITION BY`?
    
143. What is `LAG()`?
    
144. What is `LEAD()`?
    
145. How do you find the second-highest salary using a window function?
    
146. How do you find the top 3 employees per department?
    
147. How do you find duplicate records using window functions?
    
148. How do you calculate a running total?
    
149. How do you find the previous row's value?
    
150. How do you find the difference between the current and previous row?
    

---

# Part 10 — Transactions & ACID

**Critical DBMS theory for backend engineers.**

151. What is a transaction?
    
152. Why do we need transactions?
    
153. What are ACID properties?
    
154. What is atomicity?
    
155. What is consistency?
    
156. What is isolation?
    
157. What is durability?
    
158. Give a real-world example of a transaction.
    
159. What is `COMMIT`?
    
160. What is `ROLLBACK`?
    
161. What is a savepoint?
    
162. What happens if a transaction fails halfway?
    
163. Why is atomicity important for money transfers?
    
164. What is transaction isolation?
    
165. What are isolation levels?
    

### The core idea

```text
Atomicity   → all or nothing
Consistency → valid state → valid state
Isolation   → concurrent transactions don't improperly interfere
Durability  → committed data survives failure
```

---

# Part 11 — Concurrency & Isolation

166. What is concurrency in databases?
    
167. What is a dirty read?
    
168. What is a non-repeatable read?
    
169. What is a phantom read?
    
170. What is a lost update?
    
171. What are isolation levels?
    
172. What is Read Uncommitted?
    
173. What is Read Committed?
    
174. What is Repeatable Read?
    
175. What is Serializable?
    
176. Which isolation level provides the strongest isolation?
    
177. Isolation vs performance tradeoff?
    
178. What is a database lock?
    
179. What is pessimistic locking?
    
180. What is optimistic locking?
    

For interviews, understand **the problems first**, then the isolation levels that prevent them.

---

# Part 12 — Indexing

This is **very important for backend/system-design interviews**.

181. What is an index?
    
182. Why are indexes used?
    
183. How does an index improve query performance?
    
184. What data structure is commonly used for database indexes?
    
185. What is a B-tree?
    
186. What is a B+ tree?
    
187. Why are indexes commonly implemented using B-trees/B+ trees?
    
188. What is a clustered index?
    
189. What is a non-clustered index?
    
190. Clustered vs non-clustered index?
    
191. What is a composite index?
    
192. What is a covering index?
    
193. What is a unique index?
    
194. What is a partial/filtered index?
    
195. What is index selectivity?
    
196. What are the disadvantages of indexes?
    
197. Why can too many indexes be harmful?
    
198. What happens to indexes during `INSERT`/`UPDATE`?
    
199. How do you decide which columns to index?
    
200. What is a query execution plan?
    

---

# Part 13 — Database Design

201. How do you design a relational database?
    
202. What is entity-relationship modeling?
    
203. What is an entity?
    
204. What is an attribute?
    
205. What is a relationship?
    
206. What is an ER diagram?
    
207. What is one-to-one relationship?
    
208. What is one-to-many relationship?
    
209. What is many-to-many relationship?
    
210. How do you represent many-to-many relationships in SQL?
    
211. What is a junction/join table?
    
212. Normalization vs denormalization?
    
213. When would you denormalize a database?
    
214. What are database constraints?
    
215. What makes a good database schema?
    

---

# Part 14 — Backend Database Questions

These are **particularly relevant to your resume**.

216. SQL vs NoSQL?
    
217. When would you choose PostgreSQL/MySQL over MongoDB?
    
218. When would you choose MongoDB over a relational database?
    
219. What is connection pooling?
    
220. Why should backend applications use connection pools?
    
221. What happens if the database connection pool is exhausted?
    
222. What is a database transaction in a backend API?
    
223. How would you implement a money transfer safely?
    
224. How do you prevent SQL injection?
    
225. What are parameterized queries?
    
226. Why should you avoid string concatenation for SQL queries?
    
227. What is ORM?
    
228. ORM vs raw SQL?
    
229. What are the advantages of an ORM?
    
230. What are the disadvantages of an ORM?
    

---

# Part 15 — SQL Coding Questions

These are the **questions you should actually practice writing**.

### Basic

231. Find all employees with salary greater than 50,000.
    
232. Find employees belonging to a particular department.
    
233. Find employees whose names start with `A`.
    
234. Find employees whose salary is between two values.
    
235. Find all distinct department IDs.
    
236. Sort employees by salary.
    
237. Find the highest salary.
    
238. Find the lowest salary.
    
239. Count the number of employees.
    
240. Find the average salary.
    

### Grouping

241. Find the number of employees in each department.
    
242. Find the average salary in each department.
    
243. Find the department with the highest average salary.
    
244. Find departments having more than five employees.
    
245. Find the maximum salary in each department.
    

### Joins

246. Join employees with departments.
    
247. Find employees who don't belong to any department.
    
248. Find departments with no employees.
    
249. Find employees and their manager names.
    
250. Find customers who have never placed an order.
    

### Subqueries

251. Find the second-highest salary.
    
252. Find the third-highest salary.
    
253. Find employees earning more than the average salary.
    
254. Find employees with the maximum salary.
    
255. Find duplicate records.
    

### Window Functions

256. Find the top 3 salaries in each department.
    
257. Rank employees by salary.
    
258. Find the second-highest salary in each department.
    
259. Calculate a running total.
    
260. Find the previous transaction amount for each user.
    

---

# Part 16 — Tricky SQL Questions

261. `WHERE` vs `HAVING`?
    
262. `DELETE` vs `TRUNCATE` vs `DROP`?
    
263. `UNION` vs `UNION ALL`?
    
264. `JOIN` vs subquery?
    
265. `COUNT(*)` vs `COUNT(column)`?
    
266. What happens when `NULL` participates in a comparison?
    
267. Why doesn't `WHERE column = NULL` work?
    
268. What happens when a `LEFT JOIN` condition is placed in `WHERE` instead of `ON`?
    
269. What happens when a join produces duplicate rows?
    
270. Why can `DISTINCT` hide a query problem?
    
271. `RANK()` vs `DENSE_RANK()` vs `ROW_NUMBER()`?
    
272. `GROUP BY` vs window functions?
    
273. Why can an index make writes slower?
    
274. Why might a query ignore an index?
    
275. Why can `SELECT *` be problematic in production?
    

---

# The 30 Questions I Would Prioritize for Your Placement

If you have limited time, master these first:

### DBMS

1. DBMS vs RDBMS
    
2. Primary key vs foreign key
    
3. Candidate key vs super key
    
4. Normalization
    
5. 1NF, 2NF, 3NF
    
6. Functional dependency
    
7. ACID properties
    
8. Transactions
    
9. Isolation levels
    
10. Dirty/non-repeatable/phantom reads
    
11. Indexing
    
12. B-tree/B+ tree
    
13. Clustered vs non-clustered index
    
14. Composite index
    
15. Normalization vs denormalization
    

### SQL

16. `SELECT` + `WHERE`
    
17. `GROUP BY`
    
18. `HAVING`
    
19. Joins
    
20. Inner vs left join
    
21. Subqueries
    
22. `EXISTS` vs `IN`
    
23. CTEs
    
24. Window functions
    
25. `ROW_NUMBER` vs `RANK` vs `DENSE_RANK`
    
26. Second-highest salary
    
27. Top N per group
    
28. Duplicate records
    
29. `DELETE` vs `TRUNCATE` vs `DROP`
    
30. SQL injection + parameterized queries
    

---

# What Matters Most for Your Backend Resume

For a **Node.js backend engineer**, I'd organize your database knowledge around this request lifecycle:

```text
HTTP Request
     ↓
Node.js / Express
     ↓
Service Layer
     ↓
Repository / ORM
     ↓
Connection Pool
     ↓
SQL Query
     ↓
Query Planner
     ↓
Index
     ↓
Database
     ↓
Transaction / Lock
     ↓
Result
     ↓
API Response
```

You should understand what happens at **each stage**.

For example, if an interviewer asks:

> **"Your API has become slow. How would you investigate the database side?"**

A strong backend answer should naturally mention **slow query analysis → execution plan → indexes → joins → filtering → connection pool → locks/contention → transaction duration**, rather than simply saying "I will add an index."

## Your SQL Practice Pattern

Since you're specifically preparing for **campus placement coding/MCQ rounds**, learn SQL by **pattern family**, not chapter order:

```text
SELECT + WHERE
      ↓
ORDER BY
      ↓
GROUP BY + HAVING
      ↓
JOINS
      ↓
SUBQUERIES
      ↓
EXISTS / NOT EXISTS
      ↓
CTEs
      ↓
WINDOW FUNCTIONS
      ↓
Complex multi-table problems
```

And for your backend interview, add:

```text
Transactions
    ↓
ACID
    ↓
Isolation
    ↓
Locks
    ↓
Indexes
    ↓
Query Optimization
    ↓
Connection Pooling
    ↓
SQL Injection
    ↓
ORM vs Raw SQL
```

**This is the DBMS/SQL scope I would actually target for your backend-engineer resume.** You do not need to become a DBA; you need to demonstrate that you can **design sensible schemas, write competent SQL, reason about query performance, and safely use databases from backend services**.