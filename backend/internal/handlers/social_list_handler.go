package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"campushub/internal/database"
	"campushub/internal/utils"

	"github.com/go-chi/chi/v5"
)

type SocialListUser struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	AvatarURL string `json:"avatar_url"`
}

func writeSocialList(w http.ResponseWriter, users []SocialListUser) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(users)
}

func GetPostLikes(w http.ResponseWriter, r *http.Request) {
	postID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "Invalid post ID", http.StatusBadRequest)
		return
	}

	viewerID := r.Context().Value("userID").(int)

	var ownerID int
	err = database.DB.QueryRow(
		`SELECT user_id FROM posts WHERE id=$1`,
		postID,
	).Scan(&ownerID)
	if err != nil {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	canView, err := utils.CanViewUser(viewerID, ownerID)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	if !canView {
		http.Error(w, "You cannot view this post", http.StatusForbidden)
		return
	}

	rows, err := database.DB.Query(
		`
        SELECT u.id, u.name, u.avatar_url
        FROM likes l
        JOIN users u ON u.id = l.user_id
        WHERE l.post_id=$1
        ORDER BY l.id DESC
        `,
		postID,
	)
	if err != nil {
		http.Error(w, "Could not fetch likes", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	users := []SocialListUser{}
	for rows.Next() {
		var user SocialListUser
		if err := rows.Scan(&user.ID, &user.Name, &user.AvatarURL); err != nil {
			http.Error(w, "Could not read likes", http.StatusInternalServerError)
			return
		}
		users = append(users, user)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "Could not read likes", http.StatusInternalServerError)
		return
	}

	writeSocialList(w, users)
}

func GetStoryViewers(w http.ResponseWriter, r *http.Request) {
	storyID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "Invalid story ID", http.StatusBadRequest)
		return
	}

	viewerID := r.Context().Value("userID").(int)

	var ownerID int
	err = database.DB.QueryRow(
		`SELECT user_id FROM stories WHERE id=$1`,
		storyID,
	).Scan(&ownerID)
	if err != nil {
		http.Error(w, "Story not found", http.StatusNotFound)
		return
	}

	if ownerID != viewerID {
		http.Error(w, "Only the story owner can view story viewers", http.StatusForbidden)
		return
	}

	rows, err := database.DB.Query(
		`
        SELECT u.id, u.name, u.avatar_url
        FROM story_views sv
        JOIN users u ON u.id = sv.user_id
        WHERE sv.story_id=$1
          AND sv.user_id <> $2
        ORDER BY u.name ASC
        `,
		storyID,
		ownerID,
	)
	if err != nil {
		http.Error(w, "Could not fetch story viewers", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	users := []SocialListUser{}
	for rows.Next() {
		var user SocialListUser
		if err := rows.Scan(&user.ID, &user.Name, &user.AvatarURL); err != nil {
			http.Error(w, "Could not read story viewers", http.StatusInternalServerError)
			return
		}
		users = append(users, user)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "Could not read story viewers", http.StatusInternalServerError)
		return
	}

	writeSocialList(w, users)
}

func GetFollowers(w http.ResponseWriter, r *http.Request) {
	getFollowList(w, r, true)
}

func GetFollowing(w http.ResponseWriter, r *http.Request) {
	getFollowList(w, r, false)
}

func getFollowList(w http.ResponseWriter, r *http.Request, followers bool) {
	userID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	viewerID := r.Context().Value("userID").(int)

	canView, err := utils.CanViewUser(viewerID, userID)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	if !canView {
		http.Error(w, "You cannot view this profile's connections", http.StatusForbidden)
		return
	}

	var query string
	if followers {
		query = `
            SELECT u.id, u.name, u.avatar_url
            FROM follows f
            JOIN users u ON u.id = f.follower_id
            WHERE f.following_id=$1
            ORDER BY f.id DESC
        `
	} else {
		query = `
            SELECT u.id, u.name, u.avatar_url
            FROM follows f
            JOIN users u ON u.id = f.following_id
            WHERE f.follower_id=$1
            ORDER BY f.id DESC
        `
	}

	rows, err := database.DB.Query(query, userID)
	if err != nil {
		http.Error(w, "Could not fetch connections", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	users := []SocialListUser{}
	for rows.Next() {
		var user SocialListUser
		if err := rows.Scan(&user.ID, &user.Name, &user.AvatarURL); err != nil {
			http.Error(w, "Could not read connections", http.StatusInternalServerError)
			return
		}
		users = append(users, user)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "Could not read connections", http.StatusInternalServerError)
		return
	}

	writeSocialList(w, users)
}
