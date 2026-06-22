package handlers

import (
	"encoding/json"
	"net/http"

	"campushub/internal/database"
	"campushub/internal/models"
	"campushub/internal/utils"

	"golang.org/x/crypto/bcrypt"
)

func Register(
	w http.ResponseWriter,
	r *http.Request,
) {

	var user models.User

	err := json.NewDecoder(
		r.Body,
	).Decode(&user)

	if err != nil {

		http.Error(
			w,
			"Invalid JSON",
			http.StatusBadRequest,
		)

		return
	}

	if user.Password == "" {

		http.Error(
			w,
			"Password is required",
			http.StatusBadRequest,
		)

		return
	}

	if len(user.Password) < 6 {

		http.Error(
			w,
			"Password must be at least 6 characters",
			http.StatusBadRequest,
		)

		return
	}

	hashedPassword, err :=
		bcrypt.GenerateFromPassword(
			[]byte(user.Password),
			bcrypt.DefaultCost,
		)

	if err != nil {

		http.Error(
			w,
			"Could not hash password",
			http.StatusInternalServerError,
		)

		return
	}

	_, err = database.DB.Exec(
		`
		INSERT INTO users
		(name,email,password,bio,faculty)
		VALUES ($1,$2,$3,$4,$5)
		`,
		user.Name,
		user.Email,
		string(hashedPassword),
		user.Bio,
		user.Faculty,
	)

	if err != nil {

		http.Error(
			w,
			err.Error(),
			http.StatusInternalServerError,
		)

		return
	}

	w.WriteHeader(
		http.StatusCreated,
	)

	w.Write(
		[]byte(
			"User Registered",
		),
	)
}

func Login(
	w http.ResponseWriter,
	r *http.Request,
) {

	var credentials struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	err := json.NewDecoder(
		r.Body,
	).Decode(
		&credentials,
	)

	if err != nil {

		http.Error(
			w,
			"Invalid JSON",
			http.StatusBadRequest,
		)

		return
	}

	var user models.User

	err = database.DB.QueryRow(
		`
		SELECT
		id,
		name,
		email,
		password,
		bio,
		faculty
		FROM users
		WHERE email=$1
		`,
		credentials.Email,
	).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.Password,
		&user.Bio,
		&user.Faculty,
	)

	if err != nil {

		http.Error(
			w,
			"Invalid credentials",
			http.StatusUnauthorized,
		)

		return
	}

	err = bcrypt.CompareHashAndPassword(
		[]byte(user.Password),
		[]byte(credentials.Password),
	)

	if err != nil {
		http.Error(
			w,
			"Invalid credentials",
			http.StatusUnauthorized,
		)

		return
	}

	token, err :=
		utils.GenerateToken(
			user.ID,
			user.Email,
		)

	if err != nil {

		http.Error(
			w,
			"Could not generate token",
			http.StatusInternalServerError,
		)

		return
	}

	json.NewEncoder(
		w,
	).Encode(
		map[string]string{
			"token": token,
		},
	)
}
