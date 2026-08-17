
---

# 1. Setup (Isolated Folder)

Before we discuss any concepts, we'll create an independent project for this module. This folder will never depend on code from future modules. Even if LangChain changes significantly a year from now, this directory will remain a self-contained reference for understanding the core abstraction.

Create the project:

```bash
mkdir langchain-course
cd langchain-course

mkdir module-01-why-langchain
cd module-01-why-langchain

python3 -m venv .venv

# Linux / macOS
source .venv/bin/activate

# Windows
# .venv\Scripts\activate

touch main.py
touch .env
touch requirements.txt
```

Populate `requirements.txt`:

```text
langchain==1.0.3
langchain-openai==1.3.3
python-dotenv==1.1.1
```

> **Why these packages?**
> 
> - **`langchain`** contains the core framework and Runnable architecture.
>     
> - **`langchain-openai`** provides the OpenAI model integration. Provider integrations now live in separate packages instead of the main framework.
>     
> - **`python-dotenv`** loads environment variables from a `.env` file.
>     

This package separation is the **current LangChain architecture**. Older tutorials frequently import everything directly from `langchain`; those tutorials target the pre-1.0 ecosystem and should be recognized as legacy patterns rather than copied into new projects. ([Docs by LangChain](https://docs.langchain.com/oss/python/langchain/install?utm_source=chatgpt.com "Install LangChain - Docs by LangChain"))

Install everything:

```bash
pip install -r requirements.txt
```

Create `.env`

```env
OPENAI_API_KEY=your_openai_api_key_here
```

Verify installation:

```bash
python -c "import langchain; print('LangChain installed successfully')"
```

At this point, the environment is completely ready.

---

# 2. Language-Agnostic Concept

Before understanding LangChain, we should first understand **why frameworks like LangChain exist at all**.

Imagine you are building an AI application without any framework. Your application must perform several responsibilities:

1. Receive user input.
    
2. Format a prompt.
    
3. Send an HTTP request to an LLM provider.
    
4. Wait for the response.
    
5. Parse the response.
    
6. Possibly call external APIs.
    
7. Retrieve documents.
    
8. Maintain conversation history.
    
9. Handle streaming.
    
10. Switch providers if business requirements change.
    

None of these tasks are individually difficult. The problem is that **every provider exposes a different SDK, different request format, different response structure, different streaming API, and different capabilities.** As your application grows, the majority of your code becomes integration glue rather than business logic.

This is exactly the software engineering problem that LangChain addresses.

LangChain is **not** an AI model.

LangChain is **not** an agent.

LangChain is **not** a prompt library.

Instead, LangChain is an **application composition framework**. It standardizes how independent AI-related components communicate with one another so that they become interchangeable.

The key word here is **composition**.

Modern AI systems are built by composing many small computation units together instead of writing one enormous procedural function.

This design philosophy is identical to ideas you've already encountered elsewhere:

|Ecosystem|Small composable unit|
|---|---|
|Express|Middleware|
|React|Component|
|Unix|Pipe|
|Node Streams|Stream|
|RxJS|Observable|
|LangChain|Runnable|

This single idea explains almost the entire architecture.

---

# 3. Mechanism

Everything inside LangChain revolves around one interface:

> **Runnable**

A Runnable is simply **any object capable of performing a computation**.

That computation might be:

- generating text,
    
- formatting a prompt,
    
- retrieving documents,
    
- calling a database,
    
- executing Python code,
    
- invoking another API,
    
- parsing JSON,
    
- splitting text,
    
- embedding vectors,
    
- calling tools.
    

Notice how different those operations are.

Internally, LangChain doesn't care.

It only asks one question:

> **Can this object receive an input and produce an output?**

If yes, it is a Runnable.

Because every component shares exactly the same execution interface, they become composable.

Conceptually:

```text
Input
   │
   ▼
Runnable A
   │
   ▼
Runnable B
   │
   ▼
Runnable C
   │
   ▼
Output
```

The remarkable part is that Runnable A might be a prompt template, Runnable B might be GPT-5, and Runnable C might be a JSON parser.

They know nothing about one another.

They only agree on the Runnable contract.

The Runnable interface primarily exposes three execution methods:

|Method|Purpose|
|---|---|
|`invoke()`|Execute once|
|`batch()`|Execute many inputs simultaneously|
|`stream()`|Produce incremental output|

Later modules will introduce additional asynchronous variants, but these three methods define the mental model.

This uniform interface is what makes LangChain composable.

---

# 4. Current Python Syntax and Implementation

Although Module 1 focuses on concepts rather than building complex chains, we'll still write a runnable program that demonstrates the first Runnable you'll encounter: a **Chat Model**.

Create `main.py`

```python
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv()

model = ChatOpenAI(
    model="gpt-5",
    temperature=0
)

response = model.invoke(
    "In one sentence, explain what LangChain is."
)

print(response.content)
```

Run:

```bash
python main.py
```

Expected output:

```text
LangChain is a framework for composing applications built from language models using standardized, reusable components.
```

Although this program appears simple, something very important just happened.

You did **not** manually:

- create an HTTP request,
    
- serialize JSON,
    
- authenticate,
    
- parse the response,
    
- retry failures,
    
- convert response objects.
    

Instead:

```text
Your Program
      │
      ▼
ChatOpenAI
      │
      ▼
Runnable.invoke()
      │
      ▼
OpenAI API
      │
      ▼
AIMessage
```

The `ChatOpenAI` class is already a Runnable.

Calling

```python
model.invoke(...)
```

is **not** calling OpenAI directly.

You're executing a Runnable.

This distinction becomes incredibly important once we start composing many Runnables together.

---

# 5. JS Equivalent Note

If you're coming from Node.js, the mental model is identical.

```javascript
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  model: "gpt-5",
  temperature: 0,
});

const response = await model.invoke(
  "Explain LangChain."
);

console.log(response.content);
```

The most noticeable difference is that **langchain.js is async-first** because JavaScript's ecosystem is fundamentally promise-based, whereas Python exposes both synchronous (`invoke`) and asynchronous (`ainvoke`) APIs. Apart from that execution model, both ecosystems share the same Runnable abstraction and nearly identical terminology. ([Docs by LangChain](https://docs.langchain.com/oss/javascript/langchain/install?utm_source=chatgpt.com "Install LangChain - Docs by LangChain"))

---

# 6. Design Rationale and Tradeoffs

The Runnable abstraction exists because AI applications consist of heterogeneous components that nevertheless share a common execution pattern: each accepts input, performs computation, and emits output. By standardizing this lifecycle, LangChain enables prompt templates, models, retrievers, output parsers, tools, and even custom Python functions to participate in the same composition pipeline without requiring adapter code for every combination.

This abstraction introduces a small amount of framework overhead, as each stage is wrapped in a common execution interface rather than being invoked directly. In exchange, developers gain significantly greater composability, testability, and provider independence. As applications grow beyond a single model invocation into retrieval, tool use, structured outputs, and multi-step workflows, the benefits of this uniform interface quickly outweigh its modest complexity.

For very small scripts that make only one API call, LangChain is often unnecessary. Calling an SDK such as the OpenAI Python client directly is simpler and has fewer dependencies. LangChain becomes valuable when an application must coordinate multiple AI-related operations while remaining modular and extensible.

---

# 7. Practical Application Scenario

Consider a production customer-support assistant. A typical request flows through several distinct stages:

```text
User Question
      │
      ▼
Prompt Template
      │
      ▼
Retriever
      │
      ▼
Chat Model
      │
      ▼
Structured Output Parser
      │
      ▼
Business Logic
      │
      ▼
HTTP Response
```

Each stage is a Runnable with the same execution contract. This means the retriever can later be replaced with a different vector database, the chat model can be switched from OpenAI to Anthropic, or the parser can be replaced with a schema-based structured output mechanism—all without changing the surrounding pipeline. That composability is the primary architectural value LangChain provides in production systems.

---

# 8. Quick-Reference Syntax Recap

```python
from langchain_openai import ChatOpenAI

model = ChatOpenAI(
    model="gpt-5",
    temperature=0,
)

response = model.invoke("Hello!")

print(response.content)
```

## What You Learned

By the end of this module, you should have a clear mental model of the framework:

- **LangChain is an application composition framework**, not an LLM.
    
- **Runnable** is the foundational abstraction that unifies every executable component.
    
- Every Runnable exposes a consistent execution interface, most notably `invoke()`, `batch()`, and `stream()`.
    
- Models, prompts, retrievers, tools, and parsers are all Runnables, which is why they can be composed into larger workflows without bespoke integration code.
    
- This compositional architecture underpins every subsequent module, including LCEL, RAG pipelines, tool calling, and LangGraph-based agents.