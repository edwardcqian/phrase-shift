package llm

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/anthropics/anthropic-sdk-go"
	"phrase-shift/backend/models"
)

var client anthropic.Client

func Init() {
	client = anthropic.NewClient()
}

// Translate sends the input text and languages to Claude and returns structured translations.
func Translate(ctx context.Context, inputText string, languages []string) ([]models.LLMTranslation, error) {
	langList := strings.Join(languages, ", ")
	prompt := TranslatePrompt(inputText, langList)

	message, err := client.Messages.New(ctx, anthropic.MessageNewParams{
		Model:     anthropic.ModelClaudeSonnet4_5,
		MaxTokens: 1024,
		Messages: []anthropic.MessageParam{
			anthropic.NewUserMessage(anthropic.NewTextBlock(prompt)),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("anthropic API error: %w", err)
	}

	if len(message.Content) == 0 {
		return nil, fmt.Errorf("empty response from LLM")
	}

	rawJSON := message.Content[0].Text
	// Strip markdown code fences if present
	rawJSON = strings.TrimSpace(rawJSON)
	if strings.HasPrefix(rawJSON, "```") {
		lines := strings.Split(rawJSON, "\n")
		rawJSON = strings.Join(lines[1:len(lines)-1], "\n")
	}

	var translations []models.LLMTranslation
	if err := json.Unmarshal([]byte(rawJSON), &translations); err != nil {
		return nil, fmt.Errorf("failed to parse LLM response: %w\nraw: %s", err, rawJSON)
	}

	return translations, nil
}

// GetDetail returns cultural/linguistic context for a translation.
func GetDetail(ctx context.Context, original, nativeText, language string) (string, error) {
	prompt := DetailPrompt(original, nativeText, language)

	message, err := client.Messages.New(ctx, anthropic.MessageNewParams{
		Model:     anthropic.ModelClaudeSonnet4_5,
		MaxTokens: 1024,
		Messages: []anthropic.MessageParam{
			anthropic.NewUserMessage(anthropic.NewTextBlock(prompt)),
		},
	})
	if err != nil {
		return "", fmt.Errorf("anthropic API error: %w", err)
	}

	if len(message.Content) == 0 {
		return "", fmt.Errorf("empty response from LLM")
	}

	return message.Content[0].Text, nil
}
