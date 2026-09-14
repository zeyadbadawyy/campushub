package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"campushub/internal/database"
	"campushub/internal/websocket"
)

type MentionUser struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	Faculty   string `json:"faculty"`
	AvatarURL string `json:"avatar_url"`
}

func SearchMentionUsers(
	w http.ResponseWriter,
	r *http.Request,
) {
	query := strings.TrimSpace(
		r.URL.Query().Get("q"),
	)

	currentUserID :=
		r.Context().
			Value("userID").(int)

	rows, err :=
		database.DB.Query(
			`
			SELECT
				u.id,
				u.name,
				u.faculty,
				u.avatar_url
			FROM users u
			JOIN user_settings s
				ON s.user_id = u.id
			WHERE u.id != $1
			AND s.show_in_search = TRUE
			AND LOWER(u.name) LIKE LOWER($2)
			ORDER BY
				CASE
					WHEN LOWER(u.name) LIKE LOWER($3)
					THEN 0
					ELSE 1
				END,
				u.name ASC
			LIMIT 8
			`,
			currentUserID,
			"%"+query+"%",
			query+"%",
		)

	if err != nil {
		http.Error(
			w,
			"Search failed",
			http.StatusInternalServerError,
		)
		return
	}

	defer rows.Close()

	users :=
		[]MentionUser{}

	for rows.Next() {
		var user MentionUser

		if err := rows.Scan(
			&user.ID,
			&user.Name,
			&user.Faculty,
			&user.AvatarURL,
		); err != nil {
			http.Error(
				w,
				"Could not read users",
				http.StatusInternalServerError,
			)
			return
		}

		users =
			append(
				users,
				user,
			)
	}

	if err := rows.Err(); err != nil {
		http.Error(
			w,
			"Could not read users",
			http.StatusInternalServerError,
		)
		return
	}

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	json.NewEncoder(w).Encode(users)
}

func SavePostMentions(
	postID int,
	mentionIDs []int,
) error {
	for _, userID := range uniqueIDs(mentionIDs) {
		_, err :=
			database.DB.Exec(
				`
				INSERT INTO post_mentions
				(post_id, user_id)
				VALUES ($1, $2)
				ON CONFLICT DO NOTHING
				`,
				postID,
				userID,
			)

		if err != nil {
			return err
		}
	}

	return nil
}

func SaveCommentMentions(
	commentID int,
	mentionIDs []int,
) error {
	for _, userID := range uniqueIDs(mentionIDs) {
		_, err :=
			database.DB.Exec(
				`
				INSERT INTO comment_mentions
				(comment_id, user_id)
				VALUES ($1, $2)
				ON CONFLICT DO NOTHING
				`,
				commentID,
				userID,
			)

		if err != nil {
			return err
		}
	}

	return nil
}

func NotifyPostMentions(
	postID int,
	senderID int,
	mentionIDs []int,
) {
	var senderName string
	var senderAvatar string

	database.DB.QueryRow(
		`
		SELECT
			name,
			avatar_url
		FROM users
		WHERE id = $1
		`,
		senderID,
	).Scan(
		&senderName,
		&senderAvatar,
	)

	for _, mentionedUserID := range uniqueIDs(mentionIDs) {

		if mentionedUserID == senderID {
			continue
		}

		var notificationID int
		var createdAt string

		err :=
			database.DB.QueryRow(
				`
				INSERT INTO notifications
				(
					user_id,
					sender_id,
					type,
					message,
					target_id
				)
				VALUES ($1, $2, $3, $4, $5)
				RETURNING id, created_at
				`,
				mentionedUserID,
				senderID,
				"mention",
				"mentioned you in a post",
				postID,
			).Scan(
				&notificationID,
				&createdAt,
			)

		if err != nil {
			continue
		}

		websocket.SendNotification(
			mentionedUserID,
			map[string]interface{}{
				"type": "notification",
				"notification": map[string]interface{}{
					"id":                notificationID,
					"created_at":        createdAt,
					"sender_id":         senderID,
					"sender_name":       senderName,
					"sender_avatar_url": senderAvatar,
					"type":              "mention",
					"message":           "mentioned you in a post",
					"is_read":           false,
					"target_id":         postID,
					"message_count":     1,
				},
			},
		)
	}
}

func NotifyCommentMentions(
	commentID int,
	postID int,
	senderID int,
	mentionIDs []int,
) {
	var senderName string
	var senderAvatar string

	database.DB.QueryRow(
		`
		SELECT
			name,
			avatar_url
		FROM users
		WHERE id = $1
		`,
		senderID,
	).Scan(
		&senderName,
		&senderAvatar,
	)

	for _, mentionedUserID := range uniqueIDs(mentionIDs) {

		if mentionedUserID == senderID {
			continue
		}

		var notificationID int
		var createdAt string

		err :=
			database.DB.QueryRow(
				`
				INSERT INTO notifications
				(
					user_id,
					sender_id,
					type,
					message,
					target_id
				)
				VALUES ($1, $2, $3, $4, $5)
				RETURNING id, created_at
				`,
				mentionedUserID,
				senderID,
				"mention",
				"mentioned you in a comment",
				postID,
			).Scan(
				&notificationID,
				&createdAt,
			)

		if err != nil {
			continue
		}

		websocket.SendNotification(
			mentionedUserID,
			map[string]interface{}{
				"type": "notification",
				"notification": map[string]interface{}{
					"id":                notificationID,
					"created_at":        createdAt,
					"sender_id":         senderID,
					"sender_name":       senderName,
					"sender_avatar_url": senderAvatar,
					"type":              "mention",
					"message":           "mentioned you in a comment",
					"is_read":           false,
					"target_id":         postID,
					"post_id":           postID,
					"comment_id":        commentID,
					"message_count":     1,
				},
			},
		)
	}
}

func uniqueIDs(
	ids []int,
) []int {
	seen :=
		make(map[int]struct{}, len(ids))

	result :=
		make([]int, 0, len(ids))

	for _, id := range ids {

		if _, exists := seen[id]; exists {
			continue
		}

		seen[id] = struct{}{}
		result =
			append(
				result,
				id,
			)
	}

	return result
}
