package models

import "time"

type FeedPost struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	Author    string    `json:"author"`
	Faculty   string    `json:"faculty"`
	AvatarURL string    `json:"avatar_url"`
	Content   string    `json:"content"`
	ImageURL  string    `json:"image_url"`
	CreatedAt time.Time `json:"created_at"`
	Likes     int       `json:"likes"`
	Comments  int       `json:"comments"`
	LikedByMe bool      `json:"liked_by_me"`
}
