package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"campushub/internal/database"
	"campushub/internal/models"

	"github.com/go-chi/chi/v5"
)

type UserResponse struct {
	ID      int    `json:"id"`
	Name    string `json:"name"`
	Email   string `json:"email"`
	Bio     string `json:"bio"`
	Faculty string `json:"faculty"`
}

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
		ID      int    `json:"id"`
		Name    string `json:"name"`
		Email   string `json:"email"`
		Bio     string `json:"bio"`
		Faculty string `json:"faculty"`
	}

	var user UserProfile

	err = database.DB.QueryRow(
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
		id,
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

	json.NewEncoder(
		w,
	).Encode(
		user,
	)
}
