package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"campushub/internal/database"
	"campushub/internal/models"
	"campushub/internal/websocket"

	"github.com/go-chi/chi/v5"
)

// CreateComment godoc
//
// @Summary Create comment
// @Tags Comments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Post ID"
// @Param comment body models.Comment true "Comment Data"
// @Success 201 {object} models.Comment
// @Router /posts/{id}/comments [post]
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

	var commenterName string

	database.DB.QueryRow(
		`
	SELECT name
	FROM users
	WHERE id = $1
	`,
		userID,
	).Scan(&commenterName)

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

	var allowCommentNotifications bool

	err = database.DB.QueryRow(
		`
		SELECT comment_notifications
		FROM user_settings
		WHERE user_id = $1
	`,
		postOwnerID,
	).Scan(
		&allowCommentNotifications,
	)

	if err == nil &&
		postOwnerID != userID &&
		allowCommentNotifications {

		var notificationID int
		var createdAt string

		err = database.DB.QueryRow(
			`
    INSERT INTO notifications
    (
        user_id,
        sender_id,
        type,
        message,
        target_id
    )
    VALUES
    (
        $1,
        $2,
        $3,
        $4,
        $5
    )
    RETURNING id, created_at
    `,
			postOwnerID,
			userID,
			"comment",
			"commented on your post",
			postID,
		).Scan(
			&notificationID,
			&createdAt,
		)

		if err != nil {

			http.Error(
				w,
				"Could not create notification",
				http.StatusInternalServerError,
			)

			return
		}

		var senderName string

		database.DB.QueryRow(
			`
    SELECT name
    FROM users
    WHERE id = $1
    `,
			userID,
		).Scan(&senderName)

		websocket.SendNotification(
			postOwnerID,
			map[string]interface{}{
				"type": "notification",
				"notification": map[string]interface{}{
					"id":          notificationID,
					"created_at":  createdAt,
					"sender_id":   userID,
					"sender_name": senderName,
					"type":        "comment",
					"message":     "commented on your post",
					"is_read":     false,
					"target_id":   postID,
				},
			},
		)

	}

	websocket.Broadcast(
		map[string]interface{}{
			"type": "comment",
			"comment": map[string]interface{}{
				"id":         comment.ID,
				"post_id":    comment.PostID,
				"user_id":    comment.UserID,
				"author":     commenterName,
				"content":    comment.Content,
				"created_at": comment.CreatedAt,
			},
		},
	)

	websocket.Broadcast(
		map[string]interface{}{
			"type":    "comment_count",
			"post_id": postID,
			"delta":   1,
		},
	)

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

	comments :=
		[]models.Comment{}

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
