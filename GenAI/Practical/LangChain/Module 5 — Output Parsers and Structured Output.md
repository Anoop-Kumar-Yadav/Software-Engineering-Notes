So far, every module has focused on **getting information into a model**. We began with the `Runnable` abstraction, learned how LCEL composes Runnables into pipelines, explored chat models as the execution engine, and then used prompt templates to construct the messages sent to those models. The next question is equally important: **how should an application consume the model's response?**

A language model fundamentally generates text. Production software, however, rarely wants text. Instead, applications typically need **structured data**: JSON objects, arrays, booleans, enums, database records, or strongly typed domain models. Converting an LLM's probabilistic text into deterministic application data is the purpose of **output parsing**. Modern LangChain supports two complementary approaches: **post-processing the model's output with output parsers** and **requesting provider-native structured output**, where the provider constrains the model to produce data matching a schema. The second approach is now the recommended pattern whenever the provider supports it because it is substantially more reliable than parsing arbitrary text. ([docs.langchain.com](https://docs.langchain.com/oss/python/langchain/structured-output))

---

# 1. Setup (Isolated Folder)

Create a completely independent project.

```bash
cd langchain-course

mkdir module-05-output-parsers
cd module-05-output-parsers

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

A language model is fundamentally a **probabilistic text generator**. It predicts the next sequence of tokens given some context, but it has no inherent understanding of your application's data model. If you ask, "Extract the person's name and age," the model may respond with prose, Markdown, JSON, or a mixture of all three. Humans can interpret these variations effortlessly, but software generally cannot.

Production systems require **predictable contracts** between components. Consider a backend service that stores extracted invoice information in a database. The persistence layer expects a structure such as:

```json
{
  "invoice_number": "INV-1024",
  "amount": 1250.50,
  "currency": "USD"
}
```

If the model instead returns:

```text
The invoice number appears to be INV-1024 and the amount is approximately $1,250.50.
```

the application must perform additional parsing, validation, and error handling. This is fragile because natural language is not a deterministic interface.

The underlying problem is therefore not unique to AI. It is the same problem encountered whenever one software component communicates with another: **both sides must agree on a data contract**.

---

# 3. Mechanism

LangChain provides two fundamentally different mechanisms.

## Approach 1 — Output Parsers

The first approach lets the model generate text normally, after which a parser transforms that text into another representation.

Conceptually,

```text
User Input
      │
      ▼
Prompt
      │
      ▼
Chat Model
      │
      ▼
AIMessage
      │
      ▼
Output Parser
      │
      ▼
Python Object
```

Notice that the parser executes **after** the model has already generated its response.

This means the parser can only work with whatever text the model produced.

---

## Approach 2 — Provider-Native Structured Output

Modern providers expose APIs allowing developers to supply a schema.

Conceptually,

```text
Schema
      │
      ▼
Chat Model
      │
      ▼
Provider Validation
      │
      ▼
Structured Response
```

The crucial difference is that the provider itself constrains generation.

Instead of asking,

> "Please output JSON."

the application effectively asks,

> "Produce data matching this schema."

LangChain translates your Python schema into the provider's native structured-output mechanism, which may internally use JSON Schema, tool calling, or another provider-specific protocol. The exact implementation differs by provider, but the abstraction exposed by LangChain remains consistent. ([docs.langchain.com](https://docs.langchain.com/oss/python/langchain/structured-output))

---

## Why Provider-Native Structured Output Is Better

Suppose you prompt:

```text
Return valid JSON only.
```

The model might produce:

```json
{
  "name": "Alice"
}
```

or

```text
Sure! Here's the JSON:

{
  "name": "Alice"
}
```

or even malformed JSON.

The parser now has to recover from these inconsistencies.

With provider-native structured output, the provider validates the generated structure before returning it. This dramatically reduces parsing failures and makes downstream code simpler and more reliable.

---

# 4. Current Python Syntax and Implementation

We will first build a simple LCEL pipeline using `StrOutputParser`, then demonstrate the recommended provider-native structured output using a Pydantic model.

Create `main.py`.

```python
from dotenv import load_dotenv

from pydantic import BaseModel, Field

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

load_dotenv()

# --------------------------
# Example 1: StrOutputParser
# --------------------------

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a concise technical writer."
        ),
        (
            "human",
            "Explain {topic} in one sentence."
        ),
    ]
)

model = ChatOpenAI(
    model="gpt-5",
    temperature=0,
)

text_chain = prompt | model | StrOutputParser()

text_result = text_chain.invoke(
    {
        "topic": "dependency injection"
    }
)

print("=== Plain Text ===")
print(text_result)


# ----------------------------------------
# Example 2: Provider Structured Output
# ----------------------------------------

class Person(BaseModel):
    name: str = Field(
        description="Full name of the person"
    )
    age: int = Field(
        description="Age in years"
    )
    occupation: str = Field(
        description="Primary occupation"
    )


