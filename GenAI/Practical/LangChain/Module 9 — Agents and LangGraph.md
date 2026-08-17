By the end of Module 8, we had a complete conversational AI pipeline. The application could format prompts, invoke chat models, retrieve external knowledge, call tools, and maintain conversation history. Despite this sophistication, every workflow we built shared one important characteristic: **it was linear**.

A linear pipeline always follows the same execution path.

```text
Input
  │
  ▼
Prompt
  │
  ▼
Model
  │
  ▼
Output
```

Even RAG follows a predetermined sequence.

```text
Question
  │
  ▼
Retriever
  │
  ▼
Prompt
  │
  ▼
Model
  │
  ▼
Answer
```

There is no decision-making about **what should happen next**.

Modern AI applications, however, frequently require workflows that cannot be represented as a fixed sequence. The model may need to determine whether a tool is necessary, call multiple tools in succession, retry after a failure, ask the user for clarification, or terminate only after some condition has been satisfied. These behaviors require **control flow**, not merely **data flow**.

This is precisely the problem LangGraph was created to solve.

---

# 1. Setup (Isolated Folder)

Create another isolated project.

```bash
cd langchain-course

mkdir module-09-langgraph
cd module-09-langgraph

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
langgraph==0.6.5
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
OPENAI_API_KEY=your_api_key_here
```

---

# 2. Language-Agnostic Concept

Before discussing LangGraph, we first need to distinguish between a **chain** and an **agent**.

Many developers incorrectly assume these are the same concept.

They are not.

A **chain** executes a fixed workflow.

```
Input

↓

Step A

↓

Step B

↓

Step C

↓

Done
```

The execution order is predetermined before the application even starts.

An **agent** behaves differently.

It makes decisions while the workflow is executing.

```
Question

↓

Think

↓

Need Tool?

↓

Yes → Tool

↓

Observe Result

↓

Need Another Tool?

↓

Yes → Tool

↓

Observe

↓

Enough Information?

↓

No → Continue

↓

Yes → Final Answer
```

The key distinction is that an agent contains a **reasoning loop**.

Instead of simply moving forward, the workflow repeatedly evaluates the current state before deciding what happens next.

---

## What Is a State Graph?

Traditional software frequently models workflows as graphs.

Examples include:

- compiler optimization passes
    
- workflow engines
    
- CI/CD pipelines
    
- BPMN systems
    
- Airflow DAGs
    

LangGraph applies the same idea to AI systems.

A graph consists of:

```text
Nodes

+

Edges

+

Shared State
```

Unlike LCEL, where data simply flows from left to right, LangGraph allows execution to revisit previous nodes, branch conditionally, and terminate dynamically.

---

# 3. Mechanism

## State

Everything in LangGraph revolves around a shared **state object**.

Instead of passing independent values between functions,

every node receives

```python
State
```

and returns an updated

```python
State
```

Conceptually,

```text
State

↓

Node

↓

Updated State
```

This is very similar to Redux reducers or functional state transitions.

---

## Nodes

A node represents one unit of computation.

Examples include:

- calling an LLM
    
- executing a tool
    
- retrieving documents
    
- validating output
    
- saving to a database
    

Every node receives state and returns state.

Conceptually,

```text
State

↓

LLM Node

↓

State
```

Notice that nodes no longer exchange arbitrary objects.

Everything passes through the shared state.

---

## Edges

Edges define execution order.

Unlike LCEL,

edges may be conditional.

```
Node

↓

Condition

↓

Tool Node

or

End
```

Execution therefore depends on runtime information.

---

## START and END

Every graph has two special nodes.

```
START

...

END
```

The graph begins at `START` and finishes at `END`.

Unlike LCEL,

the number of intermediate steps is not fixed.

---

## Why LangGraph Instead of AgentExecutor?

Older LangChain versions exposed

```text
AgentExecutor
```

This worked well for simple ReAct agents.

However,

as developers needed

- retries
    
- branching
    
- multiple agents
    
- human approval
    
- persistence
    
- checkpoints
    

AgentExecutor became increasingly difficult to extend.

LangGraph generalizes agent execution into graph execution.

Instead of hiding the workflow,

it lets developers explicitly build it.

This dramatically improves observability and flexibility.

---

# 4. Current Python Syntax and Implementation

Let's build our first LangGraph.

Create `main.py`.

```python
from typing import TypedDict

from dotenv import load_dotenv

from langgraph.graph import (
    END,
    START,
    StateGraph,
)

from langchain_openai import ChatOpenAI

load_dotenv()

model = ChatOpenAI(
    model="gpt-5",
    temperature=0,
)


class GraphState(TypedDict):
    question: str
    answer: str


def chatbot_node(state: GraphState):
    response = model.invoke(state["question"])

    return {
        "answer": response.content
    }


builder = StateGraph(GraphState)

builder.add_node(
    "chatbot",
    chatbot_node,
)

builder.add_edge(
    START,
    "chatbot",
)

builder.add_edge(
    "chatbot",
    END,
)

graph = builder.compile()

result = graph.invoke(
    {
        "question": "Explain LangGraph."
    }
)

print(result)
```

Run:

```bash
python main.py
```

Example output:

```text
{
    "question": "...",
    "answer": "LangGraph is..."
}
```

Notice that the graph returns the **entire application state** rather than only the model response.

---

## Internal Execution Flow

The graph executes conceptually like this.

```
START
   │
   ▼
chatbot_node
   │
   ▼
END
```

