package storage

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
)

var (
	SupabaseURL string
	ServiceKey  string
	HTTPClient  = &http.Client{}
)

func InitStorage() {
	SupabaseURL = strings.TrimRight(os.Getenv("SUPABASE_URL"), "/")
	ServiceKey = strings.TrimSpace(os.Getenv("SUPABASE_SERVICE_KEY"))
}

// UploadPublicFile uploads a file directly through the Supabase Storage REST API.
// This intentionally does not use storage-go because the current Supabase secret
// key format (sb_secret_...) is not a JWT and storage-go v0.8.1 expects a JWT.
func UploadPublicFile(
	bucket string,
	path string,
	data []byte,
	contentType string,
) (string, error) {
	if SupabaseURL == "" {
		return "", fmt.Errorf("SUPABASE_URL is not configured")
	}

	if ServiceKey == "" {
		return "", fmt.Errorf("SUPABASE_SERVICE_KEY is not configured")
	}

	if bucket == "" || path == "" {
		return "", fmt.Errorf("storage bucket and path are required")
	}

	endpoint := fmt.Sprintf(
		"%s/storage/v1/object/%s/%s",
		SupabaseURL,
		url.PathEscape(bucket),
		url.PathEscape(path),
	)

	req, err := http.NewRequest(
		http.MethodPost,
		endpoint,
		bytes.NewReader(data),
	)
	if err != nil {
		return "", err
	}

	req.Header.Set("apikey", ServiceKey)
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("x-upsert", "false")

	resp, err := HTTPClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		message := strings.TrimSpace(string(body))
		if message == "" {
			message = resp.Status
		}

		return "", fmt.Errorf("supabase storage upload failed (%s): %s", resp.Status, message)
	}

	publicURL := fmt.Sprintf(
		"%s/storage/v1/object/public/%s/%s",
		SupabaseURL,
		url.PathEscape(bucket),
		url.PathEscape(path),
	)

	return publicURL, nil
}
