package handlers

import (
	"net/http"
	"strconv"

	"campushub/internal/websocket"

	gorilla "github.com/gorilla/websocket"
)

var upgrader = gorilla.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func WebSocketHandler(
	w http.ResponseWriter,
	r *http.Request,
) {

	userIDParam :=
		r.URL.Query().Get("userId")

	userID, _ :=
		strconv.Atoi(userIDParam)

	conn, err :=
		upgrader.Upgrade(
			w,
			r,
			nil,
		)

	if err != nil {
		return
	}

	websocket.WSHub.Clients[userID] =
		&websocket.Client{
			UserID: userID,
			Conn:   conn,
		}

	websocket.Broadcast(
		map[string]interface{}{
			"type":   "online",
			"userId": userID,
		},
	)

	defer func() {

		delete(
			websocket.WSHub.Clients,
			userID,
		)
		websocket.Broadcast(
			map[string]interface{}{
				"type":   "offline",
				"userId": userID,
			},
		)

		conn.Close()

	}()

	for {

		_, _, err :=
			conn.ReadMessage()

		if err != nil {
			break
		}

	}
}
