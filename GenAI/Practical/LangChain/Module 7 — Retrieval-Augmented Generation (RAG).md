Up to this point, every LangChain component has operated on information already available within the application's execution context. Prompt templates format existing data, chat models reason over that data, output parsers structure the response, and tools invoke external capabilities. However, a fundamental limitation remains: **the model cannot answer questions about information it has never seen**. If your company documentation was created yesterday, your private database contains customer records, or your knowledge base changes every hour, no amount of prompt engineering can compensate for missing information.

Retrieval-Augmented Generation (RAG) addresses this limitation by separating **knowledge storage** from **language generation**. Instead of attempting to train or fine-tune a model whenever data changes, the application retrieves relevant documents at runtime and supplies them as context for the model. LangChain treats every stage of this workflow—document loading, splitting, embedding, indexing, retrieval, and prompt composition—as composable Runnables, allowing retrieval to integrate naturally into LCEL pipelines.

---

# 1. Setup (Isolated Folder)

Create another completely independent project.

```bash
cd langchain-course

mkdir module-07-rag
cd module-07-rag

python3 -m venv .venv

# Linux / macOS
source .venv/bin/activate

# Windows
# .venv\Scripts\activate

touch main.py
touch knowledge.txt
touch requirements.txt
touch .env
```

Create `requirements.txt`.

```text
langchain==1.0.3
langchain-core==1.0.3
langchain-openai==1.3.3
langchain-text-splitters==1.0.0
langchain-chroma==1.0.0
chromadb==1.0.20
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

Create `knowledge.txt`.

```text
LangChain is an application framework for building LLM-powered software.

Runnable is the fundamental abstraction of LangChain.

LCEL composes Runnables into pipelines.

LangGraph is the recommended framework for stateful agents.

Chroma is an embedded vector database commonly used during local development.
```

---

# 2. Language-Agnostic Concept

The fundamental problem solved by RAG is **knowledge acquisition at inference time**.

A language model contains **parametric knowledge**. That knowledge is encoded in billions of learned parameters during training. Once training finishes, that knowledge becomes relatively static. Updating it generally requires another expensive training process.

An application, however, often possesses **non-parametric knowledge**. This information lives outside the model in databases, documents, PDFs, APIs, or knowledge bases. Unlike model parameters, these data sources can change continuously without retraining the model.

RAG bridges these two forms of knowledge.

Conceptually,

```text
User Question
        │
        ▼
Retrieve Relevant Knowledge
        │
        ▼
Inject Into Prompt
        │
        ▼
Language Model
        │
        ▼
Answer
```

The model is therefore not expected to memorize everything. Instead, it receives the most relevant external information immediately before inference.

This architecture has become the standard approach for enterprise AI systems because business knowledge changes far more frequently than foundation models.

---

## Why Not Fine-Tune?

A common misconception is that every custom AI application requires fine-tuning.

Suppose your company updates its employee handbook tomorrow.

Fine-tuning would require:

```text
Collect Dataset

↓

Train Model

↓

Validate Model

↓

Deploy New Model
```

RAG instead performs:

```text
Replace Document

↓

Re-index Embeddings

↓

Done
```

The second workflow is dramatically cheaper, faster, and easier to maintain.

---

# 3. Mechanism

A RAG pipeline consists of several independent abstractions.

## Document

Everything begins as a `Document`.

A document contains two things:

```text
Document
│
├── page_content
└── metadata
```

For example,

```python
Document(
    page_content="LangChain uses Runnables.",
    metadata={
        "source": "guide.pdf",
        "page": 3
    }
)
```

Notice that metadata is separate from the text itself.

Applications commonly store:

- filename
    
- page number
    
- author
    
- timestamp
    
- URL
    
- document ID
    

The model may never see this metadata, but the application can use it for citations, filtering, or auditing.

---

## Text Splitters

Large documents rarely fit inside an LLM's context window.

Suppose we have a 500-page PDF.

The model cannot process it as a single prompt.

Instead,

```text
Large Document

↓

Text Splitter

↓

Chunk 1
Chunk 2
Chunk 3
...
```

Each chunk becomes an independent `Document`.

Modern RAG systems almost always perform retrieval at the chunk level rather than the document level.

---

## Embeddings

A language model predicts text.

An embedding model represents meaning numerically.

Conceptually,

```text
"Redis"

↓

Embedding Model

↓

[0.12, -0.44, 0.89, ...]
```

The resulting vector captures semantic information rather than literal words.

Similar meanings produce nearby vectors.

For example,

```text
Redis
Cache
Memcached
```

will generally occupy nearby regions of vector space.

Whereas

```text
Redis
Banana
Basketball
```

will be much farther apart.

This semantic representation enables similarity search.

---

## Vector Store

A vector store indexes embeddings.

Conceptually,

```text
Chunk

↓

Embedding

↓

Vector Store
```

At query time,

```text
Question

↓

Embedding

↓

Similarity Search

↓

Most Relevant Chunks
```

The vector store never understands language.

It only compares vectors mathematically.

Popular implementations include:

- Chroma
    
- FAISS
    
- Pinecone
    
- Qdrant
    
- Milvus
    
- Weaviate
    

LangChain abstracts all of these behind the same `VectorStore` interface.

---

## Retriever

The retriever is perhaps the most important abstraction in LangChain's RAG architecture.

A vector store manages storage.

A retriever manages retrieval.

Conceptually,

```text
Vector Store

↓

Retriever

↓

