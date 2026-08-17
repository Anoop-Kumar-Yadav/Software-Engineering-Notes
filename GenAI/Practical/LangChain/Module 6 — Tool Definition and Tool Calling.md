The previous five modules established a complete one-way execution pipeline. A prompt template transforms application data into messages, a chat model performs inference, and structured output converts the response into deterministic application objects. At this point, however, the model remains isolated from the outside world. It can only reason over the information contained in its context window. If you ask for the current weather, query a database, send an email, or calculate the contents of a local file, the model cannot perform those actions independently because it has no direct capability to interact with external systems.

Tool calling solves this limitation. Rather than teaching the model _how_ to execute external code, LangChain teaches the model _what capabilities are available_. The model then decides **when** one of those capabilities should be invoked. Importantly, the model never executes Python code itself. It only returns a structured request describing which tool should run and with which arguments. Your application remains responsible for executing the function and returning the result back to the model.

This distinction is one of the most misunderstood concepts in modern LLM systems. **The model reasons; the application executes.**

---

# 1. Setup (Isolated Folder)

Create another completely independent project.

```bash
cd langchain-course

mkdir module-06-tool-calling
cd module-06-tool-calling

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
pydantic==2.11.7
```

Install everything.

```bash
pip install -r requirements.txt
```

Create `.env`.

```env
OPENAI_API_KEY=your_api_key_here
```

---

# 2. Language-Agnostic Concept

A language model has **knowledge**, but it does not have **capabilities**.

For example,

> "What is 234 × 987?"

The model might estimate correctly.

But

> "Read `/var/log/nginx/access.log`."

The model cannot do that.

Similarly,

> "Check today's weather."

The model cannot access the internet.

Likewise,

> "Send Rahul an email."

The model has no SMTP connection.

The limitation is fundamental.

The model executes inside a controlled inference environment.

It has **no direct access** to:

- databases
    
- APIs
    
- files
    
- operating systems
    
- email servers
    
- payment gateways
    
- cloud services
    

Instead, applications expose those capabilities as **tools**.

Conceptually,

```text
User

↓

Model

↓

"I need Tool X"

↓

Application

↓

Execute Tool

↓

Tool Result

↓

Model

↓

Final Answer
```

Notice the separation.

The model never executes the tool.

It only requests its execution.

---

## What Is a Tool?

A tool is simply a callable function accompanied by **machine-readable metadata**.

That metadata describes:

- tool name
    
- description
    
- parameters
    
- parameter types
    
- required fields
    

Conceptually,

```text
Tool

│

├── Name

├── Description

├── Input Schema

└── Function
```

The description is surprisingly important.

The model does not inspect your Python implementation.

It decides whether to use a tool almost entirely from its schema and description.

Poorly written descriptions produce poor tool selection.

---

# 3. Mechanism

Modern providers expose **function calling** (sometimes called tool calling).

Suppose our application defines:

```python
get_weather(city: str)
```

LangChain converts this function into a provider-specific schema.

Conceptually,

```text
Python Function

↓

LangChain Tool

↓

JSON Schema

↓

Provider API
```

When the user asks

> "What's the weather in Delhi?"

the request flow becomes

```text
User Question
        │
        ▼
Chat Model
        │
        ▼
Tool Decision
        │
        ▼
tool_calls
        │
        ▼
Application Executes Function
        │
        ▼
Tool Result
        │
        ▼
ToolMessage
        │
        ▼
Chat Model
        │
        ▼
Final Response
```

The crucial point is that the model **does not** produce the final answer immediately.

Instead it returns something conceptually like

```json
{
  "tool_calls": [
    {
      "name": "get_weather",
      "args": {
        "city": "Delhi"
      }
    }
  ]
}
```

Your application reads this request, executes the corresponding Python function, and then sends the result back to the model as a `ToolMessage`.

Only after seeing the tool result does the model generate its final response.

---

## Why Tool Calling Instead of Prompt Engineering?

Before providers supported function calling, developers often wrote prompts like

> "If weather information is needed, output exactly `CALL_WEATHER(city)`."

The application would then parse the text.

This approach suffered from obvious problems:

- spelling mistakes
    
- formatting inconsistencies
    
- hallucinated commands
    
- ambiguous arguments
    

Tool calling replaces prompt conventions with a formal schema understood by the provider.

Instead of parsing text,

the provider returns structured tool requests.

---

## `@tool`

The easiest way to define a tool is using the `@tool` decorator.

```python
@tool
def get_weather(city: str) -> str:
    ...
```

LangChain automatically extracts:

- function name
    
- parameter names
    
- parameter types
    
- docstring
    
- schema
    

The docstring becomes part of the description presented to the model.

That means documentation is no longer only for developers.

It also guides model behavior.

---

# 4. Current Python Syntax and Implementation

Create `main.py`.

```python
from dotenv import load_dotenv

from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI

load_dotenv()


@tool
def multiply(a: int, b: int) -> int:
    """
    Multiply two integers together.
    Use this tool whenever multiplication is required.
    """
    return a * b


model = ChatOpenAI(
    model="gpt-5",
    temperature=0,
)

model_with_tools = model.bind_tools(
    [multiply]
)

response = model_with_tools.invoke(
    [
        HumanMessage(
            content="What is 27 multiplied by 43?"
        )
    ]
)

print("AI MESSAGE")
print(response)

print("\nTOOL CALLS")
print(response.tool_calls)
```

