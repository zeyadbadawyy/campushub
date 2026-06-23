package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"campushub/internal/database"

	"github.com/go-chi/chi/v5"
)

func ToggleFollow(
	w http.ResponseWriter,
	r *http.Request,
) {

	targetUserParam :=
		chi.URLParam(
			r,
			"id",
		)

	targetUserID, err :=
		strconv.Atoi(
			targetUserParam,
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

	if currentUserID ==
		targetUserID {

		http.Error(
			w,
			"Cannot follow yourself",
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
		targetUserID,
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

	var followID int

	err = database.DB.QueryRow(
		`
		SELECT id
		FROM follows
		WHERE follower_id=$1
		AND following_id=$2
		`,
		currentUserID,
		targetUserID,
	).Scan(
		&followID,
	)

	if err == nil {

		_, err =
			database.DB.Exec(
				`
				DELETE FROM follows
				WHERE id=$1
				`,
				followID,
			)

		if err != nil {

			http.Error(
				w,
				"Could not unfollow",
				http.StatusInternalServerError,
			)

			return
		}

		json.NewEncoder(
			w,
		).Encode(
			map[string]string{
				"message": "User unfollowed",
			},
		)

		return
	}

	_, err =
		database.DB.Exec(
			`
			INSERT INTO follows
			(follower_id,following_id)
			VALUES ($1,$2)
			`,
			currentUserID,
			targetUserID,
		)

	if err != nil {

		http.Error(
			w,
			"Could not follow user",
			http.StatusInternalServerError,
		)

		return
	}

	json.NewEncoder(
		w,
	).Encode(
		map[string]string{
			"message": "User followed",
		},
	)
}

func GetFollowStats(
	w http.ResponseWriter,
	r *http.Request,
) {

	userIDParam :=
		chi.URLParam(
			r,
			"id",
		)

	userID, err :=
		strconv.Atoi(
			userIDParam,
		)

	if err != nil {

		http.Error(
			w,
			"Invalid user ID",
			http.StatusBadRequest,
		)

		return
	}

	var followers int
	var following int

	database.DB.QueryRow(
		`
		SELECT COUNT(*)
		FROM follows
		WHERE following_id=$1
		`,
		userID,
	).Scan(
		&followers,
	)

	database.DB.QueryRow(
		`
		SELECT COUNT(*)
		FROM follows
		WHERE follower_id=$1
		`,
		userID,
	).Scan(
		&following,
	)

	json.NewEncoder(
		w,
	).Encode(
		map[string]int{
			"followers": followers,
			"following": following,
		},
	)
}
