package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"campushub/internal/database"

	"github.com/go-chi/chi/v5"
)

func getAuthenticatedUserID(r *http.Request) int {
	return r.Context().Value("userID").(int)
}

func getOtherUserID(r *http.Request) (int, error) {
	return strconv.Atoi(chi.URLParam(r, "id"))
}

// GetConversationSettings godoc
//
//	@Summary		Get conversation settings
//	@Tags			Messages
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	int	true	"Other User ID"
//	@Success		200
//	@Failure		400
//	@Failure		404
//	@Router			/messages/{id}/settings [get]
func GetConversationSettings(
	w http.ResponseWriter,
	r *http.Request,
) {
	currentUserID := getAuthenticatedUserID(r)

	otherUserID, err := getOtherUserID(r)
	if err != nil {
		http.Error(
			w,
			"Invalid user ID",
			http.StatusBadRequest,
		)
		return
	}

	if currentUserID == otherUserID {
		http.Error(
			w,
			"Invalid conversation",
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
			WHERE id = $1
		)
		`,
		otherUserID,
	).Scan(&exists)

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

	var muted bool

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
		currentUserID,
		otherUserID,
	).Scan(&muted)

	if err != nil {
		http.Error(
			w,
			"Could not fetch conversation settings",
			http.StatusInternalServerError,
		)
		return
	}

	json.NewEncoder(w).Encode(
		map[string]interface{}{
			"muted": muted,
		},
	)
}

// ToggleConversationMute godoc
//
//	@Summary		Toggle conversation mute
//	@Tags			Messages
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	int	true	"Other User ID"
//	@Success		200
//	@Failure		400
//	@Failure		404
//	@Router			/messages/{id}/settings/mute [put]
func ToggleConversationMute(
	w http.ResponseWriter,
	r *http.Request,
) {
	currentUserID := getAuthenticatedUserID(r)

	otherUserID, err := getOtherUserID(r)
	if err != nil {
		http.Error(
			w,
			"Invalid user ID",
			http.StatusBadRequest,
		)
		return
	}

	if currentUserID == otherUserID {
		http.Error(
			w,
			"Invalid conversation",
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
			WHERE id = $1
		)
		`,
		otherUserID,
	).Scan(&exists)

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

	var muted bool

	err = database.DB.QueryRow(
		`
		INSERT INTO conversation_settings
		(
			user_id,
			other_user_id,
			muted
		)
		VALUES
		(
			$1,
			$2,
			TRUE
		)
		ON CONFLICT (user_id, other_user_id)
		DO UPDATE
		SET
			muted = NOT conversation_settings.muted,
			updated_at = CURRENT_TIMESTAMP
		RETURNING muted
		`,
		currentUserID,
		otherUserID,
	).Scan(&muted)

	if err != nil {
		http.Error(
			w,
			"Could not update mute state",
			http.StatusInternalServerError,
		)
		return
	}

	json.NewEncoder(w).Encode(
		map[string]interface{}{
			"muted": muted,
		},
	)
}

// SearchConversation godoc
//
//	@Summary		Search conversation
//	@Tags			Messages
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id		path	int	true	"Other User ID"
//	@Param			q		query	string	true	"Search query"
//	@Success		200
//	@Failure		400
//	@Failure		404
//	@Router			/messages/{id}/search [get]
func SearchConversation(
	w http.ResponseWriter,
	r *http.Request,
) {
	currentUserID := getAuthenticatedUserID(r)

	otherUserID, err := getOtherUserID(r)
	if err != nil {
		http.Error(
			w,
			"Invalid user ID",
			http.StatusBadRequest,
		)
		return
	}

	if currentUserID == otherUserID {
		http.Error(
			w,
			"Invalid conversation",
			http.StatusBadRequest,
		)
		return
	}

	query := strings.TrimSpace(
		r.URL.Query().Get("q"),
	)

	if query == "" {
		json.NewEncoder(w).Encode([]interface{}{})
		return
	}

	if len(query) > 100 {
		http.Error(
			w,
			"Search query is too long",
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
			WHERE id = $1
		)
		`,
		otherUserID,
	).Scan(&exists)

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

	rows, err := database.DB.Query(
		`
		SELECT
			id,
			sender_id,
			receiver_id,
			content,
			image_url,
			created_at,
			is_read
		FROM messages
		WHERE
			(
				(sender_id = $1 AND receiver_id = $2)
				OR
				(sender_id = $2 AND receiver_id = $1)
			)
			AND content ILIKE '%' || $3 || '%'
		ORDER BY created_at DESC
		LIMIT 50
		`,
		currentUserID,
		otherUserID,
		query,
	)

	if err != nil {
		http.Error(
			w,
			"Could not search conversation",
			http.StatusInternalServerError,
		)
		return
	}

	defer rows.Close()

	type SearchResult struct {
		ID         int    `json:"id"`
		SenderID   int    `json:"sender_id"`
		ReceiverID int    `json:"receiver_id"`
		Content    string `json:"content"`
		ImageURL   string `json:"image_url"`
		CreatedAt  string `json:"created_at"`
		IsRead     bool   `json:"is_read"`
	}

	results := []SearchResult{}

	for rows.Next() {
		var result SearchResult

		err := rows.Scan(
			&result.ID,
			&result.SenderID,
			&result.ReceiverID,
			&result.Content,
			&result.ImageURL,
			&result.CreatedAt,
			&result.IsRead,
		)

		if err != nil {
			http.Error(
				w,
				"Could not read search results",
				http.StatusInternalServerError,
			)
			return
		}

		results = append(
			results,
			result,
		)
	}

	if err := rows.Err(); err != nil {
		http.Error(
			w,
			"Could not read search results",
			http.StatusInternalServerError,
		)
		return
	}

	json.NewEncoder(w).Encode(results)
}
