package models

import "time"

type Comment struct {
	ID        int       `json:"id"`
	PostID    int       `json:"post_id"`
	UserID    int       `json:"user_id"`
	Content   string    `json:"content"`
	GIFURL    string    `json:"gif_url"`
	CreatedAt time.Time `json:"created_at"`
}
