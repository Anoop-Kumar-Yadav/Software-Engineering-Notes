
Module 1 introduced the **Runnable** as the universal execution abstraction. This module answers the next architectural question: **if every component is a Runnable, how are multiple Runnables connected together into an application?** The answer is **LCEL (LangChain Expression Language)**, which is the composition layer of LangChain. Almost every modern LangChain example, from simple prompt pipelines to RAG systems and agents, is fundamentally an LCEL graph.

---

# 1. Setup (Isolated Folder)

Create a completely new project. Nothing from Module 1 is reused except your understanding.

```bash
cd langchain-course

mkdir module-02-lcel
cd module-02-lcel

python3 -m venv .venv

# Linux / macOS
source .venv/bin/activate

# Windows
# .venv\Scripts\activate

touch main.py
touch .env
touch requirements.txt
```

`requirements.txt`

```text
langchain==1.0.3
langchain-core==1.0.3
langchain-openai==1.3.3
python-dotenv==1.1.1
```

Install dependencies.

```bash
pip install -r requirements.txt
```

Create `.env`

```env
OPENAI_API_KEY=your_openai_api_key_here
```

---

# 2. Language-Agnostic Concept

Suppose you are writing an AI application without LangChain.

Your code probably looks conceptually like this:

```text
User Input

↓

Create Prompt

↓

Call LLM

↓

Extract Text

↓

Parse Output

↓

Return Result
```

Each step receives data from the previous step.

This is **function composition**.

If we express it mathematically,

```text
result = parser(
            llm(
                prompt(
                    input
                )
            )
         )
```

Nothing about this idea is AI-specific.

Backend systems perform the same operation every day.

An Express application composes middleware.

A Unix shell composes commands.

A React application composes components.

A compiler composes passes.

A machine-learning pipeline composes preprocessing, inference, and postprocessing.

Every stage transforms data.

AI applications are no different.

Instead of writing procedural code like:

```python
prompt = prompt_template.invoke(...)
response = model.invoke(prompt)
answer = parser.invoke(response)
```

LangChain lets you describe the **pipeline itself**.

That description is LCEL.

Instead of describing **how** each function calls the next, you describe **how data flows**.

This distinction is subtle but fundamental.

---

# 3. Mechanism

LCEL stands for **LangChain Expression Language**.

It is not another programming language.

It is a declarative way of composing Runnables.

Internally, every LCEL expression eventually becomes another Runnable.

Consider:

```python
prompt | model | parser
```

This is not three independent operations.

This expression constructs a brand-new Runnable representing the entire pipeline.

Conceptually:

```text
PromptTemplate
        │
        ▼
 Chat Model
        │
        ▼
 Output Parser
```

Internally, LangChain creates something conceptually similar to:

```text
RunnableSequence(
    [
        PromptTemplate,
        ChatModel,
        OutputParser
    ]
)
```

Notice what happened.

Three independent Runnables became one Runnable.

Because the sequence itself is also a Runnable, it exposes exactly the same interface:

- `invoke()`
    
- `batch()`
    
- `stream()`
    

This recursive design is one of LangChain's strongest architectural decisions.

A chain is just another Runnable.

A retriever is a Runnable.

An agent is a Runnable.

A LangGraph node is ultimately executed as a Runnable.

Everything shares one execution model.

---

## Why the Pipe Operator?

Python already has operators that combine values.

LCEL overloads the `|` operator to mean:

> "Take the output of the Runnable on the left and feed it into the Runnable on the right."

It is equivalent to building a `RunnableSequence`.

These two expressions are conceptually identical.

```python
chain = prompt | model | parser
```

and

```python
chain = RunnableSequence(
    first=prompt,
    middle=model,
    last=parser
)
```

The first version is dramatically easier to read.

As pipelines become larger, readability becomes increasingly important.

---

## Why LCEL Replaced Legacy Chains

Older versions of LangChain introduced many specialized classes:

- `LLMChain`
    
- `ConversationChain`
    
- `SequentialChain`
    
- `TransformChain`
    
- many others
    

Each solved one particular composition problem.

As the ecosystem grew, the number of specialized chain classes exploded.

Different chains behaved differently.

Different constructor arguments existed.

Different extension mechanisms existed.

Instead of maintaining dozens of chain subclasses, LangChain unified everything around one abstraction:

> Every computation is a Runnable.

> Every pipeline is Runnable composition.

This dramatically simplified the architecture.

Today, if you encounter `LLMChain` in older tutorials, recognize it as a historical API rather than the recommended approach.

---

# 4. Current Python Syntax and Implementation

Now we'll build our first real LCEL pipeline.

Create `main.py`.

```python
from dotenv import load_dotenv

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

load_dotenv()

# Stage 1: Prompt Runnable
prompt = ChatPromptTemplate.from_messages(
    [
        ("system", "You are a Python teacher."),
        ("human", "Explain {topic} in two sentences.")
    ]
)

# Stage 2: Model Runnable
model = ChatOpenAI(
    model="gpt-5",
    temperature=0
)

# Stage 3: Output Parser Runnable
parser = StrOutputParser()

# Compose the pipeline
chain = prompt | model | parser

# Execute the entire pipeline
response = chain.invoke(
    {
        "topic": "decorators"
    }
)

print(response)
```

