# Course Goal

Technology stack:

# Phase 0 — Environment & AI Ecosystem

Goal: Understand the ecosystem and prepare the development environment.

Topics:

- AI ecosystem overview
    
- OpenAI vs Anthropic vs Gemini vs Ollama
    
- Local vs Cloud models
    
- AI application architecture
    
- Development environment
    
- Project structure
    
- API keys
    
- Model selection
    
- Cost awareness
    
- Token pricing
    

---

# Phase 1 — LangChain Fundamentals

Goal: Learn the core abstractions that almost every LangChain application uses.

Topics:

- What is LangChain?
    
- Why LangChain exists
    
- LangChain architecture
    
- Packages (`@langchain/core`, `@langchain/openai`, etc.)
    
- Runnable interface
    
- Invoke
    
- Batch
    
- Stream
    
- Pipe
    
- Configuration
    
- Callbacks

# Phase 2 — Models

Goal: Learn how applications communicate with LLMs.

Topics:

- Chat models
    
- Completion models
    
- System messages
    
- Human messages
    
- AI messages
    
- Model parameters
    
- Temperature
    
- Max tokens
    
- Top-p
    
- Frequency penalty
    
- Presence penalty
    
- Streaming
    
- Model switching

# Phase 3 — Prompt Engineering

Goal: Build reliable prompts instead of concatenating strings.

Topics:

- PromptTemplate
    
- ChatPromptTemplate
    
- System prompts
    
- Dynamic prompts
    
- Variables
    
- Few-shot prompting
    
- Message placeholders
    
- Prompt composition
    
- Prompt versioning

# Phase 4 — Output Processing

Goal: Make AI responses predictable and machine-readable.

Topics:

- Output parsers
    
- JSON output
    
- Structured outputs
    
- Zod integration
    
- Response validation
    
- Retry on invalid output
    
- Error handling

# Phase 5 — Memory

Goal: Build conversational applications.

Topics:

- Stateless vs stateful AI
    
- Chat history
    
- Memory strategies
    
- Conversation storage
    
- PostgreSQL memory
    
- Redis memory
    
- Context management
    
- Token-aware trimming

# Phase 6 — Embeddings

Goal: Understand semantic search.

Topics:

- What embeddings are
    
- Vector space
    
- Similarity
    
- Cosine similarity
    
- Embedding models
    
- Embedding APIs
    
- Chunking
    
- Metadata

# Phase 7 — Vector Databases

Goal: Store and retrieve embeddings efficiently.

Topics:

- Vector databases
    
- Qdrant
    
- pgvector
    
- Pinecone
    
- Indexes
    
- Collections
    
- Filters
    
- Hybrid search

# Phase 8 — Document Processing

Goal: Convert raw documents into searchable knowledge.

Topics:

- Document loaders
    
- PDF
    
- DOCX
    
- Markdown
    
- HTML
    
- CSV
    
- Recursive text splitter
    
- Chunk overlap
    
- Metadata extraction

# Phase 9 — Retrieval

Goal: Retrieve the right information before generation.

Topics:

- Retrievers
    
- Similarity search
    
- MMR
    
- Parent-child retrieval
    
- Compression retrievers
    
- Context building
    
- Ranking

# Phase 10 — RAG

Goal: Build AI systems that answer using your own data.

Topics:

- RAG architecture
    
- Retrieval pipeline
    
- Context injection
    
- Citations
    
- Hallucination reduction
    
- Query rewriting
    
- Re-ranking
    
- Hybrid RAG


# Phase 11 — Tool Calling

Goal: Allow AI to interact with external systems.

Topics:

- Tools
    
- Function calling
    
- Structured tools
    
- Zod schemas
    
- API integration
    
- Database tools
    
- Email tools
    
- Calculator tools

# Phase 12 — Agents

Goal: Build autonomous AI workflows.

Topics:

- Agents
    
- ReAct
    
- Planning
    
- Reasoning
    
- AgentExecutor
    
- Tool selection
    
- Multi-step reasoning
    
- Reflection

# Phase 13 — LangGraph

Goal: Build deterministic, stateful AI workflows.

Topics:

- Why LangGraph exists
    
- StateGraph
    
- Nodes
    
- Edges
    
- State
    
- Conditional routing
    
- Parallel execution
    
- Checkpointing
    
- Human-in-the-loop


# Phase 14 — MCP (Model Context Protocol)

Goal: Build AI systems that integrate with external tools using a standard protocol.

Topics:

- MCP architecture
    
- MCP server
    
- MCP client
    
- Resources
    
- Prompts
    
- Tools
    
- Transports
    
- Authentication
    
- Security

# Phase 15 — AI Backend Architecture

Goal: Learn production architecture rather than isolated examples.

Topics:

- Layered architecture
    
- AI service layer
    
- Provider abstraction
    
- Prompt repository
    
- Conversation service
    
- Embedding service
    
- Tool registry
    
- Dependency injection


# Phase 16 — Production Engineering

Goal: Make AI applications reliable and scalable.

Topics:

- Streaming
    
- Rate limiting
    
- Retries
    
- Timeouts
    
- Caching
    
- Token counting
    
- Cost tracking
    
- Logging
    
- Observability
    
- LangSmith
    
- Monitoring
    
- Evaluation
    
- Prompt testing


# Phase 17 — Performance Optimization

Goal: Reduce latency and cost.

Topics:

- Prompt optimization
    
- Token optimization
    
- Context compression
    
- Batch requests
    
- Embedding cache
    
- Response cache
    
- Async processing
    
- Queue architecture

# Phase 18 — Security

Goal: Secure AI applications.

Topics:

- Prompt injection
    
- Jailbreaks
    
- Data leakage
    
- PII protection
    
- Output filtering
    
- Tool security
    
- API security
    
- Tenant isolation


# Phase 19 — Testing

Goal: Test AI systems systematically.

Topics:

- Unit testing
    
- Mock models
    
- Prompt testing
    
- Evaluation datasets
    
- Regression testing
    
- Snapshot testing
    
- Load testing

# Phase 20 — Capstone Project

Build a production-grade AI platform.

Architecture:

```text
Client
   │
REST API
   │
Authentication
   │
Conversation Service
   │
Prompt Service
   │
LangGraph
   │
Tools
   │
Retriever
   │
Qdrant
   │
PostgreSQL
   │
Redis
   │
BullMQ
   │
OpenAI/Ollama
```

Features:

- User authentication
    
- Streaming chat
    
- Conversation history
    
- PDF upload
    
- RAG
    
- AI search
    
- Tool calling
    
- Multi-agent workflows
    
- MCP integration
    
- Redis caching
    
- Background document indexing
    
- Token usage tracking
    
- Cost dashboard
    
- Docker deployment
    
- CI/CD pipeline
    
- Monitoring and logging
