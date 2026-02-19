# Implementation Structure

## Repository Layout

```
phrase-shift/
├── docs/                        # Project documentation
│   ├── architecture.md          # System diagram and request flows
│   └── structure.md             # This file
│
├── backend/                     # Go API server
│   ├── main.go                  # Entry point: server setup, routing, middleware
│   ├── Dockerfile               # Multi-stage build (golang:alpine → alpine)
│   │
│   ├── models/
│   │   └── models.go            # Shared data types (Phrase, Translation, Config, LLMTranslation)
│   │
│   ├── db/
│   │   ├── db.go                # PostgreSQL connection + auto-migration (runs on startup)
│   │   └── queries.go           # All DB query functions (no ORM, raw sql)
│   │
│   ├── llm/
│   │   ├── anthropic.go         # Anthropic client, Translate() and GetDetail() calls
│   │   └── prompts.go           # Prompt templates: TranslatePrompt(), DetailPrompt()
│   │
│   └── handlers/
│       ├── translate.go         # POST /api/translate
│       ├── detail.go            # GET  /api/detail/:translationID
│       ├── tts.go               # POST /api/tts
│       ├── history.go           # GET  /api/history, GET /api/history/:id
│       └── config.go            # GET/PUT /api/config
│
├── frontend/                    # React SPA
│   ├── Dockerfile               # Multi-stage build (node → nginx:alpine)
│   ├── nginx.conf               # Serves static files; proxies /api/ to backend service
│   ├── vite.config.ts           # Vite config: React plugin, Tailwind plugin, dev proxy
│   │
│   └── src/
│       ├── main.tsx             # React root mount
│       ├── App.tsx              # Tab state, page routing
│       ├── index.css            # Tailwind import + global resets
│       │
│       ├── api/
│       │   └── client.ts        # Typed fetch wrappers for all backend endpoints + types
│       │
│       ├── components/
│       │   ├── Layout.tsx       # Sticky header + bottom tab nav (Translate/Review/Config)
│       │   ├── LanguageResult.tsx  # Translation card: native text, romanization, TTS button, "More" expand
│       │   └── PhraseCard.tsx   # Review list item: input text, language badges, timestamp
│       │
│       └── pages/
│           ├── Translate.tsx    # Main flow: textarea → submit → results list
│           ├── Review.tsx       # History list → tap to detail view
│           └── Config.tsx       # Language picker (suggested + custom) with save
│
├── docker-compose.yml           # Orchestrates postgres, backend, frontend
├── .env.example                 # Environment variable reference
├── .gitignore
└── README.md
```

## Backend

### `main.go`
Loads `.env`, connects to PostgreSQL, runs migrations, initializes the Anthropic LLM client, mounts all routes under `/api`, and applies CORS and logging middleware.

### `db/db.go`
Opens the PostgreSQL connection and runs inline SQL migrations on startup — no migration tool needed. Creates three tables: `phrases`, `translations`, `config`. Seeds the config row with the default 5 languages if not present.

### `db/queries.go`
Raw `database/sql` queries. Key patterns:
- `GetAllPhrases` / `GetPhraseByID` — JOIN across `phrases` and `translations`, assembled into nested structs in Go.
- `CreateTranslations` — batch insert via a prepared statement.
- `UpdateTranslationDetail` — caches LLM detail prose back into the translation row.
- `GetConfig` / `UpdateConfig` — reads/writes a `TEXT[]` column via `pq.StringArray`.

### `llm/prompts.go`
Pure functions that return prompt strings. No logic, no imports beyond `fmt`. Edit this file to change what the LLM is asked.

- **`TranslatePrompt`** — instructs Claude to return a strict JSON array with `language`, `native_text`, `romanized_text` fields.
- **`DetailPrompt`** — asks for a word-by-word breakdown of the native text, then cultural/linguistic context (nuance, formality, usage, pronunciation, cultural notes).

### `llm/anthropic.go`
Wraps the Anthropic Go SDK. Both functions use `claude-sonnet-4-5`. `Translate()` parses the JSON response (stripping markdown fences if present). `GetDetail()` returns raw prose.

### `handlers/tts.go`
Calls OpenAI's `tts-1` model with the `alloy` voice. Streams the MP3 response body directly to the HTTP response with `Cache-Control: public, max-age=3600`.

### `handlers/detail.go`
Checks if `translation.detail` is already populated in the DB before calling the LLM — acts as a server-side cache so repeated "More" clicks for the same translation are free.

---

## Frontend

### `api/client.ts`
Typed wrappers for every endpoint. The `tts()` function returns a `Blob` instead of JSON so it can be turned into an object URL for audio playback.

### `components/LanguageResult.tsx`
The core display unit. Each instance manages its own state for:
- **Detail expand/collapse** — lazy-fetches on first open, collapses on second click.
- **TTS playback** — fetches audio once, caches the blob URL in a `useRef` for instant replay. Shows a spinner while loading, a stop icon while playing.

### `pages/Translate.tsx`
Textarea with Enter-to-submit. On submit, shows a skeleton loader, then replaces it with a list of `LanguageResult` cards. A back button resets to the input view.

### `pages/Review.tsx`
Fetches history on mount. Tapping a `PhraseCard` switches to an inline detail view (same `LanguageResult` cards) without a page navigation.

### `pages/Config.tsx`
Language selection driven by a hardcoded list of 20 suggested languages. Selected languages are highlighted. Custom languages can be added via a text input. Saves to backend on button click with a brief "Saved!" confirmation state.

---

## Data Model

```
phrases
  id          UUID  PK
  input_text  TEXT
  created_at  TIMESTAMPTZ

translations
  id              UUID  PK
  phrase_id       UUID  FK → phrases
  language        TEXT
  native_text     TEXT
  romanized_text  TEXT  (nullable)
  detail          TEXT  (nullable, populated lazily)
  created_at      TIMESTAMPTZ

config
  id         INT   PK (always 1 — single row)
  languages  TEXT[]
```
