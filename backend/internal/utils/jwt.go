package utils

import (
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func GenerateToken(
	userID int,
	email string,
) (string, error) {

	token := jwt.NewWithClaims(
		jwt.SigningMethodHS256,
		jwt.MapClaims{
			"user_id": userID,
			"email":   email,
			"exp": time.Now().
				Add(24 * time.Hour).
				Unix(),
		},
	)

	return token.SignedString(
		[]byte(
			os.Getenv("JWT_SECRET"),
		),
	)
}
