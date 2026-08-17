By the end of Module 9, we had reached the point where we could build sophisticated AI workflows using LangGraph. Those workflows could branch, loop, retrieve documents, call tools, and maintain durable state. However, one major concern remains before such systems are suitable for production: **visibility**.

Consider a backend service. If an HTTP request fails, developers inspect logs, traces, metrics, and stack traces to determine what happened. Without observability, debugging distributed systems quickly becomes impossible.

AI applications present an even greater challenge because a single user request may involve multiple prompt templates, several model invocations, vector retrieval, tool execution, structured output parsing, and graph transitions. When a response is slow or incorrect, developers need to answer questions such as:

- Which prompt was actually sent?
    
- Which documents were retrieved?
    
- How many tokens were consumed?
    
- Which tool was selected?
    
- Which graph node executed?
    
- How long did each stage take?
    
- Why did the model choose a particular branch?
    

LangChain addresses these concerns through three complementary mechanisms:

1. **Streaming** – progressively emitting intermediate output rather than waiting for completion.
    
2. **Callbacks** – observing execution events throughout a Runnable pipeline.
    
3. **LangSmith** – recording complete execution traces for debugging and production monitoring.
    

Together, these capabilities provide the observability layer for modern GenAI applications.

---

# 1. Setup (Isolated Folder)

Create another isolated project.

```bash
cd langchain-course

mkdir module-10-streaming
cd module-10-streaming

python3 -m venv .venv

# Linux / macOS
source .venv/bin/activate

# Windows
# .venv\Scripts\activate

touch main.py
touch requirements.txt
touch .env
```

`requirements.txt`

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

Create `.env`

```env
OPENAI_API_KEY=your_api_key_here
```

---

# 2. Language-Agnostic Concept

## Streaming

Normally, an LLM behaves like a conventional request-response API.

```text
Application

↓

Send Request

↓

Wait

↓

Receive Entire Response
```

Nothing is returned until generation finishes.

Streaming changes this interaction.

```text
Application

↓

Request

↓

Token

↓

Token

↓

Token

↓

Token

↓

Finished
```

Instead of waiting for the complete response, the application receives output incrementally as the model generates it.

This dramatically improves perceived responsiveness. Users begin reading almost immediately even though the model continues generating.

Streaming does **not** make inference faster.

It simply allows the application to consume partial results while inference is still occurring.

---

## Callbacks

Streaming concerns **model output**.

Callbacks concern **execution events**.

Suppose a pipeline contains:

```text
Prompt

↓

Retriever

↓

Model

↓

Parser
```

A callback system allows code to observe each stage.

Conceptually,

```text
Prompt Starts

↓

Prompt Ends

↓

Retriever Starts

↓

Retriever Ends

↓

Model Starts

↓

Model Ends
```

Callbacks therefore behave much like middleware or event listeners in traditional software systems.

---

## Observability

Observability combines all execution events into a trace.

Conceptually,

```text
User Request

↓

Prompt

↓

Retriever

↓

Tool

↓

Model

↓

Output

↓

Trace
```

The trace records not only the final answer but also every intermediate step that produced it.

---

# 3. Mechanism

## `.invoke()`

Until now we have primarily used

```python
chain.invoke(...)
```

Execution behaves as

```text
Input

↓

Entire Pipeline

↓

Final Output
```

---

## `.stream()`

Streaming changes the contract.

Instead of returning one object,

it returns an iterator.

Conceptually,

```text
Input

↓

Pipeline

↓

Chunk

↓

Chunk

↓

Chunk

↓

Finished
```

Each chunk represents a partial output.

---

## `.astream()`

Python also exposes an asynchronous version.

```python
await chain.astream(...)
```

The architecture is identical.

Only the execution model differs.

---

## Callback Lifecycle

Every Runnable emits lifecycle events.

Conceptually,

```text
Runnable Starts

↓

Work

↓

Runnable Ends
```

During execution,

additional events may occur.

```text
LLM Start

↓

New Token

↓

New Token

↓

New Token

↓

LLM End
```

Every stage of an LCEL pipeline follows this lifecycle.

---

# 4. Current Python Syntax and Implementation

## Streaming

Create `main.py`.

```python
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI

load_dotenv()

model = ChatOpenAI(
    model="gpt-5",
    temperature=0,
)

print("Streaming Response:\n")

for chunk in model.stream(
    "Explain Redis in three short sentences."
):
    print(chunk.content, end="", flush=True)
```

Run:

```bash
python main.py
```

Example output:

```text
Streaming Response:

Redis is an in-memory...
data structure...
commonly used...
```

Notice that output appears progressively.

The model continues generating while the application is already displaying text.

---

## Streaming Through LCEL

Streaming works on entire chains.

```python
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

prompt = ChatPromptTemplate.from_template(
    "Explain {topic}"
)

model = ChatOpenAI(
    model="gpt-5"
)

parser = StrOutputParser()

chain = prompt | model | parser

for chunk in chain.stream(
    {
        "topic": "Docker"
    }
):
    print(chunk, end="")
```

Notice something important.

The application streams the **entire Runnable pipeline**, not merely the model.

This is possible because the pipeline itself is a Runnable.

---

## Asynchronous Streaming

Python applications built on FastAPI commonly use asynchronous streaming.

