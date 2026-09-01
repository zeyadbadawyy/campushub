package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"campushub/internal/database"
	"campushub/internal/models"
	"campushub/internal/utils"
	"campushub/internal/websocket"

	"github.com/go-chi/chi/v5"
)

// CreatePost godoc
//
// @Summary Create a post
// @Description Create a new CampusHub post
// @Tags Posts
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param post body models.Post true "Post Content"
// @Success 201 {object} models.Post
// @Failure 400 {string} string
// @Router /posts [post]
func CreatePost(
	w http.ResponseWriter,
	r *http.Request,
) {

	type CreatePostRequest struct {
		Content  string `json:"content"`
		ImageURL string `json:"image_url"`
		GIFURL   string `json:"gif_url"`
	}

	userID :=
		r.Context().
			Value(
				"userID",
			).(int)

	var request CreatePostRequest
	var post models.Post

	err :=
		json.NewDecoder(
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

	if request.Content == "" &&
		request.ImageURL == "" &&
		request.GIFURL == "" {

		http.Error(
			w,
			"Post must contain content or image",
			http.StatusBadRequest,
		)

		return
	}

	err =
		database.DB.QueryRow(
			`
			INSERT INTO posts
			(
					user_id,
					content,
					image_url,
					gif_url
			)
			VALUES
			(
				$1,
				$2,
				$3,
    		$4
			)
			RETURNING id, created_at
			`,
			userID,
			request.Content,
			request.ImageURL,
			request.GIFURL,
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
	post.Content = request.Content
	post.ImageURL = request.ImageURL
	post.GIFURL = request.GIFURL

	var authorName string
	var faculty string
	var avatarURL string

	database.DB.QueryRow(
		`
SELECT name, faculty, avatar_url
FROM users
WHERE id = $1
`,
		userID,
	).Scan(
		&authorName,
		&faculty,
		&avatarURL,
	)

	websocket.Broadcast(
		map[string]interface{}{
			"type": "new_post",
			"post": map[string]interface{}{
				"id":         post.ID,
				"user_id":    userID,
				"author":     authorName,
				"faculty":    faculty,
				"avatar_url": avatarURL,
				"content":    post.Content,
				"image_url":  post.ImageURL,
				"gif_url":    post.GIFURL,
				"created_at": post.CreatedAt,
				"likes":      0,
				"comments":   0,
			},
		},
	)

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

// GetPosts godoc
//
//	@Summary		Get all posts
//	@Description	Retrieve feed posts
//	@Tags			Posts
//	@Produce		json
//	@Success		200
//	@Router			/posts [get]
func GetPosts(
	w http.ResponseWriter,
	r *http.Request,
) {

	page, _ := strconv.Atoi(
		r.URL.Query().Get(
			"page",
		),
	)

	limit, _ := strconv.Atoi(
		r.URL.Query().Get(
			"limit",
		),
	)

	if page < 1 {
		page = 1
	}

	if limit < 1 {
		limit = 10
	}

	if limit > 50 {
		limit = 50
	}

	offset :=
		(page - 1) * limit

	currentUserID :=
		r.Context().
			Value(
				"userID",
			).(int)

	rows, err :=
		database.DB.Query(
			`
					SELECT
				posts.id,
				posts.user_id,
				users.name,
				users.faculty,
				users.avatar_url,
				posts.content,
				posts.image_url,
				posts.gif_url,
				posts.created_at,
				COUNT(DISTINCT likes.id) AS likes,
				COUNT(DISTINCT comments.id) AS comments,

				EXISTS(
						SELECT 1
						FROM likes l2
						WHERE l2.post_id = posts.id
						AND l2.user_id = $1
				) AS liked_by_me
		FROM posts
		JOIN users
				ON posts.user_id = users.id

		JOIN user_settings s
				ON s.user_id = users.id

		LEFT JOIN follows f
				ON f.following_id = users.id
				AND f.follower_id = $1

		LEFT JOIN likes
				ON likes.post_id = posts.id

		LEFT JOIN comments
				ON comments.post_id = posts.id

		WHERE
		(
				s.private_account = FALSE
				OR users.id = $1
				OR f.id IS NOT NULL
		)

		GROUP BY
				posts.id,
				posts.user_id,
				users.name,
				users.faculty,
				users.avatar_url,
				s.private_account,
				f.id

		ORDER BY posts.created_at DESC

		LIMIT $2
		OFFSET $3
			`,
			currentUserID,
			limit,
			offset,
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

	posts := []models.FeedPost{}

	for rows.Next() {

		var post models.FeedPost

		err := rows.Scan(
			&post.ID,
			&post.UserID,
			&post.Author,
			&post.Faculty,
			&post.AvatarURL,
			&post.Content,
			&post.ImageURL,
			&post.GIFURL,
			&post.CreatedAt,
			&post.Likes,
			&post.Comments,
			&post.LikedByMe,
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

// GetUserPosts godoc
//
//	@Summary		Get user's posts
//	@Description	Get all posts created by a specific user
//	@Tags			Users
//	@Produce		json
//	@Param			id	path	int	true	"User ID"
//	@Success		200
//	@Failure		404
//	@Router			/users/{id}/posts [get]
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

	viewerID :=
		r.Context().
			Value(
				"userID",
			).(int)

	canView, err :=
		utils.CanViewUser(
			viewerID,
			userID,
		)

	if err != nil {

		http.Error(
			w,
			"Database error",
			http.StatusInternalServerError,
		)

		return
	}

	// PRIVATE ACCOUNT:
	// Return empty posts instead of 403
	if !canView {

		w.Header().Set(
			"Content-Type",
			"application/json",
		)

		json.NewEncoder(w).Encode(
			[]models.FeedPost{},
		)

		return
	}

	rows, err := database.DB.Query(
		`
		SELECT
			posts.id,
			posts.user_id,
			users.name,
			users.faculty,
			users.avatar_url,
			posts.content,
			posts.image_url,
			posts.gif_url,
			posts.created_at,
			COUNT(DISTINCT likes.id) AS likes,
			COUNT(DISTINCT comments.id) AS comments,

			EXISTS(
					SELECT 1
					FROM likes l2
					WHERE l2.post_id = posts.id
					AND l2.user_id = $2
			) AS liked_by_me
		FROM posts
		JOIN users
			ON posts.user_id = users.id
		LEFT JOIN likes
			ON likes.post_id = posts.id
		LEFT JOIN comments
			ON comments.post_id = posts.id
		WHERE posts.user_id = $1
		GROUP BY
			posts.id,
			posts.user_id,
			users.name,
			users.faculty,
			users.avatar_url
		ORDER BY posts.created_at DESC
		`,
		userID,
		viewerID,
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

	posts := []models.FeedPost{}

	for rows.Next() {

		var post models.FeedPost

		err := rows.Scan(
			&post.ID,
			&post.UserID,
			&post.Author,
			&post.Faculty,
			&post.AvatarURL,
			&post.Content,
			&post.ImageURL,
			&post.GIFURL,
			&post.CreatedAt,
			&post.Likes,
			&post.Comments,
			&post.LikedByMe,
		)

		if err != nil {
			continue
		}

		posts = append(
			posts,
			post,
		)
	}

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

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
		Content  string `json:"content"`
		ImageURL string `json:"image_url"`
		GIFURL   string `json:"gif_url"`
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

	if request.Content == "" &&
		request.ImageURL == "" &&
		request.GIFURL == "" {

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
		SET
				content=$1,
				image_url=$2,
				gif_url=$3
		WHERE id=$4
		`,
		request.Content,
		request.ImageURL,
		request.GIFURL,
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

func GetPost(
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
			Value("userID").(int)

	var post models.FeedPost

	err = database.DB.QueryRow(
		`
		SELECT
			posts.id,
			posts.user_id,
			users.name,
			users.faculty,
			users.avatar_url,
			posts.content,
			posts.image_url,
			posts.gif_url,
			posts.created_at,
			COUNT(DISTINCT likes.id) AS likes,
			COUNT(DISTINCT comments.id) AS comments,

			EXISTS(
					SELECT 1
					FROM likes l2
					WHERE l2.post_id = posts.id
					AND l2.user_id = $2
			) AS liked_by_me
		FROM posts
		JOIN users
			ON posts.user_id = users.id
		LEFT JOIN likes
			ON likes.post_id = posts.id
		LEFT JOIN comments
			ON comments.post_id = posts.id
		WHERE posts.id = $1
		GROUP BY
			posts.id,
			posts.user_id,
			users.name,
			users.faculty,
			users.avatar_url
		`,
		postID,
		currentUserID,
	).Scan(
		&post.ID,
		&post.UserID,
		&post.Author,
		&post.Faculty,
		&post.AvatarURL,
		&post.Content,
		&post.ImageURL,
		&post.GIFURL,
		&post.CreatedAt,
		&post.Likes,
		&post.Comments,
		&post.LikedByMe,
	)

	if err != nil {

		http.Error(
			w,
			"Post not found",
			http.StatusNotFound,
		)

		return
	}

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	json.NewEncoder(
		w,
	).Encode(
		post,
	)

}
