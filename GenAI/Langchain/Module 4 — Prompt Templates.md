## 1. Language-agnostic Concept

A prompt is **not merely text**. It is a parameterized specification of the information that will be sent to a language model. As GenAI applications become more sophisticated, prompts stop being static strings and instead become **reusable templates** whose variables are populated at runtime. This separation between a prompt's structure and its dynamic values is the same design principle used by SQL prepared statements, HTML templating engines, and server-side rendering frameworks. The template defines the shape of the request, while the application supplies the runtime data.

Without prompt templates, developers typically build prompts through string concatenation or interpolation.

```python
prompt = (
    f"You are a tutor.\n"
    f"Question: {question}\n"
    f"Difficulty: {level}"
)
```

Although simple, this approach quickly becomes difficult to maintain. It mixes application logic with prompt construction, makes variable validation harder, complicates reuse, and becomes increasingly fragile when prompts grow to hundreds of lines or require conversation history, few-shot examples, retrieved documents, or tool outputs.

LangChain treats prompts as **first-class executable objects** rather than plain strings. A prompt template is itself a Runnable whose responsibility is to transform structured application data into the format expected by a language model. This is an important conceptual shift. The prompt is no longer "text waiting to be sent"; it is **a computation that produces a prompt**.

There are two major prompt abstractions:

- **`PromptTemplate`** — produces a single formatted string.
    
- **`ChatPromptTemplate`** — produces a structured list of chat messages.
    

