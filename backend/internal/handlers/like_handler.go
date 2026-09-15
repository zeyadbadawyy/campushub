package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"campushub/internal/database"
	"campushub/internal/websocket"

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

		websocket.Broadcast(
			map[string]interface{}{
				"type":    "post_like",
				"post_id": postID,
				"user_id": userID,
				"liked":   false,
				"delta":   -1,
			},
		)

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

	websocket.Broadcast(
		map[string]interface{}{
			"type":    "post_like",
			"post_id": postID,
			"user_id": userID,
			"liked":   true,
			"delta":   1,
		},
	)

	var postOwnerID int

	err = database.DB.QueryRow(
		`
	SELECT user_id
	FROM posts
	WHERE id = $1
	`,
		postID,
	).Scan(
		&postOwnerID,
	)

	if err != nil {
		http.Error(
			w,
			"Could not find post owner",
			http.StatusInternalServerError,
		)

		return
	}

	var allowLikeNotifications bool

	err = database.DB.QueryRow(
		`
		SELECT like_notifications
		FROM user_settings
		WHERE user_id = $1
		`,
		postOwnerID,
	).Scan(
		&allowLikeNotifications,
	)

	if err == nil &&
		postOwnerID != userID &&
		allowLikeNotifications {

		var notificationID int
		var createdAt string
		var messageCount int

		tx, err := database.DB.Begin()

		if err != nil {

			http.Error(
				w,
				"Could not create notification",
				http.StatusInternalServerError,
			)

			return
		}

		defer tx.Rollback()

		// Prevent two simultaneous likes on the same post
		// from creating separate notification groups.
		_, err = tx.Exec(
			`
			SELECT pg_advisory_xact_lock(
				hashtext($1)
			)
			`,
			fmt.Sprintf(
				"like-notification:%d:%d",
				postOwnerID,
				postID,
			),
		)

		if err != nil {

			http.Error(
				w,
				"Could not create notification",
				http.StatusInternalServerError,
			)

			return
		}

		err = tx.QueryRow(
			`
			SELECT
				id,
				created_at,
				COALESCE(message_count, 1)
			FROM notifications
			WHERE user_id = $1
			AND type = 'like'
			AND target_id = $2
			AND is_read = FALSE
			ORDER BY created_at DESC
			LIMIT 1
			FOR UPDATE
			`,
			postOwnerID,
			postID,
		).Scan(
			&notificationID,
			&createdAt,
			&messageCount,
		)

		if err == nil {

			messageCount++

			message := "liked your post"

			if messageCount > 1 {
				message = fmt.Sprintf(
					"liked your post and %d others",
					messageCount-1,
				)
			}

			err = tx.QueryRow(
				`
				UPDATE notifications
				SET
					sender_id = $1,
					message = $2,
					message_count = $3,
					created_at = CURRENT_TIMESTAMP
				WHERE id = $4
				RETURNING created_at
				`,
				userID,
				message,
				messageCount,
				notificationID,
			).Scan(
				&createdAt,
			)

		} else {

			messageCount = 1

			err = tx.QueryRow(
				`
				INSERT INTO notifications
				(
					user_id,
					sender_id,
					type,
					message,
					target_id,
					message_count
				)
				VALUES
				(
					$1,
					$2,
					$3,
					$4,
					$5,
					$6
				)
				RETURNING id, created_at
				`,
				postOwnerID,
				userID,
				"like",
				"liked your post",
				postID,
				1,
			).Scan(
				&notificationID,
				&createdAt,
			)

		}

		if err != nil {

			http.Error(
				w,
				"Could not create notification",
				http.StatusInternalServerError,
			)

			return
		}

		err = tx.Commit()

		if err != nil {

			http.Error(
				w,
				"Could not create notification",
				http.StatusInternalServerError,
			)

			return
		}

		var senderName string
		var senderAvatarURL string

		database.DB.QueryRow(
			`
			SELECT name, avatar_url
			FROM users
			WHERE id = $1
			`,
			userID,
		).Scan(
			&senderName,
			&senderAvatarURL,
		)

		message := "liked your post"

		if messageCount > 1 {
			message = fmt.Sprintf(
				"liked your post and %d others",
				messageCount-1,
			)
		}

		websocket.SendNotification(
			postOwnerID,
			map[string]interface{}{
				"type": "notification",
				"notification": map[string]interface{}{
					"id":                notificationID,
					"created_at":        createdAt,
					"sender_id":         userID,
					"sender_name":       senderName,
					"sender_avatar_url": senderAvatarURL,
					"type":              "like",
					"message":           message,
					"message_count":     messageCount,
					"is_read":           false,
					"target_id":         postID,
				},
			},
		)
	}

	json.NewEncoder(
		w,
	).Encode(
		map[string]string{
			"message": "Post liked",
		},
	)
}
