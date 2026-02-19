package llm

import "fmt"

// TranslatePrompt builds the translation prompt for the given input text and language list.
func TranslatePrompt(inputText, langList string) string {
	return fmt.Sprintf(`You are a translation assistant. Translate the following English text into each of the listed languages.

For each language, provide:
1. The translation in the native script/alphabet
2. A romanized version ONLY if the language does not use the Latin alphabet (e.g., Japanese, Chinese, Korean, Arabic, Russian, Hindi). Leave romanized_text as an empty string for Latin-script languages like Spanish, French, etc.

Input text: "%s"
Languages: %s

Respond with ONLY a valid JSON array, no markdown, no explanation. Format:
[
  {
    "language": "Japanese",
    "native_text": "こんにちは",
    "romanized_text": "Konnichiwa"
  },
  {
    "language": "Spanish",
    "native_text": "Hola",
    "romanized_text": ""
  }
]`, inputText, langList)
}

// DetailPrompt builds the context/detail prompt for a given translation.
func DetailPrompt(original, nativeText, language string) string {
	return fmt.Sprintf(`The English phrase "%s" translates to "%s" in %s.

Please provide the following in English:

1. Word-by-word breakdown: For each individual word or meaningful part of "%s", give its direct English translation and a brief note on its grammatical role (e.g. verb, noun, particle, suffix).

2. Cultural and linguistic context:
- Nuance and meaning
- Formality level (formal, informal, neutral)
- When to use this phrase vs alternatives
- Pronunciation tips (if applicable)
- Any cultural notes

Keep the overall response concise and informative (3-5 short paragraphs).`, original, nativeText, language, nativeText)
}
