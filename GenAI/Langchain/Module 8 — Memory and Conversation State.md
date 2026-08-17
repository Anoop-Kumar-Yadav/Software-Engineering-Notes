## 1. Language-agnostic Concept

One of the most common misconceptions about conversational AI is that **the model has memory**. It does not.

Every LLM invocation is **stateless**.

When a request reaches the provider, the model has no knowledge of any previous requests unless those previous interactions are included in the current request. If you call the same model twice:

```text
Request 1
User: My name is Anoop.

------------------------------

Request 2
User: What is my name?
```

the second request contains no information about the first one. From the model's perspective, they are completely unrelated.

This is true regardless of whether you use OpenAI, Anthropic, Gemini, Llama, Claude, or any other modern LLM.

Therefore, what developers commonly call **memory** is actually **application-managed conversation state**.

This distinction is extremely important.

The application—not the LLM—is responsible for remembering previous interactions.

Conceptually:

```text
User
   │
   ▼
Application State
   │
   ▼
Conversation History
   │
   ▼
Prompt
   │
   ▼
LLM
```

The LLM simply consumes whatever conversation history is supplied during the current request.

This architectural separation explains why LangChain has moved away from treating memory as a special feature. Modern LangChain frames it as **state management**, and the recommended abstractions increasingly come from **LangGraph**, where state is an explicit part of the execution model rather than hidden behind specialized "memory classes." ([docs.langchain.com](https://docs.langchain.com/oss/python/langgraph/add-memory?utm_source=chatgpt.com))

---

## 2. Mechanism

Every conversation follows the same execution cycle.

```text
User Message
       │
       ▼
Load Conversation History
       │
       ▼
Append New User Message
       │
       ▼
Call LLM
       │
       ▼
Receive AIMessage
       │
       ▼
Store Updated Conversation
```

Notice something important.

The conversation history exists **outside** the model.

The model never stores it internally.

Suppose a conversation looks like this.

```text
System:
You are a backend tutor.

Human:
My name is Anoop.

AI:
Nice to meet you.

Human:
What is my name?
```

When the second question is asked, LangChain sends **all four messages**.

```text
SystemMessage
HumanMessage
AIMessage
HumanMessage
```

The model simply reads the conversation as if it were receiving it for the first time.

---

### Short-Term vs Long-Term State

Modern GenAI systems distinguish between two different forms of memory.

|Type|Purpose|
|---|---|
|**Short-term conversation state**|Previous chat messages within the current conversation|
|**Long-term memory**|User profile, preferences, facts, documents, database records|

These are completely different engineering problems.

Conversation history answers:

> "What has been said earlier in this conversation?"

Long-term memory answers:

> "What should this application remember about this user across months?"

Modern LangChain primarily addresses the first problem.

The second problem is generally implemented using your own persistence layer (PostgreSQL, Redis, MongoDB, vector databases, etc.) and retrieved similarly to RAG.

---

### RunnableWithMessageHistory

For conversational applications that still use LCEL chains, LangChain provides `RunnableWithMessageHistory`.

Its responsibility is straightforward.

Instead of requiring developers to manually:

1. load history,
    
2. append new messages,
    
3. call the model,
    
4. save updated history,
    

the wrapper automates this workflow.

Conceptually:

```text
User
 │
 ▼
RunnableWithMessageHistory
 │
 ├── Load history
 ├── Append user message
 ├── Execute chain
 ├── Append AI message
 └── Save history
 │
 ▼
Response
```

The wrapped chain itself remains completely unaware that history exists.

This is an elegant example of separation of concerns.

([reference.langchain.com](https://reference.langchain.com/python/langchain-core/runnables/history/RunnableWithMessageHistory?utm_source=chatgpt.com))

---

### Why LangGraph Changed the Picture

Historically, LangChain exposed classes such as:

- `ConversationBufferMemory`
    
- `ConversationSummaryMemory`
    
- `ConversationTokenBufferMemory`
    

These classes still appear in many tutorials.

However, they belong to the **older memory system**.

Current LangChain documentation encourages using **LangGraph persistence and state management** for new applications because conversational state is only one part of a larger execution state.

Instead of storing only messages, LangGraph stores an entire state object.

```text
State
├── messages
├── retrieved_documents
├── tool_results
├── user_profile
├── execution_flags
└── ...
```

This is much more suitable for production agent workflows.

([docs.langchain.com](https://docs.langchain.com/oss/python/langgraph/add-memory?utm_source=chatgpt.com))

---

## 3. Current Python Syntax

### Using RunnableWithMessageHistory

A history object must first be created.

```python
from langchain_core.chat_history import InMemoryChatMessageHistory

store = {}

def get_session_history(session_id: str):
    if session_id not in store:
        store[session_id] = InMemoryChatMessageHistory()

    return store[session_id]
```

Notice that the history is keyed by `session_id`.

Each user receives an independent conversation.

---

Suppose we already have a chain.

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant."),
    ("human", "{input}")
])

chain = prompt | ChatOpenAI(
    model="gpt-5-nano"
)
```

Wrapping it with history is straightforward.

```python
from langchain_core.runnables.history import (
    RunnableWithMessageHistory,
)

conversation = RunnableWithMessageHistory(
    chain,
    get_session_history,
)
```

Now invoke it.

```python
response = conversation.invoke(
    {
        "input":
        "My name is Anoop."
    },
    config={
        "configurable": {
            "session_id": "user-1"
        }
    }
)
```

Later:

```python
response = conversation.invoke(
    {
        "input":
        "What is my name?"
    },
    config={
        "configurable": {
            "session_id": "user-1"
        }
    }
)
```

Internally, the wrapper automatically:

1. retrieves history,
    
2. appends the new message,
    
3. executes the chain,
    
4. stores the AI response.
    

The chain itself never changes.

---

### Replacing In-Memory Storage

The previous example uses:

```python
InMemoryChatMessageHistory
```

This is appropriate only for development.

Production systems typically replace it with persistent storage.

```text
RunnableWithMessageHistory
              │
              ▼
History Backend

├── Redis
├── PostgreSQL
├── MongoDB
├── DynamoDB
├── Cassandra
└── Custom Store
```

The wrapper is storage-agnostic.

Only `get_session_history()` changes.

---

## 4. JS Equivalent Note

The JavaScript API follows the same conceptual model.

Conversation history is represented by implementations of `BaseChatMessageHistory`, and `RunnableWithMessageHistory` wraps an existing Runnable exactly as it does in Python.

Conceptually:

```javascript
const conversation =
  new RunnableWithMessageHistory({
    runnable: chain,
    getMessageHistory,
  });
```

Invocation includes a session identifier.

```javascript
await conversation.invoke(
  {
    input: "My name is Anoop."
  },
  {
    configurable: {
      sessionId: "user-1"
    }
  }
);
```

The mental model is identical.

```
Chain
      │
      ▼
RunnableWithMessageHistory
      │
      ▼
Persistent Storage
```

The primary difference is JavaScript's asynchronous programming model rather than any architectural divergence.

---

## 5. Design Rationale and Tradeoffs

The evolution from specialized memory classes to explicit state management reflects a broader architectural shift within LangChain. Early conversational systems primarily needed to remember previous messages, so abstractions such as `ConversationBufferMemory` were sufficient. Modern AI applications, however, manage far richer execution state: retrieved documents, intermediate reasoning artifacts, tool outputs, user profiles, execution checkpoints, and workflow metadata. Treating all of this as a single "memory" abstraction proved limiting. By modeling state explicitly, LangGraph provides a more general foundation for production workflows while keeping conversation history as just one field within that state. ([docs.langchain.com](https://docs.langchain.com/oss/python/langgraph/add-memory?utm_source=chatgpt.com))

Conversation history also has practical costs. Every previous message included in the prompt consumes context window capacity and increases token usage, which directly affects latency and inference cost. Long conversations eventually exceed model limits, requiring strategies such as summarization, truncation, or selective retrieval. The optimal approach depends on the application. Customer support systems may retain many conversational turns, while coding assistants often benefit from retaining only the most recent exchanges together with relevant retrieved documents.

A crucial architectural distinction is that **conversation history is not long-term memory**. If an application needs to remember durable user facts across sessions, those facts should generally be stored in a database and retrieved when needed rather than appended indefinitely to every prompt. This keeps prompts compact while ensuring that persistent knowledge remains authoritative and easy to update.

---

## 6. Practical Application Scenario

Consider an AI DevOps assistant used within a software engineering organization.

A developer starts a conversation:

> "I'm debugging authentication failures in the payment service."

Over the next thirty minutes, the discussion covers JWT validation, Redis session storage, database migrations, API gateway configuration, and deployment logs. Every new question depends on the previous context.

The application architecture resembles:

```text
User
      │
      ▼
RunnableWithMessageHistory
      │
      ├── PostgreSQL / Redis
      │        │
      │        ▼
      │   Conversation History
      │
      ▼
LCEL Chain
      │
      ▼
Chat Model
      │
      ▼
Updated Conversation History
```

If the developer closes the browser and returns later using the same session, the application reloads the stored messages and continues the conversation seamlessly. The language model itself has not remembered anything; the continuity is entirely the result of application-managed state.

This module also highlights why LangGraph has become central to modern LangChain. Once workflows involve not only messages but also retrieved documents, tool outputs, branching decisions, retries, and checkpoints, conversation history becomes just one part of a broader execution state. In the next module, we will build on this idea by introducing **LangGraph**, where state is treated as a first-class concept and agent behavior emerges from explicit graph-based orchestration rather than simple linear chains.