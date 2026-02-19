package handlers

import (
	"encoding/json"
	"net/http"
	"phrase-shift/backend/db"

	"github.com/go-chi/chi/v5"
)

func GetHistory(w http.ResponseWriter, r *http.Request) {
	phrases, err := db.GetAllPhrases()
	if err != nil {
		http.Error(w, "failed to get history", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(phrases)
}

func GetHistoryItem(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	phrase, err := db.GetPhraseByID(id)
	if err != nil {
		http.Error(w, "phrase not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(phrase)
}
