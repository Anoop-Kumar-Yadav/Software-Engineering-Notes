Up to this point, we have learned three foundational abstractions. **Runnable** defines a unit of computation, **LCEL** composes multiple Runnables into pipelines, and **Chat Models** consume a sequence of messages and produce an `AIMessage`. The remaining question is where those messages come from. While you could manually construct `SystemMessage` and `HumanMessage` objects for every request, that approach quickly becomes repetitive, error-prone, and difficult to maintain. LangChain solves this problem through **Prompt Templates**, which separate the _structure_ of a prompt from the _data_ injected into it at runtime.

Prompt templates are one of the most important abstractions in LangChain because almost every production AI application uses them. Whether you are building a chatbot, an SQL agent, a document summarizer, or a Retrieval-Augmented Generation (RAG) system, the first stage of the pipeline is almost always a prompt template.

---

# 1. Setup (Isolated Folder)

Create a completely independent project.

```bash
cd langchain-course

mkdir module-04-prompt-templates
cd module-04-prompt-templates

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

A prompt template is fundamentally **a parameterized document**.

Consider a normal function in any programming language.

```javascript
function greet(name) {
    return `Hello ${name}`;
}
```

The function contains two parts:

- A fixed structure.
    
- Variable data.
    

The same idea applies to AI prompts.

Instead of writing

```text
Explain Docker.
```

then later

```text
Explain Kubernetes.
```

and later

```text
Explain Redis.
```

you define a reusable template:

```text
Explain {topic}.
```

and supply different values at runtime.

Notice that the template itself never changes.

Only its variables do.

This separation has several important benefits.

First, prompt engineering becomes independent of application logic. Second, prompts become reusable across different requests. Third, prompts can be versioned, tested, and maintained just like source code. Finally, dynamic information such as user input, retrieved documents, timestamps, or conversation history can be injected without rebuilding the prompt manually.

---

## Why Chat Prompt Templates?

Modern chat models do not consume a single string.

They consume a sequence of messages.

Therefore, a chat prompt is **not** one template.

It is a collection of message templates.

Conceptually,

```text
System Template

↓

Human Template

↓

Optional History

↓

Optional Tool Messages

↓

Final Message List
```

Each individual message can contain variables.

This design mirrors how providers such as OpenAI and Anthropic internally represent conversations.

---

# 3. Mechanism

`ChatPromptTemplate` is itself a **Runnable**.

This is extremely important.

Its job is not to call an LLM.

Its job is to transform structured input data into a `ChatPromptValue`.

Conceptually,

```text
Dictionary

↓

ChatPromptTemplate

↓

ChatPromptValue

↓

Chat Model

↓

AIMessage
```

Notice that the prompt template performs no AI inference.

It is simply a transformation stage.

Suppose we define

```python
("human", "Explain {topic}")
```

and invoke

```python
{
    "topic": "Redis"
}
```

Internally, LangChain replaces the placeholder and produces

```text
HumanMessage(
    "Explain Redis"
)
```

The chat model never sees `{topic}`.

By the time execution reaches the model, every placeholder has already been resolved.

---

## PromptTemplate vs ChatPromptTemplate

Older LLM APIs accepted plain strings.

For those cases, LangChain still provides `PromptTemplate`.

```text
Input

↓

PromptTemplate

↓

String

↓

Completion Model
```

Modern chat models require structured conversations.

Therefore,

```text
Input

↓

ChatPromptTemplate

↓

Messages

↓

Chat Model
```

Unless you are working with a legacy completion model, `ChatPromptTemplate` is the recommended choice.

---

## Variable Resolution

Suppose we define

```python
{
    "language": "Python",
    "topic": "Decorators"
}
```

and the template

```text
Explain {topic} using {language}.
```

Internally,

```text
Template

↓

Placeholder Resolution

↓

Formatted Messages

↓

Model
```

The template is never modified.

Instead, LangChain produces a new prompt object for each invocation.

This makes prompt templates immutable and therefore reusable across concurrent requests.

---

# 4. Current Python Syntax and Implementation

Create `main.py`.

```python
from dotenv import load_dotenv

from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

load_dotenv()

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a senior Python instructor."
        ),
        (
            "human",
            "Explain {topic} using exactly {sentences} sentences."
        ),
    ]
)

model = ChatOpenAI(
    model="gpt-5",
    temperature=0
)

chain = prompt | model

response = chain.invoke(
    {
        "topic": "dependency injection",
        "sentences": 3,
    }
)

print(response.content)
```

Run:

```bash
python main.py
```

Example output:

```text
Dependency injection is a design pattern in which an object's dependencies are supplied from the outside rather than created internally. This reduces coupling between components, making software easier to test and maintain. It is widely used in modern application frameworks to improve modularity and flexibility.
```

---

## Inspecting the Prompt Before Sending It

One of the most useful debugging techniques is formatting the prompt without invoking the model.

```python
from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages(
    [
        ("system", "You are a teacher."),
        ("human", "Explain {topic}."),
    ]
)

