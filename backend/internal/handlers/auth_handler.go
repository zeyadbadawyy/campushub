package handlers

import (
	"encoding/json"
	"net/http"
	"regexp"
	"strings"

	"campushub/internal/database"
	"campushub/internal/models"
	"campushub/internal/utils"

	"github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

// Register godoc
//
// @Summary Register a new user
// @Description Create a CampusHub account
// @Tags Auth
// @Accept json
// @Produce json
// @Param user body models.User true "User Registration Data"
// @Success 201 {string} string "User Registered"
// @Failure 400 {string} string "Invalid request"
// @Router /register [post]
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

	user.Name = strings.TrimSpace(user.Name)
	user.Email = strings.ToLower(
		strings.TrimSpace(user.Email),
	)

	if user.Name == "" {
		http.Error(
			w,
			"Name is required",
			http.StatusBadRequest,
		)
		return
	}

	if user.Email == "" {
		http.Error(
			w,
			"Email is required",
			http.StatusBadRequest,
		)
		return
	}

	emailPattern :=
		`^[^\s@]+@[^\s@]+\.[^\s@]+$`

	matched, err :=
		regexp.MatchString(
			emailPattern,
			user.Email,
		)

	if err != nil || !matched {
		http.Error(
			w,
			"Please enter a valid email address",
			http.StatusBadRequest,
		)
		return
	}

	if len(user.Password) == 0 {
		http.Error(
			w,
			"Password is required",
			http.StatusBadRequest,
		)
		return
	}

	if len(user.Password) <= 6 {
		http.Error(
			w,
			"Password must be more than 6 characters",
			http.StatusBadRequest,
		)
		return
	}

	var existingUserID int

	err = database.DB.QueryRow(
		`
	SELECT id
	FROM users
	WHERE LOWER(email) = LOWER($1)
	LIMIT 1
	`,
		user.Email,
	).Scan(&existingUserID)

	if err == nil {
		http.Error(
			w,
			"An account with this email already exists",
			http.StatusConflict,
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

	var userID int

	err = database.DB.QueryRow(
		`
		INSERT INTO users
		(name, email, password, bio, faculty)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id
		`,
		user.Name,
		user.Email,
		string(hashedPassword),
		strings.TrimSpace(user.Bio),
		strings.TrimSpace(user.Faculty),
	).Scan(&userID)

	if err != nil {

		if pgErr, ok := err.(*pq.Error); ok &&
			pgErr.Code == "23505" {

			http.Error(
				w,
				"An account with this email already exists",
				http.StatusConflict,
			)

			return
		}

		http.Error(
			w,
			"Could not create account",
			http.StatusInternalServerError,
		)

		return
	}

	_, err = database.DB.Exec(
		`
		INSERT INTO user_settings (user_id)
		VALUES ($1)
		`,
		userID,
	)

	if err != nil {
		http.Error(
			w,
			"Could not initialize account settings",
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

// Login godoc
//
// @Summary User Login
// @Description Authenticate user and return JWT token
// @Tags Auth
// @Accept json
// @Produce json
// @Param credentials body models.User true "Login Credentials"
// @Success 200 {object} map[string]string
// @Failure 401 {string} string
// @Router /login [post]
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
