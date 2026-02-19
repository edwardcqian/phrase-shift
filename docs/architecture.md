# Architecture

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        docker-compose                           │
│                                                                 │
│  ┌──────────────────┐        ┌──────────────────────────────┐  │
│  │    frontend       │        │          backend             │  │
│  │  nginx:alpine     │        │       Go + chi router        │  │
│  │                   │        │                              │  │
│  │  React (Vite)     │─/api/─▶│  handlers/                  │  │
│  │  TypeScript       │◀───────│    translate.go              │  │
│  │  Tailwind CSS     │        │    detail.go                 │  │
│  │                   │        │    tts.go                    │  │
│  │  :8081 (host)     │        │    history.go                │  │
│  │  :80   (container)│        │    config.go                 │  │
│  └──────────────────┘        │                              │  │
│                               │  :8080                       │  │
│                               └──────────┬───────────────────┘  │
│                                          │                       │
│                          ┌───────────────┼──────────────┐       │
│                          │               │              │       │
│                          ▼               ▼              ▼       │
│                   ┌────────────┐  ┌──────────┐  ┌──────────┐  │
│                   │ PostgreSQL │  │Anthropic │  │  OpenAI  │  │
│                   │  :5432     │  │  Claude  │  │  TTS-1   │  │
│                   │(container) │  │Sonnet 4.5│  │  (audio) │  │
│                   └────────────┘  └──────────┘  └──────────┘  │
│                                   (external API) (external API) │
└─────────────────────────────────────────────────────────────────┘
```

## Request Flows

### Translate
```
User types phrase
  → POST /api/translate
    → db.GetConfig()           (fetch user's language list)
    → llm.Translate()          (Anthropic: structured JSON response)
    → db.CreatePhrase()        (persist input)
    → db.CreateTranslations()  (persist results)
    → db.GetPhraseByID()       (return full record)
  ← PhraseWithTranslations JSON
```

### View More (detail)
```
User clicks "More"
  → GET /api/detail/:translationID
    → db.GetTranslationByID()  (check if detail already cached)
    → [cache hit]  return detail immediately
    → [cache miss] llm.GetDetail()           (Anthropic: contextual prose)
                   db.UpdateTranslationDetail() (cache in DB)
  ← DetailResponse JSON
```

### TTS
```
User clicks speaker button
  → [in-memory cache hit]  play existing blob URL immediately
  → [cache miss] POST /api/tts
    → openai.Audio.Speech.New()  (OpenAI TTS-1, alloy voice)
    ← MP3 audio stream (Cache-Control: public, max-age=3600)
  ← Blob → createObjectURL → Audio.play()
  (blob URL stored in component ref for subsequent plays)
```

### Review
```
User opens Review tab
  → GET /api/history
    → db.GetAllPhrases()  (phrases + translations joined, ordered by date)
  ← PhraseWithTranslations[] JSON

User taps a phrase → detail view rendered client-side from cached data
  (clicking "More" still calls /api/detail/:id as needed)
```

### Config
```
User opens Config tab
  → GET /api/config        → db.GetConfig()
User saves changes
  → PUT /api/config        → db.UpdateConfig()  (updates TEXT[] column)
```
