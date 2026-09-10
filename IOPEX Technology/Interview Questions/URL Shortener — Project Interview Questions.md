

I would prepare these in **5 levels**.

## Level 1 — Basic Project Questions

These are almost guaranteed if the interviewer starts with your project.

1. Tell me about your URL Shortener project.
    
2. What problem does Route.io solve?
    
3. Why did you choose to build a URL shortener?
    
4. What are the main features of your project?
    
5. What technologies did you use?
    
6. Why did you choose Node.js for this project?
    
7. Why did you choose Express.js?
    
8. What database did you use and why?
    
9. What was your contribution to the project?
    
10. Explain the overall architecture.
    
11. Explain the complete flow when a user creates a short URL.
    
12. Explain the complete flow when a user accesses a short URL.
    
13. What are the main API endpoints?
    
14. What was the most difficult part of the project?
    
15. What did you learn while building it?
    

---

# Level 2 — Implementation Questions

Once you explain the basic architecture, the interviewer will start asking **"how?"**

16. How do you generate the short URL?
    
17. How do you generate the short code?
    
18. How do you make sure the short code is unique?
    
19. What happens if two users get the same short code?
    
20. Why didn't you simply use the database ID?
    
21. Why did you choose your particular short-code generation algorithm?
    
22. How long is the generated code?
    
23. How many possible combinations can your algorithm generate?
    
24. What happens when the generated code already exists?
    
25. How do you validate the original URL?
    
26. Where does validation happen?
    
27. How do you handle invalid URLs?
    
28. How do you handle a short code that doesn't exist?
    
29. What HTTP status code do you return when a URL is successfully created?
    
30. What HTTP status code do you return when a shortened URL is not found?
    
31. What HTTP status code do you use for the redirect?
    
32. Why did you choose that redirect status code?
    
33. How do you handle errors in your backend?
    
34. Do you have centralized error handling?
    
35. How is your project folder structure organized?
    

---

# Level 3 — Database Deep Dive

This is where the interviewer can test whether you **actually understand the backend you built**.

36. Show me your database schema.
    
37. What fields are stored for each URL?
    
38. Why did you choose those fields?
    
39. What is the primary key?
    
40. Is the short code unique?
    
41. Is the short code indexed?
    
42. Why do you need an index on the short code?
    
43. What happens internally when you search for a short code?
    
44. What is the time complexity of the lookup?
    
45. What happens if you have 10 million URLs?
    
46. Would your current lookup still be efficient?
    
47. What indexes would you add?
    
48. What are the disadvantages of adding too many indexes?
    
49. How would you find duplicate URLs?
    
50. How would you delete expired URLs?
    
51. How would you store click analytics?
    
52. Would you store analytics in the same table/collection?
    
53. How would you optimize a slow URL lookup?
    
54. What happens if the database goes down?
    
55. How does your application handle database connection failures?
    

---

# Level 4 — Backend / Node.js Deep Dive

Now the interviewer moves from **your project implementation → your backend knowledge**.

56. Why is Node.js suitable for a URL shortener?
    
57. Explain the Node.js event loop.
    
58. Is Node.js single-threaded?
    
59. What happens while Node.js is waiting for the database?
    
60. Is database I/O blocking?
    
61. What happens if you execute CPU-intensive work inside your request handler?
    
62. How does Express process an incoming request?
    
63. What is middleware?
    
64. How does `next()` work?
    
65. How does your authentication middleware work?
    
66. How do you validate request data?
    
67. How do you handle asynchronous errors?
    
68. How do you handle uncaught errors?
    
69. How would you gracefully shut down your server?
    
70. What happens if your server loses the database connection while processing a request?
    
71. How would you handle thousands of simultaneous URL creation requests?
    

---

# Level 5 — Production / System Design

This is where a good interviewer can turn your simple URL shortener into a **backend-system-design interview**.

72. Your URL shortener currently handles 100 requests/second. How would you scale it to 10,000?
    
73. What would be the first bottleneck?
    
74. How would you scale your Node.js application?
    
