package websocket

import (
	"sync"

	"github.com/gorilla/websocket"
)

type Client struct {
	UserID    int
	Conn      *websocket.Conn
	WriteLock sync.Mutex
}

func (c *Client) WriteMessage(
	messageType int,
	data []byte,
) error {

	c.WriteLock.Lock()
	defer c.WriteLock.Unlock()

	return c.Conn.WriteMessage(
		messageType,
		data,
	)
}

func (c *Client) WriteJSON(
	data interface{},
) error {

	c.WriteLock.Lock()
	defer c.WriteLock.Unlock()

	return c.Conn.WriteJSON(data)
}
