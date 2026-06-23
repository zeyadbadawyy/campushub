package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"campushub/internal/database"
	"campushub/internal/models"

	"github.com/go-chi/chi/v5"
)

func CreateComment(
	w http.ResponseWriter,
	r *http.Request,
) {

	postIDParam := chi.URLParam(
		r,
		"id",
	)

	postID, err := strconv.Atoi(
		postIDParam,
	)

	if err != nil {

		http.Error(
			w,
			"Invalid post ID",
			http.StatusBadRequest,
		)

		return
	}

	userID :=
		r.Context().
			Value(
				"userID",
			).(int)

	var comment models.Comment

	err = json.NewDecoder(
		r.Body,
	).Decode(
		&comment,
	)

	if err != nil {

		http.Error(
			w,
			"Invalid JSON",
			http.StatusBadRequest,
		)

		return
	}

	if comment.Content == "" {

		http.Error(
			w,
			"Comment content is required",
			http.StatusBadRequest,
		)

		return
	}

	err = database.DB.QueryRow(
		`
		INSERT INTO comments
		(post_id,user_id,content)
		VALUES ($1,$2,$3)
		RETURNING id,created_at
		`,
		postID,
		userID,
		comment.Content,
	).Scan(
		&comment.ID,
		&comment.CreatedAt,
	)

	if err != nil {

		http.Error(
			w,
			"Could not create comment",
			http.StatusInternalServerError,
		)

		return
	}

	comment.PostID = postID
	comment.UserID = userID

	w.WriteHeader(
		http.StatusCreated,
	)

	json.NewEncoder(
		w,
	).Encode(
		comment,
	)
}

func GetComments(
	w http.ResponseWriter,
	r *http.Request,
) {

	postIDParam := chi.URLParam(
		r,
		"id",
	)

	postID, err := strconv.Atoi(
		postIDParam,
	)

	if err != nil {

		http.Error(
			w,
			"Invalid post ID",
			http.StatusBadRequest,
		)

		return
	}

	rows, err := database.DB.Query(
		`
		SELECT
			id,
			post_id,
			user_id,
			content,
			created_at
		FROM comments
		WHERE post_id=$1
		ORDER BY created_at ASC
		`,
		postID,
	)

	if err != nil {

		http.Error(
			w,
			"Could not fetch comments",
			http.StatusInternalServerError,
		)

		return
	}

	defer rows.Close()

	var comments []models.Comment

	for rows.Next() {

		var comment models.Comment

		rows.Scan(
			&comment.ID,
			&comment.PostID,
			&comment.UserID,
			&comment.Content,
			&comment.CreatedAt,
		)

		comments =
			append(
				comments,
				comment,
			)
	}

	json.NewEncoder(
		w,
	).Encode(
		comments,
	)
}

func DeleteComment(
	w http.ResponseWriter,
	r *http.Request,
) {

	commentIDParam := chi.URLParam(
		r,
		"id",
	)

	commentID, err := strconv.Atoi(
		commentIDParam,
	)

	if err != nil {

		http.Error(
			w,
			"Invalid comment ID",
			http.StatusBadRequest,
		)

		return
	}

	currentUserID :=
		r.Context().
			Value(
				"userID",
			).(int)

	var ownerID int

	err = database.DB.QueryRow(
		`
		SELECT user_id
		FROM comments
		WHERE id=$1
		`,
		commentID,
	).Scan(
		&ownerID,
	)

	if err != nil {

		http.Error(
			w,
			"Comment not found",
			http.StatusNotFound,
		)

		return
	}

	if ownerID != currentUserID {

		http.Error(
			w,
			"Forbidden",
			http.StatusForbidden,
		)

		return
	}

	_, err = database.DB.Exec(
		`
		DELETE FROM comments
		WHERE id=$1
		`,
		commentID,
	)

	if err != nil {

		http.Error(
			w,
			"Could not delete comment",
			http.StatusInternalServerError,
		)

		return
	}

	json.NewEncoder(
		w,
	).Encode(
		map[string]string{
			"message": "Comment deleted",
		},
	)
}
