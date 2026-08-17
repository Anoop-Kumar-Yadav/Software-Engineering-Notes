# Project 1 — Smart Support Ticket Summarizer

## Version 1

---

# 1. Business Problem

Imagine a SaaS company that provides project management software to thousands of customers. Every day, its support team receives hundreds or even thousands of tickets ranging from simple billing questions to production outages. A support engineer typically spends the first few minutes reading an entire conversation before they can understand what actually happened, identify the customer's problem, estimate its urgency, and decide whether it should be escalated. This repetitive reading process consumes a significant amount of engineering time despite adding very little business value.

Many commercial support platforms have already recognized this problem. Products such as Zendesk AI, Intercom AI, Freshworks Freddy AI, and Salesforce Einstein automatically summarize customer conversations before an agent opens the ticket. Their goal is not to replace the support engineer's judgment but to eliminate the time spent extracting the essential information from long conversations. The engineering problem we are solving is therefore realistic: **given a customer support conversation, automatically produce a concise, structured summary that another software system can immediately consume.**

Although this sounds like a simple summarization task, we must already think like backend engineers rather than prompt engineers. The summary produced by our application will not only be read by humans; in a future version it may be stored in a database, displayed in a dashboard, used to trigger workflows, or passed to another service. That future integration influences the design decisions we make today.

---

# 2. Functional Requirements and the First Design Decision

The application will accept a single support ticket stored in a text file and produce a structured representation of that ticket. At a minimum, we want to identify a concise summary, the primary issue being reported, the urgency of the problem, the customer's sentiment, and a recommended next action for the support team.

A first implementation might simply prompt the model with _"Summarize this support ticket"_ and print whatever text it generates. That approach appears sufficient while the output is only being read by a human. The problem emerges as soon as another software component needs to consume the result. Suppose the frontend wants to display the ticket priority in a colored badge, or an analytics service wants to count how many authentication-related issues occurred this week. Free-form paragraphs become fragile because every response may use different wording, different ordering, or omit fields entirely.

For that reason, **Version 1 will use provider-native structured output rather than free-form text parsing**. OpenAI's structured output capability allows the model to generate data conforming to a predefined schema, and LangChain exposes this through `ChatOpenAI.with_structured_output()`. This approach produces typed Python objects instead of unpredictable prose and is the currently recommended pattern for models that support native structured output. ([LangChain Reference](https://reference.langchain.com/python/langchain-openai/chat_models/base/ChatOpenAI/with_structured_output?utm_source=chatgpt.com "with_structured_output | langchain_openai | LangChain Reference"))

---

# 3. System Architecture (Version 1)

The first version intentionally uses the smallest architecture capable of solving today's problem.

```text
Customer Support Ticket (.txt)
            │
            ▼
   ChatPromptTemplate
            │
            ▼
 ChatOpenAI (Structured Output)
            │
            ▼
   Pydantic Model
            │
            ▼
 Console Output
```

Notice what we are **deliberately not introducing**. There is no Retrieval-Augmented Generation because all required knowledge already exists in the input ticket. There are no tools because the model does not need to call external systems. There is no conversation memory because every ticket is processed independently. There is no LangGraph because the workflow contains exactly one model invocation and no conditional control flow. Adding any of these abstractions now would increase complexity without solving an actual engineering limitation, violating our governing design principle.

---

# 4. Project Setup (Isolated Folder)

The LangChain ecosystem evolves frequently, so before starting the implementation we verify the current recommended APIs. The current documentation recommends using `ChatOpenAI.with_structured_output()` with the provider's native JSON schema support for OpenAI-compatible models, and the latest `langchain-openai` release is in the 1.3.x series. ([LangChain Reference](https://reference.langchain.com/python/langchain-openai/chat_models/base/ChatOpenAI/with_structured_output?utm_source=chatgpt.com "with_structured_output | langchain_openai | LangChain Reference"))

Create the project.

```bash
mkdir genai-projects
cd genai-projects

mkdir project-01-smart-support-summarizer
cd project-01-smart-support-summarizer

python3 -m venv .venv

# Linux/macOS
source .venv/bin/activate

# Windows
# .venv\Scripts\activate

mkdir v1

touch requirements.txt
touch .env
touch sample_ticket.txt
touch v1/main.py
```

Create `requirements.txt`.

```text
langchain==1.0.3
langchain-openai==1.3.3
python-dotenv==1.1.1
pydantic==2.11.7
```

Install dependencies.

```bash
pip install -r requirements.txt
```

Create `.env`.

```env
OPENAI_API_KEY=your_openai_api_key
```

Create `sample_ticket.txt`.

```text
Hello Support,

Our team purchased the Premium plan yesterday.

Everything was working correctly until this morning.

Nobody in our company can log into the dashboard.

Password reset emails never arrive, even after checking spam.

We already tried different browsers and different devices.

This issue is blocking our production work.

Please help as soon as possible.

Thanks,
John
```

The project will evolve inside the same repository. Future versions (`v2`, `v3`, and beyond) will be added alongside `v1` so that the complete engineering evolution remains visible.

---

# 5. Schema and Contract Design

Before writing any LangChain code, we first design the application's data contract. This is an architectural decision rather than boilerplate because every downstream system will rely on this structure. If we change the schema later, every consumer of our summarizer may also need to change.

Our first version will use the following model:

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
        description="A concise summary of the support ticket."
    )

    primary_issue: str = Field(
        description="The customer's main reported problem."
    )

    priority: Priority = Field(
        description="Estimated business priority."
    )

    customer_sentiment: str = Field(
        description="Overall emotional tone of the customer."
    )

    recommended_action: str = Field(
        description="Suggested next action for the support engineer."
    )
```

Each field exists because another part of the system could reasonably consume it. The `summary` provides a quick overview for human readers, while `primary_issue` captures the central problem independently of conversational details. The `priority` field is modeled as an `Enum` instead of a plain string because the application should recognize only four valid business priorities rather than accepting arbitrary text. The remaining fields provide actionable operational information while remaining sufficiently general to apply across different support tickets. This schema becomes the contract that every future version of the project must continue to satisfy.

---

We'll stop here for Version 1 before writing any implementation code.

The reason is deliberate: in production engineering, **schema design precedes implementation**. Once a data contract is established, every subsequent design decision—including prompts, model configuration, validation, storage, APIs, and frontend rendering—can be evaluated against that contract rather than evolving unpredictably. In the next step, we'll implement the summarizer incrementally using this schema, beginning with the prompt template, then the model configuration, then provider-enforced structured output, and finally the invocation pipeline.