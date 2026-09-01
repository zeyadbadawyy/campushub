package handlers

import (
	"campushub/internal/database"
	"campushub/internal/storage"
	"encoding/json"
	"fmt"
	"net/http"
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
		storage.Client.Storage.UploadFile(
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
		storage.Client.Storage.GetPublicUrl(
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
		storage.Client.Storage.UploadFile(
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
		storage.Client.Storage.GetPublicUrl(
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
		storage.Client.Storage.UploadFile(
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
		storage.Client.Storage.GetPublicUrl(
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
