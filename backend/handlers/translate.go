package handlers

import (
	"encoding/json"
	"net/http"
	"phrase-shift/backend/db"
	"phrase-shift/backend/llm"
)

type TranslateRequest struct {
	Text      string   `json:"text"`
	Languages []string `json:"languages,omitempty"`
}

func Translate(w http.ResponseWriter, r *http.Request) {
	var req TranslateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if req.Text == "" {
		http.Error(w, "text is required", http.StatusBadRequest)
		return
	}

	// Use provided languages or fall back to config
	languages := req.Languages
	if len(languages) == 0 {
		var err error
		languages, err = db.GetConfig()
		if err != nil {
			http.Error(w, "failed to get config", http.StatusInternalServerError)
			return
		}
	}

	if len(languages) == 0 {
		http.Error(w, "no languages configured", http.StatusBadRequest)
		return
	}

	// Call LLM
	translations, err := llm.Translate(r.Context(), req.Text, languages)
	if err != nil {
		http.Error(w, "translation failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Persist phrase and translations
	phraseID, err := db.CreatePhrase(req.Text)
	if err != nil {
		http.Error(w, "failed to save phrase", http.StatusInternalServerError)
		return
	}

	if err := db.CreateTranslations(phraseID, translations); err != nil {
		http.Error(w, "failed to save translations", http.StatusInternalServerError)
		return
	}

	// Return full phrase with translations
	result, err := db.GetPhraseByID(phraseID)
	if err != nil {
		http.Error(w, "failed to retrieve result", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}
