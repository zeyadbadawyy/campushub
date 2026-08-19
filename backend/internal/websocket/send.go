package websocket

import (
	"encoding/json"
)

func SendToUser(
	userID int,
	data interface{},
) {

	message, _ :=
		json.Marshal(data)

	WSHub.Mutex.RLock()

	client, exists :=
		WSHub.Clients[userID]

	WSHub.Mutex.RUnlock()

	if !exists {
		return
	}

	client.Conn.WriteMessage(
		1,
		message,
	)
}

func SendNotification(
	userID int,
	data interface{},
) {
	SendToUser(
		userID,
		data,
	)
}
