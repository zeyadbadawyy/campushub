package routes

import (
	"campushub/internal/handlers"
	"campushub/internal/middleware"
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

	r.With(
		middleware.Auth,
	).Get(
		"/me",
		handlers.Me,
	)

	r.With(
		middleware.Auth,
	).Post(
		"/posts",
		handlers.CreatePost,
	)

	r.Get(
		"/posts",
		handlers.GetPosts,
	)

	r.Get(
		"/users/search",
		handlers.SearchUsers,
	)

	r.Get(
		"/users/{id}",
		handlers.GetUserProfile,
	)

	r.Get(
		"/users/{id}/posts",
		handlers.GetUserPosts,
	)

	r.With(
		middleware.Auth,
	).Delete(
		"/posts/{id}",
		handlers.DeletePost,
	)

	r.With(
		middleware.Auth,
	).Put(
		"/posts/{id}",
		handlers.UpdatePost,
	)

	r.With(
		middleware.Auth,
	).Post(
		"/posts/{id}/comments",
		handlers.CreateComment,
	)

	r.Get(
		"/posts/{id}/comments",
		handlers.GetComments,
	)

	r.With(
		middleware.Auth,
	).Delete(
		"/comments/{id}",
		handlers.DeleteComment,
	)

	r.With(
		middleware.Auth,
	).Post(
		"/posts/{id}/like",
		handlers.ToggleLike,
	)

	r.Get(
		"/stats",
		handlers.GetStats,
	)

	r.With(
		middleware.Auth,
	).Post(
		"/users/{id}/follow",
		handlers.ToggleFollow,
	)

	r.Get(
		"/users/{id}/follow-stats",
		handlers.GetFollowStats,
	)

	r.With(
		middleware.Auth,
	).Post(
		"/messages/{id}",
		handlers.SendMessage,
	)

	r.With(
		middleware.Auth,
	).Get(
		"/messages/{id}",
		handlers.GetConversation,
	)

	r.With(
		middleware.Auth,
	).Get(
		"/conversations",
		handlers.GetConversations,
	)

	return r
}
