package models

import "time"

type Notification struct {
	ID         int       `json:"id"`
	UserID     int       `json:"user_id"`
	SenderID   int       `json:"sender_id"`
	SenderName string    `json:"sender_name"`
	Type       string    `json:"type"`
	Message    string    `json:"message"`
	TargetID   int       `json:"target_id"`
	IsRead     bool      `json:"is_read"`
	CreatedAt  time.Time `json:"created_at"`
}
