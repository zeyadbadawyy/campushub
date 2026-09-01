package models

import "time"

type Post struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	Content   string    `json:"content"`
	ImageURL  string    `json:"image_url"`
	GIFURL    string    `json:"gif_url"`
	CreatedAt time.Time `json:"created_at"`
}
