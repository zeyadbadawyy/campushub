package websocket

import (
	"encoding/json"
	"sync"
)

type Hub struct {
	Clients map[int]*Client
	Mutex   sync.RWMutex
}

var WSHub = &Hub{
	Clients: make(map[int]*Client),
}

func Broadcast(data interface{}) {

	message, _ :=
		json.Marshal(data)

	WSHub.Mutex.RLock()
	defer WSHub.Mutex.RUnlock()

	for _, client := range WSHub.Clients {

		client.Conn.WriteMessage(
			1,
			message,
		)
	}
}
