package handlers

import (
	"encoding/json"
	"net/http"

	"campushub/internal/database"
)

// GetStats godoc
//
//	@Summary		Get platform statistics
//	@Description	Return total users, posts, comments and likes
//	@Tags			Stats
//	@Produce		json
//	@Success		200
//	@Router			/stats [get]
func GetStats(
	w http.ResponseWriter,
	r *http.Request,
) {

	var users int
	var posts int
	var comments int
	var likes int

	database.DB.QueryRow(
		"SELECT COUNT(*) FROM users",
	).Scan(&users)

	database.DB.QueryRow(
		"SELECT COUNT(*) FROM posts",
	).Scan(&posts)

	database.DB.QueryRow(
		"SELECT COUNT(*) FROM comments",
	).Scan(&comments)

	database.DB.QueryRow(
		"SELECT COUNT(*) FROM likes",
	).Scan(&likes)

	json.NewEncoder(
		w,
	).Encode(
		map[string]int{
			"users":    users,
			"posts":    posts,
			"comments": comments,
			"likes":    likes,
		},
	)
}
