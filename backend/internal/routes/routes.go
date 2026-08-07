package routes

import (
	"campushub/internal/handlers"
	"campushub/internal/middleware"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	httpSwagger "github.com/swaggo/http-swagger"
)

func RegisterRoutes() http.Handler {

	r := chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{
			"http://localhost:5173",
		},

		AllowedMethods: []string{
			"GET",
			"POST",
			"PUT",
			"DELETE",
			"OPTIONS",
		},

		AllowedHeaders: []string{
			"Accept",
			"Authorization",
			"Content-Type",
			"X-CSRF-Token",
		},

		ExposedHeaders: []string{
			"Link",
		},

		AllowCredentials: true,

		MaxAge: 300,
	}))

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("CampusHub API"))
	})

	r.Get(
		"/health",
		handlers.HealthCheck,
	)

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
	).Put(
		"/change-password",
		handlers.ChangePassword,
	)

	r.With(
		middleware.Auth,
	).Get(
		"/me",
		handlers.Me,
	)

	r.With(
		middleware.Auth,
	).Put(
		"/me",
		handlers.UpdateProfile,
	)

	r.With(
		middleware.Auth,
	).Post(
		"/posts",
		handlers.CreatePost,
	)

	r.With(
		middleware.Auth,
	).Get(
		"/posts",
		handlers.GetPosts,
	)

	r.Get(
		"/posts/{id}",
		handlers.GetPost,
	)

	r.With(
		middleware.Auth,
	).Get(
		"/users/search",
		handlers.SearchUsers,
	)

	r.With(
		middleware.Auth,
	).Get(
		"/users/search-chats",
		handlers.SearchUsersForChats,
	)

	r.Get(
		"/users/{id}",
		handlers.GetUserProfile,
	)

	r.With(
		middleware.Auth,
	).Get(
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
	).Get(
		"/activity",
		handlers.GetUserActivity,
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
	).Get(
		"/users/{id}/follow-status",
		handlers.IsFollowing,
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

	r.With(
		middleware.Auth,
	).Get(
		"/messages/unread-count",
		handlers.GetUnreadMessagesCount,
	)

	r.With(
		middleware.Auth,
	).Post(
		"/typing/{id}",
		handlers.UpdateTypingStatus,
	)

	r.With(
		middleware.Auth,
	).Get(
		"/typing/{id}",
		handlers.GetTypingStatus,
	)

	r.Get(
		"/ws",
		handlers.WebSocketHandler,
	)

	r.With(
		middleware.Auth,
	).Get(
		"/users/{id}/message-status",
		handlers.GetMessageStatus,
	)

	r.With(
		middleware.Auth,
	).Get(
		"/users/{id}/online",
		handlers.GetOnlineStatus,
	)

	r.With(
		middleware.Auth,
	).Get(
		"/notifications",
		handlers.GetNotifications,
	)

	r.With(
		middleware.Auth,
	).Get(
		"/notifications/unread-count",
		handlers.GetUnreadNotificationsCount,
	)

	r.With(
		middleware.Auth,
	).Put(
		"/notifications/read",
		handlers.MarkNotificationsAsRead,
	)

	r.With(
		middleware.Auth,
	).Put(
		"/notifications/{id}/read",
		handlers.MarkNotificationRead,
	)

	r.With(
		middleware.Auth,
	).Get(
		"/settings",
		handlers.GetSettings,
	)

	r.With(
		middleware.Auth,
	).Put(
		"/settings",
		handlers.UpdateSettings,
	)

	r.With(
		middleware.Auth,
	).Delete(
		"/delete-account",
		handlers.DeleteAccount,
	)

	r.With(
		middleware.Auth,
	).Get(
		"/users/{id}/follow-request-status",
		handlers.GetFollowRequestStatus,
	)

	r.With(
		middleware.Auth,
	).Delete(
		"/users/{id}/follow-request",
		handlers.CancelFollowRequest,
	)

	r.With(
		middleware.Auth,
	).Get(
		"/follow-requests",
		handlers.GetFollowRequests,
	)

	r.With(
		middleware.Auth,
	).Post(
		"/follow-requests/{id}/accept",
		handlers.AcceptFollowRequest,
	)

	r.With(
		middleware.Auth,
	).Delete(
		"/follow-requests/{id}/reject",
		handlers.RejectFollowRequest,
	)

	r.With(
		middleware.Auth,
	).Get(
		"/users/{id}/visibility",
		handlers.GetUserVisibility,
	)

	r.Get(
		"/swagger/*",
		httpSwagger.Handler(
			httpSwagger.URL(
				"http://localhost:8080/swagger/doc.json",
			),
		),
	)

	return r
}
