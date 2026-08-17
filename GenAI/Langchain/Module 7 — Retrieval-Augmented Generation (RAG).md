## 1. Language-agnostic Concept

One of the fundamental limitations of every large language model is that **its parameters are not a database**. During pretraining, the model compresses statistical relationships from enormous corpora into billions of numerical parameters. Those parameters encode patterns, not an indexed knowledge base. Consequently, the model cannot reliably answer questions about information that was created after training, proprietary company documents, customer-specific records, or any data that should not have been included in its training corpus.

A naive solution is to place the entire knowledge base into the prompt. This works only for very small datasets. Modern enterprises routinely maintain gigabytes or terabytes of documentation, source code, PDFs, contracts, tickets, and knowledge articles. Even with very large context windows, sending all of that information to the model for every request is computationally infeasible, financially expensive, and often exceeds provider limits.

**Retrieval-Augmented Generation (RAG)** addresses this problem by introducing an information retrieval stage before inference. Instead of asking the model to remember everything, the application first searches an external knowledge source for the documents most relevant to the user's query. Only those retrieved documents are inserted into the prompt, allowing the model to generate an answer grounded in current, domain-specific information.

The key architectural insight is that **the LLM is no longer responsible for storing knowledge**. The LLM is responsible for **reasoning over knowledge retrieved by another system**.

Conceptually, the architecture changes from:

```text
User Question
      │
      ▼
LLM
      │
      ▼
Answer
```

to:

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
LLM
      │
      ▼
Grounded Answer
```

The retriever and the LLM have fundamentally different responsibilities. The retriever optimizes for finding relevant information, while the LLM optimizes for understanding and synthesizing that information into natural language.

---

## 2. Mechanism

A modern RAG pipeline consists of several abstractions that each solve a distinct problem. Understanding how they fit together is more important than memorizing individual classes.

### Documents

The basic unit of retrieval is the **Document**.

A `Document` is not simply a string. It is an object containing the document's content along with metadata that describes its origin.

Conceptually:

```text
Document
├── page_content
└── metadata
    ├── source
    ├── page
    ├── author
    └── ...
```

The metadata is never ignored. It enables citations, filtering, ranking, document tracing, and access control. For example, two documents may contain similar text, but only one belongs to the user's department. Metadata allows the retriever to distinguish between them.

---

### Text Splitting

Embedding models have context limits, and retrieval quality generally decreases when documents are excessively large. Therefore, raw documents are divided into smaller chunks before embedding.

```text
Large PDF
      │
      ▼
Text Splitter
      │
      ▼
Chunk 1
Chunk 2
Chunk 3
Chunk 4
```

The objective is not merely to satisfy token limits. Retrieval operates at the chunk level. If an entire 100-page manual were represented by a single embedding vector, a search for "JWT refresh token expiration" would retrieve the entire manual rather than the specific section discussing refresh tokens. Splitting produces finer-grained retrieval units.

---

### Embeddings

An embedding model transforms text into a high-dimensional numerical vector.

```text
"JWT authentication"

        │

Embedding Model

        │

▼

[0.12, -0.44, 0.91, ...]
```

Unlike chat models, embedding models do **not generate language**. They encode semantic meaning into vector space. Two texts discussing similar concepts will typically produce vectors that are close together according to a similarity metric such as cosine similarity.

This distinction is fundamental:

|Chat Model|Embedding Model|
|---|---|
|Text → Text|Text → Vector|
|Generates language|Encodes meaning|
|Used during inference|Used during indexing and retrieval|

LangChain abstracts embedding providers behind a common interface, allowing the application to switch between OpenAI, Voyage AI, Cohere, Google, or local embedding models with minimal changes. ([docs.langchain.com](https://docs.langchain.com/oss/python/langchain/embeddings?utm_source=chatgpt.com))

---

### Vector Store

After embeddings are computed, they are stored in a **VectorStore**.

Conceptually:

```text
Document
        │
        ▼
Embedding Model
        │
        ▼
Vector
        │
        ▼
Vector Store
```

A vector store is essentially an index optimized for nearest-neighbor search rather than exact string matching. Given a query embedding, it returns the stored vectors that are closest in semantic space.

LangChain defines a provider-independent `VectorStore` interface, while concrete implementations include Chroma, FAISS, Pinecone, Qdrant, Milvus, Weaviate, and others. Because the interface is standardized, the surrounding application logic remains largely unchanged when switching backends. ([docs.langchain.com](https://docs.langchain.com/oss/python/langchain/vectorstores?utm_source=chatgpt.com))

---

### Retriever

A vector store provides low-level search operations such as `similarity_search()`. A **Retriever** elevates that functionality into a higher-level Runnable whose job is simply:

> **Question → Relevant Documents**

```text
Question
      │
      ▼
Retriever
      │
      ▼
List<Document>
```

This abstraction is extremely important because it decouples retrieval strategy from storage technology. Today's retriever may query a vector database. Tomorrow it might perform hybrid search, BM25, reranking, metadata filtering, or query expansion. The rest of the application interacts only with the Retriever interface.

Modern LangChain retrievers implement the Runnable interface, meaning they compose directly inside LCEL pipelines. ([docs.langchain.com](https://docs.langchain.com/oss/python/langchain/retrieval?utm_source=chatgpt.com))

---

### Complete RAG Flow

Putting everything together:

```text
                Offline Indexing
                ────────────────

Documents
      │
      ▼
Text Splitter
      │
      ▼
Chunks
      │
      ▼
Embedding Model
      │
      ▼
Vector Store


                Online Inference
                ───────────────

User Question
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

