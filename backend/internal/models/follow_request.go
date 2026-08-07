package models

type FollowRequest struct {
	RequesterID int    `json:"requester_id"`
	Name        string `json:"name"`
	CreatedAt   string `json:"created_at"`
}
