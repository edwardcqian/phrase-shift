package models

import "time"

type Phrase struct {
	ID        string    `json:"id"`
	InputText string    `json:"input_text"`
	CreatedAt time.Time `json:"created_at"`
}

type Translation struct {
	ID            string    `json:"id"`
	PhraseID      string    `json:"phrase_id"`
	Language      string    `json:"language"`
	NativeText    string    `json:"native_text"`
	RomanizedText string    `json:"romanized_text,omitempty"`
	Detail        string    `json:"detail,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
}

type PhraseWithTranslations struct {
	Phrase
	Translations []Translation `json:"translations"`
}

type Config struct {
	Languages []string `json:"languages"`
}

// LLM response structure for translation
type LLMTranslation struct {
	Language      string `json:"language"`
	NativeText    string `json:"native_text"`
	RomanizedText string `json:"romanized_text,omitempty"`
}
