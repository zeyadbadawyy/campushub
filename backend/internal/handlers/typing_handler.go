package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"campushub/internal/database"

	"github.com/go-chi/chi/v5"
)

type TypingRequest struct {
	IsTyping bool `json:"is_typing"`
}

func UpdateTypingStatus(
	w http.ResponseWriter,
	r *http.Request,
) {

	targetParam :=
		chi.URLParam(
			r,
			"id",
		)

	targetID, err :=
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

	var req TypingRequest

	err = json.NewDecoder(
		r.Body,
	).Decode(
		&req,
	)

	if err != nil {

		http.Error(
			w,
			"Invalid JSON",
			http.StatusBadRequest,
		)

		return
	}

	_, err = database.DB.Exec(
		`
		INSERT INTO typing_status
		(
			user_id,
			target_user_id,
			is_typing,
			updated_at
		)
		VALUES
		(
			$1,
			$2,
			$3,
			NOW()
		)

		ON CONFLICT (user_id)

		DO UPDATE SET
			target_user_id = EXCLUDED.target_user_id,
			is_typing = EXCLUDED.is_typing,
			updated_at = NOW()
		`,
		currentUserID,
		targetID,
		req.IsTyping,
	)

	if err != nil {

		http.Error(
			w,
			"Database error",
			http.StatusInternalServerError,
		)

		return
	}

	json.NewEncoder(
		w,
	).Encode(
		map[string]bool{
			"success": true,
		},
	)

}

func GetTypingStatus(
	w http.ResponseWriter,
	r *http.Request,
) {

	targetParam :=
		chi.URLParam(
			r,
			"id",
		)

	targetID, err :=
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

	var isTyping bool

	err = database.DB.QueryRow(
		`
		SELECT is_typing
		FROM typing_status
		WHERE user_id = $1
		AND target_user_id = $2
		`,
		targetID,
		currentUserID,
	).Scan(
		&isTyping,
	)

	if err != nil {

		isTyping = false

	}

	json.NewEncoder(
		w,
	).Encode(
		map[string]bool{
			"is_typing": isTyping,
		},
	)

}
