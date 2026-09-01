package models

import "time"

type Conversation struct {
	UserID          int       `json:"user_id"`
	Name            string    `json:"name"`
	LastMessage     string    `json:"last_message"`
	ImageURL        string    `json:"image_url"`
	LastMessageTime time.Time `json:"last_message_time"`
	UnreadCount     int       `json:"unread_count"`
	AvatarURL       string    `json:"avatar_url"`
}
