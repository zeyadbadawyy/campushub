package handlers

import (
	"campushub/internal/database"
	"campushub/internal/models"
	"campushub/internal/websocket"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"golang.org/x/crypto/bcrypt"
)

func GetSettings(
	w http.ResponseWriter,
	r *http.Request,
) {

	userID :=
		r.Context().
			Value("userID").(int)

	var settings models.UserSettings

	err :=
		database.DB.QueryRow(
			`
			SELECT
				id,
				user_id,
				like_notifications,
				comment_notifications,
				follow_notifications,
				message_notifications,
				private_account,
				show_online_status,
				allow_messages,
				show_in_search,
				dark_mode
			FROM user_settings
			WHERE user_id = $1
			`,
			userID,
		).Scan(
			&settings.ID,
			&settings.UserID,
			&settings.LikeNotifications,
			&settings.CommentNotifications,
			&settings.FollowNotifications,
			&settings.MessageNotifications,
			&settings.PrivateAccount,
			&settings.ShowOnlineStatus,
			&settings.AllowMessages,
			&settings.ShowInSearch,
			&settings.DarkMode,
		)

	if err != nil {

		http.Error(
			w,
			"Settings not found",
			http.StatusNotFound,
		)

		return
	}

	json.NewEncoder(
		w,
	).Encode(
		settings,
	)
}

func UpdateSettings(
	w http.ResponseWriter,
	r *http.Request,
) {

	userID :=
		r.Context().
			Value("userID").(int)

	var settings models.UserSettings

	err :=
		json.NewDecoder(
			r.Body,
		).Decode(
			&settings,
		)

	if err != nil {

		http.Error(
			w,
			"Invalid request",
			http.StatusBadRequest,
		)

		return
	}

	var oldPrivate bool

	err = database.DB.QueryRow(
		`
		SELECT private_account
		FROM user_settings
		WHERE user_id = $1
		`,
		userID,
	).Scan(
		&oldPrivate,
	)

	if err != nil {

		http.Error(
			w,
			"Settings not found",
			http.StatusNotFound,
		)

		return
	}

	_, err =
		database.DB.Exec(
			`
			UPDATE user_settings
			SET
				like_notifications = $1,
				comment_notifications = $2,
				follow_notifications = $3,
				message_notifications = $4,
				private_account = $5,
				show_online_status = $6,
				allow_messages = $7,
				show_in_search = $8,
				dark_mode = $9
			WHERE user_id = $10
			`,
			settings.LikeNotifications,
			settings.CommentNotifications,
			settings.FollowNotifications,
			settings.MessageNotifications,
			settings.PrivateAccount,
			settings.ShowOnlineStatus,
			settings.AllowMessages,
			settings.ShowInSearch,
			settings.DarkMode,
			userID,
		)

	if err != nil {

		http.Error(
			w,
			"Failed to update settings",
			http.StatusInternalServerError,
		)

		return
	}

	if oldPrivate && !settings.PrivateAccount {

		_, err = database.DB.Exec(
			`
			DELETE FROM follow_requests
			WHERE target_user_id = $1
			`,
			userID,
		)

		if err != nil {

			http.Error(
				w,
				"Failed to clear follow requests",
				http.StatusInternalServerError,
			)

			return
		}
	}

	json.NewEncoder(
		w,
	).Encode(
		map[string]string{
			"message": "Settings updated",
		},
	)
}

