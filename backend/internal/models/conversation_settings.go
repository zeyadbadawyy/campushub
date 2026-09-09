package models

import "time"

type ConversationSettings struct {
	ID          int       `json:"id"`
	UserID      int       `json:"user_id"`
	OtherUserID int       `json:"other_user_id"`
	Muted       bool      `json:"muted"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
