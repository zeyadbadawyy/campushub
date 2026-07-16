package models

import "time"

type Conversation struct {
	UserID          int       `json:"user_id"`
	Name            string    `json:"name"`
	LastMessage     string    `json:"last_message"`
	LastMessageTime time.Time `json:"last_message_time"`
	UnreadCount     int       `json:"unread_count"`
}
