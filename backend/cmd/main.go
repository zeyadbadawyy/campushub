package main

import (
	"fmt"
	"net/http"

	"campushub/internal/database"
	"campushub/internal/routes"

	"github.com/joho/godotenv"
)

func main() {

	godotenv.Load()
	err := database.Connect()

	if err != nil {
		panic(err)
	}
	fmt.Println(
		"Database Connected",
	)

	fmt.Println(
		"CampusHub API Running",
	)

	http.ListenAndServe(
		":8080",
		routes.RegisterRoutes(),
	)
}