Current LangChain documentation recommends `ChatPromptTemplate` for modern chat models because providers have standardized around message-based APIs rather than single-string completion APIs. ([LangChain Reference](https://reference.langchain.com/python/langchain-core/prompts/chat/ChatPromptTemplate?utm_source=chatgpt.com "ChatPromptTemplate | langchain_core | LangChain Reference"))

---

## 2. Mechanism

Internally, a prompt template performs only one responsibility:

> **Structured application input → Prompt representation**

For a traditional prompt template, the output is a formatted string.

```text
{
    topic: "JWT"
}
        │
        ▼
PromptTemplate
        │
        ▼
"Explain JWT."
```

For chat models, the output is different.

```text
{
    topic: "JWT"
}
        │
        ▼
ChatPromptTemplate
        │
        ▼
[
  SystemMessage(...),
  HumanMessage(...)
]
```

Notice that **ChatPromptTemplate does not call the LLM**.

Its job ends after constructing a `ChatPromptValue`, which contains an ordered list of typed messages. That output is then passed into the next Runnable, usually a `ChatModel`. ([LangChain Reference](https://reference.langchain.com/python/langchain-core/prompts/chat/ChatPromptTemplate?utm_source=chatgpt.com "ChatPromptTemplate | langchain_core | LangChain Reference"))

The execution pipeline therefore looks like this:

```text
Application Data
        │
        ▼
ChatPromptTemplate
        │
        ▼
ChatPromptValue
(messages)
        │
        ▼
Chat Model
        │
        ▼
AIMessage
```

This design aligns perfectly with the Runnable abstraction introduced earlier. Since prompt templates are Runnables, they can be composed directly using LCEL.

```text
ChatPromptTemplate
        │
        ▼
Chat Model
        │
        ▼
Output Parser
```

Every stage simply transforms one representation into another.

---

### Why ChatPromptTemplate instead of PromptTemplate?

Suppose we want to build this conversation.

```text
System:
You are a backend architect.

Human:
Explain JWT authentication.
```

If we used one large string, the framework would lose the semantic distinction between system instructions and user input.

```text
You are a backend architect.

Explain JWT authentication.
```

Modern providers expect these roles to remain separate because they influence model behavior differently. `ChatPromptTemplate` preserves that structure by producing typed messages instead of flattening everything into one string. LangChain then converts those messages into the provider-specific request format automatically. ([LangChain Reference](https://reference.langchain.com/python/langchain-core/prompts/chat/ChatPromptTemplate?utm_source=chatgpt.com "ChatPromptTemplate | langchain_core | LangChain Reference"))

---

## 3. Current Python Syntax

### PromptTemplate

`PromptTemplate` is appropriate when interacting with completion-style models or whenever a downstream Runnable expects plain text.

```python
from langchain_core.prompts import PromptTemplate

prompt = PromptTemplate.from_template(
    "Explain {topic} in simple terms."
)

print(
    prompt.invoke(
        {"topic": "JWT"}
    ).text
)
```

The important observation is that `invoke()` executes the template itself. It does **not** call an LLM.

---

### ChatPromptTemplate

For modern chat models, the recommended abstraction is `ChatPromptTemplate`.

```python
from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages(
    [
        ("system",
         "You are a senior backend engineer."),
        ("human",
         "{question}"),
    ]
)

messages = prompt.invoke(
    {
        "question":
        "Explain JWT authentication."
    }
)

print(messages.messages)
```

Notice something subtle.

The template accepts **structured data**, not raw text.

```python
{
    "question":
    "Explain JWT authentication."
}
```

The output is **not** a string.

It is a `ChatPromptValue` containing typed message objects. ([LangChain Reference](https://reference.langchain.com/python/langchain-core/prompts/chat/ChatPromptTemplate?utm_source=chatgpt.com "ChatPromptTemplate | langchain_core | LangChain Reference"))

---

### Prompt as the first Runnable

Because prompt templates implement the Runnable interface, they become the first stage of an LCEL pipeline.

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

prompt = ChatPromptTemplate.from_messages(
    [
        ("system",
         "You are a helpful assistant."),
        ("human",
         "{question}"),
    ]
)

model = ChatOpenAI(
    model="gpt-5-nano"
)

chain = prompt | model

response = chain.invoke(
    {
        "question":
        "What is OAuth?"
    }
)

print(response.content)
```

Notice that we never call `prompt.invoke()` manually.

LCEL automatically executes:

1. Prompt template
    
2. Chat model
    

because both are Runnables.

---

### MessagesPlaceholder

One of the most powerful features of `ChatPromptTemplate` is **`MessagesPlaceholder`**.

Its purpose is to inject an existing list of messages into a prompt at runtime without knowing their length beforehand.

```python
from langchain_core.prompts import (
    ChatPromptTemplate,
    MessagesPlaceholder,
)

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a helpful assistant.",
        ),
        MessagesPlaceholder(
            "history",
            optional=True,
        ),
        (
            "human",
            "{question}",
        ),
    ]
)
```

If `history` contains twenty previous messages, all twenty are inserted.

If it contains none, the placeholder contributes nothing (because `optional=True`).

This mechanism is the foundation of conversational applications and is later used by `RunnableWithMessageHistory`. ([LangChain Reference](https://reference.langchain.com/python/langchain-core/prompts/chat/MessagesPlaceholder?utm_source=chatgpt.com "MessagesPlaceholder | langchain_core | LangChain Reference"))

---

### Partial Variables

Sometimes parts of a prompt never change.

Instead of supplying them repeatedly, LangChain allows them to be bound once.

```python
from langchain_core.prompts import PromptTemplate

prompt = PromptTemplate.from_template(
    "{role}\n\nQuestion: {question}"
)

backend_prompt = prompt.partial(
    role="You are a backend architect."
)

print(
    backend_prompt.invoke(
        {
            "question":
            "Explain Redis."
        }
    ).text
)
```

After calling `partial()`, only `question` remains a required input. This reduces duplication and helps centralize stable system instructions. ([LangChain Reference](https://reference.langchain.com/python/langchain-core/prompts/chat/ChatPromptTemplate?utm_source=chatgpt.com "ChatPromptTemplate | langchain_core | LangChain Reference"))

---

## 4. JS Equivalent Note

The JavaScript API closely mirrors Python. The package names follow the npm convention, but the underlying abstractions remain the same.

```javascript
import { ChatPromptTemplate }
from "@langchain/core/prompts";

const prompt =
  ChatPromptTemplate.fromMessages([
    [
      "system",
      "You are a backend engineer.",
    ],
    [
      "human",
      "{question}",
    ],
  ]);

const messages =
  await prompt.invoke({
    question:
      "Explain JWT authentication.",
  });
```

Conversation history is represented using a placeholder in the same way.

```javascript
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";

const prompt =
  ChatPromptTemplate.fromMessages([
    [
      "system",
      "You are an assistant.",
    ],
    new MessagesPlaceholder(
      "history"
    ),
    [
      "human",
      "{question}",
    ],
  ]);
```

The conceptual mapping between Python and JavaScript is almost identical because prompt templates belong to `langchain-core` in both ecosystems. ([LangChain Reference](https://reference.langchain.com/javascript/langchain-core/prompts/ChatPromptTemplate?utm_source=chatgpt.com "ChatPromptTemplate | @langchain/core | LangChain Reference"))

---

## 5. Design Rationale and Tradeoffs

Prompt templates embody the principle of **separating prompt definition from runtime data**. Instead of scattering string interpolation throughout the codebase, prompts become reusable, testable components that validate required variables and integrate naturally with the Runnable execution model. Since they are ordinary Runnables, they participate in batching, composition, tracing, and graph inspection just like models or retrievers.

The distinction between `PromptTemplate` and `ChatPromptTemplate` reflects the evolution of LLM APIs rather than an arbitrary framework decision. Completion-style models consume a single string, whereas modern chat models consume ordered messages with semantic roles. Preserving that structure enables capabilities such as tool calling, multimodal inputs, conversation history, and provider-specific optimizations without requiring developers to manually format provider prompts.

There are tradeoffs. Prompt templates introduce an additional abstraction layer compared to direct string formatting, and developers unfamiliar with message-based prompting may initially find typed message construction more verbose. However, this explicit structure becomes increasingly valuable as applications grow beyond simple one-shot prompts into conversational systems, RAG pipelines, and agent workflows.

---

## 6. Practical Application Scenario

Consider building an AI code review service integrated with GitHub.

Every pull request follows the same high-level instruction:

> "Review the code for correctness, performance, security, and maintainability."

Only the code diff changes.

Instead of reconstructing the entire prompt every request, the application defines a reusable `ChatPromptTemplate`:

```text
System:
You are a senior backend reviewer.

History:
(previous review discussion)

Human:
Review this diff:

{git_diff}
```

At runtime:

1. The GitHub integration fetches the latest diff.
    
2. Previous review comments are injected through a `MessagesPlaceholder`.
    
3. The template produces a structured message sequence.
    
4. The resulting messages are passed directly to the chat model.
    
5. The remainder of the LCEL pipeline performs structured output parsing or tool invocation.
    

This separation allows the prompt to evolve independently of the application logic. Product teams can refine system instructions, introduce few-shot examples, or adjust conversational context without changing the orchestration code. As a result, prompt engineering becomes a modular concern rather than being intertwined with business logic, which is one of the key architectural goals of modern LangChain.