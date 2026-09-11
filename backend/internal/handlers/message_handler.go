package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"campushub/internal/database"
	"campushub/internal/models"
	"campushub/internal/websocket"

	"github.com/go-chi/chi/v5"
)

// SendMessage godoc
//
// @Summary Send message
// @Tags Messages
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Receiver User ID"
// @Param message body models.Message true "Message Data"
// @Success 201 {object} models.Message
// @Router /messages/{id} [post]
func SendMessage(
	w http.ResponseWriter,
	r *http.Request,
) {

	receiverParam :=
		chi.URLParam(
			r,
			"id",
		)

	receiverID, err :=
		strconv.Atoi(
			receiverParam,
		)

	if err != nil {

		http.Error(
			w,
			"Invalid receiver ID",
			http.StatusBadRequest,
		)

		return
	}

	senderID :=
		r.Context().
			Value(
				"userID",
			).(int)

	if senderID ==
		receiverID {

		http.Error(
			w,
			"Cannot message yourself",
			http.StatusBadRequest,
		)

		return
	}

	var exists bool

	err = database.DB.QueryRow(
		`
		SELECT EXISTS(
			SELECT 1
			FROM users
			WHERE id=$1
		)
		`,
		receiverID,
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
			"User not found",
			http.StatusNotFound,
		)

		return
	}

	var allowMessages bool

	err = database.DB.QueryRow(
		`
	SELECT allow_messages
	FROM user_settings
	WHERE user_id = $1
	`,
		receiverID,
	).Scan(
		&allowMessages,
	)

	if err != nil {

		http.Error(
			w,
			"Settings not found",
			http.StatusInternalServerError,
		)

		return
	}

	var hasConversation bool

	err = database.DB.QueryRow(
		`
	SELECT EXISTS(
		SELECT 1
		FROM messages
		WHERE
		(
			sender_id = $1
			AND receiver_id = $2
		)
		OR
		(
			sender_id = $2
			AND receiver_id = $1
		)
	)
	`,
		senderID,
		receiverID,
	).Scan(
		&hasConversation,
	)

	if err != nil {

		http.Error(
			w,
			"Database error",
			http.StatusInternalServerError,
		)

		return
	}

	if !allowMessages &&
		!hasConversation {

		http.Error(
			w,
			"This user is not accepting new messages",
			http.StatusForbidden,
		)

		return
	}

	var message models.Message

	err = json.NewDecoder(
		r.Body,
	).Decode(
		&message,
	)

	if err != nil {

		http.Error(
			w,
			"Invalid JSON",
			http.StatusBadRequest,
		)

		return
	}

	if message.Content == "" &&
		message.ImageURL == "" &&
		message.GIFURL == "" {

		http.Error(
			w,
			"Message content required",
			http.StatusBadRequest,
		)

		return
	}

	err = database.DB.QueryRow(
		`
		INSERT INTO messages
		(
				sender_id,
				receiver_id,
				content,
				image_url,
				gif_url
		)
		VALUES
		(
				$1,
				$2,
				$3,
				$4,
				$5
		)
		RETURNING id,created_at
		`,
		senderID,
		receiverID,
		message.Content,
		message.ImageURL,
		message.GIFURL,
	).Scan(
		&message.ID,
		&message.CreatedAt,
	)

	if err != nil {

		http.Error(
			w,
			"Could not send message",
			http.StatusInternalServerError,
		)

		return
	}

	message.SenderID = senderID
	message.ReceiverID = receiverID

	websocket.SendToUser(
		receiverID,
		message,
	)

	var unreadCount int

	err = database.DB.QueryRow(
		`
	SELECT COUNT(DISTINCT sender_id)
	FROM messages
	WHERE receiver_id = $1
	AND is_read = FALSE
	`,
		receiverID,
	).Scan(
		&unreadCount,
	)

	if err == nil {

		websocket.SendToUser(
			receiverID,
			map[string]interface{}{
				"type":  "unread_count",
				"count": unreadCount,
			},
		)
	}

	var allowMessageNotifications bool

	err = database.DB.QueryRow(
		`
	SELECT message_notifications
	FROM user_settings
	WHERE user_id = $1
`,
		receiverID,
	).Scan(
		&allowMessageNotifications,
	)

	if err != nil {

		http.Error(
			w,
			"Settings not found",
			http.StatusInternalServerError,
		)

		return
	}

	var conversationMuted bool

	err = database.DB.QueryRow(
		`
	SELECT COALESCE(
		(
			SELECT muted
			FROM conversation_settings
			WHERE user_id = $1
			AND other_user_id = $2
		),
		FALSE
	)
	`,
		receiverID,
		senderID,
	).Scan(
		&conversationMuted,
	)

	if err != nil {

		http.Error(
			w,
			"Could not check conversation settings",
			http.StatusInternalServerError,
		)

		return
	}

	if allowMessageNotifications &&
		!conversationMuted {

		tx, err := database.DB.Begin()

		if err != nil {
			http.Error(
				w,
				"Could not start notification transaction",
				http.StatusInternalServerError,
			)
			return
		}

		_, err = tx.Exec(
			`
		SELECT pg_advisory_xact_lock(
			hashtext($1)
		)
		`,
			fmt.Sprintf(
				"message-notification:%d:%d",
				receiverID,
				senderID,
			),
		)

		if err != nil {
			_ = tx.Rollback()

			http.Error(
				w,
				"Could not lock notification batch",
				http.StatusInternalServerError,
			)
			return
		}

		var notificationID int
		var createdAt string
		var messageCount int

		err = tx.QueryRow(
			`
		SELECT
			id,
			created_at,
			message_count
		FROM notifications
		WHERE user_id = $1
		AND sender_id = $2
		AND type = 'message'
		AND is_read = FALSE
		AND created_at >= CURRENT_TIMESTAMP - INTERVAL '1 minute'
		ORDER BY created_at DESC
		LIMIT 1
		FOR UPDATE
		`,
			receiverID,
			senderID,
		).Scan(
			&notificationID,
			&createdAt,
			&messageCount,
		)

		if err == nil {

			messageCount++

			notificationMessage :=
				"sent you a message"

			if messageCount > 1 {
				notificationMessage =
					fmt.Sprintf(
						"sent you %d messages",
						messageCount,
					)
			}

			err = tx.QueryRow(
				`
			UPDATE notifications
			SET
				message = $1,
				message_count = $2,
				created_at = CURRENT_TIMESTAMP
			WHERE id = $3
			RETURNING created_at
			`,
				notificationMessage,
				messageCount,
				notificationID,
			).Scan(
				&createdAt,
			)

			if err != nil {
				_ = tx.Rollback()

				http.Error(
					w,
					"Could not update notification",
					http.StatusInternalServerError,
				)
				return
			}

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
				receiverID,
				senderID,
				"message",
				"sent you a message",
				senderID,
				1,
			).Scan(
				&notificationID,
				&createdAt,
			)

			if err != nil {
				_ = tx.Rollback()

				http.Error(
					w,
					"Could not create notification",
					http.StatusInternalServerError,
				)
				return
			}
		}

		if err = tx.Commit(); err != nil {

			http.Error(
				w,
				"Could not save notification",
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
			senderID,
		).Scan(
			&senderName,
			&senderAvatarURL,
		)

		notificationMessage :=
			"sent you a message"

		if messageCount > 1 {
			notificationMessage =
				fmt.Sprintf(
					"sent you %d messages",
					messageCount,
				)
		}

		websocket.SendNotification(
			receiverID,
			map[string]interface{}{
				"type": "notification",
				"notification": map[string]interface{}{
					"id":                notificationID,
					"created_at":        createdAt,
					"sender_id":         senderID,
					"sender_name":       senderName,
					"sender_avatar_url": senderAvatarURL,
					"type":              "message",
					"message":           notificationMessage,
					"message_count":     messageCount,
					"is_read":           false,
					"target_id":         senderID,
				},
			},
		)
	}

	w.WriteHeader(
		http.StatusCreated,
	)

	json.NewEncoder(
		w,
	).Encode(
		message,
	)
}

