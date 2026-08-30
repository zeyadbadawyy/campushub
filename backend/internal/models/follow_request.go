package models

import "time"

type FollowRequest struct {
	RequesterID int       `json:"requester_id"`
	Name        string    `json:"name"`
	AvatarURL   string    `json:"avatar_url"`
	CreatedAt   time.Time `json:"created_at"`
}
