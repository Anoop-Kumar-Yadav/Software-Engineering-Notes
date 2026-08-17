## 1. Language-agnostic Concept

After understanding that **Runnable** is the fundamental execution unit in LangChain, the next question naturally becomes: **how do we connect multiple Runnables into an application?** This is the problem that the **LangChain Expression Language (LCEL)** solves.

At its core, LCEL is **a declarative language for composing computation pipelines**. It does not introduce new AI capabilities, nor does it change how LLMs work. Instead, it provides a uniform way to describe how data should flow through a sequence of independent computational units. The emphasis is on **data flow**, not control flow. Rather than writing imperative code that manually invokes one component, stores its result in a variable, passes that result into another component, and repeats the process, LCEL allows you to describe the entire pipeline as a composition of transformations.

This distinction is important because GenAI applications are fundamentally **data transformation pipelines**. A user query is transformed into prompt messages, those messages become an API request, the response becomes structured data, that structured data may become another prompt, and eventually a final response is produced. Every stage consumes one representation of the data and produces another. LCEL simply makes this transformation graph explicit.

Notice that this idea is not unique to AI. Unix pipelines, Java Streams, RxJS Observables, Apache Beam, Spark DataFrames, and functional programming all rely on the same architectural principle: **compose small transformations into larger workflows**. LCEL applies that philosophy specifically to LLM applications.

---

## 2. Mechanism

Internally, LCEL is remarkably simple. Every component in the pipeline is a Runnable, and composing them creates **new Runnables**. There is no distinction between a "single operation" and an "entire workflow." A pipeline itself satisfies the Runnable interface, meaning it can be invoked, streamed, batched, retried, or embedded inside another pipeline exactly like any other Runnable.

Suppose we have three transformations:

```
User Input
      │
      ▼
Prompt Template
      │
      ▼
Chat Model
      │
      ▼
Output Parser
```

From a programming perspective, this is equivalent to:

```
output1 = prompt.invoke(input)
output2 = model.invoke(output1)
output3 = parser.invoke(output2)
```

LCEL compresses that entire sequence into a single declarative expression:

```
prompt | model | parser
```

The pipe operator (`|`) is **not** magic syntax that executes the workflow immediately. Instead, it constructs a **RunnableSequence** object. Execution only begins when methods such as `invoke()`, `stream()`, or `batch()` are called. In other words, the pipe operator builds an execution graph; it does not execute one.

This design has an important consequence. Since the result of composition is itself another Runnable, pipelines become recursively composable.

```
Runnable
        │
        ▼
RunnableSequence
        │
        ▼
RunnableParallel
        │
        ▼
Another RunnableSequence
```

To LangChain, every box above is simply "a Runnable."

This recursive composability is one of the reasons LangChain scales from tiny prototypes to large production systems without changing the programming model.

Another important composition primitive is **RunnableParallel**. While `RunnableSequence` forwards the output of one component into the next, `RunnableParallel` sends the **same input** to multiple Runnables concurrently and collects their outputs into a dictionary (Python) or object (JavaScript). This is the preferred mechanism for fan-out operations such as querying multiple retrievers or computing several derived values simultaneously.

Finally, LCEL includes **RunnableLambda**, which wraps arbitrary application logic so it can participate in the same execution model. Rather than forcing every operation to be an LLM call, LangChain allows ordinary Python or JavaScript functions to become first-class pipeline components.

---

## 3. Current Python Syntax

The modern API encourages using the `|` operator for sequential composition. Although `RunnableSequence` still exists as a class, constructing pipelines through `|` is the idiomatic and recommended style.

A minimal sequential pipeline looks like this.

```py
from langchain_core.runnables import RunnableLambda

uppercase = RunnableLambda(lambda text: text.upper())
reverse = RunnableLambda(lambda text: text[::-1])

chain = uppercase | reverse

result = chain.invoke("langchain")

print(result)
```

Output:

```
NIAHCGNAL
```

Although trivial, this illustrates an important property: neither Runnable is aware of the other. The sequence object manages the flow of data between them.

Now consider branching execution.