Relevant Documents
```

The retriever exposes a consistent interface regardless of how retrieval is implemented.

Today it may perform similarity search.

Tomorrow it might perform:

- hybrid search
    
- BM25
    
- reranking
    
- metadata filtering
    
- parent-child retrieval
    

The surrounding pipeline remains unchanged because the retriever is itself a Runnable.

---

# 4. Current Python Syntax and Implementation

Create `main.py`.

```python
from dotenv import load_dotenv

from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_openai import OpenAIEmbeddings

load_dotenv()

documents = [
    Document(
        page_content="LangChain uses the Runnable abstraction.",
        metadata={"source": "guide"},
    ),
    Document(
        page_content="LCEL composes Runnables into pipelines.",
        metadata={"source": "guide"},
    ),
    Document(
        page_content="LangGraph is recommended for building stateful agents.",
        metadata={"source": "guide"},
    ),
]

embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small"
)

vectorstore = Chroma.from_documents(
    documents=documents,
    embedding=embeddings,
)

retriever = vectorstore.as_retriever(
    search_kwargs={"k": 2}
)

prompt = ChatPromptTemplate.from_template(
    """
Use only the following context.

Context:
{context}

Question:
{question}
"""
)

model = ChatOpenAI(
    model="gpt-5",
    temperature=0,
)

chain = (
    {
        "context": retriever,
        "question": lambda x: x,
    }
    | prompt
    | model
    | StrOutputParser()
)

response = chain.invoke(
    "What is LangGraph?"
)

print(response)
```

Run:

```bash
python main.py
```

Example output:

```text
LangGraph is the recommended framework for building stateful AI agents in the LangChain ecosystem.
```

---

## What Happens Internally?

The execution flow is conceptually:

```text
Question
      │
      ▼
Retriever
      │
      ▼
Relevant Documents
      │
      ▼
Prompt Template
      │
      ▼
Chat Model
      │
      ▼
Answer
```

Notice that the retriever participates in LCEL exactly like every other Runnable.

This is one of LangChain's strongest design decisions.

---

## Why Is the Retriever a Runnable?

Suppose today's application uses Chroma.

```text
Retriever

↓

Chroma
```

Tomorrow the company migrates to Pinecone.

```text
Retriever

↓

Pinecone
```

Nothing changes upstream.

The prompt template still receives documents.

The model still receives context.

LCEL remains identical.

This loose coupling is the primary reason LangChain introduces the retriever abstraction instead of exposing vector store APIs directly throughout the application.

---

# 5. JS Equivalent Note

The JavaScript implementation follows the same architecture.

```javascript
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { Chroma } from "@langchain/community/vectorstores/chroma";

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
});

const vectorStore =
  await Chroma.fromDocuments(
    docs,
    embeddings
  );

const retriever =
  vectorStore.asRetriever();

const chain = RunnableSequence.from([
  {
    context: retriever,
    question: (input) => input,
  },
  prompt,
  model,
]);
```

The conceptual model is identical. The retriever remains a Runnable, the vector store abstracts storage, and embeddings provide the semantic representation used for similarity search. JavaScript differs primarily in its asynchronous execution model and package organization.

---

# 6. Design Rationale and Tradeoffs

RAG deliberately separates **reasoning** from **knowledge storage**. This allows applications to update their knowledge base without retraining or fine-tuning the underlying language model. By retrieving only the most relevant document chunks at inference time, the application reduces context size while improving factual grounding.

The architecture does introduce additional latency because retrieval, embedding generation (during indexing), and vector search become part of the request pipeline. The quality of the system also depends heavily on chunking strategy, embedding model selection, retrieval parameters, and prompt design. Poor chunk boundaries or weak retrieval quality often have a greater impact on answer accuracy than the choice of chat model itself.

---

# 7. Practical Application Scenario

Consider an internal engineering assistant for a large software company.

```text
Developer Question
        │
        ▼
Retriever
        │
        ▼
Engineering Docs
        │
        ▼
API References
        │
        ▼
Architecture Guides
        │
        ▼
Prompt Template
        │
        ▼
Chat Model
        │
        ▼
Answer With Company Knowledge
```

The language model has no inherent knowledge of the company's internal APIs, deployment procedures, or architectural decisions. By retrieving the relevant documentation for each request, the assistant produces responses grounded in current organizational knowledge rather than relying solely on pretraining.

---

# 8. Quick-Reference Syntax Recap

```python
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small"
)

vectorstore = Chroma.from_documents(
    documents,
    embeddings,
)

retriever = vectorstore.as_retriever()

chain = (
    {
        "context": retriever,
        "question": lambda x: x,
    }
    | prompt
    | model
    | StrOutputParser()
)
```

## What You Learned

This module established the complete architecture of **Retrieval-Augmented Generation**. You learned that RAG augments a model's static, parametric knowledge with dynamically retrieved external information, eliminating the need to retrain models whenever business data changes. You also learned the distinct responsibilities of the major abstractions: `Document` encapsulates content and metadata, `TextSplitter` partitions large documents into retrieval-friendly chunks, `Embeddings` convert text into semantic vectors, `VectorStore` indexes those vectors for efficient similarity search, and `Retriever` provides a uniform retrieval interface that integrates seamlessly into LCEL because it is itself a `Runnable`.

The next module shifts from **knowledge retrieval** to **conversation state**. Rather than retrieving external documents, we will explore how LangChain manages evolving conversational context through **message history**, `RunnableWithMessageHistory`, and the state-management model that underpins modern LangGraph applications.