// GetConversation godoc
//
//	@Summary		Get conversation
//	@Description	Get all messages exchanged with another user
//	@Tags			Messages
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	int	true	"Other User ID"
//	@Success		200
//	@Failure		401
//	@Router			/messages/{id} [get]
func GetConversation(
	w http.ResponseWriter,
	r *http.Request,
) {

	targetParam :=
		chi.URLParam(
			r,
			"id",
		)

	targetUserID, err :=
		strconv.Atoi(
			targetParam,
		)

	if err != nil {

		http.Error(
			w,
			"Invalid user ID",
			http.StatusBadRequest,
		)

		return
	}

	currentUserID :=
		r.Context().
			Value(
				"userID",
			).(int)

	_, _ = database.DB.Exec(
		`
		UPDATE messages
		SET is_read = TRUE
		WHERE receiver_id = $1
		AND sender_id = $2
		AND is_read = FALSE
		`,
		currentUserID,
		targetUserID,
	)

	_, _ = database.DB.Exec(
		`
	UPDATE notifications
	SET is_read = TRUE
	WHERE user_id = $1
	AND sender_id = $2
	AND type = 'message'
	AND is_read = FALSE
	`,
		currentUserID,
		targetUserID,
	)

	var readUntilMessageID int

	err = database.DB.QueryRow(
		`
	SELECT COALESCE(MAX(id), 0)
	FROM messages
	WHERE receiver_id = $1
	AND sender_id = $2
	AND is_read = TRUE
	`,
		currentUserID,
		targetUserID,
	).Scan(
		&readUntilMessageID,
	)

	if err != nil {

		http.Error(
			w,
			"Database error",
			http.StatusInternalServerError,
		)

		return
	}

	websocket.SendToUser(
		targetUserID,
		map[string]interface{}{
			"type":               "read",
			"readerId":           currentUserID,
			"readUntilMessageId": readUntilMessageID,
		},
	)

	if err != nil {

		http.Error(
			w,
			"Could not update read status",
			http.StatusInternalServerError,
		)

		return
	}

	var unreadCount int

	err = database.DB.QueryRow(
		`
	SELECT COUNT(DISTINCT sender_id)
	FROM messages
	WHERE receiver_id = $1
	AND is_read = FALSE
	`,
		currentUserID,
	).Scan(
		&unreadCount,
	)

	if err == nil {

		websocket.SendToUser(
			currentUserID,
			map[string]interface{}{
				"type":  "unread_count",
				"count": unreadCount,
			},
		)
	}

	var notificationCount int

	err = database.DB.QueryRow(
		`
	SELECT COUNT(*)
	FROM notifications
	WHERE user_id = $1
	AND is_read = FALSE
	`,
		currentUserID,
	).Scan(
		&notificationCount,
	)

	if err == nil {

		websocket.SendToUser(
			currentUserID,
			map[string]interface{}{
				"type":  "notification_count",
				"count": notificationCount,
			},
		)

	}

	rows, err := database.DB.Query(
		`
		SELECT
			id,
			sender_id,
			receiver_id,
			content,
			COALESCE(image_url, ''),
			COALESCE(gif_url, ''),
			created_at,
			is_read
		FROM messages
		WHERE
		(
			sender_id=$1
			AND receiver_id=$2
		)
		OR
		(
			sender_id=$2
			AND receiver_id=$1
		)
		ORDER BY created_at ASC
		`,
		currentUserID,
		targetUserID,
	)

	if err != nil {

		http.Error(
			w,
			"Could not fetch messages",
			http.StatusInternalServerError,
		)

		return
	}

	defer rows.Close()

	var messages []models.Message

	for rows.Next() {

		var message models.Message

		err = rows.Scan(
			&message.ID,
			&message.SenderID,
			&message.ReceiverID,
			&message.Content,
			&message.ImageURL,
			&message.GIFURL,
			&message.CreatedAt,
			&message.IsRead,
		)

		if err != nil {
			http.Error(
				w,
				"Could not read message",
				http.StatusInternalServerError,
			)
			return
		}

		messages =
			append(
				messages,
				message,
			)
	}

	if err = rows.Err(); err != nil {
		http.Error(
			w,
			"Could not read messages",
			http.StatusInternalServerError,
		)
		return
	}

	json.NewEncoder(
		w,
	).Encode(
		messages,
	)
}

