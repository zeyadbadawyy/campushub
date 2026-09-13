package models

import "time"

type Story struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	Author    string    `json:"author"`
	AvatarURL string    `json:"avatar_url"`
	MediaURL  string    `json:"media_url"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
	ExpiresAt time.Time `json:"expires_at"`
	IsViewed  bool      `json:"is_viewed"`
	ViewCount int       `json:"view_count"`
	IsOwner   bool      `json:"is_owner"`

	Styling StoryStyling `json:"styling"`
}
