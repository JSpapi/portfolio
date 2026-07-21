package service

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
)

// NewToken returns a cryptographically-random, URL-safe token (32 bytes → base64url).
// The raw value is what the user receives (magic-link query param, session cookie);
// only its hash is ever persisted.
func NewToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

// Sha256Hex returns the hex-encoded SHA-256 of s. Used to store/compare tokens
// without ever persisting the raw value.
func Sha256Hex(s string) string {
	sum := sha256.Sum256([]byte(s))
	return hex.EncodeToString(sum[:])
}