```python
async for chunk in chain.astream(
    {
        "topic": "Docker"
    }
):
    print(chunk)
```

The conceptual behavior remains unchanged.

---

# Callbacks

Suppose we define a callback handler.

```python
from langchain_core.callbacks import BaseCallbackHandler

class Logger(BaseCallbackHandler):

    def on_llm_start(
        self,
        serialized,
        prompts,
        **kwargs,
    ):
        print("LLM started")

    def on_llm_end(
        self,
        response,
        **kwargs,
    ):
        print("LLM finished")
```

Attach it.

```python
model = ChatOpenAI(
    model="gpt-5",
    callbacks=[Logger()]
)
```

Execution now produces

```text
LLM started

...

LLM finished
```

Real applications use callbacks for:

- logging
    
- metrics
    
- billing
    
- analytics
    
- tracing
    
- debugging
    

---

## Event Flow

Conceptually,

```text
User Request
      │
      ▼
Prompt
      │
      ▼
Callback
      │
      ▼
Model
      │
      ▼
Callback
      │
      ▼
Parser
      │
      ▼
Callback
```

Every Runnable contributes events.

---

# LangSmith

Callbacks are useful locally.

Production systems require persistent traces.

LangSmith provides this capability.

Conceptually,

```text
Application

↓

Runnable

↓

Execution Events

↓

LangSmith

↓

Dashboard
```

A trace records:

- prompts
    
- responses
    
- retrieved documents
    
- token usage
    
- latency
    
- tool calls
    
- graph transitions
    
- exceptions
    

Instead of searching logs,

developers inspect the complete execution graph for a request.

This becomes indispensable once applications contain dozens of nodes or tools.

---

## Why Observability Matters

Suppose a customer reports:

> "The chatbot answered incorrectly."

Without tracing,

developers must guess.

With tracing,

they immediately see

```text
Question

↓

Retriever

↓

Retrieved Wrong Documents

↓

Prompt

↓

Model

↓

Incorrect Answer
```

The root cause becomes obvious.

Perhaps retrieval failed rather than the model.

Perhaps the prompt template omitted context.

Perhaps the tool returned incorrect data.

Observability identifies the failing component.

---

# 5. JS Equivalent Note

Streaming follows the same architecture in `langchain.js`.

```javascript
const stream =
  await chain.stream({
    topic: "Redis",
  });

for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```

Because JavaScript is asynchronous by design, streaming naturally uses asynchronous iterators. Apart from this language difference, the conceptual model is identical. Pipelines remain Runnables, callbacks observe execution events, and LangSmith integrates with both Python and JavaScript through the same tracing concepts.

---

# 6. Design Rationale and Tradeoffs

Streaming improves perceived responsiveness by allowing applications to consume partial model output before generation completes. It does not reduce inference latency but significantly enhances user experience for long responses. Because streaming propagates through the Runnable abstraction, entire LCEL pipelines and LangGraph executions can expose incremental results without requiring separate orchestration logic.

Callbacks decouple observability concerns from business logic. Rather than embedding logging or metrics into every node, developers register callback handlers that observe lifecycle events across the execution graph. This separation improves maintainability but introduces additional implementation complexity, particularly when asynchronous execution and concurrent requests are involved.

Comprehensive tracing platforms such as LangSmith extend this idea by persisting execution data, enabling debugging, performance analysis, prompt evaluation, and production monitoring. The primary tradeoff is additional operational infrastructure and the need to consider privacy and data retention policies for captured prompts and responses.

---

# 7. Practical Application Scenario

Consider an enterprise legal document analysis platform.

```text
PDF Upload
      │
      ▼
Document Splitter
      │
      ▼
Retriever
      │
      ▼
LLM
      │
      ▼
Structured Output
      │
      ▼
Database
```

Every stage emits callback events.

The complete execution trace records:

```text
Upload

↓

Chunk Creation

↓

Retrieved Chunks

↓

Prompt

↓

Token Usage

↓

Model Response

↓

Validation

↓

Storage
```

If users report incorrect legal citations or unusually slow processing, engineers can inspect the trace to determine whether the issue originated from document chunking, retrieval quality, prompt construction, model behavior, or downstream validation.

---

# 8. Quick-Reference Syntax Recap

```python
from langchain_openai import ChatOpenAI

model = ChatOpenAI(
    model="gpt-5"
)

for chunk in model.stream(
    "Explain Redis."
):
    print(chunk.content, end="")
```

## What You Learned

This module introduced the **operational layer** of LangChain applications. You learned that **streaming** exposes incremental model output through `.stream()` and `.astream()`, improving responsiveness without changing the underlying execution model. You also saw how **callbacks** observe Runnable lifecycle events, enabling logging, metrics, tracing, and debugging without coupling those concerns to business logic. Finally, you learned that **LangSmith** builds on these event streams to provide production-grade observability, allowing developers to inspect complete execution traces across prompts, retrieval, tools, models, parsers, and LangGraph nodes.

At this point, you have covered the complete Python-side architecture of modern LangChain: Runnables, LCEL, chat models, prompt templates, structured output, tool calling, RAG, conversation state, LangGraph, and observability. The final module consolidates this knowledge by mapping every major abstraction to its **`langchain.js` equivalent**, highlighting API differences, package organization, asynchronous execution patterns, and migration considerations so you can transfer the same mental model seamlessly between Python and JavaScript.