package websocket

import (
	"encoding/json"
)

type Hub struct {
	Clients map[int]*Client
}

var WSHub = &Hub{
	Clients: make(map[int]*Client),
}

func Broadcast(data interface{}) {

	message, _ :=
		json.Marshal(data)

	for _, client := range WSHub.Clients {

		client.Conn.WriteMessage(
			1,
			message,
		)
	}
}
