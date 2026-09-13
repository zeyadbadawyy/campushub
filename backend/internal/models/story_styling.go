package models

type StoryStyling struct {
	ID              int     `json:"id"`
	StoryID         int     `json:"story_id"`
	TextStyle       string  `json:"text_style"`
	TextSize        int     `json:"text_size"`
	TextX           float64 `json:"text_x"`
	TextY           float64 `json:"text_y"`
	BackgroundIndex int     `json:"background_index"`
}
