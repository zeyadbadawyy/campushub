package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"campushub/internal/database"
	"campushub/internal/models"

	"github.com/go-chi/chi/v5"
)

func ToggleSavePost(
	w http.ResponseWriter,
	r *http.Request,
) {
	userID :=
		r.Context().
			Value(
				"userID",
			).(int)

	postID, err :=
		strconv.Atoi(
			chi.URLParam(
				r,
				"id",
			),
		)

	if err != nil {
		http.Error(
			w,
			"Invalid post ID",
			http.StatusBadRequest,
		)

		return
	}

	var postExists bool

	err = database.DB.QueryRow(
		`
		SELECT EXISTS(
			SELECT 1
			FROM posts
			WHERE id = $1
		)
		`,
		postID,
	).Scan(
		&postExists,
	)

	if err != nil {
		http.Error(
			w,
			"Database error",
			http.StatusInternalServerError,
		)

		return
	}

	if !postExists {
		http.Error(
			w,
			"Post not found",
			http.StatusNotFound,
		)

		return
	}

	var alreadySaved bool

	err =
		database.DB.QueryRow(
			`
			SELECT EXISTS(
				SELECT 1
				FROM saved_posts
				WHERE user_id = $1
				AND post_id = $2
			)
			`,
			userID,
			postID,
		).Scan(
			&alreadySaved,
		)

	if err != nil {
		http.Error(
			w,
			"Database error",
			http.StatusInternalServerError,
		)

		return
	}

	saved := false

	if alreadySaved {

		_, err =
			database.DB.Exec(
				`
				DELETE FROM saved_posts
				WHERE user_id = $1
				AND post_id = $2
				`,
				userID,
				postID,
			)

		if err != nil {
			http.Error(
				w,
				"Could not unsave post",
				http.StatusInternalServerError,
			)

			return
		}

		saved = false

	} else {

		_, err =
			database.DB.Exec(
				`
				INSERT INTO saved_posts
				(
					user_id,
					post_id
				)
				VALUES
				(
					$1,
					$2
				)
				ON CONFLICT (
					user_id,
					post_id
				)
				DO NOTHING
				`,
				userID,
				postID,
			)

		if err != nil {
			http.Error(
				w,
				"Could not save post",
				http.StatusInternalServerError,
			)

			return
		}

		saved = true
	}

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	json.NewEncoder(w).Encode(
		map[string]interface{}{
			"saved": saved,
		},
	)
}

func GetSavedPosts(
	w http.ResponseWriter,
	r *http.Request,
) {
	userID :=
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
				) AS liked_by_me,

				TRUE AS saved_by_me

			FROM saved_posts
			JOIN posts
				ON saved_posts.post_id = posts.id

			JOIN users
				ON posts.user_id = users.id

			LEFT JOIN likes
				ON likes.post_id = posts.id

			LEFT JOIN comments
				ON comments.post_id = posts.id

			WHERE saved_posts.user_id = $1

			GROUP BY
				saved_posts.created_at,
				posts.id,
				posts.user_id,
				users.name,
				users.faculty,
				users.avatar_url

			ORDER BY
				saved_posts.created_at DESC
			`,
			userID,
		)

	if err != nil {
		http.Error(
			w,
			"Could not fetch saved posts",
			http.StatusInternalServerError,
		)

		return
	}

	defer rows.Close()

	posts :=
		[]models.FeedPost{}

	for rows.Next() {

		var post models.FeedPost

		err :=
			rows.Scan(
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
				&post.SavedByMe,
			)

		if err != nil {
			continue
		}

		posts =
			append(
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
