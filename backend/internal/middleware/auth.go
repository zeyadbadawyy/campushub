package middleware

import (
	"context"
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

func Auth(next http.Handler) http.Handler {

	return http.HandlerFunc(func(
		w http.ResponseWriter,
		r *http.Request,
	) {

		authHeader := r.Header.Get("Authorization")

		if authHeader == "" {
			http.Error(
				w,
				"Missing token",
				http.StatusUnauthorized,
			)
			return
		}

		tokenString := strings.TrimPrefix(
			authHeader,
			"Bearer ",
		)

		token, err := jwt.Parse(
			tokenString,
			func(token *jwt.Token) (interface{}, error) {
				return []byte(os.Getenv("JWT_SECRET")), nil
			},
		)

		if err != nil || !token.Valid {
			http.Error(
				w,
				"Invalid token",
				http.StatusUnauthorized,
			)
			return
		}

		claims := token.Claims.(jwt.MapClaims)

		userID := int(
			claims["user_id"].(float64),
		)

		ctx := context.WithValue(
			r.Context(),
			"userID",
			userID,
		)

		next.ServeHTTP(
			w,
			r.WithContext(ctx),
		)
	})
}
