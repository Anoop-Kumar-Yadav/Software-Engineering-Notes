
## 1. What real interviews are actually asking

A 2025/2026 sample of candidate reports shows recurring areas:

- **JavaScript fundamentals and output questions**
    
- **Node.js internals and async programming**
    
- Express/middleware/API design
    
- Authentication/JWT
    
- HTTP/networking
    
- SQL and database design
    
- MongoDB
    
- DSA/coding
    
- Project architecture and implementation decisions
    
- Caching/Redis
    
- System design/scalability
    
- Security
    
- Debugging and scenario-based questions
    

For example, one recent backend interview report describes a technical round that moved from authentication into **system design and then low-level design**, followed by vanilla JavaScript logic/regex questions. ([Reddit](https://www.reddit.com/r/Btechtards/comments/1qbpivk/just_had_the_worst_technical_interview_of_my_life/?utm_source=chatgpt.com "Just had the worst technical interview of my life and I'm feeling completely lost")) Another fresher MERN interview included **CORS, Express middleware, `next()`, JavaScript output questions, and a coding task**, followed by a JWT refresh-token scenario. ([Reddit](https://www.reddit.com/r/developersIndia/comments/1lfdf1p?utm_source=chatgpt.com "Got Surprised in My Full Stack Interview (MERN + Java) — Sharing Questions & Lessons"))

A 2025 Node.js backend interview report from Naukri's interview database lists preparation around **NodeJS, MySQL, MongoDB and REST APIs**, while another 0–2 YOE Node.js interview focused on Node.js concepts. ([Naukri](https://www.naukri.com/code360/interview-experiences/jarvis-invest/jarvis-invest-interview-experience-by-kuldeep-hada-may-2025-exp-0-2-years?utm_source=chatgpt.com "Jarvis Invest Interview Experience by Kuldeep Hada | May 2025 (Exp. 0-2 Years) - Naukri Code 360"))

---

# 2. Real questions reported for Node.js/backend roles

I'm separating these from generic questions so you know what has actually appeared in candidate reports.

### JavaScript

Reported questions include:

1. What is hoisting?
    
2. What is `Promise.all()`?
    
3. Explain Promises.
    
4. Explain `async/await`.
    
5. JavaScript output-based questions.
    
6. Explain inheritance in JavaScript.
    
7. How does prototype chaining work?
    
8. Implement string manipulation without built-in methods.
    
9. Explain regular expressions.
    
10. Explain JavaScript concurrency.
    

A Cognizant Node.js backend report specifically lists **Node.js, middleware, and `Promise.all()`** among questions asked. ([AmbitionBox](https://www.ambitionbox.com/interviews/cognizant-interview-questions/node-js-backend-developer?utm_source=chatgpt.com "5 Cognizant Node Js Backend Developer Interview Questions & Answers 2025 | AmbitionBox"))

---

# 3. Node.js

These are repeatedly appearing:

11. What is Node.js?
    
12. How does Node.js work?
    
13. Explain Node.js architecture.
    
14. Why is Node.js single-threaded?
    
15. What is the event loop?
    
16. How does non-blocking I/O work?
    
17. What happens when Node.js performs an I/O operation?
    
18. What is the difference between synchronous and asynchronous code?
    
19. What are callbacks?
    
20. What are Promises?
    
21. What is `async/await`?
    
22. What is middleware?
    
23. What are different types of Express middleware?
    
24. How does `next()` work?
    
25. How do you handle errors in Express?
    
26. How do you upload files using Node.js?
    
27. How do you handle multiple asynchronous operations?
    
28. How do you prevent blocking the event loop?
    
29. How would you handle thousands of concurrent requests?
    
30. What happens when CPU-heavy code runs inside Node.js?
    

A Birlasoft candidate reported being asked **how Node.js works**, while another report specifically lists **Node.js architecture and JavaScript fundamentals**. ([Naukri](https://www.naukri.com/code360/interview-experiences/birlasoft-ltd/birlasoft-ltd-interview-experience-node-js-backend-developer-oct-2021-exp-0-2-years-1221?utm_source=chatgpt.com "Node Js Backend Developer Birlasoft Ltd. interview experience | Anonymous - Naukri Code 360"))

---

# 4. REST/API questions

This is particularly important for your profile.

31. What is REST?
    
32. What makes an API RESTful?
    
33. GET vs POST?
    
34. PUT vs PATCH?
    
35. What HTTP status code would you return for different failures?
    
36. How would you design a CRUD API?
    
37. How do you validate request data?
    
38. How do you handle API errors?
    
39. How do you implement pagination?
    
40. Offset vs cursor pagination?
    
41. How do you implement filtering?
    
42. How do you implement sorting?
    
43. How do you version an API?
    
44. How do you secure an API?
    
45. How do you rate-limit an API?
    
46. How do you handle file uploads?
    
47. How do you handle API timeouts?
    
48. How do you aggregate data from multiple APIs?
    
49. How would you test an API?
    
50. How would you design an API for an e-commerce system?
    

One real backend interview report explicitly asked candidates to **design a service that fetches and aggregates data from five different APIs**, alongside HTTP caching and REST questions. ([Glassdoor](https://www.glassdoor.co.in/Interview/Jumbo-NodeJS-Backend-Developer-Interview-Questions-EI_IE987318.0%2C5_KO6%2C30.htm?utm_source=chatgpt.com "Jumbo NodeJS Backend Developer Interview Questions | Glassdoor"))

---

# 5. Authentication & Security

This area appears much more often in real backend interviews than generic question banks suggest.

51. Authentication vs authorization?
    
52. How does JWT authentication work?
    
53. What is inside a JWT?
    
54. Access token vs refresh token?
    
55. Where should tokens be stored?
    
56. How do you invalidate a JWT?
    
57. How do you implement refresh tokens?
    
58. What happens if two browser tabs simultaneously request token refresh?
    
59. What is CORS?
    
60. Why does CORS affect browsers but not Postman?
    
61. What is CSRF?
    
62. What is XSS?
    
63. What is SQL injection?
    
64. How do parameterized queries prevent SQL injection?
    
65. How would you secure an API?
    
66. How would you implement rate limiting?
    
67. How should passwords be stored?
    
68. Why should passwords be hashed rather than encrypted?
    

The fresher MERN experience I found specifically included **CORS**, JWT, and a multi-tab refresh-token scenario. ([Reddit](https://www.reddit.com/r/developersIndia/comments/1lfdf1p?utm_source=chatgpt.com "Got Surprised in My Full Stack Interview (MERN + Java) — Sharing Questions & Lessons"))

Another reported Node.js interview involved giving the candidate a SQL query and asking **what was wrong with it and how an attacker could exploit it**. ([Glassdoor](https://www.glassdoor.co.in/Interview/node-js-backend-developer-interview-questions-SRCH_KO0%2C25.htm?utm_source=chatgpt.com "Node Js Backend Developer Interview Questions | Glassdoor"))

---

# 6. SQL/DBMS — Real Backend Questions

This is where you should take your previous DBMS preparation seriously.

69. SQL vs NoSQL?
    
70. When would you choose SQL over MongoDB?
    
71. When would you choose MongoDB?
    
72. What is normalization?
    
73. Explain 1NF, 2NF and 3NF.
    
74. What is a primary key?
    
75. What is a foreign key?
    
76. What is indexing?
    
77. How does an index work internally?
    
78. What is a B+ tree?
    
79. When should you create an index?
    
80. When can an index hurt performance?
    
81. How do you optimize a slow query?
    
82. What is a transaction?
    
83. Explain ACID.
    
84. What are isolation levels?
    
85. What is a database lock?
    
86. What is connection pooling?
    
87. What is database sharding?
    
88. What is database partitioning?
    
89. Horizontal vs vertical scaling?
    
90. How would you scale a database?
    

A 2025 fresher/full-stack interview report included **database indexing, B+ trees, SQL queries, normalization, SQL vs NoSQL, and database scaling** in the same interview. ([Reddit](https://www.reddit.com/r/developersIndia/comments/1lfdf1p?utm_source=chatgpt.com "Got Surprised in My Full Stack Interview (MERN + Java) — Sharing Questions & Lessons"))

A recent backend-engineer experience also reported questions around **SQL vs NoSQL, Redis, CAP theorem, sharding vs partitioning, B+ tree indexing, microservices vs monolith, and latency metrics**. ([Reddit](https://www.reddit.com/r/leetcode/comments/1sbo0x5/recently_interviewed_for_backend_engineer_role/?utm_source=chatgpt.com "Recently Interviewed for Backend Engineer role (Golang) 0 YOE. Still in college (about to graduate in 2 months)"))

---

# 7. MongoDB

For a Node.js/MERN profile:

91. What is MongoDB?
    
92. MongoDB vs PostgreSQL?
    
93. Document vs collection?
    
94. Embedding vs referencing?
    
95. When would you embed documents?
    
96. When would you reference documents?
    
97. What is an index in MongoDB?
    
98. What is the aggregation pipeline?
    
99. What is `$match`?
    
100. What is `$lookup`?
    
101. How do you optimize a MongoDB query?
    
102. What is a MongoDB transaction?
    
103. What is Mongoose?
    
104. What is a Mongoose schema?
    
105. What are Mongoose middleware/hooks?
    

A real Node.js interview experience specifically mentions **MongoDB basics and aggregation** alongside Node.js and SQL preparation. ([Naukri](https://www.naukri.com/code360/interview-experiences/incrute-technologies/interview-experience-by-rahul-tripathi-jan-2023-exp-0-2-years?utm_source=chatgpt.com "Node Js Backend Developer INCRUTE TECHNOLOGIES interview experience | Rahul Tripathi - Naukri Code 360"))

---

# 8. Redis / Caching

This is increasingly relevant in backend interviews.

106. What is Redis?
    
107. Why is Redis fast?
    
108. What does "in-memory" mean?
    
109. Redis vs database?
    
110. When should you use Redis?
    
111. What is caching?
    
112. What is cache-aside?
    
113. What is cache invalidation?
    
114. What happens when cached data becomes stale?
    
115. What is TTL?
    
116. How would you cache an API response?
    
117. How would you implement rate limiting using Redis?
    
118. What happens if Redis goes down?
    

Redis was explicitly part of a recent 0-YOE backend interview discussion, together with database scaling and system design. ([Reddit](https://www.reddit.com/r/leetcode/comments/1sbo0x5/recently_interviewed_for_backend_engineer_role/?utm_source=chatgpt.com "Recently Interviewed for Backend Engineer role (Golang) 0 YOE. Still in college (about to graduate in 2 months)"))

---

# 9. Computer Networks — For Backend

This is **especially important for your iOPEX preparation**.

119. Explain the OSI model.
    
120. Explain the TCP/IP model.
    
121. TCP vs UDP?
    
122. What is TCP's three-way handshake?
    
123. What is an IP address?
    
124. What is a private IP?
    
125. What is a public IP?
    
126. What is subnetting?
    
127. What is a port?
    
128. What is a socket?
    
129. What is DNS?
    
130. Explain DNS resolution.
    
131. What happens when you enter a URL?
    
132. HTTP vs HTTPS?
    
133. What happens during TLS handshake?
    
134. HTTP/1.1 vs HTTP/2?
    
135. What is WebSocket?
    
136. WebSocket vs HTTP?
    
137. What is a reverse proxy?
    
138. What is a load balancer?
    

And **this isn't just generic advice for iOPEX**.

Recent iOPEX candidate reports specifically mention **OSI/networking concepts, IPs and subnetting**, and one Software Engineer report mentions **query optimization and system scaling**. ([Glassdoor](https://www.glassdoor.com/Interview/iOPEX-Technologies-Interview-Questions-E513397.htm?utm_source=chatgpt.com "iOPEX Technologies Interview Experience & Questions (2026) | Glassdoor"))

Indeed's iOPEX Q&A also reports that candidates were asked **networking and scenario-based management/incident questions**. ([Indeed](https://in.indeed.com/cmp/Iopex-Technologies?campaignid=mobvjcmp&fromjk=1cdaaa3c425be403&utm_source=chatgpt.com "iOPEX Technologies Careers and Employment | Indeed.com"))

---

# 10. System Design / Backend Architecture

For a fresher, you probably won't get Google-level distributed systems design. But **basic architecture questions are clearly appearing**, even at relatively modest experience levels.

139. Monolith vs microservices?
    
140. When would you choose microservices?
    
141. When should you NOT use microservices?
    
142. How would you scale a Node.js application?
    
143. How does load balancing work?
    
144. How would you handle 10,000 concurrent users?
    
145. How would you design a URL shortener?
    
146. How would you design a URL shortening service's database?
    
147. How would you prevent duplicate short URLs?
    
148. How would you implement rate limiting?
    
149. How would you design a notification system?
    
150. How would you design an e-commerce order system?
    
151. How would you design a restaurant table-booking system?
    
152. How would you design an API gateway?
    
153. How would you handle a failing downstream service?
    
154. How would you handle retries?
    
155. What is a message queue?
    
156. When would you use RabbitMQ/Kafka?
    
157. What is eventual consistency?
    
158. How would you monitor a backend service?
    

A recent Glassdoor report for a Node.js backend role mentions a **restaurant table-booking system design** question. ([Glassdoor](https://www.glassdoor.co.in/Interview/nodejs-backend-developer-interview-questions-SRCH_KO0%2C24.htm?utm_source=chatgpt.com "Nodejs backend developer Interview Questions | Glassdoor"))

---

# 11. Coding — Don't Ignore This

Real backend interviews aren't necessarily "only backend."

Candidates have reported:

159. Spiral matrix
    
160. Array manipulation
    
161. Linked-list problems
    
162. String manipulation without built-in methods
    
163. Sorting words without built-in sorting
    
164. HashMap implementation/explanation
    
165. Linked list vs array
    
166. Basic recursion
    
167. Searching
    
168. Basic SQL coding
    

For example, Glassdoor reports a Node.js backend candidate being asked to implement **spiral matrix traversal**, while another reported a string/word-sorting task. ([Glassdoor](https://www.glassdoor.co.in/Interview/nodejs-backend-developer-interview-questions-SRCH_KO0%2C24.htm?utm_source=chatgpt.com "Nodejs backend developer Interview Questions | Glassdoor"))

---

# 12. What I Would Actually Put in _Your_ Question Bank

After comparing these real reports, I would **not** use the earlier generic 250-question banks as your primary preparation.

I'd create this hierarchy:

## Tier 1 — Absolutely Master

### JavaScript

- Closures
    
- Scope
    
- Hoisting
    
- `this`
    
- Prototypes
    
- Promises
    
- `async/await`
    
- `Promise.all`
    
- Event loop
    
- Output-based questions
    
- Array/object/string manipulation
    

### Node.js

- Node architecture
    
- Event loop
    
- Non-blocking I/O
    
- libuv
    
- Streams
    
- Buffers
    
- EventEmitter
    
- Error handling
    
- Middleware
    
- Express request lifecycle
    
- Authentication middleware
    

### Backend/API

- REST
    
- HTTP methods
    
- Status codes
    
- Headers
    
- API validation
    
- Pagination
    
- Error handling
    
- Authentication
    
- Authorization
    
- JWT
    
- Refresh tokens
    
- CORS
    
- Rate limiting
    

### Database

- SQL joins
    
- `GROUP BY`
    
- `HAVING`
    
- Subqueries
    
- Window functions
    
- Indexes
    
- B+ trees
    
- Normalization
    
- Transactions
    
- ACID
    
- Isolation
    
- SQL injection
    
- MongoDB aggregation
    
- SQL vs NoSQL
    

### Networking

- OSI
    
- TCP/IP
    
- TCP vs UDP
    
- TCP handshake
    
- IP
    
- Ports
    
- DNS
    
- HTTP
    
- HTTPS
    
- TLS
    
- WebSocket
    
- Reverse proxy
    

---

# 13. Tier 2 — Very Likely Follow-Ups

Then prepare:

- Redis
    
- Caching
    
- Connection pooling
    
- Docker
    
- Load balancing
    
- Database scaling
    
- Sharding
    
- Partitioning
    
- CAP theorem
    
- Message queues
    
- Microservices vs monolith
    
- Logging
    
- Monitoring
    
- API testing
    
- CI/CD basics
    

---

# 14. Tier 3 — Your Resume Becomes the Interview

This is **the most important finding for you**.

Real interview reports repeatedly show that candidates get questioned on **whatever they claim to know**. One Marmeto candidate explicitly said the interviewer asked about **basic JS, Node.js and Kafka, usually what you mention in your resume**. ([AmbitionBox](https://www.ambitionbox.com/interviews/marmeto-interview-questions/node-js-backend-developer?utm_source=chatgpt.com "2 Marmeto Node Js Backend Developer Interview Questions & Answers | Complete Prep Guide 2025 | AmbitionBox")) Cognizant's interview guidance likewise says to study the CV in detail and know the technologies listed on it. ([AmbitionBox](https://www.ambitionbox.com/interviews/cognizant-interview-questions/node-js-backend-developer?utm_source=chatgpt.com "5 Cognizant Node Js Backend Developer Interview Questions & Answers 2025 | AmbitionBox"))

So if your resume says:

```text
Node.js
Express.js
MongoDB
PostgreSQL
Redis
Docker
REST APIs
JWT
WebSockets
TypeScript
```

the interviewer has every right to jump from:

> "What is Redis?"

to:

> "Why did you use Redis?"

to:

> "What data did you cache?"

to:

> "What's your invalidation strategy?"

to:

> "What happens if Redis goes down?"

That is the **real interview pattern**.

---

# 15. Your URL Shortener Is Especially Important

You previously identified your **URL Shortener project** as the project you want to discuss in interviews.

That means you should expect questions like:

1. Explain your URL shortener architecture.
    
2. Why did you choose this database?
    
3. How do you generate the short URL?
    
4. How do you guarantee uniqueness?
    
5. What happens when two users generate the same short code?
    
6. What is the database schema?
    
7. What indexes did you create?
    
8. How do you resolve a short URL?
    
9. How would you handle 1 million redirects?
    
10. How would you cache frequently accessed URLs?
    
11. Where would Redis fit?
    
12. How would you rate-limit URL creation?
    
13. How would you prevent abuse?
    
14. How would you track analytics?
    
15. How would you scale the service?
    
16. What happens if the database goes down?
    
17. How would you deploy it?
    
18. How would you monitor it?
    
19. How would you test it?
    
20. What would you change if you had another month?
    

**This is much more important than memorizing another 100 generic Node.js questions.**

---

# 16. What the Real Data Says About Your iOPEX Preparation

There is a particularly useful signal here.

Recent iOPEX reports show:

- **Communication round**
    
- **Technical fundamentals**
    
- **Networking**
    
- **Project/internship discussion**
    
- **Troubleshooting/scenario questions**
    
- Some **SQL/query optimization and system scaling**
    
- Programming fundamentals depending on the role
    

For example, a July 2026 iOPEX Trainee Engineer report says the first round tested communication and the technical round covered **basic networking**, specifically OSI. ([Glassdoor](https://www.glassdoor.com/Interview/iOPEX-Technologies-Interview-Questions-E513397.htm?utm_source=chatgpt.com "iOPEX Technologies Interview Experience & Questions (2026) | Glassdoor")) A February 2026 Software Engineer report mentions **query optimization and system scaling**. ([Glassdoor](https://www.glassdoor.com/Interview/iOPEX-Technologies-Senior-Software-Developer-Interview-Questions-EI_IE513397.0%2C18_KO19%2C44.htm?utm_source=chatgpt.com "iOPEX Technologies Interview Experience & Questions (2026) | Glassdoor"))

So for **your particular campus target**, I would _not_ prepare as though you are interviewing for a pure startup Node.js role.

I'd prepare:

```text
                    iOPEX
                      │
       ┌──────────────┼──────────────┐
       ↓              ↓              ↓
    Core CS        Backend         Project
       │              │              │
   CN / DBMS      JS / Node      URL Shortener
   OOP / OS       Express        Architecture
       │           REST/JWT       Database
       │           Security       Scaling
       └──────────────┬──────────────┘
                      ↓
                 Communication
                      ↓
             Explain everything
                 out loud
```

And this aligns extremely well with what you've been building: **JavaScript → Node.js → DBMS/SQL → Computer Networks → OOP → project → DSA**.

### Bottom line

**Yes, I would now change your question-bank strategy.** Instead of collecting generic questions from websites, we should build your bank from **real candidate-reported questions + your resume + the specific iOPEX role**, and mark every question as **Must Know / Follow-up / Advanced**.

That will give you a much more realistic technical-round preparation set than a generic "Top 100 Backend Interview Questions" list. ([mortit.com](https://mortit.com/blog/backend-developer-interview-questions?utm_source=chatgpt.com "Backend Developer Interview Questions: 40+ Questions with Answers (2026)"))

I can also keep checking for new interview reports and update the bank as fresh experiences appear.