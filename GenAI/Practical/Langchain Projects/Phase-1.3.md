# 6. Implementation

Before we write a single line of LangChain code, we need to make one more engineering decision that real teams make almost immediately: **how does the application obtain the text that will be summarized?** Since we are using a Kaggle dataset, the application should not know anything about CSV parsing details beyond a single, well-defined interface. If we mix data loading, prompt construction, model invocation, and output formatting inside one file, the project will become difficult to extend when Version 2 introduces batch processing or Version 3 introduces evaluation over hundreds of tickets.

For that reason, even Version 1 will maintain a small separation between **data ingestion** and **AI inference**. We are not introducing a complex architecture or additional LangChain abstractions; we are simply applying ordinary software engineering principles. The AI pipeline should receive a string containing a support ticket, regardless of whether that string came from a CSV file today or a database tomorrow.

---

## Step 1 — Create the Project Structure

Update the project directory.

```text
project-01-smart-support-summarizer/
│
├── data/
│   └── customer_support_tickets.csv
│
├── v1/
│   ├── main.py
│   ├── schema.py
│   └── data_loader.py
│
├── .env
├── requirements.txt
└── README.md
```

---

## Step 2 — Implement the Schema

Create `v1/schema.py`.

```python
from enum import Enum

from pydantic import BaseModel, Field


class Priority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class TicketSummary(BaseModel):
    summary: str = Field(
        description="A concise summary of the customer's issue."
    )

    primary_issue: str = Field(
        description="The main problem reported by the customer."
    )

    priority: Priority = Field(
        description="Estimated business priority."
    )

    customer_sentiment: str = Field(
        description="Overall emotional tone of the customer."
    )

    recommended_action: str = Field(
        description="Recommended next step for the support engineer."
    )
```

Nothing here invokes an LLM. This file exists solely to define the application's contract. Every future version of the summarizer will continue producing this object, regardless of how the internal implementation changes.

---

## Step 3 — Read One Ticket from the Dataset

The Kaggle dataset is stored as a CSV file. We need a small utility that loads a single record and converts it into the text that will later be given to the model.

Create `v1/data_loader.py`.

```python
import pandas as pd


def load_first_ticket(csv_path: str) -> str:
    df = pd.read_csv(csv_path)

    row = df.iloc[0]

    ticket = f"""
Subject:
{row["Ticket Subject"]}

Description:
{row["Ticket Description"]}
"""

    return ticket.strip()
```

At first glance this function seems trivial, but it performs an important responsibility: it isolates the dataset format from the rest of the application. If a future dataset uses different column names or arrives from a SQL database instead of a CSV file, only this module changes. The AI pipeline continues to receive the same input: a plain text support ticket.

Since we are now reading CSV files, add one additional dependency.

Update `requirements.txt`.

```text
langchain==1.0.3
langchain-openai==1.3.3
python-dotenv==1.1.1
pydantic==2.11.7
pandas==2.3.2
```

---

## Step 4 — Build the Prompt

A common beginner mistake is to place the entire instruction inside the `invoke()` call as a formatted string. That approach works initially, but prompt engineering quickly becomes difficult because the prompt is scattered throughout the codebase. We already learned that `ChatPromptTemplate` exists specifically to separate prompt design from application logic, and this project now has a concrete reason to use it. The prompt is part of the application's behavior, so it deserves to exist as an explicit template rather than an inline string.

Create `v1/main.py`.

```python
from dotenv import load_dotenv

from langchain_core.prompts import ChatPromptTemplate

from langchain_openai import ChatOpenAI

from schema import TicketSummary
from data_loader import load_first_ticket

load_dotenv()

ticket = load_first_ticket(
    "../data/customer_support_tickets.csv"
)

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
You are a senior customer support engineer.

Analyze the customer support ticket.

Extract only the information requested by the schema.

Do not invent information that is not present.
""",
        ),
        (
            "human",
            "{ticket}",
        ),
    ]
)
```

At this stage, we have deliberately stopped after constructing the prompt. We have not yet configured the model or invoked it because each of those represents a separate engineering decision. Building the application incrementally makes it much easier to inspect intermediate artifacts and debug failures.

---

## Step 5 — Configure the Model

The next decision concerns how the model should produce structured data.

