

https://github.com/user-attachments/assets/c1b2b9ef-89ca-43e7-8242-63267f6b6aff


---

## RAG data flow

### Document ingestion & vector indexing

1. **Upload** — user uploads files (PDF, DOCX, TXT) via the Corpora Manager UI.
2. **Extraction** — the Python extraction microservice pulls raw text and metadata.
3. **Chunking** — raw text is split into structured segments.
4. **Embedding** — chunks are converted into 1024-dimensional Voyage AI vectors.
5. **Storage** — chunks, metadata, and vectors are saved in PostgreSQL via `pgvector`.

### Two-stage retrieval & answer generation

1. **Query embedding** — the user's question is converted into a 1024-dim vector.
2. **Candidate retrieval** — PostgreSQL runs cosine similarity search (`<=>`) scoped by `tenantId`, `appId`, and `groupId`, returning top candidates (e.g. top 20).
3. **Reranking** — candidates are scored by the Voyage reranker and filtered to the top K (e.g. top 5).
4. **Generation** — the reranked context is passed to Kimi K3 (or OpenAI) to produce a grounded answer with citations.

---

## Voice assistant

- Client-side voice activity detection (VAD) monitors speech in real time.
- Audio is streamed via WebSockets/REST to the Python transcription microservice.
- Speech-to-text via Whisper Large v3/Turbo.
- The transcribed prompt feeds the RAG pipeline; the response is converted back to speech via TTS.
- A GLSL canvas shader animates listening/processing/speaking states.

---

## Multi-tenant isolation model

| Level          | Isolation mechanism                                                                            |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Tenant         | `Tenant` record with a dedicated UUID; every table stores a `tenantId`.                        |
| App            | `App` record scoped to a tenant, allowing multiple bots (e.g. HR Bot, Support Bot) per tenant. |
| Corpus (Group) | `Group` record scoping document sets to specific applications.                                 |
| API auth       | JWT for dashboard routes; `X-API-Key` for external query/upload endpoints.                     |

---

## Getting started

### Prerequisites

- Node.js v18+ or Bun
- Python 3.10+
- PostgreSQL 15+ with the `pgvector` extension
- Voyage AI API key and OpenAI API key (or NVIDIA-hosted Kimi K3)

### Required API keys

| Key                                         | Purpose                                                    | Required                  |
| ------------------------------------------- | ---------------------------------------------------------- | ------------------------- |
| `VOYAGE_API_KEY`                            | Embeddings & reranking                                     | Yes                       |
| `OPENAI_API_KEY`                            | LLM answer generation                                      | Yes (or `NVIDIA_API_KEY`) |
| `NVIDIA_API_KEY`                            | LLM generation via Kimi K3                                 | Alternative to OpenAI     |
| `RAG_SERVICE_API_KEY`                       | Shared secret between the gateway and Python microservices | Yes                       |
| `GROQ_API_KEY`                              | Voice assistant text-to-speech                             | Voice mode only           |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth login                                         | Google sign-in only       |

Get keys from [Voyage AI](https://www.voyageai.com/), [OpenAI](https://platform.openai.com/), [NVIDIA NIM](https://build.nvidia.com/), and [Groq](https://console.groq.com/).

### 1. Python AI microservices

```bash
cd microservices

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env   # Fill in VOYAGE_API_KEY, OPENAI_API_KEY, RAG_SERVICE_API_KEY, etc.

# Start FastAPI server
python3 server.py
# Server runs at http://localhost:8000
```

### 2. Backend gateway

```bash
cd vector_valut/backend

npm install
cp .env.example .env   # Fill in DATABASE_URL, JWT_SECRET_KEY, RAG_SERVICE_API_KEY, etc.

npx prisma migrate dev

npm run dev
# Backend runs at http://localhost:5000
```

### 3. Frontend dashboard

```bash
cd vector_valut/frontend/app

npm install
npm run dev
# Frontend runs at http://localhost:5173
```

---

## Design decisions & trade-offs

- **Two-stage retrieval instead of vector search alone** — raw cosine similarity over-fetches semantically similar but contextually weak matches. A cross-encoder reranker as a second pass trades a small latency cost for better precision on the chunks that reach the LLM.
- **Raw SQL for vector queries** — Prisma's query builder doesn't support `pgvector`'s `<=>` distance operator natively, so retrieval queries use raw SQL while the rest of the app (tenant/app/group CRUD) stays on the Prisma ORM.
- **Python microservices split from the Node gateway** — extraction, chunking, and calls to embedding/reranking/transcription/LLM providers benefit from Python's ML tooling, while the gateway's job (auth, tenancy, orchestration, WebSockets) is I/O-bound and better served by Node's event loop. Splitting them lets each scale independently.
- **Tenant → App → Group hierarchy** — modeled on multi-tenant SaaS needs: one tenant can run several distinct bots, each with its own isolated document corpus, instead of flattening everything under a single tenant-level namespace.

---

## Contact

- Developer: Mahesh N
- Email: maheshnmahesh567@gmail.com
- Repository: [VectorVault RAG Platform](https://github.com/maheshn567/vector-vault-rag)
