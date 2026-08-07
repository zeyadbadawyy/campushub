package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"campushub/internal/database"
	"campushub/internal/models"

	"github.com/go-chi/chi/v5"
)

// ToggleFollow godoc
//
//	@Summary		Follow or unfollow user
//	@Description	Toggle follow status
//	@Tags			Follows
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	int	true	"User ID"
//	@Success		200
//	@Router			/users/{id}/follow [post]
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

	var requestExists bool

	err = database.DB.QueryRow(
		`
	SELECT EXISTS(
		SELECT 1
		FROM follow_requests
		WHERE requester_id=$1
		AND target_user_id=$2
	)
	`,
		currentUserID,
		targetUserID,
	).Scan(
		&requestExists,
	)

	if err != nil {

		http.Error(
			w,
			"Database error",
			http.StatusInternalServerError,
		)

		return
	}

	if requestExists {

		json.NewEncoder(w).Encode(
			map[string]string{
				"message": "Request already sent",
			},
		)

		return
	}

	if IsPrivateAccount(
		targetUserID,
	) {

		_, err =
			database.DB.Exec(
				`
			INSERT INTO follow_requests
			(
				requester_id,
				target_user_id
			)
			VALUES
			(
				$1,
				$2
			)
			`,
				currentUserID,
				targetUserID,
			)

		if err != nil {

			http.Error(
				w,
				"Could not create follow request",
				http.StatusInternalServerError,
			)

			return
		}

		_, err =
			database.DB.Exec(
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
			`,
				targetUserID,
				currentUserID,
				"follow_request",
				"sent you a follow request",
				currentUserID,
			)

		if err != nil {

			http.Error(
				w,
				"Could not create notification",
				http.StatusInternalServerError,
			)

			return
		}

		json.NewEncoder(
			w,
		).Encode(
			map[string]string{
				"message": "Follow request sent",
			},
		)

		return
	}

	_, err =
		database.DB.Exec(
			`
		INSERT INTO follows
		(
			follower_id,
			following_id
		)
		VALUES
		(
			$1,
			$2
		)
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

	var allowFollowNotifications bool

	err = database.DB.QueryRow(
		`
	SELECT follow_notifications
	FROM user_settings
	WHERE user_id = $1
	`,
		targetUserID,
	).Scan(
		&allowFollowNotifications,
	)

	if err != nil {

		http.Error(
			w,
			"Settings not found",
			http.StatusInternalServerError,
		)

		return
	}

	if allowFollowNotifications {

		_, err =
			database.DB.Exec(
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
		`,
				targetUserID,
				currentUserID,
				"follow",
				"started following you",
				currentUserID,
			)

		if err != nil {

			http.Error(
				w,
				err.Error(),
				http.StatusInternalServerError,
			)

			return
		}
	}

	json.NewEncoder(
		w,
	).Encode(
		map[string]string{
			"message": "User followed",
		},
	)
}

// GetFollowStats godoc
//
//	@Summary		Get follow statistics
//	@Description	Get followers and following counts for a user
//	@Tags			Follows
//	@Produce		json
//	@Param			id	path	int	true	"User ID"
//	@Success		200
//	@Failure		404
//	@Router			/users/{id}/follow-stats [get]
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

	var exists bool

	err = database.DB.QueryRow(
		`
	SELECT EXISTS(
		SELECT 1
		FROM users
		WHERE id=$1
	)
	`,
		userID,
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

// IsFollowing godoc
//
//	@Summary		Check follow status
//	@Description	Check if current user follows a specific user
//	@Tags			Follows
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	int	true	"User ID"
//	@Success		200
//	@Failure		401
//	@Failure		404
//	@Router			/users/{id}/follow-status [get]
func IsFollowing(
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

	var isFollowing bool

	err = database.DB.QueryRow(
		`
		SELECT EXISTS(
			SELECT 1
			FROM follows
			WHERE follower_id=$1
			AND following_id=$2
		)
		`,
		currentUserID,
		targetUserID,
	).Scan(
		&isFollowing,
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
			"isFollowing": isFollowing,
		},
	)
}

func GetFollowRequests(
	w http.ResponseWriter,
	r *http.Request,
) {

	currentUserID :=
		r.Context().
			Value(
				"userID",
			).(int)

	rows, err :=
		database.DB.Query(
			`
			SELECT
				fr.requester_id,
				u.name,
				fr.created_at
			FROM follow_requests fr
			JOIN users u
				ON u.id = fr.requester_id
			WHERE fr.target_user_id = $1
			ORDER BY fr.created_at DESC
			`,
			currentUserID,
		)

	if err != nil {

		http.Error(
			w,
			"Could not fetch requests",
			http.StatusInternalServerError,
		)

		return
	}

	defer rows.Close()

	requests :=
		[]models.FollowRequest{}

	for rows.Next() {

		var request models.FollowRequest

		rows.Scan(
			&request.RequesterID,
			&request.Name,
			&request.CreatedAt,
		)

		requests =
			append(
				requests,
				request,
			)
	}

	json.NewEncoder(
		w,
	).Encode(
		requests,
	)
}

func AcceptFollowRequest(
	w http.ResponseWriter,
	r *http.Request,
) {

	requesterParam :=
		chi.URLParam(
			r,
			"id",
		)

	requesterID, err :=
		strconv.Atoi(
			requesterParam,
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

	result, err :=
		database.DB.Exec(
			`
			DELETE FROM follow_requests
			WHERE requester_id=$1
			AND target_user_id=$2
			`,
			requesterID,
			currentUserID,
		)

	if err != nil {

		http.Error(
			w,
			"Could not accept request",
			http.StatusInternalServerError,
		)

		return
	}

	rowsAffected, _ :=
		result.RowsAffected()

	if rowsAffected == 0 {

		http.Error(
			w,
			"Follow request not found",
			http.StatusNotFound,
		)

		return
	}

	_, err =
		database.DB.Exec(
			`
			INSERT INTO follows
			(
				follower_id,
				following_id
			)
			VALUES
			(
				$1,
				$2
			)
			`,
			requesterID,
			currentUserID,
		)

	_, err =
		database.DB.Exec(
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
		`,
			requesterID,
			currentUserID,
			"follow_accepted",
			"accepted your follow request",
			currentUserID,
		)

	if err != nil {

		http.Error(
			w,
			"Could not create notification",
			http.StatusInternalServerError,
		)

		return
	}

	json.NewEncoder(
		w,
	).Encode(
		map[string]string{
			"message": "Request accepted",
		},
	)
}

func RejectFollowRequest(
	w http.ResponseWriter,
	r *http.Request,
) {

	requesterParam :=
		chi.URLParam(
			r,
			"id",
		)

	requesterID, err :=
		strconv.Atoi(
			requesterParam,
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

	result, err :=
		database.DB.Exec(
			`
			DELETE FROM follow_requests
			WHERE requester_id=$1
			AND target_user_id=$2
			`,
			requesterID,
			currentUserID,
		)

	if err != nil {

		http.Error(
			w,
			"Could not reject request",
			http.StatusInternalServerError,
		)

		return
	}

	rowsAffected, _ :=
		result.RowsAffected()

	if rowsAffected == 0 {

		http.Error(
			w,
			"Follow request not found",
			http.StatusNotFound,
		)

		return
	}

	json.NewEncoder(
		w,
	).Encode(
		map[string]string{
			"message": "Request rejected",
		},
	)
}
