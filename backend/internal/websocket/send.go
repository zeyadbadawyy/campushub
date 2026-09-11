package websocket

import (
	"encoding/json"

	gorilla "github.com/gorilla/websocket"
)

func SendToUser(
	userID int,
	data interface{},
) {

	message, err :=
		json.Marshal(data)

	if err != nil {
		return
	}

	WSHub.Mutex.RLock()

	client, exists :=
		WSHub.Clients[userID]

	WSHub.Mutex.RUnlock()

	if !exists {
		return
	}

	_ = client.WriteMessage(
		gorilla.TextMessage,
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
