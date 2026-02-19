package handlers

import (
	"encoding/json"
	"net/http"
	"phrase-shift/backend/db"
	"phrase-shift/backend/models"
)

func GetConfig(w http.ResponseWriter, r *http.Request) {
	languages, err := db.GetConfig()
	if err != nil {
		http.Error(w, "failed to get config", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.Config{Languages: languages})
}

func UpdateConfig(w http.ResponseWriter, r *http.Request) {
	var config models.Config
	if err := json.NewDecoder(r.Body).Decode(&config); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if len(config.Languages) == 0 {
		http.Error(w, "at least one language is required", http.StatusBadRequest)
		return
	}

	if err := db.UpdateConfig(config.Languages); err != nil {
		http.Error(w, "failed to update config", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(config)
}