// GetConversations godoc
//
//	@Summary		Get conversations list
//	@Description	Get all users the current user has exchanged messages with
//	@Tags			Messages
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200
//	@Failure		401
//	@Router			/conversations [get]
func GetConversations(
	w http.ResponseWriter,
	r *http.Request,
) {

	currentUserID :=
		r.Context().
			Value(
				"userID",
			).(int)

	rows, err := database.DB.Query(
		`
		SELECT
			u.id,
			u.name,
			u.avatar_url,
			m.content,
			m.image_url,
			m.created_at,

			(
				SELECT COUNT(*)
				FROM messages unread
				WHERE unread.sender_id = u.id
				AND unread.receiver_id = $1
				AND unread.is_read = FALSE
			) AS unread_count

		FROM users u

		JOIN (
			SELECT DISTINCT ON (
				CASE
					WHEN sender_id = $1
					THEN receiver_id
					ELSE sender_id
				END
			)
				id,
				sender_id,
				receiver_id,
				content,
				image_url,
				created_at

			FROM messages

			WHERE
				sender_id = $1
				OR receiver_id = $1

			ORDER BY
				CASE
					WHEN sender_id = $1
					THEN receiver_id
					ELSE sender_id
				END,
				created_at DESC
		) m

		ON (
			u.id =
			CASE
				WHEN m.sender_id = $1
				THEN m.receiver_id
				ELSE m.sender_id
			END
		)

		ORDER BY m.created_at DESC
		`,
		currentUserID,
	)

	if err != nil {

		http.Error(
			w,
			"Could not fetch conversations",
			http.StatusInternalServerError,
		)

		return
	}

	defer rows.Close()

	conversations :=
		[]models.Conversation{}

	for rows.Next() {

		var conversation models.Conversation

		rows.Scan(
			&conversation.UserID,
			&conversation.Name,
			&conversation.AvatarURL,
			&conversation.LastMessage,
			&conversation.ImageURL,
			&conversation.LastMessageTime,
			&conversation.UnreadCount,
		)

		conversations =
			append(
				conversations,
				conversation,
			)
	}

	json.NewEncoder(
		w,
	).Encode(
		conversations,
	)
}

func GetUnreadMessagesCount(
	w http.ResponseWriter,
	r *http.Request,
) {

	currentUserID :=
		r.Context().
			Value("userID").(int)

	var count int

	err := database.DB.QueryRow(
		`
		SELECT COUNT(DISTINCT sender_id)
		FROM messages
		WHERE receiver_id = $1
		AND is_read = FALSE
		`,
		currentUserID,
	).Scan(&count)

	if err != nil {

		http.Error(
			w,
			"Database error",
			http.StatusInternalServerError,
		)

		return
	}

	json.NewEncoder(w).Encode(
		map[string]int{
			"count": count,
		},
	)

}
