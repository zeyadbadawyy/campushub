package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"campushub/internal/database"
	"campushub/internal/models"

	"github.com/go-chi/chi/v5"
)

func GetNotifications(
	w http.ResponseWriter,
	r *http.Request,
) {

	userID :=
		r.Context().
			Value("userID").(int)

	rows, err :=
		database.DB.Query(
			`
			SELECT
				n.id,
				n.user_id,
				n.sender_id,
				u.name,
				n.type,
				n.message,
				n.is_read,
				n.created_at,
				n.target_id
			FROM notifications n
			JOIN users u
				ON n.sender_id = u.id
			WHERE n.user_id = $1
			ORDER BY n.created_at DESC
			`,
			userID,
		)

	if err != nil {

		http.Error(
			w,
			"Could not fetch notifications",
			http.StatusInternalServerError,
		)

		return
	}

	defer rows.Close()

	var notifications []models.Notification

	for rows.Next() {

		var notification models.Notification

		rows.Scan(
			&notification.ID,
			&notification.UserID,
			&notification.SenderID,
			&notification.SenderName,
			&notification.Type,
			&notification.Message,
			&notification.IsRead,
			&notification.CreatedAt,
			&notification.TargetID,
		)

		notifications =
			append(
				notifications,
				notification,
			)
	}

	json.NewEncoder(w).Encode(
		notifications,
	)
}

func GetUnreadNotificationsCount(
	w http.ResponseWriter,
	r *http.Request,
) {

	userID :=
		r.Context().
			Value("userID").(int)

	var count int

	err :=
		database.DB.QueryRow(
			`
			SELECT COUNT(*)
			FROM notifications
			WHERE user_id = $1
			AND is_read = FALSE
			`,
			userID,
		).Scan(
			&count,
		)

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

func MarkNotificationsAsRead(
	w http.ResponseWriter,
	r *http.Request,
) {

	userID :=
		r.Context().
			Value("userID").(int)

	_, err :=
		database.DB.Exec(
			`
			UPDATE notifications
			SET is_read = TRUE
			WHERE user_id = $1
			AND is_read = FALSE
			`,
			userID,
		)

	if err != nil {

		http.Error(
			w,
			"Could not update notifications",
			http.StatusInternalServerError,
		)

		return
	}

	json.NewEncoder(w).Encode(
		map[string]string{
			"message": "Notifications marked as read",
		},
	)
}

func MarkNotificationRead(
	w http.ResponseWriter,
	r *http.Request,
) {

	notificationID, err :=
		strconv.Atoi(
			chi.URLParam(
				r,
				"id",
			),
		)

	if err != nil {

		http.Error(
			w,
			"Invalid notification id",
			http.StatusBadRequest,
		)

		return
	}

	_, err =
		database.DB.Exec(
			`
			UPDATE notifications
			SET is_read = TRUE
			WHERE id = $1
			`,
			notificationID,
		)

	if err != nil {

		http.Error(
			w,
			"Could not update notification",
			http.StatusInternalServerError,
		)

		return
	}

	json.NewEncoder(w).Encode(
		map[string]string{
			"message": "Notification marked as read",
		},
	)

}
