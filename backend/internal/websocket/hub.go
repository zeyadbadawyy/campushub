package websocket

type Hub struct {
	Clients map[int]*Client
}

var WSHub = &Hub{
	Clients: make(map[int]*Client),
}
