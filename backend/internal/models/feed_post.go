package models

import "time"

type FeedPost struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	Author    string    `json:"author"`
	Faculty   string    `json:"faculty"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
	Likes     int       `json:"likes"`
	Comments  int       `json:"comments"`
	LikedByMe bool      `json:"liked_by_me"`
}
