## 1. Language-agnostic Concept

Before learning LangChain, it is important to understand that **LangChain is not an LLM framework**. The LLM is the intelligence that generates tokens, while LangChain is an **application orchestration framework** that coordinates the movement of data between components involved in an AI application.

Consider a modern GenAI application such as a customer support assistant. A user asks a question, relevant documents must be retrieved from a vector database, the retrieved context must be inserted into a prompt, an LLM must generate an answer, the answer may need to be converted into structured JSON, the conversation history may need to be stored, and the entire execution may need to be streamed to the frontend while being traced for debugging. None of these steps are performed by the LLM itself. They are application logic.

Without a framework, every project ends up implementing the same orchestration code repeatedly. One provider returns dictionaries, another returns custom objects, one embedding model accepts a string while another expects a list of strings, one vector database returns tuples while another returns document objects. Every component exposes a different interface, forcing developers to write adapter code everywhere. Over time, the application becomes tightly coupled to specific providers, making migrations expensive and reducing code reuse.

LangChain exists to solve exactly this architectural problem. Its primary goal is **not** to make LLM calls easier—it is to make every AI component behave through a common execution contract. Whether the component is a prompt template, chat model, retriever, tool, parser, or even an entire workflow, the application interacts with it in exactly the same way. ([LangChain Reference Docs](https://reference.langchain.com/python/langchain-core/runnables/base/Runnable?utm_source=chatgpt.com "Runnable | langchain_core | LangChain Reference"))

This design should immediately feel familiar if you come from backend engineering. In Express, every middleware exposes the same function signature. In Node.js Streams, every stream implements the same streaming contract. In Java's Collections Framework, every collection follows common interfaces despite different internal implementations. LangChain applies exactly the same software engineering principle to GenAI systems.

---

## 2. Mechanism

The architectural foundation of LangChain is the **Runnable** abstraction.

A ==**Runnable**== represents **a unit of computation that transforms one input into one output**. The computation itself is irrelevant to the framework. It might call GPT-5, perform a similarity search in Pinecone, format a prompt, execute a Python function, or parse JSON. From LangChain's perspective, every one of these is simply "something that accepts input and produces output."

Because every component implements the same interface, LangChain can compose them without needing to know anything about their internal implementation.

Conceptually, every Runnable looks like this:

```
Input
   │
   ▼
Runnable
   │
   ▼
Output
```

Now imagine several of these connected together:

```
User Question
      │
      ▼
Prompt Template
      │
      ▼
Chat Model
      │
      ▼
Output Parser
      │
      ▼
Structured Response
```

Notice something important.

None of these components know anything about each other.

The prompt template does not know which model follows it.

The model does not know whether its output will be parsed.

The parser does not know where the prompt originated.

*Each component only guarantees:*

> "Give me my expected input, and I'll produce my documented output."

This is exactly why LangChain calls this **composability**.

Internally, every **Runnable** exposes a standardized execution API instead of provider-specific methods. Current LangChain defines a core set of operations including:

- **`invoke()`** — execute one input
    
- **`batch()`** — execute multiple independent inputs
    
- **`stream()`** — stream output incrementally
    
- **`ainvoke()`, `abatch()`, `astream()`** — asynchronous equivalents
    
- Optional execution configuration for tracing, metadata, tags, concurrency, and runtime behavior
    

Because every Runnable supports this same contract, **any composition automatically inherits synchronous execution, asynchronous execution, batching, and streaming**, without individual components having to reimplement those behaviors. ([LangChain Reference Docs](https://reference.langchain.com/python/langchain-core/runnables/base/Runnable?utm_source=chatgpt.com "Runnable | langchain_core | LangChain Reference"))

This is one of LangChain's most elegant architectural decisions.

---

## 3. Current Python Syntax

The current recommended packages separate the core abstractions into `langchain-core`. The Runnable classes live there.

A minimal custom Runnable is typically created using `RunnableLambda`.

```python
from langchain_core.runnables import RunnableLambda

uppercase = RunnableLambda(lambda text: text.upper())

result = uppercase.invoke("hello world")

print(result)
```

Output:

```text
HELLO WORLD
```

This example does not involve an LLM.

That is intentional.

The important lesson is that **Runnable is a general computation abstraction**, not an AI abstraction.

Now consider another Runnable.

```python
from langchain_core.runnables import RunnableLambda

uppercase = RunnableLambda(lambda text: text.upper())
reverse = RunnableLambda(lambda text: text[::-1])

pipeline = uppercase | reverse

print(pipeline.invoke("langchain"))
```

Output:

```text
NIAHCGNAL
```

Although this example looks trivial, it demonstrates the central idea of LangChain.

Neither Runnable knows about the other.

The framework simply passes the first output into the second input.

The `|` operator constructs a `RunnableSequence`, which is the primary composition primitive in modern LangChain. ([LangChain Reference Docs](https://reference.langchain.com/python/langchain-core/runnables/base/RunnableSequence?utm_source=chatgpt.com "RunnableSequence | langchain_core | LangChain Reference"))

---

## 4. JS Equivalent Note

One of the biggest advantages for you as a Node.js developer is that **langchain.js intentionally preserves the same mental model**.

The packages are different, but the abstraction is identical.

```javascript
import { RunnableLambda } from "@langchain/core/runnables";

const uppercase = RunnableLambda.from(
  (text) => text.toUpperCase()
);

const reverse = RunnableLambda.from(
  (text) => [...text].reverse().join("")
);

const chain = uppercase.pipe(reverse);

console.log(await chain.invoke("langchain"));
```

A few observations are worth making.

First, JavaScript is **async-first**, so `invoke()` generally returns a `Promise`, whereas Python provides both synchronous (`invoke`) and asynchronous (`ainvoke`) variants. Second, Python commonly uses the overloaded `|` operator for composition, while JavaScript uses the explicit `.pipe()` method because the language has no operator overloading facility. Despite this syntactic difference, both create the same conceptual object: a `RunnableSequence`. ([LangChain Reference Docs](https://reference.langchain.com/javascript/langchain-core/runnables/RunnableInterface?utm_source=chatgpt.com "RunnableInterface | @langchain/core | LangChain Reference"))

---

## 5. Design Rationale and Tradeoffs

From a software architecture perspective, Runnable is an application of the **Interface Segregation Principle** and the **Strategy Pattern**.

The framework never asks _what_ a component is. Instead, it asks _can this component behave like a Runnable?_ If the answer is yes, it becomes interchangeable with every other Runnable.

This dramatically reduces coupling. A prompt template can later be replaced by another prompt template. An OpenAI model can later become Anthropic or Gemini. A Pinecone retriever can later become FAISS. The orchestration logic remains unchanged because every component continues to satisfy the Runnable contract.

There is, however, a tradeoff. General-purpose abstractions introduce an additional layer of indirection. When debugging execution, you are often tracing data as it moves through multiple composable units rather than stepping through a single procedural function. Fortunately, modern LangChain provides graph inspection, callbacks, tracing, and LangSmith integration to make these execution paths observable. ([LangChain Reference Docs](https://reference.langchain.com/python/langchain-core/runnables/base/Runnable?utm_source=chatgpt.com "Runnable | langchain_core | LangChain Reference"))

Another tradeoff is conceptual. Developers who are accustomed to imperative code often find LCEL unfamiliar at first because it expresses workflows declaratively. Once you understand that a chain is simply a graph of Runnable transformations, the abstraction becomes much easier to reason about.

---

## 6. Practical Application Scenario

Imagine you are building an internal AI assistant for your company's engineering team.

A developer asks:

> "Why is the payment service returning HTTP 502?"

The execution pipeline might look like this:

```
User Query
      │
      ▼
ChatPromptTemplate
      │
      ▼
Retriever
(Search engineering documentation)
      │
      ▼
Chat Model
(GPT / Claude / Gemini)
      │
      ▼
Structured Output Parser
      │
      ▼
Frontend API Response
```

Each stage is a Runnable.

If you later migrate from OpenAI to Anthropic, only the model Runnable changes.

If you replace Pinecone with Chroma, only the retriever Runnable changes.

If you decide to stream responses instead of waiting for completion, the chain already supports streaming because every component follows the Runnable contract.

This illustrates why **Runnable—not ChatModel, PromptTemplate, or Agent—is the true foundation of LangChain**. Every higher-level abstraction you will encounter in the remainder of this course is itself a Runnable or is designed to compose with one. Once you understand this architectural principle, LCEL, RAG pipelines, tools, structured outputs, and even LangGraph workflows all become variations of the same execution model rather than isolated APIs.