## 1. Language-agnostic Concept

An LLM application ultimately needs a component capable of transforming natural language input into natural language output. At first glance, this seems like a straightforward API call: send a prompt, receive generated text. However, as the ecosystem evolved, providers introduced different APIs, message formats, authentication mechanisms, streaming protocols, tool-calling capabilities, structured outputs, and multimodal inputs. If every application interacted directly with each provider's SDK, switching providers would require significant changes throughout the codebase.

The fundamental problem LangChain solves here is **provider abstraction**. Rather than programming against OpenAI's SDK, Anthropic's SDK, Google's SDK, or Groq's SDK, you program against a common **chat model interface**. The application no longer depends on _how_ a provider implements inference. It depends only on the capabilities exposed by a common contract.

This is a familiar architectural pattern in backend engineering. Consider the Java Database Connectivity (JDBC) API or Node.js database ORMs. Your application does not call PostgreSQL's wire protocol directly; it interacts with an abstraction that can later be backed by PostgreSQL, MySQL, or SQLite. Similarly, LangChain applications are written against a **BaseChatModel** abstraction instead of a vendor-specific client. The underlying provider becomes an implementation detail rather than an architectural dependency. ([LangChain Reference Docs](https://reference.langchain.com/python/langchain-core/language_models/chat_models/BaseChatModel?utm_source=chatgpt.com "BaseChatModel | langchain_core | LangChain Reference"))

Another important distinction is between **completion models** and **chat models**. Older language models accepted a single string and returned another string. Modern conversational models operate on **a sequence of typed messages** and return an **AI message object**, enabling conversation history, tool calls, structured metadata, and multimodal content. Because nearly every major provider has converged on chat-style APIs, LangChain's modern ecosystem primarily revolves around **chat models** rather than legacy completion models. ([Docs by LangChain](https://docs.langchain.com/oss/python/langchain/models?utm_source=chatgpt.com "Models - Docs by LangChain"))

---

## 2. Mechanism

Internally, every LangChain chat model is both a **BaseChatModel** and a **Runnable**.

That statement is more important than it initially appears.

```text
                Runnable
                    ▲
                    │
            BaseChatModel
                    ▲
     ┌──────────────┼──────────────┐
     │              │              │
ChatOpenAI   ChatAnthropic   ChatGoogleGenerativeAI
```

Because every chat model is a Runnable, it automatically supports the execution model you learned in Modules 1 and 2:

- `invoke()`
    
- `batch()`
    
- `stream()`
    
- `ainvoke()`
    
- composition with `|`
    
- callbacks
    
- retries
    
- tracing
    

