package handlers

import (
	"encoding/json"
	"net/http"
	"phrase-shift/backend/db"
	"phrase-shift/backend/llm"

	"github.com/go-chi/chi/v5"
)

type DetailResponse struct {
	TranslationID string `json:"translation_id"`
	Detail        string `json:"detail"`
}

func GetDetail(w http.ResponseWriter, r *http.Request) {
	translationID := chi.URLParam(r, "translationID")

	// Get translation
	translation, err := db.GetTranslationByID(translationID)
	if err != nil {
		http.Error(w, "translation not found", http.StatusNotFound)
		return
	}

	// If we already have detail cached, return it
	if translation.Detail != "" {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(DetailResponse{
			TranslationID: translationID,
			Detail:        translation.Detail,
		})
		return
	}

	// Get phrase for original text
	phrase, err := db.GetPhraseByID(translation.PhraseID)
	if err != nil {
		http.Error(w, "phrase not found", http.StatusNotFound)
		return
	}

	// Call LLM for detail
	detail, err := llm.GetDetail(r.Context(), phrase.InputText, translation.NativeText, translation.Language)
	if err != nil {
		http.Error(w, "failed to get detail: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Cache the detail
	if err := db.UpdateTranslationDetail(translationID, detail); err != nil {
		// Non-fatal: log but still return result
		_ = err
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(DetailResponse{
		TranslationID: translationID,
		Detail:        detail,
	})
}
