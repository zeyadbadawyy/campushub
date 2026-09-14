package models

import "time"

type Comment struct {
	ID         int       `json:"id"`
	PostID     int       `json:"post_id"`
	UserID     int       `json:"user_id"`
	Content    string    `json:"content"`
	GIFURL     string    `json:"gif_url"`
	MentionIDs []int     `json:"mention_ids,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}
