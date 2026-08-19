package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	gorilla "github.com/gorilla/websocket"

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

	if message.Content == "" {

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
		(sender_id,receiver_id,content)
		VALUES ($1,$2,$3)
		RETURNING id,created_at
		`,
		senderID,
		receiverID,
		message.Content,
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

	messageJSON, _ :=
		json.Marshal(message)

	if client, exists :=
		websocket.WSHub.Clients[receiverID]; exists {

		client.Conn.WriteMessage(
			gorilla.TextMessage,
			messageJSON,
		)
	}

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

		if client, exists := websocket.WSHub.Clients[receiverID]; exists {

			client.Conn.WriteJSON(
				map[string]interface{}{
					"type":  "unread_count",
					"count": unreadCount,
				},
			)

		}
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

	if allowMessageNotifications {

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
			receiverID,
			senderID,
			"message",
			"sent you a message",
			senderID,
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
			senderID,
		).Scan(&senderName)

		websocket.SendNotification(
			receiverID,
			map[string]interface{}{
				"type": "notification",
				"notification": map[string]interface{}{
					"id":          notificationID,
					"created_at":  createdAt,
					"sender_id":   senderID,
					"sender_name": senderName,
					"type":        "message",
					"message":     "sent you a message",
					"is_read":     false,
					"target_id":   senderID,
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

	_, err = database.DB.Exec(
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

	if client, exists := websocket.WSHub.Clients[targetUserID]; exists {

		client.Conn.WriteJSON(
			map[string]interface{}{
				"type":               "read",
				"readerId":           currentUserID,
				"readUntilMessageId": readUntilMessageID,
			},
		)

	}

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

		if client, exists := websocket.WSHub.Clients[currentUserID]; exists {

			client.Conn.WriteJSON(
				map[string]interface{}{
					"type":  "unread_count",
					"count": unreadCount,
				},
			)

		}
	}

	rows, err := database.DB.Query(
		`
		SELECT
			id,
			sender_id,
			receiver_id,
			content,
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

		rows.Scan(
			&message.ID,
			&message.SenderID,
			&message.ReceiverID,
			&message.Content,
			&message.CreatedAt,
			&message.IsRead,
		)

		messages =
			append(
				messages,
				message,
			)
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
			m.content,
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
			&conversation.LastMessage,
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
