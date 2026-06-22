package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"campushub/internal/database"
	"campushub/internal/models"

	"github.com/go-chi/chi/v5"
)

func CreatePost(
	w http.ResponseWriter,
	r *http.Request,
) {

	userID :=
		r.Context().
			Value(
				"userID",
			).(int)

	var post models.Post

	err :=
		json.NewDecoder(
			r.Body,
		).Decode(
			&post,
		)

	if err != nil {

		http.Error(
			w,
			"Invalid JSON",
			http.StatusBadRequest,
		)

		return
	}

	if len(post.Content) == 0 {

		http.Error(
			w,
			"Content is required",
			http.StatusBadRequest,
		)

		return
	}

	err =
		database.DB.QueryRow(
			`
			INSERT INTO posts
			(user_id, content)
			VALUES ($1,$2)
			RETURNING id, created_at
			`,
			userID,
			post.Content,
		).Scan(
			&post.ID,
			&post.CreatedAt,
		)

	if err != nil {

		http.Error(
			w,
			"Could not create post",
			http.StatusInternalServerError,
		)

		return
	}

	post.UserID = userID

	w.Header().
		Set(
			"Content-Type",
			"application/json",
		)

	w.WriteHeader(
		http.StatusCreated,
	)

	json.NewEncoder(
		w,
	).Encode(
		post,
	)
}

func GetPosts(
	w http.ResponseWriter,
	r *http.Request,
) {

	rows, err :=
		database.DB.Query(
			`
			SELECT
					posts.id,
					users.name,
					users.faculty,
					posts.content,
					posts.created_at
			FROM posts
			JOIN users
			ON posts.user_id = users.id
			ORDER BY posts.created_at DESC
			`,
		)

	if err != nil {

		http.Error(
			w,
			"Could not fetch posts",
			http.StatusInternalServerError,
		)

		return
	}

	defer rows.Close()

	var posts []models.FeedPost

	for rows.Next() {

		var post models.FeedPost

		err := rows.Scan(
			&post.ID,
			&post.Author,
			&post.Faculty,
			&post.Content,
			&post.CreatedAt,
		)

		if err != nil {
			continue
		}

		posts = append(
			posts,
			post,
		)
	}

	json.NewEncoder(
		w,
	).Encode(
		posts,
	)
}

func GetUserPosts(
	w http.ResponseWriter,
	r *http.Request,
) {

	idParam := chi.URLParam(
		r,
		"id",
	)

	userID, err := strconv.Atoi(
		idParam,
	)

	if err != nil {

		http.Error(
			w,
			"Invalid user ID",
			http.StatusBadRequest,
		)

		return
	}

	rows, err := database.DB.Query(
		`
		SELECT
			id,
			user_id,
			content,
			created_at
		FROM posts
		WHERE user_id=$1
		ORDER BY created_at DESC
		`,
		userID,
	)

	if err != nil {

		http.Error(
			w,
			"Could not fetch posts",
			http.StatusInternalServerError,
		)

		return
	}

	defer rows.Close()

	var posts []models.Post

	for rows.Next() {

		var post models.Post

		rows.Scan(
			&post.ID,
			&post.UserID,
			&post.Content,
			&post.CreatedAt,
		)

		posts = append(
			posts,
			post,
		)
	}

	json.NewEncoder(
		w,
	).Encode(
		posts,
	)
}
