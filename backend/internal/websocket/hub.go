package websocket

import (
	"encoding/json"
	"sync"

	gorilla "github.com/gorilla/websocket"
)

type Hub struct {
	Clients map[int]*Client
	Mutex   sync.RWMutex
}

var WSHub = &Hub{
	Clients: make(map[int]*Client),
}

func Broadcast(data interface{}) {

	message, err :=
		json.Marshal(data)

	if err != nil {
		return
	}

	WSHub.Mutex.RLock()
	clients := make([]*Client, 0, len(WSHub.Clients))

	for _, client := range WSHub.Clients {
		clients = append(
			clients,
			client,
		)
	}

	WSHub.Mutex.RUnlock()

	for _, client := range clients {
		_ = client.WriteMessage(
			gorilla.TextMessage,
			message,
		)
	}
}