Run the application.

```bash
python main.py
```

Expected output:

```text
Decorators are functions that wrap other functions to modify their behavior without changing their source code. They are commonly used for logging, authentication, caching, and other reusable behaviors.
```

Notice how little orchestration code you wrote.

You never manually passed the prompt into the model.

You never manually extracted `.content`.

You never manually passed the AI message into the parser.

LCEL automatically connected every Runnable.

---

## What Happens Internally?

When you execute

```python
chain.invoke(
    {
        "topic": "decorators"
    }
)
```

LangChain performs something conceptually similar to:

```text
Input Dictionary
        │
        ▼
ChatPromptTemplate.invoke()
        │
        ▼
ChatPromptValue
        │
        ▼
ChatOpenAI.invoke()
        │
        ▼
AIMessage
        │
        ▼
StrOutputParser.invoke()
        │
        ▼
String
```

Notice that every stage receives exactly the output type produced by the previous stage.

No glue code is required.

---

## Data Types Matter

One of the easiest mistakes beginners make is assuming every Runnable accepts and returns strings.

It does not.

Each Runnable has its own input and output types.

For our pipeline:

|Runnable|Input|Output|
|---|---|---|
|`ChatPromptTemplate`|`dict`|`ChatPromptValue`|
|`ChatOpenAI`|`PromptValue` / Messages|`AIMessage`|
|`StrOutputParser`|`AIMessage`|`str`|

This strong typing is why LCEL composition works predictably.

---

# 5. JS Equivalent Note

The same pipeline exists in `langchain.js`.

```javascript
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a Python teacher."],
  ["human", "Explain {topic} in two sentences."]
]);

const model = new ChatOpenAI({
  model: "gpt-5",
  temperature: 0,
});

const parser = new StringOutputParser();

const chain = prompt.pipe(model).pipe(parser);

const result = await chain.invoke({
  topic: "decorators",
});

console.log(result);
```

This is one of the first meaningful differences between Python and JavaScript.

Python overloads the `|` operator, making composition feel natural:

```python
prompt | model | parser
```

JavaScript has no operator overloading for user-defined objects, so composition is expressed using `.pipe()`:

```javascript
prompt.pipe(model).pipe(parser)
```

Although the syntax differs, the mental model is identical: each call produces another `Runnable`, allowing arbitrarily large pipelines to be composed from smaller ones.

---

# 6. Design Rationale and Tradeoffs

LCEL exists because orchestration code scales poorly. In a simple application with two or three steps, manually invoking each component is manageable. As systems evolve to include prompt construction, retrieval, reranking, multiple model calls, structured output parsing, guardrails, and logging, procedural orchestration becomes repetitive and error-prone.

By treating the entire workflow as a composable graph of `Runnable` objects, LangChain enables developers to reason about **data flow** rather than **control flow**. This also allows features such as streaming, batching, callbacks, retries, and tracing to be implemented consistently across every stage of the pipeline. The tradeoff is that developers must understand the input and output types of each Runnable, since type mismatches are now composition errors rather than explicit function call errors.

For very small, one-off scripts, directly calling `invoke()` on individual components may be simpler. LCEL becomes increasingly valuable as workflows grow in length and complexity, where its compositional model reduces boilerplate and improves maintainability.

---

# 7. Practical Application Scenario

Consider a production document summarization service. A user uploads a PDF, and the application performs the following sequence:

```text
PDF Text
      │
      ▼
Document Splitter
      │
      ▼
Retriever
      │
      ▼
Prompt Template
      │
      ▼
Chat Model
      │
      ▼
Structured Output Parser
      │
      ▼
REST API Response
```

Each stage is implemented as a `Runnable`. If the organization decides to replace OpenAI with Anthropic, only the model Runnable changes. If a different vector database is adopted, only the retriever Runnable changes. The surrounding LCEL pipeline remains unchanged because every component adheres to the same execution contract.

---

# 8. Quick-Reference Syntax Recap

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant."),
    ("human", "{question}")
])

model = ChatOpenAI(model="gpt-5")

parser = StrOutputParser()

chain = prompt | model | parser

result = chain.invoke({
    "question": "What is LCEL?"
})

print(result)
```

## What You Learned

By the end of this module, you should understand that **LCEL is the composition language built on top of the Runnable abstraction**. The `|` operator in Python (or `.pipe()` in JavaScript) does not execute a workflow immediately; instead, it constructs a new `RunnableSequence` that represents the entire pipeline. Because the sequence itself is also a `Runnable`, it can be invoked, streamed, batched, or embedded inside larger workflows. This recursive compositional design is the foundation of modern LangChain and is the reason later abstractions—such as RAG pipelines, tool-calling chains, and LangGraph agents—can all be expressed using the same execution model.