75. Can you run multiple instances of your backend?
    
76. How would you distribute requests between them?
    
77. What is a load balancer?
    
78. Would your backend be stateful or stateless?
    
79. How would Redis improve your system?
    
80. What would you store in Redis?
    
81. What would happen on a cache hit?
    
82. What would happen on a cache miss?
    
83. What happens if Redis goes down?
    
84. How would you prevent stale cached URLs?
    
85. What happens if your database becomes the bottleneck?
    
86. Would you use read replicas?
    
87. Would you consider database sharding?
    
88. How would you handle 100 million shortened URLs?
    
89. How would you handle millions of redirects per second?
    
90. How would you collect analytics without slowing down redirects?
    
91. Would you use a message queue?
    
92. What happens if one backend instance crashes?
    
93. What happens if the database crashes?
    
94. How would you monitor your service?
    
95. What metrics would you monitor?
    

---

# The Interviewer Can Also Attack Your Decisions

Be ready for **"Why?" questions**:

96. Why Node.js instead of Python/FastAPI?
    
97. Why Express instead of another framework?
    
98. Why your chosen database instead of PostgreSQL?
    
99. Why not MongoDB?
    
100. Why not use Redis as the primary database?
    
101. Why did you choose your short-code generation strategy?
    
102. Why not use UUID?
    
103. Why not use an auto-incrementing ID?
    
104. Why did you choose your particular HTTP status codes?
    
105. Why did you structure the project this way?
    
106. Why did you separate controller and service logic?
    
107. Why do you need middleware?
    
108. Why do you need an index?
    
109. Why not create indexes on every field?
    
110. Why did you choose JWT/session-based authentication?
    
111. Why not make the project microservices?
    

---

# The Most Dangerous Follow-Up Chain

This is the kind of chain you should practice **out loud**.

### Interviewer:

> How do you generate the short URL?

You answer.

> How do you guarantee that it's unique?

You answer.

> What happens if two requests generate the same code at exactly the same time?

You answer.

> Why isn't checking the database before insertion enough?

You answer.

> How would you solve that race condition?

You answer.

> What if you have 1 billion URLs?

You answer.

> How would you scale the database?

You answer.

> What if redirects become much more frequent than URL creation?

You answer.

> What would you cache?

You answer.

> What happens if Redis goes down?

You answer.

> How would you make analytics asynchronous?

You answer.

> What architecture would you use for 100 million daily redirects?

**That entire conversation can originate from one sentence on your resume: "Built a URL Shortener."**

---

# Your Highest-Priority 20

If you have limited placement time, master these **first**:

1. **Explain your URL Shortener architecture.**
    
2. **Explain the complete URL creation flow.**
    
3. **Explain the redirect flow.**
    
4. **How do you generate the short code?**
    
5. **How do you guarantee uniqueness?**
    
6. **What happens during a collision?**
    
7. **Explain your database schema.**
    
8. **Why did you choose your database?**
    
9. **Why is the short code indexed?**
    
10. **What happens when the short code doesn't exist?**
    
11. **How do you validate URLs?**
    
12. **How do you handle errors?**
    
13. **Why Node.js?**
    
14. **Explain the event loop in relation to your project.**
    
15. **How would you handle 10,000 concurrent requests?**
    
16. **How would Redis improve the project?**
    
17. **How would you scale the database?**
    
18. **How would you prevent abuse/rate-limit the service?**
    
19. **What was the hardest technical problem you faced?**
    
20. **What would you change if you had to make Route.io production-ready?**
    

## One Important Rule

For **every technology you mention on your Route.io resume**, prepare these four questions:

> **What is it? → Why did you use it? → How did you use it? → What would happen if you removed/replaced it?**

If you can answer those four for **Node.js, Express, database, authentication, Redis, Docker, TypeScript, WebSockets, etc.**, you will be much harder to corner during the project round.

The next useful step is to turn these into a **mock project interview**: I ask one question at a time exactly like an interviewer, you answer verbally/in text, and I evaluate your answer for **technical correctness, depth, and interview English**.