Notice that indexing and inference are separate phases. Documents are embedded once during indexing, while user questions are processed repeatedly during inference.

---

## 3. Current Python Syntax

### Creating Documents

```python
from langchain_core.documents import Document

documents = [
    Document(
        page_content="JWT uses signed tokens.",
        metadata={"source": "auth.md"},
    ),
    Document(
        page_content="OAuth delegates authorization.",
        metadata={"source": "oauth.md"},
    ),
]
```

Each document carries both content and metadata.

---

### Splitting Documents

Current LangChain places text splitters in the dedicated `langchain-text-splitters` package.

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
)

chunks = splitter.split_documents(documents)
```

`RecursiveCharacterTextSplitter` is generally recommended as the default splitter because it attempts to preserve natural document boundaries while recursively splitting when necessary. ([docs.langchain.com](https://docs.langchain.com/oss/python/langchain/text_splitters?utm_source=chatgpt.com))

---

### Creating a Vector Store

The exact embedding provider is interchangeable.

```python
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma

embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small"
)

vector_store = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
)
```

Notice that the vector store never interacts directly with the chat model. Its only dependency is an embedding model.

---

### Creating a Retriever

Every vector store can expose itself as a retriever.

```python
retriever = vector_store.as_retriever()
```

The retriever is now a Runnable.

```python
docs = retriever.invoke(
    "Explain JWT refresh tokens."
)
```

The returned value is:

```python
list[Document]
```

not generated text.

---

### Composing a RAG Pipeline

A minimal conceptual LCEL pipeline looks like this:

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI

prompt = ChatPromptTemplate.from_template("""
Context:
{context}

Question:
{question}
""")

chain = (
    {
        "context": retriever,
        "question": lambda x: x,
    }
    | prompt
    | ChatOpenAI(model="gpt-5-nano")
    | StrOutputParser()
)

response = chain.invoke(
    "Explain JWT refresh tokens."
)
```

Observe what happens internally.

```text
Question
    │
    ├───────────────┐
    ▼               │
Retriever           │
    │               │
Documents           │
    └──────┐        │
           ▼        ▼
        Prompt Template
              │
              ▼
         Chat Model
              │
              ▼
        String Output
```

The retriever participates in the LCEL pipeline exactly like a prompt template or chat model because it implements the Runnable interface.

---

## 4. JS Equivalent Note

The JavaScript architecture is almost identical.

```javascript
import { RecursiveCharacterTextSplitter }
from "@langchain/textsplitters";

import { OpenAIEmbeddings }
from "@langchain/openai";

import { Chroma }
from "@langchain/community/vectorstores/chroma";

const splitter =
  new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });

const chunks =
  await splitter.splitDocuments(documents);

const embeddings =
  new OpenAIEmbeddings({
    model: "text-embedding-3-small",
  });

const vectorStore =
  await Chroma.fromDocuments(
    chunks,
    embeddings
  );

const retriever =
  vectorStore.asRetriever();
```

The mental model remains unchanged.

|Python|JavaScript|
|---|---|
|`Document`|`Document`|
|`RecursiveCharacterTextSplitter`|`RecursiveCharacterTextSplitter`|
|`OpenAIEmbeddings`|`OpenAIEmbeddings`|
|`VectorStore`|`VectorStore`|
|`Retriever`|`Retriever`|

The primary difference is again Python's optional synchronous API versus JavaScript's asynchronous execution model.

---

## 5. Design Rationale and Tradeoffs

The RAG architecture deliberately separates **knowledge storage** from **language reasoning**. Instead of forcing the model to memorize an ever-growing corpus, knowledge is maintained in an external retrieval system where it can be updated independently of the model. This reduces hallucinations, keeps responses aligned with current information, and eliminates the need to retrain or fine-tune the model whenever documents change. Because retrievers implement the Runnable interface, retrieval becomes just another stage in the LCEL pipeline rather than a special-case component.

This design introduces additional latency because each request now performs retrieval before generation. Indexing also incurs storage costs and preprocessing time, particularly for large document collections. Retrieval quality depends heavily on chunking strategy, embedding model quality, metadata design, and the search algorithm. A weak retrieval pipeline cannot be compensated for by a stronger language model because the model can only reason over the information it receives.

An important architectural principle is that **retrieval is a separate engineering discipline from generation**. Improving embeddings, reranking, metadata filters, or chunking often produces larger quality gains than simply replacing one chat model with another.

---

## 6. Practical Application Scenario

Consider an internal AI assistant for your company's engineering organization. The documentation includes API specifications, architecture decision records, incident reports, runbooks, and source-code documentation. Retraining a language model every time these documents change would be impractical.

Instead, the workflow is divided into two distinct phases.

During indexing:

```text
Markdown Files
        │
        ▼
Text Splitter
        │
        ▼
Embeddings
        │
        ▼
Vector Database
```

During inference:

```text
Developer Question
        │
        ▼
Retriever
        │
        ▼
Relevant Documentation
        │
        ▼
Prompt Template
        │
        ▼
Chat Model
        │
        ▼
Grounded Answer
```

Suppose a developer asks:

> "How does our payment service validate JWT refresh tokens?"

The retriever locates the authentication design document, extracts only the relevant sections describing refresh-token validation, and supplies those chunks to the prompt. The language model then explains the process using the retrieved documentation rather than relying on potentially outdated pretraining knowledge.

This architecture illustrates why RAG has become a foundational pattern in production GenAI systems. It enables applications to answer questions about proprietary, frequently changing, or domain-specific information while keeping the language model focused on what it does best: synthesizing and explaining the retrieved knowledge.