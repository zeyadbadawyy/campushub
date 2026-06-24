package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"campushub/internal/database"

	"github.com/go-chi/chi/v5"
)

// ToggleLike godoc
//
//	@Summary		Like or unlike a post
//	@Description	Toggle like status
//	@Tags			Likes
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	int	true	"Post ID"
//	@Success		200
//	@Router			/posts/{id}/like [post]
func ToggleLike(
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

	var exists bool

	err = database.DB.QueryRow(
		`
	SELECT EXISTS(
		SELECT 1
		FROM posts
		WHERE id=$1
	)
	`,
		postID,
	).Scan(
		&exists,
	)

	if err != nil {

		http.Error(
			w,
			"Database error",
			http.StatusInternalServerError,
		)

		return
	}

	if !exists {

		http.Error(
			w,
			"Post not found",
			http.StatusNotFound,
		)

		return
	}

	userID :=
		r.Context().
			Value(
				"userID",
			).(int)

	var existingLikeID int

	err = database.DB.QueryRow(
		`
		SELECT id
		FROM likes
		WHERE post_id=$1
		AND user_id=$2
		`,
		postID,
		userID,
	).Scan(
		&existingLikeID,
	)

	// Like already exists
	if err == nil {

		_, err = database.DB.Exec(
			`
			DELETE FROM likes
			WHERE id=$1
			`,
			existingLikeID,
		)

		if err != nil {

			http.Error(
				w,
				"Could not remove like",
				http.StatusInternalServerError,
			)

			return
		}

		json.NewEncoder(
			w,
		).Encode(
			map[string]string{
				"message": "Like removed",
			},
		)

		return
	}

	// Create like
	_, err = database.DB.Exec(
		`
		INSERT INTO likes
		(post_id,user_id)
		VALUES ($1,$2)
		`,
		postID,
		userID,
	)

	if err != nil {

		http.Error(
			w,
			"Could not like post",
			http.StatusInternalServerError,
		)

		return
	}

	json.NewEncoder(
		w,
	).Encode(
		map[string]string{
			"message": "Post liked",
		},
	)
}
