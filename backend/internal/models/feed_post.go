package models

type FeedPost struct {
	ID        int    `json:"id"`
	Author    string `json:"author"`
	Faculty   string `json:"faculty"`
	Content   string `json:"content"`
	CreatedAt string `json:"created_at"`
}
