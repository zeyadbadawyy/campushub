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

	userID, err :=
		strconv.Atoi(userIDParam)

	if err != nil || userID <= 0 {
		http.Error(
			w,
			"Invalid user ID",
			http.StatusBadRequest,
		)
		return
	}

	conn, err :=
		upgrader.Upgrade(
			w,
			r,
			nil,
		)

	if err != nil {
		return
	}

	client :=
		&websocket.Client{
			UserID: userID,
			Conn:   conn,
		}

	websocket.WSHub.Mutex.Lock()

	previousClient :=
		websocket.WSHub.Clients[userID]

	websocket.WSHub.Clients[userID] =
		client

	onlineUsers :=
		make([]int, 0)

	for id := range websocket.WSHub.Clients {

		if id == userID {
			continue
		}

		onlineUsers =
			append(
				onlineUsers,
				id,
			)
	}

	websocket.WSHub.Mutex.Unlock()

	if previousClient != nil &&
		previousClient.Conn != conn {
		_ = previousClient.Conn.Close()
	}

	_ = client.WriteJSON(
		map[string]interface{}{
			"type":  "online_users",
			"users": onlineUsers,
		},
	)

	if previousClient == nil {
		websocket.Broadcast(
			map[string]interface{}{
				"type":   "online",
				"userId": userID,
			},
		)
	}

	defer func() {

		lastSeen :=
			time.Now()

		_, _ = database.DB.Exec(
			`
UPDATE users
SET last_seen = $1
WHERE id = $2
`,
			lastSeen,
			userID,
		)

		shouldBroadcastOffline :=
			false

		websocket.WSHub.Mutex.Lock()

		currentClient :=
			websocket.WSHub.Clients[userID]

		if currentClient == client {

			delete(
				websocket.WSHub.Clients,
				userID,
			)

			shouldBroadcastOffline =
				true
		}

		websocket.WSHub.Mutex.Unlock()

		if shouldBroadcastOffline {

			websocket.Broadcast(
				map[string]interface{}{
					"type":     "offline",
					"userId":   userID,
					"lastSeen": lastSeen,
				},
			)
		}

		_ = conn.Close()

	}()

	for {

		_, message, err :=
			conn.ReadMessage()

		if err != nil {
			break
		}

		var data map[string]interface{}

		err =
			json.Unmarshal(
				message,
				&data,
			)

		if err != nil {
			continue
		}

		if data["type"] ==
			"typing" {

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