Run:

```bash
python main.py
```

Example output:

```text
AI MESSAGE

AIMessage(...)

TOOL CALLS

[
    {
        'name': 'multiply',
        'args': {
            'a': 27,
            'b': 43
        },
        'id': 'call_xxxxx'
    }
]
```

Notice something surprising.

The model **did not answer the user**.

It only requested the tool.

This is expected.

We have not yet executed the function.

---

## Executing the Tool

The application now executes the requested tool.

```python
tool_call = response.tool_calls[0]

result = multiply.invoke(
    tool_call["args"]
)

print(result)
```

Output:

```text
1161
```

The `invoke()` method exists because **tools are themselves Runnables**.

Just like prompts.

Just like models.

Just like parsers.

Everything continues to follow the same architecture introduced in Module 1.

---

## Completing the Tool Loop

The full interaction looks like this.

```text
User
 │
 ▼
Chat Model
 │
 ▼
tool_calls
 │
 ▼
Python Function
 │
 ▼
Tool Result
 │
 ▼
ToolMessage
 │
 ▼
Chat Model
 │
 ▼
Final Answer
```

In real applications, LangChain provides higher-level abstractions that automate this loop. Later, when we study LangGraph, this execution cycle becomes one of the graph's core responsibilities.

---

## Tool Schemas

Suppose we define

```python
@tool
def search_products(
    category: str,
    max_price: float,
):
    ...
```

LangChain internally derives a schema similar to

```json
{
  "name": "search_products",
  "parameters": {
    "category": "string",
    "max_price": "number"
  }
}
```

The provider uses this schema to decide:

- whether the tool is appropriate
    
- which arguments should be generated
    
- whether required parameters are missing
    

Notice that the model is no longer inventing arbitrary JSON. It is generating arguments that conform to the declared schema.

---

# 5. JS Equivalent Note

The JavaScript implementation follows the same architecture. Instead of the Python `@tool` decorator, `langchain.js` commonly defines tools using the `tool()` helper together with a Zod schema.

```javascript
import { tool } from "@langchain/core/tools";
import { z } from "zod";

const multiply = tool(
  ({ a, b }) => a * b,
  {
    name: "multiply",
    description: "Multiply two integers.",
    schema: z.object({
      a: z.number(),
      b: z.number(),
    }),
  }
);

const modelWithTools =
  model.bindTools([multiply]);

const response =
  await modelWithTools.invoke(
    "Multiply 27 by 43."
  );

console.log(response.tool_calls);
```

Although the syntax differs, the architecture is identical. Both ecosystems convert tool definitions into provider-compatible schemas, receive structured tool requests from the model, execute application code, and then return the result as a `ToolMessage`.

---

# 6. Design Rationale and Tradeoffs

Tool calling exists because language models should not have unrestricted access to application infrastructure. Instead of allowing arbitrary execution, the application exposes a carefully defined set of capabilities. This creates a clear security boundary: the model can request operations but cannot perform them independently. The application remains responsible for authorization, validation, logging, rate limiting, retries, and error handling.

The quality of tool descriptions has a direct impact on model performance. Ambiguous descriptions often lead to incorrect tool selection or poorly formed arguments. Conversely, overly broad tools that perform many unrelated tasks make it harder for the model to reason about when they should be used. In practice, tools should be narrowly scoped, well documented, and strongly typed.

---

# 7. Practical Application Scenario

Consider an AI customer-support assistant integrated with an e-commerce platform.

```text
Customer Question
        │
        ▼
Chat Model
        │
        ├──────────────┐
        ▼              ▼
Order Lookup     Refund Tool
        │              │
        └──────┬───────┘
               ▼
        Tool Results
               │
               ▼
          Chat Model
               │
               ▼
      Final Customer Reply
```

When a customer asks, "Where is my order?", the model does not fabricate shipping information. Instead, it requests the order lookup tool, receives the real tracking data from the backend, and uses that information to generate the final response. This architecture combines the reasoning ability of the model with the reliability of authoritative business systems.

---

# 8. Quick-Reference Syntax Recap

```python
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI

@tool
def multiply(a: int, b: int) -> int:
    """Multiply two integers."""
    return a * b

model = ChatOpenAI(model="gpt-5")

model = model.bind_tools([multiply])

response = model.invoke(
    "Multiply 12 by 9."
)

print(response.tool_calls)
```

## What You Learned

This module introduced the transition from **reasoning** to **action**. You learned that tools are ordinary application functions enriched with schemas that describe their capabilities to the model. The model never executes those functions directly; instead, it returns structured `tool_calls`, leaving execution under the application's control. LangChain automatically derives tool schemas from Python functions and exposes them through the provider's tool-calling API, allowing models to request capabilities such as database access, API calls, calculations, or file operations in a structured and reliable manner.

In the next module, we will build on this idea by exploring **Retrieval-Augmented Generation (RAG)**. Rather than calling imperative tools, a retriever becomes another Runnable that fetches relevant knowledge from vector stores and injects it into the prompt, allowing models to answer questions using external documents instead of relying solely on their training data.