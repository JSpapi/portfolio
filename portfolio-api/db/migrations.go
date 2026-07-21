// Package db embeds the SQL migration files so they ship inside the single
// binary and run at startup — no external migrate CLI or mounted files needed.
package db

import "embed"

//go:embed migrations/*.sql
var MigrationsFS embed.FS
