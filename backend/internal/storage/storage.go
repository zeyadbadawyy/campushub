package storage

import (
	"os"

	supabase "github.com/supabase-community/supabase-go"
)

var Client *supabase.Client

func InitStorage() {

	client, err := supabase.NewClient(
		os.Getenv("SUPABASE_URL"),
		os.Getenv("SUPABASE_SERVICE_KEY"),
		nil,
	)

	if err != nil {
		panic(err)
	}

	Client = client
}