func GetMessageStatus(
	w http.ResponseWriter,
	r *http.Request,
) {

	idParam :=
		chi.URLParam(
			r,
			"id",
		)

	userID, err :=
		strconv.Atoi(
			idParam,
		)

	if err != nil {

		http.Error(
			w,
			"Invalid user ID",
			http.StatusBadRequest,
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
		userID,
	).Scan(
		&allowMessages,
	)

	if err != nil {

		http.Error(
			w,
			"Settings not found",
			http.StatusNotFound,
		)

		return
	}

	json.NewEncoder(w).Encode(
		map[string]bool{
			"allow_messages": allowMessages,
		},
	)
}

func GetOnlineStatus(
	w http.ResponseWriter,
	r *http.Request,
) {

	idParam :=
		chi.URLParam(
			r,
			"id",
		)

	userID, _ :=
		strconv.Atoi(
			idParam,
		)

	var showOnline bool

	err :=
		database.DB.QueryRow(
			`
        SELECT show_online_status
        FROM user_settings
        WHERE user_id = $1
        `,
			userID,
		).Scan(
			&showOnline,
		)

	if err != nil {

		showOnline = true

	}

	if !showOnline {

		json.NewEncoder(
			w,
		).Encode(
			map[string]bool{
				"online": false,
			},
		)

		return

	}

	websocket.WSHub.Mutex.RLock()

	_, online :=
		websocket.WSHub.Clients[userID]

	websocket.WSHub.Mutex.RUnlock()

	json.NewEncoder(
		w,
	).Encode(
		map[string]bool{
			"online": online,
		},
	)

}

func ChangePassword(
	w http.ResponseWriter,
	r *http.Request,
) {

	userID :=
		r.Context().
			Value("userID").(int)

	var body struct {
		CurrentPassword string `json:"currentPassword"`
		NewPassword     string `json:"newPassword"`
	}

	err :=
		json.NewDecoder(
			r.Body,
		).Decode(&body)

	if len(body.NewPassword) < 6 {

		http.Error(
			w,
			"Password must be at least 6 characters",
			http.StatusBadRequest,
		)

		return
	}

	if err != nil {

		http.Error(
			w,
			"Invalid request",
			http.StatusBadRequest,
		)

		return
	}

	var hashedPassword string

	err = database.DB.QueryRow(
		`
        SELECT password
        FROM users
        WHERE id = $1
        `,
		userID,
	).Scan(
		&hashedPassword,
	)

	if err != nil {

		http.Error(
			w,
			"User not found",
			http.StatusNotFound,
		)

		return
	}

	err = bcrypt.CompareHashAndPassword(
		[]byte(hashedPassword),
		[]byte(body.CurrentPassword),
	)

	if err != nil {

		http.Error(
			w,
			"Current password is incorrect",
			http.StatusUnauthorized,
		)

		return
	}

	newHashedPassword,
		err := bcrypt.GenerateFromPassword(
		[]byte(body.NewPassword),
		bcrypt.DefaultCost,
	)

	if err != nil {

		http.Error(
			w,
			"Failed to hash password",
			http.StatusInternalServerError,
		)

		return
	}

	_, err =
		database.DB.Exec(
			`
            UPDATE users
            SET password = $1
            WHERE id = $2
            `,
			string(newHashedPassword),
			userID,
		)

	if err != nil {

		http.Error(
			w,
			"Update failed",
			http.StatusInternalServerError,
		)

		return
	}

	json.NewEncoder(
		w,
	).Encode(
		map[string]string{
			"message": "Password updated successfully",
		},
	)

}

func GetUserActivity(
	w http.ResponseWriter,
	r *http.Request,
) {

	userID :=
		r.Context().
			Value("userID").(int)

	var posts int
	var comments int
	var followers int
	var following int
	var likesReceived int
	var createdAt string

	database.DB.QueryRow(
		`
		SELECT COUNT(*)
		FROM posts
		WHERE user_id = $1
		`,
		userID,
	).Scan(&posts)

	database.DB.QueryRow(
		`
		SELECT COUNT(*)
		FROM comments
		WHERE user_id = $1
		`,
		userID,
	).Scan(&comments)

	database.DB.QueryRow(
		`
		SELECT COUNT(*)
		FROM follows
		WHERE following_id = $1
		`,
		userID,
	).Scan(&followers)

	database.DB.QueryRow(
		`
		SELECT COUNT(*)
		FROM follows
		WHERE follower_id = $1
		`,
		userID,
	).Scan(&following)

	database.DB.QueryRow(
		`
		SELECT COUNT(*)
		FROM likes l
		JOIN posts p
		ON l.post_id = p.id
		WHERE p.user_id = $1
		`,
		userID,
	).Scan(&likesReceived)

	database.DB.QueryRow(
		`
		SELECT created_at
		FROM users
		WHERE id = $1
		`,
		userID,
	).Scan(&createdAt)

	json.NewEncoder(w).Encode(
		map[string]interface{}{
			"posts":         posts,
			"comments":      comments,
			"followers":     followers,
			"following":     following,
			"likesReceived": likesReceived,
			"createdAt":     createdAt,
		},
	)
}

func DeleteAccount(
	w http.ResponseWriter,
	r *http.Request,
) {

	userID :=
		r.Context().
			Value(
				"userID",
			).(int)

	_, err :=
		database.DB.Exec(
			`
            DELETE FROM users
            WHERE id = $1
            `,
			userID,
		)

	if err != nil {

		http.Error(
			w,
			"Failed to delete account",
			http.StatusInternalServerError,
		)

		return

	}

	json.NewEncoder(
		w,
	).Encode(
		map[string]string{
			"message": "Account deleted successfully",
		},
	)

}

func IsPrivateAccount(
	userID int,
) bool {

	var isPrivate bool

	err := database.DB.QueryRow(
		`
		SELECT private_account
		FROM user_settings
		WHERE user_id = $1
		`,
		userID,
	).Scan(
		&isPrivate,
	)

	if err != nil {
		return false
	}

	return isPrivate
}

func GetFollowRequestStatus(
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

	var requested bool

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
		&requested,
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
			"requested": requested,
		},
	)
}

func CancelFollowRequest(
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

	result, err :=
		database.DB.Exec(
			`
			DELETE FROM follow_requests
			WHERE requester_id=$1
			AND target_user_id=$2
			`,
			currentUserID,
			targetUserID,
		)

	if err != nil {

		http.Error(
			w,
			"Could not cancel request",
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
			"message": "Follow request cancelled",
		},
	)
}