```py
from langchain_core.runnables import RunnableLambda

chain = RunnableLambda(lambda x: x + 1) | {
    "double": RunnableLambda(lambda x: x * 2),
    "square": RunnableLambda(lambda x: x ** 2),
}

print(chain.invoke(5))
```

Output:

```
{
    "double": 12,
    "square": 36
}
```

What happened internally?

1. Input `5`
2. First Runnable returns `6`
3. `RunnableParallel` receives `6`
4. Both branches execute concurrently
5. Results are merged into one dictionary

Notice that **no threading code or asynchronous orchestration was written by the developer**. LangChain performs the coordination because every component follows the Runnable contract.

Now consider inserting ordinary application logic.

```py
from langchain_core.runnables import RunnableLambda

clean_text = RunnableLambda(
    lambda text: text.strip().lower()
)

count_words = RunnableLambda(
    lambda text: len(text.split())
)

pipeline = clean_text | count_words

print(pipeline.invoke("   Hello LangChain World   "))
```

Output:

```
3
```

Nothing in this example uses an LLM. That is intentional because LCEL is fundamentally **a composition language**, not an AI language.

---

## 4. JS Equivalent Note

The mental model transfers almost perfectly to `langchain.js`. Every component still implements the Runnable interface, and composition is performed through `.pipe()` because JavaScript cannot overload operators.

```js
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

Parallel composition follows the same idea.

```js
import {
  RunnableLambda,
  RunnableParallel,
} from "@langchain/core/runnables";

const pipeline = RunnableLambda.from((x) => x + 1).pipe(
  RunnableParallel.from({
    double: RunnableLambda.from((x) => x * 2),
    square: RunnableLambda.from((x) => x ** 2),
  })
);

console.log(await pipeline.invoke(5));
```

One difference worth remembering is that JavaScript is **asynchronous by default**. Almost every invocation is awaited, whereas Python offers both synchronous (`invoke`) and asynchronous (`ainvoke`) APIs. The underlying execution model, however, is identical.

---

## 5. Design Rationale and Tradeoffs

LCEL replaced the older family of `Chain` subclasses because the previous architecture became increasingly rigid as applications grew in complexity. Legacy classes such as `LLMChain`, `SequentialChain`, and related abstractions encoded specific workflow patterns into concrete classes. As developers needed branching, conditional execution, retries, custom preprocessing, streaming, or retrieval, the framework accumulated more specialized chain types, making composition difficult and extending the API surface unnecessarily.

LCEL takes the opposite approach. Instead of providing dozens of specialized classes, it exposes a small set of composable primitives—primarily `RunnableSequence`, `RunnableParallel`, and supporting Runnable types. Complex workflows emerge from composition rather than inheritance. This dramatically reduces the number of concepts a developer must learn while increasing flexibility. Current LangChain documentation recommends LCEL for composable pipelines, while larger workflows involving loops, branching, or long-running state are better expressed with LangGraph.

The primary tradeoff is readability for very large workflows. A simple expression such as:

```
retriever | formatter | prompt | model | parser
```

is extremely clear. A pipeline containing dozens of nested branches, however, can become difficult to visualize. That is precisely why LangGraph exists—it models complex workflows as explicit graphs of nodes and edges instead of increasingly elaborate pipeline expressions.

---

## 6. Practical Application Scenario

Imagine you are building a production RAG service for your company's internal documentation.

A user submits the question:

> "How does JWT authentication work in our payment service?"

A modern LCEL pipeline would conceptually look like this:

```
User Question
        │
        ▼
Input Normalization
        │
        ▼
Retriever
        │
        ▼
Context Formatter
        │
        ▼
ChatPromptTemplate
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

Each stage is a Runnable, and the entire workflow is itself a Runnable. If your organization migrates from OpenAI to Anthropic, only the model Runnable changes. If you replace Chroma with Pinecone, only the retriever Runnable changes. The composition remains unchanged because every component adheres to the same execution contract.

This illustrates the most important lesson of LCEL: **it is not a language for calling LLMs; it is a language for composing computation**. Once you understand that principle, prompt templates, retrievers, chat models, output parsers, tools, and even entire RAG pipelines all become interchangeable building blocks within the same architectural model.