formatted = prompt.invoke(
    {
        "topic": "Docker"
    }
)

print(formatted)
```

Output:

```text
System: You are a teacher.

Human: Explain Docker.
```

Notice something subtle.

No model was involved.

The prompt template simply produced the message sequence.

This is extremely useful when debugging prompt engineering because you can inspect the exact messages that will be sent to the provider.

---

## Partial Variables

Some variables rarely change.

For example,

```text
You are an AWS Solutions Architect.
```

might remain constant for every request.

Instead of passing it every time,

```python
from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a {role}."
        ),
        (
            "human",
            "Explain {topic}."
        ),
    ]
).partial(
    role="Senior Backend Engineer"
)

formatted = prompt.invoke(
    {
        "topic": "Redis"
    }
)

print(formatted)
```

The `role` variable becomes permanently attached to the template.

Only `topic` remains dynamic.

Partial variables reduce duplication and make prompt definitions cleaner.

---

## MessagesPlaceholder

Large conversational systems cannot hardcode conversation history.

Instead,

```text
System Message

↓

Conversation History

↓

Latest User Question
```

must be assembled dynamically.

`MessagesPlaceholder` represents exactly that insertion point.

```python
from langchain_core.prompts import (
    ChatPromptTemplate,
    MessagesPlaceholder,
)

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a helpful assistant."
        ),
        MessagesPlaceholder(
            variable_name="history"
        ),
        (
            "human",
            "{question}"
        ),
    ]
)
```

When invoked,

```python
history = [
    ("human", "What is Docker?"),
    ("ai", "Docker is a container platform."),
]

prompt.invoke(
    {
        "history": history,
        "question": "How is Kubernetes related?"
    }
)
```

LangChain inserts the history at the placeholder location before sending the messages to the model.

This mechanism is the foundation for conversational memory, which we will revisit in Module 8.

---

# 5. JS Equivalent Note

The JavaScript implementation is intentionally very similar.

```javascript
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a backend engineer."],
  ["human", "Explain {topic}."]
]);

const model = new ChatOpenAI({
  model: "gpt-5",
});

const chain = prompt.pipe(model);

const response = await chain.invoke({
  topic: "Redis",
});

console.log(response.content);
```

The conceptual model is identical. `ChatPromptTemplate` is a Runnable, and `.pipe()` composes it with the chat model. The primary differences from Python remain the asynchronous execution model and JavaScript's use of `.pipe()` instead of the overloaded `|` operator.

---

# 6. Design Rationale and Tradeoffs

Separating prompt structure from runtime data provides a clear boundary between application logic and prompt engineering. Developers can evolve prompts without changing orchestration code, while application code supplies only the dynamic variables. This separation also improves testability because prompt templates can be formatted and inspected independently of model invocation.

Prompt templates introduce an additional abstraction layer, but the overhead is minimal compared with the benefits. They become especially valuable when prompts grow to include system instructions, retrieved documents, conversation history, tool descriptions, and structured output instructions. For very small prototypes with a single static prompt, directly constructing messages may be sufficient, but prompt templates scale far better as applications become more sophisticated.

---

# 7. Practical Application Scenario

Consider a production RAG application for technical documentation.

The request pipeline might look like this:

```text
User Question
        │
        ▼
Retriever
        │
        ▼
Relevant Documents
        │
        ▼
ChatPromptTemplate
        │
        ├── System Instructions
        ├── Retrieved Context
        ├── Conversation History
        └── Current Question
        │
        ▼
Chat Model
        │
        ▼
Answer
```

The retriever changes the contextual documents for each request, the conversation history grows over time, and the user's question is always different. Despite this variability, the prompt template itself remains stable, acting as the blueprint that assembles all runtime information into the message sequence expected by the model.

---

# 8. Quick-Reference Syntax Recap

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant."),
    ("human", "{question}")
])

model = ChatOpenAI(model="gpt-5")

chain = prompt | model

response = chain.invoke({
    "question": "What is LangChain?"
})

print(response.content)
```

## What You Learned

This module established that **`ChatPromptTemplate` is a Runnable whose responsibility is to transform structured input into a `ChatPromptValue` containing typed messages**. It separates static prompt structure from dynamic runtime data through placeholder interpolation, making prompts reusable, testable, and easier to maintain. You also learned how partial variables reduce repetition, how `MessagesPlaceholder` enables dynamic insertion of conversation history, and why chat-based prompting has replaced string-based prompting for modern language models. In the next module, we will examine what happens **after** the model produces an `AIMessage`: converting free-form model output into reliable, structured data using **Output Parsers** and provider-native structured output.