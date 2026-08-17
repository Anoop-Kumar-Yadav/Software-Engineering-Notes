## 1. Language-agnostic Concept

Up to this point in the curriculum, every model interaction has shared the same limitation: **the model could only generate tokens from its internal knowledge and the context supplied in the prompt**. Regardless of how sophisticated the prompt was, the model itself could not query a database, call an API, execute Python code, send an email, or inspect the current weather. It could only _describe_ what should happen.

Tool calling fundamentally changes that architecture. Instead of asking the model to produce the final answer directly, the application gives the model access to a set of **capabilities**. Each capability is represented by a tool with a clearly defined name, description, and input schema. During inference, the model decides whether it has enough information to answer immediately or whether one of the available tools should be invoked first. The model does not execute the tool itself; it merely requests that the application execute it. ([Docs by LangChain](https://docs.langchain.com/oss/python/langchain/models?utm_source=chatgpt.com "Models - Docs by LangChain"))

This distinction is extremely important.

A tool is **not a function the model can run**.

A tool is **a contract between the model and the application**.

The model's responsibility ends when it produces a structured tool request. The application's responsibility begins by executing the corresponding function, obtaining its result, and feeding that result back into the conversation.

This architecture separates **reasoning** from **execution**.

```text
LLM
│
├── Decides which tool is needed
│
▼
Application
│
├── Executes real code
│
▼
External World
(Database, API, Filesystem, etc.)
```

This separation is one of the defining characteristics of modern AI systems. The LLM becomes a planner and decision-maker rather than an execution engine.

---

## 2. Mechanism

Modern LangChain follows a standardized tool-calling protocol shared by providers such as OpenAI, Anthropic, Gemini, and others.

The lifecycle consists of four stages.

```text
User
 │
 ▼
Chat Model
(with bound tools)
 │
 ▼
AIMessage
(tool_calls)
 │
 ▼
Application executes tool
 │
 ▼
ToolMessage
 │
 ▼
Chat Model
 │
 ▼
Final AIMessage
```

Let's examine each stage.

### Stage 1 — Tool Registration

Before inference begins, the application defines one or more tools and binds them to the model.

The binding step does **not** execute anything.

It simply tells the model:

> "These capabilities are available if you decide you need them."

Internally, LangChain converts every tool into a JSON schema describing:

- tool name
    
- description
    
- input arguments
    
- argument types
    
- required fields
    

That schema is transmitted alongside the model request. The provider then exposes those tools to the model during inference. ([Docs by LangChain](https://docs.langchain.com/oss/python/langchain/models?utm_source=chatgpt.com "Models - Docs by LangChain"))

---

### Stage 2 — Model Decision

Suppose the user asks:

> "What's the weather in Tokyo?"

The model evaluates two possibilities.

```text
Can I answer directly?
        │
        ├── Yes → Generate text
        │
        └── No
             │
             ▼
Generate tool call
```

Instead of returning natural language, the model may return something conceptually similar to:

```json
{
  "tool_calls": [
    {
      "name": "get_weather",
      "args": {
        "city": "Tokyo"
      }
    }
  ]
}
```

Notice something crucial.

**The weather function has not executed.**

The model has only requested that it be executed.

---

### Stage 3 — Tool Execution

The application inspects the returned `AIMessage`.

If `tool_calls` is empty:

```text
Return answer to user.
```

Otherwise:

```text
For each tool call:

find tool
        │
execute function
        │
collect result
```

This stage belongs entirely to the application.

The LLM is idle during this period.

---

### Stage 4 — Returning the Result

The application wraps the tool output inside a `ToolMessage`.

```text
ToolMessage
│
├── tool_call_id
├── content
```

The `tool_call_id` links the tool result to the original tool request so the model can correlate them correctly. The updated conversation—including the original request, the AI's tool call, and the `ToolMessage`—is then sent back to the model, which produces the final natural-language response. ([Docs by LangChain](https://docs.langchain.com/oss/python/langchain/models?utm_source=chatgpt.com "Models - Docs by LangChain"))

---

## 3. Current Python Syntax

### Defining a Tool

The recommended approach is the `@tool` decorator.

```python
from langchain.tools import tool

@tool
def get_weather(city: str) -> str:
    """Return the current weather for a city."""
    return f"It is sunny in {city}."
```

Notice two important details.

First, **type hints are mandatory** because they define the tool's input schema. Second, the docstring is not merely documentation for developers; it becomes part of the information the model uses to decide _when_ the tool should be selected. A vague description leads to poorer tool-selection behavior. ([Docs by LangChain](https://docs.langchain.com/oss/python/langchain/tools?utm_source=chatgpt.com "Tools - Docs by LangChain"))

---

### Binding Tools

The tool is then attached to the model.

```python
from langchain_openai import ChatOpenAI

model = ChatOpenAI(
    model="gpt-5-nano"
)

model_with_tools = model.bind_tools(
    [get_weather]
)
```

`bind_tools()` does not modify the original model.

It returns another Runnable.

```text
ChatOpenAI
        │
bind_tools()
        │
        ▼
Runnable
```

This means the bound model still composes naturally with LCEL. ([LangChain Reference](https://reference.langchain.com/python/langchain-core/language_models/chat_models/BaseChatModel/bind_tools?utm_source=chatgpt.com "bind_tools | langchain_core | LangChain Reference"))

---

### Invoking the Model

```python
response = model_with_tools.invoke(
    "What's the weather in Tokyo?"
)
```

The returned value is still an `AIMessage`.

However, instead of textual content, it may contain tool requests.

```python
print(response.tool_calls)
```

Conceptually:

```python
[
    {
        "name": "get_weather",
        "args": {
            "city": "Tokyo"
        },
        "id": "call_abc123"
    }
]
```

Notice again:

The weather function has **not** been executed.

---

### Executing the Tool

The application performs this step.

```python
for tool_call in response.tool_calls:
    result = get_weather.invoke(tool_call)
```

The returned value is a `ToolMessage`, already associated with the correct `tool_call_id`. This message can be appended to the conversation and sent back to the model for its final response. ([Docs by LangChain](https://docs.langchain.com/oss/python/langchain/models?utm_source=chatgpt.com "Models - Docs by LangChain"))

The overall execution loop therefore becomes:

```text
User
 │
 ▼
AIMessage
(tool_calls)
 │
 ▼
Application
 │
 ▼
ToolMessage
 │
 ▼
AIMessage
(final answer)
```

This manual loop is useful for understanding the architecture. In later modules, you'll see that LangGraph automates this orchestration.

---

## 4. JS Equivalent Note

The JavaScript API is intentionally almost identical.

Tool definitions use Zod for runtime schemas.

```javascript
import { tool } from "langchain";
import { z } from "zod";

const getWeather = tool(
  ({ city }) => {
    return `It is sunny in ${city}.`;
  },
  {
    name: "get_weather",
    description: "Get weather for a city.",
    schema: z.object({
      city: z.string(),
    }),
  }
);
```

Binding follows the same pattern.

```javascript
const modelWithTools =
  model.bindTools([getWeather]);

const response =
  await modelWithTools.invoke(
    "What's the weather in Tokyo?"
  );

console.log(response.tool_calls);
```

The conceptual mapping is straightforward.

|Python|JavaScript|
|---|---|
|`@tool`|`tool()`|
|Type hints|Zod schema|
|`bind_tools()`|`bindTools()`|
|`AIMessage.tool_calls`|`AIMessage.tool_calls`|

The principal difference arises from the host language. Python derives schemas from type annotations, whereas JavaScript requires an explicit runtime schema because TypeScript types are erased during compilation. ([Docs by LangChain](https://docs.langchain.com/oss/javascript/langchain/tools?utm_source=chatgpt.com "Tools - Docs by LangChain"))

---

## 5. Design Rationale and Tradeoffs

The tool abstraction exists because language models excel at reasoning but cannot safely or reliably interact with external systems on their own. By separating decision-making from execution, LangChain allows the model to determine _what_ should happen while leaving _how_ it happens under application control. This improves security, observability, and reliability because every tool invocation passes through ordinary application code where permissions, validation, retries, logging, and rate limits can be enforced. ([Docs by LangChain](https://docs.langchain.com/oss/python/langchain/tools?utm_source=chatgpt.com "Tools - Docs by LangChain"))

The quality of a tool is determined far more by its schema than by its implementation. From the model's perspective, the implementation is invisible. It only sees the tool's name, description, and input schema. Consequently, concise and unambiguous descriptions are critical. A description such as "Search database" is far less effective than "Search the customer database for user records by email or customer ID." Well-designed schemas reduce ambiguity and improve tool-selection accuracy.

Tool calling also introduces additional latency. Every tool invocation requires at least one extra round trip: the model requests the tool, the application executes it, and the updated conversation is sent back to the model. If multiple tools are required, this loop repeats. For workflows that never need external information or actions, ordinary prompting remains simpler and faster.

---

## 6. Practical Application Scenario

Imagine you are building an AI backend assistant for an e-commerce platform.

The application exposes three tools:

```text
search_products(query)
check_inventory(product_id)
create_order(product_id, quantity)
```

A user asks:

> "Can I buy two Logitech MX Master 3S mice?"

The execution proceeds conceptually as follows.

```text
HumanMessage
        │
        ▼
Chat Model
        │
        ▼
AIMessage
tool_calls:
search_products(...)
        │
        ▼
Application executes search
        │
        ▼
ToolMessage
        │
        ▼
Chat Model
        │
        ▼
AIMessage
tool_calls:
check_inventory(...)
        │
        ▼
Application executes inventory lookup
        │
        ▼
ToolMessage
        │
        ▼
Chat Model
        │
        ▼
Final AIMessage
```

Notice that the model performs **planning**, not execution. It determines which information is needed and in what order, while the application remains responsible for interacting with databases, APIs, and business logic. This separation is what makes tool calling safe enough for production systems.

This naturally leads to the next question: **what happens when the model needs to retrieve information from millions of documents rather than invoking discrete business functions?** That problem is addressed by **Retrieval-Augmented Generation (RAG)**, where the "tool" is no longer a single function but an entire retrieval pipeline built from documents, embeddings, vector stores, and retrievers. That is the focus of **Module 7**.