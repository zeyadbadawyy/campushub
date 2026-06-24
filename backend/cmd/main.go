// @title CampusHub API
// @version 1.0
// @description CampusHub backend server.

// @tag.name Auth
// @tag.description User authentication and registration

// @tag.name Posts
// @tag.description Campus feed and post management

// @tag.name Comments
// @tag.description Post comments

// @tag.name Likes
// @tag.description Like and unlike posts

// @tag.name Follows
// @tag.description Follow system

// @tag.name Messages
// @tag.description Direct messaging between users

// @tag.name Users
// @tag.description User profiles and search

// @tag.name Stats
// @tag.description Platform statistics

// @host localhost:8080
// @schemes http https
// @BasePath /
package main

import (
	"fmt"
	"net/http"
	"os"

	_ "campushub/docs"
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

	port := os.Getenv("PORT")

	if port == "" {
		port = "8080"
	}

	http.ListenAndServe(
		":"+port,
		routes.RegisterRoutes(),
	)

}