structured_model = model.with_structured_output(Person)

structured_result = structured_model.invoke(
    "Alice is a 29-year-old backend engineer."
)

print("\n=== Structured Output ===")
print(structured_result)

print("\nName:", structured_result.name)
print("Age:", structured_result.age)
print("Occupation:", structured_result.occupation)
```

Run:

```bash
python main.py
```

Example output:

```text
=== Plain Text ===

Dependency injection is a design pattern that supplies an object's dependencies externally rather than constructing them internally.

=== Structured Output ===

Person(
    name='Alice',
    age=29,
    occupation='backend engineer'
)

Name: Alice
Age: 29
Occupation: backend engineer
```

Notice something significant.

The second example does **not** return JSON.

It returns an actual **Pydantic object**.

That means your IDE provides autocompletion, static typing, validation, and attribute access without additional parsing.

---

## Internal Execution Flow

For the structured-output example, the execution pipeline is conceptually:

```text
Prompt
      │
      ▼
Pydantic Model
      │
      ▼
LangChain
      │
      ▼
Provider Schema
      │
      ▼
Model Generation
      │
      ▼
Provider Validation
      │
      ▼
Python Object
```

The application never manually parses JSON.

LangChain handles the conversion from the provider's validated response into the target Python class.

---

## `StrOutputParser` vs Structured Output

|Feature|`StrOutputParser`|Provider Structured Output|
|---|---|---|
|Output|String|Typed Python object|
|Reliability|Depends on prompt|Schema-enforced|
|JSON parsing|Manual|Automatic|
|Validation|None|Provider + Pydantic|
|Recommended for production|Only when text is desired|Yes, whenever supported|

The important point is that these techniques solve different problems. `StrOutputParser` is appropriate when the application genuinely wants free-form text, whereas provider-native structured output is preferable whenever the application needs machine-readable data.

---

# 5. JS Equivalent Note

The JavaScript mental model is identical, although the schema definition differs because JavaScript lacks Pydantic. The ecosystem commonly uses **Zod** for runtime schema validation.

```javascript
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";

const Person = z.object({
  name: z.string(),
  age: z.number(),
  occupation: z.string(),
});

const model = new ChatOpenAI({
  model: "gpt-5",
});

const structuredModel =
  model.withStructuredOutput(Person);

const person =
  await structuredModel.invoke(
    "Alice is a 29-year-old backend engineer."
  );

console.log(person);
```

The architectural pattern remains unchanged. In Python, the schema is a Pydantic model; in JavaScript, it is typically a Zod schema. In both cases, LangChain converts the schema into the provider's structured-output mechanism and returns validated application objects.

---

# 6. Design Rationale and Tradeoffs

Output parsers exist because language models fundamentally generate text, whereas software systems operate on structured data. A parser provides a transformation layer between these two representations. This separation keeps prompting concerns independent from application logic and allows different parsing strategies to be composed as Runnables within LCEL pipelines.

Provider-native structured output goes one step further by moving validation closer to the model itself. Rather than attempting to repair malformed text after generation, the provider constrains the generation process according to the supplied schema. This significantly improves reliability but is available only on providers that support structured-output capabilities. For providers without such support, traditional parsing techniques remain necessary.

---

# 7. Practical Application Scenario

Imagine an AI-powered recruitment platform.

A recruiter uploads hundreds of résumés.

The application pipeline looks conceptually like this:

```text
Resume
      │
      ▼
Chat Model
      │
      ▼
Candidate Schema
      │
      ▼
Validated Python Object
      │
      ▼
Database
```

The application does not want paragraphs describing the candidate. It wants structured fields such as name, years of experience, primary programming languages, education level, and expected salary. Returning validated domain objects allows the persistence layer, search index, and analytics systems to consume the extracted data directly without additional parsing.

---

# 8. Quick-Reference Syntax Recap

```python
from pydantic import BaseModel
from langchain_openai import ChatOpenAI

class Person(BaseModel):
    name: str
    age: int

model = ChatOpenAI(model="gpt-5")

structured_model = model.with_structured_output(Person)

person = structured_model.invoke(
    "Alice is 29 years old."
)

print(person.name)
print(person.age)
```

## What You Learned

This module introduced the distinction between **text generation** and **structured data generation**. You learned that `StrOutputParser` simply converts an `AIMessage` into a string and is appropriate when the application genuinely needs natural language. More importantly, you learned that modern LangChain recommends **provider-native structured output** through `with_structured_output()`, where a Pydantic (or Zod in JavaScript) schema is translated into the provider's structured-generation mechanism. This produces validated application objects instead of fragile text, making AI components behave much more like conventional typed software services.

The next module builds directly on this foundation. Once a model can reliably produce structured outputs, it can also produce **structured tool invocation requests**, which is the basis of **tool calling** and the first step toward building AI agents.