Notice that none of these behaviors belong specifically to OpenAI or Anthropic. They come from the Runnable abstraction inherited by every chat model. ([LangChain Reference Docs](https://reference.langchain.com/python/langchain-core/language_models/chat_models/BaseChatModel?utm_source=chatgpt.com "BaseChatModel | langchain_core | LangChain Reference"))

When your application invokes a model, the execution pipeline is conceptually:

```text
Messages
      │
      ▼
LangChain Chat Model
      │
      ▼
Provider Adapter
      │
      ▼
Provider HTTP API
      │
      ▼
Provider Response
      │
      ▼
AIMessage
```

The provider adapter performs several responsibilities:

- Converts LangChain message objects into the provider's request format.
    
- Sends the HTTP request.
    
- Parses the provider response.
    
- Converts the response into a standardized `AIMessage`.
    
- Preserves provider-specific metadata such as token usage, model name, finish reason, and tool calls where available. ([Docs by LangChain](https://docs.langchain.com/oss/python/langchain/models?utm_source=chatgpt.com "Models - Docs by LangChain"))
    

This architecture means the rest of your application never has to understand OpenAI's JSON schema, Anthropic's message format, or Gemini's request structure.

---

### Why typed messages instead of dictionaries?

Modern chat models no longer process one large prompt string. Instead, they receive a conversation composed of different semantic roles.

The major message types are:

| Message Type      | Purpose                                                     |
| ----------------- | ----------------------------------------------------------- |
| **SystemMessage** | Defines model behavior and high-level instructions.         |
| **HumanMessage**  | Represents user input.                                      |
| **AIMessage**     | Represents model output, including metadata and tool calls. |
| **ToolMessage**   | Represents the output returned by an executed tool.         |

A conversation therefore looks like this:

```text
SystemMessage
        │
HumanMessage
        │
AIMessage
        │
ToolMessage
        │
HumanMessage
        │
AIMessage
```

Using dedicated message objects instead of arbitrary dictionaries provides several advantages.

First, it gives the framework type safety and validation. Second, it allows providers to attach metadata such as token usage, tool invocations, citations, reasoning traces (where supported), and multimodal content without changing the public interface. Finally, it allows LangChain to reason about conversations structurally instead of treating everything as plain text. ([Docs by LangChain](https://docs.langchain.com/oss/python/langchain/messages?utm_source=chatgpt.com "Messages - Docs by LangChain"))

---

## 3. Current Python Syntax

One of the largest architectural changes in modern LangChain is **package separation**.

The core library intentionally contains only abstractions.

Concrete providers live in separate packages.

For OpenAI, install:

```bash
pip install -U langchain-openai
```

The provider-specific implementation is imported from its own package.

```python
from langchain_openai import ChatOpenAI

model = ChatOpenAI(
    model="gpt-5-nano",
    temperature=0.2,
)
```

Notice something important.

There is no `.chat()` method.

There is no `.generate()`.

Since every model is a Runnable, the primary execution API is simply:

```python
response = model.invoke("Explain vector embeddings.")
```

The returned value is **not a string**.

It is an `AIMessage`.

```python
print(type(response))
print(response.content)
```

A more realistic example uses typed messages.

```python
from langchain_openai import ChatOpenAI
from langchain.messages import (
    SystemMessage,
    HumanMessage,
)

model = ChatOpenAI(
    model="gpt-5-nano",
    temperature=0,
)

messages = [
    SystemMessage(
        "You are a senior backend engineer."
    ),
    HumanMessage(
        "Explain JWT authentication."
    ),
]

response = model.invoke(messages)

print(response.content)
```

Notice that `invoke()` accepts either:

- a plain string
    
- message dictionaries
    
- typed message objects
    
- prompt values
    

All are normalized internally before the provider request is generated. ([Docs by LangChain](https://docs.langchain.com/oss/python/langchain/models?utm_source=chatgpt.com "Models - Docs by LangChain"))

---

### Message Flow

The previous example is conceptually transformed into:

```text
SystemMessage
        │
HumanMessage
        │
──────────────
 Provider API
──────────────
        │
AIMessage
```

The `AIMessage` returned by the model contains much more than text.

Conceptually it includes:

```text
AIMessage
├── content
├── tool_calls
├── response_metadata
├── usage_metadata
└── id
```

This becomes extremely important later when we study tool calling and structured output.

---

## 4. JS Equivalent Note

The JavaScript ecosystem mirrors Python closely, although the syntax reflects JavaScript's asynchronous programming model.

```javascript
import { ChatOpenAI } from "@langchain/openai";
import {
  SystemMessage,
  HumanMessage,
} from "@langchain/core/messages";

const model = new ChatOpenAI({
  model: "gpt-5-nano",
  temperature: 0,
});

const response = await model.invoke([
  new SystemMessage(
    "You are a senior backend engineer."
  ),
  new HumanMessage(
    "Explain JWT authentication."
  ),
]);

console.log(response.content);
```

The conceptual mapping is almost one-to-one.

|Python|JavaScript|
|---|---|
|`langchain_openai`|`@langchain/openai`|
|`invoke()`|`await invoke()`|
|`SystemMessage`|`SystemMessage`|
|`HumanMessage`|`HumanMessage`|
|`AIMessage`|`AIMessage`|

The largest practical difference is that **JavaScript treats nearly all model interactions as asynchronous**, whereas Python provides both synchronous and asynchronous APIs. Other than that, the mental model transfers directly.

---

## 5. Design Rationale and Tradeoffs

The provider abstraction significantly improves portability and maintainability. An application written against `BaseChatModel` can switch from OpenAI to Anthropic, Gemini, Groq, or another supported provider by replacing only the concrete model implementation. The surrounding LCEL pipeline, prompt templates, retrievers, output parsers, and callbacks remain unchanged because they depend on the common Runnable interface rather than vendor-specific SDKs. ([LangChain Reference Docs](https://reference.langchain.com/python/langchain-core/language_models/chat_models/BaseChatModel?utm_source=chatgpt.com "BaseChatModel | langchain_core | LangChain Reference"))

This abstraction is intentionally not perfect. Providers expose different capabilities: some support native structured output, others provide richer tool-calling semantics, some accept images or audio, and context windows and pricing vary considerably. LangChain standardizes the common behaviors but does not attempt to hide genuine provider differences. When an application depends on a provider-specific feature, that dependency should be acknowledged explicitly rather than forced into an artificial abstraction.

The move from string prompts to typed message objects is another deliberate design decision. Message objects preserve conversation structure, enable multimodal inputs, carry metadata, and naturally support future capabilities without changing application code. As AI systems have become increasingly conversational and tool-oriented, this representation has proven substantially more extensible than treating every interaction as plain text.

---

## 6. Practical Application Scenario

Imagine you are building an enterprise AI coding assistant.

A developer asks:

> "Review this pull request and suggest performance improvements."

The execution pipeline begins with a sequence of messages rather than a single prompt:

```text
SystemMessage
"You are a senior performance engineer."

        │

HumanMessage
"Review this pull request."

        │

AIMessage
Initial analysis

        │

ToolMessage
GitHub diff contents

        │

AIMessage
Final review with recommendations
```

Because the model returns structured `AIMessage` objects instead of raw strings, the application can inspect tool requests, token usage, finish reasons, and provider metadata before deciding what to do next. This capability becomes essential when building production systems that retrieve documents, invoke external APIs, execute tools, or coordinate multiple reasoning steps.

By the end of this module, you should recognize that the **chat model is not merely an API wrapper**. Within LangChain, it is a specialized Runnable that transforms conversational message sequences into structured AI messages while insulating the rest of the application from provider-specific protocols. This abstraction forms the foundation for the next module, where those message sequences are generated systematically using **Prompt Templates** rather than being assembled manually.