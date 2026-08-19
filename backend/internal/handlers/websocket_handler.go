package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"campushub/internal/database"
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

	websocket.WSHub.Mutex.Lock()

	websocket.WSHub.Clients[userID] =
		&websocket.Client{
			UserID: userID,
			Conn:   conn,
		}

	onlineUsers := []int{}

	for id := range websocket.WSHub.Clients {

		if id == userID {
			continue
		}

		onlineUsers = append(
			onlineUsers,
			id,
		)
	}

	conn.WriteJSON(
		map[string]interface{}{
			"type":  "online_users",
			"users": onlineUsers,
		},
	)

	websocket.WSHub.Mutex.Unlock()

	websocket.Broadcast(
		map[string]interface{}{
			"type":   "online",
			"userId": userID,
		},
	)

	defer func() {

		lastSeen := time.Now()

		_, _ = database.DB.Exec(
			`
UPDATE users
SET last_seen = $1
WHERE id = $2
`,
			lastSeen,
			userID,
		)

		websocket.WSHub.Mutex.Lock()

		delete(
			websocket.WSHub.Clients,
			userID,
		)

		websocket.WSHub.Mutex.Unlock()

		websocket.Broadcast(
			map[string]interface{}{
				"type":     "offline",
				"userId":   userID,
				"lastSeen": lastSeen,
			},
		)

		conn.Close()

	}()

	for {

		_, message, err :=
			conn.ReadMessage()

		if err != nil {
			break
		}

		var data map[string]interface{}

		err = json.Unmarshal(
			message,
			&data,
		)

		if err != nil {
			continue
		}

		if data["type"] == "typing" {

			targetIDFloat, ok :=
				data["targetUserId"].(float64)

			if !ok {
				continue
			}

			websocket.SendToUser(
				int(targetIDFloat),
				map[string]interface{}{
					"type":   "typing",
					"userId": userID,
				},
			)

		}
	}
}
