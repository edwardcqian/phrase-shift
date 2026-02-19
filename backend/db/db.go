package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func Connect() error {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = fmt.Sprintf(
			"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
			getEnvOrDefault("DB_HOST", "localhost"),
			getEnvOrDefault("DB_PORT", "5432"),
			getEnvOrDefault("DB_USER", "postgres"),
			getEnvOrDefault("DB_PASSWORD", "postgres"),
			getEnvOrDefault("DB_NAME", "phraseshift"),
		)
	}

	var err error
	DB, err = sql.Open("postgres", dsn)
	if err != nil {
		return fmt.Errorf("failed to open db: %w", err)
	}

	if err = DB.Ping(); err != nil {
		return fmt.Errorf("failed to ping db: %w", err)
	}

	log.Println("Connected to PostgreSQL")
	return nil
}

func Migrate() error {
	schema := `
	CREATE TABLE IF NOT EXISTS phrases (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		input_text TEXT NOT NULL,
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS translations (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		phrase_id UUID NOT NULL REFERENCES phrases(id) ON DELETE CASCADE,
		language TEXT NOT NULL,
		native_text TEXT NOT NULL,
		romanized_text TEXT,
		detail TEXT,
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS config (
		id INT PRIMARY KEY DEFAULT 1,
		languages TEXT[] NOT NULL DEFAULT ARRAY['Spanish', 'French', 'Mandarin Chinese', 'Japanese', 'Korean']
	);

	INSERT INTO config (id, languages) VALUES (1, ARRAY['Spanish', 'French', 'Mandarin Chinese', 'Japanese', 'Korean'])
	ON CONFLICT (id) DO NOTHING;
	`

	_, err := DB.Exec(schema)
	if err != nil {
		return fmt.Errorf("migration failed: %w", err)
	}

	log.Println("Database migrated successfully")
	return nil
}

func getEnvOrDefault(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