The current graph is linear.

Later we will add branching and loops.

---

## Adding Conditional Execution

Suppose we introduce a tool.

Conceptually,

```
Question

↓

LLM

↓

Tool Needed?

↓

Yes → Tool

↓

LLM

↓

END

No

↓

END
```

Notice something new.

Execution revisits the model after the tool finishes.

This loop is impossible to express naturally using a simple LCEL pipeline.

It is exactly the type of workflow LangGraph is designed for.

---

# Building a ReAct Agent

A ReAct agent follows a simple cycle.

```
Question

↓

Reason

↓

Action

↓

Observation

↓

Reason

↓

Action

↓

Observation

↓

Final Answer
```

Each iteration updates the graph state.

Eventually,

the model determines that enough information has been gathered.

The graph exits through the `END` node.

LangGraph provides prebuilt helpers for constructing these agent loops, but understanding the underlying graph model is more valuable than memorizing helper APIs.

---

# Checkpointing

One of LangGraph's most important features is **checkpointing**.

Suppose an agent executes:

```
Node A

↓

Node B

↓

Node C
```

If the application crashes during Node C,

traditional execution starts over from Node A.

With checkpointing,

```
Checkpoint

↓

Restart

↓

Resume From Node C
```

This capability is essential for long-running workflows involving multiple API calls, human approvals, or expensive tool execution.

---

# Human-in-the-Loop

Graphs also support pauses.

```
LLM

↓

Approval Required?

↓

Pause

↓

Human Decision

↓

Resume
```

This is widely used for:

- financial approvals
    
- medical review
    
- legal workflows
    
- deployment systems
    

The graph simply resumes from the checkpoint after approval.

---

# Multi-Agent Systems

LangGraph can also orchestrate multiple specialized agents.

```
Coordinator

↓

Research Agent

↓

Coding Agent

↓

Reviewer

↓

Final Answer
```

Each agent becomes just another graph node.

This architecture is becoming increasingly common in enterprise AI systems.

---

# 5. JS Equivalent Note

The JavaScript version follows the same conceptual model.

```javascript
import {
  START,
  END,
  StateGraph,
} from "@langchain/langgraph";

const workflow =
  new StateGraph({
    channels: {
      question: {},
      answer: {},
    },
  });

workflow.addNode(
  "chatbot",
  chatbotNode
);

workflow.addEdge(
  START,
  "chatbot"
);

workflow.addEdge(
  "chatbot",
  END
);

const graph =
  workflow.compile();

const result =
  await graph.invoke({
    question: "Explain LangGraph"
});
```

Although the APIs differ slightly because of language conventions, the architectural model is identical. Both ecosystems define a shared state type, create nodes that transform that state, connect those nodes with edges, and compile the graph into an executable Runnable. The most significant difference is that JavaScript naturally adopts asynchronous node functions, whereas Python supports both synchronous and asynchronous execution.

---

# 6. Design Rationale and Tradeoffs

LangGraph extends the linear composition model of LCEL into a graph-based execution model where state becomes the primary abstraction. This design enables dynamic workflows that include loops, conditional routing, retries, and long-running execution without abandoning the familiar Runnable ecosystem. Because every node operates on the same shared state object, the graph provides a consistent mechanism for coordinating models, tools, retrievers, and business logic.

The additional flexibility comes with greater architectural complexity. Designing state schemas, conditional transitions, and checkpoint strategies requires more planning than constructing a simple LCEL pipeline. For applications that consist of a single prompt followed by a single model invocation, a graph is unnecessary. LangGraph becomes valuable when workflow decisions depend on intermediate results or when execution must persist across failures or human interactions.

---

# 7. Practical Application Scenario

Consider an enterprise IT support assistant.

```
User Request
      │
      ▼
Intent Classification
      │
      ▼
Knowledge Search
      │
      ▼
Enough Information?
      │
 ┌────┴────┐
 ▼         ▼
Yes        No
 │          │
 ▼          ▼
Respond   Tool Call
 │          │
 └────┬─────┘
      ▼
Human Approval?
      │
 ┌────┴────┐
 ▼         ▼
No        Yes
 │          │
 ▼          ▼
END      Pause
           │
           ▼
      Human Decision
           │
           ▼
         Resume
```

This workflow cannot be represented as a simple sequence because execution depends on retrieved knowledge, tool outcomes, and human approval. A graph-based execution model naturally captures these dynamic transitions while maintaining explicit state throughout the process.

---

# 8. Quick-Reference Syntax Recap

```python
from langgraph.graph import (
    START,
    END,
    StateGraph,
)

builder = StateGraph(GraphState)

builder.add_node(
    "chatbot",
    chatbot_node,
)

builder.add_edge(
    START,
    "chatbot",
)

builder.add_edge(
    "chatbot",
    END,
)

graph = builder.compile()

result = graph.invoke(state)
```

## What You Learned

This module introduced the architectural transition from **linear chains** to **graph-based execution**. You learned that a chain executes a predetermined sequence of operations, whereas an agent repeatedly evaluates its current state and decides what action to take next. LangGraph models this behavior using three core abstractions: a shared **state object**, **nodes** that transform that state, and **edges** that define control flow. This design enables loops, conditional routing, checkpointing, human-in-the-loop interactions, and multi-agent coordination while preserving compatibility with LangChain's Runnable ecosystem.

The next module explores **streaming, callbacks, and observability**, showing how to monitor, debug, and trace the execution of LCEL pipelines and LangGraph workflows in real time.