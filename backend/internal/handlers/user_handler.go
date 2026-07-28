package handlers

import (
	"campushub/internal/database"
	"campushub/internal/models"
	"campushub/internal/websocket"

	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
)

type UserResponse struct {
	ID      int    `json:"id"`
	Name    string `json:"name"`
	Email   string `json:"email"`
	Bio     string `json:"bio"`
	Faculty string `json:"faculty"`
}

// Me godoc
//
//	@Summary		Get current user
//	@Description	Get the authenticated user's profile
//	@Tags			Users
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200
//	@Failure		401
//	@Router			/me [get]
func Me(
	w http.ResponseWriter,
	r *http.Request,
) {

	userID :=
		r.Context().
			Value(
				"userID",
			).(int)

	var user models.User

	err :=
		database.DB.QueryRow(
			`
			SELECT
			id,
			name,
			email,
			bio,
			faculty
			FROM users
			WHERE id=$1
			`,
			userID,
		).Scan(
			&user.ID,
			&user.Name,
			&user.Email,
			&user.Bio,
			&user.Faculty,
		)

	if err != nil {

		http.Error(
			w,
			"User not found",
			http.StatusNotFound,
		)

		return
	}
	response := UserResponse{
		ID:      user.ID,
		Name:    user.Name,
		Email:   user.Email,
		Bio:     user.Bio,
		Faculty: user.Faculty,
	}

	json.NewEncoder(w).Encode(response)
}

// GetUserProfile godoc
//
//	@Summary		Get user profile
//	@Description	Get a user's public profile by ID
//	@Tags			Users
//	@Produce		json
//	@Param			id	path	int	true	"User ID"
//	@Success		200
//	@Failure		404
//	@Router			/users/{id} [get]
func GetUserProfile(
	w http.ResponseWriter,
	r *http.Request,
) {

	idParam := chi.URLParam(
		r,
		"id",
	)

	id, err := strconv.Atoi(
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

	type UserProfile struct {
		ID        int       `json:"id"`
		Name      string    `json:"name"`
		Email     string    `json:"email"`
		Bio       string    `json:"bio"`
		Faculty   string    `json:"faculty"`
		LastSeen  time.Time `json:"last_seen"`
		CreatedAt time.Time `json:"created_at"`
	}

	var user UserProfile

	err = database.DB.QueryRow(
		`
		SELECT
		id,
		name,
		email,
		bio,
		faculty,
		last_seen,
		created_at
		FROM users
		WHERE id=$1
		`,
		id,
	).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.Bio,
		&user.Faculty,
		&user.LastSeen,
		&user.CreatedAt,
	)

	if err != nil {

		http.Error(
			w,
			"User not found",
			http.StatusNotFound,
		)

		return
	}

	json.NewEncoder(
		w,
	).Encode(
		user,
	)
}

// SearchUsers godoc
//
//	@Summary		Search users
//	@Description	Search users by name or email
//	@Tags			Users
//	@Produce		json
//	@Param			q	query	string	true	"Search term"
//	@Success		200
//	@Router			/users/search [get]
func SearchUsers(
	w http.ResponseWriter,
	r *http.Request,
) {

	query :=
		r.URL.Query().Get(
			"q",
		)

	if query == "" {

		json.NewEncoder(
			w,
		).Encode(
			[]map[string]interface{}{},
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
			name,
			faculty
		FROM users
		WHERE id != $1
		AND LOWER(name)
		LIKE LOWER($2)
		`,
		currentUserID,
		"%"+query+"%",
	)

	if err != nil {

		http.Error(
			w,
			"Search failed",
			http.StatusInternalServerError,
		)

		return
	}

	defer rows.Close()

	users := []map[string]interface{}{}

	for rows.Next() {

		var id int
		var name string
		var faculty string

		rows.Scan(
			&id,
			&name,
			&faculty,
		)

		users =
			append(
				users,
				map[string]interface{}{
					"id":      id,
					"name":    name,
					"faculty": faculty,
				},
			)
	}

	json.NewEncoder(
		w,
	).Encode(
		users,
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

	_, online :=
		websocket.WSHub.Clients[userID]

	json.NewEncoder(
		w,
	).Encode(
		map[string]bool{
			"online": online,
		},
	)

}
