package handlers

import (
	"bytes"
	"campushub/internal/database"
	"campushub/internal/storage"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"time"

	storagego "github.com/supabase-community/storage-go"
)

func UploadAvatar(
	w http.ResponseWriter,
	r *http.Request,
) {

	err := r.ParseMultipartForm(
		10 << 20,
	)

	if err != nil {

		http.Error(
			w,
			"Invalid form",
			http.StatusBadRequest,
		)

		return
	}

	file, header, err := r.FormFile(
		"avatar",
	)

	if err != nil {

		http.Error(
			w,
			"Avatar required",
			http.StatusBadRequest,
		)

		return
	}

	defer file.Close()

	fileName := fmt.Sprintf(
		"%d-%s",
		time.Now().Unix(),
		header.Filename,
	)

	buffer := make([]byte, 512)

	_, err = file.Read(buffer)
	if err != nil {
		return
	}

	contentType :=
		http.DetectContentType(
			buffer,
		)

	_, err =
		file.Seek(0, 0)

	if err != nil {
		return
	}

	_, err =
		storage.Client.UploadFile(
			"avatars",
			fileName,
			file,
			storagego.FileOptions{
				ContentType: &contentType,
			},
		)

	if err != nil {

		http.Error(
			w,
			err.Error(),
			http.StatusInternalServerError,
		)

		return
	}

	avatarURL :=
		storage.Client.GetPublicUrl(
			"avatars",
			fileName,
		)

	userID :=
		r.Context().
			Value("userID").(int)

	_, err =
		database.DB.Exec(
			`
			UPDATE users
			SET avatar_url = $1
			WHERE id = $2
			`,
			avatarURL.SignedURL,
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

	json.NewEncoder(w).Encode(
		map[string]any{
			"url": avatarURL.SignedURL,
		},
	)
}

func DeleteAvatar(
	w http.ResponseWriter,
	r *http.Request,
) {

	userID :=
		r.Context().
			Value("userID").(int)

	_, err :=
		database.DB.Exec(
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

	w.WriteHeader(
		http.StatusOK,
	)
}

func UploadPostImage(
	w http.ResponseWriter,
	r *http.Request,
) {

	err := r.ParseMultipartForm(
		10 << 20,
	)

	if err != nil {

		http.Error(
			w,
			"Invalid form",
			http.StatusBadRequest,
		)

		return
	}

	file, header, err := r.FormFile(
		"image",
	)

	if err != nil {

		http.Error(
			w,
			"Image required",
			http.StatusBadRequest,
		)

		return
	}

	defer file.Close()

	fileName := fmt.Sprintf(
		"%d-%s",
		time.Now().Unix(),
		header.Filename,
	)

	buffer := make([]byte, 512)

	_, err = file.Read(buffer)
	if err != nil {
		return
	}

	contentType :=
		http.DetectContentType(
			buffer,
		)

	_, err =
		file.Seek(0, 0)

	if err != nil {
		return
	}

	_, err =
		storage.Client.UploadFile(
			"posts",
			fileName,
			file,
			storagego.FileOptions{
				ContentType: &contentType,
			},
		)

	if err != nil {

		http.Error(
			w,
			err.Error(),
			http.StatusInternalServerError,
		)

		return
	}

	imageURL :=
		storage.Client.GetPublicUrl(
			"posts",
			fileName,
		)

	if err != nil {

		http.Error(
			w,
			"Could not update image",
			http.StatusInternalServerError,
		)

		return
	}

	json.NewEncoder(w).Encode(
		map[string]any{
			"url": imageURL.SignedURL,
		},
	)
}

func UploadChatImage(
	w http.ResponseWriter,
	r *http.Request,
) {

	err := r.ParseMultipartForm(
		10 << 20,
	)

	if err != nil {

		http.Error(
			w,
			"Invalid form",
			http.StatusBadRequest,
		)

		return
	}

	file, header, err := r.FormFile(
		"image",
	)

	if err != nil {

		http.Error(
			w,
			"Image required",
			http.StatusBadRequest,
		)

		return
	}

	defer file.Close()

	fileName := fmt.Sprintf(
		"%d-%s",
		time.Now().Unix(),
		header.Filename,
	)

	buffer := make([]byte, 512)

	_, err = file.Read(buffer)
	if err != nil {
		return
	}

	contentType :=
		http.DetectContentType(
			buffer,
		)

	_, err =
		file.Seek(0, 0)

	if err != nil {
		return
	}

	_, err =
		storage.Client.UploadFile(
			"chat-images",
			fileName,
			file,
			storagego.FileOptions{
				ContentType: &contentType,
			},
		)

	if err != nil {

		http.Error(
			w,
			err.Error(),
			http.StatusInternalServerError,
		)

		return
	}

	imageURL :=
		storage.Client.GetPublicUrl(
			"chat-images",
			fileName,
		)

	if err != nil {

		http.Error(
			w,
			"Could not update image",
			http.StatusInternalServerError,
		)

		return
	}

	json.NewEncoder(w).Encode(
		map[string]any{
			"url": imageURL.SignedURL,
		},
	)
}

func UploadStoryImage(
	w http.ResponseWriter,
	r *http.Request,
) {

	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		http.Error(
			w,
			"Invalid form",
			http.StatusBadRequest,
		)
		return
	}

	file, header, err := r.FormFile("image")
	if err != nil {
		http.Error(
			w,
			"Image required",
			http.StatusBadRequest,
		)
		return
	}

	defer file.Close()

	buffer := make([]byte, 512)

	_, err = file.Read(buffer)
	if err != nil {
		http.Error(
			w,
			"Could not read image",
			http.StatusBadRequest,
		)
		return
	}

	_, err = file.Seek(0, 0)
	if err != nil {
		http.Error(
			w,
			"Could not reset image",
			http.StatusBadRequest,
		)
		return
	}

	fileName := fmt.Sprintf(
		"%d-%s",
		time.Now().UnixNano(),
		filepath.Base(header.Filename),
	)

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		http.Error(
			w,
			"Could not read image",
			http.StatusBadRequest,
		)
		return
	}

	var body bytes.Buffer

	writer := multipart.NewWriter(&body)

	part, err := writer.CreateFormFile(
		"file",
		fileName,
	)

	if err != nil {
		http.Error(
			w,
			"Could not create upload body",
			http.StatusInternalServerError,
		)
		return
	}

	_, err = part.Write(fileBytes)

	if err != nil {
		http.Error(
			w,
			"Could not write upload body",
			http.StatusInternalServerError,
		)
		return
	}

	err = writer.Close()

	if err != nil {
		http.Error(
			w,
			"Could not finalize upload",
			http.StatusInternalServerError,
		)
		return
	}

	/*
	 * Direct Storage REST endpoint.
	 */
	storageURL :=
		os.Getenv("SUPABASE_URL") +
			"/storage/v1/object/stories/" +
			fileName

	req, err := http.NewRequest(
		http.MethodPost,
		storageURL,
		&body,
	)

	if err != nil {
		http.Error(
			w,
			"Could not create storage request",
			http.StatusInternalServerError,
		)
		return
	}

	/*
	 * New sb_secret key.
	 *
	 * Important:
	 * use it as the API key.
	 */
	secretKey :=
		os.Getenv(
			"SUPABASE_SERVICE_KEY",
		)

	req.Header.Set(
		"apikey",
		secretKey,
	)

	req.Header.Set(
		"Content-Type",
		writer.FormDataContentType(),
	)

	req.Header.Set(
		"x-upsert",
		"false",
	)

	req.Header.Set(
		"cache-control",
		"3600",
	)

	response, err := http.DefaultClient.Do(req)

	if err != nil {

		http.Error(
			w,
			"Story storage request failed: "+
				err.Error(),
			http.StatusInternalServerError,
		)

		return
	}

	defer response.Body.Close()

	responseBody, err :=
		io.ReadAll(response.Body)

	if err != nil {
		http.Error(
			w,
			"Could not read storage response",
			http.StatusInternalServerError,
		)
		return
	}

	if response.StatusCode < 200 ||
		response.StatusCode >= 300 {

		http.Error(
			w,
			"Story storage upload failed: "+
				string(responseBody),
			http.StatusInternalServerError,
		)

		return
	}

	imageURL :=
		os.Getenv("SUPABASE_URL") +
			"/storage/v1/object/public/stories/" +
			fileName

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	json.NewEncoder(w).Encode(
		map[string]any{
			"url": imageURL,
		},
	)

}
