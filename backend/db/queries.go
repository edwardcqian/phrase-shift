package db

import (
	"database/sql"
	"fmt"
	"phrase-shift/backend/models"

	"github.com/lib/pq"
)

// Phrases

func CreatePhrase(inputText string) (string, error) {
	var id string
	err := DB.QueryRow(
		`INSERT INTO phrases (input_text) VALUES ($1) RETURNING id`,
		inputText,
	).Scan(&id)
	return id, err
}

func GetAllPhrases() ([]models.PhraseWithTranslations, error) {
	rows, err := DB.Query(`
		SELECT p.id, p.input_text, p.created_at,
		       t.id, t.language, t.native_text, t.romanized_text, t.detail, t.created_at
		FROM phrases p
		LEFT JOIN translations t ON t.phrase_id = p.id
		ORDER BY p.created_at DESC, t.language ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	phraseMap := make(map[string]*models.PhraseWithTranslations)
	var order []string

	for rows.Next() {
		var p models.Phrase
		var t models.Translation
		var tID, tLang, tNative sql.NullString
		var tRomanized, tDetail sql.NullString
		var tCreatedAt sql.NullTime

		err := rows.Scan(
			&p.ID, &p.InputText, &p.CreatedAt,
			&tID, &tLang, &tNative, &tRomanized, &tDetail, &tCreatedAt,
		)
		if err != nil {
			return nil, err
		}

		if _, ok := phraseMap[p.ID]; !ok {
			phraseMap[p.ID] = &models.PhraseWithTranslations{
				Phrase:       p,
				Translations: []models.Translation{},
			}
			order = append(order, p.ID)
		}

		if tID.Valid {
			t.ID = tID.String
			t.PhraseID = p.ID
			t.Language = tLang.String
			t.NativeText = tNative.String
			t.RomanizedText = tRomanized.String
			t.Detail = tDetail.String
			if tCreatedAt.Valid {
				t.CreatedAt = tCreatedAt.Time
			}
			phraseMap[p.ID].Translations = append(phraseMap[p.ID].Translations, t)
		}
	}

	result := make([]models.PhraseWithTranslations, 0, len(order))
	for _, id := range order {
		result = append(result, *phraseMap[id])
	}
	return result, nil
}

func GetPhraseByID(id string) (*models.PhraseWithTranslations, error) {
	rows, err := DB.Query(`
		SELECT p.id, p.input_text, p.created_at,
		       t.id, t.language, t.native_text, t.romanized_text, t.detail, t.created_at
		FROM phrases p
		LEFT JOIN translations t ON t.phrase_id = p.id
		WHERE p.id = $1
		ORDER BY t.language ASC
	`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result *models.PhraseWithTranslations

	for rows.Next() {
		var p models.Phrase
		var t models.Translation
		var tID, tLang, tNative sql.NullString
		var tRomanized, tDetail sql.NullString
		var tCreatedAt sql.NullTime

		err := rows.Scan(
			&p.ID, &p.InputText, &p.CreatedAt,
			&tID, &tLang, &tNative, &tRomanized, &tDetail, &tCreatedAt,
		)
		if err != nil {
			return nil, err
		}

		if result == nil {
			result = &models.PhraseWithTranslations{
				Phrase:       p,
				Translations: []models.Translation{},
			}
		}

		if tID.Valid {
			t.ID = tID.String
			t.PhraseID = p.ID
			t.Language = tLang.String
			t.NativeText = tNative.String
			t.RomanizedText = tRomanized.String
			t.Detail = tDetail.String
			if tCreatedAt.Valid {
				t.CreatedAt = tCreatedAt.Time
			}
			result.Translations = append(result.Translations, t)
		}
	}

	if result == nil {
		return nil, fmt.Errorf("phrase not found")
	}
	return result, nil
}

// Translations

func CreateTranslations(phraseID string, translations []models.LLMTranslation) error {
	stmt, err := DB.Prepare(`
		INSERT INTO translations (phrase_id, language, native_text, romanized_text)
		VALUES ($1, $2, $3, $4)
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, t := range translations {
		romanized := sql.NullString{String: t.RomanizedText, Valid: t.RomanizedText != ""}
		_, err := stmt.Exec(phraseID, t.Language, t.NativeText, romanized)
		if err != nil {
			return err
		}
	}
	return nil
}

func UpdateTranslationDetail(translationID, detail string) error {
	_, err := DB.Exec(
		`UPDATE translations SET detail = $1 WHERE id = $2`,
		detail, translationID,
	)
	return err
}

func GetTranslationByID(id string) (*models.Translation, error) {
	var t models.Translation
	var romanized, detail sql.NullString

	err := DB.QueryRow(`
		SELECT id, phrase_id, language, native_text, romanized_text, detail, created_at
		FROM translations WHERE id = $1
	`, id).Scan(&t.ID, &t.PhraseID, &t.Language, &t.NativeText, &romanized, &detail, &t.CreatedAt)
	if err != nil {
		return nil, err
	}
	t.RomanizedText = romanized.String
	t.Detail = detail.String
	return &t, nil
}

// Config

func GetConfig() ([]string, error) {
	var languages pq.StringArray
	err := DB.QueryRow(`SELECT languages FROM config WHERE id = 1`).Scan(&languages)
	if err != nil {
		return nil, err
	}
	return []string(languages), nil
}

func UpdateConfig(languages []string) error {
	_, err := DB.Exec(
		`UPDATE config SET languages = $1 WHERE id = 1`,
		pq.Array(languages),
	)
	return err
}
