The previous module introduced Retrieval-Augmented Generation (RAG), where external knowledge is retrieved dynamically and injected into a prompt. RAG solves the problem of **knowledge**, but it does **not** solve the problem of **state**.

These are fundamentally different concerns.

Suppose a user asks:

> "What is Redis?"

and then immediately follows with:

> "How does it compare to Memcached?"

The second question is impossible to interpret correctly without remembering that **"it" refers to Redis**.

The application therefore requires **conversation state**.

One of the biggest architectural changes introduced in LangChain 1.x is that **memory is no longer treated as a magical built-in object attached to chains**. Earlier versions of LangChain exposed classes such as `ConversationBufferMemory`, `ConversationSummaryMemory`, and various specialized memory implementations. While convenient for simple examples, these abstractions tightly coupled state management to individual chain implementations and became increasingly difficult to compose as applications grew more sophisticated.

Modern LangChain takes a different approach. Instead of asking, _"Which memory class should I use?"_, it asks, _"Where does conversation state live, and how should it be managed?"_ The answer is that **conversation history is explicit application state**. LangChain provides helpers for integrating that state into Runnable pipelines, while **LangGraph** extends the same philosophy to arbitrary application state beyond just messages. ([docs.langchain.com](https://docs.langchain.com/oss/python/langchain/short-term-memory))

---

# 1. Setup (Isolated Folder)

Create a completely independent project.

```bash
cd langchain-course

mkdir module-08-memory
cd module-08-memory

python3 -m venv .venv

# Linux / macOS
source .venv/bin/activate

# Windows
# .venv\Scripts\activate

touch main.py
touch requirements.txt
touch .env
```

Create `requirements.txt`.

```text
langchain==1.0.3
langchain-core==1.0.3
langchain-openai==1.3.3
python-dotenv==1.1.1
```

Install:

```bash
pip install -r requirements.txt
```

Create `.env`.

```env
OPENAI_API_KEY=your_api_key_here
```

---

# 2. Language-Agnostic Concept

Every interactive software system maintains state.

A shopping cart stores selected products.

An authentication system stores session information.

A multiplayer game stores player positions.

A chatbot stores previous messages.

These are all examples of **stateful computation**.

Without state, every request is completely independent.

Conceptually,

```text
Request 1

↓

Response 1

Request 2

↓

Response 2
```

The application has no memory of previous interactions.

With state,

```text
Request

↓

Previous State

↓

Business Logic

↓

Updated State

↓

Response
```

Notice the difference.

The current response depends not only on the current input but also on accumulated history.

This principle is not unique to AI.

It is a general property of stateful software systems.

---

## Why LLMs Need Conversation State

A language model itself is stateless.

When you call an API,

```text
POST /chat/completions
```

the provider does **not** remember previous API calls.

Every request must include all necessary context.

Conceptually,

```text
Application

↓

Messages

↓

LLM

↓

Response
```

The provider forgets everything immediately after producing the response.

Therefore,

the application—not the model—is responsible for remembering conversations.

---

# 3. Mechanism

## Message History

Conversation state is represented simply as a sequence of messages.

```text
[
    SystemMessage,
    HumanMessage,
    AIMessage,
    HumanMessage,
    AIMessage
]
```

Each new interaction appends two additional messages:

```text
HumanMessage

↓

AIMessage
```

The next request includes the entire updated history.

---

## RunnableWithMessageHistory

LangChain provides `RunnableWithMessageHistory` as an adapter around an existing Runnable.

Conceptually,

```text
User Input
      │
      ▼
Load History
      │
      ▼
Prompt + History
      │
      ▼
Runnable
      │
      ▼
Response
      │
      ▼
Save History
```

Notice something important.

The original chain does **not** know that history exists.

History management is handled externally.

This separation keeps business logic independent from persistence.

---

## Session IDs

A real application serves many users simultaneously.

Therefore,

```text
History
```

is insufficient.

Instead,

```text
Session ID

↓

Conversation History
```

Each user receives an independent conversation.

Conceptually,

```text
"user-123"

↓

[
 Human,
 AI,
 Human,
 AI
]
```

while

```text
"user-456"

↓

[
 Human,
 AI
]
```

is stored separately.

This mapping is entirely managed by the application.

---

## In-Memory vs Persistent History

During development,

history often lives in memory.

```text
Python Dictionary

↓

Session History
```

Production systems instead persist history in

- PostgreSQL
    
- MongoDB
    
- Redis
    
- DynamoDB
    
- Cassandra
    
- Elasticsearch
    

The Runnable remains unchanged.

Only the storage implementation changes.

---

# 4. Current Python Syntax and Implementation

Create `main.py`.

```python
from dotenv import load_dotenv

from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.prompts import MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_openai import ChatOpenAI

load_dotenv()

model = ChatOpenAI(
    model="gpt-5",
    temperature=0,
)

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a backend engineering tutor."
        ),
        MessagesPlaceholder(
            variable_name="history"
        ),
        (
            "human",
            "{question}"
        ),
    ]
)

chain = prompt | model

store = {}

def get_history(session_id: str):
    if session_id not in store:
        store[session_id] = InMemoryChatMessageHistory()

    return store[session_id]


chatbot = RunnableWithMessageHistory(
    chain,
    get_history,
    input_messages_key="question",
    history_messages_key="history",
)

response1 = chatbot.invoke(
    {
        "question": "What is Redis?"
    },
    config={
        "configurable": {
            "session_id": "user-1"
        }
    },
)

print(response1.content)

response2 = chatbot.invoke(
    {
        "question": "How is it different from Memcached?"
    },
    config={
        "configurable": {
            "session_id": "user-1"
        }
    },
)

print(response2.content)
```

Run:

```bash
python main.py
```

Expected output:

```text
Redis is an in-memory data structure store...

Redis differs from Memcached because...
```

Notice that the second question never mentioned Redis.

The application remembered it.

---

## Internal Execution Flow

When the second request executes,

```text
Session ID
      │
      ▼
Load Message History
      │
      ▼
Append New Human Message
      │
      ▼
Prompt Template
      │
      ▼
Chat Model
      │
      ▼
Append AI Response
      │
      ▼
Persist History
```

The model itself remains completely stateless.

The application reconstructs the conversation before every request.

---

## Why Isn't History Stored Inside the Model?

Suppose OpenAI attempted to remember every conversation.

Immediately several problems appear.

- Multiple devices
    
- Authentication
    
- Privacy
    
- Data retention
    
- Scaling
    
- Compliance
    

Instead,

providers expose stateless APIs.

Applications remain responsible for state management.

This design is significantly more flexible.

---

# 5. JS Equivalent Note

The JavaScript architecture is almost identical.

```javascript
import { RunnableWithMessageHistory }
    from "@langchain/core/runnables";

const chain =
    prompt.pipe(model);

const chatbot =
    new RunnableWithMessageHistory({
        runnable: chain,
        getMessageHistory,
        inputMessagesKey: "question",
        historyMessagesKey: "history",
    });

const response =
    await chatbot.invoke(
        {
            question: "What is Redis?"
        },
        {
            configurable: {
                sessionId: "user-1"
            }
        }
    );
```

The conceptual architecture does not change. The wrapper is responsible for loading and persisting message history around an otherwise stateless Runnable. JavaScript differs mainly in naming conventions (`sessionId` rather than `session_id`) and its asynchronous execution model.

---

# 6. Design Rationale and Tradeoffs

Making conversation history explicit rather than embedding it inside chain implementations significantly improves composability and architectural clarity. Prompt templates remain responsible only for prompt construction, chat models remain responsible only for inference, and history management becomes a separate concern that can evolve independently. This separation also enables applications to choose their own persistence strategy without modifying the core AI pipeline.

The primary tradeoff is that the application must now manage session identifiers, history storage, retention policies, and concurrency. While this introduces additional infrastructure responsibilities, it also enables enterprise requirements such as multi-device synchronization, access control, auditing, and long-term persistence—capabilities that were difficult to express through the legacy memory classes.

---

# 7. Practical Application Scenario

Consider an enterprise customer-support platform.

```text
Customer
      │
      ▼
Session ID
      │
      ▼
Conversation History
      │
      ▼
Prompt Template
      │
      ▼
Chat Model
      │
      ▼
Response
      │
      ▼
Database
```

When the customer returns hours later, the application reloads the previous conversation using the same session identifier. The model receives the relevant history along with the latest question, allowing it to continue the discussion naturally without requiring the user to repeat earlier information.

---

# Short-Term Memory vs Long-Term Memory

One point that often causes confusion is the distinction between **conversation history** and **long-term knowledge**.

|Short-Term Memory|Long-Term Memory|
|---|---|
|Current conversation|User profile or persistent facts|
|Stored as message history|Stored in databases or vector stores|
|Grows during a chat session|Persists across sessions|
|Used for conversational context|Used for personalization and recall|

For example:

```text
User: "My favorite language is Rust."
```

If the information is only needed during the current conversation, it belongs in message history.

If the application wants to remember this preference for future sessions, it should be stored separately in a persistent user profile or knowledge store rather than in conversation history.

---

# Why LangGraph Replaced Traditional Memory

This is the architectural transition that many developers miss.

Older LangChain versions viewed memory as a feature attached to chains:

```text
Chain
│
└── Memory
```

Modern LangChain views memory as one component of a broader application state:

```text
Application State
│
├── Messages
├── Retrieved Documents
├── Tool Results
├── User Preferences
├── Variables
└── Intermediate Outputs
```

Message history is therefore just one field within the application's overall state. LangGraph generalizes this idea by allowing arbitrary state objects to flow through a graph rather than limiting state to conversational memory.

This shift is one of the primary reasons LangGraph has become the recommended orchestration framework for complex AI applications.

---

# 8. Quick-Reference Syntax Recap

```python
from langchain_core.runnables.history import RunnableWithMessageHistory

chatbot = RunnableWithMessageHistory(
    chain,
    get_history,
    input_messages_key="question",
    history_messages_key="history",
)

response = chatbot.invoke(
    {
        "question": "What is Redis?"
    },
    config={
        "configurable": {
            "session_id": "user-1"
        }
    },
)
```

## What You Learned

This module reframed **memory as explicit application state rather than a built-in LangChain feature**. You learned that language models are inherently stateless and that the application is responsible for reconstructing conversation history on every request. `RunnableWithMessageHistory` provides a clean adapter that wraps any existing Runnable with session-aware message persistence while keeping inference logic independent from storage concerns. Most importantly, you saw how modern LangChain has shifted away from specialized memory classes toward an architecture where conversation history is simply one part of a broader application state—a perspective that naturally leads into **LangGraph**, where arbitrary state flows through a graph of computation rather than a linear chain.

The next module builds directly on this foundation by introducing **LangGraph**, where application state becomes a first-class concept and AI workflows evolve from linear LCEL pipelines into graph-based execution with loops, branching, conditional routing, and durable state management.