The current LangChain recommendation is to use `with_structured_output()` together with OpenAI's native structured output support rather than prompting the model to "return JSON." This delegates schema enforcement to the provider, producing validated Pydantic objects instead of requiring fragile post-processing. OpenAI's structured output is accessed through `method="json_schema"`, which uses the provider's native schema-constrained generation. ([LangChain Reference](https://reference.langchain.com/python/langchain-openai/chat_models/base/ChatOpenAI/with_structured_output?utm_source=chatgpt.com "with_structured_output | langchain_openai | LangChain Reference"))

Continue `v1/main.py`.

```python
model = ChatOpenAI(
    model="gpt-5",
    temperature=0,
)

structured_model = model.with_structured_output(
    TicketSummary,
    method="json_schema",
)
```

Notice that the model has now changed its effective output type. Instead of producing an `AIMessage`, it now produces an instance of `TicketSummary`. This is a significant architectural improvement because downstream code no longer needs to understand language model responses; it simply receives a validated domain object.

---

## Step 6 — Compose the Runnable Pipeline

Now we finally compose the application.

```python
chain = (
    prompt
    | structured_model
)
```

This is one of the cleanest examples of LCEL we've built so far. The first Runnable transforms the ticket into a prompt, and the second Runnable transforms that prompt into a validated Python object. There is no parser because provider-native structured output already performs the validation.

---

## Step 7 — Invoke the Application

Complete `main.py`.

```python
result = chain.invoke(
    {
        "ticket": ticket,
    }
)

print(result)

print("\nSummary:")
print(result.summary)

print("\nPriority:")
print(result.priority)

print("\nRecommended Action:")
print(result.recommended_action)
```

Run the application.

```bash
python v1/main.py
```

Example output:

```text
TicketSummary(
    summary="...",
    primary_issue="...",
    priority=<Priority.HIGH: 'High'>,
    customer_sentiment="Frustrated",
    recommended_action="Investigate the authentication service and password reset email delivery."
)
```

The exact wording will vary because the model is performing inference, but the **shape of the output is guaranteed** by the schema. That distinction is crucial. We do not require deterministic sentences; we require deterministic structure.

---

# 7. Engineering Questions Answered

An experienced engineer would immediately ask why we chose provider-enforced structured output instead of instructing the model to "return JSON." The answer is reliability. Prompting for JSON relies entirely on the model voluntarily following instructions, whereas provider-native structured output validates generation against the supplied schema before the response reaches the application. This dramatically reduces malformed outputs and eliminates an entire category of parsing code. ([LangChain Reference](https://reference.langchain.com/python/langchain-openai/chat_models/base/ChatOpenAI/with_structured_output?utm_source=chatgpt.com "with_structured_output | langchain_openai | LangChain Reference"))

Another important question concerns uncertain information. Suppose the ticket never explicitly states its business priority. Should the model guess? For Version 1, the answer is **yes**, because the application is acting as an assistant rather than an authoritative source. However, this decision has consequences. A guessed priority may influence downstream workflows incorrectly. In a production system, we would likely redesign the schema to distinguish **observed facts** from **model inferences**, perhaps by introducing confidence scores or making some fields optional. We are intentionally accepting this limitation today because it simplifies the first version, but we are doing so consciously rather than accidentally.

---

# 8. Active Recall Checkpoint

Before we improve the application further, answer these questions in your own words.

1. **Why did we use `ChatPromptTemplate` instead of placing the entire prompt directly inside `chain.invoke()`?**
    
2. **Why is `with_structured_output()` a better choice than asking the model to "return valid JSON" in the prompt?**
    

Don't just describe the APIs. Explain the engineering reasoning behind each decision.

---

# 9. The Next Limitation

Version 1 successfully summarizes a single ticket from a real dataset, but it immediately exposes a new limitation. The Kaggle dataset contains tickets of widely varying lengths and quality. Some descriptions are only a few sentences, while others become much longer. As soon as we begin processing more representative records, we will discover that **a single generic prompt does not consistently produce summaries of the same quality**. Some summaries become too verbose, others omit important details, and inferred priorities become inconsistent because the instructions are underspecified.

This inconsistency is not caused by LangChain or by structured output; it is caused by **prompt design**. Our next version will therefore begin with a concrete production problem: the application produces structurally valid objects, but the semantic quality of those objects varies too much across a real dataset. Rather than introducing a new framework component, we will first improve the prompt itself through systematic prompt engineering, evaluation against multiple tickets, and measurable quality criteria before adding any additional architectural complexity.