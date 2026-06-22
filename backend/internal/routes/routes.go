package routes

import (
	"campushub/internal/handlers"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func RegisterRoutes() http.Handler {

	r := chi.NewRouter()

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("CampusHub API"))
	})

	r.Post(
		"/register",
		handlers.Register,
	)

	r.Post(
		"/login",
		handlers.Login,
	)

	return r
}
