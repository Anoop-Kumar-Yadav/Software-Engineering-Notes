The previous module explained how LangChain composes computation. This module explains **what actually performs the computation**. In every LangChain application, there is almost always one central Runnable responsible for reasoning: the **chat model**. Understanding how LangChain abstracts model providers is essential because it allows applications to switch between OpenAI, Anthropic, Google, Groq, Ollama, and many others without rewriting orchestration logic. Modern LangChain exposes chat models through provider-specific integration packages while presenting a consistent interface to the rest of the framework. ([Docs by LangChain](https://docs.langchain.com/oss/python/integrations/chat/openai?utm_source=chatgpt.com "ChatOpenAI integration - Docs by LangChain"))

---

# 1. Setup (Isolated Folder)

Create another independent project.

```bash
cd langchain-course

mkdir module-03-models
cd module-03-models

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

Before discussing LangChain, we first need to define **what a chat model actually is**.

A language model is fundamentally a function:

```text
Input → Model → Output
```

Early LLM APIs accepted one large string:

```text
"What is Docker?"
```

and produced another string:

```text
"Docker is..."
```

This approach works well for text completion but breaks down once applications require conversations, tool execution, multiple participants, multimodal inputs, or structured reasoning.

Modern LLM APIs therefore no longer operate on raw strings.

Instead, they operate on an ordered sequence of **messages**.

Conceptually,

```text
Conversation

↓

[
 System,
 Human,
 AI,
 Human,
 AI
]

↓

Language Model

↓

Next AI Message
```

Notice an important difference.

The model is **not** asked to generate an entire conversation.

It receives the conversation history and predicts **only the next assistant message**.

This conversational abstraction is now shared by OpenAI, Anthropic, Google Gemini, Mistral, Groq, and most modern providers, although each provider exposes slightly different HTTP APIs. LangChain standardizes these differences behind a common chat-model interface. ([Docs by LangChain](https://docs.langchain.com/oss/python/integrations/chat/openai?utm_source=chatgpt.com "ChatOpenAI integration - Docs by LangChain"))

---

# 3. Mechanism

Internally, every chat model in LangChain is a **Runnable**.

That means a chat model participates in LCEL exactly like a prompt template or an output parser.

The important difference is **its input and output types**.

Conceptually,

```text
Messages
      │
      ▼
Chat Model
      │
      ▼
AIMessage
```

Unlike a normal function that returns a string, the model returns an **`AIMessage`** object.

The message contains considerably more than generated text.

Conceptually it includes information such as:

```text
AIMessage
│
├── content
├── usage metadata
├── response metadata
├── tool calls (if requested)
├── model information
└── provider-specific metadata
```

This richer representation allows downstream components to inspect token usage, detect tool requests, process citations, or continue conversations without manually parsing raw JSON.

---

## Why Typed Messages Instead of Dictionaries?

Many providers accept JSON like this:

```json
[
  {
    "role": "system",
    "content": "You are a teacher."
  },
  {
    "role": "user",
    "content": "Explain recursion."
  }
]
```

LangChain could simply expose dictionaries.

Instead, it defines strongly typed message objects.

```text
SystemMessage
HumanMessage
AIMessage
ToolMessage
```

This provides three important benefits.

First, the Python type system can validate objects before they reach the provider.

Second, downstream Runnables can distinguish message types without checking string literals such as `"role": "assistant"`.

Third, new capabilities like tool calling and multimodal content can be added without changing every application.

---

## Provider Abstraction

Suppose you begin with OpenAI.

```text
Application
      │
      ▼
ChatOpenAI
      │
      ▼
OpenAI API
```

Six months later your company migrates to Anthropic.

Without an abstraction layer, you would need to rewrite every model invocation.

With LangChain the architecture becomes:

```text
Application
      │
      ▼
Base Chat Model Interface
      │
      ├──────────────┐
      ▼              ▼
ChatOpenAI     ChatAnthropic
      │              │
      ▼              ▼
OpenAI API    Anthropic API
```

Your prompt templates, LCEL chains, output parsers, retrievers, and tools remain unchanged because they interact with the **chat-model abstraction**, not the underlying SDK. This provider-agnostic design is one of the primary architectural goals of LangChain. ([Docs by LangChain](https://docs.langchain.com/oss/python/integrations/chat/openai?utm_source=chatgpt.com "ChatOpenAI integration - Docs by LangChain"))

---

# 4. Current Python Syntax and Implementation

Create `main.py`.

```python
from dotenv import load_dotenv

from langchain_core.messages import (
    HumanMessage,
    SystemMessage,
)
from langchain_openai import ChatOpenAI

load_dotenv()

model = ChatOpenAI(
    model="gpt-5",
    temperature=0,
)

messages = [
    SystemMessage(
        content="You are a senior backend engineer."
    ),
    HumanMessage(
        content="Explain dependency injection in exactly three sentences."
    ),
]

response = model.invoke(messages)

print("===== AI RESPONSE =====")
print(response.content)

print("\n===== MESSAGE TYPE =====")
print(type(response).__name__)

print("\n===== TOKEN USAGE =====")
print(response.usage_metadata)
```

Run it.

```bash
python main.py
```

Example output:

```text
===== AI RESPONSE =====

Dependency injection is...

===== MESSAGE TYPE =====

AIMessage

===== TOKEN USAGE =====

{'input_tokens': ..., 'output_tokens': ..., 'total_tokens': ...}
```

Notice that `invoke()` returned an **`AIMessage`**, not a string.

If you only need the generated text,

```python
print(response.content)
```

If you need usage statistics,

```python
print(response.usage_metadata)
```

Later modules will access additional metadata such as tool calls and structured outputs from the same object.

---

## Internal Execution Flow

When the program executes,

```python
response = model.invoke(messages)
```

LangChain performs a sequence conceptually similar to:

```text
SystemMessage
HumanMessage
        │
        ▼
ChatOpenAI
        │
        ▼
Provider Request
        │
        ▼
Provider Response
        │
        ▼
AIMessage
```

The provider's JSON response is converted into a standardized LangChain message object before your application receives it.

---

# 5. JS Equivalent Note

The JavaScript implementation follows exactly the same architecture.

```javascript
import {
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";

import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  model: "gpt-5",
  temperature: 0,
});

const response = await model.invoke([
  new SystemMessage(
    "You are a senior backend engineer."
  ),
  new HumanMessage(
    "Explain dependency injection."
  ),
]);

console.log(response.content);
```

The conceptual model is identical. The principal difference is that JavaScript is asynchronous by default, so model invocation always returns a `Promise`. The package structure is also different: Python uses `langchain_openai`, whereas JavaScript distributes providers through scoped npm packages such as `@langchain/openai`. ([npm](https://www.npmjs.com/package/%40langchain/openai?activeTab=versions&utm_source=chatgpt.com "@langchain/openai - npm"))

---

# 6. Design Rationale and Tradeoffs

Separating the provider implementation from the model interface enables applications to remain largely provider-independent. Prompt templates, LCEL pipelines, retrievers, output parsers, and tools all communicate with a standardized chat-model API rather than a provider-specific SDK. This significantly reduces migration effort when organizations change vendors or need to support multiple providers simultaneously.

The abstraction is not completely free. Every provider exposes unique capabilities—reasoning controls, multimodal inputs, caching, or proprietary tool semantics—that may not map perfectly to the common interface. LangChain therefore exposes provider-specific configuration where necessary while preserving a consistent execution model for the majority of use cases. The general recommendation is to rely on the common interface unless an application genuinely requires a provider-exclusive feature.

---

# 7. Practical Application Scenario

Imagine an enterprise AI platform serving multiple customers. One customer requires OpenAI, another requires Anthropic due to compliance policies, and a third operates entirely on a local inference server.

The architecture can remain unchanged:

```text
REST API
      │
      ▼
Prompt Template
      │
      ▼
Chat Model Interface
      │
 ┌────┴────┐
 ▼         ▼
OpenAI  Anthropic
 │         │
 ▼         ▼
Response Response
```

The surrounding LCEL pipeline is identical regardless of which provider implementation is selected. This separation allows infrastructure decisions to evolve independently of application logic, making the system easier to maintain and extend.

---

# 8. Quick-Reference Syntax Recap

```python
from langchain_core.messages import (
    SystemMessage,
    HumanMessage,
)
from langchain_openai import ChatOpenAI

model = ChatOpenAI(
    model="gpt-5",
    temperature=0,
)

response = model.invoke([
    SystemMessage(
        content="You are a helpful assistant."
    ),
    HumanMessage(
        content="Explain dependency injection."
    ),
])

print(response.content)
```

## What You Learned

This module established that a **chat model is itself a Runnable** whose primary responsibility is transforming a sequence of typed messages into an `AIMessage`. Rather than exchanging raw dictionaries or strings, LangChain represents conversations using `SystemMessage`, `HumanMessage`, `AIMessage`, and later `ToolMessage`, providing stronger typing and a consistent programming model. The provider-specific implementations, such as `ChatOpenAI`, conform to the same interface, allowing the rest of an LCEL pipeline to remain unchanged when switching between model vendors. This abstraction forms the execution core of virtually every LangChain application, and the next module will build directly on it by showing how **prompt templates generate the message sequences consumed by chat models**.