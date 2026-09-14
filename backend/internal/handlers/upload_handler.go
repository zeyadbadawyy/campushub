package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"campushub/internal/database"
	"campushub/internal/storage"
)

const maxUploadSize = 10 << 20

func uploadMultipartFile(
	w http.ResponseWriter,
	r *http.Request,
	formField string,
) ([]byte, string, string, bool) {
	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		http.Error(w, "Invalid form", http.StatusBadRequest)
		return nil, "", "", false
	}

	file, header, err := r.FormFile(formField)
	if err != nil {
		http.Error(w, "Image required", http.StatusBadRequest)
		return nil, "", "", false
	}
	defer file.Close()

	data, err := io.ReadAll(io.LimitReader(file, maxUploadSize+1))
	if err != nil {
		http.Error(w, "Could not read image", http.StatusBadRequest)
		return nil, "", "", false
	}

	if len(data) > maxUploadSize {
		http.Error(w, "Image is too large", http.StatusBadRequest)
		return nil, "", "", false
	}

	contentType := header.Header.Get("Content-Type")
	if contentType == "" || contentType == "application/octet-stream" {
		contentType = http.DetectContentType(data)
	}

	return data, header.Filename, contentType, true
}

func uploadToBucket(
	w http.ResponseWriter,
	bucket string,
	originalName string,
	data []byte,
	contentType string,
) (string, bool) {
	fileName := fmt.Sprintf(
		"%d-%d-%s",
		time.Now().UnixNano(),
		time.Now().UnixNano(),
		originalName,
	)

	publicURL, err := storage.UploadPublicFile(
		bucket,
		fileName,
		data,
		contentType,
	)
	if err != nil {
		http.Error(
			w,
			err.Error(),
			http.StatusInternalServerError,
		)
		return "", false
	}

	return publicURL, true
}

func UploadAvatar(
	w http.ResponseWriter,
	r *http.Request,
) {
	data, originalName, contentType, ok := uploadMultipartFile(
		w,
		r,
		"avatar",
	)
	if !ok {
		return
	}

	avatarURL, ok := uploadToBucket(
		w,
		"avatars",
		originalName,
		data,
		contentType,
	)
	if !ok {
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	_, err := database.DB.Exec(
		`
		UPDATE users
		SET avatar_url = $1
		WHERE id = $2
		`,
		avatarURL,
		userID,
	)
	if err != nil {
		http.Error(
			w,
			"Could not update avatar",
			http.StatusInternalServerError,
		)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"url": avatarURL,
	})
}

func DeleteAvatar(
	w http.ResponseWriter,
	r *http.Request,
) {
	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	_, err := database.DB.Exec(
		`
		UPDATE users
		SET avatar_url = ''
		WHERE id = $1
		`,
		userID,
	)
	if err != nil {
		http.Error(
			w,
			"Could not delete avatar",
			http.StatusInternalServerError,
		)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func UploadPostImage(
	w http.ResponseWriter,
	r *http.Request,
) {
	data, originalName, contentType, ok := uploadMultipartFile(
		w,
		r,
		"image",
	)
	if !ok {
		return
	}

	imageURL, ok := uploadToBucket(
		w,
		"posts",
		originalName,
		data,
		contentType,
	)
	if !ok {
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"url": imageURL,
	})
}

func UploadChatImage(
	w http.ResponseWriter,
	r *http.Request,
) {
	data, originalName, contentType, ok := uploadMultipartFile(
		w,
		r,
		"image",
	)
	if !ok {
		return
	}

	imageURL, ok := uploadToBucket(
		w,
		"chat-images",
		originalName,
		data,
		contentType,
	)
	if !ok {
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"url": imageURL,
	})
}

func UploadStoryImage(
	w http.ResponseWriter,
	r *http.Request,
) {
	data, originalName, contentType, ok := uploadMultipartFile(
		w,
		r,
		"image",
	)
	if !ok {
		return
	}

	imageURL, ok := uploadToBucket(
		w,
		"stories",
		originalName,
		data,
		contentType,
	)
	if !ok {
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"url": imageURL,
	})
}
