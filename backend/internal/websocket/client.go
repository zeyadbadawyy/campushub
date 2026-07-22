package websocket

import (
	"github.com/gorilla/websocket"
)

type Client struct {
	UserID int
	Conn   *websocket.Conn
}
