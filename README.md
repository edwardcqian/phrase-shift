# Phrase Shift

A translation app that lets you type any English word or phrase and instantly see it rendered in multiple languages — with romanization, pronunciation audio, and cultural context on demand.

## Stack

- **Backend** — Go, chi router, PostgreSQL
- **Frontend** — React, Vite, TypeScript, Tailwind CSS
- **LLM** — Anthropic Claude Sonnet 4.5 (translations + context)
- **TTS** — OpenAI TTS-1 (audio playback)

## Getting Started

### 1. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your API keys:

```env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

### 2. Start

```bash
docker compose up --build
```

The app will be available at **http://localhost:8081**.

## Features

- **Translate** — Enter any English word, phrase, or sentence and get translations in all configured languages, with native script and romanization where applicable.
- **Listen** — Click the speaker button on any translation to hear it spoken aloud via TTS. Audio is cached after the first play.
- **More** — Expand any translation for a word-by-word breakdown and cultural/linguistic context in English.
- **Review** — Browse all past translations and revisit any phrase in full detail.
- **Config** — Choose which languages to translate into from a curated list or add your own.

## API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/translate` | Translate text into configured languages |
| `POST` | `/api/tts` | Generate TTS audio for a translation |
| `GET` | `/api/detail/:translationID` | Get cultural context for a translation |
| `GET` | `/api/history` | List all past phrases and translations |
| `GET` | `/api/history/:id` | Get a single phrase with all translations |
| `GET` | `/api/config` | Get current language config |
| `PUT` | `/api/config` | Update language config |
