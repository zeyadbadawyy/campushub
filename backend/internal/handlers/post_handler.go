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
					posts.created_at,
					COUNT(DISTINCT likes.id) AS likes,
					COUNT(DISTINCT comments.id) AS comments
			FROM posts
			JOIN users
					ON posts.user_id = users.id
			LEFT JOIN likes
					ON likes.post_id = posts.id
			LEFT JOIN comments
					ON comments.post_id = posts.id
			GROUP BY
					posts.id,
					users.name,
					users.faculty
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
			&post.Likes,
			&post.Comments,
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

func DeletePost(
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

	currentUserID :=
		r.Context().
			Value(
				"userID",
			).(int)

	var ownerID int

	err = database.DB.QueryRow(
		`
		SELECT user_id
		FROM posts
		WHERE id=$1
		`,
		postID,
	).Scan(
		&ownerID,
	)

	if err != nil {

		http.Error(
			w,
			"Post not found",
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
		DELETE FROM posts
		WHERE id=$1
		`,
		postID,
	)

	if err != nil {

		http.Error(
			w,
			"Could not delete post",
			http.StatusInternalServerError,
		)

		return
	}

	json.NewEncoder(
		w,
	).Encode(
		map[string]string{
			"message": "Post deleted",
		},
	)
}

func UpdatePost(
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

	currentUserID :=
		r.Context().
			Value(
				"userID",
			).(int)

	var ownerID int

	err = database.DB.QueryRow(
		`
		SELECT user_id
		FROM posts
		WHERE id=$1
		`,
		postID,
	).Scan(
		&ownerID,
	)

	if err != nil {

		http.Error(
			w,
			"Post not found",
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

	var request struct {
		Content string `json:"content"`
	}

	err = json.NewDecoder(
		r.Body,
	).Decode(
		&request,
	)

	if err != nil {

		http.Error(
			w,
			"Invalid JSON",
			http.StatusBadRequest,
		)

		return
	}

	if request.Content == "" {

		http.Error(
			w,
			"Content is required",
			http.StatusBadRequest,
		)

		return
	}

	_, err = database.DB.Exec(
		`
		UPDATE posts
		SET content=$1
		WHERE id=$2
		`,
		request.Content,
		postID,
	)

	if err != nil {

		http.Error(
			w,
			"Could not update post",
			http.StatusInternalServerError,
		)

		return
	}

	json.NewEncoder(
		w,
	).Encode(
		map[string]string{
			"message": "Post updated",
		},
	)
}
