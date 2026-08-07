package models

type UserSettings struct {
	ID int `json:"id"`

	UserID int `json:"user_id"`

	LikeNotifications    bool `json:"like_notifications"`
	CommentNotifications bool `json:"comment_notifications"`
	FollowNotifications  bool `json:"follow_notifications"`
	MessageNotifications bool `json:"message_notifications"`

	PrivateAccount   bool `json:"private_account"`
	ShowOnlineStatus bool `json:"show_online_status"`
	AllowMessages    bool `json:"allow_messages"`
	ShowInSearch     bool `json:"show_in_search"`

	DarkMode bool `json:"dark_mode"`
}
