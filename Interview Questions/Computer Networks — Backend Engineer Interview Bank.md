

## Priority Structure

|Priority|Area|Questions|Importance|
|---|---|--:|---|
|🔴|Networking Fundamentals|10|High|
|🔴|OSI & TCP/IP|10|High|
|🔴|IP, Ports, Routing, NAT|15|Very High|
|🔴|TCP & UDP|20|Very High|
|🔴|DNS|10|Very High|
|🔴|HTTP/HTTPS|20|**Critical**|
|🔴|WebSockets|8|**Critical for Node.js**|
|🟠|Network Security|10|High|
|🟠|Backend Scenarios|15|**Critical**|
||**Total**|**118**||

---

# 1. Networking Fundamentals

1. What is a computer network?
    
2. What is a protocol?
    
3. What is an IP address?
    
4. What is a MAC address?
    
5. What is a port?
    
6. What is the difference between an IP address and a port?
    
7. What is bandwidth?
    
8. What is latency?
    
9. What is throughput?
    
10. What is packet loss?
    

### Must understand

For backend development, you should be comfortable with:

**IP = which machine/network**

**Port = which application/service on that machine**

For example:

```text
192.168.1.10:3000
       │       │
       │       └── Node.js application
       └────────── machine
```

---

# 2. OSI & TCP/IP

11. What is the OSI model?
    
12. What are its seven layers?
    
13. What is the TCP/IP model?
    
14. TCP/IP vs OSI?
    
15. What is encapsulation?
    
16. What is decapsulation?
    
17. At which layer does IP operate?
    
18. At which layer does TCP operate?
    
19. At which layer does HTTP operate?
    
20. Why should a backend engineer understand the network layers?
    

Don't spend excessive time memorizing every theoretical detail of the Session and Presentation layers. **Understand the model as a debugging and communication framework.**

---

# 3. IP, Ports, Routing & NAT

21. What is IPv4?
    
22. What is IPv6?
    
23. IPv4 vs IPv6?
    
24. What is a public IP?
    
25. What is a private IP?
    
26. What is localhost?
    
27. What is `127.0.0.1`?
    
28. What is `0.0.0.0`?
    
29. What is a port number?
    
30. What is a socket?
    
31. What is a socket address?
    
32. What is a router?
    
33. What is routing?
    
34. What is NAT?
    
35. Why does NAT exist?
    

### Very important for Node.js

Understand:

```text
IP Address + Port
       ↓
     Socket
       ↓
TCP connection
       ↓
Node.js server
```

This connects directly to Node's `net`, `http`, and server APIs.

---

# 4. TCP — Highest Priority

36. What is TCP?
    
37. Why is TCP connection-oriented?
    
38. TCP vs UDP?
    
39. Why is TCP reliable?
    
40. What is the TCP three-way handshake?
    
41. What are SYN and ACK?
    
42. What is a sequence number?
    
43. What is an acknowledgment number?
    
44. What happens if a TCP packet is lost?
    
45. What happens if packets arrive out of order?
    
46. What is retransmission?
    
47. What is TCP flow control?
    
48. What is TCP congestion control?
    
49. Flow control vs congestion control?
    
50. What is the TCP receive window?
    
51. What is a TCP connection?
    
52. How is a TCP connection terminated?
    
53. What are FIN and ACK?
    
54. What is TIME_WAIT?
    
55. Why does TIME_WAIT exist?
    

### Backend connection

You should be able to connect this directly to:

```text
HTTP server
    ↓
TCP connection
    ↓
TCP byte stream
    ↓
HTTP request bytes
    ↓
HTTP parser
    ↓
Node.js request object
```

This is particularly relevant to your Node.js backend preparation.

---

# 5. UDP

56. What is UDP?
    
57. Why is UDP connectionless?
    
58. TCP vs UDP?
    
59. Does UDP guarantee delivery?
    
60. Does UDP guarantee ordering?
    
61. When would you choose UDP?
    
62. Why is DNS traditionally associated with UDP?
    
63. Why can real-time applications use UDP?
    
64. What is QUIC?
    
65. How does HTTP/3 relate to UDP?
    

You don't need to go extremely deep into UDP for a normal backend fresher interview, but you **must clearly understand TCP vs UDP**.

---

# 6. DNS — Very Important

66. What is DNS?
    
67. Why do we need DNS?
    
68. What happens when you request `api.example.com`?
    
69. What is a DNS resolver?
    
70. What is a DNS server?
    
71. What is DNS caching?
    
72. What is an A record?
    
73. What is an AAAA record?
    
74. What is a CNAME record?
    
75. What is an MX record?
    

You should be able to explain:

```text
api.example.com
       ↓
DNS lookup
       ↓
IP address
       ↓
TCP connection
       ↓
HTTP/HTTPS
       ↓
Backend server
```

---

# 7. HTTP — **Critical for Backend Engineers**

76. What is HTTP?
    
77. How does HTTP work?
    
78. What is an HTTP request?
    
79. What is an HTTP response?
    
80. What are HTTP methods?
    
81. GET vs POST?
    
82. PUT vs PATCH?
    
83. What is DELETE?
    
84. What are HTTP status codes?
    
