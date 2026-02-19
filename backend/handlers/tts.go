package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"os"

	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
)

type TTSRequest struct {
	Text     string `json:"text"`
	Language string `json:"language"`
}

func TTS(w http.ResponseWriter, r *http.Request) {
	var req TTSRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	if req.Text == "" {
		http.Error(w, "text is required", http.StatusBadRequest)
		return
	}

	client := openai.NewClient(option.WithAPIKey(os.Getenv("OPENAI_API_KEY")))

	resp, err := client.Audio.Speech.New(context.Background(), openai.AudioSpeechNewParams{
		Model: openai.SpeechModelTTS1,
		Input: req.Text,
		Voice: openai.AudioSpeechNewParamsVoiceAlloy,
	})
	if err != nil {
		http.Error(w, "TTS failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", "audio/mpeg")
	w.Header().Set("Cache-Control", "public, max-age=3600")

	buf := make([]byte, 32*1024)
	for {
		n, err := resp.Body.Read(buf)
		if n > 0 {
			w.Write(buf[:n])
		}
		if err != nil {
			break
		}
	}
}
