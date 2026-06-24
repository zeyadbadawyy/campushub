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
//	@Summary		Send message
//	@Description	Send a direct message to another user
//	@Tags			Messages
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	int	true	"Receiver ID"
//	@Success		201
//	@Router			/messages/{id} [post]
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
		SELECT DISTINCT
			u.id,
			u.name
		FROM users u
		JOIN messages m
		ON (
			(u.id = m.sender_id
				AND m.receiver_id = $1)
			OR
			(u.id = m.receiver_id
				AND m.sender_id = $1)
		)
		WHERE u.id != $1
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

	var conversations []models.Conversation

	for rows.Next() {

		var conversation models.Conversation

		rows.Scan(
			&conversation.UserID,
			&conversation.Name,
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