85. What is `200`?
    
86. What is `201`?
    
87. What is `400`?
    
88. What is `401`?
    
89. What is `403`?
    
90. What is `404`?
    
91. What is `409`?
    
92. What is `422`?
    
93. What is `429`?
    
94. What is `500`?
    
95. What is `502`?
    
96. What is `503`?
    
97. What are HTTP headers?
    
98. What is `Content-Type`?
    
99. What is `Content-Length`?
    
100. What is `Authorization`?
    
101. What is HTTP keep-alive?
    
102. What is connection pooling?
    
103. HTTP/1.1 vs HTTP/2?
    
104. HTTP/2 vs HTTP/3?
    
105. What is HTTP caching?
    

### These are especially important for your REST API work

You should be able to explain why an API might return:

```text
400 → invalid request
401 → authentication required/failed
403 → authenticated but not allowed
404 → resource not found
409 → resource/state conflict
422 → semantically invalid input
429 → rate limit exceeded
500 → server-side failure
502 → bad upstream response
503 → service unavailable
```

---

# 8. HTTPS & TLS

106. What is HTTPS?
    
107. What is TLS?
    
108. HTTP vs HTTPS?
    
109. Why do we need TLS?
    
110. What happens during a TLS handshake?
    
111. What is a digital certificate?
    
112. What is a Certificate Authority?
    
113. Symmetric vs asymmetric encryption?
    
114. Why does TLS use both asymmetric and symmetric cryptography?
    
115. How does HTTPS protect against a man-in-the-middle attack?
    

For a backend interview, understand the **purpose and high-level handshake**, not cryptographic mathematics.

---

# 9. WebSockets — Important for Your Node.js Profile

116. What is a WebSocket?
    
117. HTTP vs WebSocket?
    
118. Why would a backend use WebSockets?
    
119. How does a WebSocket connection begin?
    
120. What is the WebSocket handshake?
    
121. Is WebSocket TCP or UDP based?
    
122. WebSocket vs HTTP polling?
    
123. WebSocket vs Server-Sent Events?
    

If you've worked with Socket.IO, also understand:

```text
Client
  ↓
HTTP handshake
  ↓
WebSocket upgrade
  ↓
Persistent connection
  ↓
Bidirectional communication
```

---

# 10. Backend Scenario Questions

These are the **highest-value questions** for your actual interview.

124. What happens when a client calls your Node.js API?
    
125. Explain the complete journey of an HTTPS API request.
    
126. What happens when you enter a URL in a browser?
    
127. What happens when DNS fails?
    
128. What happens when the server IP is reachable but the port is closed?
    
129. Connection refused vs connection timeout?
    
130. Why might an API be slow even when the server is healthy?
    
131. What can cause high network latency?
    
132. What can cause packet loss?
    
133. Why might an API work locally but fail in production?
    
134. Why would a backend server listen on `0.0.0.0` instead of `localhost`?
    
135. Why shouldn't a database port normally be publicly exposed?
    
136. What happens when a TCP connection is unexpectedly closed?
    
137. Why do backend applications use connection pooling?
    
138. What is a reverse proxy?
    
139. Why would you put Nginx/API Gateway in front of Node.js?
    
140. What is a load balancer?
    
141. How does a load balancer distribute requests?
    
142. What happens if one backend server goes down?
    
143. What is a health check?
    
144. How would you troubleshoot an API timeout?
    

---

# The 25 You Should Absolutely Master

If your placement is close, **these are your Computer Networks Tier-1 questions**:

1. OSI model
    
2. TCP/IP model
    
3. OSI vs TCP/IP
    
4. IP address
    
5. Port
    
6. Socket
    
7. TCP vs UDP
    
8. TCP three-way handshake
    
9. TCP reliability
    
10. TCP connection termination
    
11. Flow control vs congestion control
    
12. DNS
    
13. DNS resolution
    
14. HTTP
    
15. HTTP methods
    
16. HTTP status codes
    
17. HTTP headers
    
18. HTTP vs HTTPS
    
19. TLS handshake
    
20. HTTP/1.1 vs HTTP/2
    
21. WebSocket
    
22. WebSocket vs HTTP
    
23. Reverse proxy
    
24. Load balancer
    
25. **What happens when a client sends a request to a backend server?**
    

## How I'd Prepare CN for Your Resume

Because your resume is **backend-oriented**, your ideal knowledge progression is:

```text
              COMPUTER NETWORKS
                     │
        ┌────────────┴────────────┐
        ↓                         ↓
   Network Basics            Application
        │                         │
 IP / Port / Socket         HTTP / HTTPS / DNS
        │                         │
        ↓                         ↓
       TCP  ←──────────────→  WebSocket
        │                         │
        └────────────┬────────────┘
                     ↓
              Backend Server
                     ↓
             Node.js / Express
                     ↓
             Database / Redis
```

This is the level I'd target for you: **not “I studied the OSI model,” but “I can explain what actually happens when my Node.js API receives a request.”**

And importantly, **don't spend your limited placement time trying to memorize 250 networking questions**. For a backend fresher, mastering the 25 core questions above plus the scenario questions will give you substantially better interview coverage.