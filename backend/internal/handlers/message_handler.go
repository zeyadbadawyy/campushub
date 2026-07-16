package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"campushub/internal/database"
	"campushub/internal/models"

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

	if err != nil {

		http.Error(
			w,
			"Could not update read status",
			http.StatusInternalServerError,
		)

		return
	}

	rows, err := database.DB.Query(
		`
		SELECT
			id,
			sender_id,
			receiver_id,
			content,
			created_at
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
